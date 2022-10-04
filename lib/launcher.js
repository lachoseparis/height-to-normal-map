import puppeteer from 'puppeteer';


import handler from 'serve-handler';
import http from 'http';

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: './files/'
  });
});
server.listen(3000, () => {
  console.log('Running at http://localhost:3000');
});

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000?src=http://localhost:3000/sources/base.png');
await page.waitForSelector('img');
const html = await page.$('img');
console.info('html', html);
await html.screenshot({ path: 'exports/image2.png' });

await browser.close();
console.info('ok');

process.exit();