// bot/handlers/messages.js
import { Markup } from "telegraf";
import { parseTransaksi, parseStruk } from "../services/parser.js";
import { simpanTransaksi, getBudgets, getSaldo } from "../services/sheets.js";
import { formatRupiah } from "../utils/formatter.js";

let isProcessingOCR = false;

export function registerMessageHandler(bot) {
  bot.on("text", async (ctx) => {
    try {
      const teks = ctx.message.text.trim();

      // Abaikan jika command
      if (teks.startsWith("/")) return;

      // Start typing indicator immediately
      const typingAction = ctx.sendChatAction("typing");

      // 1. Parse pesan (Fast Regex or Fallback to Gemini)
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

      // 2. Parallelize: Save to Sheets + Get Current Saldo/Budgets
      // This is much faster than waiting for one after the other
      const [txnId, dataSaldo, budgets] = await Promise.all([
        simpanTransaksi({ ...hasil, sumber: "bot" }),
        getSaldo(),
        getBudgets()
      ]);

      // 3. Pre-emptive balance update:
      // The getSaldo() call above might have fetched the balance BEFORE simpanTransaksi was finished.
      // We manually adjust the balance for a perfectly accurate response without re-fetching.
      let finalSaldo = dataSaldo.saldo;
      if (hasil.tipe === "pemasukan") {
        finalSaldo += hasil.nominal;
      } else {
        finalSaldo -= hasil.nominal;
      }

      // 4. Check budget if it's an expense
      let budgetWarning = "";
      if (hasil.tipe === "pengeluaran" && budgets[hasil.kategori]) {
        const limit = budgets[hasil.kategori];
        const kategoriData = dataSaldo.byKategori.find(k => k.id === hasil.kategori);
        const currentTotal = kategoriData ? kategoriData.total : 0;
        const totalTerpakai = currentTotal + hasil.nominal; // Add current txn
        const persen = (totalTerpakai / limit) * 100;

        if (persen >= 100) {
          budgetWarning = `\n\n🚨 *OVER BUDGET!* Pengeluaran ${hasil.kategoriLabel} sudah mencapai *${formatRupiah(totalTerpakai)}* dari limit *${formatRupiah(limit)}*.`;
        } else if (persen >= 80) {
          budgetWarning = `\n\n⚠️ *HATI-HATI!* Budget ${hasil.kategoriLabel} sudah terpakai ${Math.floor(persen)}% (*${formatRupiah(totalTerpakai)}*/*${formatRupiah(limit)}*).`;
        }
      }

      // Wait for typing to finish (it usually does instantly, but good practice)
      await typingAction;

      // 5. Final Confirmation
      const icon = hasil.tipe === "pemasukan" ? "📈" : "📉";
      const tipeLabel = hasil.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran";

      await ctx.reply(
        `✅ *Tercatat!*\n\n` +
        `${icon} ${tipeLabel}: *${formatRupiah(hasil.nominal)}*\n` +
        `${hasil.kategoriEmoji} Kategori: ${hasil.kategoriLabel}\n` +
        (hasil.catatan ? `📝 Catatan: ${hasil.catatan}\n` : "") +
        `\n💰 Sisa saldo: *${formatRupiah(finalSaldo)}*` +
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
    if (isProcessingOCR) {
      return ctx.reply("⏳ Tunggu sebentar, sedang memproses struk sebelumnya...");
    }

    try {
      isProcessingOCR = true;
      // 1. Get photo metadata
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileSizeMB = photo.file_size / (1024 * 1024);

      // 2. Limit file size to 10MB to prevent OOM/Process Crash
      if (fileSizeMB > 10) {
        return ctx.reply("⚠️ Ukuran foto terlalu besar (maksimal 10MB). Silakan kirim foto dengan resolusi lebih rendah.");
      }

      console.log(`📷 Menerima foto: ${fileSizeMB.toFixed(2)} MB`);
      await ctx.reply("⏳ Sedang membaca struk...");
      await ctx.sendChatAction("typing");

      const link = await ctx.telegram.getFileLink(photo.file_id);
      
      console.log("🔗 Mengunduh file...");
      const response = await fetch(link.href);
      
      if (!response.ok) {
        throw new Error(`Gagal download file: ${response.statusText}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log(`📦 Berhasil mengunduh gambar (${buffer.length} bytes)`);

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
    } finally {
      isProcessingOCR = false;
    }
  });
}
