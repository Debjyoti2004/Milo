import { Router } from "express";
import {
  rotateRoutineExerciseSchema,
  routineDayUpdateSchema,
  routineExerciseAlternativesSchema,
  routineExerciseUpdateSchema,
} from "@gym/shared";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import * as routinesService from "./routines.service.js";

export const routinesRouter = Router();
routinesRouter.use(requireAuth);

routinesRouter.get(
  "/active",
  asyncHandler(async (req, res) => {
    const routine = await routinesService.getActiveRoutine(req.userId!);
    res.json({ routine });
  }),
);

routinesRouter.patch(
  "/days/:dayId",
  validateBody(routineDayUpdateSchema),
  asyncHandler(async (req, res) => {
    const day = await routinesService.updateRoutineDay(req.userId!, req.params.dayId, req.body);
    res.json({ day });
  }),
);

routinesRouter.patch(
  "/exercises/:routineExerciseId",
  validateBody(routineExerciseUpdateSchema),
  asyncHandler(async (req, res) => {
    const routineExercise = await routinesService.updateRoutineExercise(
      req.userId!,
      req.params.routineExerciseId,
      req.body,
    );
    res.json({ routineExercise });
  }),
);

routinesRouter.patch(
  "/exercises/:routineExerciseId/alternatives",
  validateBody(routineExerciseAlternativesSchema),
  asyncHandler(async (req, res) => {
    const routineExercise = await routinesService.updateRoutineExerciseAlternatives(
      req.userId!,
      req.params.routineExerciseId,
      req.body,
    );
    res.json({ routineExercise });
  }),
);

routinesRouter.post(
  "/exercises/:routineExerciseId/rotate",
  validateBody(rotateRoutineExerciseSchema),
  asyncHandler(async (req, res) => {
    const routineExercise = await routinesService.rotateRoutineExercise(
      req.userId!,
      req.params.routineExerciseId,
      req.body,
    );
    res.json({ routineExercise });
  }),
);
