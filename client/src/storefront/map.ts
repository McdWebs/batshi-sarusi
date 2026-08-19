import type { Category } from "../api/types";
import { categoryPathFromPermalink, decodeSlug } from "../utils/format";

/** Customer-facing departments. Matched to live Woo slugs, not invented names. */
export const DEPARTMENT_SLUGS = [
  "בישול-מטבח-ואפייה",
  "כלי-הגשה-ואירוח",
  "טקסטיל-ועיצוב-הבית",
  "אחסון-וארגון-2",
  "חגים-ושבתות",
  "כוסות-בישול-ומטבח",
  "סידור-הבית",
  "מוצרי-חשמל",
] as const;

/** Collections people actually look for (old merchandising aisles). */
export const COLLECTION_SLUGS = [
  "המומלצים-של-אתי",
  "המומלצים-של-טליה",
  "בלאק-פריידיי",
  "clearance",
  "גיפט-קארד",
  "שבועות-2026",
  "benetton",
  "סטוקים",
  "מבצעים-בקנייה-מעל-399",
] as const;

export function categorySlug(category: { slug: string }) {
  return decodeSlug(category.slug);
}

export function pickBySlugs(categories: Category[], slugs: readonly string[]) {
  const bySlug = new Map(categories.map((category) => [categorySlug(category), category]));
  return slugs.map((slug) => bySlug.get(slug)).filter((category): category is Category => Boolean(category));
}

export function departments(categories: Category[]) {
  return pickBySlugs(categories, DEPARTMENT_SLUGS);
}

export function collections(categories: Category[]) {
  return pickBySlugs(categories, COLLECTION_SLUGS);
}

export function isCollection(category: Category) {
  return (COLLECTION_SLUGS as readonly string[]).includes(categorySlug(category));
}

export function isDepartment(category: Category) {
  return (DEPARTMENT_SLUGS as readonly string[]).includes(categorySlug(category));
}

export function categoryChildren(categories: Category[], parentId: number) {
  return categories.filter((category) => category.parent === parentId && category.count > 0).sort((a, b) => b.count - a.count);
}

export function categoryAncestors(categories: Category[], category: Category) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const trail: Category[] = [];
  let current: Category | undefined = category;
  const seen = new Set<number>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    trail.unshift(current);
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return trail;
}

export function searchStorefront(categories: Category[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const pinned = [...collections(categories), ...departments(categories)];
  return pinned.filter((category) => {
    const name = category.name.toLowerCase();
    const slug = categorySlug(category).toLowerCase();
    return name.includes(needle) || slug.includes(needle);
  });
}

export function storefrontHref(category: Category) {
  return categoryPathFromPermalink(category.permalink);
}

export function crumbGroup(category: Category, all: Category[]): { label: string; to: string } | null {
  const trail = categoryAncestors(all, category);
  if (trail.some(isCollection)) return { label: "קולקציות", to: "/collections" };
  if (trail.some(isDepartment)) return { label: "מחלקות", to: "/departments" };
  return null;
}
