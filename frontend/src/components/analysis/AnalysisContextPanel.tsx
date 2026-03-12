import { ReactNode } from "react";

export type AnalysisChecklistItem = {
  key: string;
  label: string;
  description?: ReactNode;
  complete: boolean;
};

type AnalysisContextPanelProps = {
  readiness?: {
    title?: string;
    subtitle?: string;
    percent?: number;
    checklist?: AnalysisChecklistItem[];
  };
  extraCards?: ReactNode[];
  sessionCard?: ReactNode;
};

export default function AnalysisContextPanel({ readiness, sessionCard, extraCards }: AnalysisContextPanelProps) {
  return (
    <aside className="section-stack">
      {readiness && readiness.checklist && readiness.checklist.length > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "rgba(226,232,240,0.85)",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {readiness.title ?? "Prontidão da análise"}
              </p>
              {readiness.subtitle && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {readiness.subtitle}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-semibold ${readiness.percent && readiness.percent >= 100 ? "text-[color:var(--color-success-600)]" : "text-[color:var(--accent-primary)]"}`}
            >
              {Math.max(0, Math.min(100, Math.round(readiness.percent ?? 0)))}%
            </span>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, Math.round(readiness.percent ?? 0)))}%`,
                backgroundColor: "var(--accent-primary)",
              }}
            />
          </div>

          <ul className="mt-3 space-y-2">
            {readiness.checklist.map((item) => (
              <li
                key={item.key}
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(226,232,240,0.85)", backgroundColor: "var(--bg-primary)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.complete ? "Concluído" : "Pendente"} • {item.label}
                </p>
                {item.description && (
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sessionCard}

      {extraCards?.map((card, idx) => (
        <div
          key={`analysis-context-extra-${idx}`}
          className="rounded-2xl border p-5"
          style={{
            borderColor: "rgba(226,232,240,0.85)",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {card}
        </div>
      ))}
    </aside>
  );
}
