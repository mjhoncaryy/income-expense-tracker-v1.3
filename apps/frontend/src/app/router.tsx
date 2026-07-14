import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "./app-shell";
import { LoadingState } from "../components/shared/states";
import { useSession } from "../lib/api/hooks";
import { LandingPage } from "../features/landing/landing-page";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "../features/auth/auth-pages";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { TransactionsPage } from "../features/transactions/transactions-page";
import { CategoriesPage } from "../features/categories/categories-page";
import { ReportsPage } from "../features/reports/reports-page";
import { SettingsPage } from "../features/settings/settings-page";
import { Link } from "react-router-dom";

function ProtectedRoute() {
  const session = useSession(); const location = useLocation();
  if (session.isLoading) return <main className="auth-layout"><div style={{ width: "min(100%, 430px)" }}><LoadingState rows={4} /></div></main>;
  if (!session.data) return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  return <Outlet />;
}

function LegalPage({ title }: { title: string }) { return <main className="auth-layout"><article className="auth-card"><h1>{title}</h1><p>Dokumen ini akan memuat informasi resmi sebelum peluncuran publik. Untuk saat ini, aplikasi hanya menggunakan data demo di peramban Anda.</p><Link className="button button-primary" to="/">Kembali ke beranda</Link></article></main>; }
function NotFound() { return <main className="auth-layout"><article className="auth-card"><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak tersedia atau telah dipindahkan.</p><Link className="button button-primary" to="/">Kembali ke beranda</Link></article></main>; }

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/privacy", element: <LegalPage title="Privasi" /> },
  { path: "/terms", element: <LegalPage title="Ketentuan penggunaan" /> },
  { element: <ProtectedRoute />, children: [{ path: "/app", element: <AppShell />, children: [{ index: true, element: <Navigate to="dashboard" replace /> }, { path: "dashboard", element: <DashboardPage /> }, { path: "transactions", element: <TransactionsPage /> }, { path: "categories", element: <CategoriesPage /> }, { path: "reports", element: <ReportsPage /> }, { path: "settings", element: <SettingsPage /> }] }] },
  { path: "*", element: <NotFound /> },
]);
