// bot/server.js
// Express backend — menangani Google OAuth dan REST API untuk dashboard

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import express from "express";
import session from "express-session";
import { google } from "googleapis";
import cors from "cors";
import bot from "./index.js"; // Import the bot instance

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import {
  simpanTransaksi,
  getSaldo,
  getRiwayat,
  getLaporan,
  hapusTransaksiTerakhir,
  pastikanSheetSiap,
} from "./services/sheets.js";

const app = express();

// ── Webhook Setup (Production Only) ───────────────────────────
if (process.env.NODE_ENV === "production" && process.env.WEBHOOK_URL) {
  const secretPath = `/telegraf/${bot.secretPathComponent()}`;
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}${secretPath}`)
    .then(() => console.log("✅ Webhook established"))
    .catch(err => console.error("❌ Failed to set webhook:", err));
  
  app.use(bot.webhookCallback(secretPath));
}

// ── Production Proxy Trust ────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.set('trust proxy', 1);
}

// ── Inisialisasi Database ─────────────────────────────────────
pastikanSheetSiap()
  .then(() => console.log("✅ Google Sheets siap (Server)!"))
  .catch((err) => {
    console.error("❌ GAGAL menghubungkan ke Google Sheets:", err.message);
  });
// ── Middleware ────────────────────────────────────────────────
app.use(express.json());

const isProd = process.env.NODE_ENV === "production";
const allowedOrigin = process.env.DASHBOARD_URL?.replace(/\/$/, "") || "http://localhost:3006";

app.use(cors({
  origin: [allowedOrigin, "http://localhost:3006"], 
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "duitku-fallback-secret-123",
  resave: false,
  saveUninitialized: false,
  proxy: true, // Railway uses proxy
  cookie: {
    secure: isProd, 
    httpOnly: true,
    sameSite: isProd ? "none" : "lax", 
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// ── Google OAuth Setup ────────────────────────────────────────
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

// ── Auth Middleware ───────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ── Auth Routes ───────────────────────────────────────────────

// Redirect ke Google login
app.get("/auth/google", (req, res) => {
  const oauth2 = getOAuthClient();
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
    prompt: "consent",
  });
  res.redirect(url);
});

// Callback dari Google
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/?error=no_code");

  try {
    const oauth2 = getOAuthClient();
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    // Ambil info user
    const oauth2Info = google.oauth2({ version: "v2", auth: oauth2 });
    const { data: userInfo } = await oauth2Info.userinfo.get();

    // Whitelist email
    if (userInfo.email !== process.env.ALLOWED_EMAIL) {
      return res.redirect("/?error=unauthorized");
    }

    req.session.user = { email: userInfo.email, name: userInfo.name };
    req.session.tokens = tokens;

    res.redirect(process.env.DASHBOARD_URL || "http://localhost:3000");
  } catch (err) {
    console.error("OAuth error:", err);
    res.redirect("/?error=oauth_failed");
  }
});

// Cek status login
app.get("/auth/me", (req, res) => {
  if (!req.session?.user) return res.status(401).json(null);
  res.json(req.session.user);
});

// Logout
app.post("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// ── API Routes (semua butuh auth) ─────────────────────────────

// GET /api/saldo — ringkasan bulan ini
app.get("/api/saldo", requireAuth, async (req, res) => {
  try {
    const data = await getSaldo(req.session.tokens);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil saldo" });
  }
});

// GET /api/riwayat?limit=10&bulan=2025-10
app.get("/api/riwayat", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bulan = req.query.bulan || null;
    const data = await getRiwayat(limit, bulan, req.session.tokens);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil riwayat" });
  }
});

// GET /api/laporan?bulan=2025-10
app.get("/api/laporan", requireAuth, async (req, res) => {
  try {
    const bulan = req.query.bulan || null;
    const data = await getLaporan(bulan, req.session.tokens);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil laporan" });
  }
});

// POST /api/transaksi
app.post("/api/transaksi", requireAuth, async (req, res) => {
  try {
    const { tipe, nominal, kategori, catatan, tanggal } = req.body;
    if (!tipe || !nominal || !kategori) {
      return res.status(400).json({ error: "tipe, nominal, kategori wajib diisi" });
    }
    const id = await simpanTransaksi(
      { tipe, nominal, kategori, catatan, tanggal, sumber: "web" },
      req.session.tokens
    );
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal simpan transaksi" });
  }
});

// DELETE /api/transaksi/last
app.delete("/api/transaksi/last", requireAuth, async (req, res) => {
  try {
    const deleted = await hapusTransaksiTerakhir(req.session.tokens);
    if (!deleted) return res.status(404).json({ error: "Tidak ada transaksi" });
    res.json({ ok: true, deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hapus transaksi" });
  }
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🌐 Server berjalan di port ${PORT}`));
