import { decodeSlug } from "../utils/format";

export type SeoRoute =
  | { kind: "home" }
  | { kind: "shop" }
  | { kind: "sale" }
  | { kind: "directory"; which: "departments" | "collections" }
  | { kind: "search" }
  | { kind: "contact" }
  | { kind: "product"; slug: string }
  | { kind: "category"; splat: string }
  | { kind: "brand"; slug: string }
  | { kind: "cms"; slug: string }
  | { kind: "utility"; name: string }
  | { kind: "unknown" };

/** Pages with no value for search: carts, accounts, the owner's tools and the demo pages. */
const UTILITY_PREFIXES = ["cart", "checkout", "my-account", "login", "studio", "analytics", "demand", "shop-the-look", "influencers"];

/** Sorts a request path into the kind of page the storefront shows for it. Mirrors `AppRoutes`. */
export function classifyPath(pathname: string): SeoRoute {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map(decodeSlug);
  const [first, second] = segments;

  if (!first) return { kind: "home" };
  if (segments.length === 1) {
    if (first === "shop") return { kind: "shop" };
    if (first === "sale") return { kind: "sale" };
    if (first === "departments" || first === "collections") return { kind: "directory", which: first };
    if (first === "search") return { kind: "search" };
    if (first === "צור-קשר") return { kind: "contact" };
    if (UTILITY_PREFIXES.includes(first)) return { kind: "utility", name: first };
    return { kind: "cms", slug: first };
  }
  if (first === "product" && second && segments.length === 2) return { kind: "product", slug: second };
  if (first === "product-category") return { kind: "category", splat: segments.slice(1).join("/") };
  if (first === "brand" && second && segments.length === 2) return { kind: "brand", slug: second };
  if (UTILITY_PREFIXES.includes(first)) return { kind: "utility", name: first };
  return { kind: "unknown" };
}
