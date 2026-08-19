import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { isAppError } from "../utils/errors.js";
import { StoreApiError } from "../integrations/woocommerce/mapError.js";
import { CART_SESSION_HEADERS } from "./cartSession.js";

function applySession(res: Response, error: unknown) {
  if (error instanceof StoreApiError && error.session) {
    if (error.session.cartToken) {
      res.setHeader("X-Cart-Token", error.session.cartToken);
    }
    if (error.session.nonce) {
      res.setHeader("X-Cart-Nonce", error.session.nonce);
    }
    res.setHeader("Access-Control-Expose-Headers", CART_SESSION_HEADERS.join(", "));
  }
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  applySession(res, error);

  if (isAppError(error)) {
    if (error.statusCode >= 500) {
      logger.error({ err: error, requestId: req.id, code: error.code }, "request.failed");
    } else {
      logger.warn({ requestId: req.id, code: error.code, message: error.message }, "request.rejected");
    }
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.expose ? error.message : "Store service temporarily unavailable",
      },
    });
    return;
  }

  logger.error({ err: error, requestId: req.id }, "request.unhandled");
  const message = env.NODE_ENV === "production" ? "Store service temporarily unavailable" : "Unexpected server error";
  res.status(500).json({
    success: false,
    error: {
      code: "WOOCOMMERCE_UNAVAILABLE",
      message,
    },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
}
