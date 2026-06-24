import { randomUUID } from "node:crypto";
import type { MediaType } from "@prisma/client";
import type { CreateExerciseInput } from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../lib/storage.js";

const MIME_TO_MEDIA_TYPE: Record<string, MediaType> = {
  "image/gif": "GIF",
  "video/mp4": "VIDEO",
  "video/quicktime": "VIDEO",
};

export function mediaTypeForMime(mimeType: string): MediaType {
  if (MIME_TO_MEDIA_TYPE[mimeType]) return MIME_TO_MEDIA_TYPE[mimeType];
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  throw ApiError.badRequest("Unsupported media type");
}

const primaryFirstOrder = [{ isPrimary: "desc" as const }, { createdAt: "desc" as const }];

export async function getExerciseWithUserMedia(userId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { media: { where: { userId }, orderBy: primaryFirstOrder } },
  });
  if (!exercise) throw ApiError.notFound("Exercise not found");
  return exercise;
}

async function syncCustomExerciseCover(exerciseId: string, userId: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise?.isCustom) return;

  const primary = await prisma.exerciseMedia.findFirst({
    where: { exerciseId, userId },
    orderBy: primaryFirstOrder,
  });
  // Exercise.images is a plain string[] read by older call sites as plain
  // <img> sources — only ever put a still image/GIF url in there. Videos
  // are only ever surfaced via the type-aware `media` relation.
  const coverUrl = primary && primary.type !== "VIDEO" ? primary.url : undefined;
  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { images: coverUrl ? [coverUrl] : [] },
  });
}

export async function uploadExerciseMedia(
  userId: string,
  exerciseId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
) {
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) throw ApiError.notFound("Exercise not found");

  const type = mediaTypeForMime(file.mimetype);
  const saved = await storage.save(file.buffer, file.originalname, file.mimetype);

  const existingCount = await prisma.exerciseMedia.count({ where: { exerciseId, userId } });

  const media = await prisma.exerciseMedia.create({
    data: {
      userId,
      exerciseId,
      url: saved.url,
      storageKey: saved.key,
      type,
      isPrimary: existingCount === 0,
    },
  });

  // Custom exercises are private to their creator, so it's safe to also
  // surface the upload as the exercise's thumbnail everywhere (Plan list,
  // Library grid, session cards) — those all just read Exercise.images.
  // Seeded exercises are shared globally, so we never do this for those.
  if (existingCount === 0) await syncCustomExerciseCover(exerciseId, userId);

  return media;
}

export async function setPrimaryExerciseMedia(userId: string, mediaId: string) {
  const media = await prisma.exerciseMedia.findFirst({ where: { id: mediaId, userId } });
  if (!media) throw ApiError.notFound("Media not found");

  await prisma.$transaction([
    prisma.exerciseMedia.updateMany({
      where: { exerciseId: media.exerciseId, userId },
      data: { isPrimary: false },
    }),
    prisma.exerciseMedia.update({ where: { id: mediaId }, data: { isPrimary: true } }),
  ]);

  await syncCustomExerciseCover(media.exerciseId, userId);
}

export async function deleteExerciseMedia(userId: string, mediaId: string) {
  const media = await prisma.exerciseMedia.findFirst({ where: { id: mediaId, userId } });
  if (!media) throw ApiError.notFound("Media not found");

  await storage.delete(media.storageKey);
  await prisma.exerciseMedia.delete({ where: { id: mediaId } });

  if (media.isPrimary) {
    const next = await prisma.exerciseMedia.findFirst({
      where: { exerciseId: media.exerciseId, userId },
      orderBy: primaryFirstOrder,
    });
    if (next) {
      await prisma.exerciseMedia.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }
  await syncCustomExerciseCover(media.exerciseId, userId);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCustomExercise(userId: string, input: CreateExerciseInput) {
  const slug = `${slugify(input.name)}-${randomUUID().slice(0, 8)}`;

  return prisma.exercise.create({
    data: {
      slug,
      name: input.name,
      primaryMuscles: input.primaryMuscles,
      secondaryMuscles: [],
      instructions: input.notes ? [input.notes] : [],
      images: [],
      isCustom: true,
      createdByUserId: userId,
    },
  });
}

export async function deleteCustomExercise(userId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise || !exercise.isCustom || exercise.createdByUserId !== userId) {
    throw ApiError.notFound("Exercise not found");
  }

  const [routineUsage, sessionUsage] = await Promise.all([
    prisma.routineExercise.count({ where: { exerciseId } }),
    prisma.sessionExercise.count({ where: { exerciseId } }),
  ]);
  if (routineUsage > 0 || sessionUsage > 0) {
    throw ApiError.badRequest(
      "This exercise is used in a routine or workout history — remove it from there first",
    );
  }

  const media = await prisma.exerciseMedia.findMany({ where: { exerciseId } });
  await Promise.all(media.map((m) => storage.delete(m.storageKey)));
  await prisma.exercise.delete({ where: { id: exerciseId } });
}

type ProgressionCandidate = {
  trackingMode: string;
  targetRepsMax: number | null;
  sets: { reps: number; setType: string }[];
};

/** Plan's "2-for-2" rule: 2+ reps above the top of the rep range, on a real (non-warmup/drop/failure) set. */
function exceededRepRange(se: ProgressionCandidate): boolean {
  if (se.trackingMode === "TIME" || se.targetRepsMax == null) return false;
  return se.sets.some((s) => s.setType === "NORMAL" && s.reps >= se.targetRepsMax! + 2);
}

export async function getLastPerformance(userId: string, exerciseId: string) {
  const recent = await prisma.sessionExercise.findMany({
    where: {
      exerciseId,
      session: { userId, completedAt: { not: null } },
    },
    orderBy: { session: { date: "desc" } },
    take: 2,
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      exercise: { select: { equipment: true } },
    },
  });

  const [last, previous] = recent;

  if (!last || last.sets.length === 0) {
    return { performedAt: null, sets: [], progressionSuggestion: null };
  }

  const progressionSuggestion =
    previous && exceededRepRange(last) && exceededRepRange(previous)
      ? { incrementKg: (last.exercise.equipment ?? "").toLowerCase().includes("dumbbell") ? 1.5 : 2.5 }
      : null;

  return {
    performedAt: last.sets[last.sets.length - 1].completedAt,
    sets: last.sets.map((s) => ({
      setNumber: s.setNumber,
      weightKg: s.weightKg,
      reps: s.reps,
      setType: s.setType,
    })),
    progressionSuggestion,
  };
}
