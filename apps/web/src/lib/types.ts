import type {
  DayOfWeek,
  Gender,
  Goal,
  MealType,
  MediaType,
  SetStatus,
  SetType,
  TrackingMode,
  UnitPreference,
} from "@gym/shared";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  gender: Gender;
  dateOfBirth: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number | null;
  activityLevel: string;
  goal: Goal;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  unitPreference: UnitPreference;
  dailyCalorieTarget: number | null;
  proteinTargetG: number | null;
  carbsTargetG: number | null;
  fatTargetG: number | null;
  onboardingCompletedAt: string | null;
}

export interface ExerciseMedia {
  id: string;
  exerciseId: string;
  url: string;
  type: MediaType;
  isPrimary: boolean;
  createdAt: string;
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  category: string | null;
  isCustom: boolean;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
  media?: ExerciseMedia[];
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  notes: string | null;
  restSeconds: number;
  defaultWeightKg: number | null;
  alternativeExerciseIds: string[];
  trackingMode: TrackingMode;
  targetHoldSeconds: number | null;
  exercise: Exercise;
}

export interface RoutineDay {
  id: string;
  dayOfWeek: DayOfWeek;
  label: string;
  isRestDay: boolean;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  name: string;
  isActive: boolean;
  days: RoutineDay[];
}

export interface SetLog {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number | null;
  setType: SetType;
  restSecondsAfter: number | null;
  holdSeconds: number | null;
  completedAt: string;
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  notes: string | null;
  restSeconds: number;
  trackingMode: TrackingMode;
  targetHoldSeconds: number | null;
  exercise: Exercise;
  sets: SetLog[];
  status: SetStatus;
}

export interface WorkoutSession {
  id: string;
  routineDayId: string | null;
  date: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  exercises: SessionExercise[];
}

export interface Food {
  id: string;
  name: string;
  servingSizeG: number;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isCustom: boolean;
  createdByUserId: string | null;
}

export interface FoodLog {
  id: string;
  date: string;
  mealType: MealType;
  foodId: string | null;
  customName: string | null;
  quantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  food: Food | null;
}

export interface WeightLog {
  id: string;
  date: string;
  weightKg: number;
  note: string | null;
}

export interface WaterLog {
  id: string;
  date: string;
  amountMl: number;
}

export interface CardioLog {
  id: string;
  date: string;
  steps: number | null;
  walkMinutes: number | null;
  hiitMinutes: number | null;
}

export interface WaistLog {
  id: string;
  date: string;
  waistCm: number;
  note: string | null;
}

export interface BodyPhoto {
  id: string;
  date: string;
  angle: "FRONT" | "SIDE" | "BACK";
  url: string;
}

export interface TodaySummary {
  date: string;
  dayOfWeek: DayOfWeek;
  todayPlan: RoutineDay | null;
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null; waterMl: number | null } | null;
  consumed: { calories: number; proteinG: number; carbsG: number; fatG: number };
  waterMl: number;
  cardio: CardioLog | null;
  session: { id: string; completedAt: string | null } | null;
  deloadDue: boolean;
}

export interface ExerciseProgressPoint {
  date: string;
  maxWeightKg: number;
  totalVolumeKg: number;
  totalReps: number;
}

export interface AdherenceEntry {
  date: string;
  status: "COMPLETED" | "STARTED";
}

export interface LastPerformance {
  performedAt: string | null;
  sets: { setNumber: number; weightKg: number; reps: number; setType: SetType }[];
  progressionSuggestion: { incrementKg: number } | null;
}
