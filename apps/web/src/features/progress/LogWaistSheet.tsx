import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useToastStore } from "@/stores/toastStore";
import { useCreateWaistLog } from "./api";

export function LogWaistSheet({ onClose }: { onClose: () => void }) {
  const [waist, setWaist] = useState("");
  const createWaistLog = useCreateWaistLog();
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = () => {
    if (!waist) return;
    createWaistLog.mutate(
      { date: new Date(), waistCm: Number(waist) },
      {
        onSuccess: () => {
          showToast("Waist logged", "success");
          onClose();
        },
        onError: () => showToast("Couldn't log waist", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Log waist measurement">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-muted">Measure at belly button, first thing in the morning.</p>
        <Input
          type="number"
          step="0.1"
          placeholder="Waist (cm)"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          autoFocus
        />
        <Button size="lg" loading={createWaistLog.isPending} onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </Sheet>
  );
}
