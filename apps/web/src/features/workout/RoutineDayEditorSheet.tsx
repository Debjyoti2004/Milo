import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { RoutineDay } from "@/lib/types";
import { useToastStore } from "@/stores/toastStore";
import { useExercises, useUpdateRoutineDay } from "./api";

interface EditableExercise {
  exerciseId: string;
  name: string;
  image: string | undefined;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  notes: string | null;
}

export function RoutineDayEditorSheet({ day, onClose }: { day: RoutineDay; onClose: () => void }) {
  const [items, setItems] = useState<EditableExercise[]>(
    day.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.exercise.name,
      image: ex.exercise.images[0],
      targetSets: ex.targetSets,
      targetRepsMin: ex.targetRepsMin,
      targetRepsMax: ex.targetRepsMax,
      notes: ex.notes,
    })),
  );
  const [search, setSearch] = useState("");
  const { data: searchResults } = useExercises({ q: search });
  const updateDay = useUpdateRoutineDay(day.id);
  const showToast = useToastStore((s) => s.show);

  const updateItem = (index: number, patch: Partial<EditableExercise>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addExercise = (exerciseId: string, name: string, image: string | undefined) => {
    setItems((prev) => [
      ...prev,
      { exerciseId, name, image, targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, notes: null },
    ]);
    setSearch("");
  };

  const handleSave = () => {
    updateDay.mutate(
      {
        exercises: items.map((item, index) => ({
          exerciseId: item.exerciseId,
          orderIndex: index,
          targetSets: item.targetSets,
          targetRepsMin: item.targetRepsMin,
          targetRepsMax: item.targetRepsMax,
          notes: item.notes,
        })),
      },
      {
        onSuccess: () => {
          showToast("Day updated", "success");
          onClose();
        },
        onError: () => showToast("Couldn't save changes", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title={`Edit ${day.label}`}>
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={`${item.exerciseId}-${index}`} className="rounded-2xl border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text">{item.name}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => moveItem(index, -1)} className="text-text-muted hover:text-text" aria-label="Move up">
                  <ChevronUp className="size-4" />
                </button>
                <button onClick={() => moveItem(index, 1)} className="text-text-muted hover:text-text" aria-label="Move down">
                  <ChevronDown className="size-4" />
                </button>
                <button onClick={() => removeItem(index)} className="text-danger hover:brightness-110" aria-label="Remove">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <NumberField
                label="Sets"
                value={item.targetSets}
                onChange={(v) => updateItem(index, { targetSets: v })}
              />
              <NumberField
                label="Reps min"
                value={item.targetRepsMin}
                onChange={(v) => updateItem(index, { targetRepsMin: v })}
              />
              <NumberField
                label="Reps max"
                value={item.targetRepsMax ?? 0}
                onChange={(v) => updateItem(index, { targetRepsMax: v || null })}
              />
            </div>
          </div>
        ))}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Add an exercise…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {search && (
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-border">
            {searchResults?.exercises.slice(0, 8).map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex.id, ex.name, ex.images[0])}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text hover:bg-surface-2"
              >
                {ex.name}
              </button>
            ))}
            {searchResults?.exercises.length === 0 && (
              <p className="px-3 py-2.5 text-sm text-text-muted">No matches</p>
            )}
          </div>
        )}

        <Button size="lg" className="mt-2" onClick={handleSave} loading={updateDay.isPending}>
          Save changes
        </Button>
      </div>
    </Sheet>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text outline-none focus:border-accent"
      />
    </label>
  );
}
