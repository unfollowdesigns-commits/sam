# Sam — photography portfolio

A single-page portfolio built as plain HTML, CSS and ES modules. No build step,
no framework, no dependencies — open `index.html` and it runs.

```
index.html          the page
css/crt.css         the gallery's styling
css/style.css       the journal's styling
js/data.js          ← the only file you need to edit
js/scene.js         the WebGL scene: mosaic, room, picture tube
js/viewer.js        full-screen viewer
js/main.js          copy, scroll, deep links, menu, loader
js/page.js          the small script the journal pages share
images/             photographs, resized to 1800px and stripped of EXIF
images/r/           generated: AVIF and WebP at 480/960/1440
journal/posts/      write a markdown file here to publish a post
js/sizes.js         generated: the widths that exist for each photograph
tools/build-responsive.mjs   AVIF and WebP derivatives
tools/build-journal.mjs      journal pages and feed.xml
tools/build-seo.mjs          gallery markup, FAQ, structured data, sitemap
tools/find-dupes.mjs         flags the same photograph published twice
sitemap.xml         generated
robots.txt          generated
llms.txt            generated
feed.xml            generated
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

`ratio` is worth getting right — it is the shape the print is hung at in the
room, before its file has even arrived. `location` is optional: leave it
off and the caption shows just the year.

Series live in the `SERIES` array; add, rename or reorder them freely and the
room, the series list and the menu follow. Keep each series' photographs
together in `PHOTOS` — the room hangs them in the order they are written. Your name, tagline, intro, email and social
links are in `SITE` at the top of the same file.

### A note on image size

Export at around 2000px on the long edge and save as JPEG or WebP. The room
hangs each print from its 960px derivative (480px on a phone); only the viewer
asks for more, and never for more than the screen can show.

## About the images currently in here

These are 17 frames pulled from the shared `photos` Drive folder, resized to
1800px on the long edge and re-encoded as progressive JPEG. **EXIF is stripped
on the way in** — several originals carried GPS coordinates, and those should
not ship to the open web. The `location` field in `js/data.js` was filled in by
hand from that GPS before it was discarded, and only on the frames that actually
had it; the rest show the year alone rather than a guessed place.

## The look

The gallery is the work played back on a monitor. Three things are drawn
behind the text, in plain WebGL with no library (`js/scene.js`):

- **The mosaic** — one photograph broken into raised blocks on a grid, behind
  the title and again behind About.
- **The room** — every photograph hung as a print in a white void, each series
  behind its title card. Scrolling walks the camera through it; the caption
  at the bottom left names the print it is standing in front of.
- **The tube** — the finished frame bent, scanned and smeared the way a
  monitor playing back tape would show it.

Type is Doto, a dot-matrix face, for names and titles, and IBM Plex Mono for
everything factual.

The room is for effect. **The viewer is where a photograph is shown whole**,
flat, uncropped and with nothing done to it — click a print, or use *View
whole* under its caption.

To change which photographs sit behind the title and About, edit `backdrops`
in `js/main.js`. The journal keeps its own printed-page look in
`css/style.css`.

## Rebuilding after you add photographs

The site has no build step — the generated files are committed. After
dropping anything new into `images/`:

```sh
npm i sharp                      # dev-only, not a site dependency
node tools/build-responsive.mjs  # AVIF/WebP at each width (skips what exists)
node tools/find-dupes.mjs        # check you have not published one twice
node tools/build-seo.mjs         # markup, structured data, sitemap
```

The derivatives matter: the originals are up to 670KB each, and without
`images/r/` a phone is sent all 7MB of them.

## Checking for duplicates

The one mistake that makes a portfolio look careless is showing the same
picture twice, and it is easy to do when a negative has been scanned twice,
graded differently, or cropped again — the files differ, the photograph does
not. After adding anything to `images/`:

```sh
node tools/find-dupes.mjs
tools/build-seo.mjs
sitemap.xml         generated
robots.txt          generated
```

It compares a dHash of every image, which ignores scale, compression and
overall brightness, so it still catches two grades of one frame. Under ~6 bits
is almost always the same frame; 6-16 needs a look; above that it is usually
just two pictures with similar tone. Open the pair before deleting anything —
the tool reports, it does not decide.

## Being found

The gallery is built by JavaScript, so a crawler that does not run scripts —
and most answer engines do not — would see an empty page where the work is.
`tools/build-seo.mjs` fixes that by writing three things into the repo:

1. **The gallery markup, into `index.html`** between `generated-grid` markers.
   Every photograph, plate number, caption and alt text is in the HTML source.
   With the scene running that list is kept off screen but stays reachable:
   a screen reader reads it, and tabbing to a photograph walks the camera to
   its print. Where the scene cannot run it is simply the gallery.
2. **JSON-LD** describing the photographer (`Person`), the site, and every
   photograph as an `ImageObject` carrying its creator, medium, year and place.
   This is what lets an answer engine say who made a picture and where.
3. **`sitemap.xml`** with image entries, and **`robots.txt`**.

Run it after editing `js/data.js` or adding photographs:

```sh
node tools/build-seo.mjs
```

**Set `SITE.url` first.** The canonical link, the sitemap and the structured
data all point at it, and the work cannot be attributed to you while it points
somewhere else. `SITE.summary` is the one-sentence description answer engines
tend to quote — keep it factual: who, what, where, in what medium.

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

- **Scroll-driven room** — the scroll is the browser's own (the work section
  is simply very tall), so the keyboard, the scrollbar, a trackpad and a thumb
  all work and nothing is intercepted
- **Series list and menu** that jump the camera to a series' title card
- **Full-screen viewer** — a native `<dialog>` with arrow keys, Escape, swipe,
  and neighbouring frames preloaded so paging is instant
- **A link per photograph** — opening one sets `#f/<slug>`, and that link opens
  the viewer directly. Paging replaces the history entry; Back closes
- **Lazy textures** — only the prints near the camera are loaded, and those far
  behind it are released
- **Reduced-motion support** — the tearing, the noise, the drift and the pointer
  parallax all stop for visitors who ask for it; the camera then moves only
  when they scroll
- **Degrades gracefully** — without WebGL, or with JavaScript off, the page is a
  dark page of text with every photograph in a plain column, and the loading
  screen never appears

## Typefaces

Doto and IBM Plex Mono on the gallery, Instrument Serif and IBM Plex Mono on
the journal, all loaded from Google Fonts with system monospace and serif
fallbacks. To self-host them instead, drop the files in and replace the
`<link>` in the page with an `@font-face` block.
