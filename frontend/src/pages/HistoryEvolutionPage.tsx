import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getHistoryByClient, AnalysisHistory } from "../services/history.service";
import "../styles/system.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function HistoryEvolutionPage() {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ temporário — depois vem por rota/contexto
  const clientId = "cliente_123";

  useEffect(() => {
    getHistoryByClient(clientId)
      .then((data) => {
        const ordered = [...data].reverse();
        setHistory(ordered);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Carregando evolução...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-gray-500">
        Nenhum dado disponível para evolução.
      </div>
    );
  }

  const labels = history.map((item) =>
    new Date(item.createdAt).toLocaleDateString()
  );

  const scores = history.map((item) => item.score);

  const data = {
    labels,
    datasets: [
      {
        label: "Score de Evolução",
        data: scores,
        borderColor: "#d7a45c",
        backgroundColor: "rgba(215, 164, 92, 0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Score: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Score",
        },
      },
      x: {
        title: {
          display: true,
          text: "Data da Análise",
        },
      },
    },
  };

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Evolução do Cliente</h1>
          <p className="page-hero-subtitle">
            Visualize a evolução de score e a consistência dos resultados.
          </p>
        </div>
      </div>

      <div className="panel">
        <Line data={data} options={options} />
      </div>
    </section>
  );
}
