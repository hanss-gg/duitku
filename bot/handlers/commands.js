// bot/handlers/commands.js
import { getSaldo, getLaporan, getRiwayat, getRiwayatFiltered, hapusTransaksiTerakhir, arsipDataLama } from "../services/sheets.js";
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
    `/list <query> — cari transaksi tertentu\n` +
    `/hapus — hapus transaksi terakhir\n` +
    `/arsip — pindahkan data lama ke arsip\n` +
    `/check — cek status koneksi bot\n` +
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
    `/list <query> — cari transaksi (misal: /list makan)\n` +
    `/hapus — hapus transaksi terakhir\n` +
    `/arsip — pindahkan data lama ke arsip\n` +
    `/check — cek status koneksi bot`,
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

  // /list <query>
  bot.command("list", async (ctx) => {
    try {
      const query = ctx.message.text.split(" ").slice(1).join(" ");
      if (!query) {
        return ctx.reply("💡 Gunakan format: `/list <nama_kategori_atau_catatan>`\nContoh: `/list makan` atau `/list ojek`", { parse_mode: "Markdown" });
      }

      await ctx.sendChatAction("typing");
      const transaksi = await getRiwayatFiltered(query, 15);
      
      if (!transaksi || !transaksi.length) {
        return ctx.reply(`🔍 Tidak ditemukan transaksi untuk: *${query}*`, { parse_mode: "Markdown" });
      }

      const lines = transaksi.map((t) => {
        const icon = t.tipe === "pemasukan" ? "📈" : "📉";
        return `${icon} ${formatTanggal(t.tanggal)} — ${t.kategoriEmoji} ${formatRupiah(t.nominal)}\n   _${t.catatan || t.kategoriLabel}_`;
      }).join("\n\n");

      await ctx.reply(`🔍 *Hasil Pencarian: ${query}*\n\n${lines}`, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("List command error:", err);
      ctx.reply("❌ Gagal melakukan pencarian transaksi.");
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

  // /check — status bot
  bot.command("check", async (ctx) => {
    try {
      await ctx.sendChatAction("typing");
      // Coba ambil saldo terkecil sebagai cek koneksi
      await getSaldo();
      await ctx.reply(
        `✅ *Bot Status: ONLINE*\n\n` +
        `🌐 *Google Sheets:* Terhubung\n` +
        `🧠 *Gemini AI:* ${process.env.GEMINI_API_KEY ? "Aktif" : "Non-aktif"}\n` +
        `👤 *Chat ID:* \`${ctx.from.id}\` (Terdaftar)`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Check status error:", err);
      await ctx.reply(
        `❌ *Bot Status: MASALAH*\n\n` +
        `⚠️ Gagal terhubung ke Google Sheets.\n\n` +
        `Pesan error: \`${err.message}\`\n\n` +
        `💡 Tips: Periksa file \`.env\` atau jalankan ulang \`npm run setup:token\`.`,
        { parse_mode: "Markdown" }
      );
    }
  });
}
