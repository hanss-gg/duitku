// dashboard/src/components/TransaksiItem.jsx
import { formatRupiah, formatTanggal } from "../utils/formatter.js";

export default function TransaksiItem({ transaksi: t, showDate = false }) {
  const isIn = t.tipe === "pemasukan";
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
        {t.kategoriEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {t.catatan || t.kategoriLabel}
        </p>
        {showDate && (
          <p className="text-xs text-slate-500">{formatTanggal(t.tanggal)}</p>
        )}
      </div>
      <p className={`text-rupiah text-sm font-bold flex-shrink-0 ${isIn ? "text-emerald-400" : "text-rose-400"}`}>
        {isIn ? "+" : "-"}{formatRupiah(t.nominal)}
      </p>
    </div>
  );
}
