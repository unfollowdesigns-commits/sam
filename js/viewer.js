/**
 * The viewer: one photograph, whole, with nothing done to it.
 *
 * The room bends and scans the work for effect; this is where it is shown as
 * the lab returned it. A native <dialog>, so focus is held inside it and
 * Escape closes it without any of that being rebuilt here.
 *
 * Arrow keys and horizontal swipes page. The viewer never touches the
 * address bar — js/main.js owns `#f/<slug>` and is told through the callbacks.
 */
import { SIZES } from './sizes.js';

function srcset(src, ext) {
  const info = SIZES[src];
  if (!info?.widths?.length) return '';
  const stem = src.replace(/^images\//, '').replace(/\.[^.]+$/, '');
  return info.widths.map((w) => `images/r/${stem}-${w}.${ext} ${w}w`).join(', ');
}

export function createViewer({ photos, seriesOf, factsOf, onShow, onClose }) {
  const dialog = document.getElementById('viewer');
  const picture = dialog.querySelector('.viewer__picture');
  const el = (id) => dialog.querySelector(`#${id}`);
  const pad = (n) => String(n).padStart(2, '0');
  let index = -1;

  function show(i) {
    index = (i + photos.length) % photos.length;
    const photo = photos[index];
    const info = SIZES[photo.src];

    /* A fresh <picture> each time: swapping sources on a live one leaves the
       previous frame on screen until the next has decoded. */
    picture.replaceChildren();
    for (const ext of ['avif', 'webp']) {
      const set = srcset(photo.src, ext);
      if (!set) continue;
      const source = document.createElement('source');
      source.type = `image/${ext}`;
      source.srcset = set;
      source.sizes = '100vw';
      picture.append(source);
    }
    const img = document.createElement('img');
    img.alt = photo.alt;
    img.decoding = 'async';
    if (info) { img.width = info.width; img.height = info.height; }
    img.src = photo.src;
    picture.append(img);

    el('viewerCount').textContent = `[${pad(index + 1)}/${pad(photos.length)}]`;
    el('viewerTitle').textContent = photo.title;
    el('viewerNote').textContent = photo.note ?? '';
    el('viewerNote').hidden = !photo.note;
    el('viewerFacts').textContent = `${seriesOf(photo)} / ${factsOf(photo)}`;

    /* Have the neighbours decoded before they are asked for. */
    for (const step of [1, -1]) {
      const next = photos[(index + step + photos.length) % photos.length];
      const pre = new Image();
      pre.sizes = '100vw';
      pre.srcset = srcset(next.src, 'webp');
    }
    onShow?.(index);
  }

  function open(i) {
    show(i);
    if (!dialog.open) dialog.showModal();
  }
  const close = () => { if (dialog.open) dialog.close(); };

  dialog.addEventListener('close', () => { index = -1; onClose?.(); });
  el('viewerClose').addEventListener('click', close);
  el('viewerPrev').addEventListener('click', () => show(index - 1));
  el('viewerNext').addEventListener('click', () => show(index + 1));
  /* A click on the dark around the photograph closes; on the photograph
     or its caption it does not. */
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.classList.contains('viewer__stage')) close();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  let startX = null;
  dialog.addEventListener('pointerdown', (e) => { startX = e.pointerType === 'touch' ? e.clientX : null; });
  dialog.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
  });

  return { open, close, get index() { return index; }, get isOpen() { return dialog.open; } };
}
