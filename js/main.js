/**
 * The page: copy from js/data.js, the scroll that drives the room, the
 * address bar, the menu and the loader.
 *
 * The scroll is the browser's own. The work section is simply very tall, and
 * how far through it the visitor has scrolled is where the camera stands —
 * so the keyboard, the scrollbar, a trackpad and a thumb all work without
 * anything being intercepted.
 */
import { SITE, SERIES, PHOTOS } from './data.js';
import { createScene } from './scene.js';
import { createViewer } from './viewer.js';

window.samRunning = true;   // tells the page's own fallback the script arrived
const root = document.documentElement;
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const seriesTitle = (id) => SERIES.find((s) => s.id === id)?.title ?? id;
/** The caption's data line: what the frame recorded, 'Undated' where it did not. */
const factsOf = (photo) => [photo.location, photo.year || 'Undated'].filter(Boolean).join(' / ');
/** Stable, readable id for deep links: 'Red Arm' -> 'red-arm'. */
const slugOf = (photo) =>
  photo.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SLUGS = PHOTOS.map(slugOf);

/* --- Copy ---------------------------------------------------------------- */
const years = PHOTOS.map((p) => Number(p.year)).filter(Boolean);
const span = `${Math.min(...years)} — ${Math.max(...years)}`;

$('titlePlace').textContent = SITE.location;
$('titleYears').textContent = span;
$('titleCount').textContent = `${PHOTOS.length} frames`;
$('titleFormat').textContent = SITE.formats;
$('titleLine').textContent = SITE.tagline;
$('titleYear').textContent = `©${new Date().getFullYear()}`;
$('aboutLead').textContent = SITE.intro;
$('aboutLocation').textContent = SITE.location;
$('aboutSince').textContent = SITE.since;
$('aboutFormats').textContent = SITE.formats;
$('aboutServices').replaceChildren(...SITE.services.map((s, i) => {
  const li = document.createElement('li');
  li.textContent = `[${pad(i + 1)}] ${s}`;
  return li;
}));
$('contactMail').textContent = SITE.email;
$('contactMail').href = `mailto:${SITE.email}`;
$('contactSocial').replaceChildren(...SITE.social.filter((s) => !s.href.startsWith('#')).map((s) => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = s.href; a.textContent = s.label; a.rel = 'noopener';
  li.append(a);
  return li;
}));
$('year').textContent = String(new Date().getFullYear());

/* --- The room, in order: a label, then that series' prints --------------- */
const items = [];
const slotOfPhoto = [];
const slotOfSeries = {};
SERIES.forEach((series, n) => {
  const prints = PHOTOS.map((p, index) => ({ p, index })).filter(({ p }) => p.series === series.id);
  if (!prints.length) return;
  slotOfSeries[series.id] = items.length;
  items.push({ kind: 'label', text: `${pad(n + 1)} ${series.title.toUpperCase()}`, sub: `${series.years}  /  ${pad(prints.length)} FRAMES` });
  for (const { p, index } of prints) {
    slotOfPhoto[index] = items.length;
    items.push({ kind: 'print', src: p.src, ratio: p.ratio, index });
  }
});
const FIRST = -1.4;                 // the camera starts short of the first label
const LAST = items.length - 0.4;    // and ends just past the last print

/* --- Series list ---------------------------------------------------------- */
const list = $('seriesList');
const seriesButtons = {};
SERIES.forEach((series, n) => {
  if (!(series.id in slotOfSeries)) return;
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = `[${pad(n + 1)}] ${series.title}`;
  b.addEventListener('click', () => goToSlot(slotOfSeries[series.id] + 0.55));
  li.append(b);
  list.append(li);
  seriesButtons[series.id] = b;

  const m = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#work';
  a.textContent = `[${pad(n + 1)}] ${series.title}`;
  a.addEventListener('click', (e) => {
    e.preventDefault();
    $('menu').close();
    goToSlot(slotOfSeries[series.id] + 0.55);
  });
  m.append(a);
  $('menuSeries').append(m);
});

/* --- Scene ---------------------------------------------------------------- */
const fontsReady = Promise.all([
  document.fonts.load('900 48px Doto'),
  document.fonts.load('500 16px "IBM Plex Mono"'),
]).catch(() => {});

const scene = root.classList.contains('gl')
  ? createScene($('scene'), {
    items,
    backdrops: { title: 'images/hero.jpg', about: 'images/concrete-01.jpg' },
    still: reduced,
  })
  : null;
/* No WebGL: the page stays as it is in the HTML — text and a plain column
   of photographs — and nothing below that needs the scene runs. */
if (!scene) root.classList.remove('gl');

const work = $('work');
const about = $('about');
const hero = $('hero');
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

if (scene) {
  /* Tall enough that each slot gets about half a screen of scrolling. */
  work.style.setProperty('--slots', String(items.length));
}

function slotAt() {
  const r = work.getBoundingClientRect();
  const travel = r.height - innerHeight;
  if (r.top > 0) return FIRST - (r.top / innerHeight) * 1.2;
  return FIRST + Math.min(1, -r.top / travel) * (LAST - FIRST);
}

function goToSlot(slot, behavior = 'auto') {
  if (!scene) { work.scrollIntoView(); return; }
  const top = work.getBoundingClientRect().top + scrollY;
  const travel = work.offsetHeight - innerHeight;
  scrollTo({ top: top + ((slot - FIRST) / (LAST - FIRST)) * travel, behavior });
}

let current = -1;
function caption(index) {
  if (index === current) return;
  current = index;
  const photo = PHOTOS[index];
  $('capCount').textContent = `[${pad(index + 1)}/${pad(PHOTOS.length)}]`;
  $('capTitle').textContent = photo.title;
  $('capNote').textContent = photo.note ?? '';
  $('capNote').hidden = !photo.note;
  $('capFacts').textContent = `${seriesTitle(photo.series)} / ${factsOf(photo)}`;
  $('capOpen').href = `#f/${SLUGS[index]}`;
  $('capOpen').setAttribute('aria-label', `View ${photo.title} whole`);
  for (const [id, b] of Object.entries(seriesButtons)) {
    if (id === photo.series) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  }
}

let lastY = scrollY;
function update() {
  if (!scene) return;
  const vh = innerHeight;
  const slot = slotAt();
  const aboutIn = smooth(0.95, 0.25, about.getBoundingClientRect().top / vh);
  const roomIn = smooth(0.95, 0.3, work.getBoundingClientRect().top / vh) * (1 - aboutIn);
  const titleIn = 1 - smooth(0.1, 0.8, -hero.getBoundingClientRect().top / hero.offsetHeight);
  scene.set({ slot, room: roomIn, about: aboutIn, title: titleIn * (1 - roomIn) });
  scene.tear(Math.abs(scrollY - lastY) / vh * 0.8);
  lastY = scrollY;

  /* Type is light over the title and About, dark in the white room. */
  root.dataset.tone = roomIn > 0.5 ? 'dark' : 'light';

  /* The current print: the one the camera is standing in front of. */
  let s = Math.min(items.length - 1, Math.max(0, Math.round(slot)));
  while (s < items.length - 1 && items[s].kind !== 'print') s++;
  if (items[s].kind === 'print') caption(items[s].index);
}

if (scene) {
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', () => { update(); scene.snap(); });
  if (!reduced) {
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      scene.point((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2);
    }, { passive: true });
  }

  /* A print can be opened by clicking it on the glass. Only empty space
     counts — never a click that landed on text or a control. */
  const onGlass = (e) => !e.target.closest('a, button, dialog, [data-solid]');
  const hit = (e) => (root.dataset.tone === 'dark' && onGlass(e)
    ? scene.pick(e.clientX / innerWidth, e.clientY / innerHeight) : -1);
  addEventListener('pointermove', (e) => {
    root.classList.toggle('can-open', e.pointerType !== 'touch' && hit(e) >= 0);
  }, { passive: true });
  addEventListener('click', (e) => {
    const index = hit(e);
    if (index >= 0) location.hash = `#f/${SLUGS[index]}`;
  });

  /* The photographs are also a list of links in the HTML, off screen. When
     the keyboard reaches one, bring its print in front of the camera. */
  $('grid').addEventListener('focusin', (e) => {
    const slug = e.target.closest('a[href^="#f/"]')?.hash.slice(3);
    const index = SLUGS.indexOf(slug);
    if (index >= 0) goToSlot(slotOfPhoto[index]);
  });
}

/* --- Viewer and the address bar ------------------------------------------ */
let pushed = false;
let lastShown = -1;
const hashIndex = () => {
  const m = location.hash.match(/^#f\/(.+)$/);
  return m ? SLUGS.indexOf(decodeURIComponent(m[1])) : -1;
};

const viewer = createViewer({
  photos: PHOTOS,
  seriesOf: (p) => seriesTitle(p.series),
  factsOf,
  onShow(index) {
    lastShown = index;
    const hash = `#f/${SLUGS[index]}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    /* Keep the room in step, so closing lands beside the frame just seen. */
    if (scene) { goToSlot(slotOfPhoto[index]); update(); scene.snap(); }
  },
  onClose() {
    if (hashIndex() < 0) return;
    if (pushed) {
      /* Going back restores the scroll from before the viewer opened; put
         the room back beside the frame that was last on screen instead. */
      const slot = slotOfPhoto[lastShown];
      addEventListener('popstate', () => requestAnimationFrame(() => {
        if (scene) { goToSlot(slot); update(); scene.snap(); }
      }), { once: true });
      history.back();
    } else history.replaceState(null, '', location.pathname + location.search);
    pushed = false;
  },
});

function route(fromLoad = false) {
  const index = hashIndex();
  if (index < 0) { viewer.close(); return; }
  if (!viewer.isOpen) pushed = !fromLoad;
  if (viewer.index !== index) viewer.open(index);
}
addEventListener('hashchange', () => route());

/* --- Menu ------------------------------------------------------------------ */
const menu = $('menu');
const menuBtn = $('menuBtn');
menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); });
menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
$('menuClose').addEventListener('click', () => menu.close());
menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.close(); });

/* --- Loader ---------------------------------------------------------------- */
/* Counts what it is actually waiting for: the two typefaces and, where the
   scene runs, its two backdrops. Never holds the page for more than 4s. */
const waits = [fontsReady, ...(scene ? [scene.ready] : [])];
let done = 0;
const tick = () => { $('loaderCount').textContent = `${pad(done)}/${pad(waits.length)}`; };
tick();
waits.forEach((w) => w.then(() => { done++; tick(); }));

Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 4000))]).then(() => {
  update();
  scene?.snap();
  scene?.start();
  route(true);
  root.classList.add('is-ready');
});
