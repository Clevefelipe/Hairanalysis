interface Props {
  title: string;
  value: number | string;
}

export default function StatCard({
  title,
  value,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}
