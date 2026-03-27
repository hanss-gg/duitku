// bot/scripts/get-token.js
// Jalankan sekali untuk mendapatkan Google OAuth token
// Usage: node scripts/get-token.js

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import http from "http";
import { URL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:9999/callback",
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  prompt: "consent",
});

console.log("\n=== Duitku — Setup Google Token ===\n");
console.log("1. Buka URL ini di browser:\n");
console.log(authUrl);
console.log("\n2. Login dengan akun Google kamu");
console.log("3. Izinkan akses ke Google Sheets");
console.log("4. Tunggu token muncul di terminal ini\n");

// Buat server sementara untuk menangkap callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:9999");
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("Error: tidak ada code");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.end(`
      <html><body style="font-family:sans-serif;padding:2rem">
        <h2>✅ Token berhasil didapat!</h2>
        <p>Tutup tab ini dan lihat terminal.</p>
      </body></html>
    `);

    console.log("✅ Token berhasil didapat!\n");
    console.log("Salin nilai berikut ke file .env sebagai GOOGLE_TOKEN:\n");
    console.log("GOOGLE_TOKEN=" + JSON.stringify(tokens));
    console.log("\nAtau dalam format JSON:\n");
    console.log(JSON.stringify(tokens, null, 2));

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    res.end("Error: " + err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(9999, () => {
  console.log("Server sementara berjalan di http://localhost:9999 ...\n");
});
