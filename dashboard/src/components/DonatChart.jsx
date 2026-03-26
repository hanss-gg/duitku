// dashboard/src/components/DonatChart.jsx
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16"];

export default function DonatChart({ data }) {
  return (
    <Doughnut
      data={{
        labels: data.map(d => `${d.emoji} ${d.label}`),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: COLORS.slice(0, data.length),
          borderWidth: 0,
          hoverOffset: 6,
        }],
      }}
      options={{
        plugins: { legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 11 } } } },
        cutout: "65%",
      }}
    />
  );
}
