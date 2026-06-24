export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const ACTIVITY_LEVELS = [
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "ACTIVE",
  "VERY_ACTIVE",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const GOALS = ["LOSE_FAT", "MAINTAIN", "BUILD_MUSCLE", "RECOMP"] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const UNIT_PREFERENCES = ["KG", "LB"] as const;
export type UnitPreference = (typeof UNIT_PREFERENCES)[number];

export const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const SET_STATUSES = ["NOT_LOGGED", "PARTIAL", "MET"] as const;
export type SetStatus = (typeof SET_STATUSES)[number];

export const SET_TYPES = ["WARMUP", "NORMAL", "DROP", "FAILURE"] as const;
export type SetType = (typeof SET_TYPES)[number];

export const MEDIA_TYPES = ["IMAGE", "GIF", "VIDEO"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const TRACKING_MODES = ["REPS", "TIME", "BOTH"] as const;
export type TrackingMode = (typeof TRACKING_MODES)[number];
