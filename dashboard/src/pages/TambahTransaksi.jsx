// dashboard/src/pages/TambahTransaksi.jsx
import { useState } from "react";
import { KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN } from "@shared/constants.js";
import { simpanTransaksi } from "../utils/api.js";

export default function TambahTransaksi({ onSelesai }) {
  const [tipe, setTipe] = useState("pengeluaran");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daftarKategori = tipe === "pengeluaran" ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN;

  async function handleSubmit() {
    if (!nominal || !kategori) {
      setError("⚠️ Nominal dan kategori wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await simpanTransaksi({ tipe, nominal: Number(nominal), kategori, catatan, tanggal, sumber: "web" });
      onSelesai();
    } catch {
      setError("❌ Gagal menyimpan, coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onSelesai} 
          className="w-10 h-10 card flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors active:scale-90"
        >
          <span className="text-slate-300">←</span>
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-white">Catat Baru</h2>
      </div>

      {/* Tipe Toggle */}
      <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
        {["pengeluaran", "pemasukan"].map(t => (
          <button
            key={t}
            onClick={() => { setTipe(t); setKategori(""); setError(""); }}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
              tipe === t
                ? t === "pengeluaran" 
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" 
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "pengeluaran" ? "Pengeluaran" : "Pemasukan"}
          </button>
        ))}
      </div>

      {/* Nominal Input */}
      <div className="card p-5 group focus-within:border-indigo-500/50 transition-colors">
        <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 block">Nominal (IDR)</label>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-500">Rp</span>
          <input
            type="number"
            value={nominal}
            onChange={e => setNominal(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-rupiah text-5xl text-white outline-none placeholder:text-slate-700/50 focus:placeholder:text-transparent transition-all"
          />
        </div>
      </div>

      {/* Kategori Grid */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Pilih Kategori</p>
        <div className="grid grid-cols-4 gap-2">
          {daftarKategori.map(k => {
            const isSelected = kategori === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setKategori(k.id)}
                className={`card p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                  isSelected 
                    ? `border-${tipe === 'pengeluaran' ? 'rose' : 'emerald'}-500/50 bg-${tipe === 'pengeluaran' ? 'rose' : 'emerald'}-500/10` 
                    : "hover:bg-white/5"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform ${isSelected ? "scale-110 bg-white/10" : "bg-slate-800"}`}>
                  {k.emoji}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tighter text-center leading-tight ${isSelected ? "text-white" : "text-slate-400"}`}>
                  {k.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catatan & Tanggal */}
      <div className="grid gap-3">
        <div className="card p-4 focus-within:border-indigo-500/50 transition-colors">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Catatan Opsional</label>
          <input
            type="text"
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder="Mis: Kopi susu janji jiwa"
            className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="card p-4 focus-within:border-indigo-500/50 transition-colors">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={e => setTanggal(e.target.value)}
            className="w-full bg-transparent text-white text-sm font-medium outline-none color-scheme-dark"
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-rose-400 text-xs font-bold text-center">{error}</p>
        </div>
      )}

      {/* Submit Action */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${
            loading 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : `bg-gradient-to-r text-white shadow-lg ${
                  tipe === 'pengeluaran' 
                    ? "from-rose-500 to-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40" 
                    : "from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                }`
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
             "Simpan Transaksi"
          )}
        </button>
      </div>
    </div>
  );
}
