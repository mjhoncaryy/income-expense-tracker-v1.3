import { z } from "zod";

export const transactionTypes = ["INCOME", "EXPENSE"] as const;
export const transactionTypeSchema = z.enum(transactionTypes);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const DEFAULT_PREFERENCES = {
  locale: "id-ID",
  currencyCode: "IDR",
  timezone: "Asia/Jakarta",
} as const;

export const DEFAULT_CATEGORIES = [
  { type: "INCOME", name: "Gaji", iconKey: "wallet" },
  { type: "INCOME", name: "Usaha", iconKey: "store" },
  { type: "INCOME", name: "Bonus", iconKey: "badge" },
  { type: "INCOME", name: "Investasi", iconKey: "chart" },
  { type: "INCOME", name: "Lainnya", iconKey: "circle" },
  { type: "EXPENSE", name: "Makanan & Minuman", iconKey: "utensils" },
  { type: "EXPENSE", name: "Transportasi", iconKey: "car" },
  { type: "EXPENSE", name: "Tagihan", iconKey: "receipt" },
  { type: "EXPENSE", name: "Tempat Tinggal", iconKey: "house" },
  { type: "EXPENSE", name: "Belanja", iconKey: "shopping" },
  { type: "EXPENSE", name: "Kesehatan", iconKey: "heart" },
  { type: "EXPENSE", name: "Pendidikan", iconKey: "book" },
  { type: "EXPENSE", name: "Hiburan", iconKey: "film" },
  { type: "EXPENSE", name: "Lainnya", iconKey: "circle" },
] as const satisfies ReadonlyArray<{ type: TransactionType; name: string; iconKey: string }>;

const MAX_MONEY = 9_999_999_999_999_999_99n;
const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

function toMinorUnits(value: string): bigint {
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export const moneyStringSchema = z.string()
  .regex(MONEY_PATTERN, "Masukkan jumlah uang yang valid.")
  .refine((value) => toMinorUnits(value) <= MAX_MONEY, "Jumlah melebihi batas yang diizinkan.");

export const positiveMoneyStringSchema = moneyStringSchema.refine(
  (value) => toMinorUnits(value) > 0n,
  "Jumlah harus lebih dari nol.",
);

export function canonicalMoney(value: string): string {
  const amount = toMinorUnits(value);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, "0")}`;
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return parsed.getUTCFullYear() === Number(year)
    && parsed.getUTCMonth() === Number(month) - 1
    && parsed.getUTCDate() === Number(day);
}

export const isoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Gunakan format tanggal YYYY-MM-DD.")
  .refine(isCalendarDate, "Masukkan tanggal kalender yang valid.");

// Resource IDs remain broad in portable contracts so the existing frontend-only mock stays usable.
// The backend applies UUID validation to path and persistence boundaries.
export const uuidSchema = z.string().uuid("ID sumber daya tidak valid.");
export const resourceIdSchema = z.string().min(1, "ID sumber daya tidak valid.");
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1).max(60),
  email: z.string().email(),
  locale: z.literal("id-ID"),
  currencyCode: z.literal("IDR"),
  timezone: z.literal("Asia/Jakarta"),
  onboardingCompletedAt: z.string().nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateProfileInputSchema = z.object({
  displayName: z.string().trim().min(1, "Nama wajib diisi.").max(60),
});
export const deleteAccountInputSchema = z.object({
  password: z.string().min(8, "Masukkan kata sandi untuk melanjutkan."),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;

export const categorySchema = z.object({
  id: resourceIdSchema,
  type: transactionTypeSchema,
  name: z.string().min(1).max(60),
  iconKey: z.string().max(50).nullable(),
  isDefault: z.boolean(),
  isArchived: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  type: transactionTypeSchema,
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(60),
  iconKey: z.string().max(50).optional(),
});
export const updateCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(60),
  iconKey: z.string().max(50).nullable().optional(),
});
export const categoryFiltersSchema = z.object({
  type: transactionTypeSchema.optional(),
  includeArchived: z.enum(["true", "false"]).optional().default("false").transform((value) => value === "true"),
});
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const transactionSchema = z.object({
  id: resourceIdSchema,
  type: transactionTypeSchema,
  amount: positiveMoneyStringSchema,
  categoryId: resourceIdSchema,
  categoryName: z.string(),
  categoryIconKey: z.string().nullable(),
  transactionDate: isoDateSchema,
  description: z.string().trim().min(1).max(120),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionInputSchema = z.object({
  type: transactionTypeSchema,
  amount: positiveMoneyStringSchema,
  categoryId: resourceIdSchema,
  transactionDate: isoDateSchema,
  description: z.string().trim().min(1, "Tambahkan keterangan.").max(120),
});
export const createTransactionInputSchema = transactionInputSchema;
export const updateTransactionInputSchema = transactionInputSchema;
export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionFiltersSchema = paginationSchema.extend({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: uuidSchema.optional(),
}).refine(({ from, to }) => !from || !to || from <= to, {
  message: "Tanggal mulai tidak boleh setelah tanggal akhir.",
  path: ["to"],
});
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const dashboardPeriodSchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  interval: z.enum(["day", "month"]),
}).refine(({ from, to }) => from <= to, {
  message: "Tanggal mulai tidak boleh setelah tanggal akhir.",
  path: ["to"],
});
export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>;

export const dashboardSchema = z.object({
  period: dashboardPeriodSchema,
  summary: z.object({
    income: moneyStringSchema,
    expense: moneyStringSchema,
    net: z.string().regex(/^-?\d+\.\d{2}$/),
    comparison: z.object({ income: z.number().nullable(), expense: z.number().nullable(), net: z.number().nullable() }),
  }),
  cashFlow: z.array(z.object({ date: isoDateSchema, income: moneyStringSchema, expense: moneyStringSchema })),
  expenseByCategory: z.array(z.object({ categoryId: resourceIdSchema, name: z.string(), amount: moneyStringSchema, count: z.number().int().min(1) })),
  recentTransactions: z.array(transactionSchema),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

export const requestMetaSchema = z.object({ requestId: uuidSchema });
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.array(z.string())).optional(),
  requestId: uuidSchema.optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export function successEnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, meta: requestMetaSchema });
}

export const errorEnvelopeSchema = z.object({ error: apiErrorSchema.extend({ requestId: uuidSchema }) });
export const pageSchema = z.object({
  items: z.array(transactionSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
export type TransactionPage = z.infer<typeof pageSchema>;
