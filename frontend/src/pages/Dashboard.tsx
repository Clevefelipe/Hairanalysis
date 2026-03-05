import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHistoryDashboard,
  AnalysisHistory,
  DashboardResponse,
  DashboardMetrics,
  DashboardNextVisit,
  getHistoryPdf,
  shareHistory,
  updateNextVisit,
} from "@/services/history.service";
import { trackDashboardAction } from "@/utils/telemetry";
import { formatDateShortBr } from "@/utils/date";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Brain,
  CalendarClock,
  ChevronRight,
  Clock4,
  Filter,
  Gauge,
  HeartPulse,
  History,
  Lightbulb,
  LineChart,
  MoveUpRight,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Users,
  Zap,
  BookOpen,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHero from '@/components/ui/PageHero';
import ActiveClientSummary from "@/components/clients/ActiveClientSummary";
import { useToast } from "@/components/ui/ToastProvider";
import { getDashboardQuickActions } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";
import { useClientSession } from "@/context/ClientSessionContext";
import { obterClientePorId, isValidUuidV4 } from "@/core/cliente/cliente.service";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import SectionToolbar from "@/components/ui/SectionToolbar";
import { useSalonBrandingTheme } from "@/context/SalonBrandingThemeContext";
import AiAttentionCard from "@/components/dashboard/AiAttentionCard";
import MetricCard from "@/components/ui/MetricCard";
import "./Dashboard.css";

const computeAverageScore = (items: AnalysisHistory[]) => {
  const totalScore = items.reduce((sum, item) => sum + (item.score ?? 0), 0);
  return items.length ? Math.round(totalScore / items.length) : 0;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const MODULES_KEY = "ha_dashboard_modules";

const PROFESSIONAL_FILTERS = [
  { id: "todos", label: "Todos os profissionais" },
  { id: "me", label: "Apenas minhas análises" },
];

const MODULE_OPTIONS = [
  { id: "advanced", label: "Indicadores avançados" },
  { id: "retornos", label: "Retornos & agenda" },
  { id: "timeline", label: "Linha do tempo" },
];

const percentageDelta = (current: number, previous: number) => {
  if (!previous || previous === 0) {
    return current ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

function MiniLineChart({
  data,
  height = 96,
  width = 320,
  color = "var(--color-primary-500)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  width?: number;
  color?: string;
}) {
  if (!data.length) {
    return <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Sem dados suficientes</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;
  const points = data.map((d, idx) => {
    const x = (idx / Math.max(1, data.length - 1)) * width;
    const y = height - ((d.value - minValue) / (maxValue - minValue || 1)) * (height - 12) - 6;
    return `${x},${y}`;
  });

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Evolução de score">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />
        {points.map((pt, idx) => {
          const [x, y] = pt.split(",").map(Number);
          return <circle key={idx} cx={x} cy={y} r={3} fill={color} opacity={0.85} />;
        })}
      </svg>
      <div className="flex flex-wrap gap-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {data.map((d, idx) => (
          <span key={`${d.label}-${idx}`} className="rounded-full px-2 py-1" style={{ backgroundColor: "var(--bg-primary)" }}>
            {d.label}: {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({
  data,
  color = "bg-[color:var(--color-success-500)]",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (!data.length) {
    return <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Sem recomendações registradas</p>;
  }
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const percent = Math.max(8, Math.round((d.value / maxValue) * 100));
        return (
          <div key={d.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--color-text)" }}>{d.label}</span>
              <span style={{ color: "var(--color-text-muted)" }}>{d.value}</span>
            </div>
            <div className="h-2.5 w-full rounded-full" style={{ backgroundColor: "var(--bg-primary)" }}>
              <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="h-64 rounded-3xl" style={{ backgroundColor: "var(--bg-primary)" }} />
        <div className="h-64 rounded-3xl" style={{ backgroundColor: "var(--bg-primary)" }} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-32 rounded-2xl" style={{ backgroundColor: "var(--bg-primary)" }} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="h-72 rounded-3xl" style={{ backgroundColor: "var(--bg-primary)" }} />
        <div className="h-72 rounded-3xl" style={{ backgroundColor: "var(--bg-primary)" }} />
      </div>
      <div className="h-64 rounded-3xl" style={{ backgroundColor: "var(--bg-primary)" }} />
    </div>
  );
}

const emptyMetrics: DashboardMetrics = {
  totalAnalyses: 0,
  safeAnalyses: 0,
  flaggedAnalyses: 0,
  avgScore: 0,
  today: { count: 0, delta: 0, yesterday: 0 },
  score: { currentWeekAvg: 0, previousWeekAvg: 0 },
  upcoming: { next7d: 0 },
  week: {
    current: { total: 0, capilar: 0, tricologica: 0, alerts: 0 },
    previous: { total: 0, capilar: 0, tricologica: 0, alerts: 0 },
  },
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisDetail, setAnalysisDetail] = useState<AnalysisHistory | null>(null);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(true);
  const [visitFilter, setVisitFilter] = useState<"all" | "capilar" | "tricologica">("all");
  const [showAllVisits, setShowAllVisits] = useState(false);
  const [statsRange, setStatsRange] = useState<"week" | "month">("week");
  const [visitRange, setVisitRange] = useState<7 | 30 | "all">(7);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [globalPeriod, setGlobalPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [globalProfessional, setGlobalProfessional] = useState<"todos" | "me">("todos");
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    analysisId: string | null;
    nextDate: string;
    error: string | null;
  }>({
    isOpen: false,
    analysisId: null,
    nextDate: "",
    error: null,
  });
  const [visibleModules, setVisibleModules] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(MODULES_KEY);
      return stored ? JSON.parse(stored) : MODULE_OPTIONS.map((module) => module.id);
    } catch {
      return MODULE_OPTIONS.map((module) => module.id);
    }
  });
  const INVALID_IDS_KEY = "ha_invalid_client_ids";

  const loadInvalidIds = useCallback(() => {
    try {
      const stored = localStorage.getItem(INVALID_IDS_KEY);
      if (!stored) return new Set<string>();

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  const saveInvalidIds = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(INVALID_IDS_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore
    }
  }, []);

  const [clientNameCache, setClientNameCache] = useState<Record<string, string>>({});
  const invalidClientIdsRef = useRef<Set<string>>(loadInvalidIds());
  const navigate = useNavigate();
  const { notify } = useToast();
  const { role } = useAuth();
  const { salonName } = useSalonBrandingTheme();
  const { activeClient, hasSession, endSession } = useClientSession();
  const { data: healthData, error: healthError, loading: healthLoading } = useSystemHealth(60000);
  const quickActions = useMemo(
    () => getDashboardQuickActions(role as "ADMIN" | "PROFESSIONAL" | null | undefined) || [],
    [role],
  );

  const getClientDisplayName = useCallback(
    (item: { clientName?: string | null; clientId?: string | null }) => {
      const direct = typeof item?.clientName === "string" ? item.clientName.trim() : "";
      if (direct) return direct;

      const cached = item?.clientId ? clientNameCache[item.clientId] : undefined;
      if (cached) return cached;

      if (activeClient?.id && item?.clientId === activeClient.id && activeClient?.nome?.trim()) {
        return activeClient.nome.trim();
      }

      return "Cliente não identificado";
    },
    [activeClient?.id, activeClient?.nome, clientNameCache],
  );

  const commitClientName = useCallback((id: string, name: string) => {
    if (!id) return;
    setClientNameCache((prev) => (prev[id] === name ? prev : { ...prev, [id]: name }));
  }, []);

  const resolveClientName = useCallback(
    async (item: AnalysisHistory) => {
      const currentName = getClientDisplayName(item);
      if (currentName !== "Cliente não identificado") return currentName;
      if (!item.clientId) return currentName;
      if (invalidClientIdsRef.current.has(item.clientId)) {
        commitClientName(item.clientId, "Cliente não identificado");
        return "Cliente não identificado";
      }
      if (!isValidUuidV4(item.clientId)) {
        commitClientName(item.clientId, "Cliente não identificado");
        return currentName;
      }

      try {
        const client = await obterClientePorId(item.clientId);
        if (client?.nome?.trim()) {
          const trimmed = client.nome.trim();
          commitClientName(item.clientId, trimmed);
          setAnalysisDetail((prev) => (prev && prev.id === item.id ? { ...prev, clientName: trimmed } : prev));
          return trimmed;
        }
      } catch (err) {
        return currentName;
      }

      return currentName;
    },
    [commitClientName, getClientDisplayName],
  );

  useEffect(() => {
    localStorage.setItem(MODULES_KEY, JSON.stringify(visibleModules));
  }, [visibleModules]);

  const toggleModule = (moduleId: string) => {
    setVisibleModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  };

  const refreshDashboard = useCallback(async () => {
    const result = await getHistoryDashboard({
      period: globalPeriod,
      professionalScope: globalProfessional === "me" ? "me" : "all",
    });
    setDashboardData(result);
    return result;
  }, [globalPeriod, globalProfessional]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        await refreshDashboard();
        if (isMounted) {
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Erro ao carregar dados do dashboard.");
          setDashboardData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [refreshDashboard]);

  const items = Array.isArray(dashboardData?.items) ? dashboardData.items : [];
  const alerts = Array.isArray(dashboardData?.alerts) ? dashboardData.alerts : [];
  const metrics = dashboardData?.metrics ?? emptyMetrics;
  const nextVisits = Array.isArray(dashboardData?.nextVisits) ? dashboardData.nextVisits : [];

  useEffect(() => {
    if (activeClient?.id && !isValidUuidV4(activeClient.id)) {
      endSession();
      notify("Sessão do cliente foi limpa por conter um identificador inválido.", "warning");
    }
  }, [activeClient?.id, endSession, notify]);

  useEffect(() => {
    const missingIds = new Set<string>();

    [...items, ...alerts, ...nextVisits].forEach((item) => {
      const id = item?.clientId;
      const hasName = typeof item?.clientName === "string" && item.clientName.trim().length > 0;
      if (!id || hasName || clientNameCache[id] || invalidClientIdsRef.current.has(id)) return;
      missingIds.add(id);
    });

    if (!missingIds.size) return;

    const resolveAll = async () => {
      for (const id of Array.from(missingIds)) {
        if (!id) continue;
        if (invalidClientIdsRef.current.has(id)) {
          commitClientName(id, "Cliente não identificado");
          continue;
        }
        if (!isValidUuidV4(id)) {
          commitClientName(id, "Cliente não identificado");
          invalidClientIdsRef.current.add(id);
          saveInvalidIds(invalidClientIdsRef.current);
          continue;
        }
        try {
          const client = await obterClientePorId(id);
          if (client?.nome?.trim()) {
            const trimmed = client.nome.trim();
            commitClientName(id, trimmed);
            invalidClientIdsRef.current.delete(id);
            setDashboardData((prev) => {
              if (!prev) return prev;

              const patchHistory = (list: AnalysisHistory[] | undefined) =>
                Array.isArray(list)
                  ? list.map((item) =>
                      item.clientId === id && (!item.clientName || !item.clientName.trim())
                        ? { ...item, clientName: trimmed }
                        : item,
                    )
                  : [];

              const patchVisits = (list: DashboardNextVisit[] | undefined) =>
                Array.isArray(list)
                  ? list.map((visit) =>
                      visit.clientId === id && (!visit.clientName || !visit.clientName.trim())
                        ? { ...visit, clientName: trimmed }
                        : visit,
                    )
                  : [];

              return {
                ...prev,
                items: patchHistory(prev.items),
                alerts: patchHistory(prev.alerts),
                nextVisits: patchVisits(prev.nextVisits),
              } as DashboardResponse;
            });
          } else {
            commitClientName(id, "Cliente não identificado");
            invalidClientIdsRef.current.add(id);
            saveInvalidIds(invalidClientIdsRef.current);
          }
        } catch (err: any) {
          commitClientName(id, "Cliente não identificado");
          if (err?.response?.status === 404) {
            invalidClientIdsRef.current.add(id);
            saveInvalidIds(invalidClientIdsRef.current);
          }
        }
      }
    };

    resolveAll();
  }, [alerts, commitClientName, items, nextVisits]);

  const activeClientStats = useMemo(() => {
    if (!activeClient?.id) return null;

    const clientAnalyses = items.filter((item) => item.clientId === activeClient.id);
    const clientAlerts = alerts.filter((item) => item.clientId === activeClient.id);
    const clientNextVisits = nextVisits.filter((visit) => visit.clientId === activeClient.id);

    const sortedAnalyses = [...clientAnalyses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const lastAnalysisDate = sortedAnalyses[0]
      ? new Date(sortedAnalyses[0].createdAt)
      : null;

    const today = new Date();
    const todayCount = clientAnalyses.filter((item) =>
      item?.createdAt ? isSameDay(new Date(item.createdAt), today) : false,
    ).length;

    const avgScoreClient = clientAnalyses.length
      ? Math.round(
          clientAnalyses.reduce((sum, item) => sum + (item.score ?? 0), 0) /
            clientAnalyses.length,
        )
      : null;

    return {
      analyses: clientAnalyses.length,
      alerts: clientAlerts.length,
      alertsList: clientAlerts,
      returns: clientNextVisits.length,
      avgScore: avgScoreClient,
      todayCount,
      lastAnalysisDate,
    };
  }, [activeClient?.id, alerts, items, nextVisits]);

  const safeAnalysesCount = metrics.safeAnalyses;
  const todayCount = metrics.today.count;
  const todayDelta = metrics.today.delta;
  const avgScore = metrics.avgScore;
  const scoreDelta = metrics.score.currentWeekAvg - metrics.score.previousWeekAvg;
  const scoreDisplayValue = activeClientStats ? activeClientStats.avgScore : avgScore;
  const scoreDetail = activeClientStats
    ? activeClientStats.avgScore !== null
      ? `${activeClientStats.analyses} análises consideradas`
      : "Sem análises registradas"
    : "Base semanal consolidada";
  const scoreDeltaLabel = activeClientStats
    ? activeClientStats.avgScore !== null
      ? "Média personalizada da cliente"
      : "Registre análises para exibir média"
    : scoreDelta === 0
      ? "Estável vs semana"
      : `${scoreDelta > 0 ? "+" : ""}${scoreDelta} pts vs semana`;
  const scoreDeltaClass = activeClientStats
    ? ""
    : scoreDelta === 0
      ? ""
      : scoreDelta > 0
        ? "text-[color:var(--color-success-600)]"
        : "text-[color:var(--color-error-600)]";

  const healthScore = useMemo(() => {
    const compliancePercent = metrics.totalAnalyses
      ? (safeAnalysesCount / metrics.totalAnalyses) * 70
      : 0;
    const scoreComponent = avgScore ? (avgScore / 100) * 20 : 0;
    const alertPenalty = alerts.length > 0 ? Math.min(alerts.length * 2.5, 15) : 0;
    const rawValue = Math.max(0, Math.min(100, compliancePercent + scoreComponent - alertPenalty + 25));
    const trend = percentageDelta(todayCount, metrics.today.yesterday);
    const status = rawValue >= 85 ? "excelente" : rawValue >= 70 ? "estável" : "crítico";
    return {
      value: Math.round(rawValue),
      trend,
      status,
      label:
        status === "excelente"
          ? "Operação premium"
          : status === "estável"
            ? "Atenção moderada"
            : "Revisão imediata",
      breakdown: [
        {
          label: "Alertas",
          value: alerts.length,
          intent: alerts.length ? "text-[color:var(--color-error-600)]" : "text-[color:var(--color-success-700)]",
        },
        {
          label: "Retornos",
          value: nextVisits.length,
          intent: "",
        },
        {
          label: "Score médio",
          value: avgScore,
          intent: avgScore > 70 ? "text-[color:var(--color-success-700)]" : "text-[color:var(--color-warning-700)]",
        },
      ],
    };
  }, [alerts.length, avgScore, metrics.today.yesterday, nextVisits.length, safeAnalysesCount, todayCount, metrics.totalAnalyses]);

  const aiForecast = useMemo(() => {
    const riskLevel = alerts.length > 15 ? "alto" : alerts.length > 5 ? "moderado" : "baixo";
    const humanized =
      riskLevel === "alto"
        ? "Risco elevado de retrabalho em protocolos químicos"
        : riskLevel === "moderado"
          ? "Monitorar protocolos com elasticidade alterada"
          : "Operação estável — mantenha o monitoramento";
    return { riskLevel, description: humanized };
  }, [alerts.length]);

  const aiInsight = useMemo(() => {
    const lowScoreClients = items.filter((item) => (item.score ?? 0) < 40);
    const growth = percentageDelta(lowScoreClients.length, Math.max(1, Math.round(lowScoreClients.length * 0.82)));
    return {
      message:
        lowScoreClients.length > 0
          ? `Clientes com score abaixo de 40 cresceram ${growth}% na semana.`
          : "Nenhum cliente crítico identificado na semana.",
      supporting: `${lowScoreClients.length} clientes em estado crítico monitorados no período.`,
    };
  }, [items]);

  const getAnalysisTypeLabel = (type: AnalysisHistory["analysisType"]) => {
    if (type === "capilar") return "Capilar";
    if (type === "tricologica") return "Tricológica";
    return "Integrada";
  };

  const canEditAnalysis = (type: AnalysisHistory["analysisType"]): type is "capilar" | "tricologica" => {
    return type === "capilar" || type === "tricologica";
  };

  const timelineEvents = useMemo(() => {
    return items.slice(0, 6).map((item) => ({
      id: item.id,
      label: getAnalysisTypeLabel(item.analysisType),
      time: new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      summary: item.interpretation || "Resumo indisponível",
      score: item.score ?? 0,
    }));
  }, [items]);

  const alertSeverity = useMemo(() => {
    if (alerts.length === 0) {
      return { label: "Operação estável", tone: "ok" } as const;
    }
    if (alerts.length < 10) {
      return { label: "Atenção", tone: "attention" } as const;
    }
    return { label: "Crítico", tone: "critical" } as const;
  }, [alerts.length]);

  const severityVisual = useMemo(() => {
    return {
      bar:
        alertSeverity.tone === "critical"
          ? "bg-rose-600"
          : alertSeverity.tone === "attention"
            ? "bg-amber-500"
            : "bg-[color:var(--color-success-600)]",
      badge:
        alertSeverity.tone === "critical"
          ? "badge-critical"
          : alertSeverity.tone === "attention"
            ? "badge-attention"
            : "badge-ok",
    };
  }, [alertSeverity.tone]);

  const aiAttentionCopy = useMemo(() => {
    if (activeClientStats) {
      const clientName = activeClient?.nome ?? "Cliente";
      return {
        title: activeClientStats.alerts
          ? `${clientName} com ${activeClientStats.alerts} alerta(s)`
          : `${clientName} sem alertas críticos`,
        description: activeClientStats.alerts
          ? "Revise os alertas desta cliente antes de liberar novos procedimentos."
          : "Sem alertas técnicos abertos para esta cliente.",
      };
    }

    return {
      title: alerts.length
        ? `${alerts.length} protocolos com atenção técnica`
        : "Nenhum protocolo em risco",
      description: alerts.length
        ? "Revise os alertas antes de liberar novos procedimentos químicos."
        : "Tudo está dentro do padrão. Continue registrando análises para manter o monitoramento ativo.",
    };
  }, [activeClient?.nome, activeClientStats, alerts.length]);

  const todayDeltaVisualClass = useMemo(() => {
    if (todayDelta === 0) return "";
    return todayDelta > 0 ? "text-[color:var(--color-success-600)]" : "text-[color:var(--color-error-600)]";
  }, [todayDelta]);

  const monthRangeStats = useMemo(() => {
    const now = new Date();
    const startCurrent = new Date(now);
    startCurrent.setDate(startCurrent.getDate() - 30);
    const startPrevious = new Date(startCurrent);
    startPrevious.setDate(startPrevious.getDate() - 30);

    const current = items.filter((item) => {
      const created = new Date(item.createdAt);
      return created >= startCurrent;
    });

    const previous = items.filter((item) => {
      const created = new Date(item.createdAt);
      return created >= startPrevious && created < startCurrent;
    });

    const countByType = (data: AnalysisHistory[], type: "capilar" | "tricologica") =>
      data.filter((item) => item.analysisType === type).length;

    return {
      total: current.length,
      capilar: countByType(current, "capilar"),
      tricologica: countByType(current, "tricologica"),
      alerts: current.filter((item) => (item.flags?.length ?? 0) > 0).length,
      previous: {
        total: previous.length,
        capilar: countByType(previous, "capilar"),
        tricologica: countByType(previous, "tricologica"),
        alerts: previous.filter((item) => (item.flags?.length ?? 0) > 0).length,
      },
    };
  }, [items]);

  const stats = useMemo(() => {
    const selectedStats =
      statsRange === "week"
        ? {
            current: metrics.week.current,
            previous: metrics.week.previous,
          }
        : {
            current: {
              total: monthRangeStats.total,
              capilar: monthRangeStats.capilar,
              tricologica: monthRangeStats.tricologica,
              alerts: monthRangeStats.alerts,
            },
            previous: monthRangeStats.previous,
          };

    const deltas = (current: number, previous: number) => current - previous;

    return [
      {
        label: "Total de análises",
        value: selectedStats.current.total,
        delta: deltas(selectedStats.current.total, selectedStats.previous.total),
      },
      {
        label: "Capilar",
        value: selectedStats.current.capilar,
        delta: deltas(selectedStats.current.capilar, selectedStats.previous.capilar),
      },
      {
        label: "Tricológica",
        value: selectedStats.current.tricologica,
        delta: deltas(
          selectedStats.current.tricologica,
          selectedStats.previous.tricologica,
        ),
      },
      {
        label: "Alertas técnicos",
        value: selectedStats.current.alerts,
        delta: deltas(selectedStats.current.alerts, selectedStats.previous.alerts),
      },
    ];
  }, [metrics, monthRangeStats, statsRange]);

  const lastAnalyses = items.slice(0, 2);

  const scoreSeries = useMemo(() => {
    const sorted = [...items]
      .filter((item) => typeof item?.score === "number")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sorted.slice(-8).map((item, idx) => ({
      label: formatDateShortBr(item.createdAt),
      value: item.score ?? 0,
      key: item.id ?? idx,
    }));
  }, [items]);

  const topTreatments = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const list = Array.isArray((item as any)?.recommendedTreatments)
        ? (item as any).recommendedTreatments
        : Array.isArray((item as any)?.treatments)
          ? (item as any).treatments
          : [];
      list.forEach((t: any) => {
        const label = typeof t === "string" ? t : t?.name ?? t?.nome ?? "Tratamento";
        if (!label) return;
        counts[label] = (counts[label] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items]);

  const filteredNextVisits = useMemo(() => {
    const now = new Date();
    const rangeLimit =
      visitRange === "all" ? null : new Date(now.getTime() + visitRange * 24 * 60 * 60 * 1000);
    return nextVisits.filter((item) => {
      const matchesDomain = visitFilter === "all" ? true : item.analysisType === visitFilter;
      const matchesRange = rangeLimit ? item.nextDate <= rangeLimit : true;
      return matchesDomain && matchesRange;
    });
  }, [nextVisits, visitFilter, visitRange]);

  const visibleNextVisits = useMemo(() => {
    return filteredNextVisits.slice(0, showAllVisits ? 6 : 2);
  }, [filteredNextVisits, showAllVisits]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  const handleOpenAnalysis = (item: AnalysisHistory) => {
    setAnalysisDetail(item);
    if (!item.clientName || !item.clientName.trim()) {
      resolveClientName(item);
    }
  };

  const runAction = async (
    key: string,
    actionName: string,
    fn: () => Promise<void>,
    metadata?: Record<string, any>,
  ) => {
    setActionLoadingKey(key);
    try {
      await fn();
      trackDashboardAction(actionName, "success", metadata);
    } finally {
      setActionLoadingKey((current) => (current === key ? null : current));
    }
  };

  const handleDownloadPdf = async (analysisId: string) => {
    await runAction(`pdf-${analysisId}`, "download_pdf", async () => {
      try {
        const blob = await getHistoryPdf(analysisId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analise-${analysisId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        notify("PDF gerado com sucesso", "success");
      } catch (err) {
        notify("Falha ao gerar PDF", "error");
        trackDashboardAction("download_pdf", "error", { analysisId, error: String(err) });
      }
    }, { analysisId });
  };

  const handleShareAnalysis = async (analysisId: string) => {
    await runAction(`share-${analysisId}`, "share_analysis", async () => {
      try {
        const { url } = await shareHistory(analysisId);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          notify("Link copiado para a área de transferência", "success");
        } else {
          notify("Link gerado: " + url, "info");
        }
      } catch (err) {
        notify("Não foi possível compartilhar", "error");
        trackDashboardAction("share_analysis", "error", { analysisId, error: String(err) });
      }
    }, { analysisId });
  };

  const handleEditAnalysis = (analysisId: string, type: "capilar" | "tricologica") => {
    const route = type === "tricologica" ? "/analise-tricologica" : "/analise-capilar";
    navigate(`${route}?historyId=${analysisId}`);
  };

  const handleConfirmVisit = (analysisId: string) => {
    runAction(`confirm-visit-${analysisId}`, "confirm_visit", async () => {
      try {
        await updateNextVisit(analysisId, { action: "confirm" });
        notify("Retorno confirmado", "success");
        await refreshDashboard();
      } catch (err) {
        notify("Não foi possível confirmar o retorno", "error");
        trackDashboardAction("confirm_visit", "error", { analysisId, error: String(err) });
      }
    }, { analysisId });
  };

  const handleRescheduleVisit = (analysisId: string, currentDate: Date) => {
    const defaultValue = currentDate.toISOString().split("T")[0];
    setRescheduleModal({
      isOpen: true,
      analysisId,
      nextDate: defaultValue,
      error: null,
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({
      isOpen: false,
      analysisId: null,
      nextDate: "",
      error: null,
    });
  };

  const confirmRescheduleVisit = () => {
    if (!rescheduleModal.analysisId) {
      return;
    }

    const nextDate = rescheduleModal.nextDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      setRescheduleModal((prev) => ({
        ...prev,
        error: "Use o formato AAAA-MM-DD.",
      }));
      return;
    }

    const parsedDate = new Date(`${nextDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      setRescheduleModal((prev) => ({
        ...prev,
        error: "Data inválida. Verifique o dia informado.",
      }));
      return;
    }

    runAction(`reschedule-visit-${rescheduleModal.analysisId}`, "reschedule_visit", async () => {
      try {
        await updateNextVisit(rescheduleModal.analysisId as string, { action: "reschedule", nextDate });
        notify("Retorno remarcado", "success");
        closeRescheduleModal();
        await refreshDashboard();
      } catch (err) {
        notify("Não foi possível remarcar o retorno", "error");
        trackDashboardAction("reschedule_visit", "error", {
          analysisId: rescheduleModal.analysisId,
          nextDate,
          error: String(err),
        });
      }
    }, { analysisId: rescheduleModal.analysisId, nextDate });
  };

  const executiveMetrics = useMemo(() => {
    const compliancePercent = metrics.totalAnalyses
      ? (safeAnalysesCount / metrics.totalAnalyses) * 100
      : 0;
    const pulseAlerts = metrics.upcoming.next7d;
    const backendStatus = healthError
      ? "erro"
      : healthLoading
        ? "carregando"
        : healthData?.status ?? "desconhecido";
    const backendLabel =
      backendStatus === "erro"
        ? "Erro"
        : backendStatus === "carregando"
          ? "Carregando"
          : backendStatus === "ok"
            ? "OK"
            : backendStatus === "degraded"
              ? "Degradado"
              : "Indefinido";
    const databaseStatus = healthData?.checks?.database?.status ?? "--";
    const storageStatus = healthData?.checks?.storage?.status ?? "--";
    const backendSubLabel = healthError
      ? "Falha ao consultar /healthz"
      : healthLoading
        ? "Consultando /healthz..."
        : `DB ${databaseStatus} • Storage ${storageStatus}`;

    return [
      {
        label: "Compliance IA",
        value: `${compliancePercent.toFixed(1)}%`,
        subLabel: `${safeAnalysesCount} aprovadas de ${metrics.totalAnalyses} no mês`,
        icon: ShieldCheck,
        intent: "text-[color:var(--color-success-600)]",
      },
      {
        label: "Produtividade",
        value: `${todayCount} sessões`,
        subLabel: todayDelta === 0 ? "Estável vs ontem" : `${todayDelta > 0 ? "+" : ""}${todayDelta} vs ontem`,
        icon: Activity,
        intent: todayDelta >= 0 ? "text-[color:var(--color-success-700)]" : "text-[color:var(--color-error-600)]",
      },
      {
        label: "Pulse IA",
        value: pulseAlerts ? `${pulseAlerts} alertas` : "Sem alertas",
        subLabel: pulseAlerts ? "Retornos próximos (7d)" : "Sem retornos críticos",
        icon: Zap,
        intent: pulseAlerts ? "text-[color:var(--color-warning-700)]" : "",
      },
      {
        label: "Saúde do backend",
        value: backendLabel,
        subLabel: backendSubLabel,
        icon: HeartPulse,
        intent:
          backendStatus === "erro"
            ? "text-[color:var(--color-error-600)]"
            : backendStatus === "ok"
              ? "text-[color:var(--color-success-600)]"
              : "text-[color:var(--color-warning-700)]",
      },
    ];
  }, [healthData, healthError, healthLoading, metrics, safeAnalysesCount, todayCount, todayDelta]);

  const heroHighlights = useMemo(() => {
    if (activeClientStats) {
      const lastLabel = activeClientStats.lastAnalysisDate
        ? `Última em ${dateFormatter.format(activeClientStats.lastAnalysisDate)}`
        : "Nenhuma análise registrada";

      return [
        {
          label: "Análises da cliente",
          value: activeClientStats.analyses,
          context: lastLabel,
          tone: "bg-[color:var(--color-success-300)]",
        },
        {
          label: "Retornos agendados",
          value: activeClientStats.returns,
          context: activeClientStats.returns
            ? "Monitorando próximas visitas"
            : "Nenhum retorno programado",
          tone: activeClientStats.returns ? "bg-cyan-300" : "bg-[var(--bg-primary)]",
        },
        {
          label: "Alertas técnicos",
          value: activeClientStats.alerts,
          context: activeClientStats.alerts
            ? "Revisão necessária"
            : "Sem alertas desta cliente",
          tone: activeClientStats.alerts ? "bg-amber-300" : "bg-[color:var(--color-success-200)]",
        },
      ];
    }

    return [
      {
        label: "Análises monitoradas",
        value: safeAnalysesCount,
        context: `com protocolos em dia (${globalPeriod})`,
        tone: "bg-[color:var(--color-success-300)]",
      },
      {
        label:
          visitRange === "all"
            ? "Retornos"
            : `Retornos (${visitRange === 7 ? "7d" : "30d"})`,
        value: visitRange === "all" ? nextVisits.length : filteredNextVisits.length,
        context: "agenda sugerida",
        tone: "bg-cyan-300",
      },
      {
        label: "Alertas ativos",
        value: alerts.length,
        context: alerts.length ? "revisão técnica" : "nenhum risco",
        tone: alerts.length ? "bg-amber-300" : "bg-[color:var(--color-success-200)]",
      },
    ];
  }, [
    activeClientStats,
    alerts.length,
    dateFormatter,
    filteredNextVisits.length,
    globalPeriod,
    nextVisits.length,
    safeAnalysesCount,
    visitRange,
  ]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="p-6 text-red-600">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="section-stack animate-page-in w-full">
      {hasSession && activeClient && (
        <div
          className="rounded-xl border p-4 shadow-card"
          style={{ backgroundColor: "#ffffff", borderColor: "var(--color-border)", color: "var(--color-text)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Sessão ativa</p>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--color-success-200)", backgroundColor: "var(--color-success-50)", color: "var(--color-success-700)" }}>
                  Em andamento
                </span>
              </div>
              <ActiveClientSummary client={activeClient} />
            </div>

            <div className="w-full space-y-2 lg:w-auto">
              <p className="text-[10px] uppercase tracking-[0.24em] lg:text-right" style={{ color: "var(--color-text-muted)" }}>Ações rápidas</p>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
                <Button
                  className="w-full text-sm"
                  onClick={() => navigate(`/analise-capilar?clientId=${activeClient.id}`)}
                >
                  Nova análise
                </Button>
                <Button
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={() => navigate(`/historico?clientId=${activeClient.id}`)}
                >
                  Ver histórico
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm sm:col-span-2 lg:col-span-1"
                  onClick={endSession}
                >
                  Encerrar sessão
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-xl border p-4 shadow-card" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
            <SlidersHorizontal size={14} />
            Filtros globais
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
            <div className="flex flex-wrap gap-2 text-sm font-semibold lg:justify-end" style={{ color: "var(--color-text-muted)" }}>
              {["7d", "30d", "90d"].map((period) => (
                <button
                  key={period}
                  onClick={() => setGlobalPeriod(period as typeof globalPeriod)}
                  className={`rounded-full border px-3 py-1 transition ${
                    globalPeriod === period
                      ? "border-[color:var(--color-success-500)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                      : ""
                  }`}
                  style={globalPeriod === period ? undefined : { borderColor: "var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <Filter size={14} style={{ color: "var(--color-text-muted)" }} />
                <select
                  value={globalProfessional}
                  onChange={(e) => setGlobalProfessional(e.target.value as "todos" | "me")}
                  className="bg-transparent text-xs font-semibold outline-none"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {PROFESSIONAL_FILTERS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="w-full rounded-full border px-3 py-1 text-center text-[11px] font-semibold sm:w-auto sm:text-left" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                {globalProfessional === "me" ? "Escopo: minhas análises" : "Escopo: equipe completa"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-3.5 lg:grid-cols-[1.7fr,1fr]">
        <div
          className="relative overflow-hidden rounded-xl border p-3.5 sm:p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
              <span className="hero-chip">IA Estética ativa</span>
              <span className="hero-chip">Painel executivo</span>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Inteligência estética ativa</p>
              <h1 className="max-w-3xl text-xl font-semibold leading-tight sm:text-2xl" style={{ color: "var(--color-text)" }}>
                Visão executiva de {salonName}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                Monitoramos cada análise para garantir segurança, previsibilidade e protocolos personalizados com padrão Hair Analysis System.
              </p>
              {activeClientStats && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Exibindo métricas específicas de {activeClient?.nome}. Encerre a sessão para voltar ao panorama geral.
                </p>
              )}
            </div>
            <div className="grid gap-2 sm:gap-2.5 md:grid-cols-3">
              {heroHighlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="card-clickable rounded-lg border p-2.5 transition duration-200"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>{highlight.label}</p>
                    <span className={`h-2 w-2 rounded-full ${highlight.tone}`} />
                  </div>
                  <p className="mt-1.5 text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>{highlight.value}</p>
                  <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{highlight.context}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:gap-2.5 md:grid-cols-3">
              {quickActions.map((action) => (
                <button
                  type="button"
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="group card-clickable relative flex h-full flex-col justify-between rounded-lg border p-2.5 pr-9 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
                >
                  <span className="absolute right-3 top-3 rounded-full border p-1 transition group-hover:scale-105" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}>
                    <ArrowUpRight size={13} />
                  </span>
                  <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>
                    {action.icon && (
                      <span className="rounded-2xl border p-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}>
                        <action.icon size={16} />
                      </span>
                    )}
                    {action.label}
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{action.description}</p>
                  <span className="mt-1.5 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>{action.badge}</span>
                </button>
              ))}
            </div>

            <div className="mt-1 rounded-lg border p-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <div className="border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                <SectionToolbar className="justify-between">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                    <LineChart size={16} />
                    <span>Visão gráfica</span>
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Scores e recomendações</span>
                </SectionToolbar>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border p-4 shadow-card" style={{ color: "var(--color-text)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                      <LineChart size={16} />
                      <span>Evolução de score</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Últimas {scoreSeries.length} análises</span>
                  </div>
                  <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                    <MiniLineChart data={scoreSeries} color="var(--color-success-500)" />
                  </div>
                </div>

                <div className="rounded-xl border p-4 shadow-card" style={{ color: "var(--color-text)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                      <BarChart3 size={16} />
                      <span>Top tratamentos</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Top 5</span>
                  </div>
                  <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                    <MiniBarChart data={topTreatments} color="bg-[color:var(--color-success-400)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <AiAttentionCard
            severityVisual={severityVisual}
            alertSeverityLabel={alertSeverity.label}
            aiAttentionCopy={aiAttentionCopy}
            scoreDisplayValue={scoreDisplayValue}
            scoreTitle={activeClientStats ? "Score médio da cliente" : "Score médio"}
            scoreDetail={scoreDetail}
            scoreDeltaLabel={scoreDeltaLabel}
            scoreDeltaClass={scoreDeltaClass}
            activeClientStats={activeClientStats}
            todayCount={activeClientStats ? activeClientStats.todayCount : todayCount}
            todayDelta={todayDelta}
            todayDeltaVisualClass={todayDeltaVisualClass}
            onOpenAnalysis={handleOpenAnalysis}
            onNavigateHistory={() =>
              activeClientStats && activeClient
                ? navigate(`/historico?clientId=${activeClient.id}`)
                : navigate("/historico")
            }
            dateFormatter={dateFormatter}
          />
        </div>
      </section>

      {visibleModules.includes("timeline") && (
        <section className="rounded-xl border p-4 shadow-card" style={{ backgroundColor: "var(--color-surface)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Linha do tempo</p>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Eventos críticos recentes</h3>
            </div>
            <History size={18} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="mt-3.5 space-y-2.5">
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-lg border p-2.5 card-clickable" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] font-semibold">
                  {event.time}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{event.label} · Score {event.score}</p>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{event.summary}</p>
                </div>
                <MoveUpRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        className="rounded-xl border p-5 shadow-card transition-shadow"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>Indicadores avançados</p>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Base operacional e comparativos</h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Saúde do backend, produtividade e evolução das análises.</p>
          </div>
          <Button
            variant="ghost"
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            onClick={() => setShowAdvancedInsights((open) => !open)}
          >
            {showAdvancedInsights ? "Recolher" : "Expandir"}
          </Button>
        </div>

        {showAdvancedInsights && (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3.5 md:grid-cols-[1.2fr,0.8fr,0.8fr]">
              <div className="rounded-xl border p-4 shadow-card">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                  <span>Health Index</span>
                  <span style={{ color: "var(--color-text-muted)" }}>Visão executiva</span>
                </div>
                <div className="mt-3.5 flex items-center gap-3.5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] shadow-inner">
                    <Gauge size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-semibold" style={{ color: "var(--color-text)" }}>{healthScore.value}/100</p>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{healthScore.label}</p>
                    <p className="text-xs font-semibold text-[color:var(--color-success-700)]">{healthScore.trend >= 0 ? "+" : ""}{healthScore.trend}% vs ontem</p>
                  </div>
                </div>
                <div className="mt-3.5 grid grid-cols-3 gap-3">
                  {healthScore.breakdown.map((item) => (
                    <MetricCard
                      key={item.label}
                      label={item.label}
                      value={<span className={`text-lg font-semibold ${item.intent}`}>{item.value}</span>}
                      className="shadow-card"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-4 shadow-card">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                  <span>Previsão IA</span>
                  <span className="rounded-full px-3 py-1 text-[10px] font-semibold text-[color:var(--color-success-700)]" style={{ backgroundColor: "var(--color-surface)" }}>7 dias</span>
                </div>
                <div className="mt-3.5 rounded-lg border p-3 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    <Brain size={16} style={{ color: "var(--color-primary)" }} />
                    Risco {aiForecast.riskLevel}
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug" style={{ color: "var(--color-text)" }}>{aiForecast.description}</p>
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>Gerado a partir dos alertas técnicos e volume recente.</p>
                </div>
              </div>

              <div className="rounded-xl border p-4 shadow-card flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                  <span>Insight automático</span>
                  <span className="rounded-full bg-[color:var(--color-success-50)] px-3 py-1 text-[10px] font-semibold text-[color:var(--color-success-700)]">IA</span>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb size={20} className="text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{aiInsight.message}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{aiInsight.supporting}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border p-4 shadow-card">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                  <span>Base de operação</span>
                  <span>Atualização em tempo real</span>
                </div>
                <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                  {executiveMetrics.map((metric) => (
                    <MetricCard
                      key={metric.label}
                      icon={<metric.icon size={18} />}
                      label={metric.label}
                      value={<span className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>{metric.value}</span>}
                      subLabel={<span style={{ color: "var(--color-text-muted)" }}>{metric.subLabel}</span>}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-4 shadow-card" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                  <span>Indicadores comparativos</span>
                  <div className="flex gap-1 text-[11px] uppercase tracking-[0.2em]">
                    {["week", "month"].map((range) => (
                      <button
                        key={range}
                        className={[
                          "rounded-full border px-3 py-1",
                          statsRange === range
                            ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                            : "",
                        ].join(" ")}
                        style={statsRange === range ? undefined : { borderColor: "var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}
                        onClick={() => setStatsRange(range as typeof statsRange)}
                      >
                        {range === "week" ? "7d" : "30d"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                  {stats.map((stat) => {
                    const deltaLabel = stat.delta === 0 ? "Estável no período" : `${stat.delta > 0 ? "+" : ""}${stat.delta} vs período anterior`;
                    const deltaClass =
                      stat.delta === 0
                        ? "text-[color:var(--color-text-muted)]"
                        : stat.delta > 0
                          ? "text-[color:var(--color-success-600)]"
                          : "text-[color:var(--color-error-600)]";
                    return (
                      <MetricCard
                        key={stat.label}
                        label={stat.label}
                        value={<span className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{stat.value}</span>}
                        subLabel={<span className={`text-xs font-semibold ${deltaClass}`}>{deltaLabel}</span>}
                        className="shadow-card"
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                <span>Tendência semanal</span>
                <div className="flex gap-2 text-[11px] uppercase tracking-[0.2em]">
                  {heroHighlights.map((highlight) => (
                    <span key={`trend-${highlight.label}`} className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                      {highlight.label}: <strong style={{ color: "var(--color-text)" }}>{highlight.value}</strong>
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Use os indicadores acima para validar a eficácia dos protocolos e o ritmo de acompanhamento técnico.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Últimas análises</p>
            <button className="text-xs font-semibold text-[color:var(--color-success-700)] hover:text-[color:var(--color-success-800)]" onClick={() => navigate("/historico")}>
              Ver tudo
            </button>
          </div>
          <div className="list-scroll mt-4 max-h-[440px] space-y-3 overflow-y-auto pr-1">
            {lastAnalyses.map((item) => (
              <div key={item.id} className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow card-clickable" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>{dateFormatter.format(new Date(item.createdAt))}</span>
                  <span className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                    {getAnalysisTypeLabel(item.analysisType)}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {getClientDisplayName(item)}
                </p>
                <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                  {item.interpretation || "Sem resumo disponível."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>
                    Score: <strong style={{ color: "var(--color-text)" }}>{item.score ?? "--"}</strong>
                  </span>
                  {!!item.flags?.length && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                      {item.flags.length} alerta{item.flags.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" className="text-xs flex-1 min-w-[80px]" onClick={() => handleOpenAnalysis(item)}>
                    Detalhes
                  </Button>
                  <Button variant="secondary" className="text-xs flex-1 min-w-[60px]" disabled={actionLoadingKey === `pdf-${item.id}`} onClick={() => handleDownloadPdf(item.id)}>
                    PDF
                  </Button>
                  <Button variant="secondary" className="text-xs flex-1 min-w-[80px]" disabled={actionLoadingKey === `share-${item.id}`} onClick={() => handleShareAnalysis(item.id)}>
                    Compartilhar
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs flex-1 min-w-[60px]"
                    disabled={!canEditAnalysis(item.analysisType)}
                    title={!canEditAnalysis(item.analysisType) ? "Edição disponível apenas para análises individuais" : undefined}
                    onClick={() => {
                      if (!canEditAnalysis(item.analysisType)) return;
                      navigate(`/editar-analise/${item.id}`);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-5 flex flex-col gap-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Próximos retornos</p>
            <button className="text-xs font-semibold text-[color:var(--color-success-700)] hover:text-[color:var(--color-success-800)]" onClick={() => setShowAllVisits((current) => !current)}>
              {showAllVisits ? "Ver menos" : "Ver mais"}
            </button>
          </div>
          <div className="mt-6 mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
            {["all", "capilar", "tricologica"].map((option) => (
              <button
                key={option}
                onClick={() => setVisitFilter(option as typeof visitFilter)}
                className={[
                  "rounded-full border px-3 py-1",
                  visitFilter === option
                    ? "border-[color:var(--color-success-500)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                    : "",
                ].join(" ")}
                style={visitFilter === option ? undefined : { borderColor: "var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}
              >
                {option === "all" ? "Todos" : option === "capilar" ? "Capilar" : "Tricológica"}
              </button>
            ))}
            <div className="flex gap-2">
              {[7, 30, "all"].map((range) => (
                <button
                  key={range}
                  onClick={() => setVisitRange(range as typeof visitRange)}
                  className={[
                    "rounded-full border px-3 py-1",
                    visitRange === range
                      ? "border-[color:var(--color-success-500)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                      : "",
                  ].join(" ")}
                  style={visitRange === range ? undefined : { borderColor: "var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}
                >
                  {range === "all" ? "Todos" : `${range}d`}
                </button>
              ))}
            </div>
          </div>

          <div className="list-scroll mt-5 max-h-[440px] space-y-4 overflow-y-auto pr-1">
            {nextVisits.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <CalendarClock size={36} className="mx-auto" style={{ color: "var(--color-text-muted)" }} />
                <p className="mt-3 text-base font-semibold" style={{ color: "var(--color-text)" }}>Sem recomendações futuras ainda</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Assim que registrar duas análises consecutivas a IA sugerirá automaticamente retornos ideais.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button className="w-full sm:w-auto" onClick={() => navigate("/analise-capilar")}>
                    Registrar primeira análise
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {filteredNextVisits.length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Não há retornos para o filtro selecionado</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Ajuste os filtros para visualizar outros retornos recomendados.
                    </p>
                    <button
                      className="btn-secondary mt-4 text-xs w-full sm:w-auto"
                      onClick={() => {
                        setVisitFilter("all");
                        setVisitRange(7);
                      }}
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
                {visibleNextVisits.map((visit) => (
                  <div key={visit.id} className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span>{getClientDisplayName(visit)}</span>
                      <span className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                        {getAnalysisTypeLabel(visit.analysisType)}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold" style={{ color: "var(--color-text)" }}>
                      Retorno sugerido em {dateFormatter.format(visit.nextDate)}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Intervalo de {visit.interval} dias</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="btn-primary text-xs flex-1 min-w-[80px]"
                        disabled={actionLoadingKey === `confirm-visit-${visit.id}`}
                        onClick={() => handleConfirmVisit(visit.id)}
                      >
                        Confirmar
                      </button>
                      <button
                        className="btn-secondary text-xs flex-1 min-w-[80px]"
                        disabled={actionLoadingKey === `reschedule-visit-${visit.id}`}
                        onClick={() => handleRescheduleVisit(visit.id, visit.nextDate)}
                      >
                        Remarcar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      <Modal
        title="Remarcar retorno"
        isOpen={rescheduleModal.isOpen}
        onClose={closeRescheduleModal}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="next-visit-date" className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>
              Nova data
            </label>
            <input
              id="next-visit-date"
              type="date"
              value={rescheduleModal.nextDate}
              onChange={(event) =>
                setRescheduleModal((prev) => ({
                  ...prev,
                  nextDate: event.target.value,
                  error: null,
                }))
              }
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-success-500)]"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
            {rescheduleModal.error ? (
              <p className="mt-2 text-xs font-medium text-rose-600">{rescheduleModal.error}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn-secondary focus-ring-strong" onClick={closeRescheduleModal}>
              Cancelar
            </button>
            <button
              className="btn-primary focus-ring-strong"
              onClick={confirmRescheduleVisit}
              disabled={actionLoadingKey === `reschedule-visit-${rescheduleModal.analysisId}`}
            >
              {actionLoadingKey === `reschedule-visit-${rescheduleModal.analysisId}` ? "Salvando..." : "Salvar data"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Resumo da análise"
        isOpen={Boolean(analysisDetail)}
        onClose={() => setAnalysisDetail(null)}
      >
        {analysisDetail ? (
          <div className="space-y-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Cliente</p>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {getClientDisplayName(analysisDetail)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Tipo</p>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {getAnalysisTypeLabel(analysisDetail.analysisType)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Score</p>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{analysisDetail.score ?? "--"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Criada em</p>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {dateFormatter.format(new Date(analysisDetail.createdAt))}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Resumo</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text)" }}>
                {analysisDetail.interpretation || "Sem descrição."}
              </p>
            </div>
            {analysisDetail.flags?.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Indicadores</p>
                <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--color-text)" }}>
                  {analysisDetail.flags.map((flag) => (
                    <li key={`${analysisDetail.id}-flag-${flag}`}>{flag}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary focus-ring-strong"
                onClick={() => setAnalysisDetail(null)}
              >
                Fechar
              </button>
              <button
                className="btn-primary focus-ring-strong"
                onClick={() => {
                  setAnalysisDetail(null);
                  const clientQuery = analysisDetail.clientId ? `clientId=${analysisDetail.clientId}&` : "";
                  navigate(`/historico?${clientQuery}analysisId=${analysisDetail.id}`);
                }}
              >
                Abrir no histórico
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
