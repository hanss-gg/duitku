// dashboard/src/pages/Dashboard.jsx
import { useState } from "react";
import { useData } from "../hooks/useData.js";
import { formatRupiah } from "../utils/formatter.js";
import DonatChart from "../components/DonatChart.jsx";
import TrendChart from "../components/TrendChart.jsx";
import BarChart from "../components/BarChart.jsx";
import TransaksiItem from "../components/TransaksiItem.jsx";

export default function Dashboard({ onTambah, onNav }) {
  const { ringkasan, transaksiTerbaru, loading } = useData();
  const [chartType, setChartType] = useState("trend"); // trend | bar

  if (loading) return <Skeleton />;

  const surplus = ringkasan.saldo >= 0;
  
  // Greeting Logic
  const hour = new Date().getHours();
  let greeting = "Selamat Malam";
  let icon = "🌙";
  if (hour < 11) { greeting = "Selamat Pagi"; icon = "☀️"; }
  else if (hour < 15) { greeting = "Selamat Siang"; icon = "🌤️"; }
  else if (hour < 19) { greeting = "Selamat Sore"; icon = "🌆"; }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Greeting */}
      <div className="flex justify-between items-start px-1">
        <div>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span className="text-sm">{icon}</span> {greeting}
          </p>
          <h2 className="text-slate-100 text-xl font-bold mt-0.5">Hai, Harold! 👋</h2>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Periode</p>
          <p className="text-slate-300 text-xs font-semibold">
            {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4 items-stretch">
        
        {/* Total Balance - Large (Full Width) */}
        <div className="col-span-2 card p-6 bg-gradient-to-br from-indigo-600/20 to-transparent border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
          <p className="text-indigo-300/80 text-[10px] font-bold uppercase tracking-widest mb-1">Sisa Uang Jajan</p>
          <h1 className={`text-rupiah transition-colors duration-500 break-all leading-[1.1] ${surplus ? "text-emerald-400" : "text-rose-400"} ${ringkasan.saldo.toString().length > 10 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
            {formatRupiah(ringkasan.saldo)}
          </h1>
          <div className="mt-4 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${surplus ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
              {surplus ? "Aman" : "Defisit"}
            </span>
            <p className="text-slate-500 text-[10px] font-medium italic">
              *Tersisa {(30 - new Date().getDate())} hari lagi
            </p>
          </div>
        </div>

        {/* Small Stats: Pemasukan */}
        <div className="card p-4 bg-emerald-500/5 border-emerald-500/10 flex flex-col justify-between overflow-hidden">        
          <p className="text-[9px] text-emerald-500/60 uppercase tracking-widest font-black mb-1">Pemasukan</p>
          <p className={`text-emerald-400 font-bold whitespace-nowrap leading-tight ${ringkasan.pemasukan.toString().length > 6 ? "text-sm" : "text-base sm:text-lg"}`}>
            +{formatRupiah(ringkasan.pemasukan, ringkasan.pemasukan.toString().length > 6)}
          </p>
        </div>

        {/* Small Stats: Pengeluaran */}
        <div className="card p-4 bg-rose-500/5 border-rose-500/10 flex flex-col justify-between overflow-hidden">
          <p className="text-[9px] text-rose-500/60 uppercase tracking-widest font-black mb-1">Pengeluaran</p>
          <p className={`text-rose-400 font-bold whitespace-nowrap leading-tight ${ringkasan.pengeluaran.toString().length > 6 ? "text-sm" : "text-base sm:text-lg"}`}>
            -{formatRupiah(ringkasan.pengeluaran, ringkasan.pengeluaran.toString().length > 6)}
          </p>
        </div>
        {/* Trend Chart - Large (Full Width) */}
        {ringkasan.perMinggu?.length > 0 && (
          <div className="col-span-2 card p-5 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">Tren Aktivitas</p>
                <p className="text-[10px] text-slate-500">Bulan ini vs Bulan lalu</p>
              </div>
              
              <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-white/5">
                <button onClick={() => setChartType("bar")} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${chartType === "bar" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>Bar</button>
                <button onClick={() => setChartType("trend")} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${chartType === "trend" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>Trend</button>
              </div>
            </div>
            
            <div className="h-48 -mx-2">
              {chartType === "trend" ? <TrendChart data={ringkasan.perMinggu} /> : <BarChart data={ringkasan.perMinggu} />}
            </div>
          </div>
        )}

        {/* Category Breakdown - Half Width (Mobile focus) */}
        {ringkasan.byKategori?.length > 0 && (
          <div className="col-span-2 card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">Alokasi Jajan</p>
              <button onClick={() => onNav("laporan")} className="text-[10px] text-indigo-400 font-bold uppercase hover:underline">Detail →</button>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-1/3 flex-shrink-0">
                 <DonatChart data={ringkasan.byKategori.slice(0, 5)} />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                {ringkasan.byKategori.slice(0, 3).map((cat, i) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold gap-2">
                      <span className="text-slate-400 truncate flex-1">{cat.emoji} {cat.label}</span>
                      <span className="text-slate-200 flex-shrink-0">{formatRupiah(cat.total, true)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((cat.total / ringkasan.pengeluaran) * 100, 100)}%`, backgroundColor: ["#6366f1", "#10b981", "#f59e0b"][i] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <p className="text-sm font-bold text-slate-200">Riwayat Terakhir</p>
          <button 
            onClick={() => onNav("riwayat")}
            className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors"
          >
            Lihat Semua
          </button>
        </div>
        <div className="space-y-2.5">
          {transaksiTerbaru.length > 0 ? (
             transaksiTerbaru.map(t => <TransaksiItem key={t.id} transaksi={t} />)
          ) : (
            <div className="card p-8 border-dashed flex flex-col items-center justify-center text-center opacity-50">
              <span className="text-3xl mb-2">🧊</span>
              <p className="text-xs font-medium">Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={onTambah}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/40 transition-all active:scale-90 hover:rotate-90 duration-300"
        >
          <span className="text-white font-light">+</span>
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex justify-between items-center">
        <div className="h-10 bg-slate-800 rounded-lg w-32" />
        <div className="h-8 bg-slate-800 rounded-lg w-20" />
      </div>
      <div className="h-44 bg-slate-800 rounded-[24px]" />
      <div className="h-56 bg-slate-800 rounded-[24px]" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-24" />
        <div className="h-16 bg-slate-800 rounded-2xl" />
        <div className="h-16 bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}
