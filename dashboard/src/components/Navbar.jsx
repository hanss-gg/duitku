// dashboard/src/components/Navbar.jsx
export default function Navbar({ aktif, onChange }) {
  const menu = [
    { id: "dashboard", emoji: "🏠", label: "Home" },
    { id: "riwayat",   emoji: "📋", label: "Riwayat" },
    { id: "laporan",   emoji: "📊", label: "Laporan" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 pb-[env(safe-area-inset-bottom,0)]">
      <nav className="max-w-xs mx-auto glass-pill p-2 flex items-center justify-between relative overflow-hidden">
        {/* Active Indicator Background */}
        <div 
          className="absolute h-10 bg-indigo-500/20 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${100 / menu.length - 8}%`,
            left: `${(menu.findIndex(m => m.id === aktif) * (100 / menu.length)) + 4}%`
          }}
        />

        {menu.map(m => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`relative flex-1 flex flex-col items-center py-2 gap-0.5 transition-all duration-300 active:scale-90 ${
              aktif === m.id ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <span className={`text-lg transition-transform ${aktif === m.id ? "scale-110" : ""}`}>
              {m.emoji}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${aktif === m.id ? "opacity-100" : "opacity-60"}`}>
              {m.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
