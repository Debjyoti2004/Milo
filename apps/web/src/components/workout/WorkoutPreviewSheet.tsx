import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ExerciseThumbnail } from "@/components/workout/ExerciseThumbnail";
import type { RoutineDay } from "@/lib/types";
import { useStartSession } from "@/features/workout/api";

export function WorkoutPreviewSheet({ day, onClose }: { day: RoutineDay; onClose: () => void }) {
  const navigate = useNavigate();
  const startSession = useStartSession();

  const handleStart = () => {
    startSession.mutate(day.id, {
      onSuccess: ({ session }) => navigate(`/workout/session/${session.id}`),
    });
  };

  return (
    <Sheet open onClose={onClose} title={day.label}>
      <p className="mb-3 text-sm text-text-secondary">
        {day.exercises.length} exercises — here's what you're about to do.
      </p>

      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {day.exercises.map((ex) => (
          <div key={ex.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
            <ExerciseThumbnail
              exercise={ex.exercise}
              className="size-11 shrink-0 rounded-lg bg-surface"
              textClassName="text-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{ex.exercise.name}</p>
              {ex.notes && <p className="truncate text-xs text-text-muted">{ex.notes}</p>}
            </div>
            <p className="shrink-0 text-sm font-medium text-text-secondary">
              {ex.targetSets}×{ex.targetRepsMax ? `${ex.targetRepsMin}-${ex.targetRepsMax}` : ex.targetRepsMin}
            </p>
          </div>
        ))}
      </div>

      <Button size="lg" className="mt-4 w-full" onClick={handleStart} loading={startSession.isPending}>
        <Play className="size-4" /> Start workout
      </Button>
    </Sheet>
  );
}
