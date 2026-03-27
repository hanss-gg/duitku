// bot/scripts/check-env.js
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

console.log("\n🔍 --- DIAGNOSTIK ENV DUITKU ---\n");

const vars = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ALLOWED_CHAT_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_SHEETS_ID",
  "GEMINI_API_KEY",
  "GOOGLE_TOKEN",
  "ALLOWED_EMAIL",
  "SESSION_SECRET"
];

let allOk = true;

vars.forEach(v => {
  const val = process.env[v];
  if (!val || val.includes("PASTE_HERE") || val.includes("your_")) {
    console.log(`❌ ${v}: BELUM DIISI`);
    allOk = false;
  } else {
    if (v === "GOOGLE_TOKEN") {
      try {
        let token;
        try {
          token = JSON.parse(val);
        } catch (e) {
          const unescaped = val.replace(/\\"/g, '"').replace(/^"|"$/g, "");
          token = JSON.parse(unescaped);
        }
        
        console.log(`✅ GOOGLE_TOKEN: Terdeteksi`);
        if (!token.refresh_token) {
          console.log(`⚠️  WARNING: Token tidak punya REFRESH_TOKEN. Bot akan mati setelah 1 jam.`);
          console.log(`💡 SOLUSI: Hapus aplikasi 'Duitku' dari Google Security (Third-party apps), lalu jalankan 'npm run setup:token' lagi.`);
        } else {
          console.log(`✅ GOOGLE_TOKEN: Memiliki Refresh Token (Aman)`);
        }
      } catch (e) {
        console.log(`❌ GOOGLE_TOKEN: Format JSON tidak valid`);
        allOk = false;
      }
    } else {
      console.log(`✅ ${v}: Terisi`);
    }
  }
});

if (allOk) {
  console.log("\n🚀 SEMUA ENV TERLIHAT OKE! Jalankan bot dengan 'npm run dev:all'\n");
} else {
  console.log("\n⚠️ PERBAIKI ERROR DI ATAS DULU!\n");
}
