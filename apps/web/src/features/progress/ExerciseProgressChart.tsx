import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { useExerciseProgress, useExercises } from "@/features/workout/api";
import { formatFriendlyDate } from "@/lib/format";

export function ExerciseProgressChart() {
  const [query, setQuery] = useState("");
  const [exerciseId, setExerciseId] = useState<string | undefined>();
  const [exerciseName, setExerciseName] = useState<string | undefined>();
  const { data: results } = useExercises({ q: query });
  const { data: progress } = useExerciseProgress(exerciseId);

  const chartData = (progress?.progress ?? []).map((p) => ({
    date: formatFriendlyDate(new Date(p.date)),
    maxWeightKg: p.maxWeightKg,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Pick an exercise to see your progress…"
          value={exerciseName ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            setExerciseName(undefined);
            setExerciseId(undefined);
          }}
          className="pl-9"
        />
      </div>

      {query && !exerciseId && (
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-border">
          {results?.exercises.slice(0, 6).map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setExerciseId(ex.id);
                setExerciseName(ex.name);
                setQuery("");
              }}
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-2"
            >
              {ex.name}
            </button>
          ))}
        </div>
      )}

      {exerciseId && chartData.length === 0 && (
        <EmptyState icon={TrendingUp} title="No history yet" description="Log this exercise in a workout to see progress." />
      )}

      {exerciseId && chartData.length > 0 && (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "none", borderRadius: 12, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="maxWeightKg" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
