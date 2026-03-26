// dashboard/src/components/BarChart.jsx
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function BarChart({ data }) {
  return (
    <Bar
      data={{
        labels: data.map(d => d.label),
        datasets: [{
          label: "Pengeluaran",
          data: data.map(d => d.pengeluaran),
          backgroundColor: "rgba(239,68,68,0.7)",
          borderRadius: 6,
        }, {
          label: "Pemasukan",
          data: data.map(d => d.pemasukan),
          backgroundColor: "rgba(16,185,129,0.7)",
          borderRadius: 6,
        }],
      }}
      options={{
        plugins: { legend: { labels: { color: "#94a3b8", font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: "#64748b" }, grid: { display: false } },
          y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.04)" } },
        },
      }}
    />
  );
}
