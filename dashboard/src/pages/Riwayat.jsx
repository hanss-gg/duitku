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
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Riwayat</h2>

      {/* Filter bulan */}
      <input
        type="month"
        value={bulan}
        onChange={e => setBulan(e.target.value)}
        className="w-full card px-4 py-2 text-slate-300 bg-transparent outline-none"
      />

      {/* Filter tipe */}
      <div className="flex gap-2">
        {["semua", "pengeluaran", "pemasukan"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-indigo-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-16">
          <p className="text-4xl mb-3">📭</p>
          <p>Tidak ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => <TransaksiItem key={t.id} transaksi={t} showDate />)}
        </div>
      )}
    </div>
  );
}
