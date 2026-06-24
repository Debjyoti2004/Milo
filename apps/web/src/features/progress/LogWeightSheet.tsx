import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useToastStore } from "@/stores/toastStore";
import { useCreateWeightLog } from "./api";

export function LogWeightSheet({ onClose }: { onClose: () => void }) {
  const [weight, setWeight] = useState("");
  const createWeightLog = useCreateWeightLog();
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = () => {
    if (!weight) return;
    createWeightLog.mutate(
      { date: new Date(), weightKg: Number(weight) },
      {
        onSuccess: () => {
          showToast("Weight logged", "success");
          onClose();
        },
        onError: () => showToast("Couldn't log weight", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Log today's weight">
      <div className="flex flex-col gap-3">
        <Input
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          autoFocus
        />
        <Button size="lg" loading={createWeightLog.isPending} onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </Sheet>
  );
}
