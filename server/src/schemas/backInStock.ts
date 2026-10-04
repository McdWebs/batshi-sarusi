import { z } from "zod";

export const subscribeBodySchema = z.object({
  productId: z.coerce.number().int().positive(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
});
