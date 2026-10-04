/**
 * Influencer collections. The URL slug is an English-friendly alias; `categorySlug` is the
 * live WooCommerce category (see COLLECTION_SLUGS in storefront/map.ts). Products are never
 * listed here, they always come from the live store.
 */
export type Influencer = {
  slug: string;
  name: string;
  categorySlug: string;
  tagline: string;
};

export const INFLUENCERS: readonly Influencer[] = [
  {
    slug: "etty",
    name: "אתי אפינגר",
    categorySlug: "המומלצים-של-אתי",
    tagline: "המומלצים של אתי: מוצרי הבית שנבחרו בקפידה, מהמטבח ועד חדר השינה.",
  },
  {
    slug: "talia",
    name: "טליה סול",
    categorySlug: "המומלצים-של-טליה",
    tagline: "המומלצים של טליה: הפריטים האהובים שלה לבית, לשולחן ולמיטה.",
  },
] as const;

export function findInfluencer(slug: string | undefined) {
  if (!slug) return undefined;
  return INFLUENCERS.find((item) => item.slug === slug.toLowerCase());
}

const REF_KEY = "batshi.ref";
const REF_PATTERN = /^[a-z0-9_-]{1,40}$/i;

/** Persist an influencer `?ref=` value so a later purchase can be attributed. Safe when storage is blocked. */
export function captureRef(value: string | null | undefined) {
  const ref = value?.trim();
  if (!ref || !REF_PATTERN.test(ref)) return;
  try {
    window.localStorage.setItem(REF_KEY, JSON.stringify({ ref, at: new Date().toISOString() }));
  } catch {
    try {
      window.sessionStorage.setItem(REF_KEY, JSON.stringify({ ref, at: new Date().toISOString() }));
    } catch {
      /* storage unavailable, attribution is best-effort */
    }
  }
}

export function getStoredRef(): string | null {
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const raw = window[storage].getItem(REF_KEY);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "ref" in parsed && typeof parsed.ref === "string") return parsed.ref;
    } catch {
      /* try next storage */
    }
  }
  return null;
}

export function influencerShareLink(slug: string) {
  const origin = typeof window === "undefined" ? "https://batshi-home.co.il" : window.location.origin;
  return `${origin}/influencers/${slug}?ref=${slug}`;
}
