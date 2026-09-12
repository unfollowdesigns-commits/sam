/**
 * The grid, the series filter and the series index.
 *
 * The grid is re-rendered whenever the filter changes rather than toggling
 * visibility, so the editorial layout rhythm always reads correctly for
 * whatever is actually on screen.
 */
import { PHOTOS, SERIES } from './data.js';
import { LQIP } from './lqip.js';

/* Width/offset patterns, cycled to keep the page from settling into a grid. */
const RHYTHM = ['a', 'b', 'c', 'd', 'e', 'f'];

const seriesTitle = (id) => SERIES.find((s) => s.id === id)?.title ?? id;

/** Stable, readable id for deep links: 'Red Arm' -> 'red-arm'. */
export const slugOf = (photo) =>
  photo.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function photoNode(photo, index) {
  const fig = document.createElement('figure');
  fig.className = 'shot';
  fig.dataset.index = String(index);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shot__frame';
  button.style.setProperty('--ratio', String(photo.ratio ?? 1.5));
  button.dataset.cursor = 'View';
  button.setAttribute('aria-label', `Open ${photo.title} full screen`);

  // The blurred stand-in sits behind the real file and is revealed through it,
  // so a frame arrives in its own colours rather than as an empty box.
  const seed = LQIP[photo.src];
  if (seed) button.style.backgroundImage = `url("${seed}")`;

  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.alt || photo.title;
  img.loading = index < 2 ? 'eager' : 'lazy';
  img.decoding = 'async';
  const settle = () => button.classList.add('is-loaded');
  if (img.complete) settle();
  else img.addEventListener('load', settle, { once: true });
  img.addEventListener('error', settle, { once: true });
  button.append(img);

  const cap = document.createElement('figcaption');
  cap.className = 'shot__cap';
  cap.innerHTML =
    `<span class="shot__name"></span><span class="shot__where"></span>`;
  cap.querySelector('.shot__name').textContent = photo.title;
  cap.querySelector('.shot__where').textContent =
    [photo.location, photo.year].filter(Boolean).join(' · ');

  fig.append(button, cap);
  return fig;
}

export function createGallery({ onOpen, observe }) {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('gridEmpty');
  const filters = document.getElementById('filters');

  let active = 'all';
  let visible = [];

  function render() {
    visible = active === 'all' ? PHOTOS : PHOTOS.filter((p) => p.series === active);

    grid.replaceChildren();
    let step = 0;
    visible.forEach((photo, i) => {
      const node = photoNode(photo, i);
      // A feature frame spans wide and restarts the rhythm underneath it.
      if (photo.feature && active === 'all') {
        node.classList.add('shot--wide');
        step = 0;
      } else {
        node.classList.add(`shot--${RHYTHM[step++ % RHYTHM.length]}`);
      }
      const frame = node.querySelector('.shot__frame');
      frame.addEventListener('click', () => onOpen(visible, i, frame));
      grid.append(node);
      observe(node);
    });

    empty.hidden = visible.length > 0;
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

  buildFilters();
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

  return { setSeries, find, frameFor, count: PHOTOS.length };
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
