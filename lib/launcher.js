import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import {
  parseTempFolder,
  createFolderFromPathFile,
  copySourcesToTemp,
  copyToFinalFolder,
} from './utils/files.js';
import rimraf from 'rimraf';
import { mkdir } from 'fs/promises';

import { Command } from 'commander';
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
