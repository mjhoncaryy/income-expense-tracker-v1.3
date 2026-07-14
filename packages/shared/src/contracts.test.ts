import { describe, expect, it } from "vitest";

import {
  canonicalMoney,
  isoDateSchema,
  positiveMoneyStringSchema,
  transactionFiltersSchema,
} from "./index.js";

describe("shared financial contracts", () => {
  it("canonicalizes money without floating point arithmetic", () => {
    expect(canonicalMoney("1234.5")).toBe("1234.50");
    expect(positiveMoneyStringSchema.safeParse("9999999999999999.99").success).toBe(true);
    expect(positiveMoneyStringSchema.safeParse("10000000000000000.00").success).toBe(false);
  });

  it("rejects non-calendar dates and reversed filters", () => {
    expect(isoDateSchema.safeParse("2026-02-29").success).toBe(false);
    expect(transactionFiltersSchema.safeParse({ from: "2026-07-31", to: "2026-07-01" }).success).toBe(false);
  });

  it("coerces page query values within the API limit", () => {
    expect(transactionFiltersSchema.parse({ page: "2", pageSize: "100" })).toMatchObject({ page: 2, pageSize: 100 });
    expect(transactionFiltersSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});
