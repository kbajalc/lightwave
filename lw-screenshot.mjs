import { chromium } from 'playwright';

const base = 'http://127.0.0.1:7777/lw/lightwave.html';
const args = process.argv.slice(2);
const url = args[0] ? (args[0].startsWith('http') ? args[0] : base + '?' + args[0]) : base + '?db=mitdb&record=200&x=0:05:30';
const out = args[1] || '/tmp/lw-marker.png';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 800 });

await page.goto(url);
await page.waitForSelector('svg.svgplot', { timeout: 30000 });
await page.waitForTimeout(1000);

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log('Screenshot saved to ' + out);
