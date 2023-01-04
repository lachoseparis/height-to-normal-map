import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import { Command } from 'commander';
import { readdir, lstat, mkdir } from 'fs/promises';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';
import copy from 'recursive-copy';
import rimraf from 'rimraf';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
var sizeOf = promisify(require('image-size'));
const { forEach } = require('p-iteration');
const baseFolder = '/sources';

const parseTempFolder = async () => {
  const pathTemp = path.join(__dirname, './temp');
  const lImages = parseFolder(pathTemp);
  return lImages;
};

const parseFolder = async (folder, oImages = []) => {
  try {
    const elements = await readdir(folder);
    await forEach(elements, async (element) => {
      const filePath = folder + '/' + element;
      const exportPath = filePath.replace('/temp', '/exports');

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

            oImages.push({
              ...oImages[id],
              ...dimensions,
              exportPath,
              filePath,
              src: filePath.replace(__dirname, ''),
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
    const pathTemp = path.join(__dirname, './temp');
    rimraf.sync(pathTemp);
  } catch (error) {
    console.error('Delete temp folder failed: ' + error);
  }
};

const copySourcesToTemp = async (sources) => {
  const pathTemp = path.join(__dirname, './temp');
  rimraf.sync(pathTemp);
  await mkdir(pathTemp);
  try {
    await copy(`${sources}`, pathTemp);
  } catch (error) {
    console.error('Copy failed: ' + error);
  }
};

const copyToFinalFolder = async (dest) => {
  const pathExports = path.join(__dirname, './exports');
  const pathDest = path.resolve(process.cwd(), dest);
  rimraf.sync(pathDest);
  try {
    await copy(`${pathExports}`, pathDest);
    rimraf.sync(pathExports);
  } catch (error) {
    console.error('Copy failed: ' + error);
  }
};

const getAbsoluteDistPath = () => {
  return __dirname;
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
} = options;

let browser;
let page;
let images;

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: getAbsoluteDistPath(),
  });
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
  await copySourcesToTemp(input);
  images = await parseTempFolder(); // eslint-disable-line
  console.info('transforming', images.length, 'images');
  if (images.length > 0) {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    await transformImages();
    await copyToFinalFolder(output);
    await browser.close();
  }
  deleteTempFolder();
};

export { execute as default, execute };
