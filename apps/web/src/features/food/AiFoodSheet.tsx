import type { MealType } from "@gym/shared";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { formatNumber } from "@/lib/format";
import { useToastStore } from "@/stores/toastStore";
import { type AiFoodItem, useAiParseFood, useCreateFoodLog } from "./api";

export function AiFoodSheet({
  date,
  defaultMealType,
  onClose,
}: {
  date: Date;
  defaultMealType: MealType;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<AiFoodItem[] | null>(null);
  const parseFood = useAiParseFood();
  const createLog = useCreateFoodLog();
  const showToast = useToastStore((s) => s.show);

  const handleAnalyse = () => {
    if (!text.trim()) return;
    parseFood.mutate(text, {
      onSuccess: (res) => setItems(res.items),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Couldn't analyse food";
        const isQuota = msg.includes("AI_QUOTA") || msg.includes("free tier");
        const isConfig = msg.includes("AI_NOT_CONFIGURED") || msg.includes("GEMINI_API_KEY");
        if (isQuota) {
          showToast("Gemini free tier quota is 0. Enable billing at console.cloud.google.com or get a free key at aistudio.google.com.", "error");
        } else if (isConfig) {
          showToast("Add your GEMINI_API_KEY to apps/server/.env and restart the server.", "error");
        } else {
          showToast(msg, "error");
        }
      },
    });
  };

  const handleLogAll = () => {
    if (!items) return;
    let done = 0;
    for (const item of items) {
      createLog.mutate(
        {
          date,
          mealType: defaultMealType,
          customName: `${item.name} (${item.servingDescription})`,
          quantity: 1,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
        },
        {
          onSuccess: () => {
            done++;
            if (done === items.length) {
              showToast(`Logged ${items.length} item${items.length > 1 ? "s" : ""} — ${totalCalories} kcal, ${totalProtein}g protein`, "success");
              onClose();
            }
          },
        },
      );
    }
  };

  const totalCalories = items ? Math.round(items.reduce((s, i) => s + i.calories, 0)) : 0;
  const totalProtein = items ? Math.round(items.reduce((s, i) => s + i.proteinG, 0) * 10) / 10 : 0;

  return (
    <Sheet open onClose={onClose} title="AI food log">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-muted">
            Type anything — "100g paneer and 2 roti", "4 boiled eggs", "chicken curry with rice"
          </p>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="What did you eat?"
              value={text}
              onChange={(e) => { setText(e.target.value); setItems(null); }}
              className="w-full resize-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          <Button onClick={handleAnalyse} loading={parseFood.isPending} disabled={!text.trim() || parseFood.isPending}>
            <Sparkles className="size-4" />
            {parseFood.isPending ? "Analysing…" : "Analyse"}
          </Button>
        </div>

        {items && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border divide-y divide-border">
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-text">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.servingDescription}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text">{formatNumber(item.calories)} kcal</p>
                    <p className="text-xs text-met">P {formatNumber(item.proteinG)}g</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-sm font-semibold text-text">Total</p>
              <p className="text-sm font-semibold text-text">
                {totalCalories} kcal · <span className="text-met">{totalProtein}g protein</span>
              </p>
            </div>

            <Button size="lg" loading={createLog.isPending} onClick={handleLogAll}>
              Log all
            </Button>

            <button
              onClick={() => setItems(null)}
              className="text-center text-xs text-text-muted hover:text-text"
            >
              Edit description ↑
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
