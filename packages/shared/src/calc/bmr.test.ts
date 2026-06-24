import { describe, expect, it } from "vitest";
import { calculateBMR, calculateDailyTargets, calculateTDEE } from "./bmr.js";

describe("calculateBMR", () => {
  it("matches Mifflin-St Jeor for a male", () => {
    const bmr = calculateBMR({ gender: "MALE", weightKg: 70, heightCm: 175, age: 28 });
    expect(bmr).toBeCloseTo(10 * 70 + 6.25 * 175 - 5 * 28 + 5, 5);
  });

  it("matches Mifflin-St Jeor for a female", () => {
    const bmr = calculateBMR({ gender: "FEMALE", weightKg: 60, heightCm: 165, age: 30 });
    expect(bmr).toBeCloseTo(10 * 60 + 6.25 * 165 - 5 * 30 - 161, 5);
  });
});

describe("calculateTDEE", () => {
  it("applies the activity multiplier", () => {
    expect(calculateTDEE(1500, "SEDENTARY")).toBeCloseTo(1800, 5);
    expect(calculateTDEE(1500, "VERY_ACTIVE")).toBeCloseTo(2850, 5);
  });
});

describe("calculateDailyTargets", () => {
  it("applies a calorie deficit for fat loss and never drops below the safety floor", () => {
    const targets = calculateDailyTargets({
      gender: "FEMALE",
      weightKg: 55,
      heightCm: 160,
      age: 25,
      activityLevel: "SEDENTARY",
      goal: "LOSE_FAT",
    });
    expect(targets.calories).toBeGreaterThanOrEqual(1200);
    expect(targets.calories).toBeLessThan(targets.tdee);
  });

  it("applies a calorie surplus for building muscle", () => {
    const targets = calculateDailyTargets({
      gender: "MALE",
      weightKg: 75,
      heightCm: 178,
      age: 24,
      activityLevel: "MODERATE",
      goal: "BUILD_MUSCLE",
    });
    expect(targets.calories).toBeGreaterThan(targets.tdee);
  });

  it("macros add up to roughly the calorie target", () => {
    const targets = calculateDailyTargets({
      gender: "MALE",
      weightKg: 80,
      heightCm: 180,
      age: 30,
      activityLevel: "ACTIVE",
      goal: "MAINTAIN",
    });
    const macroCalories = targets.proteinG * 4 + targets.carbsG * 4 + targets.fatG * 9;
    expect(Math.abs(macroCalories - targets.calories)).toBeLessThan(10);
  });
});
