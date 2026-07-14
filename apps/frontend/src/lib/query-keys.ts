import type { DashboardPeriod, TransactionFilters } from "@income-outcome/shared";

export const queryKeys = {
  session: ["session"] as const,
  profile: ["profile"] as const,
  categories: (type?: string, includeArchived = false) => ["categories", { type, includeArchived }] as const,
  transactions: (filters: TransactionFilters) => ["transactions", filters] as const,
  dashboard: (period: DashboardPeriod) => ["dashboard", period] as const,
};
