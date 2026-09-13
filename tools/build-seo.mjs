/**
 * Makes the site legible to crawlers and answer engines.
 *
 * The gallery is built by JavaScript, which means a crawler that does not run
 * scripts — and most answer engines do not — sees an empty page where the work
 * should be. This writes three things into the repo:
 *
 *   1. The gallery markup, injected straight into index.html between markers,
 *      so every photograph, title, caption and alt text is in the HTML source.
 *      The script replaces it on load; the content is identical either way.
 *   2. JSON-LD describing the photographer and every photograph, so an answer
 *      engine can state who made the work, where, when and in what medium.
 *   3. sitemap.xml and robots.txt.
 *
 * Run after changing js/data.js or adding photographs:
 *   node tools/build-seo.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, SERIES, PHOTOS } from '../js/data.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = SITE.url.replace(/\/$/, '');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slugOf = (p) => p.title.toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const seriesTitle = (id) => SERIES.find((s) => s.id === id)?.title ?? id;
const factsOf = (p) => [seriesTitle(p.series), p.location, p.year].filter(Boolean);

/* --- 1. Gallery markup, so the work exists without JavaScript ----------- */
const figures = PHOTOS.map((p, i) => {
  const plate = String(i + 1).padStart(3, '0');
  return `      <figure class="shot" data-index="${i}" id="plate-${plate}">
        <a class="shot__frame" href="#f/${slugOf(p)}" style="--ratio:${p.ratio}" aria-label="Open ${esc(p.title)} full screen">
          <img src="${p.src}" alt="${esc(p.alt)}" width="1800" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
        </a>
        <figcaption class="shot__cap">
          <span class="shot__plate">${plate}</span>
          <span class="shot__name">${esc(p.title)}</span>
          <span class="shot__where">${esc(factsOf(p).join(' / '))}</span>
        </figcaption>
      </figure>`;
}).join('\n');

/* --- 2. Structured data ------------------------------------------------- */
const person = {
  '@type': 'Person',
  '@id': `${base}/#person`,
  name: SITE.name,
  jobTitle: SITE.role,
  description: SITE.summary,
  email: `mailto:${SITE.email}`,
  url: base,
  knowsAbout: ['Film photography', '35mm photography', 'Portrait photography',
    'Fashion photography', 'Jewellery photography', 'Street photography'],
  address: { '@type': 'PostalAddress', addressLocality: 'Tunis', addressCountry: 'TN' },
  sameAs: SITE.social.filter((s) => s.href.startsWith('http')).map((s) => s.href),
};

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    person,
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: base,
      name: `${SITE.name} — ${SITE.role}`,
      description: SITE.summary,
      inLanguage: 'en',
      publisher: { '@id': `${base}/#person` },
    },
    {
      '@type': 'ImageGallery',
      '@id': `${base}/#work`,
      name: 'Selected work',
      description: `${PHOTOS.length} photographs, ${SERIES.map((s) => s.title).join(', ')}.`,
      numberOfItems: PHOTOS.length,
      author: { '@id': `${base}/#person` },
      associatedMedia: PHOTOS.map((p) => ({
        '@type': 'ImageObject',
        '@id': `${base}/#f/${slugOf(p)}`,
        name: p.title,
        caption: p.alt,
        description: [p.alt, ...factsOf(p)].join('. '),
        contentUrl: `${base}/${p.src}`,
        thumbnailUrl: `${base}/${p.src}`,
        creator: { '@id': `${base}/#person` },
        creditText: SITE.name,
        copyrightNotice: `© ${SITE.name}`,
        isPartOf: seriesTitle(p.series),
        ...(p.year ? { dateCreated: p.year } : {}),
        ...(p.location ? { contentLocation: { '@type': 'Place', name: p.location } } : {}),
      })),
    },
  ],
};

/* --- 3. Write everything ------------------------------------------------ */
const htmlPath = join(ROOT, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

function between(marker, body) {
  const open = `<!-- ${marker}:start -->`;
  const close = `<!-- ${marker}:end -->`;
  const re = new RegExp(`${open}[\\s\\S]*?${close}`);
  if (!re.test(html)) throw new Error(`missing ${open} … ${close} in index.html`);
  html = html.replace(re, `${open}\n${body}\n${close}`);
}

between('generated-grid', figures);
between('generated-jsonld',
  `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`);

writeFileSync(htmlPath, html);

writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${base}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
${PHOTOS.map((p) => `    <image:image>
      <image:loc>${base}/${p.src}</image:loc>
      <image:title>${esc(p.title)}</image:title>
      <image:caption>${esc(p.alt)}</image:caption>
    </image:image>`).join('\n')}
  </url>
</urlset>\n`);

writeFileSync(join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

console.log(`index.html   ${PHOTOS.length} figures + JSON-LD for ${PHOTOS.length} images`);
console.log(`sitemap.xml  ${PHOTOS.length} images`);
console.log(`robots.txt   sitemap -> ${base}/sitemap.xml`);
