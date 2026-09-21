import { z } from "zod";

export const productUpdateSchema = z.object({
  name: z.string().min(2).max(200),
  model: z.string().max(120).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.coerce.boolean(),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
