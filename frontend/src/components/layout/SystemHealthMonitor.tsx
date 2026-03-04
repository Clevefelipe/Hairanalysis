import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, MinusCircle, RefreshCcw } from "lucide-react";
import clsx from "clsx";
import { useSystemHealth, type HealthStatus } from "@/hooks/useSystemHealth";

const statusMap: Record<HealthStatus, { color: string; bg: string; border: string; label: string; icon: typeof CheckCircle2 }> = {
  ok: {
    color: "text-[color:var(--color-success-600)]",
    bg: "bg-[color:var(--color-success-50)]",
    border: "border-[color:var(--color-success-200)]",
    label: "Operacional",
    icon: CheckCircle2,
  },
  degraded: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Degradado",
    icon: AlertTriangle,
  },
  unknown: {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    label: "Indefinido",
    icon: MinusCircle,
  },
};

const detailChecks = [
  { key: "database", label: "Banco" },
  { key: "storage", label: "Storage" },
  { key: "memory_rss", label: "Memória RSS" },
  { key: "memory_heap", label: "Memória Heap" },
] as const;

const formatBytes = (value?: number) => {
  if (typeof value !== "number") return "-";
  const mb = value / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

export default function SystemHealthMonitor() {
  const { data, loading, error, refresh } = useSystemHealth(45000);
  const [showDetails, setShowDetails] = useState(false);

  const statusKey: HealthStatus = error ? "degraded" : data?.status ?? "unknown";
  const status = statusMap[statusKey];
  const Icon = status.icon;

  const lastUpdate = data?.checks?.app?.info?.timestamp
    ? new Date(data.checks.app.info.timestamp).toLocaleString("pt-BR")
    : null;

  const summary = useMemo(() => {
    return detailChecks.map((item) => {
      const check = data?.checks?.[item.key];
      return {
        ...item,
        status: check?.status ?? "unknown",
        value: check?.value,
        limit: check?.limit,
        error: check?.error,
      };
    });
  }, [data]);

  if (!data && loading) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={clsx("max-w-sm rounded-2xl border-2 bg-white/90 shadow-2xl backdrop-blur", status.border)}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={clsx("flex h-10 w-10 items-center justify-center rounded-full", status.bg)}>
                <Icon className={clsx("h-5 w-5", status.color)} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Health</p>
                <p className={clsx("text-sm font-semibold", status.color)}>{status.label}</p>
                {lastUpdate && (
                  <p className="text-[11px] text-slate-400">Atualizado {lastUpdate}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:shadow-md"
                onClick={() => refresh()}
                disabled={loading}
              >
                <RefreshCcw className={clsx("h-4 w-4", loading && "animate-spin") } />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:shadow-md"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                <Activity className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-rose-600">{error}</p>
          )}

          {showDetails && (
            <div className="mt-4 space-y-3 border-t pt-3">
              {summary.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">{item.label}</span>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      item.status === "up" && "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]",
                      item.status === "down" && "bg-rose-50 text-rose-700",
                      item.status !== "up" && item.status !== "down" && "bg-slate-100 text-slate-500",
                    )}
                  >
                    {item.status === "up"
                      ? item.value
                        ? `${formatBytes(item.value)}${item.limit ? ` / ${formatBytes(item.limit)}` : ""}`
                        : "OK"
                      : item.status === "down"
                        ? item.error ?? "Falha"
                        : "--"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
