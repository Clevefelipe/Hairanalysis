import { useState } from "react";
import { historyService } from "../services/history.service";

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
      const blob = await historyService.downloadPdf(historyId, domain);
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
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        border: "1px solid #ccc",
        background: "#fff",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Gerando PDF..." : "📄 Ver Laudo (PDF)"}
    </button>
  );
}
