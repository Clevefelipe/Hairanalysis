import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PromSample = {
  name: string;
  labels: Record<string, string>;
  value: number;
};

export type MetricsSnapshot = {
  timestamp: number;
  totalRequests: number;
  clientErrors: number;
  serverErrors: number;
  avgLatencyMs: number;
  reportsCreated: number;
  reportsFailed: number;
  requestRate: number;
  errorRate: number;
};

const parsePrometheusMetrics = (raw: string): PromSample[] => {
  const samples: PromSample[] = [];
  const lines = raw.split("\n");
  const regex = /^([A-Za-z_:][A-Za-z0-9_:]*)(\{([^}]*)\})?\s+(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/;

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const match = line.match(regex);
    if (!match) continue;
    const [, name, , labelBlob = "", valueStr] = match;
    const labels: Record<string, string> = {};
    if (labelBlob) {
      labelBlob.split(",").forEach((chunk) => {
        const [key, rawValue] = chunk.split("=");
        if (!key || !rawValue) return;
        labels[key.trim()] = rawValue.replace(/^"|"$/g, "");
      });
    }
    const value = Number(valueStr);
    if (Number.isNaN(value)) continue;
    samples.push({ name, labels, value });
  }

  return samples;
};

const sumMetric = (samples: PromSample[], metricName: string, predicate?: (sample: PromSample) => boolean) => {
  return samples.reduce((total, sample) => {
    if (sample.name !== metricName) return total;
    if (predicate && !predicate(sample)) return total;
    return total + sample.value;
  }, 0);
};

export function usePrometheusMetrics(pollInterval = 60000) {
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [history, setHistory] = useState<MetricsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousRef = useRef<MetricsSnapshot | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMetrics = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setError(null);
      const response = await fetch("/api/metrics", {
        headers: { Accept: "text/plain" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Falha ao consultar /api/metrics (${response.status})`);
      }
      const text = await response.text();
      const samples = parsePrometheusMetrics(text);

      const totalRequests = sumMetric(samples, "http_requests_total");
      const clientErrors = sumMetric(samples, "http_requests_total", (sample) => sample.labels.status?.startsWith("4"));
      const serverErrors = sumMetric(samples, "http_requests_total", (sample) => sample.labels.status?.startsWith("5"));
      const durationSum = sumMetric(samples, "http_request_duration_seconds_sum");
      const durationCount = sumMetric(samples, "http_request_duration_seconds_count");
      const avgLatencyMs = durationCount > 0 ? (durationSum / durationCount) * 1000 : 0;
      const reportsCreated = sumMetric(samples, "reports_created_total");
      const reportsFailed = sumMetric(samples, "reports_failed_total");

      const timestamp = Date.now();
      const previous = previousRef.current;
      const deltaTimeSeconds = previous ? (timestamp - previous.timestamp) / 1000 : 0;
      const deltaRequests = previous ? totalRequests - previous.totalRequests : 0;
      const requestRate = previous && deltaTimeSeconds > 0 ? Math.max(deltaRequests / deltaTimeSeconds, 0) : 0;

      const currentSnapshot: MetricsSnapshot = {
        timestamp,
        totalRequests,
        clientErrors,
        serverErrors,
        avgLatencyMs,
        reportsCreated,
        reportsFailed,
        requestRate,
        errorRate: totalRequests > 0 ? (clientErrors + serverErrors) / totalRequests : 0,
      };

      previousRef.current = currentSnapshot;
      setSnapshot(currentSnapshot);
      setHistory((current) => {
        const next = [...current, currentSnapshot];
        return next.length > 12 ? next.slice(next.length - 12) : next;
      });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return;
      }
      setError((err as Error)?.message || "Erro desconhecido ao coletar métricas");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, pollInterval);
    return () => {
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [fetchMetrics, pollInterval]);

  return {
    snapshot,
    history,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
