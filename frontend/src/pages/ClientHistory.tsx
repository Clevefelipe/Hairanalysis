import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listHistoryByClient,
  AnalysisHistory,
} from "../services/history.service";

export default function ClientHistory() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    listHistoryByClient(clientId)
      .then((result) => {
        setData(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        setError("Erro ao carregar histórico do cliente.");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }}></div>
            Carregando histórico...
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="text-center">
          <div className="panel-tight max-w-md mx-auto text-center hover:shadow-md transition-shadow" style={{ borderColor: "var(--color-error-200)", backgroundColor: "var(--color-error-50)" }}>
            <p style={{ color: "var(--color-error-700)" }}>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>Histórico do Cliente</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Acompanhe todas as análises registradas</p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="panel-tight max-w-md mx-auto text-center hover:shadow-md transition-shadow">
            <p style={{ color: "var(--color-text-muted)" }}>Nenhuma análise registrada.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="panel-tight hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/history/${item.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.analysisType === "capilar" ? "Capilar" : "Tricológica"}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-full bg-[color:var(--color-success-100)] p-2">
                  <div className="w-2 h-2 bg-[color:var(--color-success-500)] rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Score</span>
                <span className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.score ?? 0}/100
                </span>
              </div>
              {item.flags && item.flags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.flags.slice(0, 3).map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full px-3 py-1 text-xs shadow-sm hover:shadow-md transition-shadow"
                      style={{ backgroundColor: "var(--color-warning-50)", color: "var(--color-warning-700)" }}
                    >
                      {flag}
                    </span>
                  ))}
                  {item.flags.length > 3 && (
                    <span className="rounded-full px-3 py-1 text-xs shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
                      +{item.flags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
