import React from "react";

type CardVariant = "default" | "attention" | "alert";

interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}

const variantBorderClasses: Record<CardVariant, string> = {
  default: "border-l-primary",
  attention: "border-l-secondary",
  alert: "border-l-status-error",
};

export default function Card({
  title,
  description,
  children,
  action,
  variant = "default",
  className = "",
}: CardProps) {
  return (
    <div
      className={[
        "bg-surface rounded-xl border border-border border-l-4 p-4 md:p-5 shadow-card",
        variantBorderClasses[variant],
        className,
      ].join(" ")}
    >
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-text-main">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-text-muted">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className={action ? "mb-4" : undefined}>
          {children}
        </div>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}
