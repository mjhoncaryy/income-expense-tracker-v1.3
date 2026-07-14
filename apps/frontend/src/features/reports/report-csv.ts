import type { Transaction } from "@income-outcome/shared";

const headers = ["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah"];

function cell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toReportCsv(transactions: Transaction[]): string {
  const rows = transactions.map((transaction) => [
    transaction.transactionDate,
    transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
    transaction.categoryName,
    transaction.description,
    transaction.amount,
  ].map(cell).join(","));
  return `﻿${headers.join(",")}\r\n${rows.join("\r\n")}`;
}
