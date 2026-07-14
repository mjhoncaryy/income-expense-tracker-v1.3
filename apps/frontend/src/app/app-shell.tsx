import type { PropsWithChildren } from "react";
import { ChartNoAxesCombined, FileDown, LayoutDashboard, List, Plus, Settings, Tags } from "lucide-react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { Brand } from "../components/shared/brand";
import { TransactionSheet } from "../features/transactions/transaction-sheet";
import { useState } from "react";

const navItems = [
  { to: "/app/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/app/transactions", label: "Transaksi", icon: List },
  { to: "/app/categories", label: "Kategori", icon: Tags },
  { to: "/app/reports", label: "Laporan", icon: FileDown },
  { to: "/app/settings", label: "Pengaturan", icon: Settings },
];

type ShellContext = { openTransactionSheet: () => void };
export function useAppShell() { return useOutletContext<ShellContext>(); }

function Navigation({ compact = false }: { compact?: boolean }) {
  return <nav aria-label={compact ? "Navigasi utama mobile" : "Navigasi utama"}>{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => compact ? (isActive ? "active" : "") : `nav-link${isActive ? " active" : ""}`}><Icon size={compact ? 19 : 18} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>;
}

export function AppShell() {
  const [sheetOpen, setSheetOpen] = useState(false);
  return <div className="app-layout">
    <aside className="sidebar"><Brand /><Navigation /><p className="sidebar-footer">Catat seperlunya. Lihat arus kas dengan jelas.</p></aside>
    <main className="main"><Outlet context={{ openTransactionSheet: () => setSheetOpen(true) }} /></main>
    <nav className="mobile-nav"><Navigation compact /></nav>
    <button className="button button-primary floating-add" onClick={() => setSheetOpen(true)}><Plus size={18} aria-hidden="true" />Tambah transaksi</button>
    {sheetOpen && <TransactionSheet onClose={() => setSheetOpen(false)} />}
  </div>;
}

export function PageHeader({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  return <header className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{children}</header>;
}

export function ProductPreviewMark() { return <ChartNoAxesCombined size={16} aria-hidden="true" />; }
