// bot/services/parser.js
// Hybrid Parser: Regex (Fast & Free) + Gemini (Conversational & Free Tier)

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN } from "../../shared/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const genAI = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("PASTE") 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

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
  
  // Helper function for strict matching
  const containsWord = (source, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(source);
  };

  // 2. Determine Type (Pemasukan vs Pengeluaran)
  const matchesPemasukan = KATEGORI_PEMASUKAN.filter(cat => 
    cat.keywords?.some(kw => containsWord(clean, kw)) || containsWord(clean, cat.id)
  );
  const tipe = matchesPemasukan.length > 0 ? "pemasukan" : "pengeluaran";
  
  // 3. Determine Category (Check for ambiguity)
  const daftarKategori = SEMUA_KATEGORI[tipe];
  const matchedCategories = [];

  for (const k of daftarKategori) {
    if (k.keywords?.some(kw => containsWord(clean, kw)) || containsWord(clean, k.id)) {
      matchedCategories.push(k);
    }
  }

  let kategori = "lainnya";
  let isAmbiguous = matchedCategories.length > 1;

  if (matchedCategories.length === 1) {
    kategori = matchedCategories[0].id;
  } else if (matchedCategories.length > 1) {
    // If multiple categories match, pick the first one but mark as ambiguous
    kategori = matchedCategories[0].id;
  }

  // 4. Clean up Note (remove nominal)
  let catatan = clean.replace(full, "").trim();
  catatan = catatan.replace(/\s+/g, " ").trim();

  return {
    tipe,
    nominal,
    kategori,
    catatan: catatan || clean,
    isAmbiguous
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
  
  // If it's a clear, non-ambiguous match (not "lainnya" and not ambiguous), use it.
  if (regexResult && regexResult.kategori !== "lainnya" && !regexResult.isAmbiguous) {
    return enrichResult(regexResult);
  }

  // 2. Gemini Fallback (For ambiguous matches or "lainnya")
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
