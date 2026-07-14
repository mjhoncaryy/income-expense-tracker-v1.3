import type { DashboardPeriod } from "@income-outcome/shared";
import { ArrowDownRight, ArrowUpRight, CalendarDays, CirclePlus, ReceiptText } from "lucide-react";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { Link } from "react-router-dom";
import { PageHeader, useAppShell } from "../../app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "../../components/shared/states";
import { useDashboard } from "../../lib/api/hooks";
import { formatDate, lastThreeMonthsPeriod, monthPeriod } from "../../lib/dates";
import { formatMoney, formatSignedMoney, safeChartValue } from "../../lib/money";
import { useState } from "react";

const PERIODS = [
  { label: "Bulan ini", value: "current", get: () => monthPeriod() },
  { label: "Bulan lalu", value: "previous", get: () => monthPeriod(-1) },
  { label: "3 bulan", value: "three", get: lastThreeMonthsPeriod },
] as const;

function formatTooltipValue(value: ValueType, _name: string | number): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return `${new Intl.NumberFormat("id-ID").format(Number(raw ?? 0))} Rp`;
}

export function DashboardPage() {
  const [active, setActive] = useState<(typeof PERIODS)[number]["value"] | "custom">("current");
  const [period, setPeriod] = useState<DashboardPeriod>(() => monthPeriod());
  const dashboard = useDashboard(period);
  const { openTransactionSheet } = useAppShell();
  const selectPeriod = (item: (typeof PERIODS)[number]) => { setActive(item.value); setPeriod(item.get()); };
  return <>
    <PageHeader title="Ringkasan arus kas" description={`Periode ${formatDate(period.from)}—${formatDate(period.to)}. Semua angka mengikuti rentang yang sama.`}><div className="period-control" aria-label="Pilih periode">{PERIODS.map((item) => <button className={`period-button ${active === item.value ? "active" : ""}`} onClick={() => selectPeriod(item)} key={item.value}>{item.label}</button>)}<label className="visually-hidden" htmlFor="dashboard-from">Tanggal mulai</label><input id="dashboard-from" aria-label="Tanggal mulai khusus" type="date" value={period.from} onChange={(event) => { setActive("custom"); setPeriod((current) => ({ ...current, from: event.target.value })); }} /><label className="visually-hidden" htmlFor="dashboard-to">Tanggal akhir</label><input id="dashboard-to" aria-label="Tanggal akhir khusus" type="date" min={period.from} value={period.to} onChange={(event) => { setActive("custom"); setPeriod((current) => ({ ...current, to: event.target.value })); }} /></div></PageHeader>
    {dashboard.isLoading ? <LoadingState rows={7} /> : dashboard.isError ? <ErrorState onRetry={() => dashboard.refetch()} /> : dashboard.data && <DashboardContent data={dashboard.data} onAdd={openTransactionSheet} />}
  </>;
}

function DashboardContent({ data, onAdd }: { data: NonNullable<ReturnType<typeof useDashboard>["data"]>; onAdd: () => void }) {
  const hasData = data.recentTransactions.length > 0;
  if (!hasData) return <section className="panel"><EmptyState title="Belum ada transaksi pada periode ini"><p>Tambahkan transaksi pertama untuk melihat pemasukan, pengeluaran, dan gambaran arus kas Anda.</p><button className="button button-primary" onClick={onAdd}><CirclePlus size={18} aria-hidden="true" />Tambah transaksi</button></EmptyState></section>;
  const chartData = data.cashFlow.map((point) => ({ ...point, label: formatDate(point.date, { day: "numeric", month: "short" }), incomeValue: safeChartValue(point.income), expenseValue: safeChartValue(point.expense) }));
  const categoryData = data.expenseByCategory.map((item) => ({ ...item, value: safeChartValue(item.amount) }));
  return <>
    <section className="metrics" aria-label="Ringkasan keuangan"><Metric label="Pemasukan" value={data.summary.income} comparison={data.summary.comparison.income} type="income" /><Metric label="Pengeluaran" value={data.summary.expense} comparison={data.summary.comparison.expense} type="expense" /><Metric label="Selisih arus kas" value={data.summary.net} comparison={data.summary.comparison.net} type="net" /></section>
    <section className="dashboard-grid"><article className="panel"><div className="panel-head"><div><h2>Arus kas per hari</h2><p className="panel-subtitle">Pemasukan dan pengeluaran dalam periode terpilih.</p></div><CalendarDays size={18} aria-hidden="true" /></div><div className="chart-box" role="img" aria-label="Grafik garis pemasukan dan pengeluaran per hari"><ResponsiveContainer><LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#eee9e6" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#756f6d" }} tickLine={false} axisLine={false} minTickGap={28} /><YAxis tick={{ fontSize: 11, fill: "#756f6d" }} tickLine={false} axisLine={false} width={58} tickFormatter={(value) => `${Math.round(value / 1000)} rb`} /><Tooltip formatter={formatTooltipValue} /><Legend /><Line type="monotone" dataKey="incomeValue" name="Pemasukan" stroke="oklch(0.43 0.10 190)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /><Line type="monotone" dataKey="expenseValue" name="Pengeluaran" stroke="oklch(0.50 0.16 28)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div><div className="chart-legend"><span className="legend-item"><i className="dot dot-income" />Pemasukan</span><span className="legend-item"><i className="dot dot-expense" />Pengeluaran</span></div><ChartTable rows={data.cashFlow.map((row) => [formatDate(row.date), formatMoney(row.income), formatMoney(row.expense)])} headings={["Tanggal", "Pemasukan", "Pengeluaran"]} /></article>
      <article className="panel"><div className="panel-head"><div><h2>Pengeluaran per kategori</h2><p className="panel-subtitle">Kategori dengan pengeluaran terbesar.</p></div><ReceiptText size={18} aria-hidden="true" /></div>{categoryData.length ? <><div className="chart-box" role="img" aria-label="Grafik batang pengeluaran per kategori"><ResponsiveContainer><BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "#514b49" }} tickLine={false} axisLine={false} /><Tooltip formatter={formatTooltipValue} /><Bar dataKey="value" name="Pengeluaran" fill="oklch(0.50 0.16 28)" radius={[4, 4, 4, 4]} /></BarChart></ResponsiveContainer></div><ChartTable rows={data.expenseByCategory.map((row) => [row.name, formatMoney(row.amount), `${row.count} transaksi`])} headings={["Kategori", "Jumlah", "Catatan"]} /></> : <EmptyState title="Belum ada pengeluaran"><p>Tambahkan pengeluaran untuk melihat kategori yang paling banyak digunakan.</p></EmptyState>}</article>
    </section>
    <section className="panel" style={{ marginTop: 16 }}><div className="panel-head"><div><h2>Transaksi terbaru</h2><p className="panel-subtitle">Lima catatan paling baru dari periode ini.</p></div><Link className="text-link" to="/app/transactions">Lihat semua</Link></div><div className="recent-list">{data.recentTransactions.map((transaction) => <TransactionPreview key={transaction.id} transaction={transaction} />)}</div></section>
  </>;
}

function Metric({ label, value, comparison, type }: { label: string; value: string; comparison: number | null; type: "income" | "expense" | "net" }) {
  const valueClass = type === "income" ? "income" : type === "expense" ? "expense" : value.startsWith("-") ? "expense" : "income";
  const increased = comparison !== null && comparison >= 0;
  const detail = comparison === null ? "Belum ada pembanding periode sebelumnya" : `${increased ? "Naik" : "Turun"} ${Math.abs(comparison).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari periode sebelumnya`;
  return <article className="metric"><span className="metric-label">{label}</span><strong className={valueClass}>{type === "net" ? formatSignedMoney(value) : formatMoney(value)}</strong><span className={`metric-meta ${comparison === null ? "" : increased ? "positive" : "negative"}`}>{comparison !== null && (increased ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />)}{detail}</span></article>;
}

function TransactionPreview({ transaction }: { transaction: NonNullable<ReturnType<typeof useDashboard>["data"]>["recentTransactions"][number] }) { const income = transaction.type === "INCOME"; return <article className="transaction-row"><div><span className="transaction-name">{transaction.description}</span><span className="transaction-meta">{transaction.categoryName} · {formatDate(transaction.transactionDate)}</span></div><strong className={`transaction-amount ${income ? "income" : "expense"}`}>{income ? "+" : "−"}{formatMoney(transaction.amount)}</strong></article>; }

function ChartTable({ headings, rows }: { headings: string[]; rows: string[][] }) { return <details><summary className="text-link" style={{ fontSize: ".82rem", marginTop: 12 }}>Tampilkan ringkasan tabel</summary><table style={{ width: "100%", marginTop: 10, fontSize: ".8rem", borderCollapse: "collapse" }}><thead><tr>{headings.map((head) => <th key={head} style={{ textAlign: "left", padding: "6px 4px" }}>{head}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: "6px 4px", borderTop: "1px solid #eee9e6" }}>{cell}</td>)}</tr>)}</tbody></table></details>; }
