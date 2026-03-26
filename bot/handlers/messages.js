// bot/handlers/messages.js
import { parseTransaksi } from "../services/parser.js";
import { simpanTransaksi } from "../services/sheets.js";
import { formatRupiah } from "../utils/formatter.js";
import { getSaldo } from "../services/sheets.js";

export function registerMessageHandler(bot) {
  bot.on("text", async (ctx) => {
    try {
      const teks = ctx.message.text.trim();

      // Abaikan jika command
      if (teks.startsWith("/")) return;

      await ctx.sendChatAction("typing");

      // 1. Parse pesan dengan Claude AI
      const hasil = await parseTransaksi(teks);
      if (!hasil) {
        return ctx.reply(
          `❓ Aku tidak mengerti maksudnya.\n\n` +
          `Coba format seperti ini:\n` +
          `• \`makan siang 25000\`\n` +
          `• \`kiriman ortu 800rb\`\n` +
          `• \`beli kopi 18k\``,
          { parse_mode: "Markdown" }
        );
      }

      // 2. Simpan ke Google Sheets
      try {
        await simpanTransaksi({ ...hasil, sumber: "bot" });
      } catch (err) {
        console.error("Gagal simpan ke Sheets:", err);
        return ctx.reply("❌ Gagal menyimpan ke Google Sheets. Cek koneksi atau token kamu.");
      }

      // 3. Ambil saldo terkini
      let saldo = 0;
      try {
        const dataSaldo = await getSaldo();
        saldo = dataSaldo.saldo;
      } catch (err) {
        console.warn("Gagal ambil saldo terbaru:", err.message);
      }

      // 4. Balas konfirmasi
      const icon = hasil.tipe === "pemasukan" ? "📈" : "📉";
      const tipeLabel = hasil.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran";

      await ctx.reply(
        `✅ *Tercatat!*\n\n` +
        `${icon} ${tipeLabel}: *${formatRupiah(hasil.nominal)}*\n` +
        `${hasil.kategoriEmoji} Kategori: ${hasil.kategoriLabel}\n` +
        (hasil.catatan ? `📝 Catatan: ${hasil.catatan}\n` : "") +
        `\n💰 Sisa saldo: *${formatRupiah(saldo)}*`,
        { parse_mode: "Markdown" }
      );
    } catch (globalErr) {
      console.error("Global message handler error:", globalErr);
      ctx.reply("❌ Terjadi kesalahan sistem. Coba beberapa saat lagi.");
    }
  });
}
