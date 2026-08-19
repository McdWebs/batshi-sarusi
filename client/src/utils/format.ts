export function decodeSlug(value: string) {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

export function normalizePath(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map(decodeSlug)
    .join("/");
}

export function productPath(slug: string) {
  return `/product/${decodeSlug(slug)}`;
}

export function productPathFromPermalink(permalink: string) {
  try {
    const pathname = normalizePath(new URL(permalink, "https://batshi-home.co.il").pathname);
    const match = pathname.match(/product\/(.+)$/);
    if (match?.[1]) return productPath(match[1]);
  } catch {
    /* fall through */
  }
  return "/shop";
}

export function categoryPathFromPermalink(permalink: string) {
  try {
    const path = normalizePath(new URL(permalink, "https://batshi-home.co.il").pathname);
    return path ? `/${path}` : "/shop";
  } catch {
    return "/shop";
  }
}

export function findCategoryByPath<T extends { slug: string; permalink: string }>(categories: T[], splat: string) {
  const requestPath = normalizePath(`product-category/${splat}`);
  const lastSegment = splat.split("/").filter(Boolean).map(decodeSlug).at(-1) ?? "";

  const exact = categories.find(
    (category) => normalizePath(categoryPathFromPermalink(category.permalink)) === requestPath,
  );
  if (exact) return exact;

  const slugMatches = categories.filter((category) => decodeSlug(category.slug) === lastSegment);
  if (slugMatches.length === 1) return slugMatches[0];
  return slugMatches.find((category) =>
    normalizePath(categoryPathFromPermalink(category.permalink)).endsWith(`/${requestPath}`),
  );
}

export function brandPath(slug: string) {
  return `/brand/${decodeSlug(slug)}`;
}

export function formatMoney(major: string, suffix = " ₪") {
  const [whole, fraction] = major.split(".");
  const grouped = (whole ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}${suffix}` : `${grouped}${suffix}`;
}

export function discountPercent(regularMinor: string, saleMinor: string) {
  const regular = Number(regularMinor);
  const sale = Number(saleMinor);
  if (!regular || sale >= regular) return null;
  return Math.round(((regular - sale) / regular) * 100);
}

export function stripHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

export function decodeHtmlEntities(value: string) {
  if (!value.includes("&")) return value;
  return stripHtml(value);
}
