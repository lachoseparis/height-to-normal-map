import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import http from 'http';
import { Command } from 'commander';
import {
  parseTempFolder,
  createFolderFromPathFile,
  copySourcesToTemp,
  copyToFinalFolder,
  deleteTempFolder,
  getAbsoluteDistPath,
} from './utils/files.js';
const program = new Command();

program.option('-p, --port <number>', 'port number', 3896);
program.option('-i, --input <string>', 'path to sources images', './sources');
program.option('-o, --output <string>', 'path to destination images', './exports');
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

console.info('options', options);

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
} = options;

let browser;
let page;
let images;

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: getAbsoluteDistPath(),
  });
});
server.listen(port, () => {
  console.log(`Running at http://localhost:${port}`);
});

const transformAndSaveImage = async (image) => {
  const { src, exportPath } = image;
  await createFolderFromPathFile(exportPath);
  await page.waitForSelector('body');
  await page.evaluate(
    async (opt) => {
      console.info('options', opt);
      await transformSource(opt); // eslint-disable-line
    },
    { src, strength, level, blursharp, invertedRed, invertedGreen, invertedHeight }
  );
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

export const execute = async () => {
  await copySourcesToTemp(input);
  images = await parseTempFolder(); // eslint-disable-line
  console.info('images found', images.length);
  if (images.length > 0) {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    await transformImages();
    await copyToFinalFolder(output);
    await browser.close();
  }
  deleteTempFolder();

  process.exit(); // eslint-disable-line
};

export default execute;

console.info('process.env.npm_command', process.env);

if (process.env.npm_command === 'test') {
  console.info('running test');
  execute();
}
