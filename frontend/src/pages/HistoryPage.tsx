import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistoryByClient, AnalysisHistory } from "../services/history.service";

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
    return (
      <div className="p-6 text-gray-500">
        Carregando histórico...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Histórico de Análises
      </h1>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/historico/evolucao"
          className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
        >
          Ver evolucao
        </Link>
      </div>

      {history.length === 0 && (
        <p className="text-gray-500">
          Nenhuma análise encontrada para este cliente.
        </p>
      )}

      {history.map((item) => {
        const scoreStyle = getScoreStyle(item.score);

        return (
          <div
            key={item.id}
            className={`border rounded-lg p-4 shadow-sm space-y-3 ${scoreStyle.className}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-70">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>

              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded border">
                  {item.analysisType === "tricologica"
                    ? "Tricológica"
                    : "Capilar"}
                </span>

                <span className="text-xs px-2 py-1 rounded font-medium border">
                  {scoreStyle.label}
                </span>
              </div>
            </div>

            <div className="text-sm font-medium">
              Score:{" "}
              <span className="text-lg font-semibold">
                {item.score}
              </span>
            </div>

            <div className="text-sm whitespace-pre-line">
              {item.interpretation}
            </div>

            <div>
              <Link
                to={`/historico/${item.id}`}
                className="text-sm text-blue-700 hover:underline"
              >
                Ver detalhes
              </Link>
            </div>

            {item.flags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {item.flags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs px-2 py-1 rounded bg-white bg-opacity-60 border"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
