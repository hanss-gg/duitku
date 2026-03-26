// bot/handlers/commands.js
import { getSaldo, getLaporan, getRiwayat, hapusTransaksiTerakhir, arsipDataLama } from "../services/sheets.js";
import { formatRupiah, formatTanggal } from "../utils/formatter.js";

export function registerCommands(bot) {

  // /start — sambutan
  bot.start((ctx) => ctx.reply(
    `👋 Halo! Aku *Duitku Bot* — pencatat keuanganmu.\n\n` +
    `Ketik saja pengeluaran atau pemasukan kamu, contoh:\n` +
    `• \`makan siang 25000\`\n` +
    `• \`kiriman ortu 800rb\`\n` +
    `• \`beli kopi 18k\`\n\n` +
    `Atau pakai command:\n` +
    `/saldo — cek saldo sekarang\n` +
    `/laporan — laporan bulan ini\n` +
    `/riwayat — 10 transaksi terakhir\n` +
    `/hapus — hapus transaksi terakhir\n` +
    `/help — bantuan`,
    { parse_mode: "Markdown" }
  ));

  // /help
  bot.help((ctx) => ctx.reply(
    `📖 *Panduan Duitku Bot*\n\n` +
    `*Input transaksi (ketik bebas):*\n` +
    `\`makan siang 25000\`\n` +
    `\`kiriman ortu 800rb\`\n` +
    `\`beli kopi 18k\`\n` +
    `\`bayar listrik 150.000\`\n\n` +
    `*Commands:*\n` +
    `/saldo — saldo & ringkasan bulan ini\n` +
    `/laporan — laporan detail bulan ini\n` +
    `/riwayat — 10 transaksi terakhir\n` +
    `/hapus — hapus transaksi terakhir`,
    { parse_mode: "Markdown" }
  ));

  // /saldo
  bot.command("saldo", async (ctx) => {
    try {
      await ctx.sendChatAction("typing");
      const data = await getSaldo();
      await ctx.reply(
        `💰 *Saldo Bulan Ini*\n\n` +
        `Saldo: *${formatRupiah(data.saldo)}*\n` +
        `📈 Pemasukan: ${formatRupiah(data.pemasukan)}\n` +
        `📉 Pengeluaran: ${formatRupiah(data.pengeluaran)}\n\n` +
        `_Update: ${formatTanggal(new Date())}_`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Saldo command error:", err);
      ctx.reply("❌ Gagal mengambil saldo. Cek koneksi ke Google Sheets.");
    }
  });

  // /laporan
  bot.command("laporan", async (ctx) => {
    try {
      await ctx.sendChatAction("typing");
      const data = await getLaporan();
      
      if (!data || (data.pemasukan === 0 && data.pengeluaran === 0)) {
        return ctx.reply("📊 Belum ada transaksi di bulan ini.");
      }

      const status = data.saldo >= 0 ? "✅ Surplus" : "⚠️ Defisit";
      const top = data.topKategori.length > 0 
        ? data.topKategori.map((k, i) => `${i + 1}. ${k.emoji} ${k.label}: ${formatRupiah(k.total)}`).join("\n")
        : "_Tidak ada data kategori_";

      await ctx.reply(
        `📊 *Laporan ${data.bulan}*\n\n` +
        `💰 Saldo: *${formatRupiah(data.saldo)}*\n` +
        `📈 Pemasukan: ${formatRupiah(data.pemasukan)}\n` +
        `📉 Pengeluaran: ${formatRupiah(data.pengeluaran)}\n` +
        `Status: ${status}\n\n` +
        `*Top Pengeluaran:*\n${top}\n\n` +
        `🌐 Detail lengkap di dashboard web`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Laporan command error:", err);
      ctx.reply("❌ Gagal mengambil laporan.");
    }
  });

  // /riwayat
  bot.command("riwayat", async (ctx) => {
    try {
      await ctx.sendChatAction("typing");
      const transaksi = await getRiwayat(10);
      if (!transaksi || !transaksi.length) return ctx.reply("Belum ada transaksi.");

      const lines = transaksi.map((t) => {
        const icon = t.tipe === "pemasukan" ? "📈" : "📉";
        return `${icon} ${formatTanggal(t.tanggal)} — ${t.kategoriEmoji} ${formatRupiah(t.nominal)}\n   _${t.catatan || t.kategoriLabel}_`;
      }).join("\n\n");

      await ctx.reply(`📋 *10 Transaksi Terakhir*\n\n${lines}`, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Riwayat command error:", err);
      ctx.reply("❌ Gagal mengambil riwayat.");
    }
  });

  // /hapus
  bot.command("hapus", async (ctx) => {
    try {
      await ctx.sendChatAction("typing");
      const deleted = await hapusTransaksiTerakhir();
      if (!deleted) return ctx.reply("Tidak ada transaksi yang bisa dihapus.");
      await ctx.reply(
        `🗑️ Transaksi terakhir dihapus:\n` +
        `${deleted.tipe === "pemasukan" ? "📈" : "📉"} ${deleted.kategoriEmoji} ${formatRupiah(deleted.nominal)}\n` +
        `_${deleted.catatan || deleted.kategoriLabel}_`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Hapus command error:", err);
      ctx.reply("❌ Gagal menghapus transaksi terakhir.");
    }
  });

  // /arsip
  bot.command("arsip", async (ctx) => {
    try {
      await ctx.sendChatAction("typing");
      const { archived } = await arsipDataLama();
      if (archived === 0) {
        return ctx.reply("📦 Semua data sudah dalam kondisi terarsip atau masih dalam bulan ini.");
      }
      await ctx.reply(`✅ Berhasil mengarsipkan *${archived}* transaksi lama ke sheet arsip.`, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Arsip command error:", err);
      ctx.reply("❌ Gagal melakukan pengarsipan.");
    }
  });
}
