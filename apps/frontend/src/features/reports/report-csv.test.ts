import type { Transaction } from "@income-outcome/shared";
import { describe, expect, it } from "vitest";
import { toReportCsv } from "./report-csv";

const transaction: Transaction = {
  id: "txn_1", type: "EXPENSE", amount: "123456.00", categoryId: "cat_1", categoryName: "Makanan, & Minuman", categoryIconKey: null,
  transactionDate: "2026-07-14", description: "Belanja \"mingguan\"\nrumah", createdAt: "2026-07-14T00:00:00.000Z", updatedAt: "2026-07-14T00:00:00.000Z",
};

describe("toReportCsv", () => {
  it("adds an Excel BOM, raw amount, and escaped CSV cells", () => {
    expect(toReportCsv([transaction])).toBe("﻿Tanggal,Jenis,Kategori,Keterangan,Jumlah\r\n2026-07-14,Pengeluaran,\"Makanan, & Minuman\",\"Belanja \"\"mingguan\"\"\nrumah\",123456.00");
  });

  it("prevents spreadsheet formula execution in text cells", () => {
    expect(toReportCsv([{ ...transaction, description: "=SUM(1,1)" }])).toContain(",\"'=SUM(1,1)\",123456.00");
  });
});
