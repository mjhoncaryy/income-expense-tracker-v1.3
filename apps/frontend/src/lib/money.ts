const MONEY_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

export function toMinorUnits(value: string): bigint {
  if (!MONEY_PATTERN.test(value)) throw new Error("Jumlah uang tidak valid.");
  const sign = value.startsWith("-") ? -1n : 1n;
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  return sign * (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
}

export function fromMinorUnits(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const cents = String(absolute % 100n).padStart(2, "0");
  return `${sign}${whole}.${cents}`;
}

export function formatMoney(value: string): string {
  const minor = toMinorUnits(value);
  const sign = minor < 0n ? "−" : "";
  const rupiah = (minor < 0n ? -minor : minor) / 100n;
  return `${sign}${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(rupiah)} Rp`;
}

export function formatSignedMoney(value: string): string {
  const amount = formatMoney(value);
  return value.startsWith("-") ? amount : `+${amount}`;
}

export function safeChartValue(value: string): number {
  const minor = toMinorUnits(value);
  const rupiah = minor / 100n;
  if (rupiah > BigInt(Number.MAX_SAFE_INTEGER) || rupiah < BigInt(Number.MIN_SAFE_INTEGER)) return 0;
  return Number(rupiah);
}
