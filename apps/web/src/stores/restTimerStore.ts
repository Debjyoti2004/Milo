import { create } from "zustand";

interface RestContext {
  sessionExerciseId: string;
  setId: string;
}

interface RestTimerState {
  endsAt: number | null;
  durationSec: number;
  startedAt: number | null;
  context: RestContext | null;
  start: (durationSec: number, context?: RestContext) => void;
  addSeconds: (delta: number) => void;
  cancel: () => void;
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  endsAt: null,
  durationSec: 90,
  startedAt: null,
  context: null,
  start: (durationSec, context) =>
    set({ endsAt: Date.now() + durationSec * 1000, durationSec, startedAt: Date.now(), context: context ?? null }),
  addSeconds: (delta) => {
    const { endsAt } = get();
    if (!endsAt) return;
    set({ endsAt: Math.max(Date.now(), endsAt + delta * 1000) });
  },
  cancel: () => set({ endsAt: null, startedAt: null, context: null }),
}));
