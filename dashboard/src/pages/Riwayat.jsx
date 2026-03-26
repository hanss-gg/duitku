// dashboard/src/pages/Riwayat.jsx
import { useState } from "react";
import { useRiwayat } from "../hooks/useData.js";
import TransaksiItem from "../components/TransaksiItem.jsx";

export default function Riwayat() {
  const [bulan, setBulan] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filter, setFilter] = useState("semua");
  const { transaksi, loading } = useRiwayat(bulan);

  const filtered = transaksi.filter(t =>
    filter === "semua" ? true : t.tipe === filter
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Riwayat</h2>
      </div>

      {/* Filter Header */}
      <div className="space-y-4">
        <div className="card p-2 flex gap-2">
          <input
            type="month"
            value={bulan}
            onChange={e => setBulan(e.target.value)}
            className="w-full bg-transparent text-white font-medium outline-none px-2 appearance-none color-scheme-dark"
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Pill Filters */}
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
          {["semua", "pengeluaran", "pemasukan"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                filter === f
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-20 card animate-pulse border-white/5" />
          ))
        ) : filtered.length === 0 ? (
          <div className="card p-12 border-dashed flex flex-col items-center justify-center text-center opacity-70 mt-8">
            <span className="text-5xl mb-4 grayscale">📭</span>
            <p className="text-sm font-semibold text-slate-300">Tidak ada riwayat</p>
            <p className="text-xs text-slate-500 mt-1">Belum ada transaksi di bulan ini</p>
          </div>
        ) : (
          filtered.map((t, index) => (
            <div 
              key={t.id} 
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <TransaksiItem transaksi={t} showDate />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
