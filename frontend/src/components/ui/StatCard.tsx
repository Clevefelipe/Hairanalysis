interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="text-sm text-slate-500">
        {title}
      </div>

      <div className="text-3xl font-semibold text-slate-900 mt-1">
        {value}
      </div>

      {subtitle && (
        <div className="text-xs text-slate-400 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
