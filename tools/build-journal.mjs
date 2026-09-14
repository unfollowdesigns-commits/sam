/**
 * Builds the journal into real pages.
 *
 *   journal/index.html            the list
 *   journal/<slug>/index.html     one page per post
 *   feed.xml                      RSS, for readers and for aggregators
 *
 * Every post therefore has its own address that a crawler can reach without
 * running any JavaScript. A journal behind a hash route ('#/journal/…') is
 * invisible to search and to answer engines — it would be writing done for
 * nobody — which is the whole reason this generates files instead.
 *
 * Run after adding or editing anything in journal/posts/:
 *   node tools/build-journal.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../js/data.js';
import { readPosts, esc } from './posts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = SITE.url.replace(/\/$/, '');
const posts = readPosts();

const readable = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

/** Post bodies are written with paths from the site root; make them so. */
const rooted = (html) => html.replace(
  /\b(src|href)="(?!https?:|\/\/|\/|#|mailto:|data:)([^"]+)"/g, '$1="/$2'
);

/* --- The shell every page shares ---------------------------------------- */
function page({ up, title, description, canonical, head = '', body, ogImage, ogType = 'website' }) {
  const img = ogImage ? `${base}/${ogImage.replace(/^\//, '')}` : `${base}/images/hero.jpg`;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#eae6dc">
<link rel="canonical" href="${canonical}">
<meta name="author" content="${esc(SITE.name)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">

<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${img}">
<meta property="og:site_name" content="${esc(SITE.name)} — ${esc(SITE.role)}">
<meta property="og:locale" content="en">
<meta name="twitter:card" content="summary_large_image">

<link rel="alternate" type="application/rss+xml" title="${esc(SITE.name)} — Journal" href="${base}/feed.xml">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230b0b0c'/><circle cx='16' cy='16' r='6' fill='%23f2efe9'/></svg>">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${up}css/style.css">
${head}</head>
<body class="is-ready">

<header class="site-head" id="siteHead">
  <a class="site-head__mark" href="${up}" data-cursor="Home">
    <span>${esc(SITE.name)}</span>
    <em>${esc(SITE.role)}</em>
  </a>

  <nav class="site-nav" aria-label="Primary">
    <a href="${up}#work">Work</a>
    <a href="${up}#series">Series</a>
    <a href="${up}journal/">Journal</a>
    <a href="${up}#about">About</a>
    <a href="${up}#contact">Contact</a>
  </nav>

  <button class="theme-toggle" id="themeToggle" type="button" aria-pressed="true">
    <span class="theme-toggle__track"><i></i></span>
    <span class="visually-hidden">Switch between dark and light</span>
  </button>
</header>

<main class="journal" id="top">
${body}
</main>

<footer class="site-foot">
  <p>&copy; <span id="year"></span> ${esc(SITE.name)}. All photographs are the property of the artist.</p>
  <a href="#top" data-cursor="Top">Back to top</a>
</footer>

<script type="module" src="${up}js/page.js"></script>
</body>
</html>
`;
}

const ld = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>\n`;
const personRef = { '@id': `${base}/#person` };

/* The home page defines who Sam is. A journal page can be the first — and
   only — page an answer engine reads, so it carries the same definition
   rather than pointing at a node that is not on the page. Same @id, so the
   two are understood as one person and not two. */
const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${base}/#person`,
  name: SITE.name,
  jobTitle: SITE.role,
  description: SITE.summary,
  url: base,
  email: `mailto:${SITE.email}`,
  address: { '@type': 'PostalAddress', addressLocality: 'Tunis', addressCountry: 'TN' },
  sameAs: SITE.social.filter((s) => s.href.startsWith('http')).map((s) => s.href),
};

/* --- The index ----------------------------------------------------------- */
const list = posts.length
  ? posts.map((p, i) => `    <article class="entry">
      <a class="entry__link" href="/journal/${p.slug}/">
        <span class="entry__no">${String(posts.length - i).padStart(3, '0')}</span>
        <div class="entry__body">
          <h2 class="entry__title">${esc(p.title)}</h2>
          <p class="entry__summary">${esc(p.summary)}</p>
          <p class="entry__meta">
            <time datetime="${p.date}">${readable(p.date)}</time>
            <span>${p.minutes} min read</span>${p.tags.length ? `<span>${esc(p.tags.join(' · '))}</span>` : ''}
          </p>
        </div>
      </a>
    </article>`).join('\n')
  : `    <p class="journal__empty">Nothing here yet. Drop a markdown file into
       <code>journal/posts/</code> and run <code>node tools/build-journal.mjs</code>.</p>`;

mkdirSync(join(ROOT, 'journal'), { recursive: true });
writeFileSync(join(ROOT, 'journal', 'index.html'), page({
  up: '../',
  title: `Journal — ${SITE.name}`,
  description: `Writing on film, process and the work, by ${SITE.name}, photographer in Tunis.`,
  canonical: `${base}/journal/`,
  ogType: 'website',
  head: ld(person) + ld({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${base}/journal/#blog`,
    name: `Journal — ${SITE.name}`,
    description: `Writing on film, process and the work, by ${SITE.name}.`,
    url: `${base}/journal/`,
    inLanguage: 'en',
    author: personRef,
    publisher: personRef,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      '@id': `${base}/journal/${p.slug}/#post`,
      headline: p.title,
      datePublished: p.date,
      url: `${base}/journal/${p.slug}/`,
    })),
  }) + ld({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE.name, item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: `${base}/journal/` },
    ],
  }),
  body: `  <header class="opener opener--stacked">
    <span class="opener__plate">Journal</span>
    <h1 class="opener__title">Notes</h1>
    <p class="opener__note">On film, on process, and on what the lab sent back.
      ${posts.length} ${posts.length === 1 ? 'entry' : 'entries'}.</p>
  </header>

  <div class="entries">
${list}
  </div>`,
}));

/* --- One page per post ---------------------------------------------------- */
for (const [i, p] of posts.entries()) {
  const url = `${base}/journal/${p.slug}/`;
  const newer = posts[i - 1];
  const older = posts[i + 1];

  const nav = (newer || older) ? `
  <nav class="journal__around" aria-label="More entries">
    ${older ? `<a class="journal__around-link" href="/journal/${older.slug}/">
      <span>Older</span><strong>${esc(older.title)}</strong></a>` : '<span></span>'}
    ${newer ? `<a class="journal__around-link journal__around-link--next" href="/journal/${newer.slug}/">
      <span>Newer</span><strong>${esc(newer.title)}</strong></a>` : '<span></span>'}
  </nav>` : '';

  mkdirSync(join(ROOT, 'journal', p.slug), { recursive: true });
  writeFileSync(join(ROOT, 'journal', p.slug, 'index.html'), page({
    up: '../../',
    title: `${p.title} — ${SITE.name}`,
    description: p.summary,
    canonical: url,
    ogType: 'article',
    ogImage: p.cover ?? undefined,
    head: ld(person) + ld({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${url}#post`,
      headline: p.title,
      name: p.title,
      description: p.summary,
      articleBody: p.text,
      wordCount: p.words,
      datePublished: p.date,
      dateModified: p.updated,
      inLanguage: 'en',
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: personRef,
      publisher: personRef,
      isPartOf: { '@id': `${base}/journal/#blog` },
      ...(p.tags.length ? { keywords: p.tags.join(', ') } : {}),
      ...(p.cover ? {
        image: {
          '@type': 'ImageObject',
          contentUrl: `${base}/${p.cover.replace(/^\//, '')}`,
          caption: p.coverAlt || p.title,
          creditText: SITE.name,
          creator: personRef,
        },
      } : {}),
    }) + ld({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name, item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: 'Journal', item: `${base}/journal/` },
        { '@type': 'ListItem', position: 3, name: p.title, item: url },
      ],
    }),
    body: `  <article class="post">
    <header class="post__head">
      <p class="post__kicker"><a href="/journal/">Journal</a></p>
      <h1 class="post__title">${esc(p.title)}</h1>
      <p class="post__meta">
        <time datetime="${p.date}">${readable(p.date)}</time>
        <span>${p.minutes} min read</span>${p.tags.length ? `<span>${esc(p.tags.join(' · '))}</span>` : ''}
      </p>
    </header>
${p.cover ? `
    <figure class="post__cover">
      <img src="/${p.cover.replace(/^\//, '')}" alt="${esc(p.coverAlt)}" fetchpriority="high" decoding="async">
    </figure>` : ''}
    <div class="post__body">
${rooted(p.html).split('\n').map((l) => `      ${l}`).join('\n')}
    </div>
  </article>
${nav}`,
  }));
}

/* --- RSS ------------------------------------------------------------------ */
writeFileSync(join(ROOT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — Journal</title>
    <link>${base}/journal/</link>
    <description>Writing on film, process and the work, by ${esc(SITE.name)}.</description>
    <language>en</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/journal/${p.slug}/</link>
      <guid isPermaLink="true">${base}/journal/${p.slug}/</guid>
      <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`);

console.log(`journal/index.html   ${posts.length} ${posts.length === 1 ? 'entry' : 'entries'}`);
for (const p of posts) console.log(`  /journal/${p.slug}/`.padEnd(38), `${p.words} words`);
console.log(`feed.xml             ${posts.length} items`);
