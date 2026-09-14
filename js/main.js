/**
 * Page orchestration: copy, chrome, motion, and the wiring between the
 * gallery, the series index and the viewer.
 */
import { SITE, PHOTOS } from './data.js';
import { SIZES } from './sizes.js';
import { createGallery, createSeriesIndex, slugOf, seriesTitle } from './gallery.js';
import { createLightbox } from './lightbox.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/* --- Copy ---------------------------------------------------------------- */
function fillCopy() {
  document.title = `${SITE.name} — ${SITE.role}`;
  document.querySelectorAll('.site-head__mark span').forEach((el) => {
    el.textContent = SITE.name;
  });
  document.querySelector('.site-head__mark em').textContent = SITE.role;

  const aboutImage = document.getElementById('aboutImage');
  if (aboutImage && SITE.about) {
    const info = SIZES[SITE.about.src];
    if (info?.widths?.length) {
      const stem = SITE.about.src.replace(/^images\//, '').replace(/\.[^.]+$/, '');
      aboutImage.sizes = '(max-width: 949px) 92vw, 42vw';
      aboutImage.srcset = info.widths.map((w) => `images/r/${stem}-${w}.webp ${w}w`).join(', ');
    }
    aboutImage.src = SITE.about.src;
    aboutImage.alt = SITE.about.alt;
    aboutImage.style.setProperty('--about-ratio', String(SITE.about.ratio));
  }

  document.getElementById('aboutLead').textContent = SITE.intro;
  document.getElementById('aboutLocation').textContent = SITE.location;
  document.getElementById('aboutSince').textContent = SITE.since;
  document.getElementById('aboutFormats').textContent = SITE.formats;
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('frameCount').textContent = String(PHOTOS.length).padStart(2, '0');
  const workCount = document.getElementById('workCount');
  if (workCount) workCount.textContent = String(PHOTOS.length);

  const services = document.getElementById('aboutServices');
  SITE.services.forEach((service) => {
    const li = document.createElement('li');
    li.textContent = service;
    services.append(li);
  });

  const mail = document.getElementById('contactMail');
  mail.href = `mailto:${SITE.email}`;
  mail.textContent = SITE.email;

  const social = document.getElementById('contactSocial');
  SITE.social.forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    a.dataset.cursor = 'Open';
    if (item.href.startsWith('http')) {
      a.rel = 'noopener';
      a.target = '_blank';
    }
    li.append(a);
    social.append(li);
  });

  document.querySelector('.site-foot p').innerHTML =
    `&copy; <span>${new Date().getFullYear()}</span> ${SITE.name}. All photographs are the property of the artist.`;
}

/* --- Reveal on scroll ----------------------------------------------------- */
function createRevealer() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );

  return (node) => {
    // Reveals are decorative; without them the content is simply already there.
    if (reduced.matches) { node.classList.add('is-in'); return; }
    io.observe(node);
  };
}

/* --- Theme ---------------------------------------------------------------- */
function initTheme() {
  const KEY = 'sam-theme';
  const toggle = document.getElementById('themeToggle');
  const meta = document.querySelector('meta[name="theme-color"]');

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch { /* private browsing */ }

  // The work is printed on paper, so the site opens on paper. A visitor who
  // has chosen dark here before keeps that choice; the operating system's
  // preference does not get a vote, because the ground these pictures sit on
  // is part of the picture.
  apply(stored === 'dark' ? 'dark' : 'light');

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    meta?.setAttribute('content', theme === 'light' ? '#eae6dc' : '#12110f');
  }

  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  });
}

/* --- Header, progress bar, hero parallax ---------------------------------- */
/** The margin rail names the section currently in view. */
function initRail() {
  const now = document.getElementById('railNow');
  if (!now) return;

  const sections = [...document.querySelectorAll('main section[id]')]
    .map((el) => ({ el, label: el.querySelector('.opener__title')?.textContent?.trim() }))
    .filter((s) => s.label);
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      const top = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!top) return;
      const label = sections.find((s) => s.el === top.target)?.label;
      if (!label || now.textContent === label) return;
      now.style.opacity = '0';
      setTimeout(() => { now.textContent = label; now.style.opacity = ''; }, 180);
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5] }
  );
  sections.forEach((s) => io.observe(s.el));
}

function initScrollChrome() {
  const head = document.getElementById('siteHead');
  const progress = document.getElementById('scrollProgress');
  const parallax = [...document.querySelectorAll('[data-parallax]')];

  // The sticky filter bar has to sit exactly under the header, so its offset
  // is the header's measured height rather than a guess — and drops to zero
  // while the header is retracted, or the bar would hang below a gap of
  // scrolling content.
  function syncHeadHeight() {
    const offset = head.classList.contains('is-hidden') ? 0 : head.offsetHeight;
    document.documentElement.style.setProperty('--head-h', `${offset}px`);
  }
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(syncHeadHeight).observe(head);
  }
  addEventListener('resize', syncHeadHeight, { passive: true });

  const hero = document.getElementById('hero');
  // The point at which the header clears the hero's scrim.
  const heroDepth = () => (hero?.offsetHeight ?? 0) - head.offsetHeight * 1.4;

  let last = window.scrollY;
  let ticking = false;

  function frame() {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;

    progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;

    // Retract the header on the way down, bring it back the moment you reverse.
    const goingDown = y > last && y > innerHeight * 0.6;
    head.classList.toggle('is-hidden', goingDown);
    head.classList.toggle('is-over-hero', y < heroDepth());
    syncHeadHeight();
    last = y;

    if (!reduced.matches) {
      parallax.forEach((el) => {
        const rate = Number(el.dataset.parallax) || 0;
        el.style.transform = `translate3d(0, ${(y * rate).toFixed(2)}px, 0)`;
      });
    }
  }

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }, { passive: true });

  syncHeadHeight();
  frame();
}

/* --- Drift ------------------------------------------------------------------
   Each photograph moves a little inside its own frame as it crosses the
   screen. It is barely perceptible per frame, but it is the difference
   between pictures pasted onto a page and pictures sitting in it. */
function initDrift() {
  if (reduced.matches) return;

  const RANGE = 26; // px of travel across a full pass
  let frames = [];
  let ticking = false;

  function collect() {
    frames = [...document.querySelectorAll('.shot__frame img')];
  }

  function apply() {
    ticking = false;
    const h = innerHeight;
    for (const img of frames) {
      const box = img.getBoundingClientRect();
      if (box.bottom < -200 || box.top > h + 200) continue;
      // -1 entering from below, 0 centred, +1 leaving at the top.
      const progress = clamp((h / 2 - (box.top + box.height / 2)) / (h / 2 + box.height / 2), -1, 1);
      img.style.setProperty('--py', `${(progress * RANGE).toFixed(2)}px`);
    }
  }

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }, { passive: true });
  addEventListener('resize', apply, { passive: true });

  collect();
  apply();
  return collect;
}

/* --- Cursor ---------------------------------------------------------------- */
function initCursor() {
  if (!fine.matches || reduced.matches) return;

  const dot = document.getElementById('cursor');
  const label = document.getElementById('cursorLabel');

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let cx = x;
  let cy = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.classList.add('is-active');

    const target = e.target.closest('[data-cursor]');
    dot.classList.toggle('is-grown', Boolean(target));
    if (target) label.textContent = target.dataset.cursor;
  }, { passive: true });

  addEventListener('pointerdown', () => dot.classList.add('is-grown'));
  addEventListener('pointerup', () => dot.classList.remove('is-grown'));
  document.addEventListener('mouseleave', () => dot.classList.remove('is-active'));

  (function follow() {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(follow);
  })();
}

/* --- Loader ---------------------------------------------------------------- */
function runLoader() {
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loaderBar');
  const count = document.getElementById('loaderCount');

  // Only images that actually fetch up front can report progress; lazy ones
  // would leave the bar stranded.
  const watched = [...document.images].filter((img) => img.loading !== 'lazy');
  const total = Math.max(watched.length, 1);
  let done = 0;
  let shown = 0;

  const tick = () => { done += 1; };
  watched.forEach((img) => {
    if (img.complete) tick();
    else {
      img.addEventListener('load', tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    }
  });

  const started = performance.now();
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    bar.style.width = '100%';
    count.textContent = '100';
    loader.classList.add('is-done');
    document.body.classList.add('is-ready');
    setTimeout(() => loader.remove(), 700);
  }

  (function step() {
    const elapsed = performance.now() - started;
    // Never flash past instantly, never hold the page hostage to a slow asset.
    const real = (done / total) * 100;
    const floor = Math.min((elapsed / 900) * 100, 96);
    shown = clamp(Math.max(shown, Math.min(real, floor)), 0, 100);

    count.textContent = String(Math.round(shown)).padStart(2, '0');
    bar.style.width = `${shown}%`;

    if ((done >= total && elapsed > 600) || elapsed > 4000) finish();
    else requestAnimationFrame(step);
  })();
}

/* --- Boot ------------------------------------------------------------------ */
function boot() {
  // Whatever happens below, the curtain has to come up — a stuck loader would
  // hide the static half of the page that works perfectly well without it.
  try {
    build();
  } catch (error) {
    console.error('[portfolio] initialisation failed', error);
  } finally {
    runLoader();
  }
}

function build() {
  fillCopy();
  initTheme();

  const observe = createRevealer();
  document.querySelectorAll('.reveal:not(.hero .reveal)').forEach(observe);

  // Each photograph gets its own address, so a single frame can be sent to
  // someone. '#f/…' matches no element id, so the browser never jumps.
  let viewerOpen = false;

  const lightbox = createLightbox({
    seriesOf: seriesTitle,
    onOpen: (photo) => {
      const hash = `#f/${slugOf(photo)}`;
      if (location.hash !== hash) {
        // Paging within the viewer replaces; opening it adds a step back.
        history[viewerOpen ? 'replaceState' : 'pushState'](null, '', hash);
      }
      viewerOpen = true;
    },
    onClose: () => {
      viewerOpen = false;
      if (location.hash.startsWith('#f/')) {
        history.pushState(null, '', location.pathname + location.search);
      }
    },
  });

  const gallery = createGallery({ observe, onOpen: lightbox.open });

  // Closing flies the picture back to wherever it now sits in the grid.
  lightbox.setHoming((photo) => gallery.frameFor(photo)?.getBoundingClientRect() ?? null);

  function syncFromHash() {
    const slug = location.hash.match(/^#f\/(.+)$/)?.[1];
    if (slug) {
      if (lightbox.isOpen()) return;
      const hit = gallery.find(slug);
      if (hit) {
        viewerOpen = true;
        lightbox.open(hit.list, hit.index, gallery.frameFor(hit.list[hit.index]));
      }
    } else if (lightbox.isOpen()) {
      viewerOpen = false;
      lightbox.dismiss({ silent: true });
    }
  }

  addEventListener('popstate', syncFromHash);

  createSeriesIndex({
    observe,
    onSelect: (id) => {
      gallery.setSeries(id);
      document.getElementById('work').scrollIntoView({
        behavior: reduced.matches ? 'auto' : 'smooth',
        block: 'start',
      });
    },
  });

  initScrollChrome();
  initRail();
  const recollectDrift = initDrift();
  // The grid re-renders on filter, so the drift needs the new nodes.
  if (recollectDrift) gallery.onRender(recollectDrift);
  initCursor();

  // Honour a link that points straight at one photograph.
  syncFromHash();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
