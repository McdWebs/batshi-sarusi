import { z } from "zod";

export const imageQuerySchema = z.object({
  url: z.string().min(1).max(600),
  w: z.coerce.number().int().min(1).max(4000).default(480),
});
