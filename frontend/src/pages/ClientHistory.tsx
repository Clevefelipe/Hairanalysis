import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  historyService,
  AnalysisHistory,
} from "../services/history.service";
import HistoryCard from "../components/history/HistoryCard";

export default function ClientHistory() {
  const { id: clientId } = useParams();
  const [data, setData] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    historyService
      .getByClient(clientId)
      .then(setData)
      .catch(() =>
        setError(
          "Erro ao carregar histórico do cliente."
        )
      )
      .finally(() => setLoading(false));
  }, [clientId]);

  function handleDownloadPdf(historyId: string) {
    historyService
      .downloadPdf(historyId)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analise-${historyId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() =>
        alert("Erro ao baixar o PDF.")
      );
  }

  if (loading) {
    return (
      <div className="text-slate-500">
        Carregando histórico...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">
        Histórico de Análises
      </h2>

      {data.length === 0 && (
        <div className="text-slate-500">
          Nenhuma análise encontrada para
          este cliente.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onDownloadPdf={
              handleDownloadPdf
            }
          />
        ))}
      </div>
    </div>
  );
}
