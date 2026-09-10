# Sam — photography portfolio

A single-page portfolio built as plain HTML, CSS and ES modules. No build step,
no framework, no dependencies — open `index.html` and it runs.

```
index.html          the page
css/style.css       all styling
js/data.js          ← the only file you need to edit
js/gallery.js       grid, filters, series index
js/lightbox.js      full-screen viewer
js/main.js          copy, theme, loader, cursor, scroll
images/             photographs (placeholders for now)
tools/              placeholder generator (not needed once you add real photos)
```

## Adding your photographs

Everything on the page — your name, the intro, the series, every frame and its
caption — comes from `js/data.js`.

1. Put your files in `images/`.
2. Point each entry's `src` at one and fill in the caption fields:

```js
{
  src: 'images/dunes-at-dusk.jpg',
  alt: 'Wind-cut dunes under a low sun',   // read aloud by screen readers
  title: 'Dunes at Dusk',
  series: 'coast',                          // must match an id in SERIES
  location: 'Comporta, PT',
  year: '2025',
  ratio: 3 / 2,                             // width / height
  feature: true,                            // optional: spans the grid wide
}
```

`ratio` is worth getting right — it reserves the correct space before the image
loads, so the grid never jumps while you scroll.

Series live in the `SERIES` array; add, rename or reorder them freely and the
filters and the series index follow. Your name, tagline, intro, email and social
links are in `SITE` at the top of the same file.

### A note on image size

Export at around 2000px on the long edge and save as JPEG or WebP. The grid
never displays a frame wider than about 1100px, so anything larger is bandwidth
you're paying for and your visitors are waiting on.

## The placeholder images

`images/*.svg` are generated stand-ins — seeded gradient fields with grain and a
vignette — so the layout can be judged with something in it. Regenerate them
with `node tools/gen-placeholders.mjs`. Once your own photographs are in, delete
the SVGs and `tools/` entirely; nothing else refers to them.

## Running it locally

The page uses ES modules, which browsers refuse to load over `file://`. Serve
the folder instead:

```sh
python3 -m http.server 8000    # then open http://localhost:8000
```

## Deploying

It is a static site, so anything that serves files will do — GitHub Pages,
Netlify, Vercel, Cloudflare Pages, or plain object storage. There is nothing to
build: publish the repository root as-is.

For GitHub Pages: Settings → Pages → deploy from a branch, pick the branch and
`/ (root)`.

## What's built in

- **Series filter** that re-flows the editorial grid for whatever it's showing
- **Full-screen viewer** with arrow keys, Escape, swipe, focus trapping, and
  neighbouring frames preloaded so paging is instant
- **Series index** with a preview that trails the pointer
- **Light and dark themes**, following the system by default and remembered once
  the visitor chooses
- **Reduced-motion support** — every reveal, parallax and custom cursor turns off
  for visitors who ask for it
- **Degrades gracefully** — with JavaScript off, the hero, about and contact
  sections still render and the loading curtain never appears

## Typefaces

Instrument Serif and Inter, loaded from Google Fonts, with Iowan Old Style /
Georgia and the system sans as fallbacks. To self-host them instead, drop the
files in and replace the `<link>` in `index.html` with an `@font-face` block.
