/**
 * Flags photographs that a visitor would read as the same picture.
 *
 * Run this after adding anything to images/ — a duplicate is the one mistake
 * that makes a portfolio look careless, and it is easy to introduce when the
 * same negative has been scanned twice, graded differently, or cropped again:
 *
 *   node tools/find-dupes.mjs
 *
 * The signature is a dHash (8x8 horizontal-gradient hash), which ignores
 * scale, compression and overall brightness — so it still matches two grades
 * of one frame, which a plain file comparison would miss entirely.
 *
 * Distances are a guide, not a verdict. Under ~6 bits is almost always the
 * same frame; 6-16 needs a look; above that it is usually just two pictures
 * with similar tone. Always open the pair before deleting anything.
 */
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'images');
const LOOK = 16; // report anything at least this close

async function signature(file) {
  const { data } = await sharp(join(IMAGES, file))
    .greyscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += data[y * 9 + x] < data[y * 9 + x + 1] ? '1' : '0';
    }
  }
  return bits;
}

const distance = (a, b) => [...a].reduce((n, c, i) => n + (c !== b[i] ? 1 : 0), 0);

const files = readdirSync(IMAGES).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const sigs = Object.fromEntries(await Promise.all(files.map(async (f) => [f, await signature(f)])));

const hits = [];
for (let i = 0; i < files.length; i++) {
  for (let j = i + 1; j < files.length; j++) {
    const d = distance(sigs[files[i]], sigs[files[j]]);
    if (d <= LOOK) hits.push({ a: files[i], b: files[j], d });
  }
}
hits.sort((p, q) => p.d - q.d);

if (!hits.length) {
  console.log(`No pairs within ${LOOK} bits across ${files.length} images.`);
} else {
  console.log(`${hits.length} pair(s) to look at, closest first:\n`);
  for (const { a, b, d } of hits) {
    const note = d <= 6 ? 'almost certainly the same frame' : 'worth opening side by side';
    console.log(`  ${String(d).padStart(2)} bits  ${a}  ==  ${b}   (${note})`);
  }
  console.log('\nOpen each pair before removing anything.');
}
