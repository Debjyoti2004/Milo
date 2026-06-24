import { z } from "zod";
import { MEAL_TYPES } from "../enums.js";

export const customFoodInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  servingSizeG: z.number().min(1).max(2000).default(100),
  caloriesPerServing: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(500),
});
export type CustomFoodInput = z.infer<typeof customFoodInputSchema>;

export const foodLogInputSchema = z
  .object({
    date: z.coerce.date(),
    mealType: z.enum(MEAL_TYPES),
    foodId: z.string().min(1).optional(),
    customName: z.string().trim().min(1).max(120).optional(),
    quantity: z.number().min(0.1).max(50).default(1),
    // Required when logging an ad-hoc entry (customName) instead of a saved Food.
    calories: z.number().min(0).max(5000).optional(),
    proteinG: z.number().min(0).max(500).optional(),
    carbsG: z.number().min(0).max(500).optional(),
    fatG: z.number().min(0).max(500).optional(),
  })
  .refine((data) => Boolean(data.foodId) || Boolean(data.customName), {
    message: "Provide either foodId or customName",
    path: ["foodId"],
  })
  .refine(
    (data) => Boolean(data.foodId) || typeof data.calories === "number",
    {
      message: "calories is required for a custom (non-foodId) entry",
      path: ["calories"],
    },
  );
export type FoodLogInput = z.infer<typeof foodLogInputSchema>;

export const weightLogInputSchema = z.object({
  date: z.coerce.date(),
  weightKg: z.number().min(30).max(300),
  note: z.string().max(200).optional(),
});
export type WeightLogInput = z.infer<typeof weightLogInputSchema>;

export const waterLogInputSchema = z.object({
  date: z.coerce.date(),
  amountMl: z.number().int().min(0).max(10000),
});
export type WaterLogInput = z.infer<typeof waterLogInputSchema>;

export const waistLogInputSchema = z.object({
  date: z.coerce.date(),
  waistCm: z.number().min(30).max(250),
  note: z.string().max(200).optional(),
});
export type WaistLogInput = z.infer<typeof waistLogInputSchema>;
