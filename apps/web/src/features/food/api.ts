import type { CustomFoodInput, FoodLogInput, WaterLogInput } from "@gym/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toDateParam } from "@/lib/format";
import type { Food, FoodLog } from "@/lib/types";

export function useFoodSearch(q: string | undefined) {
  return useQuery({
    queryKey: ["foods", "search", q],
    queryFn: () => api.get<{ foods: Food[] }>("/foods", { q }),
  });
}

export function useMyFoods() {
  return useQuery({
    queryKey: ["foods", "mine"],
    queryFn: () => api.get<{ foods: Food[] }>("/foods", { mine: true, take: 100 }),
  });
}

export function useCreateCustomFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomFoodInput) => api.post<{ food: Food }>("/foods", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useFoodLogs(date: Date) {
  return useQuery({
    queryKey: ["food-logs", toDateParam(date)],
    queryFn: () => api.get<{ logs: FoodLog[] }>("/food-logs", { date: toDateParam(date) }),
  });
}

export function useCreateFoodLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FoodLogInput) => api.post<{ log: FoodLog }>("/food-logs", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "today"] });
    },
  });
}

export function useDeleteFoodLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/food-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "today"] });
    },
  });
}

export function useWaterTotal(date: Date) {
  return useQuery({
    queryKey: ["water-logs", toDateParam(date)],
    queryFn: () => api.get<{ totalMl: number }>("/water-logs", { date: toDateParam(date) }),
  });
}

export function useAiParseFood() {
  return useMutation({
    mutationFn: (text: string) =>
      api.post<{ items: AiFoodItem[] }>("/food-ai/parse", { text }),
  });
}

export interface AiFoodItem {
  name: string;
  servingDescription: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function useAiSuggestMeals(params: {
  remainingCalories: number;
  remainingProteinG: number;
  remainingCarbsG: number;
  remainingFatG: number;
  availableFoods?: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["food-ai", "suggest", params.remainingCalories, params.remainingProteinG, params.availableFoods],
    queryFn: () =>
      api.get<{ suggestions: string }>("/food-ai/suggest", {
        remainingCalories: params.remainingCalories,
        remainingProteinG: params.remainingProteinG,
        remainingCarbsG: params.remainingCarbsG,
        remainingFatG: params.remainingFatG,
        ...(params.availableFoods ? { availableFoods: params.availableFoods } : {}),
      }),
    enabled: params.enabled,
    staleTime: 60_000,
  });
}

export function useAiReviewDay() {
  return useMutation({
    mutationFn: (params: {
      consumed: { calories: number; proteinG: number; carbsG: number; fatG: number };
      targets: { calories: number; proteinG: number; carbsG: number; fatG: number };
    }) => api.post<{ review: string }>("/food-ai/review", params),
  });
}

export function useAddWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WaterLogInput) => api.post("/water-logs", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "today"] });
    },
  });
}
