import { Flag, Play, Pause, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";

function formatStopwatch(ms: number): string {
  const totalCentiseconds = Math.floor(ms / 10);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

export function StopwatchSheet({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startRef.current !== null) setElapsedMs(Date.now() - startRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [running]);

  const toggle = () => {
    if (running) {
      setRunning(false);
    } else {
      startRef.current = Date.now() - elapsedMs;
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setElapsedMs(0);
    setLaps([]);
    startRef.current = null;
  };

  const lap = () => setLaps((prev) => [elapsedMs, ...prev]);

  return (
    <Sheet open onClose={onClose} title="Stopwatch">
      <div className="flex flex-col items-center gap-6 py-4">
        <span className="font-mono text-5xl font-bold tabular-nums text-text">
          {formatStopwatch(elapsedMs)}
        </span>

        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:text-text"
            aria-label="Reset"
          >
            <RotateCcw className="size-5" />
          </button>
          <button
            onClick={toggle}
            className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground"
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? <Pause className="size-6" /> : <Play className="size-6" />}
          </button>
          <button
            onClick={lap}
            disabled={!running}
            className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:text-text disabled:opacity-40"
            aria-label="Lap"
          >
            <Flag className="size-5" />
          </button>
        </div>

        {laps.length > 0 && (
          <div className="flex w-full flex-col gap-1.5">
            {laps.map((lapMs, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="text-text-muted">Lap {laps.length - i}</span>
                <span className="font-mono text-text">{formatStopwatch(lapMs)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
