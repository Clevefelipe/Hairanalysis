import { formatDateShortBr } from "@/utils/date";

interface EvolutionItem {
  fromDate: string;
  toDate: string;
  summary: string;
}

interface Props {
  data: EvolutionItem[];
}

export default function HistoryEvolution({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500">
              {formatDateShortBr(item.fromDate)} → {formatDateShortBr(item.toDate)}
            </span>

            <span className="text-xs px-2 py-1 rounded bg-[color:var(--color-success-600)] text-white">
              Evolução
            </span>
          </div>

          <p className="text-sm text-slate-700">
            {item.summary}
          </p>
        </div>
      ))}
    </div>
  );
}
