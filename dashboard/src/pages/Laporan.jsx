// dashboard/src/pages/Laporan.jsx
import { useState } from "react";
import { useLaporan } from "../hooks/useData.js";
import { formatRupiah } from "../utils/formatter.js";

export default function Laporan() {
  const [bulan, setBulan] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const { laporan, loading } = useLaporan(bulan);

  const surplus = (laporan?.saldo ?? 0) >= 0;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Laporan</h2>

      <input
        type="month"
        value={bulan}
        onChange={e => setBulan(e.target.value)}
        className="w-full card px-4 py-2 text-slate-300 bg-transparent outline-none"
      />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-2xl" />)}
        </div>
      ) : !laporan ? (
        <div className="text-center text-slate-500 py-16">
          <p className="text-4xl mb-3">📊</p>
          <p>Tidak ada data bulan ini</p>
        </div>
      ) : (
        <>
          {/* Status */}
          <div className={`card p-5 border ${surplus ? "border-emerald-500/30" : "border-rose-500/30"}`}>
            <p className="text-xs text-slate-400 mb-1">Status Bulan Ini</p>
            <p className={`text-rupiah text-3xl ${surplus ? "text-emerald-400" : "text-rose-400"}`}>
              {formatRupiah(laporan.saldo)}
            </p>
            <p className={`text-sm mt-2 font-medium ${surplus ? "text-emerald-400" : "text-rose-400"}`}>
              {surplus ? "✅ Surplus — Keuangan aman!" : "⚠️ Defisit — Perhatikan pengeluaran"}
            </p>
          </div>

          {/* Ringkasan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-xs text-slate-400">📈 Total Pemasukan</p>
              <p className="text-rupiah text-lg text-emerald-400 mt-1">{formatRupiah(laporan.pemasukan)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-400">📉 Total Pengeluaran</p>
              <p className="text-rupiah text-lg text-rose-400 mt-1">{formatRupiah(laporan.pengeluaran)}</p>
            </div>
          </div>

          {/* Top kategori */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-300 mb-4">Top Pengeluaran</p>
            <div className="space-y-3">
              {laporan.topKategori.map((k, i) => {
                const pct = laporan.pengeluaran > 0
                  ? Math.round((k.total / laporan.pengeluaran) * 100) : 0;
                return (
                  <div key={k.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{k.emoji} {k.label}</span>
                      <span className="text-slate-400">{formatRupiah(k.total)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Perbandingan bulan lalu */}
          {laporan.vsBulanLalu != null && (
            <div className="card p-4">
              <p className="text-xs text-slate-400">vs Bulan Lalu</p>
              <p className={`text-sm font-semibold mt-1 ${laporan.vsBulanLalu <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {laporan.vsBulanLalu > 0 ? "+" : ""}{laporan.vsBulanLalu}% pengeluaran
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
