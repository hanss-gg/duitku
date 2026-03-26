// dashboard/src/hooks/useData.js
import { useState, useEffect } from "react";
import { fetchSaldo, fetchRiwayat, fetchLaporan } from "../utils/api.js";

export function useData() {
  const [state, setState] = useState({ saldo: 0, ringkasan: { saldo: 0, pemasukan: 0, pengeluaran: 0, byKategori: [], perMinggu: [] }, transaksiTerbaru: [], loading: true });

  useEffect(() => {
    Promise.all([fetchSaldo(), fetchRiwayat(5)])
      .then(([ringkasan, transaksiTerbaru]) =>
        setState({ ringkasan, saldo: ringkasan.saldo, transaksiTerbaru, loading: false })
      )
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  return state;
}

export function useRiwayat(bulan) {
  const [state, setState] = useState({ transaksi: [], loading: true });

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    fetchRiwayat(100, bulan)
      .then(transaksi => setState({ transaksi, loading: false }))
      .catch(() => setState({ transaksi: [], loading: false }));
  }, [bulan]);

  return state;
}

export function useLaporan(bulan) {
  const [state, setState] = useState({ laporan: null, loading: true });

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    fetchLaporan(bulan)
      .then(laporan => setState({ laporan, loading: false }))
      .catch(() => setState({ laporan: null, loading: false }));
  }, [bulan]);

  return state;
}
