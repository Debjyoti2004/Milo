import { prisma } from "../../src/lib/prisma.js";

interface SeedFood {
  name: string;
  servingSizeG: number;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// Curated reference foods: generic staples + Indian home-cooked dishes that
// packaged-food APIs (Open Food Facts/USDA) don't cover well. Serving sizes
// are realistic units (e.g. "1 roti") rather than always 100g, so the diary
// reads naturally. Users can always add a custom food on top of this list.
export const SEED_FOODS: SeedFood[] = [
  // ─── Key staples for the 160g-protein/day goal ───────────────────────────
  { name: "Soya Chunks, cooked (1 cup)", servingSizeG: 172, caloriesPerServing: 180, proteinG: 26, carbsG: 17, fatG: 1 },
  { name: "Moong Dal, cooked (1 cup)", servingSizeG: 202, caloriesPerServing: 212, proteinG: 14, carbsG: 38, fatG: 0.8 },
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Roti / Chapati", servingSizeG: 40, caloriesPerServing: 120, proteinG: 3, carbsG: 18, fatG: 3.7 },
  { name: "Rice, cooked", servingSizeG: 158, caloriesPerServing: 205, proteinG: 4.3, carbsG: 45, fatG: 0.4 },
  { name: "Brown Rice, cooked", servingSizeG: 195, caloriesPerServing: 216, proteinG: 5, carbsG: 45, fatG: 1.8 },
  { name: "Dal (Toor/Lentil Curry)", servingSizeG: 198, caloriesPerServing: 230, proteinG: 18, carbsG: 40, fatG: 1 },
  { name: "Rajma (Kidney Bean Curry)", servingSizeG: 177, caloriesPerServing: 225, proteinG: 15, carbsG: 40, fatG: 1 },
  { name: "Chole (Chickpea Curry)", servingSizeG: 164, caloriesPerServing: 270, proteinG: 12, carbsG: 45, fatG: 5 },
  { name: "Paneer", servingSizeG: 100, caloriesPerServing: 265, proteinG: 18, carbsG: 1.2, fatG: 20 },
  { name: "Curd / Yogurt, plain", servingSizeG: 245, caloriesPerServing: 149, proteinG: 8.5, carbsG: 11, fatG: 8 },
  { name: "Milk, whole", servingSizeG: 244, caloriesPerServing: 149, proteinG: 7.7, carbsG: 12, fatG: 8 },
  { name: "Idli", servingSizeG: 40, caloriesPerServing: 58, proteinG: 2, carbsG: 12, fatG: 0.2 },
  { name: "Dosa, plain", servingSizeG: 80, caloriesPerServing: 168, proteinG: 3.9, carbsG: 28, fatG: 4 },
  { name: "Poha", servingSizeG: 150, caloriesPerServing: 250, proteinG: 4, carbsG: 45, fatG: 5 },
  { name: "Upma", servingSizeG: 150, caloriesPerServing: 220, proteinG: 5, carbsG: 35, fatG: 6 },
  { name: "Paratha, plain", servingSizeG: 60, caloriesPerServing: 180, proteinG: 4, carbsG: 25, fatG: 7 },
  { name: "Boiled Egg", servingSizeG: 50, caloriesPerServing: 78, proteinG: 6.3, carbsG: 0.6, fatG: 5.3 },
  { name: "Egg Whites", servingSizeG: 33, caloriesPerServing: 17, proteinG: 3.6, carbsG: 0.2, fatG: 0.1 },
  { name: "Chicken Breast, cooked", servingSizeG: 100, caloriesPerServing: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { name: "Chicken Curry", servingSizeG: 240, caloriesPerServing: 280, proteinG: 25, carbsG: 8, fatG: 17 },
  { name: "Fish Curry", servingSizeG: 240, caloriesPerServing: 220, proteinG: 22, carbsG: 6, fatG: 12 },
  { name: "Mutton Curry", servingSizeG: 240, caloriesPerServing: 320, proteinG: 25, carbsG: 6, fatG: 22 },
  { name: "Chicken Tikka", servingSizeG: 100, caloriesPerServing: 180, proteinG: 25, carbsG: 3, fatG: 8 },
  { name: "Paneer Tikka", servingSizeG: 100, caloriesPerServing: 220, proteinG: 14, carbsG: 6, fatG: 16 },
  { name: "Banana", servingSizeG: 118, caloriesPerServing: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { name: "Apple", servingSizeG: 182, caloriesPerServing: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3 },
  { name: "Mango", servingSizeG: 165, caloriesPerServing: 99, proteinG: 1.4, carbsG: 25, fatG: 0.6 },
  { name: "Orange", servingSizeG: 131, caloriesPerServing: 62, proteinG: 1.2, carbsG: 15, fatG: 0.2 },
  { name: "Watermelon", servingSizeG: 152, caloriesPerServing: 46, proteinG: 0.9, carbsG: 11.5, fatG: 0.2 },
  { name: "Almonds", servingSizeG: 28, caloriesPerServing: 164, proteinG: 6, carbsG: 6, fatG: 14 },
  { name: "Peanuts, roasted", servingSizeG: 28, caloriesPerServing: 166, proteinG: 7.3, carbsG: 6, fatG: 14 },
  { name: "Walnuts", servingSizeG: 28, caloriesPerServing: 185, proteinG: 4.3, carbsG: 3.9, fatG: 18.5 },
  { name: "Cashews", servingSizeG: 28, caloriesPerServing: 157, proteinG: 5.2, carbsG: 8.6, fatG: 12.4 },
  { name: "Oats, cooked", servingSizeG: 234, caloriesPerServing: 166, proteinG: 5.9, carbsG: 28, fatG: 3.6 },
  { name: "Whey Protein, 1 scoop", servingSizeG: 30, caloriesPerServing: 120, proteinG: 24, carbsG: 3, fatG: 1 },
  { name: "Brown Bread, 1 slice", servingSizeG: 28, caloriesPerServing: 69, proteinG: 3.6, carbsG: 12, fatG: 1 },
  { name: "White Bread, 1 slice", servingSizeG: 28, caloriesPerServing: 75, proteinG: 2.6, carbsG: 14, fatG: 1 },
  { name: "Peanut Butter, 1 tbsp", servingSizeG: 16, caloriesPerServing: 94, proteinG: 4, carbsG: 3, fatG: 8 },
  { name: "Sweet Potato, boiled", servingSizeG: 100, caloriesPerServing: 90, proteinG: 2, carbsG: 21, fatG: 0.1 },
  { name: "Potato, boiled", servingSizeG: 100, caloriesPerServing: 87, proteinG: 1.9, carbsG: 20, fatG: 0.1 },
  { name: "Spinach, cooked", servingSizeG: 180, caloriesPerServing: 41, proteinG: 5.3, carbsG: 6.8, fatG: 0.5 },
  { name: "Mixed Vegetable Curry", servingSizeG: 200, caloriesPerServing: 150, proteinG: 4, carbsG: 18, fatG: 7 },
  { name: "Bhindi Sabzi", servingSizeG: 150, caloriesPerServing: 120, proteinG: 3, carbsG: 12, fatG: 7 },
  { name: "Aloo Gobi", servingSizeG: 150, caloriesPerServing: 160, proteinG: 4, carbsG: 18, fatG: 8 },
  { name: "Mixed Salad", servingSizeG: 150, caloriesPerServing: 50, proteinG: 2, carbsG: 10, fatG: 0.5 },
  { name: "Avocado", servingSizeG: 100, caloriesPerServing: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7 },
  { name: "Greek Yogurt, plain", servingSizeG: 245, caloriesPerServing: 146, proteinG: 25, carbsG: 8, fatG: 0.7 },
  { name: "Cottage Cheese", servingSizeG: 100, caloriesPerServing: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3 },
  { name: "Salmon, cooked", servingSizeG: 100, caloriesPerServing: 206, proteinG: 22, carbsG: 0, fatG: 13 },
  { name: "Tofu, firm", servingSizeG: 100, caloriesPerServing: 144, proteinG: 15.6, carbsG: 2.8, fatG: 8.7 },
  { name: "Quinoa, cooked", servingSizeG: 185, caloriesPerServing: 222, proteinG: 8, carbsG: 39, fatG: 3.6 },
  { name: "Cucumber", servingSizeG: 100, caloriesPerServing: 16, proteinG: 0.7, carbsG: 3.6, fatG: 0.1 },
  { name: "Tomato", servingSizeG: 100, caloriesPerServing: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  { name: "Dark Chocolate (70%+)", servingSizeG: 28, caloriesPerServing: 170, proteinG: 2.2, carbsG: 13, fatG: 12 },
  { name: "Olive Oil, 1 tbsp", servingSizeG: 14, caloriesPerServing: 119, proteinG: 0, carbsG: 0, fatG: 13.5 },
  { name: "Ghee, 1 tbsp", servingSizeG: 14, caloriesPerServing: 123, proteinG: 0, carbsG: 0, fatG: 14 },
  { name: "Butter, 1 tbsp", servingSizeG: 14, caloriesPerServing: 102, proteinG: 0.1, carbsG: 0, fatG: 11.5 },
  { name: "Black Coffee", servingSizeG: 240, caloriesPerServing: 2, proteinG: 0.3, carbsG: 0, fatG: 0 },
  { name: "Tea with Milk", servingSizeG: 240, caloriesPerServing: 60, proteinG: 2, carbsG: 8, fatG: 2 },
  { name: "Protein Bar", servingSizeG: 60, caloriesPerServing: 220, proteinG: 20, carbsG: 22, fatG: 8 },
  { name: "Sambar", servingSizeG: 240, caloriesPerServing: 150, proteinG: 6, carbsG: 22, fatG: 4 },
  { name: "Chicken Biryani", servingSizeG: 200, caloriesPerServing: 350, proteinG: 15, carbsG: 40, fatG: 14 },
  { name: "Naan", servingSizeG: 90, caloriesPerServing: 270, proteinG: 9, carbsG: 45, fatG: 5 },
  { name: "Khichdi", servingSizeG: 200, caloriesPerServing: 220, proteinG: 7, carbsG: 38, fatG: 4 },
  { name: "Papad, roasted", servingSizeG: 10, caloriesPerServing: 35, proteinG: 2, carbsG: 5, fatG: 0.5 },
  { name: "Buttermilk / Chaas", servingSizeG: 240, caloriesPerServing: 40, proteinG: 2, carbsG: 5, fatG: 1 },
  { name: "Lassi, sweet", servingSizeG: 240, caloriesPerServing: 160, proteinG: 5, carbsG: 24, fatG: 5 },
  { name: "Samosa", servingSizeG: 60, caloriesPerServing: 260, proteinG: 4, carbsG: 24, fatG: 17 },
  { name: "Moong Dal Cheela", servingSizeG: 80, caloriesPerServing: 120, proteinG: 7, carbsG: 16, fatG: 3 },
  { name: "Sprouts Salad", servingSizeG: 150, caloriesPerServing: 130, proteinG: 9, carbsG: 22, fatG: 1 },
  { name: "Boiled Chickpeas", servingSizeG: 164, caloriesPerServing: 269, proteinG: 14.5, carbsG: 45, fatG: 4.3 },
  { name: "Roasted Chana", servingSizeG: 30, caloriesPerServing: 110, proteinG: 6, carbsG: 18, fatG: 2 },
  { name: "Coconut Water", servingSizeG: 240, caloriesPerServing: 46, proteinG: 1.7, carbsG: 8.9, fatG: 0.5 },
  { name: "Honey, 1 tbsp", servingSizeG: 21, caloriesPerServing: 64, proteinG: 0.1, carbsG: 17, fatG: 0 },
  { name: "Jaggery, 1 tbsp", servingSizeG: 20, caloriesPerServing: 76, proteinG: 0, carbsG: 19.6, fatG: 0 },
  { name: "Muesli", servingSizeG: 45, caloriesPerServing: 170, proteinG: 4, carbsG: 30, fatG: 3 },
  { name: "Pasta, cooked", servingSizeG: 140, caloriesPerServing: 220, proteinG: 8, carbsG: 43, fatG: 1.3 },
  { name: "Pizza, cheese (1 slice)", servingSizeG: 107, caloriesPerServing: 285, proteinG: 12, carbsG: 36, fatG: 10 },
  { name: "Chicken Burger", servingSizeG: 150, caloriesPerServing: 350, proteinG: 18, carbsG: 35, fatG: 15 },
  { name: "French Fries", servingSizeG: 117, caloriesPerServing: 365, proteinG: 4, carbsG: 48, fatG: 17 },
  { name: "Soft Drink / Cola", servingSizeG: 330, caloriesPerServing: 140, proteinG: 0, carbsG: 35, fatG: 0 },
  { name: "Ice Cream, 1 scoop", servingSizeG: 65, caloriesPerServing: 137, proteinG: 2.3, carbsG: 16, fatG: 7 },
  { name: "Dates", servingSizeG: 8, caloriesPerServing: 23, proteinG: 0.2, carbsG: 6, fatG: 0 },
  { name: "Raisins", servingSizeG: 36, caloriesPerServing: 108, proteinG: 1, carbsG: 28, fatG: 0.2 },
];

export async function seedFoods() {
  console.log(`Seeding ${SEED_FOODS.length} reference foods...`);
  for (const food of SEED_FOODS) {
    const existing = await prisma.food.findFirst({
      where: { name: food.name, isCustom: false },
    });
    if (existing) {
      await prisma.food.update({ where: { id: existing.id }, data: food });
    } else {
      await prisma.food.create({ data: { ...food, isCustom: false } });
    }
  }
  console.log("Foods seeded.");
}
