import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { env, woocommerceStoreApiBase } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../utils/errors.js";
import { mapWooError } from "./mapError.js";
import type { StoreApiResult, StoreApiSession, WooErrorBody } from "./types.js";

export type StoreApiRequest = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  session?: Partial<StoreApiSession> | null;
};

function header(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  return null;
}

function readSession(headers: Record<string, unknown>): StoreApiSession {
  const lower: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    lower[key.toLowerCase()] = value;
  }
  return {
    cartToken: header(lower["cart-token"]),
    nonce: header(lower["nonce"]),
    nonceTimestamp: header(lower["nonce-timestamp"]),
    cartHash: header(lower["cart-hash"]),
  };
}

function mergeSession(previous: Partial<StoreApiSession> | null | undefined, next: StoreApiSession): StoreApiSession {
  return {
    cartToken: next.cartToken ?? previous?.cartToken ?? null,
    nonce: next.nonce ?? previous?.nonce ?? null,
    nonceTimestamp: next.nonceTimestamp ?? previous?.nonceTimestamp ?? null,
    cartHash: next.cartHash ?? previous?.cartHash ?? null,
  };
}

export const storeApi = axios.create({
  baseURL: woocommerceStoreApiBase,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "User-Agent": "batshi-storefront-api/0.1",
  },
  validateStatus: () => true,
});

export async function storeApiRequest<T>(request: StoreApiRequest): Promise<StoreApiResult<T>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (request.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (request.session?.cartToken) {
    headers["Cart-Token"] = request.session.cartToken;
  }
  if (request.session?.nonce) {
    headers.Nonce = request.session.nonce;
  }

  const params: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined) {
      params[key] = value;
    }
  }

  const config: AxiosRequestConfig = {
    method: request.method ?? "GET",
    url: request.path,
    params,
    data: request.body,
    headers,
    timeout: env.REQUEST_TIMEOUT_MS,
  };

  const started = Date.now();
  try {
    const response = await storeApi.request<T | WooErrorBody>(config);
    const session = mergeSession(request.session, readSession(response.headers as Record<string, unknown>));
    const totalHeader = header((response.headers as Record<string, unknown>)["x-wp-total"]);
    const totalPagesHeader = header((response.headers as Record<string, unknown>)["x-wp-totalpages"]);

    logger.info(
      {
        wooPath: request.path,
        method: request.method ?? "GET",
        status: response.status,
        ms: Date.now() - started,
      },
      "woocommerce.store_api",
    );

    if (response.status >= 400) {
      throw mapWooError(response.status, response.data, session);
    }

    return {
      data: response.data as T,
      status: response.status,
      total: totalHeader ? Number(totalHeader) : null,
      totalPages: totalPagesHeader ? Number(totalPagesHeader) : null,
      session,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const axiosError = error as AxiosError;
    logger.error(
      {
        wooPath: request.path,
        code: axiosError.code,
        message: axiosError.message,
        ms: Date.now() - started,
      },
      "woocommerce.store_api.failed",
    );
    if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
      throw new AppError("WOOCOMMERCE_UNAVAILABLE", "Store service temporarily unavailable", 503);
    }
    throw new AppError("WOOCOMMERCE_UNAVAILABLE", "Store service temporarily unavailable", 503);
  }
}
