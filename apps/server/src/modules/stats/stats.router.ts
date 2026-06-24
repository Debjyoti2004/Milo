import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateQuery } from "../../middleware/validate.js";
import * as statsService from "./stats.service.js";

export const statsRouter = Router();
statsRouter.use(requireAuth);

const dateQuerySchema = z.object({ date: z.coerce.date().default(() => new Date()) });

statsRouter.get(
  "/today",
  validateQuery(dateQuerySchema),
  asyncHandler(async (req, res) => {
    const { date } = req.query as unknown as z.infer<typeof dateQuerySchema>;
    const summary = await statsService.getTodaySummary(req.userId!, date);
    res.json(summary);
  }),
);

statsRouter.get(
  "/exercises/:exerciseId/progress",
  asyncHandler(async (req, res) => {
    const progress = await statsService.getExerciseProgress(req.userId!, req.params.exerciseId);
    res.json({ progress });
  }),
);

const rangeQuerySchema = z.object({ from: z.coerce.date(), to: z.coerce.date() });

statsRouter.get(
  "/adherence",
  validateQuery(rangeQuerySchema),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as z.infer<typeof rangeQuerySchema>;
    const adherence = await statsService.getAdherence(req.userId!, from, to);
    res.json({ adherence });
  }),
);
