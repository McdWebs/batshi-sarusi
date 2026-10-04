const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const PHONE_LIKE = /\+?\d[\d\s().-]{7,}\d/g;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|preview|monitor|lighthouse/i;

export type PropValue = string | number | boolean | null;

/** Removes anything that looks like an email address or a phone number from a free-text value. */
export function scrubText(value: string): string {
  return value
    .replace(EMAIL, "[removed]")
    // Phone numbers have 9 or more digits. Shorter runs (sizes, model codes like CK35663-1) are kept.
    .replace(PHONE_LIKE, (match) => (match.replace(/\D/g, "").length >= 9 ? "[removed]" : match))
    .trim();
}

export function scrubProps(props: Record<string, PropValue>): Record<string, PropValue> {
  const clean: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(props)) {
    clean[key] = typeof value === "string" ? scrubText(value) : value;
  }
  return clean;
}

/** Keeps the path only: no query string and no hash, since those can carry personal data. */
export function cleanPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? "";
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

export function isBot(userAgent: string | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}
