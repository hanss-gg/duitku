// bot/index.js
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Telegraf } from "telegraf";
import { registerCommands } from "./handlers/commands.js";
import { registerMessageHandler } from "./handlers/messages.js";
import { pastikanSheetSiap } from "./services/sheets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ── Inisialisasi Database ─────────────────────────────────────
console.log("⏳ Menghubungkan ke Google Sheets...");
pastikanSheetSiap()
  .then(() => console.log("✅ Google Sheets siap!"))
  .catch((err) => {
    console.error("⚠️ Google Sheets belum siap:", err.message);
    console.log("💡 Bot tetap berjalan, tapi fitur pencatatan mungkin gagal.");
  });

// ── Middleware: whitelist chat ID ─────────────────────────────
bot.use(async (ctx, next) => {
  const allowedId = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  if (String(ctx.from?.id) !== String(allowedId)) {
    await ctx.reply("⛔ Akses ditolak.");
    return;
  }
  return next();
});

// ── Register handlers ─────────────────────────────────────────
registerCommands(bot);
registerMessageHandler(bot);

// ── Error handler ─────────────────────────────────────────────
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply("❌ Terjadi error, coba lagi ya.");
});

// ── Launch ────────────────────────────────────────────────────
bot.launch();
console.log("🤖 Duitku Bot berjalan...");

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
