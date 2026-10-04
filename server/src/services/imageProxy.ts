import axios from "axios";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { AppError } from "../utils/errors.js";

/** The only widths the server will produce, so the cache holds a handful of variants per photo instead of thousands. */
export const IMAGE_WIDTHS = [240, 360, 480, 720, 1080] as const;
export type ImageFormat = "webp" | "jpeg";

const UPLOADS_PREFIX = "/wp-content/uploads/";
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;
const CACHE_VERSION = "v1";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** The smallest allowed width that is at least as wide as the request (the largest allowed one if it is wider still). */
export function snapWidth(requested: number): number {
  return IMAGE_WIDTHS.find((width) => width >= requested) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]!;
}

/**
 * Only photos from the shop's own uploads folder may be fetched. This is what stops the endpoint from being used to
 * make the server request arbitrary addresses: https only, exact host, no credentials in the URL, no path tricks.
 */
export function validateSourceUrl(raw: string, allowedHost: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError("IMAGE_URL_NOT_ALLOWED", "Not a valid image address", 400);
  }
  const ok =
    url.protocol === "https:" &&
    url.hostname.toLowerCase() === allowedHost.toLowerCase() &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    url.pathname.startsWith(UPLOADS_PREFIX) &&
    !url.pathname.split("/").includes("..");
  if (!ok) throw new AppError("IMAGE_URL_NOT_ALLOWED", "That image address is not allowed", 400);
  url.hash = "";
  return url;
}

export function pickFormat(accept: string | undefined): ImageFormat {
  return accept && /image\/webp/i.test(accept) ? "webp" : "jpeg";
}

export function cacheKey(url: URL, width: number, format: ImageFormat): string {
  return crypto.createHash("sha1").update(`${CACHE_VERSION}|${url.href}|${width}|${format}`).digest("hex");
}

/** Finished variants on disk. Oldest files go first once the folder passes its size limit. */
export class ImageCache {
  private writes = 0;

  constructor(
    private readonly dir: string,
    private readonly maxBytes: number,
  ) {}

  private file(key: string) {
    return path.join(this.dir, key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const body = await fs.readFile(this.file(key));
      const now = new Date();
      void fs.utimes(this.file(key), now, now).catch(() => undefined);
      return body;
    } catch {
      return null;
    }
  }

  async set(key: string, body: Buffer): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    const temp = `${this.file(key)}.${process.pid}.tmp`;
    await fs.writeFile(temp, body);
    await fs.rename(temp, this.file(key));
    this.writes += 1;
    if (this.writes % 25 === 0) await this.evict();
  }

  async evict(): Promise<number> {
    let names: string[];
    try {
      names = await fs.readdir(this.dir);
    } catch {
      return 0;
    }
    const files = (
      await Promise.all(
        names
          .filter((name) => !name.endsWith(".tmp"))
          .map(async (name) => {
            const stat = await fs.stat(path.join(this.dir, name)).catch(() => null);
            return stat ? { name, size: stat.size, mtime: stat.mtimeMs } : null;
          }),
      )
    ).filter((entry): entry is { name: string; size: number; mtime: number } => entry !== null);
    let total = files.reduce((sum, entry) => sum + entry.size, 0);
    if (total <= this.maxBytes) return 0;
    let removed = 0;
    for (const entry of files.sort((a, b) => a.mtime - b.mtime)) {
      if (total <= this.maxBytes * 0.8) break;
      await fs.unlink(path.join(this.dir, entry.name)).catch(() => undefined);
      total -= entry.size;
      removed += 1;
    }
    return removed;
  }
}

export async function transform(input: Buffer, width: number, format: ImageFormat): Promise<Buffer> {
  let pipeline = sharp(input, { failOn: "none", limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width, withoutEnlargement: true });
  if (format === "webp") {
    pipeline = pipeline.webp({ quality: 74, effort: 4 });
  } else {
    pipeline = pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 78, mozjpeg: true, progressive: true });
  }
  try {
    return await pipeline.toBuffer();
  } catch {
    throw new AppError("IMAGE_UNREADABLE", "The image could not be read", 422);
  }
}

export type Fetcher = (url: URL) => Promise<Buffer>;

export const fetchSource: Fetcher = async (url) => {
  let response;
  try {
    response = await axios.get<ArrayBuffer>(url.href, {
      responseType: "arraybuffer",
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: MAX_SOURCE_BYTES,
      maxRedirects: 0,
      headers: { "User-Agent": "batshi-storefront-api/0.1", Accept: "image/*" },
      validateStatus: () => true,
    });
  } catch {
    throw new AppError("IMAGE_FETCH_FAILED", "The original image could not be loaded", 502);
  }
  const type = String(response.headers["content-type"] ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (response.status !== 200 || !ALLOWED_TYPES.has(type)) {
    throw new AppError("IMAGE_FETCH_FAILED", "The original image could not be loaded", 502);
  }
  return Buffer.from(response.data);
};

const inflight = new Map<string, Promise<Buffer>>();

export type OptimizedImage = { body: Buffer; contentType: string; etag: string; cacheHit: boolean };

/** Returns the resized photo from the cache, or builds it once even if many shoppers ask for it at the same moment. */
export async function getOptimizedImage(args: {
  url: URL;
  width: number;
  format: ImageFormat;
  cache: ImageCache;
  fetcher: Fetcher;
}): Promise<OptimizedImage> {
  const { url, width, format, cache, fetcher } = args;
  const key = cacheKey(url, width, format);
  const contentType = format === "webp" ? "image/webp" : "image/jpeg";
  const etag = `"${key}"`;

  const cached = await cache.get(key);
  if (cached) return { body: cached, contentType, etag, cacheHit: true };

  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      const original = await fetcher(url);
      const body = await transform(original, width, format);
      await cache.set(key, body).catch(() => undefined);
      return body;
    })().finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return { body: await pending, contentType, etag, cacheHit: false };
}
