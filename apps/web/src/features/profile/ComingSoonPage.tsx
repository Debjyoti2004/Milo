import { ChevronLeft, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";

export function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 self-start text-sm font-medium text-text-secondary hover:text-text"
      >
        <ChevronLeft className="size-4" /> Back
      </button>

      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/15">
          <PhoneCall className="size-7 text-accent" />
        </div>
        <h1 className="text-xl font-bold text-text">Call a Trainer</h1>
        <p className="max-w-xs text-sm text-text-secondary">
          Live coaching calls are coming soon. For now, keep logging your workouts and meals —
          we'll use that data to personalize your coaching once this launches.
        </p>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-text-muted">
          Coming soon
        </span>
      </Card>
    </div>
  );
}
