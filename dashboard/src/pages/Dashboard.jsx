// dashboard/src/pages/Dashboard.jsx
import { useData } from "../hooks/useData.js";
import { formatRupiah } from "../utils/formatter.js";
import DonatChart from "../components/DonatChart.jsx";
import BarChart from "../components/BarChart.jsx";
import TransaksiItem from "../components/TransaksiItem.jsx";

export default function Dashboard({ onTambah }) {
  const { saldo, ringkasan, transaksiTerbaru, loading } = useData();

  if (loading) return <Skeleton />;

  const surplus = ringkasan.saldo >= 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-slate-400 text-sm font-medium">Saldo Bulan Ini</p>
        <h1 className={`text-rupiah text-4xl mt-1 ${surplus ? "text-emerald-400" : "text-rose-400"}`}>
          {formatRupiah(ringkasan.saldo)}
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Pemasukan & Pengeluaran */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-400 mb-1">📈 Pemasukan</p>
          <p className="text-rupiah text-lg text-emerald-400">{formatRupiah(ringkasan.pemasukan)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 mb-1">📉 Pengeluaran</p>
          <p className="text-rupiah text-lg text-rose-400">{formatRupiah(ringkasan.pengeluaran)}</p>
        </div>
      </div>

      {/* Grafik Donat */}
      {ringkasan.byKategori?.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-300 mb-4">Pengeluaran per Kategori</p>
          <DonatChart data={ringkasan.byKategori} />
        </div>
      )}

      {/* Grafik Bar */}
      {ringkasan.perMinggu?.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-300 mb-4">Tren Mingguan</p>
          <BarChart data={ringkasan.perMinggu} />
        </div>
      )}

      {/* Transaksi Terbaru */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">Transaksi Terbaru</p>
        <div className="space-y-2">
          {transaksiTerbaru.map(t => <TransaksiItem key={t.id} transaksi={t} />)}
        </div>
      </div>

      {/* Tombol Tambah */}
      <button
        onClick={onTambah}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
      >
        +
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-12 bg-slate-800 rounded-xl w-48" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-slate-800 rounded-2xl" />
        <div className="h-20 bg-slate-800 rounded-2xl" />
      </div>
      <div className="h-56 bg-slate-800 rounded-2xl" />
    </div>
  );
}
