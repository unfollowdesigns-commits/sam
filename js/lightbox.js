/**
 * Full-screen viewer.
 *
 * Opens over whatever list the grid is currently showing, so paging through
 * a filtered series never wanders into another one. Arrow keys, Escape and
 * horizontal swipes all move; focus is trapped while open and handed back to
 * the thumbnail on close.
 */
const FOCUSABLE = 'button:not([disabled])';

export function createLightbox() {
  const root = document.getElementById('lightbox');
  const image = document.getElementById('lbImage');
  const title = document.getElementById('lbTitle');
  const meta = document.getElementById('lbMeta');
  const counter = document.getElementById('lbCounter');
  const prev = document.getElementById('lbPrev');
  const next = document.getElementById('lbNext');
  const close = document.getElementById('lbClose');

  let list = [];
  let index = 0;
  let opener = null;

  function show(i) {
    index = (i + list.length) % list.length;
    const photo = list[index];

    root.classList.remove('is-loaded');
    image.src = photo.src;
    image.alt = photo.alt || photo.title;
    title.textContent = photo.title;
    meta.textContent = `${photo.location} · ${photo.year}`;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;

    const done = () => root.classList.add('is-loaded');
    if (image.complete) done();
    else image.addEventListener('load', done, { once: true });

    // Warm the neighbours so paging feels instant.
    [list[(index + 1) % list.length], list[(index - 1 + list.length) % list.length]]
      .forEach((p) => { if (p) new Image().src = p.src; });

    const single = list.length < 2;
    prev.hidden = next.hidden = single;
  }

  function open(photos, i) {
    list = photos;
    opener = document.activeElement;
    root.hidden = false;
    document.body.classList.add('is-locked');
    show(i);
    requestAnimationFrame(() => root.classList.add('is-open'));
    close.focus({ preventScroll: true });
  }

  function dismiss() {
    root.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    const finish = () => {
      root.hidden = true;
      image.removeAttribute('src');
    };
    root.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 600); // in case the transition never fires
    opener?.focus({ preventScroll: true });
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', dismiss);
  root.addEventListener('click', (e) => { if (e.target === root) dismiss(); });

  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') { dismiss(); return; }
    if (e.key === 'ArrowLeft') { show(index - 1); return; }
    if (e.key === 'ArrowRight') { show(index + 1); return; }
    if (e.key !== 'Tab') return;

    const stops = [...root.querySelectorAll(FOCUSABLE)].filter((el) => !el.hidden);
    if (!stops.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  let startX = null;
  root.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  root.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 60) show(index + (dx < 0 ? 1 : -1));
  });

  return { open };
}
