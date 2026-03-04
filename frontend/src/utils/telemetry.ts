type DashboardActionStatus = "success" | "error";

export function trackDashboardAction(
  action: string,
  status: DashboardActionStatus,
  metadata?: Record<string, any>,
) {
  try {
    const payload = {
      source: "dashboard",
      action,
      status,
      metadata: metadata ?? {},
      timestamp: new Date().toISOString(),
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/metrics/actions", blob);
    } else {
      fetch("/metrics/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Falha silenciosa em telemetria não bloqueia fluxo principal
      });
    }
  } catch (err) {
    // Telemetria falhou silenciosamente
  }
}
