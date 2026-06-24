import type { CustomFoodInput, FoodLogInput } from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { prisma } from "../../lib/prisma.js";

export async function searchFoods(
  userId: string,
  q: string | undefined,
  take: number,
  mineOnly = false,
) {
  return prisma.food.findMany({
    where: {
      AND: [
        q ? { name: { contains: q, mode: "insensitive" } } : {},
        mineOnly ? { createdByUserId: userId } : { OR: [{ isCustom: false }, { createdByUserId: userId }] },
      ],
    },
    orderBy: { name: "asc" },
    take,
  });
}

export async function createCustomFood(userId: string, input: CustomFoodInput) {
  return prisma.food.create({
    data: { ...input, isCustom: true, createdByUserId: userId },
  });
}

export async function createFoodLog(userId: string, input: FoodLogInput) {
  let calories = input.calories;
  let proteinG = input.proteinG;
  let carbsG = input.carbsG;
  let fatG = input.fatG;
  let customName = input.customName ?? null;

  if (input.foodId) {
    const food = await prisma.food.findUnique({ where: { id: input.foodId } });
    if (!food) throw ApiError.badRequest("Food not found");
    calories = food.caloriesPerServing * input.quantity;
    proteinG = food.proteinG * input.quantity;
    carbsG = food.carbsG * input.quantity;
    fatG = food.fatG * input.quantity;
    customName = null;
  }

  return prisma.foodLog.create({
    data: {
      userId,
      date: input.date,
      mealType: input.mealType,
      foodId: input.foodId ?? null,
      customName,
      quantity: input.quantity,
      calories: calories!,
      proteinG: proteinG!,
      carbsG: carbsG!,
      fatG: fatG!,
    },
    include: { food: true },
  });
}

export async function listFoodLogs(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.foodLog.findMany({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteFoodLog(userId: string, id: string) {
  const log = await prisma.foodLog.findFirst({ where: { id, userId } });
  if (!log) throw ApiError.notFound("Food log entry not found");
  await prisma.foodLog.delete({ where: { id } });
}
