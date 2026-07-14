import { zodResolver } from "@hookform/resolvers/zod";
import type { HTMLInputTypeAttribute, ReactNode } from "react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../../components/shared/brand";
import { useSession } from "../../lib/api/hooks";
import { api, ApiError } from "../../lib/api/client";
import { queryClient } from "../../app/providers";

const loginSchema = z.object({ email: z.string().email("Masukkan alamat email yang valid."), password: z.string().min(8, "Kata sandi minimal 8 karakter.") });
const registerSchema = loginSchema.extend({ displayName: z.string().trim().min(2, "Masukkan nama yang ingin ditampilkan."), confirmation: z.string() }).refine((value) => value.password === value.confirmation, { path: ["confirmation"], message: "Konfirmasi kata sandi belum sama." });
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function safeReturnTo(value: unknown): string {
  return typeof value === "string" && value.startsWith("/app/") && !value.startsWith("//") ? value : "/app/dashboard";
}

function AuthLayout({ children }: { children: ReactNode }) { return <main className="auth-layout"><section className="auth-card">{children}</section></main>; }

export function LoginPage() {
  const session = useSession(); const navigate = useNavigate(); const location = useLocation();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  if (session.data) return <Navigate to="/app/dashboard" replace />;
  async function submit(values: LoginValues) { try { const profile = await api.login(values.email, values.password); queryClient.setQueryData(["session"], profile); queryClient.setQueryData(["profile"], profile); navigate(safeReturnTo((location.state as { returnTo?: string } | null)?.returnTo), { replace: true }); } catch (error) { form.setError("root", { message: (error as ApiError).message }); } }
  return <AuthLayout><Brand /><h1>Selamat datang kembali</h1><p>Masuk untuk melihat catatan arus kas Anda.</p><form className="form-stack" onSubmit={form.handleSubmit(submit)} noValidate><Field label="Email" id="email" type="email" registration={form.register("email")} error={form.formState.errors.email?.message} /><Field label="Kata sandi" id="password" type="password" registration={form.register("password")} error={form.formState.errors.password?.message} />{form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}<button className="button button-primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Memproses…" : "Masuk"}</button></form><p className="auth-footnote"><Link className="text-link" to="/forgot-password">Lupa kata sandi?</Link></p><p className="auth-footnote">Belum punya akun? <Link className="text-link" to="/register">Mulai mencatat</Link></p></AuthLayout>;
}

export function RegisterPage() {
  const session = useSession(); const navigate = useNavigate();
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { displayName: "", email: "", password: "", confirmation: "" } });
  if (session.data) return <Navigate to="/app/dashboard" replace />;
  async function submit(values: RegisterValues) { try { const profile = await api.register(values.displayName, values.email, values.password); queryClient.setQueryData(["session"], profile); queryClient.setQueryData(["profile"], profile); navigate("/app/dashboard", { replace: true }); } catch (error) { form.setError("root", { message: (error as ApiError).message }); } }
  return <AuthLayout><Brand /><h1>Mulai catat arus kas</h1><p>Hanya perlu beberapa detik untuk memulai. Pilihan awal Anda akan menggunakan Rupiah dan waktu Jakarta.</p><form className="form-stack" onSubmit={form.handleSubmit(submit)} noValidate><Field label="Nama tampilan" id="displayName" registration={form.register("displayName")} error={form.formState.errors.displayName?.message} /><Field label="Email" id="email" type="email" registration={form.register("email")} error={form.formState.errors.email?.message} /><Field label="Kata sandi" id="password" type="password" registration={form.register("password")} error={form.formState.errors.password?.message} /><Field label="Konfirmasi kata sandi" id="confirmation" type="password" registration={form.register("confirmation")} error={form.formState.errors.confirmation?.message} />{form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}<button className="button button-primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Menyiapkan akun…" : "Buat akun"}</button></form><p className="auth-footnote">Sudah punya akun? <Link className="text-link" to="/login">Masuk</Link></p></AuthLayout>;
}

export function ForgotPasswordPage() {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email("Masukkan alamat email yang valid.") })), defaultValues: { email: "" } });
  const [sent, setSent] = useState(false);
  async function submit() { await new Promise((resolve) => window.setTimeout(resolve, 180)); setSent(true); }
  return <AuthLayout><Brand /><h1>Atur ulang kata sandi</h1><p>Masukkan email Anda. Kami akan menampilkan langkah berikutnya tanpa mengungkap status akun.</p>{sent ? <><p className="form-error" role="status">Jika akun tersedia, instruksi pengaturan ulang telah dikirim.</p><p className="auth-footnote"><Link className="text-link" to="/reset-password">Lanjutkan ke halaman pengaturan ulang demo</Link></p></> : <form className="form-stack" onSubmit={form.handleSubmit(submit)}><Field label="Email" id="email" type="email" registration={form.register("email")} error={form.formState.errors.email?.message} /><button className="button button-primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Memproses…" : "Kirim instruksi"}</button></form>}<p className="auth-footnote"><Link className="text-link" to="/login">Kembali ke masuk</Link></p></AuthLayout>;
}

export function ResetPasswordPage() { return <AuthLayout><Brand /><h1>Buat kata sandi baru</h1><p>Pengaturan ulang kata sandi membutuhkan tautan yang valid. Versi demo ini belum mengirim email.</p><Link className="button button-primary" to="/login">Kembali ke masuk</Link></AuthLayout>; }

function Field({ label, id, type = "text", registration, error }: { label: string; id: string; type?: HTMLInputTypeAttribute; registration: UseFormRegisterReturn; error?: string }) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} type={type} autoComplete={type === "password" ? "current-password" : undefined} {...registration} aria-invalid={Boolean(error)} />{error && <p className="field-error">{error}</p>}</div>;
}
