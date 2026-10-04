import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

/**
 * Gate for the owner-only studio routes (AI drafts, demand list). They spend the AI quota or show business data,
 * so they need the studio access code, sent as the X-Studio-Key header.
 *
 * With no code configured the routes stay open for local development and are locked in production, so a deploy
 * that forgot to set STUDIO_ACCESS_KEY fails closed.
 */
export function requireStudioKey(req: Request, _res: Response, next: NextFunction) {
  const configured = env.STUDIO_ACCESS_KEY;
  if (!configured) {
    if (env.NODE_ENV === "production") {
      next(new AppError("STUDIO_LOCKED", "The studio is off: set STUDIO_ACCESS_KEY on the server to enable it", 503));
      return;
    }
    next();
    return;
  }
  const given = req.header("x-studio-key") ?? "";
  // Comparing fixed-length digests keeps the check constant-time whatever length the caller sends.
  if (!crypto.timingSafeEqual(digest(given), digest(configured))) {
    next(new AppError("STUDIO_UNAUTHORIZED", "Wrong studio access code", 401));
    return;
  }
  next();
}
