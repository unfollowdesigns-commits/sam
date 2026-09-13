/**
 * Full-screen viewer.
 *
 * Opens over whatever list the grid is currently showing, so paging through
 * a filtered series never wanders into another one. Arrow keys, Escape and
 * horizontal swipes all move; focus is trapped while open and handed back to
 * the thumbnail on close.
 */
const FOCUSABLE = 'button:not([disabled])';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Animate the full-screen image out of (or back into) the grid frame that was
 * clicked. Both boxes share the photograph's aspect ratio, so a single uniform
 * scale carries one onto the other without distortion.
 */
function flight(image, fromRect) {
  if (!fromRect || reduced.matches) return;
  const to = image.getBoundingClientRect();
  if (!to.width || !to.height) return;

  const scale = fromRect.width / to.width;
  const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2);
  const dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2);

  return image.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      { transform: 'none' },
    ],
    { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );
}

export function createLightbox({ onOpen, onClose, seriesOf } = {}) {
  const root = document.getElementById('lightbox');
  const image = document.getElementById('lbImage');
  const title = document.getElementById('lbTitle');
  const plateNo = document.getElementById('lbPlate');
  const note = document.getElementById('lbNote');
  const data = document.getElementById('lbData');
  const counter = document.getElementById('lbCounter');
  const ticks = document.getElementById('lbTicks');
  const prev = document.getElementById('lbPrev');
  const next = document.getElementById('lbNext');
  const close = document.getElementById('lbClose');

  let list = [];
  let index = 0;
  let opener = null;
  let originRect = null;

  function show(i) {
    index = (i + list.length) % list.length;
    const photo = list[index];

    root.classList.remove('is-loaded');
    image.src = photo.src;
    image.alt = photo.alt || photo.title;

    plateNo.textContent = String(index + 1).padStart(3, '0');
    title.textContent = photo.title;
    // The alt text already describes the picture plainly; it reads as plate
    // text, so there is no second description to write or keep in step.
    note.textContent = photo.alt || '';

    // Only fields the file actually recorded — no invented rows.
    const rows = [
      ['Series', seriesOf?.(photo.series) ?? photo.series],
      ['Place', photo.location],
      ['Year', photo.year],
    ].filter(([, value]) => value);
    data.replaceChildren(...rows.flatMap(([label, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      return [dt, dd];
    }));

    counter.textContent =
      `${String(index + 1).padStart(3, '0')} / ${String(list.length).padStart(3, '0')}`;

    // One tick per plate in the sequence — position at a glance.
    if (ticks.childElementCount !== list.length) {
      ticks.replaceChildren(...list.map(() => document.createElement('i')));
    }
    [...ticks.children].forEach((t, i) => t.classList.toggle('is-here', i === index));

    const done = () => {
      root.classList.add('is-loaded');
      // Measure only once the browser has laid the image out at its final size.
      requestAnimationFrame(() => {
        flight(image, originRect);
        originRect = null;
      });
    };
    if (image.complete) done();
    else image.addEventListener('load', done, { once: true });

    // Warm the neighbours so paging feels instant.
    [list[(index + 1) % list.length], list[(index - 1 + list.length) % list.length]]
      .forEach((p) => { if (p) new Image().src = p.src; });

    const single = list.length < 2;
    prev.hidden = next.hidden = single;

    onOpen?.(photo);
  }

  function open(photos, i, origin) {
    list = photos;
    opener = origin ?? document.activeElement;
    originRect = origin?.getBoundingClientRect() ?? null;
    root.hidden = false;
    document.body.classList.add('is-locked');
    show(i);
    requestAnimationFrame(() => root.classList.add('is-open'));
    close.focus({ preventScroll: true });
  }

  function dismiss({ silent = false } = {}) {
    // Fly back into whichever frame is currently showing this photograph.
    const home = returnRect?.(list[index]);
    if (home && !reduced.matches) {
      const back = flight(image, home);
      if (back) back.reverse();
    }

    root.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    const finish = () => {
      root.hidden = true;
      image.removeAttribute('src');
    };
    root.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 600); // in case the transition never fires
    opener?.focus({ preventScroll: true });
    if (!silent) onClose?.();
  }

  let returnRect = null;
  /** Lets the page say where a photograph currently sits in the grid. */
  function setHoming(fn) { returnRect = fn; }

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

  return { open, dismiss, setHoming, isOpen: () => !root.hidden };
}
