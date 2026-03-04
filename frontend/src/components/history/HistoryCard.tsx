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

        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
          {item.analysisType.toUpperCase()}
        </span>
      </div>

      <div className="text-sm text-slate-700">
        <strong>ID:</strong> {item.id}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onDownloadPdf(item.id)}
          className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Baixar PDF
        </button>
      </div>
    </div>
  );
}
