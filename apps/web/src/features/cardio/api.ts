import type { CardioLogInput } from "@gym/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toDateParam } from "@/lib/format";
import type { CardioLog } from "@/lib/types";

export function useCardioToday(date: Date) {
  return useQuery({
    queryKey: ["cardio-logs", toDateParam(date)],
    queryFn: () => api.get<{ log: CardioLog | null }>("/cardio-logs", { date: toDateParam(date) }),
  });
}

export function useLogCardio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CardioLogInput) => api.post<{ log: CardioLog }>("/cardio-logs", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cardio-logs"] }),
  });
}
