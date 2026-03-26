# 💰 Duitku — Tracker Uang Jajan Mahasiswa

> Catat pengeluaran lewat Telegram, pantau keuangan lewat dashboard web "Glassmorphism" yang modern.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

---

## ✨ Fitur Utama

- 🤖 **Telegram Bot (Hybrid Parser)** — input transaksi dengan pesan natural. Menggunakan kombinasi Regex (cepat & gratis) + Gemini AI (pintar) untuk akurasi maksimal.
- 📸 **OCR Struk (Gemini Vision)** — cukup foto struk belanja, bot akan otomatis mencatat nominal, toko, dan kategorinya.
- 📊 **Dashboard "Glassmorphism 2.0"** — visualisasi keuangan dengan desain kaca transparan yang modern, mewah, dan responsif.
- 📈 **Trend & Bar Toggle** — pantau pengeluaran mingguan dengan grafik garis (smooth trend) atau grafik batang sesuai selera.
- ☁️ **Google Sheets Database** — data disimpan di spreadsheet pribadi kamu, gratis selamanya dan mudah diedit manual.
- 🔐 **Keamanan Maksimal** — login dashboard via Google OAuth & whitelist Chat ID untuk akses Bot.

---

## 🤖 Cara Pakai Bot Telegram

```
makan siang 25000        → catat pengeluaran Rp25.000 (Kategori: Makan)
kiriman ortu 800rb       → catat pemasukan Rp800.000 (Kategori: Kiriman)
kopi 18k                 → bot mengerti "18k" = Rp18.000

[Kirim Foto Struk]       → bot membaca total & toko secara otomatis
```

**Commands:**
- `/saldo` — cek saldo & ringkasan bulan ini
- `/laporan` — laporan kategori detail
- `/riwayat` — 10 transaksi terakhir
- `/hapus` — hapus transaksi terakhir jika salah input
- `/arsip` — pindahkan data bulan lalu ke sheet arsip agar tetap ringan

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
├── dashboard/          # Frontend React + Vite (Tailwind CSS)
│   └── src/
│       ├── components/ # Chart, Navbar, Items (Glassmorphism UI)
│       └── pages/      # Dashboard, Riwayat, Laporan, Input
├── bot/                # Telegram Bot (Telegraf.js)
│   ├── services/       # Parser (Regex+Gemini), Sheets API
│   └── handlers/       # Command & Message logic
├── shared/             # Keywords & Kategori (Sync antara Bot & Web)
└── docs/               # Panduan Setup
```

---

## 🚀 Cara Setup

Lihat panduan lengkap di [`docs/SETUP.md`](docs/SETUP.md)

---

## 🛠️ Tech Stack

| Bagian | Teknologi |
|---|---|
| Dashboard | React 18 + Vite |
| Styling | Tailwind CSS (Glassmorphism 2.0) |
| Grafik | Chart.js 4 |
| Bot | Node.js + Telegraf |
| AI / OCR | Gemini 1.5 Flash (Google AI SDK) |
| Database | Google Sheets API v4 |
| Auth | Google OAuth 2.0 |

---

## 📄 Lisensi

MIT — bebas dipakai & dimodifikasi untuk kebutuhan pribadi.
