# 💰 Duitku — Tracker Uang Jajan Mahasiswa

> Catat pengeluaran lewat Telegram, pantau keuangan lewat dashboard web.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

---

## ✨ Fitur

- 🤖 **Telegram Bot** — input transaksi cukup dengan ketik pesan natural
- 📊 **Dashboard Web** — visualisasi grafik & laporan bulanan
- ☁️ **Google Sheets** — database gratis, bisa diedit manual juga
- 🔐 **Aman** — hanya kamu yang bisa akses, auth via Google OAuth
- 📱 **PWA** — bisa diinstall di homescreen HP

---

## 🤖 Cara Pakai Bot Telegram

```
makan siang 25000        → catat pengeluaran Rp25.000
kiriman ortu 800000      → catat pemasukan Rp800.000
kopi 18rb                → bot otomatis mengerti "18rb" = Rp18.000

/saldo                   → cek saldo & ringkasan bulan ini
/laporan                 → laporan lengkap bulan ini
/riwayat                 → 10 transaksi terakhir
/hapus                   → hapus transaksi terakhir
/help                    → lihat semua perintah
```

---

## 🏗️ Arsitektur

```
Telegram Bot  ──────────────────────────────┐
                                            ↓
                                    Backend (Node.js)
                                            ↓
Web Dashboard (React) ──────────→  Google Sheets API
                                            ↑
                                    Google OAuth
```

---

## 📁 Struktur Folder

```
duitku/
├── dashboard/          # Frontend React (Vite)
│   └── src/
│       ├── components/ # Komponen UI
│       ├── pages/      # Halaman (Dashboard, Riwayat, Laporan)
│       ├── hooks/      # Custom hooks
│       └── utils/      # Helper functions
├── bot/                # Telegram Bot (Node.js)
│   ├── handlers/       # Handler pesan & command
│   ├── services/       # Google Sheets, Claude API
│   └── utils/          # Parser, formatter
├── shared/             # Konstanta & tipe data bersama
├── docs/               # Dokumentasi setup
└── .github/workflows/  # CI/CD GitHub Actions
```

---

## 🚀 Cara Setup

Lihat panduan lengkap di [`docs/SETUP.md`](docs/SETUP.md)

Ringkasan:
1. Clone repo ini
2. Setup Google Sheets & ambil credentials
3. Buat Telegram Bot via @BotFather
4. Isi file `.env` (lihat `.env.example`)
5. `npm install` dan `npm run dev`

---

## 🛠️ Tech Stack

| Bagian | Teknologi |
|---|---|
| Dashboard | React + Vite |
| Styling | Tailwind CSS |
| Grafik | Chart.js |
| Bot | Node.js + Telegraf |
| AI Parsing | Hybrid (Regex + Gemini 1.5 Flash) |
| Database | Google Sheets API |
| Auth | Google OAuth 2.0 |
| Hosting Dashboard | Vercel |
| Hosting Bot | Railway |

---

## 🔐 Keamanan

- Bot hanya merespons Telegram Chat ID milik kamu
- Dashboard hanya bisa diakses oleh email Google yang di-whitelist
- Semua API keys disimpan di environment variables, tidak di kode
- Koneksi HTTPS otomatis via Vercel

---

## 📄 Lisensi

MIT — bebas dipakai & dimodifikasi untuk kebutuhan pribadi.
