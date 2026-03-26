// bot/handlers/callbacks.js
import { hapusTransaksiById } from "../services/sheets.js";

export function registerCallbackHandlers(bot) {
  // Handle delete transaction
  bot.action(/^delete_(.+)$/, async (ctx) => {
    try {
      const txnId = ctx.match[1];
      await ctx.answerCbQuery("⏳ Menghapus...");
      
      const deleted = await hapusTransaksiById(txnId);
      
      if (deleted) {
        await ctx.editMessageText(`🗑️ *Transaksi Dibatalkan*\n\nSudah dihapus dari catatan.`, { parse_mode: "Markdown" });
      } else {
        await ctx.answerCbQuery("❌ Gagal: Transaksi tidak ditemukan.");
      }
    } catch (err) {
      console.error("Callback error (delete):", err);
      await ctx.answerCbQuery("❌ Terjadi kesalahan sistem.");
    }
  });
}
