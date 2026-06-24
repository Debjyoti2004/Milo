import type { Prisma } from "@prisma/client";
import {
  getSetStatus,
  type RestTakenInput,
  type SetLogInput,
  type StartSessionInput,
} from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { prisma } from "../../lib/prisma.js";

function sessionInclude(userId: string) {
  return {
    exercises: {
      include: {
        exercise: {
          include: {
            media: { where: { userId }, orderBy: [{ isPrimary: "desc" as const }, { createdAt: "desc" as const }], take: 1 },
          },
        },
        sets: { orderBy: { setNumber: "asc" as const } },
      },
      orderBy: { orderIndex: "asc" as const },
    },
  } satisfies Prisma.WorkoutSessionInclude;
}

type SessionWithRelations = Prisma.WorkoutSessionGetPayload<{ include: ReturnType<typeof sessionInclude> }>;
type SessionExerciseWithRelations = SessionWithRelations["exercises"][number];

function withStatus(sessionExercise: SessionExerciseWithRelations) {
  return {
    ...sessionExercise,
    status: getSetStatus(sessionExercise, sessionExercise.sets),
  };
}

function serializeSession(session: SessionWithRelations) {
  return { ...session, exercises: session.exercises.map(withStatus) };
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function startSession(userId: string, input: StartSessionInput) {
  const date = input.date ?? new Date();

  if (input.routineDayId) {
    const existing = await prisma.workoutSession.findFirst({
      where: {
        userId,
        routineDayId: input.routineDayId,
        completedAt: null,
        date: { gte: startOfDay(date), lte: endOfDay(date) },
      },
      include: sessionInclude(userId),
      orderBy: { startedAt: "desc" },
    });
    if (existing) {
      const totalLoggedSets = existing.exercises.reduce((sum, e) => sum + e.sets.length, 0);
      if (totalLoggedSets === 0) {
        // Nothing logged yet — this session is still just a shell, so keep it
        // in sync with the live routine instead of freezing stale targets.
        const day = await prisma.routineDay.findFirst({
          where: { id: input.routineDayId, routine: { userId } },
          include: { exercises: true },
        });
        if (day) {
          const liveByExerciseId = new Map(day.exercises.map((ex) => [ex.exerciseId, ex]));
          await Promise.all(
            existing.exercises.map((se) => {
              const live = liveByExerciseId.get(se.exerciseId);
              if (!live) return Promise.resolve();
              return prisma.sessionExercise.update({
                where: { id: se.id },
                data: {
                  targetSets: live.targetSets,
                  targetRepsMin: live.targetRepsMin,
                  targetRepsMax: live.targetRepsMax,
                  restSeconds: live.restSeconds,
                  notes: live.notes,
                  trackingMode: live.trackingMode,
                  targetHoldSeconds: live.targetHoldSeconds,
                },
              });
            }),
          );
        }
      }
      const refreshed = await prisma.workoutSession.findUniqueOrThrow({
        where: { id: existing.id },
        include: sessionInclude(userId),
      });
      return serializeSession(refreshed);
    }
  }

  let exercisesToCreate: {
    exerciseId: string;
    orderIndex: number;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number | null;
    notes: string | null;
    restSeconds: number;
    trackingMode: "REPS" | "TIME" | "BOTH";
    targetHoldSeconds: number | null;
  }[] = [];
  let routineDayId: string | null = null;

  if (input.routineDayId) {
    const day = await prisma.routineDay.findFirst({
      where: { id: input.routineDayId, routine: { userId } },
      include: { exercises: { orderBy: { orderIndex: "asc" } } },
    });
    if (!day) throw ApiError.notFound("Routine day not found");
    routineDayId = day.id;
    exercisesToCreate = day.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      orderIndex: ex.orderIndex,
      targetSets: ex.targetSets,
      targetRepsMin: ex.targetRepsMin,
      targetRepsMax: ex.targetRepsMax,
      notes: ex.notes,
      restSeconds: ex.restSeconds,
      trackingMode: ex.trackingMode,
      targetHoldSeconds: ex.targetHoldSeconds,
    }));
  }

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      routineDayId,
      date,
      exercises: { create: exercisesToCreate },
    },
    include: sessionInclude(userId),
  });

  return serializeSession(session);
}

export async function getSession(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: sessionInclude(userId),
  });
  if (!session) throw ApiError.notFound("Session not found");
  return serializeSession(session);
}

export async function completeSession(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw ApiError.notFound("Session not found");

  const updated = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
    include: sessionInclude(userId),
  });
  return serializeSession(updated);
}

export async function listSessions(
  userId: string,
  options: { from?: Date; to?: Date; take: number; cursor?: string },
) {
  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      date: { gte: options.from, lte: options.to },
    },
    include: sessionInclude(userId),
    orderBy: { date: "desc" },
    take: options.take,
    ...(options.cursor ? { skip: 1, cursor: { id: options.cursor } } : {}),
  });

  const nextCursor = sessions.length === options.take ? sessions[sessions.length - 1].id : null;
  return { sessions: sessions.map(serializeSession), nextCursor };
}

export async function addSessionExercise(
  userId: string,
  sessionId: string,
  input: {
    exerciseId: string;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax?: number | null;
    notes?: string | null;
  },
) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: { exercises: true },
  });
  if (!session) throw ApiError.notFound("Session not found");

  const exercise = await prisma.exercise.findUnique({ where: { id: input.exerciseId } });
  if (!exercise) throw ApiError.badRequest("Exercise not found");

  return prisma.sessionExercise.create({
    data: {
      workoutSessionId: sessionId,
      exerciseId: input.exerciseId,
      orderIndex: session.exercises.length,
      targetSets: input.targetSets,
      targetRepsMin: input.targetRepsMin,
      targetRepsMax: input.targetRepsMax ?? null,
      notes: input.notes ?? null,
    },
    include: { exercise: true, sets: true },
  });
}

async function getOwnedSessionExercise(userId: string, sessionExerciseId: string) {
  const sessionExercise = await prisma.sessionExercise.findFirst({
    where: { id: sessionExerciseId, session: { userId } },
  });
  if (!sessionExercise) throw ApiError.notFound("Exercise not found in session");
  return sessionExercise;
}

export async function addSetLog(
  userId: string,
  sessionExerciseId: string,
  input: SetLogInput,
) {
  await getOwnedSessionExercise(userId, sessionExerciseId);

  return prisma.setLog.upsert({
    where: { sessionExerciseId_setNumber: { sessionExerciseId, setNumber: input.setNumber } },
    create: { sessionExerciseId, ...input },
    update: {
      weightKg: input.weightKg,
      reps: input.reps,
      rpe: input.rpe,
      setType: input.setType,
      holdSeconds: input.holdSeconds,
    },
  });
}

export async function deleteSetLog(userId: string, sessionExerciseId: string, setId: string) {
  await getOwnedSessionExercise(userId, sessionExerciseId);
  await prisma.setLog.delete({ where: { id: setId } }).catch(() => {
    throw ApiError.notFound("Set not found");
  });
}

export async function updateSessionExercise(
  userId: string,
  sessionExerciseId: string,
  input: { targetSets?: number; targetRepsMin?: number; targetRepsMax?: number | null; restSeconds?: number },
) {
  await getOwnedSessionExercise(userId, sessionExerciseId);

  return prisma.sessionExercise.update({
    where: { id: sessionExerciseId },
    data: input,
    include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
  });
}

export async function deleteSession(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw ApiError.notFound("Session not found");
  await prisma.workoutSession.delete({ where: { id: sessionId } });
}

export async function recordRestTaken(
  userId: string,
  sessionExerciseId: string,
  setId: string,
  input: RestTakenInput,
) {
  await getOwnedSessionExercise(userId, sessionExerciseId);
  const set = await prisma.setLog.findFirst({ where: { id: setId, sessionExerciseId } });
  if (!set) throw ApiError.notFound("Set not found");

  return prisma.setLog.update({
    where: { id: setId },
    data: { restSecondsAfter: input.restSecondsAfter },
  });
}
