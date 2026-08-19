import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env") });
dotenv.config({ path: path.resolve(here, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  WOOCOMMERCE_BASE_URL: z
    .string()
    .url()
    .default("https://batshi-home.co.il"),
  WOOCOMMERCE_CONSUMER_KEY: z.string().optional().default(""),
  WOOCOMMERCE_CONSUMER_SECRET: z.string().optional().default(""),
  WOOCOMMERCE_API_VERSION: z.string().optional().default("wc/v3"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, ""))
  .filter(Boolean);

const wpOrigin = env.WOOCOMMERCE_BASE_URL.replace(/\/$/, "");
export const woocommerceStoreApiBase = `${wpOrigin}/wp-json/wc/store/v1`;
export const wordpressApiBase = `${wpOrigin}/wp-json/wp/v2`;
