import type { Brand, Category, CmsPage, PricedAmount, Product } from "../api/types";
import { categoryAncestors } from "../storefront/map";
import { categoryPathFromPermalink, decodeSlug, formatMoney, normalizePath } from "../utils/format";
import { DEFAULT_DESCRIPTION, HOME_TITLE, SITE_NAME } from "./config";
import { breadcrumbJsonLd, organizationJsonLd, productJsonLd, websiteJsonLd } from "./jsonld";
import { stripHtml, truncate } from "./text";

/** Everything a page says about itself to search engines and link previews. */
export type PageMeta = {
  title: string;
  description: string;
  /** Canonical path with percent-encoding, trailing slash and, for later pages, "?page=N". Null for pages with none. */
  path: string | null;
  image?: string;
  noindex?: boolean;
  ogType?: "website" | "product";
  jsonLd?: object[];
  /** Set to 404 for a page that does not exist; the edge function turns it into the HTTP status. */
  status?: number;
};

/** "/product/<slug>/" with every segment percent-encoded (the form the old site's canonical links use). */
export function encodePath(...segments: string[]): string {
  const clean = segments.filter(Boolean).map((segment) => encodeURIComponent(decodeSlug(segment)));
  return clean.length ? `/${clean.join("/")}/` : "/";
}

export function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

function titled(name: string, page = 1): string {
  // A name that already carries the brand ("אודות batshi") is not given the suffix twice.
  if (page === 1 && name.toLowerCase().includes(SITE_NAME)) return name;
  return page > 1 ? `${name} - עמוד ${page} - ${SITE_NAME}` : `${name} - ${SITE_NAME}`;
}

/** "49.00 ₪" or, when the options cost different amounts, "139.00 ₪ – 189.00 ₪". Null when the shop has no price. */
export function priceText(prices: PricedAmount | null): string | null {
  if (!prices || Number(prices.price.minor) <= 0) return null;
  const suffix = prices.currencySuffix || " ₪";
  const range = prices.priceRange;
  if (range && range.minAmount.minor !== range.maxAmount.minor) {
    return `${formatMoney(range.minAmount.major, suffix)} – ${formatMoney(range.maxAmount.major, suffix)}`;
  }
  return formatMoney(prices.price.major, suffix);
}

export function homeMeta(origin: string): PageMeta {
  return {
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: "/",
    ogType: "website",
    jsonLd: [organizationJsonLd(origin), websiteJsonLd(origin)],
  };
}

export function shopMeta(page = 1): PageMeta {
  return {
    title: titled("חנות", page),
    description: "כל המוצרים של בתשי הום במקום אחד: כלי מטבח, כלי הגשה, טקסטיל ועיצוב הבית.",
    path: withPage("/shop/", page),
  };
}

export function saleMeta(page = 1): PageMeta {
  return {
    title: titled("מבצעים", page),
    description: "המבצעים של בתשי הום: כלי מטבח, כלי הגשה, טקסטיל ועיצוב הבית במחירים מוזלים.",
    path: withPage("/sale/", page),
  };
}

export function directoryMeta(which: "departments" | "collections"): PageMeta {
  return which === "departments"
    ? { title: titled("מחלקות"), description: "כל המחלקות של בתשי הום: מטבח, הגשה ואירוח, טקסטיל, אחסון וארגון ועוד.", path: "/departments/" }
    : { title: titled("קולקציות"), description: "הקולקציות של בתשי הום: המומלצים, מבצעים, חגים וסטוקים.", path: "/collections/" };
}

export function contactMeta(): PageMeta {
  return { title: titled("צור קשר"), description: "דרכי יצירת הקשר עם בתשי הום.", path: encodePath("צור-קשר") };
}

const UTILITY_TITLES: Record<string, string> = {
  cart: "העגלה שלי",
  checkout: "תשלום",
  "my-account": "החשבון שלי",
  login: "התחברות",
  studio: "סטודיו התוכן",
  analytics: "איך הולך באתר",
  demand: "ביקוש למוצרים שאזלו",
  "shop-the-look": "קנו את הלוק",
  influencers: "המומלצים שלנו",
};

/** Pages that should never appear in search results. */
export function utilityMeta(name: string): PageMeta {
  return { title: titled(UTILITY_TITLES[name] ?? "בתשי הום"), description: DEFAULT_DESCRIPTION, path: null, noindex: true };
}

export function searchMeta(): PageMeta {
  return { title: titled("חיפוש"), description: DEFAULT_DESCRIPTION, path: null, noindex: true };
}

export function notFoundMeta(title = "העמוד לא נמצא"): PageMeta {
  return { title: titled(title), description: DEFAULT_DESCRIPTION, path: null, noindex: true, status: 404 };
}

/** What shows while a page's data is still loading or when nothing more specific is known. */
export function genericMeta(): PageMeta {
  return { title: HOME_TITLE, description: DEFAULT_DESCRIPTION, path: null };
}

export type Crumb = { name: string; path: string };

export function productMeta(product: Product, origin: string, trail: Crumb[] = []): PageMeta {
  const path = encodePath("product", product.slug);
  const price = priceText(product.prices);
  const written = stripHtml(product.shortDescription || product.description || "");
  const description = written
    ? truncate(written, 155)
    : truncate(`${product.name}${price ? ` - ${price}` : ""} - בתשי הום, הכול לבית.`, 155);
  const image = product.images[0]?.src;
  return {
    title: titled(product.name),
    description,
    path,
    image,
    ogType: "product",
    jsonLd: [
      productJsonLd(product, origin, path, description),
      ...(trail.length ? [breadcrumbJsonLd(origin, [...trail, { name: product.name, path }])] : []),
    ],
  };
}

/** Where a category lives, in the same path form the old site used. */
export function categoryPath(category: Category): string {
  const normalized = normalizePath(categoryPathFromPermalink(category.permalink));
  return encodePath(...normalized.split("/"));
}

/** Breadcrumb trail (department down to the category itself) with encoded paths. */
export function categoryTrail(all: Category[], category: Category): Crumb[] {
  return categoryAncestors(all, category).map((item) => ({ name: item.name, path: categoryPath(item) }));
}

export function categoryMeta(category: Category, origin: string, trail: Crumb[] = [], page = 1): PageMeta {
  const written = stripHtml(category.description || "");
  const description = written
    ? truncate(written, 155)
    : `${category.name} בבתשי הום: ${category.count} מוצרים. כלי מטבח, הגשה, טקסטיל ועיצוב הבית.`;
  const path = categoryPath(category);
  return {
    title: titled(category.name, page),
    description,
    path: withPage(path, page),
    image: category.image?.src,
    ogType: "website",
    jsonLd: trail.length ? [breadcrumbJsonLd(origin, [...trail, { name: category.name, path }])] : [],
  };
}

export function brandMeta(brand: Brand, page = 1): PageMeta {
  const written = stripHtml(brand.description || "");
  return {
    title: titled(brand.name, page),
    description: written ? truncate(written, 155) : `${brand.name} בבתשי הום: ${brand.count} מוצרים.`,
    path: withPage(encodePath("brand", brand.slug), page),
    image: brand.image?.src,
  };
}

export function cmsMeta(page: Pick<CmsPage, "title" | "excerptHtml" | "contentHtml">, slug: string): PageMeta {
  const written = stripHtml(page.excerptHtml || page.contentHtml || "");
  return {
    title: titled(stripHtml(page.title) || decodeSlug(slug).replace(/-/g, " ")),
    description: written ? truncate(written, 155) : DEFAULT_DESCRIPTION,
    path: encodePath(slug),
  };
}
