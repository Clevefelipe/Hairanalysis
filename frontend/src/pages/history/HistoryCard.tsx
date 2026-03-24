import { AnalysisHistory } from "../../services/history.service";
import { formatDateBr } from "@/utils/date";

interface Props {
  item: AnalysisHistory;
}

export default function HistoryCard({ item }: Props) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{formatDateBr(item.createdAt)}</span>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
          {item.analysisType === "tricologica"
            ? "Tricológica"
            : "Capilar"}
        </span>
      </div>

      <div className="mt-3">
        <p className="font-medium">
          Score:{" "}
          <span className="text-blue-600 font-semibold">
            {item.score}
          </span>
        </p>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-600 whitespace-pre-line">
          {item.interpretation}
        </p>
      </div>

      {item.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.flags.map(flag => (
            <span
              key={flag}
              className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
            >
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
