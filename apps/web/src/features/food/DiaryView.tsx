import { MEAL_TYPES, type MealType } from "@gym/shared";
import { ChevronLeft, ChevronRight, Lightbulb, Plus, Sparkles, Star, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatFriendlyDate, formatNumber, toDateParam } from "@/lib/format";
import { useToastStore } from "@/stores/toastStore";
import { useTodaySummary } from "@/features/today/api";
import { useAiReviewDay, useAiSuggestMeals, useCreateFoodLog, useDeleteFoodLog, useFoodLogs } from "./api";
import { AddFoodSheet } from "./AddFoodSheet";
import { AiFoodSheet } from "./AiFoodSheet";

type TemplateItem = { label: string; mealType: MealType; calories: number; proteinG: number; carbsG: number; fatG: number };
const MEAL_TEMPLATES: TemplateItem[] = [
  { label: "🍳 Morning", mealType: "BREAKFAST", calories: 450, proteinG: 32, carbsG: 26, fatG: 23 },
  { label: "🥤 Post-workout", mealType: "BREAKFAST", calories: 285, proteinG: 37, carbsG: 32, fatG: 2 },
  { label: "🍛 Lunch", mealType: "LUNCH", calories: 665, proteinG: 50, carbsG: 112, fatG: 3 },
  { label: "🌰 Snack", mealType: "SNACK", calories: 276, proteinG: 13, carbsG: 24, fatG: 16 },
  { label: "🥘 Dinner", mealType: "DINNER", calories: 655, proteinG: 28, carbsG: 55, fatG: 34 },
];

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

export function DiaryView() {
  const [date, setDate] = useState(() => new Date());
  const [addingMeal, setAddingMeal] = useState<MealType | null>(null);
  const [aiMealType, setAiMealType] = useState<MealType | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPantry, setShowPantry] = useState(false);
  const [pantryInput, setPantryInput] = useState(() => localStorage.getItem("gym_pantry") ?? "");
  const [dayReview, setDayReview] = useState<string | null>(null);
  const reviewDay = useAiReviewDay();
  const { data: logsData, isLoading } = useFoodLogs(date);
  const { data: summary } = useTodaySummary(date);
  const deleteLog = useDeleteFoodLog();
  const createLog = useCreateFoodLog();
  const showToast = useToastStore((s) => s.show);

  const logs = logsData?.logs ?? [];
  const isToday = toDateParam(date) === toDateParam(new Date());

  const remainingCalories = Math.max(0, (summary?.targets?.calories ?? 0) - (summary?.consumed.calories ?? 0));
  const remainingProteinG = Math.max(0, (summary?.targets?.proteinG ?? 0) - (summary?.consumed.proteinG ?? 0));
  const remainingCarbsG = Math.max(0, (summary?.targets?.carbsG ?? 0) - (summary?.consumed.carbsG ?? 0));
  const remainingFatG = Math.max(0, (summary?.targets?.fatG ?? 0) - (summary?.consumed.fatG ?? 0));

  const savedPantry = localStorage.getItem("gym_pantry") ?? "";
  const suggestions = useAiSuggestMeals({
    remainingCalories,
    remainingProteinG,
    remainingCarbsG,
    remainingFatG,
    availableFoods: savedPantry || undefined,
    enabled: showSuggestions,
  });

  const logTemplate = (t: TemplateItem) => {
    createLog.mutate(
      { date, mealType: t.mealType, customName: t.label.replace(/^\S+ /, ""), quantity: 1, calories: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG },
      { onSuccess: () => showToast(`Logged ${t.label} (${t.calories} kcal, ${t.proteinG}g protein)`, "success") },
    );
  };

  const shiftDay = (delta: number) => {
    setDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDay(-1)} className="rounded-full p-2 hover:bg-surface-2" aria-label="Previous day">
          <ChevronLeft className="size-5 text-text-secondary" />
        </button>
        <p className="font-semibold text-text">{isToday ? "Today" : formatFriendlyDate(date)}</p>
        <button
          onClick={() => shiftDay(1)}
          disabled={isToday}
          className="rounded-full p-2 hover:bg-surface-2 disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className="size-5 text-text-secondary" />
        </button>
      </div>

      {/* Quick templates */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {MEAL_TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => logTemplate(t)}
            disabled={createLog.isPending}
            className="shrink-0 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </div>

      {summary?.targets && (
        <Card className="grid grid-cols-4 gap-2 text-center">
          <Stat label="kcal" value={summary.consumed.calories} target={summary.targets.calories} />
          <Stat label="protein" value={summary.consumed.proteinG} target={summary.targets.proteinG} unit="g" />
          <Stat label="carbs" value={summary.consumed.carbsG} target={summary.targets.carbsG} unit="g" />
          <Stat label="fat" value={summary.consumed.fatG} target={summary.targets.fatG} unit="g" />
        </Card>
      )}

      {/* AI suggestions + pantry + day review */}
      {summary?.targets && (
        <div className="flex flex-col gap-2">
          {/* What to eat suggestion */}
          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-text-secondary hover:border-accent hover:text-text"
          >
            <Lightbulb className="size-4 text-partial" />
            What should I eat to hit my targets?
          </button>
          {showSuggestions && (
            <div className="rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm text-text-secondary whitespace-pre-line">
              {suggestions.isLoading ? "Asking AI…" : (suggestions.data?.suggestions ?? "No suggestions yet.")}
            </div>
          )}

          {/* Available foods / pantry */}
          <button
            onClick={() => setShowPantry((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-text-secondary hover:border-accent hover:text-text"
          >
            <Star className="size-4 text-accent" />
            {savedPantry ? "My available foods (tap to edit)" : "Add foods I have at home"}
          </button>
          {showPantry && (
            <div className="flex flex-col gap-2">
              <textarea
                rows={2}
                placeholder="e.g. paneer, eggs, rice, dal, oats, banana, whey protein"
                value={pantryInput}
                onChange={(e) => setPantryInput(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
              <button
                onClick={() => {
                  localStorage.setItem("gym_pantry", pantryInput.trim());
                  setShowPantry(false);
                  showToast("Saved — suggestions will now use these foods", "success");
                }}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
              >
                Save
              </button>
            </div>
          )}

          {/* Day review */}
          {summary.targets.calories && (
            <button
              onClick={() => {
                if (dayReview) { setDayReview(null); return; }
                reviewDay.mutate(
                  {
                    consumed: summary.consumed,
                    targets: {
                      calories: summary.targets!.calories ?? 0,
                      proteinG: summary.targets!.proteinG ?? 0,
                      carbsG: summary.targets!.carbsG ?? 0,
                      fatG: summary.targets!.fatG ?? 0,
                    },
                  },
                  { onSuccess: (res) => setDayReview(res.review) },
                );
              }}
              disabled={reviewDay.isPending}
              className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-text-secondary hover:border-accent hover:text-text disabled:opacity-50"
            >
              <Sparkles className="size-4 text-met" />
              {reviewDay.isPending ? "Reviewing…" : dayReview ? "Hide review" : "How did I do today?"}
            </button>
          )}
          {dayReview && (
            <div className="rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm text-text-secondary whitespace-pre-line">
              {dayReview}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-3">
          {MEAL_TYPES.map((mealType) => {
            const mealLogs = logs.filter((l) => l.mealType === mealType);
            const mealCalories = mealLogs.reduce((sum, l) => sum + l.calories, 0);
            return (
              <Card key={mealType}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text">{MEAL_LABELS[mealType]}</p>
                    {mealLogs.length > 0 && (
                      <p className="text-xs text-text-muted">{formatNumber(mealCalories)} kcal</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAiMealType(mealType)}
                      className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                      title="Log with AI"
                    >
                      <Sparkles className="size-3.5" /> AI
                    </button>
                    <button
                      onClick={() => setAddingMeal(mealType)}
                      className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text"
                    >
                      <Plus className="size-3.5" /> Add
                    </button>
                  </div>
                </div>

                {mealLogs.length > 0 && (
                  <ul className="mt-3 flex flex-col divide-y divide-border">
                    {mealLogs.map((log) => (
                      <li key={log.id} className="flex items-center justify-between gap-2 py-2.5">
                        <div>
                          <p className="text-sm text-text">{log.food?.name ?? log.customName}</p>
                          <p className="text-xs text-text-muted">
                            {formatNumber(log.calories)} kcal · P{formatNumber(log.proteinG)} C
                            {formatNumber(log.carbsG)} F{formatNumber(log.fatG)}
                          </p>
                        </div>
                        <button
                          onClick={() => setDeletingLogId(log.id)}
                          className="text-text-muted hover:text-danger"
                          aria-label="Remove"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}

          {logs.length === 0 && (
            <EmptyState icon={UtensilsCrossed} title="Nothing logged yet" description="Tap AI to log by typing, or Add to search foods." />
          )}
        </div>
      )}

      {addingMeal && <AddFoodSheet date={date} defaultMealType={addingMeal} onClose={() => setAddingMeal(null)} />}
      {aiMealType && <AiFoodSheet date={date} defaultMealType={aiMealType} onClose={() => setAiMealType(null)} />}

      {deletingLogId && (
        <ConfirmSheet
          title="Remove this food entry?"
          description="This removes it from your diary for the day. This can't be undone."
          confirmLabel="Remove"
          danger
          onConfirm={() => deleteLog.mutate(deletingLogId)}
          onClose={() => setDeletingLogId(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, target, unit }: { label: string; value: number; target: number | null; unit?: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-text">
        {formatNumber(value)}
        {unit}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-text-muted">
        {label}
        {target ? ` /${formatNumber(target)}` : ""}
      </p>
    </div>
  );
}
