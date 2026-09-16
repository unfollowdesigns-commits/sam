/**
 * How wide each frame is actually painted.
 *
 * This lives on its own because two places need to agree on it exactly:
 * js/gallery.js, which builds the grid in the browser, and
 * tools/build-seo.mjs, which writes the same grid into index.html for
 * crawlers. If they disagree the browser downloads every photograph twice.
 * It touches no DOM, so the build tool can import it under Node.
 *
 * Getting these numbers wrong is not cosmetic. `sizes` is how the browser
 * chooses a file before it knows the layout — quote it 60vw for a plate that
 * is painted at 100vw and it picks a file too small and stretches it, which
 * looks exactly like an image that failed to sharpen.
 */

/* Width/offset patterns, cycled so the page never settles into a grid.
   'e' is the marginal thumbnail; 'bleed' runs past the page margin. */
export const RHYTHM = ['a', 'b', 'c', 'e', 'd', 'f'];

/**
 * The share of the viewport each variant occupies, as `sizes` values.
 *
 * Below 750px every frame spans the full twelve columns, so the first clause
 * covers all of them. Above it the numbers track the grid spans in
 * css/style.css — 12 columns inside the gutters — rounded up rather than
 * down, because fetching slightly too much costs bytes while fetching too
 * little costs sharpness, and sharpness is the entire point of the site.
 */
const SPAN = {
  // Measured, not assumed: the feature plate is pulled out past the gutter on
  // both sides and its image is sized by height with object-fit cover, so it
  // paints wider than the viewport — 1613px on a 1440px screen. Quoting it
  // 100vw was still short enough to drop it a rung.
  bleed: '115vw',
  f: '60vw',       // span 7
  a: '52vw',       // span 6
  c: '44vw',       // span 5
  d: '36vw',       // span 4
  b: '28vw',       // span 3
  e: '28vw',       // span 3, the marginal thumbnail
  strip: '60vw',   // horizontal mode: height-constrained, width follows ratio
};

export const sizesFor = (variant) =>
  `(max-width: 749px) 92vw, ${SPAN[variant] ?? '52vw'}`;

/**
 * The rhythm variant for each photograph in a list, in order.
 *
 * A feature plate takes a whole screen and restarts the cycle, so the variant
 * of any frame depends on every frame before it. That is why this returns the
 * whole sequence rather than answering one at a time.
 */
export function variantsFor(photos, { strip = false } = {}) {
  if (strip) return photos.map(() => 'strip');
  let step = 0;
  return photos.map((photo) => {
    if (photo.feature) { step = 0; return 'bleed'; }
    return RHYTHM[step++ % RHYTHM.length];
  });
}
