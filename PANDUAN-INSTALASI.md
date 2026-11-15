# Panduan Instalasi — SIMAS Nurul Falah

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru**. Rename `Code.gs` jadi `Kode`, lalu tempel seluruh isi `Kode.gs`.
2. Pilih fungsi `setupAppEnvironment` → **Run** → izinkan akses. **Jalankan SEKALI saja.** Cek Execution Log: ada tanda ✅.
   Akun yang menjalankan otomatis menjadi **pengurus** pertama di sheet `Pengguna`.
3. Buat **Google OAuth Client ID**:
   - https://console.cloud.google.com → buat project → *APIs & Services* → *OAuth consent screen* (External, isi nama aplikasi) → *Credentials* → **Create Credentials → OAuth client ID → Web application**.
   - **Authorized JavaScript origins**: `https://USERNAME.github.io` (ganti USERNAME dengan username GitHub Anda).
   - Salin Client ID (berakhiran `.apps.googleusercontent.com`).
4. Di Apps Script: ⚙️ **Project Settings → Script Properties → Add property**: nama `GOOGLE_CLIENT_ID`, nilai = Client ID tadi.
5. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone** → Deploy → salin URL `/exec`.
6. Daftarkan petugas di sheet `Pengguna` (kolom: email, nama, peran, aktif). Peran: `pengurus`, `bendahara`, `petugas_jadwal`, `petugas_ibadah` (boleh lebih dari satu, pisahkan koma). Kolom `aktif` isi `ya`. Nama harus sama persis dengan nama yang dipakai di jadwal.

## B. Frontend (GitHub Pages)
1. Ekstrak ZIP. Folder hasil ekstraksi **`simas-nurul-falah`** adalah folder yang nanti di-`git init` (di dalamnya langsung terlihat `index.html`, `css/`, `js/`).
2. Edit `js/config.js`: isi `GAS_URL` (URL `/exec`) dan `GOOGLE_CLIENT_ID`.
3. Push ke GitHub lewat terminal, satu langkah demi langkah. Minta saya memandu di chat — kirim screenshot terminal tiap langkah.
4. Repo → Settings → Pages → Deploy from branch → `main` / `(root)` → centang Enforce HTTPS.

## C. Uji
- Buka situs: beranda, jadwal, dan kas tampil tanpa login.
- Masuk Staf dengan akun terdaftar → panel muncul sesuai peran. Akun tak terdaftar ditolak.
- Catat pengeluaran > Rp 1.000.000 → status *Menunggu*; setujui dengan akun pengurus **lain** (pencatat tidak bisa menyetujui transaksinya sendiri).
- Setiap perubahan kode backend: **Deploy → Manage deployments → Edit → New version**.

## D. Catatan keamanan
- Backend memverifikasi token Google di server dan memeriksa peran pada setiap aksi. Menyembunyikan tombol di tampilan bukan pengamanan.
- Sheet `Pengguna` adalah daftar akses: hanya pengurus tepercaya yang boleh mengedit spreadsheet. Jangan bagikan spreadsheet.
- Endpoint publik hanya memuat total kas, jadwal, dan pengumuman, tanpa nama donatur atau kontak.
- Token login disimpan di `sessionStorage` dan hilang saat tab ditutup.
