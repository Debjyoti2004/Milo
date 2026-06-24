import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toDateParam } from "@/lib/format";
import type { TodaySummary } from "@/lib/types";

export function useTodaySummary(date: Date) {
  return useQuery({
    queryKey: ["stats", "today", toDateParam(date)],
    queryFn: () => api.get<TodaySummary>("/stats/today", { date: toDateParam(date) }),
  });
}
