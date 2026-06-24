import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { cardioLogInputSchema, waistLogInputSchema, waterLogInputSchema, weightLogInputSchema } from "@gym/shared";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { env } from "../../lib/env.js";
import { ApiError } from "../../lib/ApiError.js";
import * as logsService from "./logs.service.js";

const rangeQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

const dateQuerySchema = z.object({ date: z.coerce.date() });

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are supported for progress photos"));
  },
});

// ─── Weight ──────────────────────────────────────────────────────────────────

export const weightLogsRouter = Router();
weightLogsRouter.use(requireAuth);

weightLogsRouter.get(
  "/",
  validateQuery(rangeQuerySchema),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as z.infer<typeof rangeQuerySchema>;
    const logs = await logsService.listWeightLogs(req.userId!, from, to);
    res.json({ logs });
  }),
);

weightLogsRouter.post(
  "/",
  validateBody(weightLogInputSchema),
  asyncHandler(async (req, res) => {
    const log = await logsService.createWeightLog(req.userId!, req.body);
    res.status(201).json({ log });
  }),
);

weightLogsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await logsService.deleteWeightLog(req.userId!, req.params.id);
    res.status(204).end();
  }),
);

// ─── Water ───────────────────────────────────────────────────────────────────

export const waterLogsRouter = Router();
waterLogsRouter.use(requireAuth);

waterLogsRouter.get(
  "/",
  validateQuery(dateQuerySchema),
  asyncHandler(async (req, res) => {
    const { date } = req.query as unknown as z.infer<typeof dateQuerySchema>;
    const result = await logsService.getWaterTotalForDate(req.userId!, date);
    res.json(result);
  }),
);

waterLogsRouter.post(
  "/",
  validateBody(waterLogInputSchema),
  asyncHandler(async (req, res) => {
    const log = await logsService.createWaterLog(req.userId!, req.body);
    res.status(201).json({ log });
  }),
);

// ─── Cardio ──────────────────────────────────────────────────────────────────

export const cardioLogsRouter = Router();
cardioLogsRouter.use(requireAuth);

cardioLogsRouter.get(
  "/",
  validateQuery(dateQuerySchema),
  asyncHandler(async (req, res) => {
    const { date } = req.query as unknown as z.infer<typeof dateQuerySchema>;
    const log = await logsService.getCardioForDate(req.userId!, date);
    res.json({ log });
  }),
);

cardioLogsRouter.post(
  "/",
  validateBody(cardioLogInputSchema),
  asyncHandler(async (req, res) => {
    const log = await logsService.upsertCardioLog(req.userId!, req.body);
    res.status(201).json({ log });
  }),
);

// ─── Waist ───────────────────────────────────────────────────────────────────

export const waistLogsRouter = Router();
waistLogsRouter.use(requireAuth);

waistLogsRouter.get(
  "/",
  validateQuery(rangeQuerySchema),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as z.infer<typeof rangeQuerySchema>;
    const logs = await logsService.listWaistLogs(req.userId!, from, to);
    res.json({ logs });
  }),
);

waistLogsRouter.post(
  "/",
  validateBody(waistLogInputSchema),
  asyncHandler(async (req, res) => {
    const log = await logsService.createWaistLog(req.userId!, req.body);
    res.status(201).json({ log });
  }),
);

waistLogsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await logsService.deleteWaistLog(req.userId!, req.params.id);
    res.status(204).end();
  }),
);

// ─── Body photos ─────────────────────────────────────────────────────────────

const bodyPhotoQuerySchema = z.object({
  angle: z.enum(["FRONT", "SIDE", "BACK"]),
  date: z.coerce.date(),
});

export const bodyPhotosRouter = Router();
bodyPhotosRouter.use(requireAuth);

bodyPhotosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const photos = await logsService.listBodyPhotos(req.userId!);
    res.json({ photos });
  }),
);

bodyPhotosRouter.post(
  "/",
  photoUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded");
    const { angle, date } = bodyPhotoQuerySchema.parse(req.body);
    const photo = await logsService.uploadBodyPhoto(
      req.userId!,
      angle,
      date,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );
    res.status(201).json({ photo });
  }),
);

bodyPhotosRouter.delete(
  "/:photoId",
  asyncHandler(async (req, res) => {
    await logsService.deleteBodyPhoto(req.userId!, req.params.photoId);
    res.status(204).end();
  }),
);
