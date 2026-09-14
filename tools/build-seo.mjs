/**
 * Makes the site legible to search engines and to answer engines.
 *
 * The gallery, the FAQ and the journal are the site's evidence that Sam is a
 * photographer, works in Tunis, shoots 35mm and takes commissions. A crawler
 * that does not run JavaScript — and most answer engines do not — has to be
 * able to read all of that out of the HTML source. This writes it there:
 *
 *   1. index.html  the gallery markup and the FAQ, injected between markers,
 *                  plus one JSON-LD graph describing the person, the studio,
 *                  the gallery, every photograph, the journal and the FAQ.
 *   2. sitemap.xml every address on the site, with dates.
 *   3. robots.txt  and a pointer to the sitemap.
 *   4. llms.txt    the same facts in plain text, for the answer engines that
 *                  read it in preference to parsing a page.
 *   5. images/og.jpg  a 1200x630 preview, because social and search previews
 *                  crop anything else badly.
 *
 * Run after changing js/data.js, adding photographs, or writing a post:
 *   node tools/build-journal.mjs && node tools/build-seo.mjs
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SITE, SERIES, PHOTOS } from '../js/data.js';
import { SIZES } from '../js/sizes.js';
import { readPosts } from './posts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = SITE.url.replace(/\/$/, '');
const posts = readPosts();
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slugOf = (p) => p.title.toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const seriesTitle = (id) => SERIES.find((s) => s.id === id)?.title ?? id;
const factsOf = (p) => [seriesTitle(p.series), p.location, p.year].filter(Boolean);

/* --- 1. Gallery markup, so the work exists without JavaScript ----------- */
// This has to name exactly the same files the script will ask for once it
// runs, because the script clears the grid and rebuilds it. If the two
// disagree, the browser downloads the whole gallery twice — once for the
// markup it is about to throw away, and again for what replaces it. Matching
// URLs make the rebuild a cache hit and cost nothing.
const PAINTED_AT = '(max-width: 749px) 94vw, 60vw';

const srcsetFor = (src, ext) => {
  const info = SIZES[src];
  if (!info?.widths?.length) return null;
  const stem = src.replace(/^images\//, '').replace(/\.[^.]+$/, '');
  return info.widths.map((w) => `images/r/${stem}-${w}.${ext} ${w}w`).join(', ');
};

const figures = PHOTOS.map((p, i) => {
  const plate = String(i + 1).padStart(3, '0');
  // Real pixel dimensions, so a crawler — and a browser that has not loaded
  // the stylesheet yet — reserves the right box and the page does not shift.
  const w = SIZES[p.src]?.width ?? 1800;
  const h = SIZES[p.src]?.height ?? Math.round(w / p.ratio);
  const avif = srcsetFor(p.src, 'avif');
  const webp = srcsetFor(p.src, 'webp');
  const sources = avif && webp
    ? `\n            <source type="image/avif" srcset="${avif}" sizes="${PAINTED_AT}">`
      + `\n            <source type="image/webp" srcset="${webp}" sizes="${PAINTED_AT}">`
    : '';
  return `      <figure class="shot" data-index="${i}" id="plate-${plate}">
        <a class="shot__frame" href="#f/${slugOf(p)}" style="--ratio:${p.ratio}" aria-label="Open ${esc(p.title)} full screen">
          <picture>${sources}
            <img src="${p.src}"${avif ? ` sizes="${PAINTED_AT}"` : ''} alt="${esc(p.alt)}" width="${w}" height="${h}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
          </picture>
        </a>
        <figcaption class="shot__cap">
          <span class="shot__plate">${plate}</span>
          <span class="shot__name">${esc(p.title)}</span>
          <span class="shot__where">${esc(factsOf(p).join(' / '))}</span>
        </figcaption>
      </figure>`;
}).join('\n');

/* --- 2. The FAQ, on the page and in the graph --------------------------- */
const faqMarkup = `      <dl class="about__faq reveal">
${SITE.faq.map(({ q, a }) => `        <div>
          <dt>${esc(q)}</dt>
          <dd>${esc(a)}</dd>
        </div>`).join('\n')}
      </dl>`;

/* --- 3. Structured data -------------------------------------------------- */
const personId = `${base}/#person`;
const person = {
  '@type': 'Person',
  '@id': personId,
  name: SITE.name,
  jobTitle: SITE.role,
  description: SITE.summary,
  email: `mailto:${SITE.email}`,
  url: base,
  image: `${base}/images/og.jpg`,
  knowsAbout: ['Film photography', '35mm photography', 'Portrait photography',
    'Fashion photography', 'Jewellery photography', 'Street photography'],
  knowsLanguage: ['en', 'ar', 'fr'],
  address: { '@type': 'PostalAddress', addressLocality: 'Tunis', addressCountry: 'TN' },
  sameAs: SITE.social.filter((s) => s.href.startsWith('http')).map((s) => s.href),
};

/* The practice as a thing that can be hired, which is a different question
   from who Sam is, and the one that local and commercial search asks. */
const studio = {
  '@type': 'ProfessionalService',
  '@id': `${base}/#studio`,
  name: `${SITE.name} — ${SITE.role}`,
  description: `Editorial, portrait, fashion and jewellery photography on 35mm film, by ${SITE.name}, based in Tunis and working in Tunis and London.`,
  url: base,
  image: `${base}/images/og.jpg`,
  email: `mailto:${SITE.email}`,
  founder: { '@id': personId },
  employee: { '@id': personId },
  priceRange: '$$',
  address: { '@type': 'PostalAddress', addressLocality: 'Tunis', addressCountry: 'TN' },
  areaServed: [
    { '@type': 'City', name: 'Tunis' },
    { '@type': 'City', name: 'London' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Commissions',
    itemListElement: SITE.services.map((service) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: service, provider: { '@id': personId } },
    })),
  },
};

const images = PHOTOS.map((p) => ({
  '@type': 'ImageObject',
  '@id': `${base}/#f/${slugOf(p)}`,
  name: p.title,
  caption: p.alt,
  // The editorial note goes in as well where there is one, so the writing on
  // the plate is quotable rather than only the screen-reader description.
  description: [p.note, p.alt, ...factsOf(p)].filter(Boolean).join('. '),
  contentUrl: `${base}/${p.src}`,
  thumbnailUrl: `${base}/${p.src}`,
  creator: { '@id': personId },
  copyrightHolder: { '@id': personId },
  creditText: SITE.name,
  copyrightNotice: `© ${SITE.name}`,
  // Google shows a licensable badge in Images only when both of these exist.
  license: `${base}/#contact`,
  acquireLicensePage: `${base}/#contact`,
  isPartOf: seriesTitle(p.series),
  ...(p.year ? { dateCreated: p.year } : {}),
  ...(p.location ? { contentLocation: { '@type': 'Place', name: p.location } } : {}),
}));

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    person,
    studio,
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: base,
      name: `${SITE.name} — ${SITE.role}`,
      description: SITE.summary,
      inLanguage: 'en',
      publisher: { '@id': personId },
      copyrightHolder: { '@id': personId },
    },
    {
      '@type': 'WebPage',
      '@id': `${base}/#webpage`,
      url: `${base}/`,
      name: `${SITE.name} — ${SITE.role}`,
      description: SITE.summary,
      isPartOf: { '@id': `${base}/#website` },
      about: { '@id': personId },
      primaryImageOfPage: { '@id': images[0]['@id'] },
      dateModified: today,
      // Names the two blocks a voice assistant should read aloud.
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.hero__sub', '.about__lead'],
      },
      breadcrumb: { '@id': `${base}/#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${base}/#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name, item: `${base}/` },
      ],
    },
    {
      '@type': 'ImageGallery',
      '@id': `${base}/#work`,
      name: 'Selected work',
      description: `${PHOTOS.length} photographs, ${SERIES.map((s) => s.title).join(', ')}.`,
      numberOfItems: PHOTOS.length,
      author: { '@id': personId },
      isPartOf: { '@id': `${base}/#webpage` },
      associatedMedia: images,
    },
    {
      '@type': 'FAQPage',
      '@id': `${base}/#faq`,
      isPartOf: { '@id': `${base}/#webpage` },
      mainEntity: SITE.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    ...(posts.length ? [{
      '@type': 'Blog',
      '@id': `${base}/journal/#blog`,
      name: `Journal — ${SITE.name}`,
      url: `${base}/journal/`,
      author: { '@id': personId },
      publisher: { '@id': personId },
      blogPost: posts.map((p) => ({
        '@type': 'BlogPosting',
        '@id': `${base}/journal/${p.slug}/#post`,
        headline: p.title,
        description: p.summary,
        datePublished: p.date,
        dateModified: p.updated,
        url: `${base}/journal/${p.slug}/`,
        author: { '@id': personId },
      })),
    }] : []),
  ],
};

/* --- 4. Write into index.html -------------------------------------------- */
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
between('generated-faq', faqMarkup);
between('generated-jsonld',
  `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`);

writeFileSync(htmlPath, html);

/* --- 5. sitemap.xml ------------------------------------------------------ */
const lastmodOf = (rel) => {
  try { return statSync(join(ROOT, rel)).mtime.toISOString().slice(0, 10); }
  catch { return today; }
};

const urls = [
  { loc: `${base}/`, lastmod: lastmodOf('index.html'), priority: '1.0', changefreq: 'monthly',
    images: PHOTOS },
  ...(posts.length
    ? [{ loc: `${base}/journal/`, lastmod: posts[0].date, priority: '0.8', changefreq: 'weekly' }]
    : []),
  ...posts.map((p) => ({
    loc: `${base}/journal/${p.slug}/`,
    lastmod: p.updated,
    priority: '0.7',
    changefreq: 'yearly',
    images: p.cover ? [{ src: p.cover, title: p.title, alt: p.coverAlt || p.title }] : [],
  })),
];

writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${(u.images ?? []).map((p) => `
    <image:image>
      <image:loc>${base}/${p.src}</image:loc>
      <image:title>${esc(p.title)}</image:title>
      <image:caption>${esc(p.alt)}</image:caption>
    </image:image>`).join('')}
  </url>`).join('\n')}
</urlset>
`);

/* --- 6. robots.txt ------------------------------------------------------- */
writeFileSync(join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

/* --- 7. llms.txt --------------------------------------------------------- */
writeFileSync(join(ROOT, 'llms.txt'),
  `# ${SITE.name} — ${SITE.role}

> ${SITE.summary}

The site holds ${PHOTOS.length} photographs in ${SERIES.length} series, made \
between ${SITE.since} and 2022, on ${SITE.formats.replace(' · ', ' and ').toLowerCase()}.

Contact: ${SITE.email}
Available for: ${SITE.services.join(', ').toLowerCase()}

## Series

${SERIES.map((s) => {
  const n = PHOTOS.filter((p) => p.series === s.id).length;
  return `- **${s.title}** (${s.years}) — ${n} ${n === 1 ? 'photograph' : 'photographs'}`;
}).join('\n')}

## Questions

${SITE.faq.map(({ q, a }) => `**${q}**\n${a}`).join('\n\n')}
${posts.length ? `
## Journal

${posts.map((p) => `- [${p.title}](${base}/journal/${p.slug}/) — ${p.date}. ${p.summary}`).join('\n')}
` : ''}
## Pages

- [${base}/](${base}/) — the work, about and contact
${posts.length ? `- [${base}/journal/](${base}/journal/) — writing\n` : ''}\
- [${base}/sitemap.xml](${base}/sitemap.xml)

## Use

All photographs are the property of ${SITE.name}. Reproduction requires \
permission; enquiries to ${SITE.email}.
`);

/* --- 8. The social preview image ----------------------------------------- */
// Previews are cropped to roughly 1.91:1 wherever they appear. Letting each
// platform crop the hero its own way means never knowing what is shown, so
// the crop is decided here, once.
const OG = join(ROOT, 'images', 'og.jpg');
await sharp(join(ROOT, PHOTOS.find((p) => p.feature)?.src ?? PHOTOS[0].src))
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OG);

console.log(`index.html   ${PHOTOS.length} figures, ${SITE.faq.length} FAQ entries, JSON-LD graph of ${graph['@graph'].length} nodes`);
console.log(`sitemap.xml  ${urls.length} urls, ${PHOTOS.length} images`);
console.log(`robots.txt   sitemap -> ${base}/sitemap.xml`);
console.log(`llms.txt     ${SERIES.length} series, ${SITE.faq.length} questions, ${posts.length} posts`);
console.log(`images/og.jpg 1200x630 preview`);

if (/example\.com|vercel\.app/.test(base)) {
  console.log(`\n!  SITE.url is ${base}`);
  console.log('!  Every canonical, sitemap entry and JSON-LD @id above points there.');
  console.log('!  Until it is the real domain, none of this can be attributed to you.');
}
