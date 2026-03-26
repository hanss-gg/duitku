// bot/services/sheets.js
// Semua operasi baca/tulis ke Google Sheets

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN, SHEET_NAME } from "../shared/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// ── Auth ──────────────────────────────────────────────────────
function getSheetsClient(tokens = null) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  let creds;
  try {
    const rawToken = process.env.GOOGLE_TOKEN;
    if (!rawToken) throw new Error("GOOGLE_TOKEN is empty");

    // Jika token sudah berupa string JSON yang di-escape (dari dotenv)
    creds = tokens ?? JSON.parse(rawToken);
  } catch (e) {
    console.error("⚠️ GOOGLE_TOKEN di .env tidak valid atau kosong. Silakan jalankan setup:token.");
    // Jangan lempar error agar bot tidak crash saat startup, tapi fungsi sheets akan gagal nanti
    creds = tokens || {}; 
  }

  auth.setCredentials(creds);
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// ── Initialization ───────────────────────────────────────────
// Memastikan sheet "Transaksi" ada dengan header yang benar
export async function pastikanSheetSiap(tokens = null) {
  const sheets = getSheetsClient(tokens);
  
  try {
    // Cek apakah sheet sudah ada
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = spreadsheet.data.sheets.some(s => s.properties.title === SHEET_NAME);
    
    if (!sheetExists) {
      console.log(`📝 Membuat sheet "${SHEET_NAME}"...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
        }
      });
      
      // Tambah header
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:G1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["ID", "Tanggal", "Tipe", "Nominal", "Kategori", "Catatan", "Sumber"]]
        }
      });
    }
  } catch (err) {
    console.error("❌ Gagal inisialisasi sheet:", err.message);
    throw err;
  }
}

// ── Helpers ───────────────────────────────────────────────────
function rowToTransaksi(row) {
  if (!row || row.length < 5) return null;
  const [id, tanggal, tipe, nominal, kategori, catatan] = row;
  const daftar = tipe === "pemasukan" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;
  const kategoriData = daftar.find(k => k.id === kategori);
  
  const dateObj = new Date(tanggal);
  return {
    id,
    tanggal: isNaN(dateObj.getTime()) ? new Date() : dateObj,
    tipe: tipe || "pengeluaran",
    nominal: Number(nominal) || 0,
    kategori: kategori || "lainnya",
    catatan: catatan || "",
    kategoriLabel: kategoriData?.label ?? kategori,
    kategoriEmoji: kategoriData?.emoji ?? "📦",
  };
}

function getBulanString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ── CRUD ──────────────────────────────────────────────────────

export async function simpanTransaksi(data, tokens = null) {
  const sheets = getSheetsClient(tokens);
  const id = `txn_${Date.now()}`;
  const tanggal = data.tanggal
    ? new Date(data.tanggal).toISOString()
    : new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        id,
        tanggal,
        data.tipe,
        data.nominal,
        data.kategori,
        data.catatan ?? "",
        data.sumber ?? "web",
      ]],
    },
  });

  return id;
}

export async function getSaldo(tokens = null) {
  const sheets = getSheetsClient(tokens);
  const bulanIni = getBulanString();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  const rows = res.data.values || [];
  let pemasukan = 0;
  let pengeluaran = 0;
  const byKategori = {};
  const perMinggu = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const row of rows) {
    if (row.length < 5) continue;
    const tanggalRow = row[1]?.slice(0, 7);
    if (tanggalRow !== bulanIni) continue;
    
    const nominal = Number(row[3]) || 0;
    if (row[2] === "pemasukan") {
      pemasukan += nominal;
    } else {
      pengeluaran += nominal;
      byKategori[row[4]] = (byKategori[row[4]] ?? 0) + nominal;
      const tgl = new Date(row[1]);
      const minggu = isNaN(tgl.getTime()) ? 1 : Math.ceil(tgl.getDate() / 7);
      perMinggu[Math.min(minggu, 4)] += nominal;
    }
  }

  // Format byKategori untuk chart
  const byKategoriArr = Object.entries(byKategori).map(([id, total]) => {
    const k = KATEGORI_PENGELUARAN.find(k => k.id === id);
    return { id, total, label: k?.label ?? id, emoji: k?.emoji ?? "📦" };
  }).sort((a, b) => b.total - a.total);

  // Format perMinggu untuk chart
  const perMingguArr = Object.entries(perMinggu).map(([minggu, pen]) => ({
    label: `Minggu ${minggu}`,
    pengeluaran: pen,
    pemasukan: 0,
  }));

  return {
    pemasukan,
    pengeluaran,
    saldo: pemasukan - pengeluaran,
    byKategori: byKategoriArr,
    perMinggu: perMingguArr,
  };
}

export async function getLaporan(bulan = null, tokens = null) {
  const sheets = getSheetsClient(tokens);
  const targetBulan = bulan ?? getBulanString();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  const rows = (res.data.values || []).filter(r => r[1]?.slice(0, 7) === targetBulan);
  if (!rows.length) {
    const [tahun, bln] = targetBulan.split("-");
    const label = new Date(Number(tahun), Number(bln) - 1).toLocaleDateString("id-ID", {
      month: "long", year: "numeric",
    });
    return { bulan: label, pemasukan: 0, pengeluaran: 0, saldo: 0, topKategori: [] };
  }

  let pemasukan = 0;
  let pengeluaran = 0;
  const byKategori = {};

  for (const row of rows) {
    const nominal = Number(row[3]) || 0;
    if (row[2] === "pemasukan") {
      pemasukan += nominal;
    } else {
      pengeluaran += nominal;
      byKategori[row[4]] = (byKategori[row[4]] ?? 0) + nominal;
    }
  }

  const topKategori = Object.entries(byKategori)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => {
      const k = KATEGORI_PENGELUARAN.find(k => k.id === id);
      return { id, total, label: k?.label ?? id, emoji: k?.emoji ?? "📦" };
    });

  const [tahun, bln] = targetBulan.split("-");
  const bulanLabel = new Date(Number(tahun), Number(bln) - 1).toLocaleDateString("id-ID", {
    month: "long", year: "numeric",
  });

  return {
    bulan: bulanLabel,
    pemasukan,
    pengeluaran,
    saldo: pemasukan - pengeluaran,
    topKategori,
  };
}

export async function getRiwayat(limit = 10, bulan = null, tokens = null) {
  const sheets = getSheetsClient(tokens);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  let rows = res.data.values || [];

  if (bulan) {
    rows = rows.filter(r => r[1]?.slice(0, 7) === bulan);
  }

  return rows.slice(-limit).reverse().map(rowToTransaksi).filter(Boolean);
}

export async function hapusTransaksiTerakhir(tokens = null) {
  const sheets = getSheetsClient(tokens);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  const rows = res.data.values || [];
  if (!rows.length) return null;

  const lastRowIndex = rows.length + 1; // +1 karena header di row 1
  const rawRow = rows[rows.length - 1];
  const transaksi = rowToTransaksi(rawRow);

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${lastRowIndex}:G${lastRowIndex}`,
  });

  return transaksi;
}
