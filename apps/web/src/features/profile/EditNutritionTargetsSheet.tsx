import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { Profile } from "@/lib/types";
import { useToastStore } from "@/stores/toastStore";
import { useUpdateNutritionTargets } from "@/features/progress/api";

export function EditNutritionTargetsSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [calories, setCalories] = useState(profile.dailyCalorieTarget ? String(profile.dailyCalorieTarget) : "");
  const [protein, setProtein] = useState(profile.proteinTargetG ? String(profile.proteinTargetG) : "");
  const [carbs, setCarbs] = useState(profile.carbsTargetG ? String(profile.carbsTargetG) : "");
  const [fat, setFat] = useState(profile.fatTargetG ? String(profile.fatTargetG) : "");
  const updateTargets = useUpdateNutritionTargets();
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = () => {
    updateTargets.mutate(
      {
        dailyCalorieTarget: calories ? Number(calories) : null,
        proteinTargetG: protein ? Number(protein) : null,
        carbsTargetG: carbs ? Number(carbs) : null,
        fatTargetG: fat ? Number(fat) : null,
      },
      {
        onSuccess: () => {
          showToast("Nutrition targets updated", "success");
          onClose();
        },
        onError: () => showToast("Couldn't update targets", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Edit nutrition targets">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">Override the computed targets for any phase of the plan.</p>
        <FieldWrapper label="Calories (kcal/day)">
          <Input type="number" placeholder="e.g. 2250" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="Protein (g/day) — hero metric">
          <Input type="number" placeholder="e.g. 160" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="Carbs (g/day)">
          <Input type="number" placeholder="e.g. 250" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="Fat (g/day)">
          <Input type="number" placeholder="e.g. 57" value={fat} onChange={(e) => setFat(e.target.value)} />
        </FieldWrapper>
        <Button size="lg" loading={updateTargets.isPending} onClick={handleSubmit}>
          Save targets
        </Button>
      </div>
    </Sheet>
  );
}
