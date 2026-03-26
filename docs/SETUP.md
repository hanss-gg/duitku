# 🚀 Panduan Setup Duitku

Ikuti langkah-langkah berikut secara berurutan.

---

## 1. Persiapan Akun

- **Google Cloud Console**: Buat project baru, aktifkan **Google Sheets API** dan **Google Drive API**.
- **Google OAuth**: Buat Credentials -> OAuth 2.0 Client ID (Web Application).
- **Spreadsheet**: Buat spreadsheet kosong baru, salin ID-nya dari URL.
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
   node scripts/get-token.js
   ```
4. Copy JSON token yang muncul ke variabel `GOOGLE_TOKEN` di file `.env`.

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
npm run dev
```

---

## 4. Tips Pemakaian

### Sinkronisasi Kategori
Semua kategori dan kata kunci (keywords) dikelola di `shared/constants.js`. Jika kamu mengubah kategori di file tersebut, Bot dan Dashboard akan otomatis terupdate.

### Fitur OCR (Struk)
Untuk hasil terbaik, pastikan foto struk terang dan teks terlihat jelas. Gemini 1.5 Flash akan mencoba menebak total belanja dan nama toko.

### Arsip Data
Gunakan command `/arsip` di Telegram setiap awal bulan untuk memindahkan data bulan lalu ke sheet baru (misal: `Arsip_2024_10`). Ini menjaga performa Dashboard tetap cepat.

---

## ✅ Troubleshooting

- **Error: GOOGLE_TOKEN invalid**: Pastikan kamu meng-copy seluruh JSON dari output script `get-token.js`.
- **Bot Tidak Respon**: Cek Chat ID di Telegram (pakai `@userinfobot`), masukkan ke `TELEGRAM_ALLOWED_CHAT_ID` di `.env`.
- **Modul Tidak Ditemukan**: Jika ada error path, pastikan kamu menjalankan perintah dari root folder atau folder yang benar sesuai panduan.
