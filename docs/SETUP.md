# 🚀 Panduan Setup Lengkap — Duitku

Ikuti langkah-langkah di bawah ini untuk menjalankan **Duitku** secara lokal di komputer kamu.

---

## 📋 Persyaratan Sistem
- **Node.js** (v20 atau lebih baru)
- **Akun Google** (untuk Google Sheets & OAuth)
- **Bot Telegram** (gratis dari @BotFather)
- **Gemini API Key** (gratis dari Google AI Studio)

---

## 1. Clone & Persiapan Folder

```bash
git clone https://github.com/hanss-gg/duitku.git
cd duitku
```

---

## 2. Konfigurasi Google Cloud (PENTING)

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat Project baru (misal: "Duitku Personal Finance").
3. Aktifkan API:
   - Cari & Enable **Google Sheets API**.
   - Cari & Enable **Google Drive API**.
4. Buat **OAuth 2.0 Client ID**:
   - Menu: APIs & Services > Credentials > Create Credentials > OAuth client ID.
   - Application Type: **Web application**.
   - Authorized Redirect URIs:
     - `http://localhost:3001/auth/callback` (Backend API)
     - `http://localhost:9999/callback` (Setup Script)
5. Simpan **Client ID** dan **Client Secret** untuk file `.env`.

---

## 3. Persiapan Google Sheets

1. Buat Google Sheets baru di [sheets.new](https://sheets.new).
2. Salin **Spreadsheet ID** dari URL browser kamu:
   `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_DISINI]/edit`
3. Masukkan ID tersebut ke dalam file `.env`.
   *(Bot akan otomatis membuat tab "Transaksi" saat pertama kali dijalankan).*

---

## 4. Persiapan Telegram Bot

1. Chat [@BotFather](https://t.me/botfather) di Telegram.
2. Gunakan `/newbot` untuk membuat bot baru.
3. Salin **API Token** yang diberikan.
4. Dapatkan **Chat ID** kamu: Chat ke [@userinfobot](https://t.me/userinfobot) untuk mendapatkan ID numerik kamu. Bot Duitku hanya akan merespon pesan dari ID ini (keamanan).

---

## 5. Setup Environment Variables (`.env`)

Copy file contoh ke file asli:
```bash
cp .env.example .env
```

Buka file `.env` dan isi semua variabel yang diperlukan:
- `TELEGRAM_BOT_TOKEN`: Dari BotFather.
- `TELEGRAM_ALLOWED_CHAT_ID`: ID kamu dari userinfobot.
- `GOOGLE_CLIENT_ID`: Dari Google Cloud.
- `GOOGLE_CLIENT_SECRET`: Dari Google Cloud.
- `GOOGLE_SHEETS_ID`: ID Google Sheets yang kamu buat tadi.
- `GEMINI_API_KEY`: Dapatkan dari [Google AI Studio](https://aistudio.google.com/).
- `ALLOWED_EMAIL`: Email Google kamu (untuk whitelist login dashboard).

---

## 6. Mendapatkan Google Token

Jalankan script otomatis untuk memberikan akses bot ke Google Sheets kamu:

```bash
cd bot
npm install
node scripts/get-token.js
```

**Langkah:**
1. Klik link yang muncul di terminal.
2. Login dengan akun Google kamu.
3. Izinkan akses.
4. Terminal akan memunculkan string JSON panjang. **Salin string tersebut ke variabel `GOOGLE_TOKEN` di file `.env`**.

---

## 7. Menjalankan Aplikasi

Sekarang kamu bisa menjalankan Bot dan Dashboard secara bersamaan:

### Menjalankan Bot & Backend Server
```bash
cd bot
npm run dev:all
```
*Bot akan berjalan di port 3001.*

### Menjalankan Dashboard Web
```bash
# Buka terminal baru
cd dashboard
npm install
npm run dev
```
*Dashboard akan berjalan di port 3006.*

Buka: [http://localhost:3006](http://localhost:3006) di browser kamu.

---

## 🧪 Cara Testing

1. Buka Telegram dan cari bot kamu.
2. Kirim pesan: `makan siang 25000` atau `kopi 18k`.
3. Bot akan membalas dengan konfirmasi dan sisa saldo.
4. Buka Google Sheets kamu, transaksi baru akan muncul otomatis.
5. Cek Dashboard, grafik akan terupdate seketika.

---

## 🛠️ Troubleshooting

- **Error: 401 Unauthorized**: Pastikan `GOOGLE_TOKEN` di `.env` sudah terisi dengan benar (hasil dari `get-token.js`).
- **Bot tidak balas**: Cek terminal bot, pastikan `TELEGRAM_ALLOWED_CHAT_ID` sudah benar (biasanya berupa angka, misal: `123456789`).
- **Google Sheets tidak terbuat**: Pastikan Google Sheets API sudah di-**Enable** di Cloud Console.

---
*Butuh bantuan? Silakan buka Issue di repository ini.*
