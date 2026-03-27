// bot/services/sheets.js
// Semua operasi baca/tulis ke Google Sheets

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN, SHEET_NAME, BUDGET_SHEET_NAME } from "../../shared/constants.js";
import { updateEnv } from "../utils/env-updater.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// ── Auth ──────────────────────────────────────────────────────
function getSheetsClient(tokens = null) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Persistence: Save new token if it's refreshed
  auth.on("tokens", (newTokens) => {
    console.log("🔄 Google Token refreshed, saving to .env...");
    // Only update if it's the global token (not from a specific session)
    if (!tokens) {
      const currentTokenRaw = process.env.GOOGLE_TOKEN;
      let currentToken = {};
      try { 
        currentToken = typeof currentTokenRaw === "string" 
          ? JSON.parse(currentTokenRaw) 
          : (currentTokenRaw || {}); 
      } catch(e) {}
      
      const updatedToken = { ...currentToken, ...newTokens };
      const tokenValue = JSON.stringify(updatedToken);
      updateEnv("GOOGLE_TOKEN", tokenValue);
      process.env.GOOGLE_TOKEN = tokenValue; // Store as string for next parsing
    }
  });

  let creds;
  try {
    let rawToken = process.env.GOOGLE_TOKEN;
    if (!rawToken) throw new Error("GOOGLE_TOKEN is empty");

    if (typeof rawToken === "object") {
      creds = tokens ?? rawToken;
    } else {
      try {
        creds = tokens ?? JSON.parse(rawToken);
      } catch (parseErr) {
        // Fallback: handle cases where the string might be extra-escaped
        const unescaped = rawToken.replace(/\\"/g, '"').replace(/^"|"$/g, "");
        creds = tokens ?? JSON.parse(unescaped);
      }
    }
  } catch (e) {
    console.error("⚠️ GOOGLE_TOKEN di .env tidak valid atau kosong. Silakan jalankan setup:token.");
    creds = tokens || {}; 
  }

  if (Object.keys(creds).length === 0) {
    throw new Error("Kredensial Google kosong. Silakan jalankan 'npm run setup:token'.");
  }

  auth.setCredentials(creds);
  return google.sheets({ version: "v4", auth });
}

function getSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id || id.includes("your_spreadsheet_id") || id.length < 10) {
    throw new Error("GOOGLE_SHEETS_ID tidak valid di .env. Pastikan sudah diisi dengan ID spreadsheet kamu.");
  }
  return id;
}

// Cache mapping to avoid repeated sheet reads
let cachedMapping = null;

async function getColumnMapping(tokens = null) {
  if (cachedMapping) return cachedMapping;
  
  const sheets = getSheetsClient(tokens);
  const spreadsheetId = getSpreadsheetId();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${SHEET_NAME}!A1:Z1`, // Get first row
    });
    const headers = res.data.values?.[0] || [];
    const mapping = {
      ID: headers.indexOf("ID"),
      TANGGAL: headers.indexOf("Tanggal"),
      TIPE: headers.indexOf("Tipe"),
      NOMINAL: headers.indexOf("Nominal"),
      KATEGORI: headers.indexOf("Kategori"),
      CATATAN: headers.indexOf("Catatan"),
      SUMBER: headers.indexOf("Sumber"),
    };
    
    // Check if critical columns are missing
    if (mapping.TIPE === -1 || mapping.NOMINAL === -1) {
      console.warn("⚠️ Column headers missing or misnamed in sheet. Falling back to defaults.");
      return { ID: 0, TANGGAL: 1, TIPE: 2, NOMINAL: 3, KATEGORI: 4, CATATAN: 5, SUMBER: 6 };
    }
    
    cachedMapping = mapping;
    return mapping;
  } catch (err) {
    console.warn("Gagal ambil mapping kolom:", err.message);
    return { ID: 0, TANGGAL: 1, TIPE: 2, NOMINAL: 3, KATEGORI: 4, CATATAN: 5, SUMBER: 6 };
  }
}

// ── Initialization ───────────────────────────────────────────
// Memastikan sheet "Transaksi" ada dengan header yang benar
export async function pastikanSheetSiap(tokens = null) {
  const sheets = getSheetsClient(tokens);
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    
    // 1. Cek sheet Transaksi
    const sheetExists = spreadsheet.data.sheets.some(s => s.properties.title === SHEET_NAME);
    if (!sheetExists) {
      console.log(`📝 Membuat sheet "${SHEET_NAME}"...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1:G1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["ID", "Tanggal", "Tipe", "Nominal", "Kategori", "Catatan", "Sumber"]]
        }
      });
    }

    // Initialize/warmup column mapping
    await getColumnMapping(tokens);

    // 2. Cek sheet Anggaran
    const budgetExists = spreadsheet.data.sheets.some(s => s.properties.title === BUDGET_SHEET_NAME);
    if (!budgetExists) {
      console.log(`📝 Membuat sheet "${BUDGET_SHEET_NAME}"...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: BUDGET_SHEET_NAME } } }]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${BUDGET_SHEET_NAME}!A1:B1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Kategori ID", "Limit Nominal"]]
        }
      });
    }
  } catch (err) {
    console.error("❌ Gagal inisialisasi sheet:", err.message);
    throw err;
  }
}

// ── Budgeting ────────────────────────────────────────────────

export async function getBudgets(tokens = null) {
  const sheets = getSheetsClient(tokens);
  const spreadsheetId = getSpreadsheetId();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${BUDGET_SHEET_NAME}!A2:B`,
    });
    const rows = res.data.values || [];
    const budgets = {};
    rows.forEach(row => {
      if (row[0]) budgets[row[0]] = Number(row[1]) || 0;
    });
    return budgets;
  } catch (err) {
    console.warn("Gagal ambil anggaran:", err.message);
    return {};
  }
}

// ── Helpers ───────────────────────────────────────────────────
function rowToTransaksi(row, mapping) {
  if (!row || row.length === 0) return null;
  
  const id       = row[mapping.ID];
  const tanggal  = row[mapping.TANGGAL];
  const tipe     = row[mapping.TIPE];
  const nominal  = row[mapping.NOMINAL];
  const kategori = row[mapping.KATEGORI];
  const catatan  = row[mapping.CATATAN];

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
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();
  const id = `txn_${Date.now()}`;
  const tanggal = data.tanggal
    ? new Date(data.tanggal).toISOString()
    : new Date().toISOString();

  // Create a balanced row based on mapping length
  const maxIdx = Math.max(...Object.values(mapping));
  const newRow = new Array(maxIdx + 1).fill("");
  
  newRow[mapping.ID]       = id;
  newRow[mapping.TANGGAL]  = tanggal;
  newRow[mapping.TIPE]     = data.tipe;
  newRow[mapping.NOMINAL]  = data.nominal;
  newRow[mapping.KATEGORI] = data.kategori;
  newRow[mapping.CATATAN]  = data.catatan ?? "";
  newRow[mapping.SUMBER]   = data.sumber ?? "web";

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [newRow],
    },
  });

  return id;
}

export async function getSaldo(tokens = null) {
  const sheets = getSheetsClient(tokens);
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();
  const bulanIni = getBulanString();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });

  const rows = res.data.values || [];
  let pemasukan = 0;
  let pengeluaran = 0;
  const byKategori = {};
  const perMinggu = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const tglRaw = row[mapping.TANGGAL];
    if (!tglRaw) continue; // Skip if date is missing

    const tanggalRow = tglRaw.slice(0, 7);
    if (tanggalRow !== bulanIni) continue;
    
    const nominal = Number(row[mapping.NOMINAL]) || 0;
    const tipe = row[mapping.TIPE];
    const kategori = row[mapping.KATEGORI];

    if (tipe === "pemasukan") {
      pemasukan += nominal;
    } else {
      pengeluaran += nominal;
      if (kategori) {
        byKategori[kategori] = (byKategori[kategori] ?? 0) + nominal;
      }
      const tgl = new Date(tglRaw);
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
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();
  const targetBulan = bulan ?? getBulanString();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });

  const rows = (res.data.values || []).filter(r => r[mapping.TANGGAL]?.slice(0, 7) === targetBulan);
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
    const nominal = Number(row[mapping.NOMINAL]) || 0;
    if (row[mapping.TIPE] === "pemasukan") {
      pemasukan += nominal;
    } else {
      pengeluaran += nominal;
      byKategori[row[mapping.KATEGORI]] = (byKategori[row[mapping.KATEGORI]] ?? 0) + nominal;
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
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });

  let rows = res.data.values || [];

  if (bulan) {
    rows = rows.filter(r => r[mapping.TANGGAL]?.slice(0, 7) === bulan);
  }

  return rows.slice(-limit).reverse().map(r => rowToTransaksi(r, mapping)).filter(Boolean);
}

export async function arsipDataLama(tokens = null) {
  const sheets = getSheetsClient(tokens);
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();
  const bulanIni = getBulanString();

  // 1. Ambil semua data dari Transaksi
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });

  const allRows = res.data.values || [];
  if (!allRows.length) return { archived: 0 };

  // 2. Filter data yang BUKAN bulan ini
  const rowsToArchive = allRows.filter(row => {
    const tgl = row[mapping.TANGGAL]?.slice(0, 7);
    return tgl && tgl < bulanIni;
  });

  if (!rowsToArchive.length) return { archived: 0 };

  // 3. Kelompokkan berdasarkan bulan untuk nama sheet arsip
  const groups = {};
  rowsToArchive.forEach(row => {
    const tgl = row[mapping.TANGGAL]?.slice(0, 7).replace("-", "_");
    if (!groups[tgl]) groups[tgl] = [];
    groups[tgl].push(row);
  });

  // 4. Pindahkan ke sheet arsip masing-masing
  for (const [bulan, data] of Object.entries(groups)) {
    const archiveName = `Arsip_${bulan}`;
    
    // Pastikan sheet arsip ada
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = spreadsheet.data.sheets.some(s => s.properties.title === archiveName);
    
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: archiveName } } }] }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${archiveName}!A1:G1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["ID", "Tanggal", "Tipe", "Nominal", "Kategori", "Catatan", "Sumber"]] }
      });
    }

    // Append data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${archiveName}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: data }
    });
  }

  // 5. Hapus data yang sudah diarsip dari sheet utama
  // Strategi termudah: Tulis ulang sheet Transaksi hanya dengan data bulan ini
  const rowsToKeep = allRows.filter(row => row[mapping.TANGGAL]?.slice(0, 7) >= bulanIni);
  
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });

  if (rowsToKeep.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A2`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rowsToKeep }
    });
  }

  return { archived: rowsToArchive.length };
}

export async function hapusTransaksiById(id, tokens = null) {
  const sheets = getSheetsClient(tokens);
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`, // Assuming ID is in col A or first col
  });

  const rows = res.data.values || [];
  // Find column index for ID
  const idColIdx = mapping.ID;
  
  // Re-fetch only ID column if ID mapping is not 0
  let realRows = rows;
  if (idColIdx !== 0) {
    const resId = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!${String.fromCharCode(65 + idColIdx)}:${String.fromCharCode(65 + idColIdx)}`,
    });
    realRows = resId.data.values || [];
  }

  const rowIndex = realRows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return null;

  const realRowIndex = rowIndex + 1; // 1-based index

  // Ambil data sebelum dihapus untuk konfirmasi
  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A${realRowIndex}:G${realRowIndex}`,
  });
  const transaksi = rowToTransaksi(dataRes.data.values[0], mapping);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_NAME}!A${realRowIndex}:G${realRowIndex}`,
  });

  return transaksi;
}

export async function hapusTransaksiTerakhir(tokens = null) {
  const sheets = getSheetsClient(tokens);
  const mapping = await getColumnMapping(tokens);
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });

  const rows = res.data.values || [];
  if (!rows.length) return null;

  const lastRowIndex = rows.length + 1; // +1 karena header di row 1
  const rawRow = rows[rows.length - 1];
  const transaksi = rowToTransaksi(rawRow, mapping);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_NAME}!A${lastRowIndex}:G${lastRowIndex}`,
  });

  return transaksi;
}
