// bot/services/parser.js
// Hybrid Parser: Regex (Fast & Free) + Gemini (Conversational & Free Tier)

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN } from "../shared/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Konfigurasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  apiVersion: "v1" // Coba paksa v1 jika v1beta bermasalah
});

const SEMUA_KATEGORI = {
  pengeluaran: KATEGORI_PENGELUARAN,
  pemasukan:   KATEGORI_PEMASUKAN,
};

// ── Regex Parser (Mencoba memahami format umum) ──────────────
function parseDenganRegex(teks) {
  const clean = teks.toLowerCase().trim();
  
  // Format: "makan 20rb" atau "gaji 5.000.000" atau "20000 kopi"
  // Hapus titik ribuan dulu (misal: 5.000.000 -> 5000000)
  const regexNominal = /(\d+([,.]\d{3})*|(\d+))(\s*(rb|k|ribu|jt|juta))?/gi;
  const matches = [...clean.matchAll(regexNominal)];
  
  if (matches.length === 0) return null;
  
  // Ambil angka pertama yang ditemukan
  let [full, angkaStr, , , , unit] = matches[0];
  
  // Bersihkan angka dari titik ribuan atau koma desimal
  let nominal = parseFloat(angkaStr.replace(/\./g, "").replace(",", "."));
  
  if (unit) {
    const u = unit.toLowerCase();
    if (u === "rb" || u === "k" || u === "ribu") nominal *= 1000;
    if (u === "jt" || u === "juta") nominal *= 1000000;
  }
  
  // Tentukan tipe (default pengeluaran, kecuali ada kata kunci pemasukan)
  const kataKunciPemasukan = ["gaji", "bonus", "pemasukan", "untung", "income", "dapat", "terima"];
  const tipe = kataKunciPemasukan.some(k => clean.includes(k)) ? "pemasukan" : "pengeluaran";
  
  // Cari kategori berdasarkan kata kunci di teks
  const daftarKategori = SEMUA_KATEGORI[tipe];
  let kategori = "lainnya";
  let catatan = clean.replace(full, "").trim();

  for (const k of daftarKategori) {
    if (k.keywords?.some(kw => clean.includes(kw))) {
      kategori = k.id;
      // Bersihkan kata kunci dari catatan jika ada
      catatan = catatan.replace(new RegExp(k.keywords.join("|"), "gi"), "").trim();
      break;
    }
  }

  return {
    tipe,
    nominal,
    kategori,
    catatan: catatan || clean,
  };
}

// ── Gemini Parser (Fallback jika Regex kurang akurat) ─────────
async function parseDenganGemini(teks) {
  const prompt = `
Kamu adalah parser transaksi keuangan. Parse pesan berikut dan kembalikan JSON.

Pesan: "${teks}"

Kategori pengeluaran: ${KATEGORI_PENGELUARAN.map(k => k.id).join(", ")}
Kategori pemasukan: ${KATEGORI_PEMASUKAN.map(k => k.id).join(", ")}

Aturan parsing nominal:
- "25000" atau "25.000" = 25000
- "800rb" atau "800k" atau "800ribu" = 800000
- "1.5jt" atau "1,5jt" atau "1.5juta" = 1500000

Kembalikan HANYA JSON ini:
{
  "tipe": "pengeluaran" | "pemasukan",
  "nominal": number,
  "kategori": string (id kategori),
  "catatan": string
}

Jika pesan bukan transaksi, kembalikan: null
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let raw = response.text().trim();
    
    // Bersihkan markdown jika ada
    raw = raw.replace(/```json|```/g, "").trim();
    
    if (raw === "null") return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gemini Error:", err.message);
    return null;
  }
}

// ── Gemini Vision Parser (Untuk Struk/Foto) ─────────────────
export async function parseStruk(imageBuffer, mimeType) {
  const prompt = `
Kamu adalah OCR Parser yang sangat teliti untuk struk belanja (receipt). 
Tugasmu adalah mengekstrak 3 informasi utama dari gambar ini:

1. **Nominal**: Cari total akhir yang harus dibayar (Grand Total). Abaikan pajak/diskon jika ada, ambil angka finalnya saja.
2. **Catatan**: Ambil nama Toko/Merchant (misal: Alfamart, Indomaret, Kopi Kenangan, dll).
3. **Kategori**: Pilih kategori yang paling cocok dari daftar berikut:
   Daftar Kategori: ${KATEGORI_PENGELUARAN.map(k => k.id).join(", ")}

Aturan Penting:
- Jika angka sulit dibaca, berikan estimasi terbaikmu.
- Jika tidak ada kategori yang cocok, gunakan "lainnya".
- Jangan memberikan teks penjelasan apa pun, HANYA kembalikan JSON.

Format JSON:
{
  "tipe": "pengeluaran",
  "nominal": number,
  "kategori": string,
  "catatan": string
}
`;

  try {
    console.log("📷 [OCR] Mengirim gambar ke Gemini Vision...");
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType
        }
      }
    ]);
    const response = await result.response;
    let raw = response.text().trim();
    
    console.log("📝 [OCR] Raw response dari Gemini:", raw);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ [OCR] Tidak ditemukan JSON dalam response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validasi nominal
    if (!parsed.nominal || isNaN(parsed.nominal)) {
      console.warn("⚠️ [OCR] Nominal tidak valid:", parsed.nominal);
      return null;
    }

    console.log("✅ [OCR] Berhasil di-parse:", parsed);
    return enrichResult(parsed);
  } catch (err) {
    console.error("❌ [OCR] Error:", err.message);
    return null;
  }
}

// ── Main Export ───────────────────────────────────────────────
export async function parseTransaksi(teks) {
  // 1. Coba Regex dulu (Cepat & Gratis)
  console.log("🔍 Mencoba Regex Parser...");
  const regexResult = parseDenganRegex(teks);
  
  // Jika regex cukup yakin (ada nominal & kategori selain 'lainnya')
  if (regexResult && regexResult.kategori !== "lainnya") {
    console.log("✅ Regex Match!");
    return enrichResult(regexResult);
  }

  // 2. Fallback ke Gemini (Lebih pintar)
  console.log("🧠 Regex kurang yakin, memanggil Gemini...");
  const geminiResult = await parseDenganGemini(teks);
  
  if (geminiResult) {
    console.log("✅ Gemini Match!");
    return enrichResult(geminiResult);
  }

  // 3. Terakhir, jika Gemini gagal tapi Regex punya hasil 'lainnya'
  if (regexResult) {
    console.log("📦 Menggunakan hasil Regex (kategori lainnya)");
    return enrichResult(regexResult);
  }

  return null;
}

function enrichResult(parsed) {
  const daftarKategori = SEMUA_KATEGORI[parsed.tipe] || [];
  const kategoriData = daftarKategori.find(k => k.id === parsed.kategori)
    ?? daftarKategori.find(k => k.id === "lainnya");

  return {
    ...parsed,
    kategoriLabel: kategoriData?.label ?? parsed.kategori,
    kategoriEmoji: kategoriData?.emoji ?? "📦",
  };
}
