import type { WaistLogInput, WeightLogInput } from "@gym/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toDateParam } from "@/lib/format";
import type { AdherenceEntry, BodyPhoto, WaistLog, WeightLog } from "@/lib/types";

export function useWeightLogs(from: Date, to: Date) {
  return useQuery({
    queryKey: ["weight-logs", toDateParam(from), toDateParam(to)],
    queryFn: () =>
      api.get<{ logs: WeightLog[] }>("/weight-logs", { from: toDateParam(from), to: toDateParam(to) }),
  });
}

export function useCreateWeightLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WeightLogInput) => api.post<{ log: WeightLog }>("/weight-logs", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteWeightLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => api.delete(`/weight-logs/${logId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weight-logs"] }),
  });
}

export function useDeleteWaistLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => api.delete(`/waist-logs/${logId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waist-logs"] }),
  });
}

export function useAdherence(from: Date, to: Date) {
  return useQuery({
    queryKey: ["stats", "adherence", toDateParam(from), toDateParam(to)],
    queryFn: () =>
      api.get<{ adherence: AdherenceEntry[] }>("/stats/adherence", {
        from: toDateParam(from),
        to: toDateParam(to),
      }),
  });
}

export function useWaistLogs(from: Date, to: Date) {
  return useQuery({
    queryKey: ["waist-logs", toDateParam(from), toDateParam(to)],
    queryFn: () =>
      api.get<{ logs: WaistLog[] }>("/waist-logs", { from: toDateParam(from), to: toDateParam(to) }),
  });
}

export function useCreateWaistLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WaistLogInput) => api.post<{ log: WaistLog }>("/waist-logs", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waist-logs"] }),
  });
}

export function useBodyPhotos() {
  return useQuery({
    queryKey: ["body-photos"],
    queryFn: () => api.get<{ photos: BodyPhoto[] }>("/body-photos"),
  });
}

export function useUploadBodyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.upload<{ photo: BodyPhoto }>("/body-photos", formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["body-photos"] }),
  });
}

export function useDeleteBodyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => api.delete(`/body-photos/${photoId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["body-photos"] }),
  });
}

export function useAcknowledgeDeload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/profile/deload", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stats", "today"] }),
  });
}

export function useUpdateNutritionTargets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      dailyCalorieTarget?: number | null;
      proteinTargetG?: number | null;
      carbsTargetG?: number | null;
      fatTargetG?: number | null;
      waterTargetMl?: number | null;
    }) => api.patch("/profile/nutrition-targets", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "today"] });
    },
  });
}
