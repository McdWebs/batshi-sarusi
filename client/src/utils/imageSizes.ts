/**
 * What each layout really needs, so the browser picks the right photo size. WordPress's own `sizes` value says
 * "100vw" for every photo (it assumes a full-width image), which makes small grid cards download the largest copy.
 */

/** Product grid: 2 columns on phones, 3 from 900px, 4 (a 1200px container) from 1200px. */
export const CARD_SIZES = "(max-width: 899px) 50vw, (max-width: 1199px) 33vw, 300px";

/** Product page gallery: full width on phones, half of the 1200px container from 900px. */
export const GALLERY_SIZES = "(max-width: 899px) 100vw, 560px";
