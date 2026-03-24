interface CompareResult {
  label: string;
  before: string;
  after: string;
}

interface Props {
  data: CompareResult[];
}

export default function HistoryCompare({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-3 gap-4 bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
        >
          <div className="text-sm font-medium text-slate-700">
            {item.label}
          </div>

          <div className="text-sm text-slate-500">
            {item.before}
          </div>

          <div className="text-sm text-[color:var(--color-success-700)] font-medium">
            {item.after}
          </div>
        </div>
      ))}
    </div>
  );
}
