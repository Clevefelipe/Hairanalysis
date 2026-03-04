import { AnalysisHistory } from "../../services/history.service";

interface Props {
  items: AnalysisHistory[];
  onSelect?: (id: string) => void;
}

export default function HistoryTimeline({
  items,
  onSelect,
}: Props) {
  return (
    <div className="relative border-l border-slate-300 pl-6 space-y-8">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative"
        >
          <div className="absolute -left-[10px] top-1 w-4 h-4 rounded-full bg-slate-900" />

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">
                {new Date(
                  item.createdAt
                ).toLocaleDateString()}
              </span>

              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-white">
                {item.analysisType.toUpperCase()}
              </span>
            </div>

            <div className="text-sm text-slate-700 mb-2">
              Análise registrada
            </div>

            {onSelect && (
              <button
                onClick={() =>
                  onSelect(item.id)
                }
                className="text-xs text-slate-900 font-medium hover:underline"
              >
                Ver detalhes
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
