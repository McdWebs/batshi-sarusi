import { apiUrl } from "../api/client";

/** Widths the server can produce (it must match IMAGE_WIDTHS in server/src/services/imageProxy.ts). */
export const PROXY_WIDTHS = [240, 360, 480, 720, 1080] as const;
const UPLOADS_PATH = "/wp-content/uploads/";
const FALLBACK_SOURCE_WIDTH = 1080;
const FALLBACK_SRC_WIDTH = 720;

type Candidate = { url: string; width: number };

/** Photos in the shop's uploads folder can be resized by our server. Logos and local assets cannot. */
export function isProxiable(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.pathname.startsWith(UPLOADS_PATH);
  } catch {
    return false;
  }
}

export function proxyUrl(source: string, width: number): string {
  return `${apiUrl("/api/img")}?url=${encodeURIComponent(source)}&w=${width}`;
}

/** Reads WordPress's "url 300w, url 768w" list. */
export function parseSrcset(srcset: string | undefined): Candidate[] {
  if (!srcset) return [];
  const found: Candidate[] = [];
  for (const match of srcset.matchAll(/(\S+)\s+(\d+)w/g)) {
    found.push({ url: match[1]!, width: Number(match[2]) });
  }
  return found.sort((a, b) => a.width - b.width);
}

/**
 * The same photo through our resizer: a srcset with one entry per width the original can fill (each cut from the
 * smallest WordPress copy that is big enough, so the server downloads little), and a mid-size fallback src.
 * Returns null when the photo cannot be resized, and the caller keeps the original.
 */
export function optimizeImage(src: string, srcset?: string): { src: string; srcSet: string } | null {
  if (!isProxiable(src)) return null;
  const sources = parseSrcset(srcset).filter((candidate) => isProxiable(candidate.url));
  const candidates = sources.length > 0 ? sources : [{ url: src, width: FALLBACK_SOURCE_WIDTH }];
  const largest = candidates[candidates.length - 1]!;
  const widths = PROXY_WIDTHS.filter((width) => width <= largest.width);
  const usable = widths.length > 0 ? widths : [PROXY_WIDTHS[0]];

  const entry = (width: number) => {
    const from = candidates.find((candidate) => candidate.width >= width) ?? largest;
    return { width, url: proxyUrl(from.url, width) };
  };
  const entries = usable.map(entry);
  const fallback = [...entries].reverse().find((item) => item.width <= FALLBACK_SRC_WIDTH) ?? entries[0]!;
  return { src: fallback.url, srcSet: entries.map((item) => `${item.url} ${item.width}w`).join(", ") };
}
