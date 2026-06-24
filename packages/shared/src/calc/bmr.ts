import type { ActivityLevel, Gender, Goal } from "../enums.js";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

/** Mifflin-St Jeor. OTHER uses the midpoint of the male/female constant offset. */
export function calculateBMR(input: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  const offset = input.gender === "MALE" ? 5 : input.gender === "FEMALE" ? -161 : -78;
  return base + offset;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export interface DailyTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const GOAL_CALORIE_ADJUSTMENT: Record<Goal, number> = {
  LOSE_FAT: -500,
  RECOMP: -200,
  MAINTAIN: 0,
  BUILD_MUSCLE: 300,
};

const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  LOSE_FAT: 2.0,
  RECOMP: 2.0,
  BUILD_MUSCLE: 2.0,
  MAINTAIN: 1.6,
};

const MIN_CALORIES_BY_GENDER: Record<Gender, number> = {
  MALE: 1500,
  FEMALE: 1200,
  OTHER: 1350,
};

const FAT_CALORIE_SHARE = 0.25;

export function calculateDailyTargets(input: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}): DailyTargets {
  const bmr = calculateBMR(input);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const rawCalories = tdee + GOAL_CALORIE_ADJUSTMENT[input.goal];
  const calories = Math.max(rawCalories, MIN_CALORIES_BY_GENDER[input.gender]);

  const proteinG = GOAL_PROTEIN_PER_KG[input.goal] * input.weightKg;
  const fatG = (calories * FAT_CALORIE_SHARE) / 9;
  const carbsCalories = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(carbsCalories, 0) / 4;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
  };
}
