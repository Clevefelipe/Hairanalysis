import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AnalysisHistory } from "../services/history.service";

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
      label: "Atencao",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
  }

  return {
    label: "Critico",
    className: "bg-red-100 text-red-800 border-red-300",
  };
}

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (!id) return;

    api
      .get<AnalysisHistory>(`/history/${id}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGeneratePdf = async () => {
    if (!id) return;

    try {
      setLoadingPdf(true);

      const response = await api.get(`/history/${id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } finally {
      setLoadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Carregando analise...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-red-600">
        Analise nao encontrada.
      </div>
    );
  }

  const scoreStyle = getScoreStyle(data.score ?? 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline"
        >
          Voltar para o historico
        </button>

        <button
          onClick={handleGeneratePdf}
          disabled={loadingPdf}
          className="px-4 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {loadingPdf ? "Gerando PDF..." : "Baixar laudo"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-lg p-6 shadow-sm bg-white">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              Detalhe da Analise
            </h1>

            <span className={`text-xs px-3 py-1 rounded border font-medium ${scoreStyle.className}`}>
              {scoreStyle.label}
            </span>
          </div>

          <p className="text-sm opacity-70 mt-1">
            {new Date(data.createdAt).toLocaleString()}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-xs text-slate-500">Tipo</div>
              <div className="text-sm font-medium">
                {data.analysisType === "tricologica"
                  ? "Analise Tricologica"
                  : "Analise Capilar"}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-xs text-slate-500">Score</div>
              <div className="text-sm font-medium">{data.score}</div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-medium mb-2">Interpretacao Tecnica</h2>
            <div className="text-sm whitespace-pre-line">
              {data.interpretation || "Sem interpretacao registrada."}
            </div>
          </div>

          {data.flags && data.flags.length > 0 && (
            <div className="mt-6">
              <h2 className="font-medium mb-2">
                Pontos de Atencao
              </h2>

              <div className="flex flex-wrap gap-2">
                {data.flags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs px-2 py-1 rounded bg-slate-100 border"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="border rounded-lg p-6 shadow-sm bg-white space-y-4">
          <div>
            <div className="text-xs text-slate-500">Cliente</div>
            <div className="text-sm font-medium">
              {data.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Dominio</div>
            <div className="text-sm font-medium">
              {data.analysisType === "tricologica"
                ? "Tricologica"
                : "Capilar"}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="text-sm font-medium">Concluida</div>
          </div>

          <div className="text-xs text-slate-500 border-t pt-4">
            Relatorio tecnico-estetico.
            Nao substitui avaliacao profissional nem diagnostico clinico.
          </div>
        </aside>
      </div>
    </div>
  );
}
