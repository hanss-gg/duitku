// dashboard/src/components/BarChart.jsx
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function BarChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `Rp ${ctx.parsed.y.toLocaleString("id-ID")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 10, weight: "bold" } },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
  };

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Pengeluaran",
        data: data.map((d) => d.pengeluaran),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 160);
          gradient.addColorStop(0, "#f43f5e"); // rose-500
          gradient.addColorStop(1, "rgba(244, 63, 94, 0.3)");
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
      },
    ],
  };

  return <Bar data={chartData} options={options} />;
}
