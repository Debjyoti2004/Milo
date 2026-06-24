import { Minus, Plus, type LucideIcon } from "lucide-react";
import { useState } from "react";

export function PlanPill({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-2 px-2 py-3">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        <Icon className="size-3" /> {label}
      </span>
      {children}
    </div>
  );
}

export function NumberStepper({
  value,
  min = 1,
  max = 20,
  onCommit,
}: {
  value: number;
  min?: number;
  max?: number;
  onCommit: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onCommit(Math.max(min, value - 1))}
        className="flex size-7 items-center justify-center rounded-lg bg-surface text-text-secondary hover:text-text"
        aria-label="Decrease"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold text-text">{value}</span>
      <button
        onClick={() => onCommit(Math.min(max, value + 1))}
        className="flex size-7 items-center justify-center rounded-lg bg-surface text-text-secondary hover:text-text"
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function EditableNumber({
  value,
  suffix,
  onCommit,
}: {
  value: number;
  suffix: string;
  onCommit: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value));

  if (!editing) {
    return (
      <button
        onClick={() => {
          setLocal(String(value));
          setEditing(true);
        }}
        className="text-sm font-semibold text-text"
      >
        {value}
        {suffix}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="number"
      inputMode="decimal"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onCommit(Number(local) || 0);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="h-7 w-14 rounded-lg border border-border bg-surface px-1 text-center text-sm text-text outline-none focus:border-accent"
    />
  );
}

export function EditableRepsRange({
  min,
  max,
  onCommit,
}: {
  min: number;
  max: number | null;
  onCommit: (min: number, max: number | null) => void;
}) {
  const effectiveMax = max ?? min;

  const stepMin = (delta: number) => {
    const newMin = Math.max(1, Math.min(100, min + delta));
    onCommit(newMin, Math.max(newMin, effectiveMax));
  };
  const stepMax = (delta: number) => {
    const newMax = Math.max(min, Math.min(100, effectiveMax + delta));
    onCommit(min, newMax);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => stepMin(-1)}
          className="flex size-6 items-center justify-center rounded-md bg-surface text-text-secondary hover:text-text"
          aria-label="Decrease min reps"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-5 text-center text-xs font-semibold text-text">{min}</span>
        <button
          onClick={() => stepMin(1)}
          className="flex size-6 items-center justify-center rounded-md bg-surface text-text-secondary hover:text-text"
          aria-label="Increase min reps"
        >
          <Plus className="size-3" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => stepMax(-1)}
          className="flex size-6 items-center justify-center rounded-md bg-surface text-text-secondary hover:text-text"
          aria-label="Decrease max reps"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-5 text-center text-xs font-semibold text-text">{effectiveMax}</span>
        <button
          onClick={() => stepMax(1)}
          className="flex size-6 items-center justify-center rounded-md bg-surface text-text-secondary hover:text-text"
          aria-label="Increase max reps"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
