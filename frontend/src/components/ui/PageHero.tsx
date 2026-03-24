import { ReactNode } from "react";

type Meta = {
  label: string;
  value: string | number;
};

type Action = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
};

type PageHeroProps = {
  title: string;
  subtitle?: string;
  meta?: Meta[];
  actions?: Action[];
};

export default function PageHero({
  title,
  subtitle,
  meta,
  actions,
}: PageHeroProps) {
  const actionBase =
    "inline-flex w-full sm:w-auto min-w-[140px] justify-center items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold leading-5 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

  const actionVariant = (variant?: Action["variant"]) => {
    if (variant === "ghost") {
      return "border border-dashed border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[color-mix(in_srgb,var(--color-primary) 6%,transparent)] hover:text-[var(--color-primary)]";
    }
    if (variant === "secondary") {
      return "border border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary) 6%,var(--color-surface))] text-[var(--color-primary)] shadow-sm hover:bg-[color-mix(in_srgb,var(--color-primary) 12%,var(--color-surface))]";
    }
    return "bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-dark)]";
  };

  return (
    <div
      className="rounded-2xl border px-4 py-5 md:px-6 md:py-5"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
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
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{title}</h1>
            {subtitle && (
              <p className="max-w-2xl text-sm" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>
            )}
          </div>

          {meta && meta.length > 0 && (
            <div className="grid gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {meta.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="inline-flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
                  style={{ color: "var(--color-text)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)" }}>{item.label}</span>
                  <span className="text-right">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 md:gap-2 md:max-w-sm">
            {actions.map((action) => {
              const Tag = action.href ? "a" : "button";
              const classes = [
                actionBase,
                actionVariant(action.variant),
                action.disabled ? "cursor-not-allowed opacity-60" : "",
                "shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Tag
                  key={action.label}
                  onClick={action.onClick}
                  href={action.href}
                  target={action.target}
                  rel={action.target === "_blank" ? action.rel ?? "noopener noreferrer" : action.rel}
                  aria-disabled={action.disabled || undefined}
                  className={classes}
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
