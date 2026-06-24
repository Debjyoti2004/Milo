import { Plus, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/stores/toastStore";
import { useCreateCustomFood, useMyFoods } from "./api";

export function MyFoodsView() {
  const { data, isLoading } = useMyFoods();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button size="sm" className="self-start" onClick={() => setCreating(true)}>
        <Plus className="size-3.5" /> New custom food
      </Button>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : data && data.foods.length > 0 ? (
        data.foods.map((food) => (
          <Card key={food.id} className="flex items-center justify-between">
            <p className="font-medium text-text">{food.name}</p>
            <p className="text-sm text-text-muted">
              {food.caloriesPerServing} kcal / {food.servingSizeG}g
            </p>
          </Card>
        ))
      ) : (
        <EmptyState
          icon={UtensilsCrossed}
          title="No custom foods yet"
          description="Save meals you eat often so logging them is one tap."
        />
      )}

      {creating && <CreateFoodSheet onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateFoodSheet({ onClose }: { onClose: () => void }) {
  const createFood = useCreateCustomFood();
  const showToast = useToastStore((s) => s.show);
  const [form, setForm] = useState({ name: "", servingSizeG: "100", caloriesPerServing: "", proteinG: "", carbsG: "", fatG: "" });

  const handleSubmit = () => {
    if (!form.name || !form.caloriesPerServing) return;
    createFood.mutate(
      {
        name: form.name,
        servingSizeG: Number(form.servingSizeG) || 100,
        caloriesPerServing: Number(form.caloriesPerServing),
        proteinG: Number(form.proteinG || 0),
        carbsG: Number(form.carbsG || 0),
        fatG: Number(form.fatG || 0),
      },
      {
        onSuccess: () => {
          showToast("Custom food saved", "success");
          onClose();
        },
        onError: () => showToast("Couldn't save that food", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title="New custom food">
      <div className="flex flex-col gap-3">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Serving size (g)"
            value={form.servingSizeG}
            onChange={(e) => setForm((f) => ({ ...f, servingSizeG: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Calories"
            value={form.caloriesPerServing}
            onChange={(e) => setForm((f) => ({ ...f, caloriesPerServing: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Protein (g)"
            value={form.proteinG}
            onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Carbs (g)"
            value={form.carbsG}
            onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Fat (g)"
            value={form.fatG}
            onChange={(e) => setForm((f) => ({ ...f, fatG: e.target.value }))}
          />
        </div>
        <Button size="lg" loading={createFood.isPending} onClick={handleSubmit}>
          Save food
        </Button>
      </div>
    </Sheet>
  );
}
