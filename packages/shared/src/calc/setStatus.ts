import type { SetStatus } from "../enums.js";

export interface LoggedSet {
  reps: number;
}

export interface SetTarget {
  targetSets: number;
  targetRepsMin: number;
}

/**
 * Pure plan-vs-actual comparison. A set "counts" toward MET if its reps reach
 * the low end of the rep range — exceeding targetRepsMax is still a pass.
 * Logging fewer sets, or sets below the rep floor, is PARTIAL rather than
 * a failure: the app never blocks saving an incomplete session.
 */
export function getSetStatus(target: SetTarget, loggedSets: LoggedSet[]): SetStatus {
  if (loggedSets.length === 0) return "NOT_LOGGED";

  const setsAtTarget = loggedSets.filter((s) => s.reps >= target.targetRepsMin).length;
  const isMet = loggedSets.length >= target.targetSets && setsAtTarget >= target.targetSets;

  return isMet ? "MET" : "PARTIAL";
}
