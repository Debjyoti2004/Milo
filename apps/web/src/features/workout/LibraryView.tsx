import { Dumbbell, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { AddCustomExerciseSheet } from "@/components/workout/AddCustomExerciseSheet";
import { ExerciseThumbnail } from "@/components/workout/ExerciseThumbnail";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useToastStore } from "@/stores/toastStore";
import { useDeleteExercise, useExercises, useMuscleGroups } from "./api";

export function LibraryView() {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | undefined>();
  const [addingCustom, setAddingCustom] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: muscles } = useMuscleGroups();
  const { data, isLoading } = useExercises({ q: search || undefined, muscle });
  const deleteExercise = useDeleteExercise();
  const showToast = useToastStore((s) => s.show);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search exercises — even if you don't know the name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="md" variant="secondary" onClick={() => setAddingCustom(true)}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <MuscleChip label="All" active={!muscle} onClick={() => setMuscle(undefined)} />
        {muscles?.muscles.map((m) => (
          <MuscleChip key={m} label={m} active={muscle === m} onClick={() => setMuscle(m)} />
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : data?.exercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No exercises found" description="Try a different search or muscle group." />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {data?.exercises.map((ex) => (
            <Link
              key={ex.id}
              to={`/workout/library/${ex.id}`}
              className="relative overflow-hidden rounded-card border border-border bg-surface transition active:scale-[0.98]"
            >
              <ExerciseThumbnail
                exercise={ex}
                className="aspect-square w-full bg-surface-2"
                textClassName="text-3xl"
              />
              {ex.isCustom && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingId(ex.id);
                  }}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Delete exercise"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-text line-clamp-2">{ex.name}</p>
                <p className="mt-0.5 text-xs capitalize text-text-muted">
                  {ex.primaryMuscles[0] ?? ex.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {addingCustom && <AddCustomExerciseSheet onClose={() => setAddingCustom(false)} />}

      {deletingId && (
        <ConfirmSheet
          title="Delete this exercise?"
          description="This permanently removes the exercise and any photos/videos you uploaded for it. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteExercise.mutate(deletingId, {
              onSuccess: () => showToast("Exercise deleted", "success"),
              onError: (err) => {
                const message = err instanceof ApiClientError ? err.message : "Couldn't delete exercise";
                showToast(message, "error");
              },
            });
          }}
          onClose={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}

function MuscleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition",
        active ? "bg-accent text-accent-foreground" : "border border-border bg-surface text-text-secondary",
      )}
    >
      {label}
    </button>
  );
}
