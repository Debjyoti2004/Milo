import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { CardioLog } from "@/lib/types";
import { useLogCardio } from "./api";

export function CardioLogSheet({
  date,
  current,
  onClose,
}: {
  date: Date;
  current: CardioLog | null | undefined;
  onClose: () => void;
}) {
  const [steps, setSteps] = useState(current?.steps != null ? String(current.steps) : "");
  const [walkMinutes, setWalkMinutes] = useState(
    current?.walkMinutes != null ? String(current.walkMinutes) : "",
  );
  const [hiitMinutes, setHiitMinutes] = useState(
    current?.hiitMinutes != null ? String(current.hiitMinutes) : "",
  );
  const logCardio = useLogCardio();

  const handleSave = () => {
    logCardio.mutate(
      {
        date,
        steps: steps === "" ? null : Number(steps),
        walkMinutes: walkMinutes === "" ? null : Number(walkMinutes),
        hiitMinutes: hiitMinutes === "" ? null : Number(hiitMinutes),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Log cardio">
      <div className="flex flex-col gap-4">
        <FieldWrapper label="Steps — target 8,000–10,000">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 6500"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label="Post-workout walk (minutes) — target 15–20">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 18"
            value={walkMinutes}
            onChange={(e) => setWalkMinutes(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label="HIIT (minutes) — optional, 10 min 1-2x/week">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 10"
            value={hiitMinutes}
            onChange={(e) => setHiitMinutes(e.target.value)}
          />
        </FieldWrapper>
        <Button onClick={handleSave} loading={logCardio.isPending} className="mt-1">
          Save
        </Button>
      </div>
    </Sheet>
  );
}
