import { z } from "zod";

const draftSchema = z.object({
  description: z.string().trim().min(1).max(4000),
  bullets: z.array(z.string().trim().min(1).max(200)).max(8),
  seoTitle: z.string().trim().min(1).max(120),
  metaDescription: z.string().trim().min(1).max(300),
  imageAlt: z.string().trim().min(1).max(200),
});

export const generateContentBodySchema = z.object({
  productId: z.coerce.number().int().positive(),
  /** Editor instruction for a rephrase, sent together with the draft it applies to. */
  instruction: z.string().trim().min(1).max(300).optional(),
  previous: draftSchema.optional(),
});
