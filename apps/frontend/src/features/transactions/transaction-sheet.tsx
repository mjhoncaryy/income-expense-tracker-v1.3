import { zodResolver } from "@hookform/resolvers/zod";
import type { Transaction, TransactionInput, TransactionType } from "@income-outcome/shared";
import { transactionInputSchema } from "@income-outcome/shared";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../lib/api/client";
import { useCategories, useCreateTransaction, useUpdateTransaction } from "../../lib/api/hooks";
import { oneYearFromTodayInJakarta, todayInJakarta } from "../../lib/dates";

const initialValues: TransactionInput = { type: "EXPENSE", amount: "", categoryId: "", transactionDate: todayInJakarta(), description: "" };

export function TransactionSheet({ transaction, onClose }: { transaction?: Transaction | null; onClose: () => void }) {
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: transaction ? {
      type: transaction.type,
      amount: transaction.amount.replace(/\.00$/, ""),
      categoryId: transaction.categoryId,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
    } : initialValues,
  });
  const type = form.watch("type");
  const categories = useCategories(type);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const pending = createTransaction.isPending || updateTransaction.isPending;

  useEffect(() => {
    const categoryId = form.getValues("categoryId");
    if (categoryId && !categories.data?.some((category) => category.id === categoryId)) form.setValue("categoryId", "");
  }, [type, categories.data, form]);

  async function submit(input: TransactionInput) {
    try {
      if (transaction) await updateTransaction.mutateAsync({ id: transaction.id, input });
      else await createTransaction.mutateAsync(input);
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      Object.entries(apiError.fields ?? {}).forEach(([field, messages]) => form.setError(field as keyof TransactionInput, { message: messages[0] }));
      if (!apiError.fields) form.setError("root", { message: apiError.message });
    }
  }

  return <>
    <div className="sheet-backdrop" onMouseDown={onClose} aria-hidden="true" />
    <div className="dialog-wrap"><section className="dialog transaction-dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-sheet-title">
      <header className="sheet-header">
        <div><h2 id="transaction-sheet-title">{transaction ? "Ubah transaksi" : "Tambah transaksi"}</h2><p>Catatan singkat sekarang membantu Anda memahami bulan ini.</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Tutup formulir"><X size={19} /></button>
      </header>
      <form className="sheet-form" onSubmit={form.handleSubmit(submit)} noValidate>
        <div className="field"><label>Jenis transaksi</label><div className="type-switch" aria-label="Jenis transaksi">
          {(["EXPENSE", "INCOME"] as TransactionType[]).map((value) => <button key={value} type="button" className={type === value ? "active" : ""} onClick={() => form.setValue("type", value, { shouldValidate: true })}>{value === "INCOME" ? "Pemasukan" : "Pengeluaran"}</button>)}
        </div></div>
        <div className="field"><label htmlFor="amount">Jumlah (Rp)</label><input id="amount" inputMode="numeric" autoComplete="off" placeholder="Contoh: 125000" {...form.register("amount")} aria-invalid={Boolean(form.formState.errors.amount)} />{form.formState.errors.amount && <p className="field-error">{form.formState.errors.amount.message}</p>}</div>
        <div className="field"><label htmlFor="category">Kategori</label><select id="category" {...form.register("categoryId")} aria-invalid={Boolean(form.formState.errors.categoryId)}><option value="">Pilih kategori</option>{categories.data?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>{form.formState.errors.categoryId && <p className="field-error">{form.formState.errors.categoryId.message}</p>}</div>
        <div className="field"><label htmlFor="date">Tanggal transaksi</label><input id="date" type="date" max={oneYearFromTodayInJakarta()} {...form.register("transactionDate")} aria-invalid={Boolean(form.formState.errors.transactionDate)} />{form.formState.errors.transactionDate && <p className="field-error">{form.formState.errors.transactionDate.message}</p>}</div>
        <div className="field"><label htmlFor="description">Keterangan</label><input id="description" maxLength={120} placeholder="Contoh: Belanja kebutuhan rumah" {...form.register("description")} aria-invalid={Boolean(form.formState.errors.description)} />{form.formState.errors.description && <p className="field-error">{form.formState.errors.description.message}</p>}</div>
        {form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}
        <div className="form-actions"><button type="button" className="button button-secondary" onClick={onClose} disabled={pending}>Batal</button><button className="button button-primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan transaksi"}</button></div>
      </form>
    </section></div>
  </>;
}
