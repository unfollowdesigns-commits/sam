/**
 * Reads the journal.
 *
 * A post is one markdown file in journal/posts/, with a short frontmatter
 * block at the top. To publish, drop a file in that folder and run
 * `node tools/build-journal.mjs` — there is nothing else to register.
 *
 *   ---
 *   title: What the lab sent back
 *   date: 2022-03-14
 *   summary: One sentence. This is what shows in search results.
 *   cover: images/latent-01.jpg
 *   coverAlt: A red light leak across a bare arm
 *   tags: 35mm, process
 *   ---
 *
 *   The body starts here.
 *
 * `title` and `date` are required. Everything else is optional, and an
 * absent field is simply left out rather than filled with something invented.
 *
 * The markdown understood here is deliberately small, because it is all that
 * writing about photographs needs: headings, paragraphs, emphasis, links,
 * images, block quotes, lists, and a rule. A line that starts with `<` is
 * passed through as HTML, so anything missing can still be written directly.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const POSTS_DIR = join(ROOT, 'journal', 'posts');

export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const slugify = (s) => String(s).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Inline markup, applied inside a block once its wrapper is decided. */
function inline(text) {
  return esc(text)
    // Images and links before emphasis, so a URL with underscores survives.
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, alt, src) => `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const external = /^https?:/.test(href);
      return `<a href="${href}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // An em dash written as -- , because it is easier to type than —.
    .replace(/(\s)--(\s)/g, '$1—$2');
}

/** Blocks, split on blank lines. */
export function markdown(src) {
  const out = [];
  for (const raw of src.trim().split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;

    if (block.startsWith('<')) { out.push(block); continue; }

    if (/^---+$/.test(block)) { out.push('<hr class="journal__rule">'); continue; }

    const heading = block.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (block.split('\n').every((l) => l.startsWith('> '))) {
      const body = block.split('\n').map((l) => l.slice(2)).join(' ');
      out.push(`<blockquote><p>${inline(body)}</p></blockquote>`);
      continue;
    }

    if (block.split('\n').every((l) => /^[-*]\s+/.test(l))) {
      const items = block.split('\n')
        .map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('\n');
      out.push(`<ul>\n${items}\n</ul>`);
      continue;
    }

    if (block.split('\n').every((l) => /^\d+[.)]\s+/.test(l))) {
      const items = block.split('\n')
        .map((l) => `<li>${inline(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('\n');
      out.push(`<ol>\n${items}\n</ol>`);
      continue;
    }

    // A paragraph that is nothing but one image becomes a figure, so a
    // photograph dropped into the text sits on the page like a plate.
    const lone = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (lone) {
      const caption = lone[1] ? `\n  <figcaption>${inline(lone[1])}</figcaption>` : '';
      out.push(`<figure class="journal__plate">\n  <img src="${lone[2]}" alt="${esc(lone[1])}" loading="lazy" decoding="async">${caption}\n</figure>`);
      continue;
    }

    out.push(`<p>${inline(block.replace(/\n/g, ' '))}</p>`);
  }
  return out.join('\n');
}

/** Strips markup back to sentences, for meta descriptions and word counts. */
export const plain = (src) => src
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/^[>#\-*\d.)\s]+/gm, ' ')
  .replace(/[*`_]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

function frontmatter(text, file) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing the --- frontmatter block at the top`);

  const meta = {};
  for (const line of m[1].split('\n')) {
    const pair = line.match(/^([A-Za-z][\w]*)\s*:\s*(.*)$/);
    if (pair) meta[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, '');
  }
  return [meta, m[2]];
}

export function readPosts() {
  if (!existsSync(POSTS_DIR)) return [];

  const files = readdirSync(POSTS_DIR).filter((f) =>
    // README.md documents the folder, and a leading underscore is the
    // conventional way to park a file here without publishing it.
    f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'));

  const posts = files.map((file) => {
    const [meta, body] = frontmatter(readFileSync(join(POSTS_DIR, file), 'utf8'), file);
    if (!meta.title) throw new Error(`${file}: needs a title`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? '')) {
      throw new Error(`${file}: needs a date as YYYY-MM-DD`);
    }

    const text = plain(body);
    return {
      file,
      slug: meta.slug || slugify(meta.title),
      title: meta.title,
      date: meta.date,
      updated: meta.updated || meta.date,
      // Falls back to the opening sentences rather than leaving search
      // results to guess, but never invents a summary that is not in the text.
      summary: meta.summary || `${text.slice(0, 155).replace(/\s\S*$/, '')}…`,
      cover: meta.cover || null,
      coverAlt: meta.coverAlt || '',
      tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      draft: String(meta.draft).toLowerCase() === 'true',
      body,
      html: markdown(body),
      text,
      words: text ? text.split(/\s+/).length : 0,
      minutes: Math.max(1, Math.round((text.split(/\s+/).length || 0) / 220)),
    };
  });

  const slugs = new Set();
  for (const p of posts) {
    if (slugs.has(p.slug)) throw new Error(`two posts share the address /journal/${p.slug}/`);
    slugs.add(p.slug);
  }

  // Newest first — a journal is read from the top.
  return posts.filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date));
}
