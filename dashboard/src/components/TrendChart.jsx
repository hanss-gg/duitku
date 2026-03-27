// dashboard/src/components/TrendChart.jsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

export default function TrendChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        titleColor: "#94a3b8",
        titleFont: { size: 10, weight: "bold" },
        bodyColor: "#f1f5f9",
        bodyFont: { size: 14, weight: "900" },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          title: (ctx) => ctx[0].label.toUpperCase(),
          label: (ctx) => `Rp ${ctx.parsed.y.toLocaleString("id-ID")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#475569", font: { size: 10, weight: "black" } },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
    elements: {
      line: {
        tension: 0.45, // Smoother curves
      },
      point: {
        radius: 0,
        hitRadius: 20,
        hoverRadius: 8,
        hoverBorderWidth: 4,
        hoverBorderColor: "rgba(255,255,255,0.5)",
      },
    },
  };

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Pengeluaran",
        data: data.map((d) => d.pengeluaran),
        borderColor: "#6366f1", // indigo-500
        borderWidth: 4,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.25)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
          return gradient;
        },
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
      },
    ],
  };

  return <Line data={chartData} options={options} />;
}
