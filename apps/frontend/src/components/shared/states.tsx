import type { ReactNode } from "react";

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return <div aria-label="Memuat data" aria-busy="true" className="panel">
    {Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton" style={{ height: 28, marginBottom: 12, width: `${100 - index * 9}%` }} />)}
  </div>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <section className="empty-state"><h2>{title}</h2>{children}</section>;
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <section className="error-state" role="alert"><h2>Data belum dapat dimuat</h2><p>Periksa koneksi Anda, lalu coba lagi. Perubahan Anda tidak akan hilang.</p><button className="button button-secondary" onClick={onRetry}>Coba lagi</button></section>;
}
