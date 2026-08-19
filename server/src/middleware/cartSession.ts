import type { Request } from "express";
import type { StoreApiSession } from "../integrations/woocommerce/types.js";

function firstHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value && value.length > 0 ? value : null;
}

export function readCartSession(req: Request): StoreApiSession {
  return {
    cartToken: firstHeader(req.header("x-cart-token") ?? req.header("cart-token")),
    nonce: firstHeader(req.header("x-cart-nonce") ?? req.header("nonce")),
    nonceTimestamp: null,
    cartHash: null,
  };
}

export const CART_SESSION_HEADERS = ["X-Cart-Token", "X-Cart-Nonce"];
