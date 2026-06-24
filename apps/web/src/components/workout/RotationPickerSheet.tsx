import { Check, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useExercise, useExercises, useUpdateRotationPool } from "@/features/workout/api";
import { useToastStore } from "@/stores/toastStore";

function PoolItem({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  const { data } = useExercise(id);
  return (
    <button
      onClick={() => onRemove(id)}
      className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-left text-sm text-text"
    >
      {data?.exercise.name ?? "Loading…"}
      <Check className="size-4 text-accent" />
    </button>
  );
}

export function RotationPickerSheet({
  routineExerciseId,
  currentExerciseId,
  currentExerciseName,
  pool,
  onClose,
}: {
  routineExerciseId: string;
  currentExerciseId: string;
  currentExerciseName: string;
  pool: string[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(pool.length > 0 ? pool : [currentExerciseId]),
  );
  const [search, setSearch] = useState("");
  const { data: currentExercise } = useExercise(currentExerciseId);
  const { data: searchResults } = useExercises({ q: search });
  const primaryMuscle = currentExercise?.exercise.primaryMuscles[0];
  const { data: suggested } = useExercises({ muscle: search ? undefined : primaryMuscle });
  const updatePool = useUpdateRotationPool(routineExerciseId);
  const showToast = useToastStore((s) => s.show);

  const toggle = (id: string) => {
    if (id === currentExerciseId) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    updatePool.mutate([...selected], {
      onSuccess: () => {
        showToast("Rotation updated", "success");
        onClose();
      },
      onError: () => showToast("Couldn't save rotation", "error"),
    });
  };

  const suggestions = (suggested?.exercises ?? []).filter(
    (ex) => !selected.has(ex.id) && ex.id !== currentExerciseId,
  );

  return (
    <Sheet open onClose={onClose} title="Exercise rotation">
      <p className="mb-3 text-sm text-text-secondary">
        Pick the exercises this slot rotates through. {currentExerciseName} is always included.
      </p>

      <div className="flex flex-col gap-2">
        <span className="rounded-xl bg-accent/15 px-3 py-2 text-sm font-medium text-accent">
          {currentExerciseName} (current)
        </span>
        {[...selected].filter((id) => id !== currentExerciseId).map((id) => (
          <PoolItem key={id} id={id} onRemove={toggle} />
        ))}
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Add an alternative…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {search ? (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-border">
          {searchResults?.exercises
            .filter((ex) => !selected.has(ex.id))
            .slice(0, 8)
            .map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  toggle(ex.id);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text hover:bg-surface-2"
              >
                {ex.name}
              </button>
            ))}
          {searchResults?.exercises.length === 0 && (
            <p className="px-3 py-2.5 text-sm text-text-muted">No matches</p>
          )}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Suggested — same muscle group
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestions.slice(0, 5).map((ex) => (
              <button
                key={ex.id}
                onClick={() => toggle(ex.id)}
                className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-left text-sm text-text hover:bg-border"
              >
                {ex.name}
                <Plus className="size-4 text-text-muted" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Button size="lg" className="mt-4 w-full" onClick={handleSave} loading={updatePool.isPending}>
        Save rotation
      </Button>
    </Sheet>
  );
}
