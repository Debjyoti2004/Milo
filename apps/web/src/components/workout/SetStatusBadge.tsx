import type { SetStatus } from "@gym/shared";
import { cn } from "@/lib/cn";

const STYLES: Record<SetStatus, string> = {
  MET: "bg-met/15 text-met",
  PARTIAL: "bg-partial/15 text-partial",
  NOT_LOGGED: "bg-not-logged/15 text-text-muted",
};

const LABELS: Record<SetStatus, string> = {
  MET: "Hit target",
  PARTIAL: "Partial",
  NOT_LOGGED: "Not logged",
};

export function SetStatusBadge({ status, className }: { status: SetStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
