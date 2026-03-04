import React from "react";

interface ClienteHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export default function ClienteHeader({
  title,
  subtitle,
  actionLabel,
  onActionClick,
}: ClienteHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        {actionLabel && onActionClick && (
          <button
            onClick={onActionClick}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-shadow hover:shadow-md"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
