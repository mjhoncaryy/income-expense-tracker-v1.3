import {
  DEFAULT_CATEGORIES,
  DEFAULT_PREFERENCES,
  type Category,
  type Dashboard,
  type DashboardPeriod,
  type Profile,
  type Transaction,
  type TransactionFilters,
  type TransactionInput,
  type TransactionPage,
  type TransactionType,
} from "@income-outcome/shared";
import { daysBetween, isDateWithin, previousComparablePeriod, todayInJakarta } from "../dates";
import { fromMinorUnits, toMinorUnits } from "../money";
import { createId } from "../utils";

type StoredProfile = Profile & { password: string };
type StoredCategory = Category & { userId: string };
type StoredTransaction = Omit<Transaction, "categoryName" | "categoryIconKey"> & { userId: string };
type Store = { users: StoredProfile[]; categories: StoredCategory[]; transactions: StoredTransaction[]; sessionUserId: string | null };

const STORAGE_KEY = "income-outcome-tracker.mock.v1";
const DEMO_EMAIL = "demo@arusku.id";
const DEMO_PASSWORD = "demo12345";

export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly fields?: Record<string, string[]>) {
    super(message);
  }
}

const pause = () => new Promise((resolve) => window.setTimeout(resolve, 180));
const timestamp = () => new Date().toISOString();

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function demoStore(): Store {
  const demoId = "user_demo";
  const categories = DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    id: `cat_${category.type}_${category.name.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`,
    userId: demoId,
    isDefault: true,
    isArchived: false,
    iconKey: category.iconKey,
  }));
  const findCategory = (name: string, type: TransactionType) => categories.find((category) => category.name === name && category.type === type)!;
  const today = todayInJakarta();
  const entries: Array<[TransactionType, string, string, string, number]> = [
    ["INCOME", "Gaji", "Gaji bulan ini", "12500000", -10],
    ["INCOME", "Usaha", "Proyek desain", "2200000", -2],
    ["EXPENSE", "Tempat Tinggal", "Sewa bulanan", "2800000", -9],
    ["EXPENSE", "Makanan & Minuman", "Belanja mingguan", "475000", -5],
    ["EXPENSE", "Transportasi", "KRL dan ojek", "185000", -4],
    ["EXPENSE", "Tagihan", "Internet rumah", "350000", -3],
    ["EXPENSE", "Belanja", "Kebutuhan rumah", "310000", -1],
    ["EXPENSE", "Makanan & Minuman", "Makan siang", "68000", 0],
    ["INCOME", "Bonus", "Bonus proyek", "750000", -38],
    ["EXPENSE", "Makanan & Minuman", "Belanja bulan lalu", "520000", -39],
    ["EXPENSE", "Transportasi", "Transportasi bulan lalu", "220000", -40],
    ["EXPENSE", "Tagihan", "Listrik", "275000", -41],
  ];
  const transactions = entries.map(([type, categoryName, description, amount, offset], index) => {
    const category = findCategory(categoryName, type);
    return {
      id: `txn_demo_${index + 1}`,
      userId: demoId,
      type,
      amount,
      categoryId: category.id,
      transactionDate: addDays(today, offset),
      description,
      createdAt: new Date(Date.now() + (offset * 86_400_000) + index).toISOString(),
      updatedAt: new Date(Date.now() + (offset * 86_400_000) + index).toISOString(),
    };
  });
  return {
    users: [{ id: demoId, displayName: "Nadia Pratama", email: DEMO_EMAIL, password: DEMO_PASSWORD, ...DEFAULT_PREFERENCES, onboardingCompletedAt: timestamp() }],
    categories,
    transactions,
    sessionUserId: null,
  };
}

function readStore(): Store {
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return demoStore();
  try { return JSON.parse(value) as Store; } catch { return demoStore(); }
}

function writeStore(store: Store): void {
  // ponytail: localStorage provides only demo persistence; replace this adapter with credentialed API calls when Better Auth and Express exist.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function requireUser(store: Store): StoredProfile {
  const user = store.users.find((item) => item.id === store.sessionUserId);
  if (!user) throw new ApiError("UNAUTHORIZED", "Sesi Anda telah berakhir. Silakan masuk kembali.");
  return user;
}

function exposeProfile(user: StoredProfile): Profile {
  const { password: _password, ...profile } = user;
  return profile;
}

function expandTransaction(store: Store, value: StoredTransaction): Transaction {
  const category = store.categories.find((item) => item.id === value.categoryId);
  return {
    ...value,
    categoryName: category?.name ?? "Kategori diarsipkan",
    categoryIconKey: category?.iconKey ?? null,
  };
}

function relevantTransactions(store: Store, userId: string, period: DashboardPeriod): StoredTransaction[] {
  return store.transactions.filter((item) => item.userId === userId && isDateWithin(item.transactionDate, period.from, period.to));
}

function sum(values: StoredTransaction[], type?: TransactionType): bigint {
  return values.filter((item) => !type || item.type === type).reduce((total, item) => total + toMinorUnits(item.amount), 0n);
}

function percentage(current: bigint, previous: bigint): number | null {
  if (previous === 0n) return null;
  return Number(((current - previous) * 10_000n) / (previous < 0n ? -previous : previous)) / 100;
}

function dashboardFor(store: Store, userId: string, period: DashboardPeriod): Dashboard {
  const current = relevantTransactions(store, userId, period);
  const previous = relevantTransactions(store, userId, previousComparablePeriod(period));
  const income = sum(current, "INCOME");
  const expense = sum(current, "EXPENSE");
  const priorIncome = sum(previous, "INCOME");
  const priorExpense = sum(previous, "EXPENSE");
  const net = income - expense;
  const priorNet = priorIncome - priorExpense;
  const points = daysBetween(period.from, period.to).map((date) => {
    const dateTransactions = current.filter((item) => item.transactionDate === date);
    return { date, income: fromMinorUnits(sum(dateTransactions, "INCOME")), expense: fromMinorUnits(sum(dateTransactions, "EXPENSE")) };
  });
  const categoryTotals = new Map<string, { categoryId: string; name: string; amount: bigint; count: number }>();
  current.filter((item) => item.type === "EXPENSE").forEach((item) => {
    const category = store.categories.find((entry) => entry.id === item.categoryId);
    const existing = categoryTotals.get(item.categoryId) ?? { categoryId: item.categoryId, name: category?.name ?? "Kategori diarsipkan", amount: 0n, count: 0 };
    existing.amount += toMinorUnits(item.amount);
    existing.count += 1;
    categoryTotals.set(item.categoryId, existing);
  });
  return {
    period,
    summary: {
      income: fromMinorUnits(income),
      expense: fromMinorUnits(expense),
      net: fromMinorUnits(net),
      comparison: { income: percentage(income, priorIncome), expense: percentage(expense, priorExpense), net: percentage(net, priorNet) },
    },
    cashFlow: points,
    expenseByCategory: [...categoryTotals.values()]
      .sort((a, b) => (a.amount > b.amount ? -1 : 1))
      .map(({ amount, ...item }) => ({ ...item, amount: fromMinorUnits(amount) })),
    recentTransactions: [...current]
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((item) => expandTransaction(store, item)),
  };
}

export const mockApi = {
  async getSession(): Promise<Profile | null> {
    await pause();
    const store = readStore();
    const user = store.users.find((item) => item.id === store.sessionUserId);
    return user ? exposeProfile(user) : null;
  },

  async login(email: string, password: string): Promise<Profile> {
    await pause();
    const store = readStore();
    const user = store.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!user) throw new ApiError("AUTHENTICATION_ERROR", "Email atau kata sandi tidak tepat.");
    store.sessionUserId = user.id;
    writeStore(store);
    return exposeProfile(user);
  },

  async register(displayName: string, email: string, password: string): Promise<Profile> {
    await pause();
    const store = readStore();
    if (store.users.some((item) => item.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new ApiError("CONFLICT", "Pendaftaran belum dapat diproses. Coba masuk atau gunakan email lain.");
    }
    const id = createId("user");
    const user: StoredProfile = { id, displayName: displayName.trim(), email: email.trim().toLowerCase(), password, ...DEFAULT_PREFERENCES, onboardingCompletedAt: timestamp() };
    store.users.push(user);
    store.categories.push(...DEFAULT_CATEGORIES.map((category) => ({ ...category, id: createId("cat"), userId: id, isDefault: true, isArchived: false, iconKey: category.iconKey })));
    store.sessionUserId = id;
    writeStore(store);
    return exposeProfile(user);
  },

  async logout(): Promise<void> {
    await pause();
    const store = readStore();
    store.sessionUserId = null;
    writeStore(store);
  },

  async getProfile(): Promise<Profile> {
    await pause();
    return exposeProfile(requireUser(readStore()));
  },

  async updateProfile(displayName: string): Promise<Profile> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    user.displayName = displayName.trim();
    writeStore(store);
    return exposeProfile(user);
  },

  async deleteAccount(): Promise<void> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    // ponytail: a real DELETE /me must require recent Better Auth re-authentication before this irreversible operation.
    store.users = store.users.filter((item) => item.id !== user.id);
    store.categories = store.categories.filter((item) => item.userId !== user.id);
    store.transactions = store.transactions.filter((item) => item.userId !== user.id);
    store.sessionUserId = null;
    writeStore(store);
  },

  async listCategories(type?: TransactionType, includeArchived = false): Promise<Category[]> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    return store.categories.filter((item) => item.userId === user.id && (!type || item.type === type) && (includeArchived || !item.isArchived));
  },

  async createCategory(type: TransactionType, name: string): Promise<Category> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const normalized = name.trim();
    if (store.categories.some((item) => item.userId === user.id && item.type === type && !item.isArchived && item.name.toLocaleLowerCase("id") === normalized.toLocaleLowerCase("id"))) {
      throw new ApiError("CONFLICT", "Nama kategori sudah digunakan.", { name: ["Gunakan nama kategori lain."] });
    }
    const category: StoredCategory = { id: createId("cat"), userId: user.id, type, name: normalized, iconKey: "tag", isDefault: false, isArchived: false };
    store.categories.push(category);
    writeStore(store);
    return category;
  },

  async renameCategory(categoryId: string, name: string): Promise<Category> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const category = store.categories.find((item) => item.id === categoryId && item.userId === user.id);
    if (!category) throw new ApiError("NOT_FOUND", "Kategori tidak ditemukan.");
    const normalized = name.trim();
    if (store.categories.some((item) => item.id !== categoryId && item.userId === user.id && item.type === category.type && !item.isArchived && item.name.toLocaleLowerCase("id") === normalized.toLocaleLowerCase("id"))) {
      throw new ApiError("CONFLICT", "Nama kategori sudah digunakan.");
    }
    category.name = normalized;
    writeStore(store);
    return category;
  },

  async archiveCategory(categoryId: string): Promise<Category> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const category = store.categories.find((item) => item.id === categoryId && item.userId === user.id);
    if (!category) throw new ApiError("NOT_FOUND", "Kategori tidak ditemukan.");
    if (category.isDefault && category.name === "Lainnya") throw new ApiError("STATE_CONFLICT", "Kategori Lainnya tetap diperlukan sebagai kategori cadangan.");
    category.isArchived = true;
    writeStore(store);
    return category;
  },

  async listTransactions(filters: TransactionFilters): Promise<TransactionPage> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const values = store.transactions
      .filter((item) => item.userId === user.id && isDateWithin(item.transactionDate, filters.from, filters.to) && (!filters.type || item.type === filters.type) && (!filters.categoryId || item.categoryId === filters.categoryId))
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt));
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    return { items: values.slice((page - 1) * pageSize, page * pageSize).map((item) => expandTransaction(store, item)), page, pageSize, totalItems: values.length, totalPages: Math.ceil(values.length / pageSize) };
  },

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const category = store.categories.find((item) => item.id === input.categoryId && item.userId === user.id && !item.isArchived);
    if (!category || category.type !== input.type) throw new ApiError("VALIDATION_ERROR", "Kategori tidak sesuai.", { categoryId: ["Pilih kategori yang sesuai dengan jenis transaksi."] });
    if (input.transactionDate > addDays(todayInJakarta(), 365)) throw new ApiError("VALIDATION_ERROR", "Tanggal belum dapat digunakan.", { transactionDate: ["Tanggal tidak boleh lebih dari satu tahun ke depan."] });
    const value: StoredTransaction = { id: createId("txn"), userId: user.id, ...input, amount: fromMinorUnits(toMinorUnits(input.amount)), description: input.description.trim(), createdAt: timestamp(), updatedAt: timestamp() };
    store.transactions.push(value);
    writeStore(store);
    return expandTransaction(store, value);
  },

  async updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const value = store.transactions.find((item) => item.id === id && item.userId === user.id);
    const category = store.categories.find((item) => item.id === input.categoryId && item.userId === user.id && !item.isArchived);
    if (!value) throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    if (!category || category.type !== input.type) throw new ApiError("VALIDATION_ERROR", "Kategori tidak sesuai.", { categoryId: ["Pilih kategori yang sesuai dengan jenis transaksi."] });
    Object.assign(value, input, { amount: fromMinorUnits(toMinorUnits(input.amount)), description: input.description.trim(), updatedAt: timestamp() });
    writeStore(store);
    return expandTransaction(store, value);
  },

  async deleteTransaction(id: string): Promise<void> {
    await pause();
    const store = readStore();
    const user = requireUser(store);
    const before = store.transactions.length;
    store.transactions = store.transactions.filter((item) => item.id !== id || item.userId !== user.id);
    if (store.transactions.length === before) throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    writeStore(store);
  },

  async getDashboard(period: DashboardPeriod): Promise<Dashboard> {
    await pause();
    const store = readStore();
    return dashboardFor(store, requireUser(store).id, period);
  },

  resetDemo(): void { writeStore(demoStore()); },
  demoCredentials: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
};
