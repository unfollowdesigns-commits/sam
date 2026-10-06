/**
 * Reads the colour out of every photograph and writes js/palette.js.
 *
 * A photographer who shoots film and publishes the scans as the lab returned
 * them has one constant running through everything: what the emulsion did to
 * the colour. Half these frames came back with no colour at all; the rest came
 * back with a cast that was not chosen — the green on the leaked rolls, the
 * cyan skies, the warm reds. That is the one axis that belongs to this work,
 * so the site can be browsed along it.
 *
 * Nothing here is invented. Every swatch is measured from the file.
 *
 * For each photograph it writes:
 *   swatches  five dominant colours, darkest to lightest, as hex
 *   family    'mono' | 'green' | 'cyan' | 'amber'
 *   sat       mean saturation, 0—1 (under 0.10 is a black and white frame)
 *   lig       mean lightness, 0—1
 *
 * Run after adding or replacing photographs:
 *   node tools/build-palette.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTOS, SITE } from '../js/data.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* --- Colour conversion --------------------------------------------------- */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = (max === r ? (g - b) / d + (g < b ? 6 : 0)
    : max === g ? (b - r) / d + 2
      : (r - g) / d + 4) * 60;
  return [h, s, l];
}

const hex = (r, g, b) =>
  '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');

/* --- Dominant colours ----------------------------------------------------
   k-means over the pixels of a small copy. Five centres, seeded along the
   lightness range so the result spans the frame's tonal scale instead of
   collapsing onto whatever the image has most of — a photograph is read by
   its range, not only by its commonest colour.
   ------------------------------------------------------------------------ */
function dominant(pixels, k = 5, rounds = 12) {
  const n = pixels.length / 3;
  const lightnessOf = (i) => 0.299 * pixels[i * 3] + 0.587 * pixels[i * 3 + 1] + 0.114 * pixels[i * 3 + 2];

  const order = [...Array(n).keys()].sort((a, b) => lightnessOf(a) - lightnessOf(b));
  let centres = Array.from({ length: k }, (_, j) => {
    const i = order[Math.floor(((j + 0.5) / k) * n)];
    return [pixels[i * 3], pixels[i * 3 + 1], pixels[i * 3 + 2]];
  });

  let assign = new Int32Array(n);
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let j = 0; j < k; j++) {
        const dr = pixels[i * 3] - centres[j][0];
        const dg = pixels[i * 3 + 1] - centres[j][1];
        const db = pixels[i * 3 + 2] - centres[j][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = j; }
      }
      assign[i] = best;
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const a = sums[assign[i]];
      a[0] += pixels[i * 3]; a[1] += pixels[i * 3 + 1]; a[2] += pixels[i * 3 + 2]; a[3]++;
    }
    centres = sums.map((a, j) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : centres[j]));
  }

  const weight = new Array(k).fill(0);
  for (let i = 0; i < n; i++) weight[assign[i]]++;

  return centres
    .map((c, j) => ({ rgb: c, share: weight[j] / n }))
    .sort((a, b) => (0.299 * a.rgb[0] + 0.587 * a.rgb[1] + 0.114 * a.rgb[2])
      - (0.299 * b.rgb[0] + 0.587 * b.rgb[1] + 0.114 * b.rgb[2]));
}

/* --- What kind of colour the film gave back ------------------------------
   Four families, chosen because they are the four things that actually
   happen across this work, not because they tile the colour wheel. A frame
   with almost no saturation is a black and white frame and says so; the rest
   are sorted by where their saturated pixels sit.
   ------------------------------------------------------------------------ */
const MONO_AT = 0.10;

function familyOf(meanSat, hueWeight) {
  if (meanSat < MONO_AT) return 'mono';
  const bands = { green: 0, cyan: 0, amber: 0 };
  for (let h = 0; h < 360; h++) {
    const w = hueWeight[h];
    if (!w) continue;
    if (h >= 55 && h < 160) bands.green += w;
    else if (h >= 160 && h < 265) bands.cyan += w;
    else bands.amber += w;
  }
  return Object.entries(bands).sort((a, b) => b[1] - a[1])[0][0];
}

export const FAMILIES = [
  { id: 'mono', title: 'Black & white', note: 'No colour on the roll at all.' },
  { id: 'green', title: 'Green cast', note: 'What the leaked and expired rolls came back as.' },
  { id: 'cyan', title: 'Cyan', note: 'Skies, glass, cold afternoons.' },
  { id: 'amber', title: 'Amber', note: 'Red leaks, gold light, warm rooms.' },
];

/* --- Read every frame ----------------------------------------------------- */
const palette = {};
const tally = { mono: 0, green: 0, cyan: 0, amber: 0 };

for (const photo of [...PHOTOS, { src: SITE.about.src, title: 'About' }]) {
  const { data, info } = await sharp(join(ROOT, photo.src))
    .resize(96, 96, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const n = info.width * info.height;
  let sat = 0;
  let lig = 0;
  const hueWeight = new Float64Array(360);
  for (let i = 0; i < n; i++) {
    const [h, s, l] = rgbToHsl(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    sat += s; lig += l;
    // Weighted by saturation so a wash of near-grey cannot outvote the cast.
    if (s > 0.12) hueWeight[Math.round(h) % 360] += s;
  }
  const meanSat = sat / n;
  const meanLig = lig / n;
  const family = familyOf(meanSat, hueWeight);
  if (photo.series !== undefined || photo.title !== 'About') tally[family] = (tally[family] ?? 0) + 1;

  palette[photo.src] = {
    swatches: dominant(data).map((c) => hex(...c.rgb)),
    family,
    sat: +meanSat.toFixed(3),
    lig: +meanLig.toFixed(3),
  };
}

const body = Object.entries(palette)
  .map(([src, p]) => `  '${src}': { family: '${p.family}', sat: ${p.sat}, lig: ${p.lig}, `
    + `swatches: [${p.swatches.map((s) => `'${s}'`).join(', ')}] },`)
  .join('\n');

writeFileSync(join(ROOT, 'js', 'palette.js'),
  `/**\n * Generated by tools/build-palette.mjs — do not edit by hand.\n *\n`
  + ` * The colour measured out of every photograph: its five dominant tones\n`
  + ` * darkest to lightest, which family the film's cast belongs to, and the\n`
  + ` * mean saturation and lightness. Nothing here is chosen; it is all read\n`
  + ` * off the scans.\n */\n`
  + `export const FAMILIES = ${JSON.stringify(FAMILIES, null, 2)};\n\n`
  + `export const PALETTE = {\n${body}\n};\n`);

console.log(`wrote js/palette.js — ${Object.keys(palette).length} frames`);
for (const f of FAMILIES) console.log(`  ${f.title.padEnd(14)} ${tally[f.id]}`);
