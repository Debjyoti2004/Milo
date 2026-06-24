import { MEAL_TYPES, type MealType } from "@gym/shared";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { cn } from "@/lib/cn";
import { toDateParam } from "@/lib/format";
import type { Food } from "@/lib/types";
import { useToastStore } from "@/stores/toastStore";
import { useCreateFoodLog, useFoodSearch } from "./api";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

export function AddFoodSheet({
  date,
  defaultMealType,
  onClose,
}: {
  date: Date;
  defaultMealType: MealType;
  onClose: () => void;
}) {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [custom, setCustom] = useState({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "" });

  const { data: results } = useFoodSearch(query || undefined);
  const createLog = useCreateFoodLog();
  const showToast = useToastStore((s) => s.show);

  const handleAddSelected = () => {
    if (!selected) return;
    createLog.mutate(
      { date, mealType, foodId: selected.id, quantity },
      {
        onSuccess: () => {
          showToast(`Added ${selected.name}`, "success");
          onClose();
        },
        onError: () => showToast("Couldn't add that food", "error"),
      },
    );
  };

  const handleAddCustom = () => {
    if (!custom.name || !custom.calories) return;
    createLog.mutate(
      {
        date,
        mealType,
        customName: custom.name,
        quantity: 1,
        calories: Number(custom.calories),
        proteinG: Number(custom.proteinG || 0),
        carbsG: Number(custom.carbsG || 0),
        fatG: Number(custom.fatG || 0),
      },
      {
        onSuccess: () => {
          showToast(`Added ${custom.name}`, "success");
          onClose();
        },
        onError: () => showToast("Couldn't add that food", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title={`Add to ${toDateParam(date) === toDateParam(new Date()) ? "today" : "diary"}`}>
      <div className="flex flex-col gap-4">
        <SegmentedTabs
          options={MEAL_TYPES.map((m) => ({ value: m, label: MEAL_LABELS[m] }))}
          value={mealType}
          onChange={(v) => setMealType(v as MealType)}
        />

        <div className="flex gap-2">
          <ModeButton label="Search" active={mode === "search"} onClick={() => setMode("search")} />
          <ModeButton label="Custom entry" active={mode === "custom"} onClick={() => setMode("custom")} />
        </div>

        {mode === "search" ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search foods…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
                className="pl-9"
              />
            </div>

            {!selected ? (
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-border">
                {results?.foods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => setSelected(food)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface-2"
                  >
                    <span className="text-text">{food.name}</span>
                    <span className="text-text-muted">{food.caloriesPerServing} kcal</span>
                  </button>
                ))}
                {results && results.foods.length === 0 && (
                  <p className="px-3 py-2.5 text-sm text-text-muted">No matches — try Custom entry.</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text">{selected.name}</p>
                  <button onClick={() => setSelected(null)} className="text-xs text-text-muted underline">
                    change
                  </button>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {selected.caloriesPerServing} kcal per {selected.servingSizeG}g serving
                </p>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Servings</span>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-24"
                  />
                </label>
                <p className="mt-2 text-xs text-text-muted">
                  ≈ {Math.round(selected.caloriesPerServing * quantity)} kcal
                </p>
              </div>
            )}

            <Button size="lg" disabled={!selected} loading={createLog.isPending} onClick={handleAddSelected}>
              Add to diary
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              placeholder="What did you eat?"
              value={custom.name}
              onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Calories"
                value={custom.calories}
                onChange={(e) => setCustom((c) => ({ ...c, calories: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Protein (g)"
                value={custom.proteinG}
                onChange={(e) => setCustom((c) => ({ ...c, proteinG: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Carbs (g)"
                value={custom.carbsG}
                onChange={(e) => setCustom((c) => ({ ...c, carbsG: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Fat (g)"
                value={custom.fatG}
                onChange={(e) => setCustom((c) => ({ ...c, fatG: e.target.value }))}
              />
            </div>
            <Button size="lg" disabled={!custom.name || !custom.calories} loading={createLog.isPending} onClick={handleAddCustom}>
              Add to diary
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl py-2 text-sm font-medium transition",
        active ? "bg-surface-2 text-text" : "text-text-muted",
      )}
    >
      {label}
    </button>
  );
}
