import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatFriendlyDate } from "@/lib/format";
import { useToastStore } from "@/stores/toastStore";
import { useCompleteSession, useSession } from "./api";
import { SessionExerciseCard } from "./SessionExerciseCard";

export function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSession(sessionId);
  const completeSession = useCompleteSession();
  const showToast = useToastStore((s) => s.show);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmingExit, setConfirmingExit] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const { session } = data;
  const exercises = session.exercises;
  const safeIndex = Math.min(currentIndex, Math.max(exercises.length - 1, 0));
  const current = exercises[safeIndex];

  const handleFinish = () => {
    completeSession.mutate(session.id, {
      onSuccess: () => {
        showToast("Workout saved", "success");
        navigate("/workout/history");
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => (session.completedAt ? navigate(-1) : setConfirmingExit(true))}
          className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        {!session.completedAt && (
          <Button size="sm" onClick={handleFinish} loading={completeSession.isPending}>
            <CheckCircle2 className="size-4" /> Finish
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text">{formatFriendlyDate(new Date(session.date))}</h1>
        <p className="text-sm text-text-secondary">
          {session.completedAt ? "Completed" : "In progress"} · {session.exercises.length} exercises
        </p>
      </div>

      {exercises.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {exercises.map((ex, i) => (
            <button
              key={ex.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition",
                i === safeIndex
                  ? "bg-accent text-accent-foreground"
                  : ex.status === "MET"
                    ? "bg-met/15 text-met"
                    : ex.status === "PARTIAL"
                      ? "bg-partial/15 text-partial"
                      : "bg-surface-2 text-text-muted",
              )}
              aria-label={`Go to ${ex.exercise.name}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {current && (
        <div className="flex flex-col gap-3">
          <SessionExerciseCard sessionId={session.id} exercise={current} />

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={safeIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="text-xs text-text-muted">
              {safeIndex + 1} of {exercises.length}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={safeIndex === exercises.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1))}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {confirmingExit && (
        <ConfirmSheet
          title="Exit workout?"
          description="Your progress is saved — you can come back and continue this workout later, right where you left off."
          confirmLabel="Exit"
          onConfirm={() => navigate(-1)}
          onClose={() => setConfirmingExit(false)}
        />
      )}
    </div>
  );
}
