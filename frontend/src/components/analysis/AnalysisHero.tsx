import { ReactNode } from "react";
import clsx from "clsx";

export type AnalysisHeroChip = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
};

export type AnalysisHeroAction = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

type AnalysisHeroProps = {
  title: string;
  subtitle?: string;
  chips?: AnalysisHeroChip[];
  actions?: AnalysisHeroAction[];
};

const toneStyles: Record<NonNullable<AnalysisHeroChip["tone"]>, { border: string; text: string; bg: string }> = {
  default: {
    border: "rgba(226, 232, 240, 0.85)",
    text: "var(--color-text)",
    bg: "var(--color-surface)",
  },
  success: {
    border: "rgba(16, 185, 129, 0.35)",
    text: "var(--color-success-700)",
    bg: "rgba(16, 185, 129, 0.08)",
  },
  warning: {
    border: "rgba(245, 158, 11, 0.35)",
    text: "#92400e",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  danger: {
    border: "rgba(239, 68, 68, 0.35)",
    text: "#b91c1c",
    bg: "rgba(239, 68, 68, 0.12)",
  },
};

const actionBase =
  "inline-flex w-full sm:w-auto min-w-[140px] justify-center items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const actionVariants: Record<NonNullable<AnalysisHeroAction["variant"]>, string> = {
  primary: "bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-dark)] focus-visible:outline-[var(--color-primary)]",
  secondary:
    "border border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary) 6%,var(--color-surface))] text-[var(--color-primary)] shadow-sm hover:bg-[color-mix(in_srgb,var(--color-primary) 12%,var(--color-surface))] focus-visible:outline-[var(--color-primary)]",
  ghost:
    "border border-dashed border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[color-mix(in_srgb,var(--color-primary) 6%,transparent)] focus-visible:outline-[var(--color-primary)]",
};

export default function AnalysisHero({ title, subtitle, chips, actions }: AnalysisHeroProps) {
  return (
    <div
      className="rounded-2xl border px-4 py-5 md:px-6 md:py-5 shadow-card"
      style={{ borderColor: "rgba(226,232,240,0.85)", backgroundColor: "var(--color-surface)" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            Hair Analysis System
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-sm" style={{ color: "var(--color-text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>

          {chips && chips.length > 0 && (
            <div className="grid gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {chips.map((chip) => {
                const tone = chip.tone ?? "default";
                const palette = toneStyles[tone];
                return (
                  <div
                    key={`${chip.label}-${chip.value}`}
                    className="inline-flex min-w-[160px] flex-col gap-1 rounded-lg border px-3 py-2"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.bg,
                      color: palette.text,
                    }}
                  >
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: tone === "default" ? "var(--color-text-muted)" : palette.text }}
                    >
                      {chip.label}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: palette.text }}>
                      {chip.value}
                    </p>
                    {chip.helper && (
                      <p className="text-[11px]" style={{ color: tone === "default" ? "var(--color-text-muted)" : palette.text }}>
                        {chip.helper}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 md:gap-2 md:max-w-sm">
            {actions.map((action) => {
              const Tag = action.href ? "a" : "button";
              const variant = action.variant ?? "secondary";
              const className = clsx(
                actionBase,
                actionVariants[variant],
                action.disabled && "cursor-not-allowed opacity-60",
                "shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
              );

              return (
                <Tag
                  key={action.label}
                  onClick={action.onClick}
                  href={action.href}
                  target={action.target}
                  rel={action.target === "_blank" ? action.rel ?? "noopener noreferrer" : action.rel}
                  aria-disabled={action.disabled || undefined}
                  className={className}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </Tag>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
