import { useState } from "react";
import { getHistoryPdf } from "../services/history.service";

type Props = {
  historyId: string;
  domain?: "capilar" | "tricologia";
};

export default function HistoryPdfButton({
  historyId,
  domain = "capilar",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);
      const blob = await getHistoryPdf(historyId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      alert("Erro ao abrir o PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Gerando PDF..." : "📄 Ver Laudo (PDF)"}
    </button>
  );
}
