import crypto from "node:crypto";
import type { Request } from "express";
import { env } from "../config/env.js";

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

/**
 * True when the request carries the private edge key (header X-Edge-Key). The storefront's edge function sends it
 * when it reads product and category data to put into the page for search engines. Those requests all come from a
 * few Vercel addresses, so they must not share the per-address rate limit that protects the API from visitors.
 * With no key configured nothing is exempt.
 */
export function hasEdgeKey(req: Request): boolean {
  const configured = env.EDGE_API_KEY;
  if (!configured) return false;
  const given = req.header("x-edge-key") ?? "";
  return crypto.timingSafeEqual(digest(given), digest(configured));
}
