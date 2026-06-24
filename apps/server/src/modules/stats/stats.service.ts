import type { DayOfWeek } from "@gym/shared";
import { prisma } from "../../lib/prisma.js";

const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const DELOAD_THRESHOLD_WEEKS = 7;
const DELOAD_MIN_SESSIONS_PER_WEEK = 2;

async function computeDeloadDue(
  userId: string,
  profile: { lastDeloadAt: Date | null; onboardingCompletedAt: Date | null; createdAt: Date },
): Promise<boolean> {
  const baseline = profile.lastDeloadAt ?? profile.onboardingCompletedAt ?? profile.createdAt;
  const weeksElapsed = Math.floor((Date.now() - baseline.getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weeksElapsed < DELOAD_THRESHOLD_WEEKS) return false;
  const sessions = await prisma.workoutSession.count({
    where: { userId, completedAt: { not: null }, date: { gte: baseline } },
  });
  return sessions >= weeksElapsed * DELOAD_MIN_SESSIONS_PER_WEEK;
}

export async function getTodaySummary(userId: string, date: Date) {
  const dayOfWeek = JS_DAY_TO_DAY_OF_WEEK[date.getDay()];

  const [profile, routineDay, foodLogs, water, openSession, cardio] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.routineDay.findFirst({
      where: { routine: { userId, isActive: true }, dayOfWeek },
      include: { exercises: { include: { exercise: true }, orderBy: { orderIndex: "asc" } } },
    }),
    prisma.foodLog.findMany({
      where: { userId, date: { gte: startOfDay(date), lte: endOfDay(date) } },
    }),
    prisma.waterLog.findMany({
      where: { userId, date: { gte: startOfDay(date), lte: endOfDay(date) } },
    }),
    prisma.workoutSession.findFirst({
      where: { userId, completedAt: null, date: { gte: startOfDay(date), lte: endOfDay(date) } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.cardioLog.findUnique({
      where: { userId_date: { userId, date: startOfDay(date) } },
    }),
  ]);

  const deloadDue = profile ? await computeDeloadDue(userId, profile) : false;

  const consumed = foodLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      proteinG: acc.proteinG + log.proteinG,
      carbsG: acc.carbsG + log.carbsG,
      fatG: acc.fatG + log.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return {
    date,
    dayOfWeek,
    todayPlan: routineDay,
    targets: profile
      ? {
          calories: profile.dailyCalorieTarget,
          proteinG: profile.proteinTargetG,
          carbsG: profile.carbsTargetG,
          fatG: profile.fatTargetG,
          waterMl: profile.waterTargetMl,
        }
      : null,
    consumed,
    waterMl: water.reduce((sum, w) => sum + w.amountMl, 0),
    cardio,
    session: openSession,
    deloadDue,
  };
}

export async function getExerciseProgress(userId: string, exerciseId: string) {
  const sessionExercises = await prisma.sessionExercise.findMany({
    where: { exerciseId, session: { userId, completedAt: { not: null } } },
    include: { sets: true, session: { select: { date: true } } },
    orderBy: { session: { date: "asc" } },
  });

  return sessionExercises.map((se) => ({
    date: se.session.date,
    maxWeightKg: se.sets.reduce((max, s) => Math.max(max, s.weightKg), 0),
    totalVolumeKg: se.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
    totalReps: se.sets.reduce((sum, s) => sum + s.reps, 0),
  }));
}

export async function getAdherence(userId: string, from: Date, to: Date) {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: { date: true, completedAt: true },
  });

  return sessions.map((s) => ({
    date: s.date,
    status: s.completedAt ? "COMPLETED" : "STARTED",
  }));
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
