import clsx from "clsx";
import { AlertTriangle, ArrowUpRight, ShieldCheck } from "lucide-react";

type Props = {
  scoreCurrent: number;
  scoreDelta: number;
  alertsCurrent: number;
  alertsPrevious: number;
  alertsByType?: Record<string, number>;
  onViewAlerts: () => void;
};

function resolveStatus(score: number, alerts: number) {
  if (score >= 80 && alerts <= 2) {
    return {
      label: "Estável",
      tone: "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] border-[color:var(--color-success-200)]",
      description: "Operação dentro do esperado",
    };
  }
  if (score >= 65 && alerts <= 5) {
    return {
      label: "Atenção",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Monitorar alertas técnicos",
    };
  }
  return {
    label: "Crítico",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Agir imediatamente com a equipe",
  };
}

export function HealthWidget({
  scoreCurrent,
  scoreDelta,
  alertsCurrent,
  alertsPrevious,
  alertsByType,
  onViewAlerts,
}: Props) {
  const status = resolveStatus(scoreCurrent, alertsCurrent);
  const topAlert = Object.entries(alertsByType || {})
    .filter(([, value]) => typeof value === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 1)
    .map(([key]) => key)[0];

  const recommendation = topAlert
    ? `Priorize protocolos ${
        topAlert === "chemical"
          ? "químicos"
          : topAlert === "mechanical"
            ? "mecânicos"
            : topAlert === "thermal"
              ? "térmicos"
              : "operacionais"
      }.`
    : "Mantenha acompanhamento semanal.";

  const insightMessage = scoreDelta >= 0
    ? "Score em evolução positiva. Mantenha protocolos atuais."
    : "Score em queda. Revisar atendimentos com alertas reiterados.";

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Saúde das operações</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-semibold text-slate-900">{scoreCurrent}</span>
            <span className={clsx("text-xs font-semibold", scoreDelta >= 0 ? "text-[color:var(--color-success-600)]" : "text-rose-600")}>
              {scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`} pts
            </span>
          </div>
        </div>
        <div className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", status.tone)}>
          {status.label}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Alertas semana</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900">{alertsCurrent}</span>
            <span className={clsx("text-xs font-semibold", alertsCurrent - alertsPrevious <= 0 ? "text-[color:var(--color-success-600)]" : "text-rose-600")}>
              {alertsCurrent - alertsPrevious >= 0 ? `+${alertsCurrent - alertsPrevious}` : alertsCurrent - alertsPrevious}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle size={12} />
            {alertsPrevious} semana anterior
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Recomendação</p>
          <p className="mt-2">{recommendation}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
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
