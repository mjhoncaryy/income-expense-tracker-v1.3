import type { Transaction, TransactionFilters, TransactionType } from "@income-outcome/shared";
import { CalendarX2, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader, useAppShell } from "../../app/app-shell";
import { CategoryIcon } from "../../components/shared/category-icon";
import { EmptyState, ErrorState, LoadingState } from "../../components/shared/states";
import { ApiError } from "../../lib/api/client";
import { useCategories, useDeleteTransaction, useTransactions } from "../../lib/api/hooks";
import { formatDate, monthPeriod } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { TransactionSheet } from "./transaction-sheet";

const baseFilters: TransactionFilters = { ...monthPeriod(), page: 1, pageSize: 10 };

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(baseFilters);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const query = useTransactions(filters);
  const categories = useCategories(undefined, true);
  const { openTransactionSheet } = useAppShell();
  const hasFilters = Boolean(filters.type || filters.categoryId || filters.from !== baseFilters.from || filters.to !== baseFilters.to);
  const change = (next: Partial<TransactionFilters>) => setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  return <>
    <PageHeader title="Transaksi" description="Temukan, periksa, dan koreksi semua catatan Anda."><button className="button button-primary" onClick={openTransactionSheet}><Plus size={18} aria-hidden="true" />Tambah transaksi</button></PageHeader>
    <section className="filters" aria-label="Filter transaksi"><div className="field"><label htmlFor="from">Dari tanggal</label><input id="from" type="date" value={filters.from ?? ""} onChange={(event) => change({ from: event.target.value || undefined })} /></div><div className="field"><label htmlFor="to">Sampai tanggal</label><input id="to" type="date" value={filters.to ?? ""} onChange={(event) => change({ to: event.target.value || undefined })} /></div><div className="field"><label htmlFor="type">Jenis</label><select id="type" value={filters.type ?? ""} onChange={(event) => change({ type: (event.target.value || undefined) as TransactionType | undefined, categoryId: undefined })}><option value="">Semua jenis</option><option value="INCOME">Pemasukan</option><option value="EXPENSE">Pengeluaran</option></select></div><div className="field"><label htmlFor="category">Kategori</label><select id="category" value={filters.categoryId ?? ""} onChange={(event) => change({ categoryId: event.target.value || undefined })}><option value="">Semua kategori</option>{categories.data?.filter((category) => !filters.type || category.type === filters.type).map((category) => <option value={category.id} key={category.id}>{category.name}{category.isArchived ? " (diarsipkan)" : ""}</option>)}</select></div>{hasFilters && <button className="button button-ghost button-small" onClick={() => setFilters(baseFilters)}><CalendarX2 size={15} aria-hidden="true" />Hapus filter</button>}</section>
    {query.isLoading ? <div style={{ marginTop: 16 }}><LoadingState rows={8} /></div> : query.isError ? <div style={{ marginTop: 16 }}><ErrorState onRetry={() => query.refetch()} /></div> : query.data && (query.data.items.length ? <Ledger page={query.data} onEdit={setEditing} onDelete={setDeleting} onPage={(page) => change({ page })} /> : <section className="ledger"><EmptyState title={hasFilters ? "Tidak ada transaksi sesuai filter" : "Belum ada transaksi"}><p>{hasFilters ? "Coba hapus atau sesuaikan filter untuk melihat catatan lain." : "Catat pemasukan atau pengeluaran pertama Anda untuk mulai memahami arus kas."}</p>{hasFilters ? <button className="button button-secondary" onClick={() => setFilters(baseFilters)}>Hapus filter</button> : <button className="button button-primary" onClick={openTransactionSheet}>Tambah transaksi</button>}</EmptyState></section>)}
    {editing && <TransactionSheet transaction={editing} onClose={() => setEditing(null)} />}{deleting && <DeleteDialog transaction={deleting} onClose={() => setDeleting(null)} />}
  </>;
}

function Ledger({ page, onEdit, onDelete, onPage }: { page: NonNullable<ReturnType<typeof useTransactions>["data"]>; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void; onPage: (page: number) => void }) {
  return <section className="ledger" aria-label="Daftar transaksi"><div className="ledger-header"><span>Tanggal</span><span>Keterangan</span><span>Kategori</span><span style={{ textAlign: "right" }}>Jumlah</span><span /></div>{page.items.map((transaction) => <article className="ledger-line" key={transaction.id}><span className="muted">{formatDate(transaction.transactionDate)}</span><div><span className="transaction-name">{transaction.description}</span><span className="transaction-meta">{transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</span></div><span className="type-badge" title={transaction.categoryName}><CategoryIcon iconKey={transaction.categoryIconKey} />{transaction.categoryName}</span><strong className={`transaction-amount ${transaction.type === "INCOME" ? "income" : "expense"}`}>{transaction.type === "INCOME" ? "+" : "−"}{formatMoney(transaction.amount)}</strong><div className="actions"><button className="icon-button" aria-label={`Ubah ${transaction.description}`} onClick={() => onEdit(transaction)}><Pencil size={16} /></button><button className="icon-button" aria-label={`Hapus ${transaction.description}`} onClick={() => onDelete(transaction)}><Trash2 size={16} /></button></div></article>)}<footer className="pagination"><span>Menampilkan {(page.page - 1) * page.pageSize + 1}–{Math.min(page.page * page.pageSize, page.totalItems)} dari {page.totalItems} transaksi</span><span className="actions"><button className="icon-button" disabled={page.page === 1} onClick={() => onPage(page.page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft size={18} /></button><button className="icon-button" disabled={page.totalPages === 0 || page.page >= page.totalPages} onClick={() => onPage(page.page + 1)} aria-label="Halaman berikutnya"><ChevronRight size={18} /></button></span></footer></section>;
}

function DeleteDialog({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const deletion = useDeleteTransaction();
  const [error, setError] = useState<string | null>(null);
  async function remove() { try { await deletion.mutateAsync(transaction.id); onClose(); } catch (reason) { setError((reason as ApiError).message); } }
  return <><div className="dialog-backdrop" onMouseDown={onClose} aria-hidden="true" /><div className="dialog-wrap"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Hapus transaksi?</h2><p>Anda akan menghapus <strong>{transaction.description}</strong> sebesar <strong>{formatMoney(transaction.amount)}</strong>. Tindakan ini tidak dapat dibatalkan.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button button-secondary" onClick={onClose} disabled={deletion.isPending}>Batal</button><button className="button button-danger" onClick={remove} disabled={deletion.isPending}>{deletion.isPending ? "Menghapus…" : "Hapus transaksi"}</button></div></section></div></>;
}
