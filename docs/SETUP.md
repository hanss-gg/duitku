# 🚀 Panduan Setup Duitku

Ikuti langkah-langkah berikut secara berurutan.

---

## 1. Clone Repository

```bash
git clone https://github.com/username/duitku.git
cd duitku
```

---

## 2. Setup Google Cloud

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project baru → beri nama "Duitku"
3. Aktifkan **Google Sheets API** dan **Google Drive API**
4. Buka **Credentials** → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3005/auth/callback`
5. Download credentials → salin `Client ID` dan `Client Secret`

---

## 3. Buat Google Sheets

1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru
2. Beri nama spreadsheet: `Duitku Database`
3. Salin **Spreadsheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`
   *(Bot akan otomatis membuat sheet "Transaksi" dan headernya saat pertama kali dijalankan)*

---

## 4. Buat Telegram Bot

1. Buka Telegram → cari **@BotFather**
2. Kirim `/newbot`
3. Ikuti instruksi → salin **Bot Token**
4. Cek Chat ID kamu via **@userinfobot** → kirim pesan apa saja

---

## 5. Setup AI Parser (Pilih salah satu)

Duitku menggunakan **Hybrid Parser**:
1. **Regex (Bawaan)**: Otomatis aktif, GRATIS, dan sangat cepat untuk format `makan 20k`, `gaji 5jt`, dll.
2. **Gemini AI (Direkomendasikan)**: Untuk pesan bahasa alami yang lebih kompleks.
   - Buka [aistudio.google.com](https://aistudio.google.com/)
   - Buat API Key (Free Tier)
   - Salin ke `GEMINI_API_KEY` di `.env`

---

## 6. Setup Environment Variables

```bash
cp .env.example .env
```

Isi file `.env` dengan semua nilai yang sudah dikumpulkan.

Untuk `GOOGLE_TOKEN`, jalankan script berikut untuk mendapatkan token OAuth:

```bash
cd bot
npm install
node scripts/get-token.js
```

Ikuti instruksi di terminal (buka URL, login Google, izinkan akses), lalu salin JSON token yang muncul ke `GOOGLE_TOKEN` di `.env`.

---

## 7. Install & Jalankan Bot

```bash
cd bot
npm install
npm run dev:all
```

**Test**: kirim pesan ke bot Telegram kamu, contoh: `makan siang 25000` atau `kopi 18k`.

---

## 8. Install & Jalankan Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Buka: [http://localhost:3006](http://localhost:3006)

---

## 9. Deploy ke Production

### Dashboard → Vercel
1. Push repo ke GitHub (pastikan **private**)
2. Buka [vercel.com](https://vercel.com) → Import project
3. Set Root Directory: `dashboard`
4. Tambahkan environment variable: `VITE_API_URL`
5. Deploy!

### Bot & Backend → Railway / VPS
1. Gunakan Docker atau jalankan `node index.js` di server.
2. Pastikan port `3005` terbuka.
3. Update Google OAuth Redirect URI di Cloud Console ke URL production kamu.

---

## ✅ Checklist

- [x] Google Cloud project dibuat & API diaktifkan
- [x] Spreadsheet ID sudah disalin ke `.env`
- [x] Telegram Bot dibuat & token disalin
- [x] (Opsional) Gemini API key sudah dimasukkan
- [x] `GOOGLE_TOKEN` sudah digenerate & masuk ke `.env`
- [x] Bot bisa menerima pesan Telegram
- [x] Dashboard bisa dibuka di browser

---

## ❓ Troubleshooting

**Bot tidak merespons:**
- Cek `TELEGRAM_ALLOWED_CHAT_ID` sudah benar (angka saja).
- Pastikan bot token valid.

**Error Google Sheets (403/404):**
- Pastikan Google Sheets API sudah di-**ENABLE** di Google Cloud Console.
- Cek Spreadsheet ID benar.

**Parser Salah Baca Angka:**
- Gunakan format standar: `angka` (25000), `k/rb` (25k/25rb), atau `jt` (1.5jt).
- Hindari simbol mata uang seperti `Rp` di depan angka jika menggunakan Regex murni.
