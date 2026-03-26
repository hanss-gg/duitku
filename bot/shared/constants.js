// shared/constants.js
// Konstanta yang dipakai bersama oleh dashboard dan bot

export const KATEGORI_PENGELUARAN = [
  { id: "makan",      label: "Makan & Minum",     emoji: "🍜", keywords: ["makan", "minum", "kopi", "warteg", "restoran", "jajan", "sarapan", "lunch", "dinner"] },
  { id: "transport",  label: "Transport",          emoji: "🚌", keywords: ["gojek", "grab", "bensin", "parkir", "kereta", "bus", "ojek"] },
  { id: "kuliah",     label: "Keperluan Kuliah",   emoji: "📚", keywords: ["buku", "fotocopy", "print", "ukm", "organisasi", "almamater"] },
  { id: "hiburan",    label: "Hiburan",            emoji: "🎮", keywords: ["nonton", "bioskop", "game", "topup", "spotify", "netflix", "healing"] },
  { id: "kesehatan",  label: "Kesehatan",          emoji: "💊", keywords: ["obat", "apotek", "dokter", "rs", "masker", "vitamin"] },
  { id: "belanja",    label: "Belanja",            emoji: "👕", keywords: ["baju", "sepatu", "skincare", "tas", "shopee", "tokopedia"] },
  { id: "kos",        label: "Kos / Utilitas",     emoji: "🏠", keywords: ["kos", "listrik", "air", "wifi", "pulsa", "kuota"] },
  { id: "lainnya",    label: "Lainnya",            emoji: "📦", keywords: [] },
];

export const KATEGORI_PEMASUKAN = [
  { id: "kiriman",    label: "Kiriman Ortu",       emoji: "💰", keywords: ["ortu", "ayah", "ibu", "mama", "papa", "transfer"] },
  { id: "beasiswa",   label: "Beasiswa",           emoji: "🎓", keywords: ["beasiswa", "kip", "award"] },
  { id: "freelance",  label: "Freelance / Kerja",  emoji: "💼", keywords: ["gaji", "honor", "proyek", "kerja", "jualan", "untung"] },
  { id: "lainnya",    label: "Lainnya",            emoji: "🎁", keywords: [] },
];

export const SHEET_COLUMNS = {
  ID:        "A",
  TANGGAL:   "B",
  TIPE:      "C",
  NOMINAL:   "D",
  KATEGORI:  "E",
  CATATAN:   "F",
  SUMBER:    "G", // "bot" atau "web"
};

export const SHEET_NAME = "Transaksi";
