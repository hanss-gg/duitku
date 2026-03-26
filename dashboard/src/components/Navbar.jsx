// dashboard/src/components/Navbar.jsx
export default function Navbar({ aktif, onChange }) {
  const menu = [
    { id: "dashboard", emoji: "🏠", label: "Home" },
    { id: "riwayat",   emoji: "📋", label: "Riwayat" },
    { id: "laporan",   emoji: "📊", label: "Laporan" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
      <div className="max-w-lg mx-auto flex">
        {menu.map(m => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${
              aktif === m.id ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs font-medium">{m.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
