// bot/index.js
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Telegraf } from "telegraf";
import { registerCommands } from "./handlers/commands.js";
import { registerMessageHandler } from "./handlers/messages.js";
import { registerCallbackHandlers } from "./handlers/callbacks.js";
import { pastikanSheetSiap } from "./services/sheets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ── Inisialisasi Database ─────────────────────────────────────
console.log("⏳ Menghubungkan ke Google Sheets...");
pastikanSheetSiap()
  .then(() => {
    console.log("✅ Google Sheets siap!");
    console.log("📊 Database: " + process.env.GOOGLE_SHEETS_ID);
  })
  .catch((err) => {
    console.error("❌ Google Sheets Error:", err.message);
    console.log("💡 Tips: Periksa GOOGLE_TOKEN di .env atau jalankan 'npm run setup:token'.");
    console.log("🤖 Bot tetap berjalan, tapi fitur pencatatan akan gagal.");
  });

// ── Middleware: whitelist chat ID ─────────────────────────────
bot.use(async (ctx, next) => {
  const allowedId = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  const userId = ctx.from?.id;

  if (String(userId) !== String(allowedId)) {
    console.warn(`⚠️ Akses ditolak untuk Chat ID: ${userId}`);
    await ctx.reply(
      `⛔ *Akses Ditolak*\n\n` +
      `ID kamu (\`${userId}\`) tidak terdaftar.\n` +
      `Silakan masukkan ID ini ke \`TELEGRAM_ALLOWED_CHAT_ID\` di file \`.env\`.`,
      { parse_mode: "Markdown" }
    );
    return;
  }
  return next();
});

// ── Register handlers ─────────────────────────────────────────
registerCommands(bot);
registerMessageHandler(bot);
registerCallbackHandlers(bot);

// ── Error handler ─────────────────────────────────────────────
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply("❌ Terjadi error, coba lagi ya.");
});

// ── Launch ────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production" && process.env.WEBHOOK_URL) {
  const secretPath = `/telegraf/${bot.secretPathComponent()}`;
  console.log(`📡 Bot configured for Webhooks: ${process.env.WEBHOOK_URL}${secretPath}`);
  // We don't launch here, server.js will handle the middleware
} else {
  bot.launch();
  console.log("🤖 Duitku Bot berjalan (Polling Mode)...");
}

export default bot;

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
