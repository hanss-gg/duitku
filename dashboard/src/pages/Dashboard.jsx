// dashboard/src/pages/Dashboard.jsx
import { useData } from "../hooks/useData.js";
import { formatRupiah } from "../utils/formatter.js";
import DonatChart from "../components/DonatChart.jsx";
import BarChart from "../components/BarChart.jsx";
import TransaksiItem from "../components/TransaksiItem.jsx";

export default function Dashboard({ onTambah }) {
  const { ringkasan, transaksiTerbaru, loading } = useData();

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
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Greeting */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
            {icon} {greeting}
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

      {/* Main Balance Card */}
      <div className="card p-6 bg-gradient-to-br from-indigo-600/20 to-transparent border-indigo-500/20 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
        <p className="text-indigo-300/80 text-xs font-bold uppercase tracking-widest mb-1">Total Saldo</p>
        <h1 className={`text-rupiah text-4xl mb-4 transition-colors duration-500 ${surplus ? "text-emerald-400" : "text-rose-400"}`}>
          {formatRupiah(ringkasan.saldo)}
        </h1>
        
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pemasukan</p>
            <p className="text-emerald-400 font-bold text-sm">+{formatRupiah(ringkasan.pemasukan)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pengeluaran</p>
            <p className="text-rose-400 font-bold text-sm">-{formatRupiah(ringkasan.pengeluaran)}</p>
          </div>
        </div>
      </div>

      {/* Visual Budget/Category Breakdown */}
      {ringkasan.byKategori?.length > 0 && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-slate-200">Alokasi Jajan</p>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter cursor-pointer hover:underline">Detail →</p>
          </div>
          
          <div className="flex gap-6 items-center">
            <div className="w-1/2">
               <DonatChart data={ringkasan.byKategori.slice(0, 5)} />
            </div>
            <div className="flex-1 space-y-3">
              {ringkasan.byKategori.slice(0, 3).map((cat, i) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">{cat.emoji} {cat.label}</span>
                    <span className="text-slate-200">{Math.round((cat.total / ringkasan.pengeluaran) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(cat.total / ringkasan.pengeluaran) * 100}%`,
                        backgroundColor: ["#6366f1", "#10b981", "#f59e0b"][i] 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tren Mingguan */}
      {ringkasan.perMinggu?.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-200 mb-4">Aktivitas Mingguan</p>
          <div className="h-40">
            <BarChart data={ringkasan.perMinggu} />
          </div>
        </div>
      )}

      {/* Transaksi Terbaru */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <p className="text-sm font-bold text-slate-200">Riwayat Terakhir</p>
          <button className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Lihat Semua</button>
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
