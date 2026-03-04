import type { ReactNode } from "react";
import clsx from "clsx";
import Card from "@/components/ui/Card";

type MetricCardProps = {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  subLabel?: ReactNode;
  className?: string;
};

export default function MetricCard({ icon, label, value, subLabel, className }: MetricCardProps) {
  return (
    <Card title={label} className={clsx("flex flex-col gap-3", className)}>
      {icon && (
        <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xl font-semibold text-slate-900 leading-tight md:text-2xl">{value}</p>
        {subLabel && <p className="text-xs text-slate-500">{subLabel}</p>}
      </div>
    </Card>
  );
}
