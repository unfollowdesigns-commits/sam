/**
 * How the gallery is laid out, and how wide each frame is painted.
 *
 * This lives on its own because two places need to agree on it exactly:
 * js/gallery.js, which builds the grid in the browser, and
 * tools/build-seo.mjs, which writes the same grid into index.html for
 * crawlers. If they disagree the browser downloads every photograph twice.
 * It touches no DOM, so the build tool can import it under Node.
 *
 * ── The system ────────────────────────────────────────────────────────────
 *
 * The page reads as a column of plates. A plate is either a pair of
 * photographs side by side, or one photograph across the full measure, and
 * a feature runs the whole screen. That is the entire vocabulary.
 *
 * It replaces a six-step cycle of widths — a, b, c, e, d, f — that repeated
 * regardless of what the photographs were. Size carried no meaning, so the
 * page looked shuffled rather than sequenced: the complaint that the pictures
 * were "sorted so random" was really that their sizes were.
 *
 * Here size means something. Two frames pair when their shapes sit together;
 * a landscape wide enough to carry a page gets the full measure alone. The
 * variation comes from the photographs, which is the only place variation can
 * come from without looking arbitrary.
 *
 * ── Why `sizes` matters ───────────────────────────────────────────────────
 *
 * `sizes` is how the browser chooses a file before it knows the layout.
 * Quote it 60vw for a plate painted at 100vw and it picks a file too small
 * and stretches it, which looks exactly like an image that failed to sharpen.
 */

/** Wider than this reads as a landscape; narrower than the second, a portrait. */
const LANDSCAPE = 1.25;
const PORTRAIT = 0.85;

export const shapeOf = (ratio = 1.5) =>
  ratio >= LANDSCAPE ? 'landscape' : ratio <= PORTRAIT ? 'portrait' : 'square';

/**
 * The share of the viewport each kind of plate occupies, as `sizes` values.
 *
 * Below 750px every frame spans the full measure, so the first clause covers
 * all of them. The desktop numbers are rounded up rather than down: fetching
 * slightly too much costs bytes, fetching too little costs sharpness, and
 * sharpness is the entire point of the site.
 */
const SPAN = {
  // Measured, not assumed: the feature plate is pulled out past the gutter on
  // both sides, so it paints wider than the viewport.
  bleed: '115vw',
  full: '92vw',
  pair: '46vw',
  strip: '60vw',
};

export const sizesFor = (kind) =>
  `(max-width: 749px) 92vw, ${SPAN[kind] ?? SPAN.full}`;

/**
 * Lays out a list of photographs.
 *
 * Returns one entry per photograph: `kind` drives both the CSS class and the
 * `sizes` value, and `startsSeries` marks the first frame of each body of
 * work so the flow can say where one ends and the next begins.
 *
 * A feature takes the whole screen and resets the pairing, so a feature is
 * never left sharing a line with something else.
 */
export function layoutFor(photos, { strip = false, grouped = true } = {}) {
  if (strip) {
    return photos.map((photo, i) => ({
      kind: 'strip',
      startsSeries: false,
      photo,
      index: i,
    }));
  }

  const out = [];
  let i = 0;
  let lastSeries = null;

  while (i < photos.length) {
    const photo = photos[i];
    const startsSeries = grouped && photo.series !== lastSeries;
    if (startsSeries) lastSeries = photo.series;

    if (photo.feature) {
      out.push({ kind: 'bleed', startsSeries, photo, index: i });
      i += 1;
      continue;
    }

    const next = photos[i + 1];
    // A pair has to stay inside one body of work, or the break between series
    // lands in the middle of a line and stops reading as a break at all.
    const canPair =
      next &&
      !next.feature &&
      (!grouped || next.series === photo.series) &&
      pairs(photo, next);

    if (canPair) {
      out.push({ kind: 'pair', side: 'left', startsSeries, photo, index: i });
      out.push({ kind: 'pair', side: 'right', startsSeries: false, photo: next, index: i + 1 });
      i += 2;
    } else {
      out.push({ kind: 'full', startsSeries, photo, index: i });
      i += 1;
    }
  }
  return out;
}

/**
 * Whether two photographs sit together on one line.
 *
 * Two wide landscapes side by side are both too small to read, and a single
 * very wide frame carries a page on its own. Everything else pairs.
 */
function pairs(a, b) {
  const sa = shapeOf(a.ratio);
  const sb = shapeOf(b.ratio);
  if (sa === 'landscape' && sb === 'landscape') return false;
  if (a.ratio >= 1.7 || b.ratio >= 1.7) return false;
  return true;
}
