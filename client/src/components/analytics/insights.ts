import { CHECKOUT_FIELD_ORDER } from "../../analytics/labels";

/** Small pure helpers for the cart, problems, speed and behaviour sections. */

/** Checkout fields in the real form order; unknown ids follow, in the order they arrived (most focused first). */
export function orderCheckoutFields<T extends { field: string }>(rows: T[]): T[] {
  const known = new Map<string, number>(CHECKOUT_FIELD_ORDER.map((field, index) => [field, index]));
  const inForm = rows.filter((row) => known.has(row.field)).sort((a, b) => (known.get(a.field) ?? 0) - (known.get(b.field) ?? 0));
  const others = rows.filter((row) => !known.has(row.field));
  return [...inForm, ...others];
}

/** "/wp-content/uploads/2026/a.jpg?x=1" becomes "2026/a.jpg". Works for full URLs too. */
export function shortImagePath(where: string): string {
  let path = where.trim();
  try {
    path = new URL(path).pathname;
  } catch {
    path = path.split(/[?#]/)[0] ?? path;
  }
  const parts = path.split("/").filter(Boolean);
  return parts.slice(-2).join("/") || where;
}

/** decodeURIComponent that never throws on a malformed path. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Text without any Hebrew letters (URLs, file names, "GET /api/x") reads left to right. */
export function isLatinText(value: string): boolean {
  return !/[֐-׿]/.test(value);
}

export type LcpRating = "good" | "needs" | "poor";

/** The usual Web Vitals lines for Largest Contentful Paint. */
export function lcpRating(ms: number): LcpRating {
  if (ms <= 2500) return "good";
  if (ms <= 4000) return "needs";
  return "poor";
}

export const LCP_RATING_WORD: Record<LcpRating, string> = {
  good: "טוב",
  needs: "דורש שיפור",
  poor: "איטי",
};
