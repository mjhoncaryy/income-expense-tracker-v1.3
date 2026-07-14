import type { DashboardPeriod } from "@income-outcome/shared";

const TIME_ZONE = "Asia/Jakarta";

export function todayInJakarta(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function oneYearFromTodayInJakarta(): string {
  const date = new Date(`${todayInJakarta()}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthPeriod(offset = 0): DashboardPeriod {
  const [year, month] = todayInJakarta().split("-").map(Number);
  const start = addMonths(new Date(Date.UTC(year, month - 1, 1)), offset);
  const end = addMonths(start, 1);
  end.setUTCDate(0);
  return { from: iso(start), to: iso(end), interval: "day" };
}

export function lastThreeMonthsPeriod(): DashboardPeriod {
  const current = monthPeriod();
  const [year, month] = current.from.split("-").map(Number);
  const start = addMonths(new Date(Date.UTC(year, month - 1, 1)), -2);
  return { from: iso(start), to: current.to, interval: "month" };
}

export function previousComparablePeriod(period: DashboardPeriod): DashboardPeriod {
  const start = new Date(`${period.from}T00:00:00Z`);
  const end = new Date(`${period.to}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - days + 1);
  return { from: iso(previousStart), to: iso(previousEnd), interval: period.interval };
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TIME_ZONE, ...options }).format(new Date(`${value}T00:00:00Z`));
}

export function isDateWithin(value: string, from?: string, to?: string): boolean {
  return (!from || value >= from) && (!to || value <= to);
}

export function daysBetween(from: string, to: string): string[] {
  const values: string[] = [];
  const current = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (current <= end) {
    values.push(iso(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return values;
}
