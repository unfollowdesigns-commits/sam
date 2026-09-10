/**
 * Generates the placeholder imagery shipped with the starter portfolio.
 *
 * These are deterministic, seeded SVG compositions — soft gradient fields with
 * film grain and a vignette — meant to stand in for real photographs so the
 * layout can be judged with something in it. Replace them by dropping real
 * files into images/ and pointing js/data.js at them; nothing else depends on
 * this script.
 *
 *   node tools/gen-placeholders.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'images');

/* Deterministic PRNG so regenerating never reshuffles the gallery. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Muted, filmic four-stop palettes: light -> shadow. */
const PALETTES = {
  ash:      ['#e2ddd5', '#b3aca2', '#6f6a63', '#2c2a27'],
  dune:     ['#ecdfca', '#c8ad84', '#8c7457', '#372e25'],
  tide:     ['#d5dcdd', '#9dadb2', '#5b6f76', '#212f35'],
  ember:    ['#ecd8c8', '#cc9d80', '#8d5a44', '#2f1e19'],
  nocturne: ['#c9cfd9', '#8b93a5', '#4a5364', '#141821'],
  moss:     ['#dadecf', '#a5ad96', '#666f5b', '#20261f'],
};

const round = (n) => Math.round(n * 100) / 100;

/* A soft ridge silhouette: the thing that makes a gradient read as landscape. */
function ridgePath(W, H, baseY, amplitude, rand) {
  const steps = 8;
  const phase = rand() * Math.PI * 2;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const y = baseY + Math.sin(phase + i * 1.35) * amplitude + (rand() - 0.5) * amplitude * 0.7;
    points.push(`${round(x)},${round(y)}`);
  }
  return `M0,${H} L${points.join(' L')} L${W},${H} Z`;
}

/**
 * @param {object} spec
 * @param {string} spec.name    output filename stem
 * @param {number} spec.seed    any integer; same seed => same image
 * @param {string} spec.palette key of PALETTES
 * @param {number} spec.ratio   width / height
 * @param {'horizon'|'drift'|'structure'|'figure'} spec.motif
 */
function compose({ name, seed, palette, ratio, motif }) {
  const rand = rng(seed);
  const pick = (lo, hi) => lo + rand() * (hi - lo);
  const [c0, c1, c2, c3] = PALETTES[palette];

  const W = 1600;
  const H = Math.round(W / ratio);
  const id = `${name}-${seed}`;
  const defs = [];
  const body = [];

  // 1. Base wash. Landscapes stay near-vertical so the light sits overhead.
  const angle = motif === 'horizon' ? pick(80, 100) : pick(0, 360);
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) / 2;
  const dy = Math.sin(rad) / 2;
  defs.push(`<linearGradient id="g-${id}" x1="${round(0.5 - dx)}" y1="${round(0.5 - dy)}" x2="${round(0.5 + dx)}" y2="${round(0.5 + dy)}">
      <stop offset="0" stop-color="${c0}"/>
      <stop offset="${round(pick(0.4, 0.62))}" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>`);
  body.push(`<rect width="${W}" height="${H}" fill="url(#g-${id})"/>`);

  // 2. Atmosphere: broad, heavily blurred masses well behind everything else.
  const haze = [];
  for (let i = 0; i < 4; i++) {
    haze.push(
      `<ellipse cx="${round(pick(-0.1, 1.1) * W)}" cy="${round(pick(-0.1, 1.1) * H)}" rx="${round(pick(0.25, 0.6) * W)}" ry="${round(pick(0.15, 0.4) * H)}" fill="${rand() > 0.5 ? c1 : c2}" opacity="${round(pick(0.2, 0.45))}"/>`
    );
  }
  defs.push(`<filter id="h-${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${round(pick(70, 120))}"/></filter>`);
  body.push(`<g filter="url(#h-${id})">${haze.join('')}</g>`);

  // 3. Subject. Each motif builds its depth differently.
  const subject = [];
  let subjectBlur = 30;

  if (motif === 'horizon') {
    // Receding ridges: lighter and hazier far away, darker and crisper near.
    const layers = 3 + Math.floor(rand() * 2);
    const top = pick(0.42, 0.6) * H;
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1 || 1);
      const y = top + t * (H - top) * 0.62;
      const fill = t > 0.6 ? c3 : t > 0.3 ? c2 : c1;
      subject.push(
        `<path d="${ridgePath(W, H, y, pick(0.02, 0.06) * H, rand)}" fill="${fill}" opacity="${round(0.45 + t * 0.5)}"/>`
      );
    }
    subjectBlur = pick(6, 14);
  } else if (motif === 'structure') {
    // Hard planes at a shared rake: architecture reduced to light and shadow.
    const rake = pick(-16, 16);
    const planes = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < planes; i++) {
      const x = pick(-0.15, 0.9) * W;
      const w = pick(0.06, 0.26) * W;
      subject.push(
        `<rect x="${round(x)}" y="${round(-0.25 * H)}" width="${round(w)}" height="${round(1.6 * H)}" fill="${rand() > 0.45 ? c3 : c0}" opacity="${round(pick(0.22, 0.6))}" transform="rotate(${round(rake)} ${round(x + w / 2)} ${round(H / 2)})"/>`
      );
    }
    // A cast shadow across the lower frame anchors the planes.
    subject.push(`<rect x="0" y="${round(pick(0.6, 0.8) * H)}" width="${W}" height="${H}" fill="${c3}" opacity="0.35"/>`);
    subjectBlur = pick(4, 12);
  } else if (motif === 'figure') {
    // Interior light: a pool thrown across a wall, and whatever it half-finds.
    const angle2 = pick(-28, 28);
    const px = pick(0.15, 0.55) * W;
    const py = pick(0.1, 0.4) * H;
    subject.push(
      `<rect x="0" y="${round(pick(0.7, 0.9) * H)}" width="${W}" height="${H}" fill="${c3}" opacity="0.4"/>`,
      `<ellipse cx="${round(pick(0.3, 0.7) * W)}" cy="${round(pick(0.45, 0.7) * H)}" rx="${round(pick(0.14, 0.22) * W)}" ry="${round(pick(0.2, 0.3) * H)}" fill="${c3}" opacity="0.24"/>`,
      `<rect x="${round(px)}" y="${round(py)}" width="${round(pick(0.18, 0.34) * W)}" height="${round(pick(0.35, 0.6) * H)}" fill="${c0}" opacity="${round(pick(0.4, 0.62))}" transform="rotate(${round(angle2)} ${round(px)} ${round(py)})"/>`
    );
    subjectBlur = pick(16, 34);
  } else {
    // drift — weather: long, low streaks pulled across the frame.
    const streaks = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < streaks; i++) {
      const y = pick(0, 1) * H;
      subject.push(
        `<rect x="${round(pick(-0.3, 0.4) * W)}" y="${round(y)}" width="${round(pick(0.5, 1.3) * W)}" height="${round(pick(0.03, 0.12) * H)}" fill="${rand() > 0.5 ? c3 : c0}" opacity="${round(pick(0.15, 0.4))}" transform="rotate(${round(pick(-8, 8))} ${round(W / 2)} ${round(y)})"/>`
      );
    }
    subjectBlur = pick(30, 60);
  }

  defs.push(`<filter id="s-${id}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="${round(subjectBlur)}"/></filter>`);
  body.push(`<g filter="url(#s-${id})">${subject.join('')}</g>`);

  // 4. Light source: a bloom lifted over everything, which is what sells depth.
  const bx = pick(0.2, 0.8);
  const by = motif === 'horizon' ? pick(0.2, 0.45) : pick(0.2, 0.7);
  defs.push(`<radialGradient id="l-${id}" cx="${round(bx)}" cy="${round(by)}" r="${round(pick(0.4, 0.65))}">
      <stop offset="0" stop-color="${c0}" stop-opacity="${round(pick(0.35, 0.6))}"/>
      <stop offset="1" stop-color="${c0}" stop-opacity="0"/>
    </radialGradient>`);
  body.push(`<rect width="${W}" height="${H}" fill="url(#l-${id})" style="mix-blend-mode:screen"/>`);

  // 5. Vignette, then grain.
  defs.push(`<radialGradient id="v-${id}" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.4" stop-color="${c3}" stop-opacity="0"/>
      <stop offset="1" stop-color="${c3}" stop-opacity="0.7"/>
    </radialGradient>`);
  body.push(`<rect width="${W}" height="${H}" fill="url(#v-${id})"/>`);

  defs.push(`<filter id="n-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>`);
  body.push(`<rect width="${W}" height="${H}" filter="url(#n-${id})" opacity="0.2" style="mix-blend-mode:overlay"/>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>${defs.join('')}</defs>
  ${body.join('\n  ')}
</svg>`;

  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, `${name}.svg`), svg);
  return `${name}.svg`;
}

/* Keep this list in step with js/data.js. */
const SPECS = [
  { name: 'hero',   seed: 7301, palette: 'nocturne', ratio: 16 / 9, motif: 'horizon' },
  { name: 'about',  seed: 4412, palette: 'ash',      ratio: 4 / 5,  motif: 'figure' },

  { name: 'coast-01',   seed: 1011, palette: 'tide',     ratio: 3 / 2, motif: 'horizon' },
  { name: 'coast-02',   seed: 1022, palette: 'tide',     ratio: 4 / 5, motif: 'drift' },
  { name: 'coast-03',   seed: 1033, palette: 'ash',      ratio: 1,     motif: 'horizon' },
  { name: 'coast-04',   seed: 1044, palette: 'nocturne', ratio: 3 / 2, motif: 'drift' },

  { name: 'concrete-01', seed: 2011, palette: 'ash',      ratio: 4 / 5, motif: 'structure' },
  { name: 'concrete-02', seed: 2022, palette: 'nocturne', ratio: 3 / 2, motif: 'structure' },
  { name: 'concrete-03', seed: 2033, palette: 'ash',      ratio: 2 / 3, motif: 'structure' },
  { name: 'concrete-04', seed: 2044, palette: 'ember',    ratio: 1,     motif: 'structure' },

  { name: 'north-01', seed: 3011, palette: 'nocturne', ratio: 3 / 2, motif: 'horizon' },
  { name: 'north-02', seed: 3022, palette: 'moss',     ratio: 4 / 5, motif: 'drift' },
  { name: 'north-03', seed: 3033, palette: 'tide',     ratio: 16 / 9, motif: 'horizon' },
  { name: 'north-04', seed: 3044, palette: 'moss',     ratio: 2 / 3, motif: 'drift' },

  { name: 'interior-01', seed: 5011, palette: 'ember', ratio: 4 / 5, motif: 'figure' },
  { name: 'interior-02', seed: 5022, palette: 'dune',  ratio: 3 / 2, motif: 'structure' },
  { name: 'interior-03', seed: 5033, palette: 'ember', ratio: 1,     motif: 'figure' },
  { name: 'interior-04', seed: 5044, palette: 'dune',  ratio: 2 / 3, motif: 'drift' },
];

for (const spec of SPECS) console.log('wrote images/' + compose(spec));
