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
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 10, weight: "bold" },
        bodyFont: { size: 12, weight: "black" },
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
        display: false, // Hide Y axis for cleaner look
        grid: { display: false },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
      },
      point: {
        radius: 0,
        hitRadius: 20,
        hoverRadius: 6,
        hoverBorderWidth: 3,
      },
    },
  };

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Pengeluaran",
        data: data.map((d) => d.pengeluaran),
        borderColor: "#f43f5e", // rose-500
        borderWidth: 3,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 160);
          gradient.addColorStop(0, "rgba(244, 63, 94, 0.2)");
          gradient.addColorStop(1, "rgba(244, 63, 94, 0)");
          return gradient;
        },
        pointBackgroundColor: "#f43f5e",
        pointBorderColor: "rgba(255,255,255,0.8)",
      },
    ],
  };

  return <Line data={chartData} options={options} />;
}
