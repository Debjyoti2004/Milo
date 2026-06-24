import type { CardioLogInput, WaistLogInput, WaterLogInput, WeightLogInput } from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { storage } from "../../lib/storage.js";
import { prisma } from "../../lib/prisma.js";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Weight ──────────────────────────────────────────────────────────────────

export async function createWeightLog(userId: string, input: WeightLogInput) {
  return prisma.weightLog.create({ data: { userId, ...input } });
}

export async function listWeightLogs(userId: string, from: Date, to: Date) {
  return prisma.weightLog.findMany({
    where: { userId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });
}

export async function deleteWeightLog(userId: string, logId: string) {
  const log = await prisma.weightLog.findFirst({ where: { id: logId, userId } });
  if (!log) throw ApiError.notFound("Weight log not found");
  await prisma.weightLog.delete({ where: { id: logId } });
}

// ─── Water ───────────────────────────────────────────────────────────────────

export async function createWaterLog(userId: string, input: WaterLogInput) {
  return prisma.waterLog.create({ data: { userId, ...input } });
}

export async function getWaterTotalForDate(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const logs = await prisma.waterLog.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });
  return { totalMl: logs.reduce((sum, l) => sum + l.amountMl, 0), logs };
}

// ─── Cardio ──────────────────────────────────────────────────────────────────

export async function getCardioForDate(userId: string, date: Date) {
  return prisma.cardioLog.findUnique({
    where: { userId_date: { userId, date: startOfDay(date) } },
  });
}

export async function upsertCardioLog(userId: string, input: CardioLogInput) {
  const date = startOfDay(input.date);
  return prisma.cardioLog.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      steps: input.steps ?? null,
      walkMinutes: input.walkMinutes ?? null,
      hiitMinutes: input.hiitMinutes ?? null,
    },
    update: {
      ...(input.steps !== undefined ? { steps: input.steps } : {}),
      ...(input.walkMinutes !== undefined ? { walkMinutes: input.walkMinutes } : {}),
      ...(input.hiitMinutes !== undefined ? { hiitMinutes: input.hiitMinutes } : {}),
    },
  });
}

// ─── Waist ───────────────────────────────────────────────────────────────────

export async function createWaistLog(userId: string, input: WaistLogInput) {
  return prisma.waistLog.create({ data: { userId, ...input } });
}

export async function listWaistLogs(userId: string, from: Date, to: Date) {
  return prisma.waistLog.findMany({
    where: { userId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });
}

export async function deleteWaistLog(userId: string, logId: string) {
  const log = await prisma.waistLog.findFirst({ where: { id: logId, userId } });
  if (!log) throw ApiError.notFound("Waist log not found");
  await prisma.waistLog.delete({ where: { id: logId } });
}

// ─── Body photos ─────────────────────────────────────────────────────────────

export async function uploadBodyPhoto(
  userId: string,
  angle: "FRONT" | "SIDE" | "BACK",
  date: Date,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
) {
  const { url, key } = await storage.save(buffer, originalName, mimeType);
  return prisma.bodyPhoto.create({
    data: { userId, date, angle, url, storageKey: key },
  });
}

export async function listBodyPhotos(userId: string) {
  return prisma.bodyPhoto.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
}

export async function deleteBodyPhoto(userId: string, photoId: string) {
  const photo = await prisma.bodyPhoto.findFirst({ where: { id: photoId, userId } });
  if (!photo) throw ApiError.notFound("Photo not found");
  await storage.delete(photo.storageKey);
  await prisma.bodyPhoto.delete({ where: { id: photoId } });
}
