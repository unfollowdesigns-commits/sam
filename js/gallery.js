/**
 * The grid, the series filter and the series index.
 *
 * The grid is re-rendered whenever the filter changes rather than toggling
 * visibility, so the editorial layout rhythm always reads correctly for
 * whatever is actually on screen.
 */
import { PHOTOS, SERIES } from './data.js';
import { SIZES } from './sizes.js';
import { layoutFor, sizesFor } from './layout.js';
import { PALETTE, FAMILIES } from './palette.js';

/**
 * The derivatives built by tools/build-responsive.mjs, as a srcset. Returns
 * null for anything that has none, so the original JPEG is simply used.
 */
function derivatives(src) {
  const info = SIZES[src];
  if (!info?.widths?.length) return null;
  const stem = src.replace(/^images\//, '').replace(/\.[^.]+$/, '');
  const set = (ext) => info.widths.map((w) => `images/r/${stem}-${w}.${ext} ${w}w`).join(', ');
  return { avif: set('avif'), webp: set('webp'), width: info.width, height: info.height };
}

const seriesTitle = (id) => SERIES.find((s) => s.id === id)?.title ?? id;

/** The caption's data line: what the frame recorded, 'Undated' where it did not. */
export const factsOf = (photo) =>
  [photo.location, photo.year || 'Undated'].filter(Boolean).join(' / ');

/** Stable, readable id for deep links: 'Red Arm' -> 'red-arm'. */
export const slugOf = (photo) =>
  photo.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function photoNode(photo, index, variant) {
  const fig = document.createElement('figure');
  fig.className = 'shot';
  fig.dataset.index = String(index);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shot__frame';
  button.style.setProperty('--ratio', String(photo.ratio ?? 1.5));

  button.setAttribute('aria-label', `Open ${photo.title} full screen`);

  // No blurred stand-in. A 24px copy of the photograph scaled up to full size
  // is a bad reproduction of the work, and it was on screen for over a second
  // on every frame the reader scrolled to — long enough to be read as the
  // photograph itself rather than as loading. The frame holds its shape in
  // plain stock and the picture arrives when it arrives.

  const img = document.createElement('img');
  img.alt = photo.alt || photo.title;
  img.loading = index < 2 ? 'eager' : 'lazy';
  img.decoding = 'async';

  // A frame that fails must not look like a frame that succeeded. Treating
  // the two the same left an empty <img> at full opacity over the blurred
  // stand-in, so a photograph that never arrived read as a photograph that
  // was simply blurry — and stayed that way for good.
  const arrived = () => {
    button.classList.remove('is-failed');
    button.classList.add('is-loaded');
  };
  const lost = () => {
    // One retry, because the common failure is a dropped connection rather
    // than a missing file. It drops to the original JPEG: if a derivative is
    // the thing that is missing, retrying the same one only fails again.
    if (!button.dataset.retried) {
      button.dataset.retried = '1';
      picture.querySelectorAll('source').forEach((el) => el.remove());
      setTimeout(() => { img.src = `${photo.src}?retry=1`; }, 400);
      return;
    }
    // Out of retries: say so, rather than leave an empty frame that is
    // indistinguishable from one still loading.
    button.classList.add('is-loaded', 'is-failed');
  };

  img.addEventListener('load', arrived);
  img.addEventListener('error', lost);

  // AVIF first, then WebP, then the original — the browser takes the first it
  // understands at the smallest width that still covers the frame. These are
  // film scans, and grain is the case WebP handles worst, which is why AVIF
  // is worth carrying as well rather than relying on WebP alone.
  const picture = document.createElement('picture');
  const alt = derivatives(photo.src);
  if (alt) {
    // What this particular frame is painted at, not an average over all of
    // them: the feature plate is 100vw and the marginal thumbnail is 28vw,
    // and one number for both leaves one soft and the other wasteful.
    const painted = sizesFor(variant);
    img.sizes = painted;
    img.width = alt.width;
    img.height = alt.height;
    for (const [type, srcset] of [['image/avif', alt.avif], ['image/webp', alt.webp]]) {
      const source = document.createElement('source');
      source.type = type;
      source.srcset = srcset;
      source.sizes = painted;
      picture.append(source);
    }
  }
  picture.append(img);
  img.src = photo.src;
  // Set after the listeners, but a cached file can still be complete by now
  // and fire nothing, so check rather than wait for an event that has passed.
  if (img.complete && img.naturalWidth > 0) arrived();

  button.append(picture);

  // Caption as a catalogue entry: plate number, title, then the recorded
  // facts as a data row under a hairline.
  const cap = document.createElement('figcaption');
  cap.className = 'shot__cap';
  cap.innerHTML =
    `<span class="shot__plate"></span>
     <span class="shot__name"></span>
     <span class="shot__where"></span>`;
  cap.querySelector('.shot__plate').textContent = String(index + 1).padStart(3, '0');
  cap.querySelector('.shot__name').textContent = photo.title;
  // The series is already named — by the running head in All work, by the
  // filter in a single series — so repeating it under all 38 frames is noise.
  // What is left is what this one frame recorded, and where it recorded
  // nothing the catalogue convention is to say so rather than leave the line
  // off: a third of these have no date, and a caption that simply stops reads
  // as unfinished where 'n.d.' reads as a record.
  cap.querySelector('.shot__where').textContent = factsOf(photo);

  fig.append(button, cap);
  return fig;
}

export function createGallery({ onOpen, observe }) {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('gridEmpty');
  const filters = document.getElementById('filters');
  const swatchBar = document.getElementById('swatches');

  let active = 'all';
  // Colour is a second axis, and it is the one that belongs to this work: the
  // scans are published as the lab returned them, so what the film did to the
  // colour is the constant running through everything. Several can be on at
  // once — a reader looking for the black and white and the green rolls wants
  // both, not one after the other.
  const colours = new Set();
  let visible = [];

  const listeners = [];

  function render() {
    const bySeries = active === 'all' ? PHOTOS : PHOTOS.filter((p) => p.series === active);
    visible = colours.size
      ? bySeries.filter((p) => colours.has(PALETTE[p.src]?.family))
      : bySeries;

    // Two ways of reading, not one. All the work is an editorial page you
    // scroll down; a single series is a strip you travel along sideways, the
    // way you would pull a contact sheet across a light table. Filtering by
    // colour cuts across the series, so it reads down the page like the whole
    // body of work does.
    const strip = active !== 'all' && !colours.size;
    grid.classList.toggle('is-strip', strip);
    grid.scrollLeft = 0;

    grid.replaceChildren();
    // Worked out before anything is built, because each frame needs to know
    // how wide it will be painted in order to ask for the right file.
    const plan = layoutFor(visible, { strip, grouped: !strip });

    for (const { kind, side, startsSeries, photo, index } of plan) {
      // In All work the six bodies of work ran together into one stream, so a
      // deliberate sequence read as a shuffle. Naming each one as it starts is
      // what turns a stream back into a sequence.
      if (startsSeries) grid.append(seriesMark(photo.series));

      const node = photoNode(photo, index, kind);
      node.classList.add(`shot--${kind}`);
      if (side) node.classList.add(`shot--${side}`);
      // In the strip every plate is already present; nothing is withheld.
      if (strip) node.classList.add('is-in');

      const frame = node.querySelector('.shot__frame');
      frame.addEventListener('click', () => onOpen(visible, index, frame));
      grid.append(node);
      if (!strip) observe(node);
    }

    empty.hidden = visible.length > 0;
    listeners.forEach((fn) => fn());
  }

  /** A hairline naming the body of work the next frames belong to. */
  function seriesMark(id) {
    const series = SERIES.find((x) => x.id === id);
    const count = visible.filter((p) => p.series === id).length;
    const el = document.createElement('div');
    el.className = 'series-mark reveal';
    el.innerHTML = '<span></span><em></em><b></b>';
    el.querySelector('span').textContent = series?.title ?? id;
    el.querySelector('em').textContent = series?.years ?? '';
    el.querySelector('b').textContent = `${count} ${count === 1 ? 'frame' : 'frames'}`;
    observe(el);
    return el;
  }

  function buildFilters() {
    const options = [{ id: 'all', title: 'All work' }, ...SERIES];
    options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.title;
      button.dataset.series = option.id;
      button.setAttribute('aria-pressed', String(option.id === active));
      button.addEventListener('click', () => setSeries(option.id));
      filters.append(button);
    });
  }

  function setSeries(id) {
    if (id === active) return;
    active = id;
    filters.querySelectorAll('button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.series === id))
    );
    render();
  }

  /* --- Colour -------------------------------------------------------------
     One chip per family, each painted with colours taken from the frames in
     that family rather than with a colour picked to represent it. The chip
     for the black and white work is grey because the work is grey.
     ---------------------------------------------------------------------- */
  function buildSwatches() {
    if (!swatchBar) return;

    for (const family of FAMILIES) {
      const members = PHOTOS.filter((p) => PALETTE[p.src]?.family === family.id);
      if (!members.length) continue;

      // The chip's own bar: the mid-tone of a handful of frames in the family,
      // so the reader is choosing from the actual colours on the rolls.
      const bar = members
        .slice(0, 5)
        .map((p) => PALETTE[p.src].swatches[3] ?? PALETTE[p.src].swatches.at(-1));

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.family = family.id;
      button.setAttribute('aria-pressed', 'false');
      button.title = family.note;
      button.innerHTML =
        `<span class="swatch__bar" aria-hidden="true"></span>
         <span class="swatch__name"></span>
         <span class="swatch__n"></span>`;
      button.querySelector('.swatch__bar').style.setProperty(
        '--bar', bar.map((c, i) => `${c} ${(i / bar.length) * 100}% ${((i + 1) / bar.length) * 100}%`).join(', ')
      );
      button.querySelector('.swatch__name').textContent = family.title;
      button.querySelector('.swatch__n').textContent = String(members.length);
      button.addEventListener('click', () => toggleColour(family.id));
      swatchBar.append(button);
    }

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'swatch swatch--clear';
    clear.textContent = 'Clear';
    clear.hidden = true;
    clear.addEventListener('click', () => {
      colours.clear();
      syncSwatches();
      render();
    });
    swatchBar.append(clear);
  }

  function toggleColour(id) {
    if (colours.has(id)) colours.delete(id);
    else colours.add(id);
    syncSwatches();
    render();
  }

  function syncSwatches() {
    if (!swatchBar) return;
    swatchBar.querySelectorAll('.swatch[data-family]').forEach((b) =>
      b.setAttribute('aria-pressed', String(colours.has(b.dataset.family)))
    );
    const clear = swatchBar.querySelector('.swatch--clear');
    if (clear) clear.hidden = colours.size === 0;
    swatchBar.classList.toggle('is-filtering', colours.size > 0);
  }

  /** How much room the strip still has in a given direction. */
  function stripRoom(delta) {
    const max = grid.scrollWidth - grid.clientWidth;
    if (delta < 0) return grid.scrollLeft > 1;
    return grid.scrollLeft < max - 1;
  }

  // A vertical wheel carries you along the strip. At either end the page
  // takes the scroll back, so you are never trapped in the sequence.
  grid.addEventListener('wheel', (e) => {
    if (!grid.classList.contains('is-strip')) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (!stripRoom(e.deltaY)) return;
    e.preventDefault();
    grid.scrollLeft += e.deltaY;
  }, { passive: false });

  // Arrow keys step plate by plate, once the strip is the thing in view.
  addEventListener('keydown', (e) => {
    if (!grid.classList.contains('is-strip')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!document.getElementById('lightbox').hidden) return;
    const box = grid.getBoundingClientRect();
    if (box.bottom < 120 || box.top > innerHeight - 120) return;
    e.preventDefault();
    const step = grid.clientWidth * 0.55;
    grid.scrollBy({ left: e.key === 'ArrowRight' ? step : -step, behavior: 'smooth' });
  });

  buildFilters();
  buildSwatches();
  render();

  /** Find a frame by slug across the whole set, ignoring the active filter. */
  function find(slug) {
    const all = PHOTOS;
    const index = all.findIndex((p) => slugOf(p) === slug);
    return index === -1 ? null : { list: all, index };
  }

  /** The element showing a photograph right now, if it is on screen. */
  function frameFor(photo) {
    const i = visible.indexOf(photo);
    return i === -1 ? null : grid.children[i]?.querySelector('.shot__frame') ?? null;
  }

  /** Called after every render, so anything holding node references can refresh. */
  function onRender(fn) { listeners.push(fn); }

  return { setSeries, find, frameFor, onRender, count: PHOTOS.length };
}

/**
 * The series index: a list of titles that reveals a floating preview of the
 * series' first frame as the pointer travels down it.
 */
export function createSeriesIndex({ onSelect, observe }) {
  const list = document.getElementById('indexList');
  const preview = document.getElementById('indexPreview');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  SERIES.forEach((series) => {
    const shots = PHOTOS.filter((p) => p.series === series.id);
    const row = document.createElement('li');
    row.className = 'index-row reveal';

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cursor = 'See';
    button.innerHTML =
      `<span class="index-row__title"></span>
       <span class="index-row__side"><span class="years"></span><span class="tally"></span></span>`;
    button.querySelector('.index-row__title').textContent = series.title;
    button.querySelector('.years').textContent = series.years;
    button.querySelector('.tally').textContent = `${shots.length} frames`;

    button.addEventListener('click', () => onSelect(series.id));

    if (fine && shots[0]) {
      const img = document.createElement('img');
      img.src = shots[0].src;
      img.alt = '';
      img.loading = 'lazy';

      button.addEventListener('pointerenter', () => {
        preview.replaceChildren(img);
        preview.classList.add('is-visible');
      });
      button.addEventListener('pointerleave', () =>
        preview.classList.remove('is-visible')
      );
    }

    row.append(button);
    list.append(row);
    observe(row);
  });

  if (!fine) return;

  // The preview trails the pointer with a little easing.
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let px = x;
  let py = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
  }, { passive: true });

  (function follow() {
    px += (x - px) * 0.12;
    py += (y - py) * 0.12;
    preview.style.translate = `${px}px ${py}px`;
    requestAnimationFrame(follow);
  })();
}

export { seriesTitle };
