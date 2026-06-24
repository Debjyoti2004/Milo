import { Router } from "express";
import { z } from "zod";
import {
  addSessionExerciseSchema,
  restTakenInputSchema,
  sessionExerciseUpdateSchema,
  setLogInputSchema,
  startSessionSchema,
} from "@gym/shared";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import * as sessionsService from "./sessions.service.js";

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

sessionsRouter.get(
  "/",
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { from, to, take, cursor } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const result = await sessionsService.listSessions(req.userId!, { from, to, take, cursor });
    res.json(result);
  }),
);

sessionsRouter.post(
  "/start",
  validateBody(startSessionSchema),
  asyncHandler(async (req, res) => {
    const session = await sessionsService.startSession(req.userId!, req.body);
    res.status(201).json({ session });
  }),
);

sessionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const session = await sessionsService.getSession(req.userId!, req.params.id);
    res.json({ session });
  }),
);

sessionsRouter.patch(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const session = await sessionsService.completeSession(req.userId!, req.params.id);
    res.json({ session });
  }),
);

sessionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await sessionsService.deleteSession(req.userId!, req.params.id);
    res.status(204).end();
  }),
);

sessionsRouter.post(
  "/:id/exercises",
  validateBody(addSessionExerciseSchema),
  asyncHandler(async (req, res) => {
    const sessionExercise = await sessionsService.addSessionExercise(
      req.userId!,
      req.params.id,
      req.body,
    );
    res.status(201).json({ sessionExercise });
  }),
);

sessionsRouter.post(
  "/exercises/:sessionExerciseId/sets",
  validateBody(setLogInputSchema),
  asyncHandler(async (req, res) => {
    const set = await sessionsService.addSetLog(
      req.userId!,
      req.params.sessionExerciseId,
      req.body,
    );
    res.status(201).json({ set });
  }),
);

sessionsRouter.delete(
  "/exercises/:sessionExerciseId/sets/:setId",
  asyncHandler(async (req, res) => {
    await sessionsService.deleteSetLog(req.userId!, req.params.sessionExerciseId, req.params.setId);
    res.status(204).end();
  }),
);

sessionsRouter.patch(
  "/exercises/:sessionExerciseId",
  validateBody(sessionExerciseUpdateSchema),
  asyncHandler(async (req, res) => {
    const sessionExercise = await sessionsService.updateSessionExercise(
      req.userId!,
      req.params.sessionExerciseId,
      req.body,
    );
    res.json({ sessionExercise });
  }),
);

sessionsRouter.patch(
  "/exercises/:sessionExerciseId/sets/:setId/rest",
  validateBody(restTakenInputSchema),
  asyncHandler(async (req, res) => {
    const set = await sessionsService.recordRestTaken(
      req.userId!,
      req.params.sessionExerciseId,
      req.params.setId,
      req.body,
    );
    res.json({ set });
  }),
);
