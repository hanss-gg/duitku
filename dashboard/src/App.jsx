// dashboard/src/App.jsx
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Riwayat from "./pages/Riwayat.jsx";
import Laporan from "./pages/Laporan.jsx";
import TambahTransaksi from "./pages/TambahTransaksi.jsx";
import Navbar from "./components/Navbar.jsx";
import { useAuth } from "./hooks/useAuth.js";
import LoginPage from "./pages/Login.jsx";

export default function App() {
  const [halaman, setHalaman] = useState("dashboard");
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh bg-animated">
      <div className="text-slate-400 animate-pulse">Memuat...</div>
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <div className="bg-animated min-h-dvh pb-24 relative overflow-hidden">
      {/* Mesh Gradient Blobs */}
      <div className="fixed -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-float opacity-50 z-0 pointer-events-none" />
      <div className="fixed -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] animate-float opacity-40 z-0 pointer-events-none" style={{ animationDelay: "-3s" }} />
      
      <div className="max-w-lg mx-auto px-4 pt-6 relative z-10">
        {halaman === "dashboard"  && (
          <Dashboard 
            onTambah={() => setHalaman("tambah")} 
            onNav={(p) => setHalaman(p)} 
          />
        )}
        {halaman === "riwayat"   && <Riwayat />}
        {halaman === "laporan"   && <Laporan />}
        {halaman === "tambah"    && <TambahTransaksi onSelesai={() => setHalaman("dashboard")} />}
      </div>
      <Navbar aktif={halaman} onChange={setHalaman} />
    </div>
  );
}
