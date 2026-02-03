import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistoryByClient, AnalysisHistory } from "../services/history.service";
import "../styles/system.css";

function getScoreStyle(score: number) {
  if (score >= 80) {
    return {
      label: "Excelente",
      className: "bg-green-100 text-green-800 border-green-300",
    };
  }

  if (score >= 60) {
    return {
      label: "Bom",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    };
  }

  if (score >= 40) {
    return {
      label: "Atenção",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
  }

  return {
    label: "Crítico",
    className: "bg-red-100 text-red-800 border-red-300",
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ temporário — depois vem por rota ou contexto
  const clientId = "cliente_123";

  useEffect(() => {
    getHistoryByClient(clientId)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Carregando histórico...</div>;
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Histórico de Análises</h1>
          <p className="page-hero-subtitle">
            Acompanhe o desempenho das análises e consulte alertas.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/historico/evolucao" className="btn-primary">
            Ver evolução
          </Link>
        </div>
      </div>

      {history.length === 0 && (
        <p className="text-gray-500">
          Nenhuma análise encontrada para este cliente.
        </p>
      )}

      {history.map((item) => {
        const scoreStyle = getScoreStyle(item.score);

        return (
          <div key={item.id} className="panel panel-muted space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-sm opacity-70">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>

              <div className="flex gap-2 flex-wrap">
                <span className="chip">
                  {item.analysisType === "tricologica"
                    ? "Tricológica"
                    : "Capilar"}
                </span>
                <span className={`chip ${scoreStyle.className}`}>
                  {scoreStyle.label}
                </span>
              </div>
            </div>

            <div className="text-sm font-medium">
              Score: <span className="text-lg font-semibold">{item.score}</span>
            </div>

            <div className="text-sm whitespace-pre-line">
              {item.interpretation}
            </div>

            <div>
              <Link to={`/historico/${item.id}`} className="page-link">
                Ver detalhes
              </Link>
            </div>

            {item.flags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {item.flags.map((flag) => (
                  <span key={flag} className="chip chip-flag">
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
