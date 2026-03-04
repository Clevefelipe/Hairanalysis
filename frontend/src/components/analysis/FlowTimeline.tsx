import type { ReactNode } from "react";

export type FlowTimelineStatus = "done" | "active" | "blocked";

export type FlowTimelineStep = {
  key: string;
  step: string;
  title: string;
  description: string;
  status: FlowTimelineStatus;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  buttonVariant?: "primary" | "secondary";
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryDisabled?: boolean;
};

const statusTokens: Record<FlowTimelineStatus, { container: string; badge: string; label: string }> = {
  done: {
    container: "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)]",
    badge: "border-[color:var(--color-success-200)] bg-white text-[color:var(--color-success-700)]",
    label: "Concluído",
  },
  active: {
    container: "border-slate-200 bg-white",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    label: "Em andamento",
  },
  blocked: {
    container: "border-dashed border-slate-200 bg-slate-50",
    badge: "border-slate-200 bg-white text-slate-400",
    label: "Aguardando",
  },
};

export function FlowTimeline({ steps, className }: { steps: FlowTimelineStep[]; className?: string }) {
  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${className ?? ""}`.trim()}>
      {steps.map((step) => {
        const tokens = statusTokens[step.status];
        return (
          <div key={step.key} className={`rounded-3xl border p-5 transition ${tokens.container}`}>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
              <span>{step.step}</span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${tokens.badge}`}>
                {tokens.label}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {step.icon}
              <p className="text-lg font-semibold text-slate-900">{step.title}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{step.description}</p>
            {(step.actionLabel || step.secondaryActionLabel) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {step.actionLabel && step.onAction && (
                  <button
                    className={`${step.buttonVariant === "secondary" ? "btn-secondary" : "btn-primary"} text-sm`}
                    onClick={step.onAction}
                    disabled={step.disabled}
                    type="button"
                  >
                    {step.actionLabel}
                  </button>
                )}
                {step.secondaryActionLabel && step.onSecondaryAction && (
                  <button
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
                    onClick={step.onSecondaryAction}
                    disabled={step.secondaryDisabled}
                    type="button"
                  >
                    {step.secondaryActionLabel}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
