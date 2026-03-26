// dashboard/src/utils/api.js
const BASE = import.meta.env.VITE_API_URL;

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const fetchSaldo      = ()       => req("/api/saldo");
export const fetchRiwayat    = (n, b)   => req(`/api/riwayat?limit=${n}${b ? `&bulan=${b}` : ""}`);
export const fetchLaporan    = (bulan)  => req(`/api/laporan?bulan=${bulan}`);
export const simpanTransaksi = (data)   => req("/api/transaksi", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
