import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import { parseFolder, createFolderFromPathFile } from './utils/files.js';
import rimraf from 'rimraf';
import { mkdir } from 'fs/promises';

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: './files/',
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
