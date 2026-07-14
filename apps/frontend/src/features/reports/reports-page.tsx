import type { Transaction, TransactionFilters } from "@income-outcome/shared";
import { Download } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "../../components/shared/states";
import { api, ApiError } from "../../lib/api/client";
import { useTransactions } from "../../lib/api/hooks";
import { formatDate, monthPeriod } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { toReportCsv } from "./report-csv";

const pageSize = 100;

function reportFilters(from: string, to: string): TransactionFilters {
  return { from, to, page: 1, pageSize };
}

async function getAllTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const first = await api.listTransactions(filters);
  if (first.totalPages <= 1) return first.items;
  const remaining = await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => api.listTransactions({ ...filters, page: index + 2 })));
  return [first, ...remaining].flatMap((page) => page.items);
}

function downloadReport(transactions: Transaction[], from: string, to: string): void {
  const url = URL.createObjectURL(new Blob([toReportCsv(transactions)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-transaksi-${from}-sampai-${to}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ReportsPage() {
  const current = monthPeriod();
  const [from, setFrom] = useState(current.from);
  const [to, setTo] = useState(current.to);
  const [applied, setApplied] = useState({ from: current.from, to: current.to });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const query = useTransactions(reportFilters(applied.from, applied.to));
  const invalidRange = to < from;
  const count = query.data?.totalItems ?? 0;

  async function exportCsv() {
    setExporting(true); setExportError(null);
    try { downloadReport(await getAllTransactions(reportFilters(applied.from, applied.to)), applied.from, applied.to); } catch (error) { setExportError((error as ApiError).message); } finally { setExporting(false); }
  }

  return <>
    <PageHeader title="Laporan" description="Unduh catatan transaksi untuk periode yang Anda pilih dalam format CSV." />
    <section className="report-section">
      <form className="filters" onSubmit={(event) => { event.preventDefault(); if (!invalidRange) setApplied({ from, to }); }}>
        <div className="field"><label htmlFor="report-from">Dari tanggal</label><input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required /></div>
        <div className="field"><label htmlFor="report-to">Sampai tanggal</label><input id="report-to" type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} required /></div>
        <button className="button button-secondary" disabled={invalidRange}>Tampilkan laporan</button>
        {invalidRange && <p className="field-error" role="alert">Tanggal akhir harus sama dengan atau setelah tanggal mulai.</p>}
      </form>
      {query.isLoading ? <LoadingState rows={4} /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : <section className="panel report-result">
        <h2>Laporan transaksi</h2>
        <p>{count ? `${count} transaksi ditemukan untuk periode ini.` : "Tidak ada transaksi untuk periode ini."}</p>
        {count ? <><button className="button button-primary" onClick={exportCsv} disabled={exporting}><Download size={18} aria-hidden="true" />{exporting ? "Menyiapkan CSV…" : "Unduh CSV"}</button>{exportError && <p className="form-error" role="alert">{exportError}</p>}<ReportPreview transactions={query.data!.items} total={count} /></> : <EmptyState title="Belum ada transaksi"><p>Ubah rentang tanggal untuk mencari catatan lain.</p></EmptyState>}
      </section>}
    </section>
  </>;
}

function ReportPreview({ transactions, total }: { transactions: Transaction[]; total: number }) {
  return <section className="ledger report-preview" aria-label="Pratinjau laporan transaksi"><div className="ledger-header"><span>Tanggal</span><span>Keterangan</span><span>Kategori</span><span style={{ textAlign: "right" }}>Jumlah</span></div>{transactions.map((transaction) => <article className="ledger-line" key={transaction.id}><span className="muted">{formatDate(transaction.transactionDate)}</span><div><span className="transaction-name">{transaction.description}</span><span className="transaction-meta">{transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</span></div><span className="type-badge">{transaction.categoryName}</span><strong className={`transaction-amount ${transaction.type === "INCOME" ? "income" : "expense"}`}>{transaction.type === "INCOME" ? "+" : "−"}{formatMoney(transaction.amount)}</strong></article>)}{total > transactions.length && <p className="report-preview-note">Menampilkan {transactions.length} dari {total} transaksi. CSV akan memuat seluruh transaksi.</p>}</section>;
}
