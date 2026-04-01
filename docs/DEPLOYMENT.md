# 🚢 Panduan Deployment Duitku

Ikuti panduan ini untuk meng-online-kan Duitku agar bisa diakses dari mana saja (Vercel + Railway).

---

## 1. Backend (Bot & Server) — Railway

Railway akan menjalankan Bot Telegram sekaligus API Server untuk dashboard.

1. **Buat Project Baru** di [Railway](https://railway.app/).
2. **Hubungkan GitHub** dan pilih repository `duitku`.
3. **Root Directory**: Biarkan kosong (root project) atau isi `/`. (Ini penting agar bot bisa mengakses folder `shared/`).
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `TELEGRAM_BOT_TOKEN`: (Token dari @BotFather)
   - `TELEGRAM_ALLOWED_CHAT_ID`: (ID kamu)
   - `GOOGLE_CLIENT_ID`: (Dari Google Console)
   - `GOOGLE_CLIENT_SECRET`: (Dari Google Console)
   - `GOOGLE_SHEETS_ID`: (ID Spreadsheet)
   - `GOOGLE_TOKEN`: (JSON token hasil `npm run setup:token`)
   - `GEMINI_API_KEY`: (Dari Google AI Studio)
   - `WEBHOOK_URL`: (URL Railway kamu, contoh: `https://duitku-production.up.railway.app`)
   - `ALLOWED_EMAIL`: (Email Google kamu untuk login dashboard)
   - `SESSION_SECRET`: (Gunakan string acak panjang, misal: `openssl rand -hex 32`)
   - `DASHBOARD_URL`: (URL dari Vercel nanti, contoh: `https://duitku-anda.vercel.app`)
   - `GOOGLE_REDIRECT_URI`: (URL Railway kamu + `/auth/callback`, contoh: `https://duitku-production.up.railway.app/auth/callback`)
5. **Cek Deployment**: Pastikan log menunjukkan "Bot & Server aktif".

---

## 2. Frontend (Dashboard) — Vercel

Vercel akan meng-host interface web "Glassmorphism" kamu.

1. **Buat Project Baru** di [Vercel](https://vercel.com/).
2. **Hubungkan GitHub** dan pilih repository `duitku`.
3. **Konfigurasi Project**:
   - **Root Directory**: `dashboard`
   - **Framework Preset**: `Vite`
4. **Environment Variables**:
   - `VITE_API_URL`: (URL Railway kamu, tanpa slash di akhir, contoh: `https://duitku-production.up.railway.app`)
5. **Deploy**: Klik deploy dan tunggu sampai selesai. Salin URL yang diberikan Vercel.

---

## 3. Update Google Cloud Console (WAJIB)

Agar login Google dan Google Sheets berjalan di production, kamu harus menambahkan URL baru ke whitelist:

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Pilih project Duitku -> **APIs & Services** -> **Credentials**.
3. Edit **OAuth 2.0 Client ID** kamu.
4. Di bagian **Authorized JavaScript origins**, tambahkan:
   - URL Vercel kamu (misal: `https://duitku-anda.vercel.app`)
5. Di bagian **Authorized redirect URIs**, tambahkan:
   - URL Railway kamu + `/auth/callback` (misal: `https://duitku-production.up.railway.app/auth/callback`)
6. **Simpan**. Tunggu 5-10 menit agar perubahan diterapkan oleh Google.

---

## 📱 Tips Mobile (Phone)

- **Responsive**: Dashboard sudah didesain dengan "Mobile-First" menggunakan layout Bento Grid.
- **PWA Ready**: Kamu bisa "Add to Home Screen" dari browser HP kamu agar muncul seperti aplikasi native.
- **Safe Area**: Navbar di bawah sudah mendukung *Safe Area Inset* (untuk iPhone/HP layar penuh).

---

## 🔐 Keamanan Production

- Jangan pernah share file `.env` kamu.
- Pastikan `SESSION_SECRET` di Railway sulit ditebak.
- `ALLOWED_EMAIL` memastikan hanya kamu yang bisa login ke dashboard meskipun orang lain tahu URL-nya.
