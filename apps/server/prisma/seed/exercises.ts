import { prisma } from "../../src/lib/prisma.js";

const DATASET_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

interface RawExercise {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
}

export async function seedExercises() {
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch exercise dataset: ${response.status}`);
  }
  const raw = (await response.json()) as RawExercise[];

  console.log(`Seeding ${raw.length} exercises from free-exercise-db...`);

  for (const exercise of raw) {
    await prisma.exercise.upsert({
      where: { slug: exercise.id },
      create: {
        slug: exercise.id,
        name: exercise.name,
        force: exercise.force,
        level: exercise.level,
        mechanic: exercise.mechanic,
        equipment: exercise.equipment,
        category: exercise.category,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        instructions: exercise.instructions,
        images: exercise.images.map((path) => `${IMAGE_BASE_URL}/${path}`),
      },
      update: {
        name: exercise.name,
        force: exercise.force,
        level: exercise.level,
        mechanic: exercise.mechanic,
        equipment: exercise.equipment,
        category: exercise.category,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        instructions: exercise.instructions,
        images: exercise.images.map((path) => `${IMAGE_BASE_URL}/${path}`),
      },
    });
  }

  console.log("Exercises seeded.");
}
