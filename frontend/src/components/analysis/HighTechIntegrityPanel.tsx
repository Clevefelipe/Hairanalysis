import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Beaker,
  Flame,
  Scissors,
  ShieldCheck,
  Waves,
} from "lucide-react";
import Modal from "../ui/Modal";

type HighTechIntegrityPanelProps = {
  score?: number | null;
  flags?: string[] | null;
  interpretation?: string;
  riskLevel?: string | null;
  riskFactors?: string[] | null;
  confidence?: number | string | null;
  isLoading?: boolean;
  enableFullscreen?: boolean;
  footerSlot?: ReactNode;
};

type RiskIndex = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
};

type ScoreBand = {
  label: string;
  hint: string;
  color: string;
};

const chartColors = {
  primary: "var(--chart-primary)",
  success: "var(--chart-success)",
  warning: "var(--chart-warning)",
  danger: "var(--chart-danger)",
  border: "var(--chart-border)",
} as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeConfidence(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 1) return clamp(Math.round(value * 100), 0, 100);
    return clamp(Math.round(value), 0, 100);
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace("%", "").replace(",", ".").trim());
    if (!Number.isFinite(normalized)) return null;
    if (normalized <= 1) return clamp(Math.round(normalized * 100), 0, 100);
    return clamp(Math.round(normalized), 0, 100);
  }

  return null;
}

function deriveConfidence(
  score: number,
  flags: string[],
  interpretation: string,
  riskFactors: string[],
): number {
  let confidence = 62;
  if (score > 0) confidence += 9;
  if (interpretation.trim().length >= 80) confidence += 10;
  if (riskFactors.length > 0) confidence += 7;
  if (flags.length > 0) confidence += 4;
  if (flags.length > 5) confidence -= 6;
  return clamp(confidence, 45, 96);
}

function normalizeRiskLevel(value: string | null | undefined) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  if (text.includes("alto")) return "alto";
  if (text.includes("elev")) return "elevado";
  if (text.includes("criti")) return "critico";
  if (text.includes("med") || text.includes("moder")) return "moderado";
  if (text.includes("baix") || text.includes("control")) return "baixo";
  return null;
}

function resolveScoreBand(score: number): ScoreBand {
  if (score >= 85) {
    return {
      label: "Fibra saudavel",
      hint: "Faixa 85-100",
      color: chartColors.primary,
    };
  }
  if (score >= 70) {
    return {
      label: "Leve comprometimento",
      hint: "Faixa 70-84",
      color: chartColors.success,
    };
  }
  if (score >= 50) {
    return {
      label: "Comprometimento moderado",
      hint: "Faixa 50-69",
      color: chartColors.warning,
    };
  }
  if (score >= 30) {
    return {
      label: "Alto risco",
      hint: "Faixa 30-49",
      color: chartColors.danger,
    };
  }
  return {
    label: "Risco critico",
    hint: "Faixa 0-29",
    color: chartColors.danger,
  };
}

function riskIntensity(value: number) {
  if (value >= 80) return { label: "Critico", color: chartColors.danger };
  if (value >= 60) return { label: "Elevado", color: chartColors.warning };
  if (value >= 35) return { label: "Moderado", color: chartColors.warning };
  return { label: "Baixo", color: chartColors.primary };
}

function keywordHits(pool: string, pattern: RegExp) {
  const matches = pool.match(pattern);
  return matches ? matches.length : 0;
}

function toRiskIndices(
  score: number,
  flags: string[],
  interpretation: string,
  riskFactors: string[],
  riskLevel: string | null | undefined,
): RiskIndex[] {
  const pool = `${flags.join(" ")} ${interpretation} ${riskFactors.join(" ")}`
    .toLowerCase()
    .trim();
  const inverseScore = clamp(100 - score, 0, 100);
  const levelBias =
    normalizeRiskLevel(riskLevel) === "critico"
      ? 26
      : normalizeRiskLevel(riskLevel) === "alto"
        ? 18
        : normalizeRiskLevel(riskLevel) === "elevado"
          ? 14
          : normalizeRiskLevel(riskLevel) === "moderado"
            ? 8
            : 0;
  const flagBias = Math.min(flags.length * 3, 18);

  const thermal = clamp(
    Math.round(
      inverseScore * 0.6 + keywordHits(pool, /term|calor|heat|chapinha|secador/g) * 12 + levelBias,
    ),
  );
  const chemical = clamp(
    Math.round(
      inverseScore * 0.64 +
        keywordHits(pool, /quim|descolor|colora|alis|acid|relax/g) * 11 +
        levelBias +
        flagBias / 2,
    ),
  );
  const breakage = clamp(
    Math.round(
      inverseScore * 0.7 + keywordHits(pool, /quebra|fragil|resist|fissur|emborrach/g) * 12 + levelBias + flagBias,
    ),
  );
  const elasticity = clamp(
    Math.round(
      inverseScore * 0.66 + keywordHits(pool, /elastic|estic|resilien/g) * 13 + levelBias,
    ),
  );
  const scalp = clamp(
    Math.round(
      inverseScore * 0.5 + keywordHits(pool, /sensibil|oleos|descam|inflam|coce|couro/g) * 14 + levelBias,
    ),
  );

  return [
    { id: "thermal", label: "Risco termico", value: thermal, icon: Flame },
    { id: "chemical", label: "Risco quimico", value: chemical, icon: Beaker },
    { id: "breakage", label: "Risco de quebra", value: breakage, icon: Scissors },
    { id: "elasticity", label: "Risco de elasticidade", value: elasticity, icon: ShieldCheck },
    { id: "scalp", label: "Risco de sensibilidade", value: scalp, icon: Waves },
  ];
}

function riskLabelFromAverage(avg: number) {
  if (avg >= 80) return "Critico";
  if (avg >= 60) return "Elevado";
  if (avg >= 35) return "Moderado";
  return "Baixo";
}

export default function HighTechIntegrityPanel({
  score,
  flags,
  interpretation,
  riskLevel,
  riskFactors,
  confidence,
  isLoading = false,
  enableFullscreen = true,
  footerSlot,
}: HighTechIntegrityPanelProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const safeScore = clamp(Math.round(Number(score ?? 0)));
  const safeFlags = Array.isArray(flags) ? flags : [];
  const safeInterpretation = String(interpretation ?? "");
  const isGenericAlertLabel = (value: string) => /sinais? de alerta/i.test(value);
  const baseRiskFactors = Array.isArray(riskFactors) ? riskFactors : [];
  const filteredRiskFactors = baseRiskFactors.filter((item) => !isGenericAlertLabel(item));
  const safeRiskFactors =
    filteredRiskFactors.length > 0 ? filteredRiskFactors : Array.isArray(flags) ? flags : [];
  const safeConfidence =
    normalizeConfidence(confidence) ??
    deriveConfidence(safeScore, safeFlags, safeInterpretation, safeRiskFactors);

  const overlayPadding = "clamp(8px, 3vw, 16px)";

  const ringSize = 238;
  const strokeWidth = 14;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (safeScore / 100) * circumference;
  const scoreBand = resolveScoreBand(safeScore);

  const riskIndices = toRiskIndices(
    safeScore,
    safeFlags,
    safeInterpretation,
    safeRiskFactors,
    riskLevel,
  );
  const avgRisk =
    riskIndices.length > 0
      ? Math.round(
          riskIndices.reduce((total, item) => total + item.value, 0) / riskIndices.length,
        )
      : 0;
  const avgRiskColor = avgRisk >= 60 ? chartColors.danger : chartColors.primary;

  const openFullscreen = () => {
    if (!enableFullscreen || isLoading) return;
    setIsFullscreenOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableFullscreen || isLoading) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsFullscreenOpen(true);
    }
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
        <div className="absolute right-4 top-4 h-12 w-40 animate-pulse rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }} />
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-40 animate-pulse rounded-full" style={{ backgroundColor: "var(--bg-primary)" }} />
            <div className="h-4 w-52 animate-pulse rounded-full" style={{ backgroundColor: "var(--bg-primary)" }} />
          </div>
          <div className="h-7 w-28 animate-pulse rounded-full" style={{ backgroundColor: "var(--bg-primary)" }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
          <div className="relative overflow-hidden rounded-lg border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
            <div className="mx-auto h-56 w-56 animate-pulse rounded-full border-[10px]" style={{ borderColor: "var(--color-border)" }} />
            <div className="mx-auto mt-5 h-3 w-36 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            <div className="mx-auto mt-2 h-3 w-28 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-summary-${index}`}
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
                >
                  <div className="h-3 w-20 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  <div className="mt-3 h-6 w-14 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-risk-${index}`}
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
                >
                  <div className="h-3 w-28 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  <div className="mt-3 h-1 w-full animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  <div className="mt-2 h-3 w-16 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border p-6 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary-300)] hover:shadow-xl cursor-pointer"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
      role="button"
      tabIndex={enableFullscreen && !isLoading ? 0 : -1}
      aria-label="Abrir mapa de integridade em tela cheia"
      onClick={openFullscreen}
      onKeyDown={handleKeyDown}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundColor: "var(--bg-primary)" }} />

      <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-primary)" }} />
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)" }}>Confianca IA</p>
          <p className="text-base font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{safeConfidence}%</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pr-48">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
            Mapa de Integridade
          </p>
          <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            Score técnico e riscos segmentados
          </h3>
          {enableFullscreen && !isLoading && (
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
              Clique para abrir em tela cheia e ver detalhes
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
          <AlertTriangle size={14} style={{ color: avgRiskColor }} />
          Risco global: {riskLabelFromAverage(avgRisk)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="relative overflow-hidden rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
          <div className="absolute inset-6 rounded-full border border-dashed" style={{ borderColor: "var(--color-border)" }} />
          <div className="relative mx-auto h-[238px] w-[238px]">
            <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="relative h-full w-full" role="img" aria-label={`Score de integridade ${safeScore} de 100`}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={chartColors.border}
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={scoreBand.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ transition: "stroke 0.45s ease, stroke-dashoffset 0.7s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Integridade</p>
              <p className="text-4xl font-semibold leading-none" style={{ color: "var(--color-text)" }}>{safeScore}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>/100</p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-semibold" style={{ color: scoreBand.color }}>
            {scoreBand.label}
          </p>
          <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{scoreBand.hint}</p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Score</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{safeScore}/100</p>
            </div>
            <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Risco global</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: avgRiskColor }}>
                {riskLabelFromAverage(avgRisk)}
              </p>
            </div>
            <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Alertas</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{safeFlags.length}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {riskIndices.map((risk) => {
              const intensity = riskIntensity(risk.value);
              const Icon = risk.icon;
              return (
                <article
                    key={risk.id}
                  className="rounded-lg border p-4 shadow-sm"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--bg-primary)",
                    boxShadow: "var(--shadow-card)",
                    backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{risk.label}</p>
                    <Icon size={14} style={{ color: intensity.color }} />
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${risk.value}%`, backgroundColor: intensity.color }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{risk.value}%</span>
                    <span className="text-[11px] font-semibold" style={{ color: intensity.color }}>
                      {intensity.label}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        title="Mapa de integridade em detalhe"
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        fullScreen
      >
        <div className="space-y-6">
          <header
            className="rounded-xl border bg-[color:var(--color-surface)] p-5 shadow-sm"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  Percentuais e justificativas
                </p>
                <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                  Score {safeScore}/100 · Risco {riskLabelFromAverage(avgRisk)} ({avgRisk}%)
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Explicação consolidada por IA: combinamos score técnico, riscos detectados e pistas textuais para chegar em cada percentual.
                </p>
              </div>
              <div className="rounded-lg border px-4 py-2 text-right shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)" }}>Confianca IA</p>
                <p className="text-2xl font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{safeConfidence}%</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Score</p>
                <p className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{safeScore}/100</p>
                <p className="text-xs" style={{ color: scoreBand.color }}>{scoreBand.label} · {scoreBand.hint}</p>
              </div>
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Risco médio</p>
                <p className="text-2xl font-semibold" style={{ color: avgRiskColor }}>{avgRisk}%</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Risco global ponderado por categorias</p>
              </div>
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Alertas e fatores</p>
                <p className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{safeFlags.length} flags · {safeRiskFactors.length} fatores</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Impactam pesos dos índices segmentados</p>
              </div>
            </div>
          </header>

          <section
            className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-[color:var(--color-surface)] px-3 py-5 md:px-5 md:py-6 shadow-sm"
          >
            <div
              className="absolute opacity-[0.08]"
              style={{
                inset: overlayPadding,
                background: "radial-gradient(circle at 50% 50%, var(--color-primary-200), transparent 62%)",
                backgroundSize: "140% 140%",
              }}
            />
            <div className="relative mx-auto aspect-square max-h-[560px] min-h-[360px] w-full max-w-[720px]">
              <div className="absolute inset-12 rounded-full border border-dashed" style={{ borderColor: "var(--color-border)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[172px] w-[172px] rounded-full border bg-[color:var(--bg-primary)] shadow-xl" style={{ borderColor: "var(--color-border)" }}>
                  <div className="absolute inset-[10px] rounded-full border" style={{ borderColor: "var(--color-border)" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                    <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Integridade global</p>
                    <p className="text-5xl font-semibold leading-none" style={{ color: "var(--color-text)" }}>{safeScore}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>/100</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: scoreBand.color }}>
                      {scoreBand.label}
                    </p>
                  </div>
                </div>
              </div>

              {riskIndices.map((risk, index) => {
                const intensity = riskIntensity(risk.value);
                const angle = (index / Math.max(riskIndices.length, 1)) * 360;
                const radialSpread = riskIndices.length >= 6 ? 34 : 30; // percent of container radius para evitar vazamento
                const x = 50 + radialSpread * Math.cos((angle - 90) * (Math.PI / 180));
                const y = 50 + radialSpread * Math.sin((angle - 90) * (Math.PI / 180));
                const Icon = risk.icon;
                return (
                  <div
                    key={`radial-${risk.id}`}
                    className="absolute flex max-w-[24vw] flex-col items-center gap-1 text-center"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", width: "clamp(96px, 18vw, 120px)" }}
                  >
                    <div
                      className="h-11 w-11 rounded-full border bg-[color:var(--bg-primary)] shadow-md flex items-center justify-center"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <Icon size={16} style={{ color: intensity.color }} />
                    </div>
                    <p className="text-[10px] font-semibold leading-tight" style={{ color: "var(--color-text)", wordBreak: "keep-all" }}>{risk.label}</p>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                      style={{ borderColor: intensity.color, color: intensity.color, backgroundColor: "var(--bg-primary)" }}
                    >
                      {risk.value}% · {intensity.label}
                    </span>
                    <div
                      className="absolute left-1/2 top-[-6px] h-9 w-px"
                      style={{ transform: "translateX(-50%)", background: `linear-gradient(to top, ${intensity.color}, transparent)` }}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[340px,1fr]">
            <div className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <div className="mx-auto h-[260px] w-[260px]">
                <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="h-full w-full" role="img" aria-label={`Score de integridade ${safeScore} de 100`}>
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={chartColors.border}
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={scoreBand.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    style={{ transition: "stroke 0.45s ease, stroke-dashoffset 0.7s ease" }}
                  />
                </svg>
                <div className="relative -top-[178px] flex flex-col items-center justify-center text-center">
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Integridade</p>
                  <p className="text-5xl font-semibold leading-none" style={{ color: "var(--color-text)" }}>{safeScore}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>/100</p>
                </div>
              </div>
              <p className="mt-3 text-center text-sm font-semibold" style={{ color: scoreBand.color }}>
                {scoreBand.label}
              </p>
              <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{scoreBand.hint}</p>

              <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-text-muted)" }}>Como ler</p>
                <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                  <li>• Anel principal: força técnica da fibra.</li>
                  <li>• Risco médio: média ponderada das categorias.</li>
                  <li>• Flags e fatores ajustam severidade por categoria.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-text-muted)" }}>Como chegamos nesses percentuais</p>
                <ul className="mt-2 grid gap-2 text-sm md:grid-cols-2" style={{ color: "var(--color-text)" }}>
                  <li className="flex items-start gap-2"><span className="mt-[6px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: scoreBand.color }} />Score técnico colore a banda ({scoreBand.label}).</li>
                  <li className="flex items-start gap-2"><span className="mt-[6px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--chart-warning)" }} />Flags ({safeFlags.length}) e fatores ({safeRiskFactors.length}) pesam categorias.</li>
                  <li className="flex items-start gap-2"><span className="mt-[6px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--chart-primary)" }} />Texto da interpretação modula confiança e contexto.</li>
                  <li className="flex items-start gap-2"><span className="mt-[6px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--chart-danger)" }} />Nível de risco ({riskLevel || "não informado"}) calibra severidade térmica/química/quebra.</li>
                </ul>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Fatores de risco</p>
                    <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>{safeRiskFactors.length} itens</span>
                  </div>
                  {safeRiskFactors.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {safeRiskFactors.map((factor, index) => (
                        <span
                          key={`risk-factor-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                          style={{ borderColor: "var(--chart-warning)", color: "var(--color-text)" }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--chart-warning)" }} />
                          {factor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhum fator destacado.</p>
                  )}
                </div>

                <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Alertas (flags)</p>
                    <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>{safeFlags.length} itens</span>
                  </div>
                  {safeFlags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {safeFlags.map((flag, index) => (
                        <span
                          key={`flag-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                          style={{ borderColor: "var(--chart-danger)", color: "var(--color-text)" }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--chart-danger)" }} />
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhum alerta gerado.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-text-muted)" }}>Índices segmentados</p>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Valores em % por categoria</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {riskIndices.map((risk) => {
                    const intensity = riskIntensity(risk.value);
                    const Icon = risk.icon;
                    return (
                      <article key={`fullscreen-${risk.id}`} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon size={16} style={{ color: intensity.color }} />
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{risk.label}</p>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: intensity.color }}>{intensity.label}</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${risk.value}%`, backgroundColor: intensity.color }} />
                        </div>
                        <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          Percentual calculado com score base, intensidade média ({risk.value}%) e sinais textuais da categoria.
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-text-muted)" }}>Interpretação</p>
                {safeInterpretation ? (
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>{safeInterpretation}</p>
                    <ul className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      <li>• Score {safeScore}/100 · {riskLabelFromAverage(avgRisk)} ({avgRisk}%).</li>
                      <li>• Flags: {safeFlags.length} · Fatores: {safeRiskFactors.length} · Confiança IA: {safeConfidence}%.</li>
                      <li>• Categorias mais críticas destacadas pelo mapa radial.</li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Nenhuma interpretação fornecida. Informe um resumo técnico para contextualizar o score e os riscos.
                  </p>
                )}
              </div>

              {footerSlot}
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}
