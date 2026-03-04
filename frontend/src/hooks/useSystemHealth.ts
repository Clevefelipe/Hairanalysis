import { useCallback, useEffect, useRef, useState } from "react";

export type HealthStatus = "ok" | "degraded" | "unknown";

type HealthCheck = {
  status: "up" | "down" | "unknown";
  value?: number;
  limit?: number;
  error?: string;
  info?: Record<string, any>;
};

export type HealthResponse = {
  status: HealthStatus;
  checks: Record<string, HealthCheck>;
};

export function useSystemHealth(pollInterval = 60000) {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchHealth = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/healthz", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Health check falhou (${response.status})`);
      }
      const json = (await response.json()) as HealthResponse;
      if (isMountedRef.current) {
        setData(json);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Erro ao consultar /healthz");
        setData(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, pollInterval);
    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
  }, [fetchHealth, pollInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchHealth,
  };
}
