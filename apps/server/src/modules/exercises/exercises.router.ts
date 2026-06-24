import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { createExerciseSchema } from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import * as exercisesService from "./exercises.service.js";

export const exercisesRouter = Router();

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  muscle: z.string().trim().max(50).optional(),
  equipment: z.string().trim().max(50).optional(),
  take: z.coerce.number().int().min(1).max(100).default(40),
  cursor: z.string().optional(),
});

exercisesRouter.use(requireAuth);

exercisesRouter.get(
  "/",
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { q, muscle, equipment, take, cursor } = req.query as unknown as z.infer<
      typeof listQuerySchema
    >;

    const exercises = await prisma.exercise.findMany({
      where: {
        AND: [
          { OR: [{ isCustom: false }, { createdByUserId: req.userId }] },
          q ? { name: { contains: q, mode: "insensitive" } } : {},
          muscle ? { primaryMuscles: { has: muscle } } : {},
          equipment ? { equipment: { equals: equipment, mode: "insensitive" } } : {},
        ],
      },
      include: {
        media: { where: { userId: req.userId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }], take: 1 },
      },
      orderBy: { name: "asc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const nextCursor = exercises.length === take ? exercises[exercises.length - 1].id : null;
    res.json({ exercises, nextCursor });
  }),
);

exercisesRouter.post(
  "/",
  validateBody(createExerciseSchema),
  asyncHandler(async (req, res) => {
    const exercise = await exercisesService.createCustomExercise(req.userId!, req.body);
    res.status(201).json({ exercise });
  }),
);

exercisesRouter.get(
  "/muscles",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.exercise.findMany({ select: { primaryMuscles: true } });
    const muscles = new Set<string>();
    for (const row of rows) row.primaryMuscles.forEach((m) => muscles.add(m));
    res.json({ muscles: [...muscles].sort() });
  }),
);

exercisesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const exercise = await exercisesService.getExerciseWithUserMedia(req.userId!, req.params.id);
    res.json({ exercise });
  }),
);

exercisesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await exercisesService.deleteCustomExercise(req.userId!, req.params.id);
    res.status(204).end();
  }),
);

exercisesRouter.get(
  "/:id/last-performance",
  asyncHandler(async (req, res) => {
    const result = await exercisesService.getLastPerformance(req.userId!, req.params.id);
    res.json(result);
  }),
);

exercisesRouter.post(
  "/:id/media",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded");
    const media = await exercisesService.uploadExerciseMedia(req.userId!, req.params.id, req.file);
    res.status(201).json({ media });
  }),
);

exercisesRouter.patch(
  "/media/:mediaId/primary",
  asyncHandler(async (req, res) => {
    await exercisesService.setPrimaryExerciseMedia(req.userId!, req.params.mediaId);
    res.status(204).end();
  }),
);

exercisesRouter.delete(
  "/media/:mediaId",
  asyncHandler(async (req, res) => {
    await exercisesService.deleteExerciseMedia(req.userId!, req.params.mediaId);
    res.status(204).end();
  }),
);
