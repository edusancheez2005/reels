#!/usr/bin/env node
// Capture crisp screenshots of real pages for Shot scenes (runs on your machine, where the web is reachable).
// Setup once, inside reel-studio/:   npm i -D playwright && npx playwright install chromium
// Usage:
//   node <skill>/scripts/screenshot.mjs <url> <out.png> [--width 1100] [--height 1400] [--scale 2]
//        [--selector "css"]  capture just that element (e.g. "h1", ".box", "#fee-row")
//        [--zoom 1.6]        CSS-zoom the selected element before capture (bigger, sharper text)
//        [--dark]            prefer dark colour scheme
//        [--hide "css,css"]  hide cookie banners / ads / sticky headers before capture
// Prints the saved size. Mark coordinates for Shot scenes are in this image's pixels.
import path from 'node:path';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const flag = (k) => args.includes(`--${k}`);
const [url, out] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--') || i < 2).slice(0, 2);
if (!url || !out) {
  console.error('usage: screenshot.mjs <url> <out.png> [--selector css] [--zoom n] [--scale 2] [--dark] [--hide css]');
  process.exit(1);
}
const require = createRequire(path.join(process.cwd(), 'package.json'));
let chromium;
try {
  ({chromium} = require('playwright'));
} catch {
  console.error('playwright not installed here. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}
const browser = await chromium.launch({executablePath: process.env.REMOTION_BROWSER || undefined});
const page = await browser.newPage({
  viewport: {width: Number(opt('width', 1100)), height: Number(opt('height', 1400))},
  deviceScaleFactor: Number(opt('scale', 2)),
  colorScheme: flag('dark') ? 'dark' : 'light',
});
await page.goto(url.startsWith('http') || url.startsWith('file:') ? url : `https://${url}`, {waitUntil: 'networkidle', timeout: 45000}).catch(() => {});
await page.waitForTimeout(1200);
const hide = opt('hide', '');
const defaultsToHide = '[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[class*="onetrust" i],#onetrust-banner-sdk';
await page.addStyleTag({content: `${[hide, defaultsToHide].filter(Boolean).join(',')}{display:none !important}`});
const sel = opt('selector', null);
const zoom = opt('zoom', null);
if (sel && zoom) await page.$eval(sel, (el, z) => (el.style.zoom = z), zoom);
if (sel) {
  const el = await page.$(sel);
  if (!el) {
    console.error(`selector not found: ${sel}`);
    process.exit(2);
  }
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({path: out});
} else {
  await page.screenshot({path: out, fullPage: flag('full')});
}
const size = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
await browser.close();
console.log(`OK  ${out}  (viewport ${size[0]}×${size[1]} @${opt('scale', 2)}x)`);
