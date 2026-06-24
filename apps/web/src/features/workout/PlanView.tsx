import { DAYS_OF_WEEK } from "@gym/shared";
import { CalendarOff, Pencil, Play } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExerciseThumbnail } from "@/components/workout/ExerciseThumbnail";
import { WorkoutPreviewSheet } from "@/components/workout/WorkoutPreviewSheet";
import { cn } from "@/lib/cn";
import { DAY_LABELS_SHORT, dayOfWeekFor } from "@/lib/format";
import { useActiveRoutine } from "./api";
import { RoutineDayEditorSheet } from "./RoutineDayEditorSheet";

export function PlanView() {
  const { data, isLoading } = useActiveRoutine();
  const [selectedDay, setSelectedDay] = useState(() => dayOfWeekFor(new Date()));
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const day = data.routine.days.find((d) => d.dayOfWeek === selectedDay);
  const todayDow = dayOfWeekFor(new Date());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {DAYS_OF_WEEK.map((dow) => (
          <button
            key={dow}
            onClick={() => setSelectedDay(dow)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              dow === selectedDay
                ? "bg-accent text-accent-foreground"
                : "bg-surface text-text-secondary border border-border",
            )}
          >
            {DAY_LABELS_SHORT[dow]}
            {dow === todayDow && (
              <span className={cn("size-1 rounded-full", dow === selectedDay ? "bg-accent-foreground" : "bg-accent")} />
            )}
          </button>
        ))}
      </div>

      {day && (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text">{day.label}</h2>
              <p className="text-sm text-text-secondary">
                {day.isRestDay ? "Rest day" : `${day.exercises.length} exercises`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!day.isRestDay && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )}
              {!day.isRestDay && day.exercises.length > 0 && (
                <Button size="sm" onClick={() => setPreviewing(true)}>
                  <Play className="size-3.5" /> Start
                </Button>
              )}
            </div>
          </div>

          {day.isRestDay ? (
            <EmptyState icon={CalendarOff} title="Rest day" description="Recovery is part of the plan. No exercises today." />
          ) : day.exercises.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="No exercises yet"
              description="Tap Edit to add exercises for this day."
              action={
                <Button size="sm" onClick={() => setEditing(true)}>
                  Add exercises
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-border">
              {day.exercises.map((ex) => (
                <li key={ex.id}>
                  <Link
                    to={`/workout/library/${ex.exerciseId}?routineExerciseId=${ex.id}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <ExerciseThumbnail
                        exercise={ex.exercise}
                        className="size-11 shrink-0 rounded-xl bg-surface-2"
                        textClassName="text-sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-text">{ex.exercise.name}</p>
                        {ex.notes && <p className="text-xs text-text-muted">{ex.notes}</p>}
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-text-secondary">
                      {ex.targetSets}×{ex.targetRepsMax ? `${ex.targetRepsMin}-${ex.targetRepsMax}` : ex.targetRepsMin}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {day && editing && <RoutineDayEditorSheet day={day} onClose={() => setEditing(false)} />}
      {day && previewing && <WorkoutPreviewSheet day={day} onClose={() => setPreviewing(false)} />}
    </div>
  );
}
