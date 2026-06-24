import { calculateDailyTargets, type OnboardingInput, type UpdateProfileInput } from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { prisma } from "../../lib/prisma.js";
import { assignDefaultRoutineForUser } from "../routines/routines.service.js";

function ageFromDOB(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const hasNotHadBirthdayThisYear =
    now.getMonth() < dateOfBirth.getMonth() ||
    (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate());
  if (hasNotHadBirthdayThisYear) age -= 1;
  return age;
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing?.onboardingCompletedAt) {
    throw ApiError.conflict("Onboarding already completed — use PATCH /profile to update it");
  }

  const targets = calculateDailyTargets({
    gender: input.gender,
    weightKg: input.currentWeightKg,
    heightCm: input.heightCm,
    age: ageFromDOB(input.dateOfBirth),
    activityLevel: input.activityLevel,
    goal: input.goal,
  });

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      ...input,
      dailyCalorieTarget: targets.calories,
      proteinTargetG: targets.proteinG,
      carbsTargetG: targets.carbsG,
      fatTargetG: targets.fatG,
      onboardingCompletedAt: new Date(),
    },
    update: {
      ...input,
      dailyCalorieTarget: targets.calories,
      proteinTargetG: targets.proteinG,
      carbsTargetG: targets.carbsG,
      fatTargetG: targets.fatG,
      onboardingCompletedAt: new Date(),
    },
  });

  await assignDefaultRoutineForUser(userId);

  return profile;
}

export async function acknowledgeDeload(userId: string) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (!existing) throw ApiError.notFound("Complete onboarding first");
  return prisma.profile.update({ where: { userId }, data: { lastDeloadAt: new Date() } });
}

export async function updateNutritionTargets(
  userId: string,
  input: {
    dailyCalorieTarget?: number | null;
    proteinTargetG?: number | null;
    carbsTargetG?: number | null;
    fatTargetG?: number | null;
    waterTargetMl?: number | null;
  },
) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (!existing) throw ApiError.notFound("Complete onboarding first");
  return prisma.profile.update({ where: { userId }, data: input });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (!existing) throw ApiError.notFound("Complete onboarding first");

  const merged = { ...existing, ...input };
  const targets = calculateDailyTargets({
    gender: merged.gender,
    weightKg: merged.currentWeightKg,
    heightCm: merged.heightCm,
    age: ageFromDOB(merged.dateOfBirth),
    activityLevel: merged.activityLevel,
    goal: merged.goal,
  });

  return prisma.profile.update({
    where: { userId },
    data: {
      ...input,
      dailyCalorieTarget: targets.calories,
      proteinTargetG: targets.proteinG,
      carbsTargetG: targets.carbsG,
      fatTargetG: targets.fatG,
    },
  });
}
