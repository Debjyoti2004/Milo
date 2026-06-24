import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./lib/env.js";
import { localUploadRoot } from "./lib/storage.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { exercisesRouter } from "./modules/exercises/exercises.router.js";
import { foodAiRouter, foodLogsRouter, foodsRouter } from "./modules/foods/foods.router.js";
import { bodyPhotosRouter, cardioLogsRouter, waistLogsRouter, waterLogsRouter, weightLogsRouter } from "./modules/logs/logs.router.js";
import { profileRouter } from "./modules/profile/profile.router.js";
import { routinesRouter } from "./modules/routines/routines.router.js";
import { sessionsRouter } from "./modules/sessions/sessions.router.js";
import { statsRouter } from "./modules/stats/stats.router.js";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads/exercise-media", express.static(localUploadRoot));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/routines", routinesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/foods", foodsRouter);
app.use("/api/food-logs", foodLogsRouter);
app.use("/api/food-ai", foodAiRouter);
app.use("/api/weight-logs", weightLogsRouter);
app.use("/api/water-logs", waterLogsRouter);
app.use("/api/cardio-logs", cardioLogsRouter);
app.use("/api/waist-logs", waistLogsRouter);
app.use("/api/body-photos", bodyPhotosRouter);
app.use("/api/stats", statsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
