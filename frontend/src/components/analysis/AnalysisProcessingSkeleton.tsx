import { useEffect, useState } from "react";
import styles from "./AnalysisProcessingSkeleton.module.css";

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

  return (
    <div
      className={`relative flex min-h-[260px] w-full flex-col gap-6 overflow-hidden rounded-3xl border px-6 py-9 shadow-sm sm:px-12 sm:py-12 ${styles.container}`}
    >
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-primary,#0a84ff)] animate-pulse" />
          {progressValue < 100 ? "IA em processamento" : "Pronto para revisão"}
          <span className={`rounded-full bg-[color:var(--color-surface,#fff)] px-2 py-0.5 text-[10px] font-semibold border ${styles.modeBadge}`}>
            {mode === "tricologica" ? "Tricológica" : "Capilar"}
          </span>
        </div>

        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 280 360"
            className={`h-80 w-auto ${styles.svgFilter}`}
            role="img"
            aria-label={`Análise Capilar - Progresso ${progressValue}%`}
          >
            {/* Ondas/pulsos de varredura animadas */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.6"/>
              </linearGradient>
            </defs>

            {/* Ondas de pulso ao redor */}
            <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(10,132,255,0.2)" strokeWidth="2" className={styles.scanWave1}/>
            <circle cx="140" cy="140" r="130" fill="none" stroke="rgba(10,132,255,0.15)" strokeWidth="2" className={styles.scanWave2}/>
            <circle cx="140" cy="140" r="100" fill="none" stroke="rgba(10,132,255,0.25)" strokeWidth="1.5" className={styles.scanWave3}/>

            {/* Linhas conectoras (estilo rede neural) */}
            <g className={styles.networkLines} opacity="0.4" stroke="rgba(10,132,255,0.5)" strokeWidth="1">
              <line x1="140" y1="50" x2="90" y2="90"/>
              <line x1="140" y1="50" x2="190" y2="90"/>
              <line x1="50" y1="140" x2="90" y2="130"/>
              <line x1="230" y1="140" x2="190" y2="130"/>
              <line x1="100" y1="220" x2="120" y2="180"/>
              <line x1="180" y1="220" x2="160" y2="180"/>
            </g>

            {/* Cabelo (topo) */}
            <path
              d="M 80 120 Q 70 80 100 50 Q 140 20 180 50 Q 210 80 200 120"
              fill="url(#hairGradient)"
              opacity="0.9"
              filter="url(#glow)"
            />

            {/* Fios de cabelo soltos (animados) */}
            <g className={styles.hairStrands} stroke="rgba(10,132,255,0.6)" strokeWidth="1.5" fill="none">
              <path d="M 85 55 Q 80 100 85 150" className={styles.strand}/>
              <path d="M 110 35 Q 105 95 110 155" className={styles.strand}/>
              <path d="M 140 25 Q 135 90 140 160" className={styles.strand}/>
              <path d="M 170 35 Q 175 95 170 155" className={styles.strand}/>
              <path d="M 195 55 Q 200 100 195 150" className={styles.strand}/>
            </g>

            {/* Cabeça (rosto) */}
            <circle cx="140" cy="140" r="50" fill="rgba(10,132,255,0.15)" stroke="rgba(10,132,255,0.4)" strokeWidth="2"/>

            {/* Características do rosto */}
            <circle cx="125" cy="130" r="6" fill="rgba(10,132,255,0.7)"/>
            <circle cx="155" cy="130" r="6" fill="rgba(10,132,255,0.7)"/>
            <path d="M 135 155 Q 140 160 145 155" stroke="rgba(10,132,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

            {/* Linha de progresso ao redor da cabeça */}
            <circle
              cx="140"
              cy="140"
              r="62"
              fill="none"
              stroke="rgba(10,132,255,0.3)"
              strokeWidth="3"
              strokeDasharray="389.5"
              strokeDashoffset={389.5 - (progressValue / 100) * 389.5}
              className={styles.hairProgressRing}
              opacity="0.8"
            />

            {/* Glow final quando completo */}
            {progressValue >= 90 && (
              <circle cx="140" cy="140" r="65" fill="none" stroke="rgba(10,132,255,0.4)" strokeWidth="2" className={styles.completionGlow}/>
            )}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="flex w-full max-w-xs flex-col items-center gap-2 text-center px-4 py-2">
              <div className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)]">{progressValue}%</div>
              <div className="text-[12px] text-[color:var(--color-text-muted)]">
                {mode === "tricologica"
                  ? "Mapeando análise capilar"
                  : "Processando integridade do fio"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <span
              className={`inline-flex h-2 w-2 rounded-full ${styles.statusDot}`}
            />
            <span className="tracking-tight">Processando análise</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-border)]/50">
            <progress
              className={styles.progressBar}
              value={progressValue}
              max={100}
              aria-label="Progresso da anÃ¡lise"
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
