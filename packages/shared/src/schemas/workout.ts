import { z } from "zod";
import { DAYS_OF_WEEK, SET_TYPES, TRACKING_MODES } from "../enums.js";

export const routineExerciseInputSchema = z.object({
  exerciseId: z.string().min(1),
  orderIndex: z.number().int().min(0),
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100),
  targetRepsMax: z.number().int().min(1).max(100).nullable().optional(),
  notes: z.string().max(200).nullable().optional(),
});
export type RoutineExerciseInput = z.infer<typeof routineExerciseInputSchema>;

export const routineDayUpdateSchema = z.object({
  label: z.string().min(1).max(60).optional(),
  isRestDay: z.boolean().optional(),
  exercises: z.array(routineExerciseInputSchema).optional(),
});
export type RoutineDayUpdateInput = z.infer<typeof routineDayUpdateSchema>;

export const dayOfWeekSchema = z.enum(DAYS_OF_WEEK);

export const startSessionSchema = z.object({
  routineDayId: z.string().min(1).nullable().optional(),
  date: z.coerce.date().optional(),
});
export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const addSessionExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100),
  targetRepsMax: z.number().int().min(1).max(100).nullable().optional(),
  notes: z.string().max(200).nullable().optional(),
});
export type AddSessionExerciseInput = z.infer<typeof addSessionExerciseSchema>;

export const setLogInputSchema = z.object({
  setNumber: z.number().int().min(1).max(20),
  weightKg: z.number().min(0).max(500),
  reps: z.number().int().min(0).max(200),
  rpe: z.number().min(1).max(10).nullable().optional(),
  setType: z.enum(SET_TYPES).default("NORMAL"),
  holdSeconds: z.number().int().min(0).max(3600).nullable().optional(),
});
export type SetLogInput = z.infer<typeof setLogInputSchema>;

export const restTakenInputSchema = z.object({
  restSecondsAfter: z.number().int().min(0).max(3600),
});
export type RestTakenInput = z.infer<typeof restTakenInputSchema>;

export const routineExerciseUpdateSchema = z.object({
  targetSets: z.number().int().min(1).max(20).optional(),
  targetRepsMin: z.number().int().min(1).max(100).optional(),
  targetRepsMax: z.number().int().min(1).max(100).nullable().optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
  defaultWeightKg: z.number().min(0).max(500).nullable().optional(),
  trackingMode: z.enum(TRACKING_MODES).optional(),
  targetHoldSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  applyToOtherDayExercises: z.boolean().optional(),
});
export type RoutineExerciseUpdateInput = z.infer<typeof routineExerciseUpdateSchema>;

export const routineExerciseAlternativesSchema = z.object({
  exerciseIds: z.array(z.string().min(1)).max(8),
});
export type RoutineExerciseAlternativesInput = z.infer<typeof routineExerciseAlternativesSchema>;

export const rotateRoutineExerciseSchema = z.object({
  direction: z.enum(["prev", "next"]),
});
export type RotateRoutineExerciseInput = z.infer<typeof rotateRoutineExerciseSchema>;

export const sessionExerciseUpdateSchema = z.object({
  targetSets: z.number().int().min(1).max(20).optional(),
  targetRepsMin: z.number().int().min(1).max(100).optional(),
  targetRepsMax: z.number().int().min(1).max(100).nullable().optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
});
export type SessionExerciseUpdateInput = z.infer<typeof sessionExerciseUpdateSchema>;

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  primaryMuscles: z.array(z.string().min(1)).min(1).max(5),
  notes: z.string().max(500).nullable().optional(),
});
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
