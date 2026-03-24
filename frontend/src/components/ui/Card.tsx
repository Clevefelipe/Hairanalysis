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

const variantAccentClasses: Record<CardVariant, string> = {
  default: "",
  attention: "ring-1 ring-amber-100",
  alert: "ring-1 ring-rose-100",
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
        "rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-card",
        variantAccentClasses[variant],
        className,
      ].join(" ")}
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-700">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs text-slate-500">
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
