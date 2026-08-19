import { AppError } from "../../utils/errors.js";
import { decodeEntities } from "../../utils/html.js";
import type { StoreApiSession, WooErrorBody } from "./types.js";

export class StoreApiError extends AppError {
  readonly session: StoreApiSession | null;

  constructor(code: string, message: string, statusCode: number, session: StoreApiSession | null = null) {
    super(code, message, statusCode);
    this.name = "StoreApiError";
    this.session = session;
  }
}

function isWooErrorBody(data: unknown): data is WooErrorBody {
  return Boolean(data && typeof data === "object" && ("code" in data || "message" in data));
}

export function mapWooError(status: number, data: unknown, session: StoreApiSession | null = null): StoreApiError {
  const body = isWooErrorBody(data) ? data : {};
  const wooCode = typeof body.code === "string" ? body.code : "";
  const message =
    typeof body.message === "string" && body.message.length > 0
      ? decodeEntities(body.message)
      : status >= 500
        ? "Store service temporarily unavailable"
        : "Request could not be completed";

  if (status === 401 && wooCode.includes("nonce")) {
    return new StoreApiError("CART_SESSION_REQUIRED", message, 401, session);
  }
  if (status === 404) {
    return new StoreApiError("NOT_FOUND", message, 404, session);
  }
  if (wooCode.includes("coupon")) {
    return new StoreApiError("INVALID_COUPON", message, status >= 400 && status < 500 ? status : 400, session);
  }
  if (wooCode.includes("stock") || wooCode.includes("out_of_stock")) {
    return new StoreApiError("OUT_OF_STOCK", message, status >= 400 && status < 500 ? status : 400, session);
  }
  if (status >= 500) {
    return new StoreApiError("WOOCOMMERCE_UNAVAILABLE", "Store service temporarily unavailable", 503, session);
  }
  if (status === 400) {
    return new StoreApiError("VALIDATION_ERROR", message, 400, session);
  }
  return new StoreApiError("WOOCOMMERCE_ERROR", message, status, session);
}
