import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/system.css";

export default function PublicHistoryReport() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/history/public/${token}`);
        setData(res.data);
      } catch {
        setError("Link inválido ou expirado.");
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [token]);

  if (loading) {
    return <div className="p-6 text-gray-500">Carregando relatório...</div>;
  }

  if (error || !data?.valid) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Relatório indisponível</h1>
        <p className="text-gray-500">
          {error || "Não foi possível validar este relatório."}
        </p>
      </div>
    );
  }

  const report = data.report;

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Relatório de Análise Capilar</h1>
          <p className="page-hero-subtitle">
            Observação estética assistida por IA.
          </p>
        </div>
        <Link to="/login" className="btn-primary">
          Acessar sistema
        </Link>
      </div>

      <div className="panel">
        <div className="text-sm text-slate-500">Tipo</div>
        <div className="text-base font-medium">
          {report.domain === "tricologia" ? "Tricológica" : "Capilar"}
        </div>
        <div className="text-sm text-slate-500 mt-2">Data</div>
        <div className="text-base font-medium">
          {new Date(report.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="panel">
        <h2 className="text-lg font-semibold mb-2">Resumo técnico</h2>
        <pre className="text-sm whitespace-pre-wrap">
          {JSON.stringify(report.baseResult, null, 2)}
        </pre>
      </div>

      {report.ragResult && (
        <div className="panel panel-muted">
          <h2 className="text-lg font-semibold mb-2">Recomendações</h2>
          <p className="text-sm whitespace-pre-wrap">{report.ragResult}</p>
        </div>
      )}

      <div className="text-xs text-slate-500 border-t pt-4">
        {data.disclaimer}
      </div>
    </section>
  );
}
