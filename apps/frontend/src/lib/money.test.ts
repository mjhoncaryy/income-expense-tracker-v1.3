import { describe, expect, it } from "vitest";
import { fromMinorUnits, toMinorUnits } from "./money";

describe("minor-unit money helpers", () => {
  it("round-trips rupiah decimal strings without floating-point arithmetic", () => {
    expect(toMinorUnits("125000.5")).toBe(12_500_050n);
    expect(fromMinorUnits(12_500_050n)).toBe("125000.50");
  });
});
