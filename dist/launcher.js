import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import { readdir, lstat, mkdir } from 'fs/promises';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';
import copy from 'recursive-copy';
import rimraf from 'rimraf';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';

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
  console.info('--- path', path);
  const isPath = await fsExists(path);
  if (!isPath) {
    await mkdir(path, { recursive: true });
  }
};

const copySourcesToTemp = async (sources) => {
  const pathTemp = path.join(__dirname, './temp');
  rimraf.sync(pathTemp);
  console.info('pathTemp', pathTemp, __dirname);
  await mkdir(pathTemp);

  const pathSources = path.resolve(process.cwd(), sources);
  console.info('pathSources', pathSources);
  try {
    const results = await copy(`${sources}`, pathTemp);
    console.info('Copied ' + results.length + ' files');
  } catch (error) {
    console.error('Copy failed: ' + error);
  }
};

const copyToFinalFolder = async (dest) => {
  const pathExports = path.join(__dirname, './exports');
  const pathDest = path.resolve(process.cwd(), dest);
  //await mkdir(pathDest);

  console.info('pathDest', pathDest);
  try {
    const results = await copy(`${pathExports}`, pathDest);
    console.info('Copied ' + results.length + ' files');
    rimraf.sync(pathExports);
  } catch (error) {
    console.error('Copy failed: ' + error);
  }
};

const program = new Command();

program.option('-p, --port <number>', 'port number', 3896);
program.option('-s, --sources <string>', 'path to sources images files', './sources');
program.option('-d, --destination <string>', 'path to destination images files', './exports');

program.parse(process.argv);

const options = program.opts();

const PORT = options.port || 3456;

const BASE_SOURCES = options.sources;

const DEST = options.destination;

await copySourcesToTemp(BASE_SOURCES);

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: './dist/',
  });
});
server.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});

const images = await parseTempFolder(); // eslint-disable-line
console.info('images found', images.length);
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}`);
// await page.waitForSelector('img');
// const html = await page.$('img');
// console.info('html', html);
// await html.screenshot({ path: 'exports/image2.png' });
const transformAndSaveImage = async (image) => {
  const { src, exportPath } = image;
  console.info('path', src, exportPath);
  await createFolderFromPathFile(exportPath);
  await page.evaluate(async (p) => {
    await transformSource(p); // eslint-disable-line
  }, src);
  await page.waitForSelector('img');
  const html2 = await page.$('img');
  await html2.screenshot({
    path: exportPath,
  });
};

const transformImages = async () => {
  let index = 0;
  while (index < images.length) {
    await transformAndSaveImage(images[index]);
    index++;
  }
};

rimraf.sync('./exports');
await mkdir('./exports');
await transformImages();

await copyToFinalFolder(DEST);

await browser.close();

process.exit(); // eslint-disable-line
