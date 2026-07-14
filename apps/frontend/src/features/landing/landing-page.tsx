import { ArrowRight, CheckCircle2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../../components/shared/brand";
import { useSession } from "../../lib/api/hooks";

const bars = [[60, 36], [80, 42], [42, 58], [72, 40], [52, 67], [67, 39], [48, 31]];

export function LandingPage() {
  const session = useSession();
  const target = session.data ? "/app/dashboard" : "/register";
  return <div className="app"><div className="public-shell">
    <header className="topbar"><Brand /><div className="nav-actions"><Link className="button button-secondary" to="/login"><LogIn size={17} aria-hidden="true" />Masuk</Link><Link className="button button-primary" to={target}>Mulai mencatat</Link></div></header>
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><h1>Catat uang masuk dan keluar. Pahami bulan Anda.</h1><p>Arusku membantu Anda merekam pemasukan dan pengeluaran sehari-hari, lalu menampilkannya sebagai gambaran arus kas yang mudah dibaca.</p><div className="hero-actions"><Link className="button button-primary" to={target}>Mulai mencatat <ArrowRight size={17} aria-hidden="true" /></Link><Link className="button button-secondary" to="/login">Saya sudah punya akun</Link></div><p className="hero-note">Dibuat untuk catatan pribadi dalam Rupiah, tanpa istilah akuntansi yang rumit.</p></div>
        <ProductPreview />
      </section>
      <section className="section" aria-labelledby="cara-kerja"><div className="section-heading"><h2 id="cara-kerja">Tiga langkah yang tetap sederhana</h2><p>Mulai dari satu catatan. Detail dan rangkuman akan mengikuti kebiasaan Anda.</p></div><div className="steps"><article className="step"><strong>1. Catat saat uang bergerak</strong><p>Pilih jenis transaksi, jumlah, kategori, tanggal, dan keterangan singkat.</p></article><article className="step"><strong>2. Pahami posisi Anda</strong><p>Lihat total pemasukan, pengeluaran, dan selisihnya dalam satu periode.</p></article><article className="step"><strong>3. Tinjau saat diperlukan</strong><p>Temukan transaksi dan kategori yang ingin Anda periksa atau perbaiki.</p></article></div></section>
      <section className="section" aria-labelledby="untuk-siapa"><div className="section-heading"><h2 id="untuk-siapa">Fokus pada hal yang perlu Anda ketahui</h2><p>Arusku bukan perangkat akuntansi. Ini adalah buku catatan arus kas pribadi yang tenang, jelas, dan dapat digunakan setiap hari.</p></div><div className="steps"><article className="step"><CheckCircle2 size={20} aria-hidden="true" /><strong>Tanpa pengaturan yang panjang</strong><p>Kategori awal tersedia saat akun dibuat, dan Anda tetap dapat menambah milik sendiri.</p></article><article className="step"><CheckCircle2 size={20} aria-hidden="true" /><strong>Ringkasan yang konsisten</strong><p>Angka, grafik, dan transaksi terbaru mengikuti rentang tanggal yang sama.</p></article><article className="step"><CheckCircle2 size={20} aria-hidden="true" /><strong>Catatan tetap milik Anda</strong><p>Setiap transaksi bisa dicari, diubah, atau dihapus dengan konfirmasi yang jelas.</p></article></div></section>
      <section className="section"><div className="section-heading"><h2>Mulai dengan catatan pertama Anda</h2><p>Butuh waktu kurang dari beberapa menit untuk membuat akun dan mencatat transaksi pertama.</p><Link className="button button-primary" to={target}>Buka Arusku <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
    </main>
    <footer className="footer"><span>© 2026 Arusku</span><div className="footer-links"><Link to="/privacy">Privasi</Link><Link to="/terms">Ketentuan</Link><Link to="/login">Masuk</Link></div></footer>
  </div></div>;
}

function ProductPreview() { return <section className="preview" aria-label="Contoh tampilan ringkasan Arusku"><header className="preview-header"><span>Contoh data</span><span>Juli 2026</span></header><div className="preview-content"><div className="preview-kpis"><div className="preview-kpi"><span>Pemasukan</span><strong>14,7 jt Rp</strong></div><div className="preview-kpi"><span>Pengeluaran</span><strong>4,2 jt Rp</strong></div><div className="preview-kpi"><span>Selisih</span><strong>10,5 jt Rp</strong></div></div><div className="preview-chart" aria-hidden="true">{bars.map(([income, expense], index) => <div className="preview-bar" key={index}><span style={{ height: `${income}%` }} /><i style={{ height: `${expense}%` }} /></div>)}</div><div className="preview-transactions"><div className="preview-row"><span>Gaji bulan ini</span><strong>+12,5 jt Rp</strong></div><div className="preview-row"><span>Belanja mingguan</span><strong>−475 rb Rp</strong></div></div></div></section>; }
