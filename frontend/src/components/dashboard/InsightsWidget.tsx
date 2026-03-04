import clsx from "clsx";
import { ArrowUpRight, AlertTriangle } from "lucide-react";

const CATEGORY_LABELS: Record<string, { label: string; tone: string }> = {
  chemical: { label: "Alertas químicos", tone: "text-rose-600 bg-rose-50" },
  mechanical: { label: "Alertas mecânicos", tone: "text-amber-600 bg-amber-50" },
  thermal: { label: "Alertas térmicos", tone: "text-indigo-600 bg-indigo-50" },
  other: { label: "Alertas gerais", tone: "text-slate-600 bg-slate-50" },
};

function formatCategory(key: string) {
  return CATEGORY_LABELS[key] ?? CATEGORY_LABELS.other;
}

type InsightsWidgetProps = {
  alertsByType?: Record<string, number>;
  totalAlerts: number;
  scoreDelta: number;
  onViewAlerts: () => void;
};

export function InsightsWidget({ alertsByType, totalAlerts, scoreDelta, onViewAlerts }: InsightsWidgetProps) {
  const categories = Object.entries(alertsByType || {})
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const insightMessage = scoreDelta >= 0
    ? "Score em evolução positiva. Mantenha protocolos atuais."
    : "Score em queda. Revisar atendimentos com alertas reiterados.";

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Insights clínicos</p>
          <p className="mt-2 text-xs text-slate-500">Monitoramos alertas e variação do score</p>
        </div>
        <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", scoreDelta >= 0 ? "border-[color:var(--color-success-200)] text-[color:var(--color-success-700)] bg-[color:var(--color-success-50)]" : "border-rose-200 text-rose-700 bg-rose-50")}>{scoreDelta >= 0 ? "Score em alta" : "Score em queda"}</span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertTriangle size={14} className="text-amber-500" /> Distribuição de alertas
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <span className="text-xs text-slate-400">Sem alertas recentes.</span>
          ) : (
            categories.map(([key, value]) => {
              const category = formatCategory(key);
              const percentage = totalAlerts > 0 ? Math.round((value / totalAlerts) * 100) : 0;
              return (
                <div key={key} className={clsx("rounded-2xl border px-3 py-2 text-xs", category.tone, "border-transparent flex items-center gap-2")}> 
                  <span className="font-semibold">{category.label}</span>
                  <span className="text-slate-700">{percentage}%</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-700">
        {insightMessage}
      </div>

      <button
        className="btn-primary text-xs self-start"
        onClick={onViewAlerts}
      >
        Ver alertas prioritários <ArrowUpRight size={14} />
      </button>
    </div>
  );
}
