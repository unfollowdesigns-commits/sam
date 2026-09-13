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
images/             photographs, resized to 1800px and stripped of EXIF
js/lqip.js          generated blur-up placeholders (see below)
tools/build-lqip.mjs
tools/find-dupes.mjs
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
loads, so the grid never jumps while you scroll. `location` is optional: leave it
off and the caption shows just the year.

Series live in the `SERIES` array; add, rename or reorder them freely and the
filters and the series index follow. Your name, tagline, intro, email and social
links are in `SITE` at the top of the same file.

### A note on image size

Export at around 2000px on the long edge and save as JPEG or WebP. The grid
never displays a frame wider than about 1100px, so anything larger is bandwidth
you're paying for and your visitors are waiting on.

## About the images currently in here

These are 17 frames pulled from the shared `photos` Drive folder, resized to
1800px on the long edge and re-encoded as progressive JPEG. **EXIF is stripped
on the way in** — several originals carried GPS coordinates, and those should
not ship to the open web. The `location` field in `js/data.js` was filled in by
hand from that GPS before it was discarded, and only on the frames that actually
had it; the rest show the year alone rather than a guessed place.

## The look

The site is set as printed matter rather than as a screen: a warm paper stock
with a little tooth in it, ink-dark as the alternate, a serif for titles and a
monospace for everything factual. Each frame is a catalogue entry — plate
number, title, then series / place / year as a data row under a hairline. Dark
mode follows the system; the toggle overrides and is remembered.

## Blur-up placeholders

`js/lqip.js` holds a 24px JPEG of every photograph as a data URI, painted
behind the real file so a frame arrives in its own colours instead of as an
empty box. It is generated, and the output is committed, so the site itself
still has no build step. After adding or replacing photographs:

```sh
npm i sharp          # dev-only, not a site dependency
node tools/build-lqip.mjs
```

## Checking for duplicates

The one mistake that makes a portfolio look careless is showing the same
picture twice, and it is easy to do when a negative has been scanned twice,
graded differently, or cropped again — the files differ, the photograph does
not. After adding anything to `images/`:

```sh
node tools/find-dupes.mjs
```

It compares a dHash of every image, which ignores scale, compression and
overall brightness, so it still catches two grades of one frame. Under ~6 bits
is almost always the same frame; 6-16 needs a look; above that it is usually
just two pictures with similar tone. Open the pair before deleting anything —
the tool reports, it does not decide.

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
  neighbouring frames preloaded so paging is instant. It flies out of the frame
  you clicked and back into wherever that frame has moved to
- **A link per photograph** — opening one sets `#f/<slug>`, and that link opens
  the viewer directly. Paging replaces the history entry; Back closes
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
