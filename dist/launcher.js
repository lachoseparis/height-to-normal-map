import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import { Command } from 'commander';
import { mkdtemp, mkdir, readdir, lstat, readFile } from 'fs/promises';
import path, { dirname } from 'path';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';
import copy from 'recursive-copy';
import rimraf from 'rimraf';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
var sizeOf = promisify(require('image-size'));
const { forEach } = require('p-iteration');
const baseFolder = '/sources';

// Store the temporary directory path for this run
let tempDirPath = null;
let exportsDirPath = null;

const initializeTempDirectory = async () => {
  tempDirPath = await mkdtemp(path.join(os.tmpdir(), 'height-to-normal-'));
  exportsDirPath = path.join(tempDirPath, 'exports');
  await mkdir(exportsDirPath, { recursive: true });
  return tempDirPath;
};

const parseTempFolder = async () => {
  if (!tempDirPath) {
    throw new Error('Temp directory not initialized. Call initializeTempDirectory() first.');
  }
  const lImages = parseFolder(tempDirPath);
  return lImages;
};

const parseFolder = async (folder, oImages = []) => {
  try {
    const elements = await readdir(folder);
    await forEach(elements, async (element) => {
      const filePath = folder + '/' + element;
      const relativePath = filePath.replace(tempDirPath, '');
      const exportPath = path.join(exportsDirPath, relativePath);

      const fileName = element.split('.')[0];
      const stat = await lstat(filePath);
      if (stat.isDirectory()) {
        // parse folder
        await parseFolder(folder + '/' + element, oImages);
      } else if (stat.isFile()) {
        const ext = element.split('.')[1]?.toLowerCase();
        if ('.png,.jpg,.svg,.webp'.indexOf(ext) > -1) {
          try {
            const dimensions = await sizeOf(filePath);
            const fileId = folder + '/' + fileName;
            const id = fileId.replace(baseFolder, '').replace('/', '').replace(/\//g, '-');

            // Create a URL path for the HTTP server
            const relativePath = filePath.replace(tempDirPath, '').replace(/\\/g, '/');
            const srcUrl = `/temp-files${relativePath}`;

            oImages.push({
              ...oImages[id],
              ...dimensions,
              exportPath,
              filePath,
              src: srcUrl,
            });
            // console.info('dim', id, oImages[id]);
          } catch (e) {
            console.info('not an image', e, folder + '/' + element);
          }
        }
      }
    });

    return oImages;
  } catch (e) {
    console.error(e);
  }
};

const createFolderFromPathFile = async (filePath) => {
  const path = filePath.split('/').slice(0, -1).join('/');
  const isPath = await fsExists(path);
  if (!isPath) {
    await mkdir(path, { recursive: true });
  }
};

const deleteTempFolder = () => {
  try {
    if (tempDirPath) {
      rimraf.sync(tempDirPath);
      tempDirPath = null;
      exportsDirPath = null;
    }
  } catch (error) {
    console.error('Delete temp folder failed: ' + error);
  }
};

const copySourcesToTemp = async (sources) => {
  if (!tempDirPath) {
    throw new Error('Temp directory not initialized. Call initializeTempDirectory() first.');
  }
  const sourcePath = path.resolve(process.cwd(), sources);
  try {
    await copy(sourcePath, tempDirPath);
  } catch (error) {
    console.error('Copy failed: ' + error);
    throw error;
  }
};

const copyToFinalFolder = async (dest) => {
  if (!exportsDirPath) {
    throw new Error('Exports directory not initialized.');
  }

  const pathDest = path.resolve(process.cwd(), dest);

  // Check if exports directory exists and has content
  const exportsExists = await fsExists(exportsDirPath);
  if (!exportsExists) {
    console.error('Copy failed: Exports directory does not exist at', exportsDirPath);
    return;
  }

  try {
    // Ensure destination directory exists
    await mkdir(pathDest, { recursive: true });

    // Copy from exports to destination
    await copy(exportsDirPath, pathDest, { overwrite: true });
  } catch (error) {
    console.error('Copy failed: ' + error);
    throw error;
  }
};

const getAbsoluteDistPath = () => {
  return __dirname;
};

const getTempDirPath = () => {
  return tempDirPath;
};

const program = new Command();

program.option('-p, --port <number>', 'port number', 3896);
program.option('-i, --input <string>', 'path to sources images', './sources');
program.option('-o, --output <string>', 'path to destination images', './exports');
program.option(
  '-t, --type <string>',
  'Export image type (png, jpeg, webp or auto). Export image extension will be changed accordingly',
  'png'
);
program.option(
  '-q, --quality <number>',
  'Export image quality (0-100). Not applicable for png',
  100
);
program.option(
  '-s, --strength <number>',
  'Strength of the NormalMap renderer. Value between 0.01 to 5',
  1
);
program.option(
  '-l, --level <number>',
  'Level of the NormalMap renderer. Value between 4 to 10',
  8.5
);
program.option(
  '-bs, --blursharp <number>',
  'Add blur or sharp effect to the normal map. Value between -32 (very blurry) and 32 (vary sharp)',
  1
);
program.option('-ir, --invertedRed <boolean>', 'Invert red value', false);
program.option('-ig, --invertedGreen <boolean>', 'Invert green value', false);
program.option('-ih, --invertedHeight <boolean>', 'Invert height value', false);
program.option('--no-sandbox', 'Pass --no-sandbox to Puppeteer', false);
program.option('--disable-setuid-sandbox', 'Pass --disable-setuid-sandbox to Puppeteer', false);

program.parse(process.argv);

const options = program.opts();

const {
  port,
  input,
  output,
  strength,
  level,
  blursharp,
  invertedRed,
  invertedGreen,
  invertedHeight,
  type,
  quality,
  noSandbox,
  disableSetuidSandbox,
} = options;

let browser;
let page;
let images;

const server = http.createServer(async (request, response) => {
  // Check if this is a request for a temp file (starts with /temp-files/)
  if (request.url.startsWith('/temp-files/')) {
    try {
      const tempDir = getTempDirPath();
      if (!tempDir) {
        response.writeHead(404);
        response.end('Temp directory not initialized');
        return;
      }
      // Remove /temp-files/ prefix and get the actual file path
      const filePath = decodeURIComponent(request.url.replace('/temp-files/', ''));
      const fullPath = path.join(tempDir, filePath);

      const fileContent = await readFile(fullPath);
      response.writeHead(200);
      response.end(fileContent);
    } catch (error) {
      response.writeHead(404);
      response.end('File not found: ' + error.message);
    }
  } else {
    // Serve static files from dist directory
    return handler(request, response, {
      public: getAbsoluteDistPath(),
    });
  }
});
server.listen(port);

const transformAndSaveImage = async (image) => {
  const { src, exportPath } = image;
  await createFolderFromPathFile(exportPath);
  await page.waitForSelector('body');
  await page.evaluate(
    async (opt) => {
      await transformSource(opt); // eslint-disable-line
    },
    { src, strength, level, blursharp, invertedRed, invertedGreen, invertedHeight }
  );
  await page.waitForSelector('img');
  const html2 = await page.$('img');
  const ext = exportPath.split('.').pop();
  let t = type === 'auto' ? ext : type;
  t = ['png', 'jpeg', 'webp'].includes(type) ? t : 'png';
  const path = exportPath.split('.').slice(0, -1).concat(t).join('.');
  const q = Number.isInteger(parseInt(quality)) ? Math.min(100, Math.max(0, quality)) : 100;
  await html2.screenshot({
    path,
    type: t,
    quality: t !== 'png' ? q : undefined,
  });
};

const transformImages = async () => {
  let index = 0;
  while (index < images.length) {
    await transformAndSaveImage(images[index]);
    index++;
  }
};

const execute = async () => {
  try {
    await initializeTempDirectory();
    await copySourcesToTemp(input);
    images = await parseTempFolder(); // eslint-disable-line
    console.info('transforming', images.length, 'images');
    if (images.length > 0) {
      const puppeteerArgs = [];
      if (noSandbox) puppeteerArgs.push('--no-sandbox');
      if (disableSetuidSandbox) puppeteerArgs.push('--disable-setuid-sandbox');

      browser = await puppeteer.launch({
        args: puppeteerArgs,
      });
      page = await browser.newPage();
      await page.goto(`http://localhost:${port}`);
      await transformImages();
      await copyToFinalFolder(output);
      await browser.close();
    }
  } catch (error) {
    console.error('Error during execution:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  } finally {
    deleteTempFolder();
    server.close();
  }
};

export { execute as default, execute };
