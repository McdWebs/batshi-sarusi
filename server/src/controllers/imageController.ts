import type { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { imageQuerySchema } from "../schemas/image.js";
import { ImageCache, fetchSource, getOptimizedImage, pickFormat, snapWidth, validateSourceUrl } from "../services/imageProxy.js";
import { parseWith } from "../middleware/validate.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// server/.data is git-ignored. The folder only holds resized copies of public product photos.
const cache = new ImageCache(path.resolve(here, "../../.data/img-cache"), env.IMAGE_CACHE_MAX_MB * 1024 * 1024);
const allowedHost = new URL(env.WOOCOMMERCE_BASE_URL).hostname;

/** GET /api/img?url=<photo on the shop's server>&w=<width>: the same photo, resized and recompressed. */
export async function optimizedImageHandler(req: Request, res: Response) {
  const query = parseWith(imageQuerySchema, req.query);
  const source = validateSourceUrl(query.url, allowedHost);
  const result = await getOptimizedImage({
    url: source,
    width: snapWidth(query.w),
    format: pickFormat(req.get("accept")),
    cache: cache,
    fetcher: fetchSource,
  });
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Vary", "Accept");
  res.setHeader("ETag", result.etag);
  res.setHeader("X-Image-Cache", result.cacheHit ? "hit" : "miss");
  if (req.get("if-none-match") === result.etag) {
    res.status(304).end();
    return;
  }
  res.type(result.contentType).send(result.body);
}
