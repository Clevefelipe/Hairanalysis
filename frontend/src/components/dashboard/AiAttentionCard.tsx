import { Sparkles } from "lucide-react";
import { AnalysisHistory } from "@/services/history.service";

type SeverityVisual = {
  bar: string;
  badge: string;
};

type AttentionCopy = {
  title: string;
  description: string;
};

type ActiveClientStats = {
  todayCount: number;
  alertsList: AnalysisHistory[];
} | null;

type AiAttentionCardProps = {
  severityVisual: SeverityVisual;
  alertSeverityLabel: string;
  aiAttentionCopy: AttentionCopy;
  scoreDisplayValue: number | null;
  scoreTitle: string;
  scoreDetail: string;
  scoreDeltaLabel: string;
  scoreDeltaClass: string;
  activeClientStats: ActiveClientStats;
  todayCount: number;
  todayDelta: number;
  todayDeltaVisualClass: string;
  onOpenAnalysis: (item: AnalysisHistory) => void;
  onNavigateHistory: () => void;
  dateFormatter: Intl.DateTimeFormat;
  cardGradient?: string;
};

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreTone(value: number | null) {
  if (value === null) {
    return { color: "var(--color-slate-500)", label: "Sem dados" };
  }
  if (value >= 70) return { color: "var(--color-success-500)", label: "Saudável" };
  if (value >= 40) return { color: "var(--color-warning-500)", label: "Atenção" };
  return { color: "var(--color-error-500)", label: "Crítico" };
}

function CircularScoreProgress({
  value,
  title,
  detail,
  deltaLabel,
  deltaClassName,
}: {
  value: number | null;
  title: string;
  detail: string;
  deltaLabel: string;
  deltaClassName: string;
}) {
  const normalized = typeof value === "number" ? clampScore(Math.round(value)) : null;
  const displayValue = normalized ?? "--";
  const ringSize = 118;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = normalized ?? 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const tone = scoreTone(normalized);

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-text-muted)]">{title}</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[118px] w-[118px]">
          <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="h-full w-full" role="img" aria-label={`${title} ${displayValue}`}>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={tone.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-[color:var(--color-text)] leading-none">{displayValue}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] leading-tight mt-0.5">/100</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: tone.color }}>
            {tone.label}
          </p>
          <p className="text-xs text-[color:var(--color-text-muted)]">{detail}</p>
          <p className={`text-xs font-semibold ${deltaClassName}`}>{deltaLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default function AiAttentionCard({
  severityVisual,
  alertSeverityLabel,
  aiAttentionCopy,
  scoreDisplayValue,
  scoreTitle,
  scoreDetail,
  scoreDeltaLabel,
  scoreDeltaClass,
  activeClientStats,
  todayCount,
  todayDelta,
  todayDeltaVisualClass,
  onOpenAnalysis,
  onNavigateHistory,
  dateFormatter,
  cardGradient,
}: AiAttentionCardProps) {
  const reviewTarget = activeClientStats?.alertsList?.[0] ?? null;

  return (
    <div
      className="premium-card relative overflow-hidden rounded-xl p-5 text-[color:var(--color-text)]"
      style={{
        background:
          cardGradient ||
          "linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(237, 242, 247, 0.94) 60%, rgba(250, 250, 250, 0.92) 100%)",
        border: "1px solid rgba(148, 163, 184, 0.24)",
        boxShadow: "0 18px 38px -26px rgba(15,23,42,0.4)",
      }}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${severityVisual.bar}`} />
      <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <Sparkles size={18} />
          <span className="text-sm uppercase tracking-[0.3em]">IA Estética</span>
        </div>
        <span className={severityVisual.badge}>{alertSeverityLabel}</span>
      </div>
      <p className="mt-3 text-xl font-semibold text-[color:var(--color-text)]">{aiAttentionCopy.title}</p>
      <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">{aiAttentionCopy.description}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <CircularScoreProgress
          value={scoreDisplayValue}
          title={scoreTitle}
          detail={scoreDetail}
          deltaLabel={scoreDeltaLabel}
          deltaClassName={scoreDeltaClass}
        />
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-center shadow-[var(--shadow-card)] flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-text-muted)] leading-tight">
            {activeClientStats ? "Análises hoje (cliente)" : "Análises hoje"}
          </p>
          <p className="text-3xl font-bold text-[color:var(--color-text)] leading-none mt-1">{todayCount}</p>
          {activeClientStats ? (
            <p className="mt-2 text-xs font-medium text-[color:var(--color-text-muted)] leading-snug">
              {todayCount ? "Sessões registradas no dia" : "Sem registros hoje"}
            </p>
          ) : (
            <p className={`mt-2 text-xs font-medium leading-snug ${todayDeltaVisualClass}`}>
              {todayDelta === 0
                ? "Mesmo volume de ontem"
                : `${todayDelta > 0 ? "+" : ""}${todayDelta} vs ontem`}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button className="btn-secondary text-sm w-full sm:w-auto" onClick={onNavigateHistory}>
          {activeClientStats ? "Ver histórico da cliente" : "Ver histórico completo"}
        </button>
        {reviewTarget && (
          <button className="btn-primary text-sm w-full sm:w-auto" onClick={() => onOpenAnalysis(reviewTarget)}>
            Revisar alertas agora
          </button>
        )}
      </div>
      {activeClientStats?.alertsList?.length ? (
        <div className="mt-3 space-y-2 rounded-2xl border border-[color:var(--status-rose-300,#f8b4c0)] bg-[color:var(--color-error-50,#fef2f2)] p-3 text-sm" style={{ color: "var(--status-rose-600,#d1556f)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--status-rose-600,#d1556f)" }}>Alertas desta cliente</p>
          {activeClientStats.alertsList.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-start gap-3">
              <span className="w-20 shrink-0 text-xs font-semibold" style={{ color: "var(--status-rose-500,#f38ba0)" }}>
                {dateFormatter.format(new Date(alert.createdAt))}
              </span>
              <p className="flex-1 leading-snug line-clamp-3" style={{ color: "var(--status-rose-600,#d1556f)" }}>{alert.interpretation}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
