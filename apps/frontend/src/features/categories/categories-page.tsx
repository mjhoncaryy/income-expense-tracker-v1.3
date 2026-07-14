import type { FormEvent } from "react";
import type { Category, TransactionType } from "@income-outcome/shared";
import { Archive, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../app/app-shell";
import { CategoryIcon } from "../../components/shared/category-icon";
import { EmptyState, ErrorState, LoadingState } from "../../components/shared/states";
import { ApiError } from "../../lib/api/client";
import { useArchiveCategory, useCategories, useCreateCategory, useRenameCategory } from "../../lib/api/hooks";

export function CategoriesPage() {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<{ mode: "create" | "rename"; category?: Category } | null>(null);
  const query = useCategories(type, showArchived);
  return <><PageHeader title="Kategori" description="Atur kategori agar catatan Anda tetap mudah dibaca."><button className="button button-primary" onClick={() => setDialog({ mode: "create" })}><Plus size={18} aria-hidden="true" />Kategori baru</button></PageHeader><div className="tabs" role="tablist" aria-label="Jenis kategori"><button className={`tab ${type === "EXPENSE" ? "active" : ""}`} role="tab" aria-selected={type === "EXPENSE"} onClick={() => setType("EXPENSE")}>Pengeluaran</button><button className={`tab ${type === "INCOME" ? "active" : ""}`} role="tab" aria-selected={type === "INCOME"} onClick={() => setType("INCOME")}>Pemasukan</button><button className="button button-ghost button-small" style={{ marginLeft: "auto" }} onClick={() => setShowArchived((value) => !value)}>{showArchived ? "Sembunyikan arsip" : "Lihat arsip"}</button></div>{query.isLoading ? <div style={{ marginTop: 16 }}><LoadingState rows={7} /></div> : query.isError ? <div style={{ marginTop: 16 }}><ErrorState onRetry={() => query.refetch()} /></div> : query.data?.length ? <section className="category-list" aria-label={`Kategori ${type === "INCOME" ? "pemasukan" : "pengeluaran"}`}>{query.data.map((category) => <CategoryLine category={category} onRename={() => setDialog({ mode: "rename", category })} />)}</section> : <section className="category-list"><EmptyState title="Belum ada kategori"><p>Tambahkan kategori untuk transaksi {type === "INCOME" ? "pemasukan" : "pengeluaran"} Anda.</p></EmptyState></section>}{dialog && <CategoryDialog type={type} category={dialog.category} onClose={() => setDialog(null)} />}</>;
}

function CategoryLine({ category, onRename }: { category: Category; onRename: () => void }) {
  const archive = useArchiveCategory(); const [error, setError] = useState<string | null>(null);
  async function archiveCategory() { try { await archive.mutateAsync(category.id); } catch (reason) { setError((reason as ApiError).message); } }
  return <article className="category-line"><div className="category-name"><CategoryIcon iconKey={category.iconKey} /><span>{category.name}</span>{category.isDefault && <span className="muted">Bawaan</span>}{category.isArchived && <span className="muted">Diarsipkan</span>}</div><div className="category-side"><button className="icon-button" aria-label={`Ubah kategori ${category.name}`} onClick={onRename}><Pencil size={16} /></button>{!category.isArchived && <button className="icon-button" aria-label={`Arsipkan kategori ${category.name}`} onClick={archiveCategory} disabled={archive.isPending}><Archive size={16} /></button>}{error && <span className="field-error" role="alert">{error}</span>}</div></article>;
}

function CategoryDialog({ type, category, onClose }: { type: TransactionType; category?: Category; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? ""); const [error, setError] = useState<string | null>(null); const create = useCreateCategory(); const rename = useRenameCategory(); const pending = create.isPending || rename.isPending;
  async function submit(event: FormEvent) { event.preventDefault(); try { if (category) await rename.mutateAsync({ id: category.id, name }); else await create.mutateAsync({ type, name }); onClose(); } catch (reason) { setError((reason as ApiError).message); } }
  return <><div className="dialog-backdrop" onMouseDown={onClose} aria-hidden="true" /><div className="dialog-wrap"><form className="dialog" onSubmit={submit} aria-labelledby="category-dialog-title"><div className="sheet-header"><h2 id="category-dialog-title">{category ? "Ubah kategori" : "Kategori baru"}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X size={18} /></button></div><p>{category ? "Gunakan nama yang mudah dikenali saat memilih transaksi." : `Kategori ini akan dipakai untuk ${type === "INCOME" ? "pemasukan" : "pengeluaran"}.`}</p><div className="field"><label htmlFor="category-name">Nama kategori</label><input id="category-name" autoFocus value={name} maxLength={60} onChange={(event) => setName(event.target.value)} required />{error && <p className="field-error" role="alert">{error}</p>}</div><div className="form-actions"><button type="button" className="button button-secondary" onClick={onClose}>Batal</button><button className="button button-primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</button></div></form></div></>;
}
