/**
 * Hand-edited "shop the look" posts. Real Instagram access is not connected, so each look borrows
 * its photo from a live WooCommerce product (`imageProduct`) and tags other live products with pins.
 * Only product ids/slugs live here; names, prices, stock and images are always read from the store.
 * Hotspot x/y are percentages of the photo (x from the left edge, y from the top).
 */
export type ProductRef = number | string;

export type Hotspot = {
  x: number;
  y: number;
  product: ProductRef;
  /** Short Hebrew hint for assistive tech, e.g. where on the photo the pin sits. */
  area: string;
};

export type Look = {
  id: string;
  influencer: string;
  caption: string;
  imageAlt: string;
  /** Product whose first live image is used as the stand-in photo. */
  imageProduct: ProductRef;
  hotspots: Hotspot[];
};

export const LOOKS: readonly Look[] = [
  {
    id: "terrace-table",
    influencer: "etty",
    caption: "שולחן שבת על המרפסת: מפת קרושה לבנה, כוסות קריסטל וצלחות מפורצלן.",
    imageAlt: "שולחן אוכל ערוך על מרפסת, עם מפת קרושה לבנה, כוסות קריסטל וצלחות",
    imageProduct: 38331,
    hotspots: [
      { x: 55, y: 76, product: 38331, area: "מפת הקרושה" },
      { x: 29, y: 40, product: 31174, area: "הצלחות" },
      { x: 80, y: 36, product: 7776, area: "כוסות הקריסטל" },
      { x: 72, y: 52, product: 3216, area: "סכו״ם" },
    ],
  },
  {
    id: "bedroom-cream",
    influencer: "talia",
    caption: "חדר שינה רך בגוני שמנת: מצעי כותנה פרקל וכרית ברבורים.",
    imageAlt: "מיטה עם מצעים בגוון שמנת רקומים וכריות, מול קיר עץ חמים",
    imageProduct: 35534,
    hotspots: [
      { x: 44, y: 62, product: 35534, area: "סט המצעים" },
      { x: 62, y: 36, product: 34173, area: "הכרית" },
    ],
  },
  {
    id: "white-dinnerware",
    influencer: "etty",
    caption: "הגשה לבנה ופשוטה: מערכת אוכל על מפת תחרה.",
    imageAlt: "צלחות, קערה וקנקן לבנים על מפת תחרה, מבט מלמעלה",
    imageProduct: 36722,
    hotspots: [
      { x: 74, y: 62, product: 36722, area: "מערכת האוכל" },
      { x: 22, y: 16, product: 1428, area: "מפת התחרה" },
    ],
  },
  {
    id: "hotel-bed",
    influencer: "talia",
    caption: "מיטה בסגנון מלון: מצעים לבנים עם פס בז׳ וכרית ראש מיטה.",
    imageAlt: "מיטה עם מצעים לבנים ופס בז׳ וכריות, מול קיר אפור",
    imageProduct: 35341,
    hotspots: [
      { x: 50, y: 62, product: 35341, area: "מערכת המצעים" },
      { x: 42, y: 22, product: 26451, area: "כרית ראש המיטה" },
    ],
  },
] as const;
