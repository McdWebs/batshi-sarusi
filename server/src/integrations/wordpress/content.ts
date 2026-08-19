import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { env, wordpressApiBase } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../utils/errors.js";
import { mapWooError } from "../woocommerce/mapError.js";

function header(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0] ?? null;
  return null;
}

export const wordpressApi = axios.create({
  baseURL: wordpressApiBase,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "User-Agent": "batshi-storefront-api/0.1",
  },
  validateStatus: () => true,
});

export async function wordpressRequest<T>(path: string, query?: Record<string, string | number | undefined>) {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params[key] = value;
  }
  const config: AxiosRequestConfig = { method: "GET", url: path, params, timeout: env.REQUEST_TIMEOUT_MS };
  const started = Date.now();
  try {
    const response = await wordpressApi.request<T>(config);
    logger.info({ wpPath: path, status: response.status, ms: Date.now() - started }, "wordpress.rest");
    if (response.status >= 400) {
      throw mapWooError(response.status, response.data);
    }
    const total = header((response.headers as Record<string, unknown>)["x-wp-total"]);
    return {
      data: response.data,
      total: total ? Number(total) : Array.isArray(response.data) ? response.data.length : 1,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const axiosError = error as AxiosError;
    logger.error({ wpPath: path, code: axiosError.code, message: axiosError.message }, "wordpress.rest.failed");
    throw new AppError("WOOCOMMERCE_UNAVAILABLE", "Store service temporarily unavailable", 503);
  }
}

export type WpRendered = { rendered?: string; raw?: string };

export type WpPage = {
  id: number;
  slug: string;
  link: string;
  title?: WpRendered;
  content?: WpRendered;
  excerpt?: WpRendered;
};

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&#8211;/g, "–").trim();
}

export function mapPage(page: WpPage) {
  return {
    id: page.id,
    slug: page.slug,
    link: page.link,
    title: stripTags(page.title?.rendered ?? ""),
    contentHtml: page.content?.rendered ?? "",
    excerptHtml: page.excerpt?.rendered ?? "",
  };
}

export async function listPages() {
  return wordpressRequest<WpPage[]>("/pages", { per_page: 100 });
}

export async function getPageBySlug(slug: string) {
  return wordpressRequest<WpPage[]>("/pages", { slug });
}

export async function listBanners() {
  try {
    return await wordpressRequest<WpPage[]>("/homepage_banners", { per_page: 20 });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return { data: [] as WpPage[], total: 0 };
    }
    throw error;
  }
}
