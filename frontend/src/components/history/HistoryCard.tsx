import { AnalysisHistory } from "../../services/history.service";

interface Props {
  item: AnalysisHistory;
  onDownloadPdf: (id: string) => void;
}

export default function HistoryCard({
  item,
  onDownloadPdf,
}: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {new Date(item.createdAt).toLocaleString()}
        </span>

        <span className="text-xs px-2 py-1 rounded bg-slate-900 text-white">
          {item.domain.toUpperCase()}
        </span>
      </div>

      <div className="text-sm text-slate-700">
        <strong>ID:</strong> {item.id}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onDownloadPdf(item.id)}
          className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
        >
          Baixar PDF
        </button>
      </div>
    </div>
  );
}
