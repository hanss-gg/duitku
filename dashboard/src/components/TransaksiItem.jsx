// dashboard/src/components/TransaksiItem.jsx
import { formatRupiah, formatTanggal } from "../utils/formatter.js";

const KATEGORI_COLORS = {
  makan:     "bg-orange-500/20 text-orange-400",
  transport: "bg-blue-500/20 text-blue-400",
  kuliah:    "bg-emerald-500/20 text-emerald-400",
  hiburan:   "bg-purple-500/20 text-purple-400",
  kesehatan: "bg-rose-500/20 text-rose-400",
  belanja:   "bg-pink-500/20 text-pink-400",
  kos:       "bg-indigo-500/20 text-indigo-400",
  kiriman:   "bg-emerald-500/20 text-emerald-400",
  beasiswa:  "bg-blue-500/20 text-blue-400",
  freelance: "bg-amber-500/20 text-amber-400",
  lainnya:   "bg-slate-500/20 text-slate-400",
};

export default function TransaksiItem({ transaksi: t, showDate = false }) {
  const isIn = t.tipe === "pemasukan";
  const colorClass = KATEGORI_COLORS[t.kategori] || KATEGORI_COLORS.lainnya;

  return (
    <div className="card px-4 py-3 flex items-center gap-4 transition-all active:scale-[0.98] cursor-pointer group">
      <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
        {t.kategoriEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
          {t.catatan || t.kategoriLabel}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {t.kategoriLabel}
          </span>
          {showDate && (
            <p className="text-[10px] text-slate-500 font-medium">{formatTanggal(t.tanggal)}</p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2 max-w-[40%]">
        <p className={`text-rupiah font-black tracking-tight break-all leading-tight ${isIn ? "text-emerald-400" : "text-rose-400"} ${t.nominal.toString().length > 8 ? "text-xs" : "text-sm"}`}>
          {isIn ? "+" : ""}{formatRupiah(t.nominal, t.nominal.toString().length > 9)}
        </p>
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">IDR</p>
      </div>
    </div>
  );
}
