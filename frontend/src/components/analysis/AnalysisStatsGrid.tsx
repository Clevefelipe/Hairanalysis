import { ReactNode } from "react";

export type AnalysisStatItem = {
  id: string;
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: "default" | "warning" | "success" | "danger";
};

type AnalysisStatsGridProps = {
  items: AnalysisStatItem[];
};

const toneMap: Record<NonNullable<AnalysisStatItem["tone"]>, { value: string; helper: string }> = {
  default: { value: "var(--color-text)", helper: "var(--color-text-muted)" },
  warning: { value: "#92400e", helper: "#b45309" },
  success: { value: "var(--color-success-700)", helper: "var(--color-success-600)" },
  danger: { value: "var(--color-error-600)", helper: "var(--color-error-500)" },
};

export default function AnalysisStatsGrid({ items }: AnalysisStatsGridProps) {
  if (!items.length) return null;
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const palette = item.tone ? toneMap[item.tone] : toneMap.default;
        return (
          <article
            key={item.id}
            className="rounded-2xl border p-4"
            style={{
              borderColor: "rgba(226,232,240,0.85)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "0 20px 45px -35px rgba(15,23,42,0.45)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold" style={{ color: palette.value }}>
              {item.value}
            </p>
            {item.helper && (
              <p className="text-xs" style={{ color: palette.helper }}>
                {item.helper}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
