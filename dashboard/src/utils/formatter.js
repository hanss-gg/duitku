// dashboard/src/utils/formatter.js
export function formatRupiah(nominal, compact = false) {
  if (compact && Math.abs(nominal) >= 1000) {
    const formatter = new Intl.NumberFormat("id-ID", {
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    
    // Intl compact for id-ID usually results in "rb", "jt", etc. 
    // Let's ensure it has the Rp prefix but remains short.
    const formatted = formatter.format(nominal ?? 0);
    return `Rp${formatted}`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(nominal ?? 0);
}

export function formatTanggal(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
