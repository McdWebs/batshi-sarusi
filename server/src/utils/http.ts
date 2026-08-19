import type { Response } from "express";
import type { CartSession } from "../types/api.js";
import { CART_SESSION_HEADERS } from "../middleware/cartSession.js";

export function sendSuccess<T>(res: Response, data: T, status = 200, cacheSeconds = 0) {
  if (cacheSeconds > 0) {
    res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`);
  } else {
    res.setHeader("Cache-Control", "no-store");
  }
  res.status(status).json({
    success: true,
    data,
  });
}

export function sendCartSuccess(res: Response, data: unknown, session: CartSession, status = 200) {
  res.setHeader("Cache-Control", "no-store");
  if (session.cartToken) {
    res.setHeader("X-Cart-Token", session.cartToken);
  }
  if (session.nonce) {
    res.setHeader("X-Cart-Nonce", session.nonce);
  }
  res.setHeader("Access-Control-Expose-Headers", CART_SESSION_HEADERS.join(", "));
  res.status(status).json({
    success: true,
    data,
    session,
  });
}
