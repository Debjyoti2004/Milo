import { useQueries } from "@tanstack/react-query";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { formatFriendlyDate, formatNumber, toDateParam } from "@/lib/format";
import type { FoodLog } from "@/lib/types";
import { cn } from "@/lib/cn";

const DAYS_TO_SHOW = 14;

export function FoodHistoryView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const days = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });

  const results = useQueries({
    queries: days.map((d) => ({
      queryKey: ["food-logs", toDateParam(d)],
      queryFn: () => api.get<{ logs: FoodLog[] }>("/food-logs", { date: toDateParam(d) }),
    })),
  });

  const daysWithLogs = days
    .map((date, i) => ({ date, logs: results[i].data?.logs ?? [], isLoading: results[i].isLoading }))
    .filter((d) => d.isLoading || d.logs.length > 0);

  if (daysWithLogs.every((d) => !d.isLoading) && daysWithLogs.length === 0) {
    return <EmptyState icon={CalendarDays} title="No history yet" description="Logged days will show up here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {daysWithLogs.map(({ date, logs }) => {
        const key = toDateParam(date);
        const total = logs.reduce((sum, l) => sum + l.calories, 0);
        const isOpen = expanded === key;
        return (
          <Card key={key}>
            <button onClick={() => setExpanded(isOpen ? null : key)} className="flex w-full items-center justify-between">
              <div className="text-left">
                <p className="font-semibold text-text">{formatFriendlyDate(date)}</p>
                <p className="text-xs text-text-muted">{formatNumber(total)} kcal · {logs.length} items</p>
              </div>
              <ChevronDown className={cn("size-4 text-text-muted transition", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {logs.map((log) => (
                  <li key={log.id} className="py-2 text-sm text-text-secondary">
                    {log.food?.name ?? log.customName} — {formatNumber(log.calories)} kcal
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
