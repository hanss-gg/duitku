// bot/services/parser.js
// Hybrid Parser: Regex (Fast & Free) + Gemini (Conversational & Free Tier)

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN } from "../shared/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const SEMUA_KATEGORI = {
  pengeluaran: KATEGORI_PENGELUARAN,
  pemasukan:   KATEGORI_PEMASUKAN,
};

// ── Regex Parser ──────────────────────────────────────────────
function parseDenganRegex(teks) {
  const clean = teks.toLowerCase().trim();
  
  // 1. Extract Nominal
  const regexNominal = /(\d+([,.]\d{3})*|(\d+))(\s*(rb|k|ribu|jt|juta))?/gi;
  const matches = [...clean.matchAll(regexNominal)];
  if (matches.length === 0) return null;
  
  let [full, angkaStr, , , , unit] = matches[0];
  let nominal = parseFloat(angkaStr.replace(/\./g, "").replace(",", "."));
  
  if (unit) {
    const u = unit.toLowerCase();
    if (u === "rb" || u === "k" || u === "ribu") nominal *= 1000;
    if (u === "jt" || u === "juta") nominal *= 1000000;
  }
  
  // 2. Determine Type (Pemasukan vs Pengeluaran)
  // Check keywords from shared/constants.js for income
  const isPemasukan = KATEGORI_PEMASUKAN.some(cat => 
    cat.keywords?.some(kw => clean.includes(kw)) || clean.includes(cat.id)
  );
  const tipe = isPemasukan ? "pemasukan" : "pengeluaran";
  
  // 3. Determine Category
  const daftarKategori = SEMUA_KATEGORI[tipe];
  let kategori = "lainnya";
  let foundCategory = null;

  // Try to find specific category match
  for (const k of daftarKategori) {
    if (k.keywords?.some(kw => clean.includes(kw)) || clean.includes(k.id)) {
      foundCategory = k;
      break;
    }
  }

  if (foundCategory) {
    kategori = foundCategory.id;
  }

  // 4. Clean up Note (remove nominal and keywords)
  let catatan = clean.replace(full, "").trim();
  if (foundCategory && foundCategory.keywords) {
    foundCategory.keywords.forEach(kw => {
      catatan = catatan.replace(kw, "");
    });
  }
  catatan = catatan.replace(/\s+/g, " ").trim();

  return {
    tipe,
    nominal,
    kategori,
    catatan: catatan || clean,
  };
}

// ── Gemini Parser ─────────────────────────────────────────────
async function parseDenganGemini(teks) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("PASTE")) return null;

  const prompt = `
Parse transaksi: "${teks}"
Kategori Pengeluaran: ${KATEGORI_PENGELUARAN.map(k => k.id).join(", ")}
Kategori Pemasukan: ${KATEGORI_PEMASUKAN.map(k => k.id).join(", ")}

Kembalikan JSON:
{
  "tipe": "pengeluaran" | "pemasukan",
  "nominal": number,
  "kategori": string,
  "catatan": string
}
Jika bukan transaksi, balas: null
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let raw = response.text().trim().replace(/```json|```/g, "");
    if (raw === "null") return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gemini Error:", err.message);
    return null;
  }
}

export async function parseStruk(imageBuffer, mimeType) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("PASTE")) return null;

  const prompt = `
Ekstrak dari struk:
1. Nominal Total (Grand Total)
2. Nama Toko (Catatan)
3. Kategori (pilih dari: ${KATEGORI_PENGELUARAN.map(k => k.id).join(", ")})

Balas HANYA JSON:
{ "tipe": "pengeluaran", "nominal": number, "kategori": string, "catatan": string }
`;

  try {
    const result = await model.generateContent([{ text: prompt }, { inlineData: { data: imageBuffer.toString("base64"), mimeType } }]);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    return jsonMatch ? enrichResult(JSON.parse(jsonMatch[0])) : null;
  } catch (err) {
    console.error("OCR Error:", err.message);
    return null;
  }
}

export async function parseTransaksi(teks) {
  // 1. Regex Match (Fast)
  const regexResult = parseDenganRegex(teks);
  if (regexResult && regexResult.kategori !== "lainnya") {
    return enrichResult(regexResult);
  }

  // 2. Gemini Fallback
  const geminiResult = await parseDenganGemini(teks);
  if (geminiResult) return enrichResult(geminiResult);

  // 3. Default to Regex result if it at least found a nominal
  return regexResult ? enrichResult(regexResult) : null;
}

function enrichResult(parsed) {
  const daftar = SEMUA_KATEGORI[parsed.tipe] || [];
  const cat = daftar.find(k => k.id === parsed.kategori) || daftar.find(k => k.id === "lainnya");
  return {
    ...parsed,
    kategoriLabel: cat?.label || parsed.kategori,
    kategoriEmoji: cat?.emoji || "📦",
  };
}
