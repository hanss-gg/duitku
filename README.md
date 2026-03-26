# 💰 Duitku — Personal Finance Tracker (Mahasiswa Edition)

> Catat pengeluaran lewat Telegram, pantau keuangan lewat dashboard web yang cantik. Optimized for student life.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

---

## ✨ Fitur Utama

- 🤖 **Hybrid Parser (Regex + Gemini)** — Input transaksi dengan bahasa alami (misal: "makan siang 25rb"). Bot cerdas membedakan pengeluaran vs pemasukan secara otomatis.
- 📊 **Beautiful Dashboard** — Visualisasi pengeluaran bulanan, kategori top, dan tren mingguan menggunakan Chart.js.
- ☁️ **Google Sheets Database** — Data kamu disimpan aman di Google Sheets milikmu sendiri. Gratis, reliabel, dan bisa diedit manual kapan saja.
- 🔐 **Secure Access** — Login dashboard menggunakan Google OAuth 2.0. Bot hanya merespons Chat ID Telegram kamu.
- 📱 **Mobile Friendly (PWA)** — Dashboard ringan dan responsif, nyaman dibuka dari HP maupun Laptop.

---

## 🤖 Cara Pakai Bot Telegram

Cukup ketik pesan seperti sedang chatting biasa:

```text
makan siang 25000        → Catat pengeluaran Rp25.000 (Kategori: Makan)
kiriman ortu 800rb       → Catat pemasukan Rp800.000 (Kategori: Kiriman)
beli kopi 18k            → Bot mengerti "18k" = Rp18.000
bayar kos 1.5jt          → Bot mengerti "1.5jt" = Rp1.500.000
```

**Commands Tambahan:**
- `/saldo` — Cek ringkasan saldo, pemasukan, & pengeluaran bulan ini.
- `/laporan` — Lihat top pengeluaran per kategori.
- `/riwayat` — Lihat 10 transaksi terakhir kamu.
- `/hapus` — Salah catat? Hapus transaksi terakhir dengan cepat.

---

## 🏗️ Arsitektur Sistem

```text
[ Telegram App ] <------> [ Node.js Backend ] <------> [ Google Sheets API ]
                                  ^                           |
                                  |                           v
                          [ React Dashboard ] <------- [ Data Storage ]
```

---

## 📁 Struktur Project

```text
duitku/
├── bot/                # Backend Node.js & Telegram Bot logic
│   ├── handlers/       # Command & Message handlers
│   ├── services/       # Google Sheets & Gemini AI integration
│   └── scripts/        # Setup & utility scripts
├── dashboard/          # Frontend React (Vite + Tailwind CSS)
│   ├── src/pages/      # Dashboard, Riwayat, Laporan views
│   └── src/components/ # Reusable UI components (Charts, etc)
├── shared/             # Shared constants (Categories, Config)
└── docs/               # Full setup documentation
```

---

## 🚀 Cara Setup Cepat

1. **Clone Repo**: `git clone https://github.com/hanss-gg/duitku.git`
2. **Setup Google Cloud**: Aktifkan Sheets API & buat OAuth Credentials.
3. **Bot Token**: Buat bot di [@BotFather](https://t.me/botfather).
4. **Environment**: Copy `.env.example` ke `.env` dan isi datanya.
5. **Install**: Jalankan `npm install` di folder `bot` dan `dashboard`.
6. **Run**:
   - Bot: `cd bot && npm run dev:all`
   - Dashboard: `cd dashboard && npm run dev`

> 📘 **Panduan Lengkap?** Baca [docs/SETUP.md](docs/SETUP.md) untuk instruksi step-by-step.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Chart.js, Vite.
- **Backend**: Node.js, Telegraf.js (Telegram Bot SDK).
- **Database**: Google Sheets API v4.
- **AI/NLP**: Google Gemini 1.5 Flash (Hybrid with local Regex).
- **Auth**: Google OAuth 2.0.

---

## 📄 Lisensi

Proyek ini berada di bawah lisensi **MIT**. Bebas digunakan dan dimodifikasi untuk keperluan pribadi maupun edukasi.

---
*Dibuat dengan ❤️ untuk membantu mahasiswa mengatur keuangan lebih baik.*
