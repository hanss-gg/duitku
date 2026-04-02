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
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-2xl font-bold tracking-tight text-white">Laporan</h2>

      <div className="card p-2">
        <input
          type="month"
          value={bulan}
          onChange={e => setBulan(e.target.value)}
          className="w-full bg-transparent text-white font-medium outline-none px-2 appearance-none color-scheme-dark"
          style={{ colorScheme: "dark" }}
        />
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 card border-white/5" />
          <div className="grid grid-cols-2 gap-3">
             <div className="h-24 card border-white/5" />
             <div className="h-24 card border-white/5" />
          </div>
          <div className="h-64 card border-white/5" />
        </div>
      ) : !laporan ? (
        <div className="card p-12 border-dashed flex flex-col items-center justify-center text-center opacity-70 mt-8">
          <span className="text-5xl mb-4 grayscale">📊</span>
          <p className="text-sm font-semibold text-slate-300">Data Kosong</p>
          <p className="text-xs text-slate-500 mt-1">Tidak ada transaksi untuk dianalisis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Status Card */}
          <div className={`card p-6 relative overflow-hidden group ${surplus ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-700 ${surplus ? "bg-emerald-500" : "bg-rose-500"}`} />
            
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Net Saldo</p>
              <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${surplus ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                 {surplus ? "Surplus" : "Defisit"}
              </div>
            </div>
            
            <p className={`text-rupiah break-all mb-1 leading-[1.1] ${surplus ? "text-emerald-400" : "text-rose-400"} ${laporan.saldo.toString().length > 10 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
              {formatRupiah(laporan.saldo)}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate">
              {surplus ? "Keuanganmu sangat sehat bulan ini! 🎉" : "Perhatian: Pengeluaran melebihi pemasukan. ⚠️"}
            </p>
          </div>

          {/* Flow Cards */}
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <div className="card p-4 hover:border-emerald-500/30 transition-colors flex flex-col justify-between overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1 flex-shrink-0">
                <span className="text-emerald-400">↓</span> Pemasukan
              </p>
              <p className={`text-rupiah text-white break-words leading-tight ${laporan.pemasukan.toString().length > 10 ? "text-xs" : laporan.pemasukan.toString().length > 7 ? "text-sm" : "text-lg"}`}>
                {formatRupiah(laporan.pemasukan, laporan.pemasukan.toString().length > 8)}
              </p>
            </div>
            <div className="card p-4 hover:border-rose-500/30 transition-colors flex flex-col justify-between overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1 flex-shrink-0">
                <span className="text-rose-400">↑</span> Pengeluaran
              </p>
              <p className={`text-rupiah text-white break-words leading-tight ${laporan.pengeluaran.toString().length > 10 ? "text-xs" : laporan.pengeluaran.toString().length > 7 ? "text-sm" : "text-lg"}`}>
                {formatRupiah(laporan.pengeluaran, laporan.pengeluaran.toString().length > 8)}
              </p>
            </div>
          </div>

          {/* Top Pengeluaran (Budget Bars) */}
          <div className="card p-6">
            <p className="text-sm font-bold text-slate-200 mb-5 uppercase tracking-wider">Distribusi Pengeluaran</p>
            <div className="space-y-4">
              {laporan.topKategori.map((k, i) => {
                const pct = laporan.pengeluaran > 0 ? Math.round((k.total / laporan.pengeluaran) * 100) : 0;
                // Alternate bar colors
                const barColor = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5];
                
                return (
                  <div key={k.id} className="group">
                    <div className="flex justify-between items-start text-sm mb-1.5 gap-3">
                      <span className="font-medium text-slate-300 flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xs">{k.emoji}</span>
                        <span className="truncate text-xs font-bold tracking-tight">{k.label}</span>
                      </span>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-white font-black leading-tight tracking-tight text-rupiah ${k.total.toString().length > 9 ? "text-xs" : "text-sm"}`}>
                          {formatRupiah(k.total, k.total.toString().length > 10)}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{pct}% of total</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-125"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
