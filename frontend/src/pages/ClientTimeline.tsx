import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  historyService,
  AnalysisHistory,
} from "../services/history.service";
import HistoryTimeline from "../components/history/HistoryTimeline";

export default function ClientTimeline() {
  const { id: clientId } = useParams();
  const [data, setData] = useState<
    AnalysisHistory[]
  >([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!clientId) return;

    historyService
      .getTimeline(clientId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="text-slate-500">
        Carregando timeline...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">
        Timeline Clínica
      </h2>

      {data.length === 0 ? (
        <p className="text-slate-500">
          Nenhuma análise registrada.
        </p>
      ) : (
        <HistoryTimeline
          items={data}
        />
      )}
    </div>
  );
}
