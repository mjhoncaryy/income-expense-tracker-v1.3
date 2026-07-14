import { describe, expect, it } from "vitest";
import { previousComparablePeriod } from "./dates";

describe("previousComparablePeriod", () => {
  it("returns an equal-length immediately preceding range", () => {
    expect(previousComparablePeriod({ from: "2026-07-01", to: "2026-07-31", interval: "day" })).toEqual({ from: "2026-05-31", to: "2026-06-30", interval: "day" });
  });
});
