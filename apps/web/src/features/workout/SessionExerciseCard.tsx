import type { SetType } from "@gym/shared";
import { Plus, Timer, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { ExerciseThumbnail } from "@/components/workout/ExerciseThumbnail";
import { SetStatusBadge } from "@/components/workout/SetStatusBadge";
import { cn } from "@/lib/cn";
import { primeChime } from "@/lib/chime";
import { useRestTimerStore } from "@/stores/restTimerStore";
import type { SessionExercise } from "@/lib/types";
import { useAddSet, useDeleteSet, useLastPerformance } from "./api";

const SET_TYPE_LABELS: Record<SetType, string> = {
  WARMUP: "Warmup",
  NORMAL: "Normal",
  DROP: "Drop",
  FAILURE: "Failure",
};

function buildTargetLabel(exercise: SessionExercise): string {
  const parts: string[] = [];
  if (exercise.trackingMode !== "TIME") {
    const reps = exercise.targetRepsMax
      ? `${exercise.targetRepsMin}-${exercise.targetRepsMax}`
      : String(exercise.targetRepsMin);
    parts.push(`${exercise.targetSets}×${reps}`);
  } else {
    parts.push(`${exercise.targetSets} sets`);
  }
  if (exercise.trackingMode !== "REPS" && exercise.targetHoldSeconds) {
    parts.push(`hold ${exercise.targetHoldSeconds}s`);
  }
  if (exercise.notes) parts.push(exercise.notes);
  return `Target ${parts.join(" · ")}`;
}

export function SessionExerciseCard({
  sessionId,
  exercise,
}: {
  sessionId: string;
  exercise: SessionExercise;
}) {
  const addSet = useAddSet(sessionId, exercise.id);
  const deleteSet = useDeleteSet(sessionId, exercise.id);
  const startRest = useRestTimerStore((s) => s.start);
  const { data: lastPerformance } = useLastPerformance(exercise.exerciseId);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  const lastSet = exercise.sets[exercise.sets.length - 1];
  const lastTimeSet = lastPerformance?.sets[0];
  const defaultWeightKg = lastSet?.weightKg ?? lastTimeSet?.weightKg ?? 0;
  const defaultReps = lastSet?.reps ?? lastTimeSet?.reps ?? exercise.targetRepsMin;

  const [overrides, setOverrides] = useState<{
    weightKg?: number;
    reps?: number;
    setType: SetType;
    holdSeconds?: number;
  }>({ setType: "NORMAL" });
  const draft = {
    weightKg: overrides.weightKg ?? defaultWeightKg,
    reps: overrides.reps ?? defaultReps,
    setType: overrides.setType,
    holdSeconds: overrides.holdSeconds,
  };

  const handleAddSet = () => {
    primeChime();
    addSet.mutate(
      {
        setNumber: exercise.sets.length + 1,
        weightKg: draft.weightKg,
        reps: draft.reps,
        setType: draft.setType,
        holdSeconds: draft.holdSeconds ?? null,
      },
      {
        onSuccess: ({ set }) => {
          startRest(exercise.restSeconds, { sessionExerciseId: exercise.id, setId: set.id });
          setOverrides((o) => ({ ...o, holdSeconds: undefined }));
        },
      },
    );
  };

  const updateSet = (setNumber: number, patch: { weightKg?: number; reps?: number }) => {
    const set = exercise.sets.find((s) => s.setNumber === setNumber);
    if (!set) return;
    addSet.mutate({
      setNumber,
      weightKg: patch.weightKg ?? set.weightKg,
      reps: patch.reps ?? set.reps,
      setType: set.setType,
      holdSeconds: set.holdSeconds,
    });
  };

  return (
    <Card>
      <Link to={`/workout/library/${exercise.exerciseId}`}>
        <ExerciseThumbnail
          exercise={exercise.exercise}
          className="mb-3 h-44 w-full rounded-2xl bg-surface-2"
          textClassName="text-5xl"
        />
      </Link>
      <div className="flex items-start justify-between gap-3">
        <Link to={`/workout/library/${exercise.exerciseId}`}>
          <div>
            <p className="font-semibold text-text">{exercise.exercise.name}</p>
            <p className="text-xs text-text-muted">{buildTargetLabel(exercise)}</p>
          </div>
        </Link>
        <SetStatusBadge status={exercise.status} />
      </div>

      {exercise.sets.length === 0 && lastPerformance?.sets.length ? (
        <p className="mt-2 text-xs text-text-muted">
          Last time: {lastPerformance.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(", ")}
        </p>
      ) : null}

      {exercise.sets.length === 0 && lastPerformance?.progressionSuggestion ? (
        <p className="mt-1 text-xs font-semibold text-met">
          💪 Add +{lastPerformance.progressionSuggestion.incrementKg}kg next time — you've topped your rep range
          two sessions running.
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {exercise.sets.map((set) => (
          <div key={set.id} className="flex flex-wrap items-center gap-2">
            <span className="w-5 shrink-0 text-xs font-semibold text-text-muted">{set.setNumber}</span>
            <NumberInput
              value={set.weightKg}
              suffix="kg"
              onCommit={(v) => updateSet(set.setNumber, { weightKg: v })}
            />
            {exercise.trackingMode !== "TIME" && (
              <NumberInput value={set.reps} suffix="reps" onCommit={(v) => updateSet(set.setNumber, { reps: v })} />
            )}
            <span className="shrink-0 text-[10px] font-medium uppercase text-text-muted">
              {SET_TYPE_LABELS[set.setType]}
              {set.holdSeconds != null ? ` · ${set.holdSeconds}s held` : ""}
            </span>
            <button
              onClick={() => setDeletingSetId(set.id)}
              className="ml-auto text-text-muted hover:text-danger"
              aria-label="Delete set"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SET_TYPE_LABELS) as SetType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOverrides((o) => ({ ...o, setType: type }))}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                draft.setType === type ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-secondary",
              )}
            >
              {SET_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-5 shrink-0 text-xs font-semibold text-text-muted">{exercise.sets.length + 1}</span>
          <NumberInput
            key={overrides.weightKg === undefined ? `w-${defaultWeightKg}` : "w-fixed"}
            value={draft.weightKg}
            suffix="kg"
            onCommit={(v) => setOverrides((o) => ({ ...o, weightKg: v }))}
          />
          {exercise.trackingMode !== "TIME" && (
            <NumberInput
              key={overrides.reps === undefined ? `r-${defaultReps}` : "r-fixed"}
              value={draft.reps}
              suffix="reps"
              onCommit={(v) => setOverrides((o) => ({ ...o, reps: v }))}
            />
          )}
          {exercise.trackingMode !== "REPS" && (
            <HoldTimerButton
              key={exercise.sets.length}
              seconds={draft.holdSeconds}
              onChange={(s) => setOverrides((o) => ({ ...o, holdSeconds: s }))}
            />
          )}
          <button
            onClick={handleAddSet}
            disabled={addSet.isPending}
            className="ml-auto flex h-9 items-center gap-1 rounded-lg bg-accent px-2.5 text-xs font-semibold text-accent-foreground disabled:opacity-50"
          >
            <Plus className="size-3.5" /> Log set
          </button>
        </div>
      </div>

      {deletingSetId && (
        <ConfirmSheet
          title="Delete this set?"
          description="This removes the logged weight and reps for this set. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteSet.mutate(deletingSetId)}
          onClose={() => setDeletingSetId(null)}
        />
      )}
    </Card>
  );
}

function HoldTimerButton({
  seconds,
  onChange,
}: {
  seconds: number | undefined;
  onChange: (seconds: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(seconds ?? 0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startRef.current !== null) setElapsed(Math.round((Date.now() - startRef.current) / 1000));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [running]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      onChange(elapsed);
    } else {
      startRef.current = Date.now() - elapsed * 1000;
      setRunning(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold",
        running ? "bg-danger/15 text-danger" : "bg-surface-2 text-text-secondary",
      )}
      aria-label={running ? "Stop hold timer" : "Start hold timer"}
    >
      <Timer className="size-3.5" /> {elapsed > 0 ? `${elapsed}s` : "Hold"}
    </button>
  );
}

function NumberInput({
  value,
  suffix,
  onCommit,
}: {
  value: number;
  suffix: string;
  onCommit: (value: number) => void;
}) {
  const [local, setLocal] = useState(String(value));

  return (
    <div className="relative w-20 shrink-0">
      <input
        type="number"
        inputMode="decimal"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onCommit(Number(local) || 0)}
        className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 pr-9 text-sm text-text outline-none focus:border-accent"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">{suffix}</span>
    </div>
  );
}
