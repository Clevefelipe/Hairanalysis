import { CheckCircle2 } from "lucide-react";

type StepItem = {
  key: string;
  label: string;
};

type AnalysisStepProgressProps = {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (step: StepItem, index: number) => void;
};

export default function AnalysisStepProgress({
  steps,
  currentStepIndex,
  onStepClick,
}: AnalysisStepProgressProps) {
  const maxIndex = Math.max(steps.length - 1, 1);
  const boundedIndex = Math.max(0, Math.min(currentStepIndex, maxIndex));
  const progress = (boundedIndex / maxIndex) * 100;

  return (
    <section className="analysis-stepper-premium rounded-3xl border border-slate-100 bg-white p-4 shadow-sm premium-card">
      <div className="analysis-stepper-track">
        <div
          className="analysis-stepper-fill"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((item, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const clickable = typeof onStepClick === "function";

          const handleClick = () => {
            if (clickable) onStepClick(item, index);
          };

          const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!clickable) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onStepClick(item, index);
            }
          };

          return (
            <div
              key={item.key}
              className={[
                "analysis-step-item flex items-center gap-3 rounded-2xl border px-3 py-2 transition",
                isActive
                  ? "border-slate-300 bg-slate-50"
                  : isCompleted
                    ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)]/70"
                    : "border-slate-100 bg-white",
                clickable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:ring-offset-2" : "",
              ].join(" ")}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
            >
              <div
                className={[
                  "analysis-step-bullet flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : isCompleted
                      ? "bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]"
                      : "bg-slate-100 text-slate-400",
                ].join(" ")}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : index + 1}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                  Etapa {index + 1}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
