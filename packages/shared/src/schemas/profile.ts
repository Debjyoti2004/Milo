import { z } from "zod";
import { ACTIVITY_LEVELS, EXPERIENCE_LEVELS, GENDERS, GOALS, UNIT_PREFERENCES } from "../enums.js";

export const onboardingSchema = z.object({
  gender: z.enum(GENDERS),
  dateOfBirth: z.coerce.date(),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300).optional(),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(GOALS),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  trainingDaysPerWeek: z.number().int().min(1).max(7),
  unitPreference: z.enum(UNIT_PREFERENCES).default("KG"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateProfileSchema = onboardingSchema.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
