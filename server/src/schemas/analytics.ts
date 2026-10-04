import { z } from "zod";

/** Every event the storefront may report. Anything else is rejected, so the store cannot fill up with junk. */
export const EVENT_NAMES = [
  "session_start",
  "page_view",
  "scroll_depth",
  "click",
  "search",
  "sort_change",
  "page_change",
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "cart_view",
  "checkout_view",
  "back_in_stock_signup",
  "coupon_try",
  "shipping_select",
  "checkout_field",
  "error",
  "not_found",
  "perf",
  "page_time",
  "rage_click",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const idPattern = /^[A-Za-z0-9-]{8,64}$/;
const propValue = z.union([z.string().max(120), z.number().finite(), z.boolean(), z.null()]);

const eventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  /** Path only (no query string, no hash). */
  path: z.string().max(200),
  /** Client clock in ms. Only used to keep the order of events inside one batch. */
  at: z.number().int().optional(),
  props: z
    .record(z.string().max(40), propValue)
    .refine((value) => Object.keys(value).length <= 12, "Too many properties")
    .default({}),
});

export const ingestBodySchema = z.object({
  visitorId: z.string().regex(idPattern),
  sessionId: z.string().regex(idPattern),
  device: z.enum(["mobile", "tablet", "desktop"]),
  events: z.array(eventSchema).min(1).max(50),
});

export const forgetBodySchema = z.object({
  visitorId: z.string().regex(idPattern),
});

export const summaryQuerySchema = z.object({
  days: z.coerce.number().int().refine((value) => [1, 7, 30, 90].includes(value), "days must be 1, 7, 30 or 90").default(7),
});

export type IngestBody = z.infer<typeof ingestBodySchema>;
