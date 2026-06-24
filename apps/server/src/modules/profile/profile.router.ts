import { Router } from "express";
import { z } from "zod";
import { onboardingSchema, updateProfileSchema } from "@gym/shared";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import * as profileService from "./profile.service.js";

const nutritionTargetsSchema = z.object({
  dailyCalorieTarget: z.number().int().min(500).max(10000).nullable().optional(),
  proteinTargetG: z.number().int().min(0).max(1000).nullable().optional(),
  carbsTargetG: z.number().int().min(0).max(2000).nullable().optional(),
  fatTargetG: z.number().int().min(0).max(1000).nullable().optional(),
  waterTargetMl: z.number().int().min(0).max(10000).nullable().optional(),
});

export const profileRouter = Router();
profileRouter.use(requireAuth);

profileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile(req.userId!);
    res.json({ profile });
  }),
);

profileRouter.post(
  "/onboarding",
  validateBody(onboardingSchema),
  asyncHandler(async (req, res) => {
    const profile = await profileService.completeOnboarding(req.userId!, req.body);
    res.status(201).json({ profile });
  }),
);

profileRouter.patch(
  "/",
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = await profileService.updateProfile(req.userId!, req.body);
    res.json({ profile });
  }),
);

profileRouter.patch(
  "/nutrition-targets",
  validateBody(nutritionTargetsSchema),
  asyncHandler(async (req, res) => {
    const profile = await profileService.updateNutritionTargets(req.userId!, req.body);
    res.json({ profile });
  }),
);

profileRouter.post(
  "/deload",
  asyncHandler(async (req, res) => {
    const profile = await profileService.acknowledgeDeload(req.userId!);
    res.json({ profile });
  }),
);
