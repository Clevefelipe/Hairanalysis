import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import api from "../services/api";
import { AnalysisHistory, historyService } from "../services/history.service";
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

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

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

  const handleShare = async () => {
    if (!id) return;

    try {
      setShareLoading(true);
      const response = await historyService.share(id);
      const url = `${window.location.origin}/publico/${response.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Carregando análise...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">Análise não encontrada.</div>;
  }

  const scoreStyle = getScoreStyle(data.score ?? 0);

  return (
    <section className="page-shell">
      <div className="page-actions">
        <button onClick={() => navigate(-1)} className="page-link">
          Voltar para o histórico
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="btn-secondary"
          >
            {shareLoading ? "Gerando link..." : "Gerar link da cliente"}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={loadingPdf}
            className="page-cta"
          >
            {loadingPdf ? "Gerando PDF..." : "Baixar laudo"}
          </button>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="panel">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h1 className="page-hero-title">Detalhe da análise</h1>

            <span className={`chip ${scoreStyle.className}`}>
              {scoreStyle.label}
            </span>
          </div>

          <p className="text-sm opacity-70 mt-1">
            {new Date(data.createdAt).toLocaleString()}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="panel panel-muted">
              <div className="text-xs text-slate-500">Tipo</div>
              <div className="text-sm font-medium">
                {data.analysisType === "tricologica"
                  ? "Análise Tricológica"
                  : "Análise Capilar"}
              </div>
            </div>
            <div className="panel panel-muted">
              <div className="text-xs text-slate-500">Score</div>
              <div className="text-sm font-medium">{data.score}</div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-medium mb-2">Interpretação Técnica</h2>
            <div className="text-sm whitespace-pre-line">
              {data.interpretation || "Sem interpretação registrada."}
            </div>
          </div>

          {data.flags && data.flags.length > 0 && (
            <div className="mt-6">
              <h2 className="font-medium mb-2">Pontos de Atenção</h2>

              <div className="flex flex-wrap gap-2">
                {data.flags.map((flag) => (
                  <span key={flag} className="chip chip-flag">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="panel panel-muted space-y-4">
          <div>
            <div className="text-xs text-slate-500">Cliente</div>
            <div className="text-sm font-medium">
              {data.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Domínio</div>
            <div className="text-sm font-medium">
              {data.analysisType === "tricologica" ? "Tricológica" : "Capilar"}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="text-sm font-medium">Concluída</div>
          </div>

          <div className="text-xs text-slate-500 border-t pt-4">
            Relatório técnico-estético.
            Não substitui avaliação profissional nem diagnóstico clínico.
          </div>

          {shareUrl && (
            <div className="space-y-2 border-t pt-4">
              <div className="text-xs text-slate-500">Link para a cliente</div>
              <div className="text-xs break-all">{shareUrl}</div>
              <div>
                <QRCodeCanvas value={shareUrl} size={120} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
