import { describe, expect, it } from "vitest";
import { getSetStatus } from "./setStatus.js";

const target = { targetSets: 4, targetRepsMin: 12 };

describe("getSetStatus", () => {
  it("is NOT_LOGGED when nothing has been logged", () => {
    expect(getSetStatus(target, [])).toBe("NOT_LOGGED");
  });

  it("is PARTIAL when fewer sets were logged than planned (the 20kg bench example)", () => {
    expect(getSetStatus(target, [{ reps: 7 }, { reps: 7 }])).toBe("PARTIAL");
  });

  it("is PARTIAL when enough sets were logged but reps fell short of the target floor", () => {
    expect(
      getSetStatus(target, [{ reps: 8 }, { reps: 9 }, { reps: 8 }, { reps: 7 }]),
    ).toBe("PARTIAL");
  });

  it("is MET when sets and reps both reach the target", () => {
    expect(
      getSetStatus(target, [{ reps: 12 }, { reps: 13 }, { reps: 12 }, { reps: 15 }]),
    ).toBe("MET");
  });

  it("is MET when reps exceed the rep range ceiling", () => {
    expect(
      getSetStatus(target, [{ reps: 20 }, { reps: 18 }, { reps: 16 }, { reps: 14 }]),
    ).toBe("MET");
  });
});
