import { z } from "zod";

export const cardioLogInputSchema = z.object({
  date: z.coerce.date(),
  steps: z.number().int().min(0).max(100000).nullable().optional(),
  walkMinutes: z.number().int().min(0).max(600).nullable().optional(),
  hiitMinutes: z.number().int().min(0).max(600).nullable().optional(),
});
export type CardioLogInput = z.infer<typeof cardioLogInputSchema>;
