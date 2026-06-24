import { useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { toDateParam } from "@/lib/format";
import type { AdherenceEntry } from "@/lib/types";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface HeatmapDay {
  date: Date;
  status: "COMPLETED" | "STARTED" | null;
  isInRange: boolean;
}

export function AdherenceHeatmap({ entries }: { entries: AdherenceEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const byDate = new Map(entries.map((e) => [toDateParam(new Date(e.date)), e.status as "COMPLETED" | "STARTED"]));

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Start from the Monday of the week 104 weeks ago (2 years)
  const startCandidate = new Date(today);
  startCandidate.setDate(today.getDate() - 104 * 7);
  // Roll back to Monday (getDay(): 0=Sun,1=Mon,...,6=Sat)
  const dayOfWeek = startCandidate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startCandidate.setDate(startCandidate.getDate() - daysToMonday);

  // Build all days from startCandidate to today, grouped into weeks (Mon–Sun)
  const weeks: HeatmapDay[][] = [];
  const current = new Date(startCandidate);
  let currentWeek: HeatmapDay[] = [];

  while (current <= today) {
    const dateStr = toDateParam(current);
    const status = byDate.get(dateStr) ?? null;
    const dayIdx = current.getDay(); // 0=Sun..6=Sat
    // Map getDay to Mon(0)..Sun(6) index for row position
    const monIdx = dayIdx === 0 ? 6 : dayIdx - 1;

    currentWeek[monIdx] = {
      date: new Date(current),
      status,
      isInRange: current <= today,
    };

    if (monIdx === 6 || current.toDateString() === today.toDateString()) {
      // Fill any empty slots in an incomplete week
      for (let i = 0; i < 7; i++) {
        if (!currentWeek[i]) currentWeek[i] = { date: new Date(current), status: null, isInRange: false };
      }
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }

  // Scroll to rightmost (today) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks.length]);

  // Build month labels: for each week, check if any day in that week is the 1st
  const monthLabels: { weekIndex: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d.date.getDate() === 1 && d.isInRange);
    if (firstDay) {
      monthLabels.push({ weekIndex: wi, label: MONTH_NAMES[firstDay.date.getMonth()] });
    }
  });

  // Stats
  const completedCount = entries.filter((e) => e.status === "COMPLETED").length;
  const startedCount = entries.filter((e) => e.status === "STARTED").length;

  return (
    <div className="flex flex-col gap-2">
      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-text-muted">{completedCount + startedCount} total sessions</span>
        <div className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-met inline-block" />
          <span className="text-text-muted">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-partial inline-block" />
          <span className="text-text-muted">Started</span>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[3px] pt-5 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[11px] text-[9px] text-text-muted leading-[11px] w-6 text-right pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar flex-1">
          <div className="inline-flex flex-col gap-0">
            {/* Month labels row */}
            <div className="flex gap-[3px] mb-1 h-4">
              {weeks.map((_, wi) => {
                const ml = monthLabels.find((m) => m.weekIndex === wi);
                return (
                  <div key={wi} className="w-[11px] text-[9px] text-text-muted shrink-0">
                    {ml ? ml.label : ""}
                  </div>
                );
              })}
            </div>

            {/* Day rows (Mon=0 → Sun=6) */}
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
              <div key={dayIdx} className="flex gap-[3px]">
                {weeks.map((week, wi) => {
                  const cell = week[dayIdx];
                  if (!cell) return <div key={wi} className="size-[11px] shrink-0" />;
                  return (
                    <div
                      key={wi}
                      title={`${toDateParam(cell.date)}${cell.status ? ` — ${cell.status === "COMPLETED" ? "Completed" : "Started"}` : ""}`}
                      className={cn(
                        "size-[11px] shrink-0 rounded-[2px] transition-colors",
                        !cell.isInRange && "opacity-0",
                        cell.isInRange && !cell.status && "bg-surface-2",
                        cell.status === "STARTED" && "bg-partial",
                        cell.status === "COMPLETED" && "bg-met",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
