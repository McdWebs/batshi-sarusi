import type { Response } from "express";
import type { CartSession } from "../types/api.js";
import { CART_SESSION_HEADERS } from "../middleware/cartSession.js";

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  res.status(status).json({
    success: true,
    data,
  });
}

export function sendCartSuccess(res: Response, data: unknown, session: CartSession, status = 200) {
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
