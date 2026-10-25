#!/usr/bin/env node
// Fetch real brand logos as SVG files from the Simple Icons package (3,000+ brands, official colours).
// Usage (from reel-studio/, which has simple-icons installed):
//   node <skill>/scripts/get_logos.mjs --out ../episodes/<slug>/assets bitcoin binance coinbase
// Names are Simple Icons slugs or titles ("Hugging Face", "openai" …). Add --mono for single-colour (white) logos.
// Logos are trademarks of their owners: use them to refer to the brand (editorial), never to imply endorsement.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const outI = args.indexOf('--out');
const out = outI >= 0 ? args[outI + 1] : '.';
const mono = args.includes('--mono');
const names = args.filter((a, i) => !a.startsWith('--') && i !== outI + 1);

const require = createRequire(path.join(process.cwd(), 'package.json'));
let si;
try {
  si = require('simple-icons');
} catch {
  console.error('simple-icons not installed here. Run: npm i simple-icons');
  process.exit(1);
}
const all = Object.values(si).filter((x) => x && x.slug && x.path);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
fs.mkdirSync(out, {recursive: true});
let missing = 0;
for (const name of names) {
  const icon = all.find((x) => x.slug === norm(name)) || all.find((x) => norm(x.title) === norm(name));
  if (!icon) {
    const near = all.filter((x) => norm(x.title).includes(norm(name))).slice(0, 5).map((x) => x.slug);
    console.log(`MISSING ${name}${near.length ? `  (did you mean: ${near.join(', ')})` : ''}`);
    missing++;
    continue;
  }
  const fill = mono ? '#FFFFFF' : `#${icon.hex}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>${icon.title}</title><path fill="${fill}" d="${icon.path}"/></svg>\n`;
  const file = path.join(out, `${icon.slug}${mono ? '-mono' : ''}.svg`);
  fs.writeFileSync(file, svg);
  console.log(`OK  ${icon.title}  #${icon.hex}  → ${file}`);
}
if (missing) console.log('\nNot in Simple Icons? Download the official SVG from the brand\'s press/media kit into assets/ instead.');
