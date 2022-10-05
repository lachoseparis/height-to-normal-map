import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import { readdir, lstat, mkdir } from 'fs/promises';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';
import rimraf from 'rimraf';

const require = createRequire(import.meta.url);
var sizeOf = promisify(require('image-size'));
const { forEach } = require('p-iteration');
const baseFolder = '/sources';

const parseFolder = async (folder, oImages = []) => {
  try {
    const elements = await readdir(folder);
    await forEach(elements, async (element) => {
      const filePath = folder + '/' + element;
      const exportPath = filePath.replace(baseFolder, '/exports');

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
              path: filePath.replace('./', '/'),
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

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: './dist/',
  });
});
server.listen(3000, () => {
  console.log('Running at http://localhost:3000');
});

const images = await parseFolder("./sources"); // eslint-disable-line
console.info('images', images);
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000?src=http://localhost:3000/sources/base.png');
// await page.waitForSelector('img');
// const html = await page.$('img');
// console.info('html', html);
// await html.screenshot({ path: 'exports/image2.png' });
const transformAndSaveImage = async (image) => {
  const { path, exportPath } = image;
  console.info('path', path, exportPath);
  await createFolderFromPathFile(exportPath);
  await page.evaluate(async (p) => {
    await transformSource(p); // eslint-disable-line
  }, path);
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
await browser.close();

process.exit(); // eslint-disable-line
