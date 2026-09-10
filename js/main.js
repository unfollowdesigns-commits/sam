/**
 * Page orchestration: copy, chrome, motion, and the wiring between the
 * gallery, the series index and the viewer.
 */
import { SITE, PHOTOS } from './data.js';
import { createGallery, createSeriesIndex } from './gallery.js';
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

  document.getElementById('aboutLead').textContent = SITE.intro;
  document.getElementById('aboutLocation').textContent = SITE.location;
  document.getElementById('aboutSince').textContent = SITE.since;
  document.getElementById('aboutFormats').textContent = SITE.formats;
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('frameCount').textContent = String(PHOTOS.length).padStart(2, '0');

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

  const initial =
    stored ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  apply(initial);

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    meta?.setAttribute('content', theme === 'light' ? '#f3f1ec' : '#0b0b0c');
  }

  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  });
}

/* --- Header, progress bar, hero parallax ---------------------------------- */
function initScrollChrome() {
  const head = document.getElementById('siteHead');
  const progress = document.getElementById('scrollProgress');
  const parallax = [...document.querySelectorAll('[data-parallax]')];

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

  frame();
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

  const lightbox = createLightbox();
  const gallery = createGallery({ observe, onOpen: lightbox.open });

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
  initCursor();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
