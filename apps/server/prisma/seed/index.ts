import { prisma } from "../../src/lib/prisma.js";
import { seedExercises } from "./exercises.js";
import { seedFoods } from "./foods.js";

async function main() {
  await seedExercises();
  await seedFoods();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
