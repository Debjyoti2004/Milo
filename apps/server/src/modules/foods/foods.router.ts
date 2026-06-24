import { Router } from "express";
import { z } from "zod";
import { customFoodInputSchema, foodLogInputSchema } from "@gym/shared";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { parseFoodText, reviewDayNutrition, suggestMeals } from "../../lib/ai.js";
import * as foodsService from "./foods.service.js";

export const foodsRouter = Router();
foodsRouter.use(requireAuth);

const searchQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  take: z.coerce.number().int().min(1).max(100).default(30),
  mine: z.coerce.boolean().default(false),
});

foodsRouter.get(
  "/",
  validateQuery(searchQuerySchema),
  asyncHandler(async (req, res) => {
    const { q, take, mine } = req.query as unknown as z.infer<typeof searchQuerySchema>;
    const foods = await foodsService.searchFoods(req.userId!, q, take, mine);
    res.json({ foods });
  }),
);

foodsRouter.post(
  "/",
  validateBody(customFoodInputSchema),
  asyncHandler(async (req, res) => {
    const food = await foodsService.createCustomFood(req.userId!, req.body);
    res.status(201).json({ food });
  }),
);

const logsQuerySchema = z.object({ date: z.coerce.date() });

export const foodLogsRouter = Router();
foodLogsRouter.use(requireAuth);

foodLogsRouter.get(
  "/",
  validateQuery(logsQuerySchema),
  asyncHandler(async (req, res) => {
    const { date } = req.query as unknown as z.infer<typeof logsQuerySchema>;
    const logs = await foodsService.listFoodLogs(req.userId!, date);
    res.json({ logs });
  }),
);

foodLogsRouter.post(
  "/",
  validateBody(foodLogInputSchema),
  asyncHandler(async (req, res) => {
    const log = await foodsService.createFoodLog(req.userId!, req.body);
    res.status(201).json({ log });
  }),
);

foodLogsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await foodsService.deleteFoodLog(req.userId!, req.params.id);
    res.status(204).end();
  }),
);

// ─── AI endpoints ─────────────────────────────────────────────────────────────

const aiParseBodySchema = z.object({ text: z.string().trim().min(1).max(500) });
const aiSuggestQuerySchema = z.object({
  remainingCalories: z.coerce.number(),
  remainingProteinG: z.coerce.number(),
  remainingCarbsG: z.coerce.number(),
  remainingFatG: z.coerce.number(),
  availableFoods: z.string().trim().max(500).optional(),
});

const aiReviewBodySchema = z.object({
  consumed: z.object({ calories: z.number(), proteinG: z.number(), carbsG: z.number(), fatG: z.number() }),
  targets: z.object({ calories: z.number(), proteinG: z.number(), carbsG: z.number(), fatG: z.number() }),
});

export const foodAiRouter = Router();
foodAiRouter.use(requireAuth);

foodAiRouter.post(
  "/parse",
  validateBody(aiParseBodySchema),
  asyncHandler(async (req, res) => {
    const { text } = req.body as { text: string };
    const items = await parseFoodText(text);
    res.json({ items });
  }),
);

foodAiRouter.get(
  "/suggest",
  validateQuery(aiSuggestQuerySchema),
  asyncHandler(async (req, res) => {
    const params = req.query as unknown as z.infer<typeof aiSuggestQuerySchema>;
    const suggestions = await suggestMeals(params);
    res.json({ suggestions });
  }),
);

foodAiRouter.post(
  "/review",
  validateBody(aiReviewBodySchema),
  asyncHandler(async (req, res) => {
    const review = await reviewDayNutrition(req.body);
    res.json({ review });
  }),
);
