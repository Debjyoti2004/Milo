import type {
  RotateRoutineExerciseInput,
  RoutineDayUpdateInput,
  RoutineExerciseAlternativesInput,
  RoutineExerciseUpdateInput,
} from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { prisma } from "../../lib/prisma.js";
import { DEFAULT_ROUTINE_TEMPLATE } from "./defaultRoutineTemplate.js";

export async function assignDefaultRoutineForUser(userId: string) {
  const exerciseNames = Array.from(
    new Set(
      DEFAULT_ROUTINE_TEMPLATE.flatMap((day) =>
        day.exercises.flatMap((e) => [e.exerciseName, ...(e.alternativeNames ?? [])]),
      ),
    ),
  );
  const exercises = await prisma.exercise.findMany({
    where: { name: { in: exerciseNames } },
  });
  const exerciseIdByName = new Map(exercises.map((e) => [e.name, e.id]));

  const missing = exerciseNames.filter((name) => !exerciseIdByName.has(name));
  if (missing.length > 0) {
    throw new Error(`Default routine template references unseeded exercises: ${missing.join(", ")}`);
  }

  return prisma.routine.create({
    data: {
      userId,
      name: "My Plan",
      isActive: true,
      days: {
        create: DEFAULT_ROUTINE_TEMPLATE.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          label: day.label,
          isRestDay: day.isRestDay,
          exercises: {
            create: day.exercises.map((ex, orderIndex) => {
              const exerciseId = exerciseIdByName.get(ex.exerciseName)!;
              const alternativeIds = (ex.alternativeNames ?? []).map((name) => exerciseIdByName.get(name)!);
              return {
                exerciseId,
                orderIndex,
                targetSets: ex.targetSets,
                targetRepsMin: ex.targetRepsMin,
                targetRepsMax: ex.targetRepsMax,
                notes: ex.notes,
                restSeconds: ex.restSeconds,
                defaultWeightKg: ex.defaultWeightKg ?? null,
                trackingMode: ex.trackingMode ?? "REPS",
                targetHoldSeconds: ex.targetHoldSeconds ?? null,
                alternativeExerciseIds: alternativeIds.length > 0 ? [exerciseId, ...alternativeIds] : [],
              };
            }),
          },
        })),
      },
    },
    include: { days: { include: { exercises: { include: { exercise: true } } } } },
  });
}

export async function getActiveRoutine(userId: string) {
  const routine = await prisma.routine.findFirst({
    where: { userId, isActive: true },
    include: {
      days: {
        include: {
          exercises: {
            include: {
              exercise: {
                include: {
                  media: { where: { userId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }], take: 1 },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });
  if (!routine) throw ApiError.notFound("No active routine — complete onboarding first");
  return routine;
}

export async function updateRoutineDay(
  userId: string,
  dayId: string,
  input: RoutineDayUpdateInput,
) {
  const day = await prisma.routineDay.findFirst({
    where: { id: dayId, routine: { userId } },
  });
  if (!day) throw ApiError.notFound("Routine day not found");

  if (input.exercises) {
    const exerciseIds = input.exercises.map((e) => e.exerciseId);
    const found = await prisma.exercise.count({ where: { id: { in: exerciseIds } } });
    if (found !== new Set(exerciseIds).size) {
      throw ApiError.badRequest("One or more exercises don't exist");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.routineDay.update({
      where: { id: dayId },
      data: {
        label: input.label,
        isRestDay: input.isRestDay,
      },
    });

    if (input.exercises) {
      await tx.routineExercise.deleteMany({ where: { routineDayId: dayId } });
      await tx.routineExercise.createMany({
        data: input.exercises.map((ex) => ({
          routineDayId: dayId,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax ?? null,
          notes: ex.notes ?? null,
        })),
      });
    }

    return tx.routineDay.findUniqueOrThrow({
      where: { id: dayId },
      include: { exercises: { include: { exercise: true }, orderBy: { orderIndex: "asc" } } },
    });
  });
}

async function getOwnedRoutineExercise(userId: string, routineExerciseId: string) {
  const routineExercise = await prisma.routineExercise.findFirst({
    where: { id: routineExerciseId, routineDay: { routine: { userId } } },
  });
  if (!routineExercise) throw ApiError.notFound("Routine exercise not found");
  return routineExercise;
}

export async function updateRoutineExercise(
  userId: string,
  routineExerciseId: string,
  input: RoutineExerciseUpdateInput,
) {
  const routineExercise = await getOwnedRoutineExercise(userId, routineExerciseId);

  const data: {
    targetSets?: number;
    targetRepsMin?: number;
    targetRepsMax?: number | null;
    restSeconds?: number;
    defaultWeightKg?: number | null;
    trackingMode?: "REPS" | "TIME" | "BOTH";
    targetHoldSeconds?: number | null;
  } = {};
  if (input.targetSets !== undefined) data.targetSets = input.targetSets;
  if (input.targetRepsMin !== undefined) data.targetRepsMin = input.targetRepsMin;
  if (input.targetRepsMax !== undefined) data.targetRepsMax = input.targetRepsMax;
  if (input.restSeconds !== undefined) data.restSeconds = input.restSeconds;
  if (input.defaultWeightKg !== undefined) data.defaultWeightKg = input.defaultWeightKg;
  if (input.trackingMode !== undefined) data.trackingMode = input.trackingMode;
  if (input.targetHoldSeconds !== undefined) data.targetHoldSeconds = input.targetHoldSeconds;

  const updated = await prisma.routineExercise.update({
    where: { id: routineExerciseId },
    data,
    include: { exercise: true },
  });

  if (
    input.applyToOtherDayExercises &&
    (input.targetSets !== undefined ||
      input.targetRepsMin !== undefined ||
      input.targetRepsMax !== undefined ||
      input.restSeconds !== undefined)
  ) {
    await prisma.routineExercise.updateMany({
      where: { routineDayId: routineExercise.routineDayId, id: { not: routineExerciseId } },
      data: {
        ...(input.targetSets !== undefined ? { targetSets: input.targetSets } : {}),
        ...(input.targetRepsMin !== undefined ? { targetRepsMin: input.targetRepsMin } : {}),
        ...(input.targetRepsMax !== undefined ? { targetRepsMax: input.targetRepsMax } : {}),
        ...(input.restSeconds !== undefined ? { restSeconds: input.restSeconds } : {}),
      },
    });
  }

  return updated;
}

export async function updateRoutineExerciseAlternatives(
  userId: string,
  routineExerciseId: string,
  input: RoutineExerciseAlternativesInput,
) {
  const routineExercise = await getOwnedRoutineExercise(userId, routineExerciseId);

  const pool = [
    routineExercise.exerciseId,
    ...input.exerciseIds.filter((id) => id !== routineExercise.exerciseId),
  ];

  const found = await prisma.exercise.count({ where: { id: { in: pool } } });
  if (found !== pool.length) throw ApiError.badRequest("One or more exercises don't exist");

  return prisma.routineExercise.update({
    where: { id: routineExerciseId },
    data: { alternativeExerciseIds: pool },
    include: { exercise: true },
  });
}

export async function rotateRoutineExercise(
  userId: string,
  routineExerciseId: string,
  input: RotateRoutineExerciseInput,
) {
  const routineExercise = await getOwnedRoutineExercise(userId, routineExerciseId);

  const pool =
    routineExercise.alternativeExerciseIds.length > 0
      ? routineExercise.alternativeExerciseIds
      : [routineExercise.exerciseId];

  const currentIndex = pool.indexOf(routineExercise.exerciseId);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex =
    input.direction === "next"
      ? (safeIndex + 1) % pool.length
      : (safeIndex - 1 + pool.length) % pool.length;

  return prisma.routineExercise.update({
    where: { id: routineExerciseId },
    data: { exerciseId: pool[nextIndex] },
    include: { exercise: true },
  });
}
