import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeModel() {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not set — add it to apps/server/.env");
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  return genAI.getGenerativeModel(
    { model: "gemini-2.5-flash", generationConfig: { temperature: 0.2 } },
    { apiVersion: "v1" },
  );
}

async function generate(prompt: string, retries = 4): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await makeModel().generateContent(prompt);
      return result.response.text().trim();
    } catch (err: unknown) {
      const msg = String(err);
      const is503 = /503|Service Unavailable|UNAVAILABLE/i.test(msg);
      if (is503 && attempt < retries - 1) {
        await sleep(4000 * (attempt + 1)); // 4s, 8s, 12s
        continue;
      }
      throw err;
    }
  }
  throw new Error("AI service unavailable — please retry in a moment");
}

export interface ParsedFoodItem {
  name: string;
  servingDescription: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export async function parseFoodText(text: string): Promise<ParsedFoodItem[]> {
  const prompt = `Parse this food description into JSON. Return ONLY a JSON array (no markdown, no extra text) with objects having these keys: name, servingDescription, calories, proteinG, carbsG, fatG. Use accurate values for Indian foods. Round to 1 decimal.

Food: ${text}`;

  const raw = await generate(prompt);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned) as ParsedFoodItem[];
  if (!Array.isArray(parsed)) throw new Error("Unexpected AI response shape");
  return parsed;
}

export async function suggestMeals(params: {
  remainingCalories: number;
  remainingProteinG: number;
  remainingCarbsG: number;
  remainingFatG: number;
  availableFoods?: string;
}): Promise<string> {
  const availableClause = params.availableFoods?.trim()
    ? `Only suggest meals using these ingredients I have: ${params.availableFoods}.\n`
    : "";
  const prompt = `${availableClause}I still need approximately ${Math.round(params.remainingCalories)} kcal, ${Math.round(params.remainingProteinG)}g protein. Suggest 3 simple budget Indian meals to hit this. Each on one line: food + quantity + kcal + protein. Plain numbered list, no headers.`;

  return generate(prompt);
}

export async function reviewDayNutrition(params: {
  consumed: { calories: number; proteinG: number; carbsG: number; fatG: number };
  targets: { calories: number; proteinG: number; carbsG: number; fatG: number };
}): Promise<string> {
  const { consumed, targets } = params;
  const prompt = `My nutrition today vs targets — Calories: ${Math.round(consumed.calories)}/${targets.calories} kcal, Protein: ${Math.round(consumed.proteinG)}/${targets.proteinG}g, Carbs: ${Math.round(consumed.carbsG)}/${targets.carbsG}g, Fat: ${Math.round(consumed.fatG)}/${targets.fatG}g.

Give a 3-4 line honest summary: what I hit, what I missed, one specific thing to do differently tomorrow. Plain text, no markdown.`;

  return generate(prompt);
}
