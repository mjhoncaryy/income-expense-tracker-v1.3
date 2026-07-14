import type { FormEvent } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "../../components/shared/states";
import { queryClient } from "../../app/providers";
import { api, ApiError } from "../../lib/api/client";
import { useProfile } from "../../lib/api/hooks";

export function SettingsPage() {
  const profile = useProfile();
  if (profile.isLoading) return <><PageHeader title="Pengaturan" description="Profil dan preferensi akun Anda." /><LoadingState rows={5} /></>;
  if (profile.isError || !profile.data) return <><PageHeader title="Pengaturan" description="Profil dan preferensi akun Anda." /><ErrorState onRetry={() => profile.refetch()} /></>;
  return <><PageHeader title="Pengaturan" description="Profil dan preferensi akun Anda." /><ProfileSection profile={profile.data} /><PreferencesSection profile={profile.data} /><AccountSection /></>;
}

function ProfileSection({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["data"]> }) {
  const [name, setName] = useState(profile.displayName); const [status, setStatus] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function save(event: FormEvent) { event.preventDefault(); setPending(true); setStatus(null); try { const updated = await api.updateProfile(name); queryClient.setQueryData(["profile"], updated); queryClient.setQueryData(["session"], updated); setStatus("Nama tampilan diperbarui."); } catch (reason) { setStatus((reason as ApiError).message); } finally { setPending(false); } }
  return <section className="settings-section"><h2>Profil</h2><p>Nama ini digunakan untuk menyapa Anda di dalam aplikasi.</p><form className="form-stack" onSubmit={save}><div className="field"><label htmlFor="display-name">Nama tampilan</label><input id="display-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required /></div><div className="field"><label htmlFor="profile-email">Email</label><input id="profile-email" value={profile.email} readOnly /></div>{status && <p className="form-error" role="status">{status}</p>}<div><button className="button button-primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</button></div></form></section>;
}

function PreferencesSection({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["data"]> }) { return <section className="settings-section"><h2>Format bawaan</h2><p>Pengaturan ini dibuat saat akun Anda pertama kali disiapkan.</p><div className="settings-grid"><div className="setting-item"><span className="metric-label">Bahasa</span><strong>{profile.locale}</strong></div><div className="setting-item"><span className="metric-label">Mata uang</span><strong>{profile.currencyCode}</strong></div><div className="setting-item"><span className="metric-label">Zona waktu</span><strong>{profile.timezone}</strong></div></div></section>; }

function AccountSection() {
  const navigate = useNavigate(); const [confirming, setConfirming] = useState(false); const [confirmation, setConfirmation] = useState(""); const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function logout() { await api.logout(); queryClient.clear(); navigate("/login", { replace: true }); }
  async function deleteAccount() { setPending(true); try { await api.deleteAccount(); queryClient.clear(); navigate("/", { replace: true }); } catch (reason) { setError((reason as ApiError).message); } finally { setPending(false); } }
  return <section className="settings-section"><h2>Akun</h2><p>Keluar akan mengakhiri sesi demo ini. Penghapusan akun menghapus seluruh data contoh yang terkait dengan akun Anda.</p><div className="form-actions" style={{ justifyContent: "flex-start" }}><button className="button button-secondary" onClick={logout}><LogOut size={17} aria-hidden="true" />Keluar</button><button className="button button-danger" onClick={() => setConfirming(true)}><Trash2 size={17} aria-hidden="true" />Hapus akun</button></div>{confirming && <><div className="dialog-backdrop" aria-hidden="true" /><div className="dialog-wrap"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><h2 id="delete-account-title">Hapus akun secara permanen?</h2><p>Ketik <strong>HAPUS</strong> untuk mengonfirmasi. Semua transaksi, kategori, dan profil demo akan dihapus.</p><div className="field"><label htmlFor="account-confirmation">Konfirmasi</label><input id="account-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button button-secondary" onClick={() => setConfirming(false)} disabled={pending}>Batal</button><button className="button button-danger" disabled={confirmation !== "HAPUS" || pending} onClick={deleteAccount}>{pending ? "Menghapus…" : "Hapus permanen"}</button></div></section></div></>}</section>;
}
