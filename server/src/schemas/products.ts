import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(24),
});

export const categoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(100),
});

export const productListQuerySchema = paginationQuerySchema.extend({
  search: z.string().min(1).optional(),
  category: z.coerce.number().int().positive().optional(),
  brand: z.coerce.number().int().positive().optional(),
  type: z.enum(["simple", "variable", "variation", "grouped", "external"]).optional(),
  onSale: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  stockStatus: z.enum(["instock", "outofstock", "onbackorder"]).optional(),
  orderby: z.enum(["date", "price", "title", "menu_order", "popularity", "rating"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const searchQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1, "q is required"),
  orderby: z.enum(["date", "price", "title", "menu_order", "popularity", "rating"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const productIdParamSchema = z.object({
  idOrSlug: z.string().min(1),
});
