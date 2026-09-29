# Sistem Manajemen Proyek - CV. Lintas Batas Agro (Lampung)
> *"Growing Beyond Limits"*

Aplikasi web modern berbasis **React 19 + TypeScript + Express + Google Firebase Firestore** untuk manajemen operasional terintegrasi pengadaan benih, bibit tanaman perkebunan dan kehutanan CV. Lintas Batas Agro, Lampung.

---

## 🚀 Fitur Utama

1. **Dashboard & Statistik Eksekutif:**
   - Ringkasan total produksi bibit, kemitraan petani, project aktif, dan masa berlaku legalitas.
   - Peta interaktif sebaran nursery & mitra petani di Lampung (Tanggamus, Lampung Barat, Pesawaran, Lampung Selatan, Lampung Timur).
   - Filter cepat berdasarkan komoditas (Kakao, Durian, Petai, Pala, dll.) dan status sertifikasi benih.

2. **Manajemen Produksi Bibit:**
   - Pencatatan stok, luas lahan pembesaran, varietas, asal usul, produsen/penangkar, dan status tahapan (Semai, Pembesaran, Siap Salur).
   - Ekspor data tabel ke format Excel / CSV dengan satu klik.

3. **Kemitraan Petani Mitra:**
   - Database petani binaan budidaya bibit lengkap dengan nomor WhatsApp, alamat desa, komoditas, dan luas lahan.
   - Tombol cepat hubungi via WhatsApp langsung dari aplikasi.

4. **Monitoring Proyek & Pengadaan:**
   - Pelacakan kontrak pengadaan bibit instansi dinas & swasta, progress pengiriman, tanggal batas kontrak, dan nilai proyek.

5. **Legalitas & Sertifikasi Benih:**
   - Pemantauan masa berlaku dokumen NIB, Sertifikat Kelayakan, Sertifikat Mutu Benih Tanaman.
   - Indikator peringatan otomatis untuk dokumen yang mendekati kedaluwarsa.

6. **Generator & Cetak Dokumen Resmi Otomatis (PDF):**
   - **Surat Penawaran**, **Invoice Tagihan**, dan **Berita Acara Serah Terima (BAST)**.
   - Penomoran surat resmi otomatis berurutan dengan format romawi bulan dan tahun.
   - Perhitungan total biaya dan fungsi **terbilang rupiah** otomatis.
   - Kop surat resmi berlogo resolusi tinggi CV. Lintas Batas Agro.

7. **Akses Database & Cadangan:**
   - **Google Cloud Firebase (Firestore)**: Penyimpanan cloud real-time permanen.
   - Backup database utuh (`.json`) dan ekspor tabel ke Excel/CSV.
   - Database Explorer interaktif untuk inspeksi data.

8. **Manajemen Pengguna (Multi-Role RBAC):**
   - 4 Tingkat Hak Akses: **Admin**, **Direktur**, **Deputy Director**, dan **Konsultan**.
   - Audit aktivitas log pengguna.
   - Mode Perawatan (*Maintenance Mode*).

---

## 🛠️ Stack Teknologi

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Express.js (Node.js full-stack)
- **Database:** Google Cloud Firebase (Firestore) + Persistent Server Storage
- **Build Tool:** Vite 6 / TSX

---

## 💻 Cara Menjalankan di Komputer Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru.
- Git terinstall di komputer.

### 2. Langkah Instalasi
```bash
# 1. Clone repositori dari GitHub
git clone https://github.com/USERNAME_ANDA/sistem-manajemen-lba.git

# 2. Masuk ke direktori proyek
cd sistem-manajemen-lba

# 3. Install seluruh dependensi
npm install

# 4. Jalankan server pengembangan
npm run dev
```

Buka browser Anda di `http://localhost:3000`.

---

## 🔑 Akun Login Bawaan

| Peran | Username | Kata Sandi Bawaan | Hak Akses |
|---|---|---|---|
| **Admin** | `admin1` | `admin1` | Akses Penuh, Kelola Pengguna, Database, Dokumen |
| **Direktur** | `direktur1` | `direktur1` | Monitoring, Laporan, Approval Dokumen |
| **Deputy Director** | `deputy1` | `deputy1` | Operasional, Produksi, Mitra, Monitoring |
| **Konsultan** | `konsultan1` | `konsultan1` | Input Lapangan, Data Mitra & Bibit |

*Catatan: Anda dapat mengubah kata sandi atau menambah pengguna baru di menu **Admin > Kelola User**.*

---

## 🌐 Cara Publish & Deploy dari GitHub

Anda dapat men-deploy aplikasi ini secara gratis atau berbayar ke berbagai layanan cloud:

### Opsi A: Railway / Render (Rekomendasi Full-Stack)
1. Hubungkan akun GitHub Anda ke [Railway](https://railway.app) atau [Render](https://render.com).
2. Pilih repositori GitHub proyek ini.
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Aplikasi akan langsung online dengan custom domain gratis!

### Opsi B: Virtual Private Server (VPS / Cloud Ubuntu)
```bash
git clone https://github.com/USERNAME_ANDA/sistem-manajemen-lba.git
cd sistem-manajemen-lba
npm install
npm run build
pm2 start server.ts --name "lba-app"
```

---

## 📄 Lisensi
Hak Cipta © 2026 CV. Lintas Batas Agro, Lampung. Seluruh hak cipta dilindungi undang-undang.
