# 🚀 Panduan Setup Duitku

Ikuti langkah-langkah berikut secara berurutan untuk menjalankan sistem tracker keuangan pribadi kamu.

---

## 1. Persiapan Akun

- **Google Cloud Console**: 
  - Buat project baru.
  - Aktifkan **Google Sheets API**, **Google Drive API**, dan **Google OAuth2 API**.
- **Google OAuth**: 
  - Buat Credentials -> OAuth 2.0 Client ID (Web Application).
  - Tambahkan Authorized Redirect URIs:
    - `http://localhost:3001/auth/callback` (Untuk Login Dashboard)
    - `http://localhost:9999/callback` (Untuk `npm run setup:token`)
    - Sertakan juga redirect URI production kamu jika ada.
- **Spreadsheet**: 
  - Buat spreadsheet kosong baru.
  - Salin ID-nya dari URL (string panjang antara `/d/` dan `/edit`).
- **Telegram @BotFather**: Buat bot baru, salin Token-nya.
- **Google AI Studio**: Buat API Key untuk **Gemini 1.5 Flash**.

---

## 2. Setup Environment

1. Duplikasi file `.env.example` menjadi `.env`.
2. Masukkan semua kredensial yang didapat di atas.
3. Jalankan script setup token:
   ```bash
   cd bot
   npm install
   npm run setup:token
   ```
4. Copy JSON token yang muncul ke variabel `GOOGLE_TOKEN` di file `.env`. 
   *Catatan: Pastikan token mengandung `refresh_token` agar bot tidak mati setelah 1 jam.*

---

## 3. Jalankan Aplikasi

Gunakan perintah berikut (membutuhkan `concurrently` yang sudah ada di package.json bot):

```bash
cd bot
npm run dev:all
```

Ini akan menjalankan Bot sekaligus Backend Server.

Untuk Dashboard (di terminal baru):
```bash
cd dashboard
npm install
# Buat file .env dengan: VITE_API_URL=http://localhost:3001
npm run dev
```
Dashboard akan berjalan di `http://localhost:3006`.

---

## 4. Fitur Baru & Diagnostik

### Cek Kesehatan Sistem
Jika bot tidak merespon atau gagal menyimpan data, jalankan script diagnostik:
```bash
node bot/scripts/check-env.js
```
Script ini akan memeriksa apakah semua variable `.env` sudah benar dan apakah token Google kamu valid (termasuk cek `refresh_token`).

### Command Bot Terbaru
- `/check` — Gunakan ini langsung di Telegram untuk melihat status koneksi Bot ke Google Sheets dan Gemini AI secara real-time.
- `/arsip` — Gunakan setiap awal bulan untuk memindahkan data bulan lalu ke sheet arsip agar dashboard tetap ringan.

### Keamanan Whitelist
Bot ini menggunakan whitelist Chat ID. Jika akses kamu ditolak, bot akan memberikan nomor Chat ID kamu. Masukkan nomor tersebut ke `TELEGRAM_ALLOWED_CHAT_ID` di file `.env`.

---

## ✅ Troubleshooting Umum

- **Error: "No refresh token is set"**: 
  Ini terjadi jika kamu re-auth tanpa menghapus akses aplikasi sebelumnya.
  1. Pergi ke [Google Account Connections](https://myaccount.google.com/connections).
  2. Hapus/Disconnect aplikasi "Duitku".
  3. Jalankan ulang `npm run setup:token` di bot.
- **Bot Error: "SyntaxError"**: 
  Pastikan kamu menggunakan Node.js versi terbaru (>= 20.0.0) karena project ini menggunakan ES Modules.
- **Dashboard Tidak Update**: 
  Pastikan `GOOGLE_SHEETS_ID` di `.env` sudah benar. Dashboard membaca data langsung dari sheet melalui backend server.

---

## 🛠️ Pemeliharaan Data
Data disimpan di Google Sheets dalam sheet bernama **"Transaksi"**. Jangan mengubah nama kolom atau urutan kolom (ID, Tanggal, Tipe, Nominal, Kategori, Catatan, Sumber) agar sistem tidak error. Kamu bisa mengedit nominal atau catatan secara manual langsung di spreadsheet jika ada kesalahan input.
