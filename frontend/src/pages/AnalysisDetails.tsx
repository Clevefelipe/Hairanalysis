import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHistoryRecommendations } from "@/services/history.service";
import HistoryRecommendations from "@/components/history/HistoryRecommendations";
import PdfActions from "@/components/history/PdfActions";

export default function AnalysisDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getHistoryRecommendations(id)
      .then((res: any) => {
        setData(
          res ?? {
            historyId: id,
            domain: "capilar",
            recommendations: [],
          }
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-slate-500">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">
        Detalhes da Análise
      </h2>

      <PdfActions />

      <HistoryRecommendations
        domain={data.domain}
        recommendations={data.recommendations}
      />
    </div>
  );
}
