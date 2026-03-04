import { useEffect, useMemo, useState } from "react";

interface AnalysisProcessingSkeletonProps {
  mode: "tricologica" | "capilar";
  /** Duração total esperada do processamento em ms para sincronizar o contador (usado apenas se não houver progressOverride). */
  durationMs?: number;
  /** Se informado, o componente usa este valor (0-100) e ignora o temporizador interno. */
  progressOverride?: number;
}

export default function AnalysisProcessingSkeleton({
  mode,
  durationMs = 10000,
  progressOverride,
}: AnalysisProcessingSkeletonProps) {
  const [progress, setProgress] = useState(0);
  const usingExternal = typeof progressOverride === "number";

  useEffect(() => {
    if (usingExternal) return;

    let rafId: number;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(next);
      if (next < 100) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs, mode, usingExternal]);

  const progressValue = usingExternal ? Math.min(100, Math.max(0, Math.round(progressOverride ?? 0))) : progress;

  const circularProgress = useMemo(() => {
    const ringSize = 200;
    const strokeWidth = 12;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressValue / 100) * circumference;
    const tone = progressValue >= 100 ? "var(--color-success-500, #16a34a)" : "var(--color-primary, #0a84ff)";

    return { ringSize, strokeWidth, radius, circumference, strokeDashoffset, tone };
  }, [progressValue]);

  return (
    <div
      className="relative flex min-h-[260px] w-full flex-col gap-6 overflow-hidden rounded-3xl border px-6 py-9 shadow-sm sm:px-12 sm:py-12"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface, #fff)",
      }}
    >
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-primary,#0a84ff)] animate-pulse" />
          {progressValue < 100 ? "IA em processamento" : "Pronto para revisão"}
          <span className="rounded-full bg-[color:var(--color-surface,#fff)] px-2 py-0.5 text-[10px] font-semibold border" style={{ borderColor: "var(--color-border)" }}>
            {mode === "tricologica" ? "Tricológica" : "Capilar"}
          </span>
        </div>

        <div className="relative flex items-center justify-center">
          <svg
            viewBox={`0 0 ${circularProgress.ringSize} ${circularProgress.ringSize}`}
            className="h-52 w-52"
            role="img"
            aria-label={`Progresso ${progressValue}%`}
            style={{ filter: "drop-shadow(0px 6px 16px rgba(10,132,255,0.12))" }}
          >
            <circle
              cx={circularProgress.ringSize / 2}
              cy={circularProgress.ringSize / 2}
              r={circularProgress.radius}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={circularProgress.strokeWidth}
              strokeDasharray={`${circularProgress.circumference}`}
              style={{ opacity: 0.55 }}
            />

            <circle
              cx={circularProgress.ringSize / 2}
              cy={circularProgress.ringSize / 2}
              r={circularProgress.radius}
              fill="none"
              stroke="var(--color-primary, #0a84ff)"
              strokeWidth={circularProgress.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${circularProgress.circumference}`}
              strokeDashoffset={circularProgress.strokeDashoffset}
              transform={`rotate(-90 ${circularProgress.ringSize / 2} ${circularProgress.ringSize / 2})`}
              style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease" }}
            />
            <circle
              cx={circularProgress.ringSize / 2}
              cy={circularProgress.ringSize / 2}
              r={circularProgress.radius - 10}
              fill="none"
              stroke="rgba(10,132,255,0.22)"
              strokeWidth={4}
              strokeDasharray={`${circularProgress.circumference * 0.25} ${circularProgress.circumference}`}
              strokeDashoffset={circularProgress.circumference * 0.1}
              transform={`rotate(90 ${circularProgress.ringSize / 2} ${circularProgress.ringSize / 2})`}
              style={{ opacity: 0.65 }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="flex w-full max-w-xs flex-col items-center gap-2 text-center px-4 py-2">
              <div className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)]">{progressValue}%</div>
              <div className="text-[12px] text-[color:var(--color-text-muted)]">
                {mode === "tricologica"
                  ? "Mapeando couro cabeludo, sinais inflamatórios e microscopia"
                  : "Lendo textura, porosidade e integridade química"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{
                backgroundColor: "var(--color-success-500, #16a34a)",
                boxShadow: "0 0 0 6px rgba(34,197,94,0.12)",
              }}
            />
            <span className="tracking-tight">Processando análise</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-border)]/50">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${progressValue}%`, transition: "width 0.4s ease", backgroundColor: "var(--color-primary,#0a84ff)" }}
            />
          </div>
          <div className="text-xs leading-relaxed text-[color:var(--color-text-muted)] text-center max-w-xl">
            {mode === "tricologica"
              ? "Sequenciando integridade do couro cabeludo, vascularização e achados microscópicos."
              : "Sequenciando cutícula, brilho, danos e compatibilidade química do fio."}
          </div>
        </div>
      </div>
    </div>
  );
}
