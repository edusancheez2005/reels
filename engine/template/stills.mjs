// Render several stills from one bundle (faster QA for 3D scenes).
// Usage (in reel-studio, with REMOTION_BROWSER set): node stills.mjs <outDir> <frame> [<frame> ...] [--scale 0.5]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let scale = 0.5;
const si = args.indexOf('--scale');
if (si >= 0) {
  scale = Number(args[si + 1]);
  args.splice(si, 2);
}
const [out, ...frames] = args;
mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const opts = {browserExecutable: process.env.REMOTION_BROWSER || null, chromiumOptions: {gl: 'swangle'}};
const composition = await selectComposition({serveUrl, id: 'Reel', ...opts});
for (const f of frames.map(Number)) {
  const output = path.join(out, `f${String(f).padStart(4, '0')}.png`);
  const t0 = Date.now();
  await renderStill({composition, serveUrl, output, frame: f, scale, imageFormat: 'png', ...opts});
  console.log('frame', f, '->', output, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
