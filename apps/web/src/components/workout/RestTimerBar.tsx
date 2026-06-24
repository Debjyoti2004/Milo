import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { recordRestTaken } from "@/features/workout/api";
import { playRestCompleteChime } from "@/lib/chime";
import { formatSeconds } from "@/lib/format";
import { useRestTimerStore } from "@/stores/restTimerStore";
import { useToastStore } from "@/stores/toastStore";

export function RestTimerBar() {
  const endsAt = useRestTimerStore((s) => s.endsAt);
  const durationSec = useRestTimerStore((s) => s.durationSec);
  const startedAt = useRestTimerStore((s) => s.startedAt);
  const context = useRestTimerStore((s) => s.context);
  const cancel = useRestTimerStore((s) => s.cancel);
  const addSeconds = useRestTimerStore((s) => s.addSeconds);
  const showToast = useToastStore((s) => s.show);
  const [remaining, setRemaining] = useState(0);

  const reportRestTaken = () => {
    if (!context || !startedAt) return;
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    recordRestTaken(context.sessionExerciseId, context.setId, elapsed).catch(() => {});
  };

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const secondsLeft = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft === 0) {
        reportRestTaken();
        cancel();
        playRestCompleteChime();
        showToast("Rest over — next set!", "info");
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, cancel, showToast]);

  const progress = endsAt ? 1 - remaining / durationSec : 0;

  const handleSkip = () => {
    reportRestTaken();
    cancel();
  };

  return (
    <AnimatePresence>
      {endsAt && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-0 bottom-16 z-40 px-4 lg:bottom-4 lg:left-64"
        >
          <div className="mx-auto flex max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-border bg-surface-2 p-3 shadow-lg">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Timer className="size-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text">Resting</span>
                <span className="font-mono font-semibold text-text">{formatSeconds(remaining)}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
                <div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <button
              onClick={() => addSeconds(-15)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary hover:text-text"
              aria-label="Subtract 15 seconds"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              onClick={() => addSeconds(15)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary hover:text-text"
              aria-label="Add 15 seconds"
            >
              <Plus className="size-3.5" />
            </button>
            <button onClick={handleSkip} className="text-text-muted hover:text-text" aria-label="Skip rest">
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
