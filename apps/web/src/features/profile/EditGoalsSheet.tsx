import { GOALS } from "@gym/shared";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { Profile } from "@/lib/types";
import { useToastStore } from "@/stores/toastStore";
import { useUpdateProfile } from "./api";

const GOAL_LABELS: Record<string, string> = {
  LOSE_FAT: "Lose fat",
  MAINTAIN: "Maintain",
  BUILD_MUSCLE: "Build muscle",
  RECOMP: "Recomp",
};

export function EditGoalsSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [currentWeightKg, setCurrentWeightKg] = useState(String(profile.currentWeightKg));
  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg ? String(profile.targetWeightKg) : "");
  const [goal, setGoal] = useState(profile.goal);
  const updateProfile = useUpdateProfile();
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = () => {
    updateProfile.mutate(
      {
        currentWeightKg: Number(currentWeightKg),
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
        goal,
      },
      {
        onSuccess: () => {
          showToast("Goals updated", "success");
          onClose();
        },
        onError: () => showToast("Couldn't update your goals", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Edit goals">
      <div className="flex flex-col gap-4">
        <FieldWrapper label="Current weight (kg)">
          <Input type="number" step="0.1" value={currentWeightKg} onChange={(e) => setCurrentWeightKg(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="Target weight (kg)">
          <Input type="number" step="0.1" value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="Goal">
          <Select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {GOAL_LABELS[g]}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <Button size="lg" loading={updateProfile.isPending} onClick={handleSubmit}>
          Save — recalculates your targets
        </Button>
      </div>
    </Sheet>
  );
}
