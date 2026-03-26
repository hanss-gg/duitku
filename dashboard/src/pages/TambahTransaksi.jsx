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
      setError("Nominal dan kategori wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await simpanTransaksi({ tipe, nominal: Number(nominal), kategori, catatan, tanggal, sumber: "web" });
      onSelesai();
    } catch {
      setError("Gagal menyimpan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onSelesai} className="text-slate-400 hover:text-white transition">←</button>
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Tambah Transaksi</h2>
      </div>

      {/* Tipe */}
      <div className="grid grid-cols-2 gap-2">
        {["pengeluaran", "pemasukan"].map(t => (
          <button
            key={t}
            onClick={() => { setTipe(t); setKategori(""); }}
            className={`py-3 rounded-2xl font-semibold text-sm capitalize transition-all ${
              tipe === t
                ? t === "pengeluaran" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                : "card text-slate-400"
            }`}
          >
            {t === "pengeluaran" ? "📉 Pengeluaran" : "📈 Pemasukan"}
          </button>
        ))}
      </div>

      {/* Nominal */}
      <div className="card p-4">
        <label className="text-xs text-slate-400 block mb-2">Nominal (Rp)</label>
        <input
          type="number"
          value={nominal}
          onChange={e => setNominal(e.target.value)}
          placeholder="25000"
          className="w-full bg-transparent text-rupiah text-2xl text-white outline-none placeholder:text-slate-700"
        />
      </div>

      {/* Kategori */}
      <div>
        <p className="text-xs text-slate-400 mb-2">Kategori</p>
        <div className="grid grid-cols-4 gap-2">
          {daftarKategori.map(k => (
            <button
              key={k.id}
              onClick={() => setKategori(k.id)}
              className={`card p-3 flex flex-col items-center gap-1 transition-all ${
                kategori === k.id ? "border-indigo-500 bg-indigo-500/10" : ""
              }`}
            >
              <span className="text-xl">{k.emoji}</span>
              <span className="text-xs text-slate-400 text-center leading-tight">{k.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Catatan */}
      <div className="card p-4">
        <label className="text-xs text-slate-400 block mb-2">Catatan (opsional)</label>
        <input
          type="text"
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          placeholder="mis: makan siang dengan teman"
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-700"
        />
      </div>

      {/* Tanggal */}
      <div className="card p-4">
        <label className="text-xs text-slate-400 block mb-2">Tanggal</label>
        <input
          type="date"
          value={tanggal}
          onChange={e => setTanggal(e.target.value)}
          className="w-full bg-transparent text-white outline-none"
        />
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-2xl font-semibold transition-all active:scale-95"
      >
        {loading ? "Menyimpan..." : "✅ Simpan Transaksi"}
      </button>
    </div>
  );
}
