// bot/handlers/messages.js
import { Markup } from "telegraf";
import { parseTransaksi } from "../services/parser.js";
import { simpanTransaksi, getBudgets, getSaldo } from "../services/sheets.js";
import { formatRupiah } from "../utils/formatter.js";

export function registerMessageHandler(bot) {
  bot.on("text", async (ctx) => {
    try {
      const teks = ctx.message.text.trim();

      // Abaikan jika command
      if (teks.startsWith("/")) return;

      await ctx.sendChatAction("typing");

      // 1. Parse pesan
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
      let txnId;
      try {
        txnId = await simpanTransaksi({ ...hasil, sumber: "bot" });
      } catch (err) {
        console.error("Gagal simpan ke Sheets:", err);
        return ctx.reply("❌ Gagal menyimpan ke Google Sheets. Cek koneksi atau token kamu.");
      }

      // 3. Ambil saldo & budget
      let saldo = 0;
      let budgetWarning = "";
      try {
        const [dataSaldo, budgets] = await Promise.all([
          getSaldo(),
          getBudgets()
        ]);
        
        saldo = dataSaldo.saldo;

        // Check budget if it's an expense
        if (hasil.tipe === "pengeluaran" && budgets[hasil.kategori]) {
          const limit = budgets[hasil.kategori];
          const kategoriData = dataSaldo.byKategori.find(k => k.id === hasil.kategori);
          const totalTerpakai = kategoriData ? kategoriData.total : 0;
          const persen = (totalTerpakai / limit) * 100;

          if (persen >= 100) {
            budgetWarning = `\n\n🚨 *OVER BUDGET!* Pengeluaran ${hasil.kategoriLabel} sudah mencapai *${formatRupiah(totalTerpakai)}* dari limit *${formatRupiah(limit)}*.`;
          } else if (persen >= 80) {
            budgetWarning = `\n\n⚠️ *HATI-HATI!* Budget ${hasil.kategoriLabel} sudah terpakai ${Math.floor(persen)}% (*${formatRupiah(totalTerpakai)}*/*${formatRupiah(limit)}*).`;
          }
        }
      } catch (err) {
        console.warn("Gagal ambil saldo/budget terbaru:", err.message);
      }

      // 4. Balas konfirmasi
      const icon = hasil.tipe === "pemasukan" ? "📈" : "📉";
      const tipeLabel = hasil.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran";

      await ctx.reply(
        `✅ *Tercatat!*\n\n` +
        `${icon} ${tipeLabel}: *${formatRupiah(hasil.nominal)}*\n` +
        `${hasil.kategoriEmoji} Kategori: ${hasil.kategoriLabel}\n` +
        (hasil.catatan ? `📝 Catatan: ${hasil.catatan}\n` : "") +
        `\n💰 Sisa saldo: *${formatRupiah(saldo)}*` +
        budgetWarning,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🗑️ Hapus", `delete_${txnId}`)]
          ])
        }
      );
    } catch (globalErr) {
      console.error("Global message handler error:", globalErr);
      ctx.reply("❌ Terjadi kesalahan sistem. Coba beberapa saat lagi.");
    }
  });

  // ── Handle Photo (OCR) ──────────────────────────────────────
  bot.on("photo", async (ctx) => {
    try {
      await ctx.reply("⏳ Sedang membaca struk...");
      await ctx.sendChatAction("typing");

      // Ambil foto ukuran terbesar
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const link = await ctx.telegram.getFileLink(photo.file_id);
      
      const response = await fetch(link);
      const buffer = Buffer.from(await response.arrayBuffer());

      const hasil = await parseStruk(buffer, "image/jpeg");

      if (!hasil) {
        return ctx.reply("❌ Gagal membaca struk. Pastikan foto jelas dan terang.");
      }

      // Simpan langsung
      const txnId = await simpanTransaksi({ ...hasil, sumber: "bot" });

      // Ambil saldo & budget
      const [dataSaldo, budgets] = await Promise.all([getSaldo(), getBudgets()]);
      let budgetWarning = "";

      if (budgets[hasil.kategori]) {
        const limit = budgets[hasil.kategori];
        const kategoriData = dataSaldo.byKategori.find(k => k.id === hasil.kategori);
        const totalTerpakai = kategoriData ? kategoriData.total : 0;
        const persen = (totalTerpakai / limit) * 100;

        if (persen >= 100) {
          budgetWarning = `\n\n🚨 *OVER BUDGET!* Pengeluaran ${hasil.kategoriLabel} sudah mencapai *${formatRupiah(totalTerpakai)}* dari limit *${formatRupiah(limit)}*.`;
        } else if (persen >= 80) {
          budgetWarning = `\n\n⚠️ *HATI-HATI!* Budget ${hasil.kategoriLabel} sudah terpakai ${Math.floor(persen)}% (*${formatRupiah(totalTerpakai)}*/*${formatRupiah(limit)}*).`;
        }
      }

      await ctx.reply(
        `📸 *Struk Terbaca!*\n\n` +
        `📉 Pengeluaran: *${formatRupiah(hasil.nominal)}*\n` +
        `${hasil.kategoriEmoji} Kategori: ${hasil.kategoriLabel}\n` +
        (hasil.catatan ? `📝 Toko: ${hasil.catatan}\n` : "") +
        `\n💰 Sisa saldo: *${formatRupiah(dataSaldo.saldo)}*` +
        budgetWarning,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🗑️ Hapus", `delete_${txnId}`)]
          ])
        }
      );

    } catch (err) {
      console.error("OCR Photo error:", err);
      ctx.reply("❌ Terjadi kesalahan saat memproses foto.");
    }
  });
}
