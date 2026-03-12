import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarClock, ChevronRight, Clock4, ShieldCheck, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import ZeroBadge from "@/components/ui/ZeroBadge";
import { formatDateShortBr } from "@/utils/date";
import {
  AnalysisHistory,
  DashboardNextVisit,
  DashboardResponse,
  getHistoryDashboard,
} from "@/services/history.service";
import "./Dashboard.css";

type SummaryCard = {
  label: string;
  value: number | string;
  helper: string;
  icon: React.ReactNode;
};

type SimpleVisit = DashboardNextVisit & { displayDate: string };
type SimpleAnalysis = AnalysisHistory & { displayDate: string };

const emptyMetrics = {
  totalAnalyses: 0,
  safeAnalyses: 0,
  flaggedAnalyses: 0,
  avgScore: 0,
  today: { count: 0, delta: 0, yesterday: 0 },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-5 p-6 animate-pulse">
      <div className="h-9 w-40 rounded-lg" style={{ backgroundColor: "var(--bg-primary)" }} />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl" style={{ backgroundColor: "var(--bg-primary)" }} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-xl" style={{ backgroundColor: "var(--bg-primary)" }} />
        <div className="h-56 rounded-xl" style={{ backgroundColor: "var(--bg-primary)" }} />
      </div>
      <div className="h-56 rounded-xl" style={{ backgroundColor: "var(--bg-primary)" }} />
    </div>
  );
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getHistoryDashboard({ period: "30d", professionalScope: "all" });
        if (isMounted) {
          setDashboardData(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Erro ao carregar dados do dashboard.");
          setDashboardData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo(() => (Array.isArray(dashboardData?.items) ? dashboardData.items : []), [dashboardData]);
  const nextVisits = useMemo(
    () => (Array.isArray(dashboardData?.nextVisits) ? dashboardData.nextVisits : []),
    [dashboardData],
  );
  const metrics = dashboardData?.metrics ?? emptyMetrics;

  const summaryCards: SummaryCard[] = useMemo(() => {
    const total = metrics.totalAnalyses || 0;
    const safe = metrics.safeAnalyses || 0;
    const flagged = metrics.flaggedAnalyses || Math.max(0, total - safe);
    const safePercent = total ? Math.round((safe / total) * 100) : 0;

    return [
      {
        label: "Total de análises",
        value: total,
        helper: "Últimos 30 dias",
        icon: <ShieldCheck size={16} className="text-[color:var(--color-success-600)]" />,
      },
      {
        label: "% seguras",
        value: `${safePercent}%`,
        helper: `${safe} OK · ${flagged} com atenção`,
        icon: <TrendingUp size={16} className="text-[color:var(--color-success-600)]" />,
      },
      {
        label: "Score médio",
        value: metrics.avgScore ?? 0,
        helper: metrics.today.delta === 0 ? "Estável vs ontem" : `${metrics.today.delta > 0 ? "+" : ""}${metrics.today.delta} vs ontem`,
        icon: <AlertTriangle size={16} className="text-[color:var(--color-warning-700)]" />,
      },
    ];
  }, [metrics]);

  const timelineEvents: SimpleAnalysis[] = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((analysis) => ({
        ...analysis,
        displayDate: formatDateShortBr(analysis.createdAt),
      }));
  }, [items]);

  const upcomingVisits: SimpleVisit[] = useMemo(() => {
    return [...nextVisits]
      .filter((visit) => !!visit.nextDate)
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
      .slice(0, 5)
      .map((visit) => ({
        ...visit,
        displayDate: formatDateShortBr(visit.nextDate as unknown as string),
      }));
  }, [nextVisits]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Início", action: () => navigate("/dashboard") },
      { label: "Dashboard", action: undefined },
    ],
    [navigate],
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="rounded-xl border p-4 text-[color:var(--color-error-700)]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="section-stack animate-page-in w-full">
      <nav className="mb-4 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {crumb.action ? (
              <button
                type="button"
                onClick={crumb.action}
                className="text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-text)]"
              >
                {crumb.label}
              </button>
            ) : (
              <span style={{ color: "var(--color-text)" }}>{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && <ChevronRight size={11} />}
          </div>
        ))}
      </nav>

      <div className="rounded-2xl border p-5 shadow-card" style={{ backgroundColor: "var(--color-surface)", borderColor: "rgba(226,232,240,0.85)" }}>
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
              Visão executiva
            </p>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Resumo simplificado
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
            <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 90%, white)" }}>
              Período: 30 dias
            </span>
            <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 90%, white)" }}>
              Equipe completa
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border p-4 shadow-card"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
                  {card.label}
                </p>
                {card.icon}
              </div>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {card.value}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {card.helper}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <section
          className="rounded-2xl border p-5 shadow-card"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>
                Agenda / Retornos
              </p>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Próximas 5 visitas
              </h2>
            </div>
            <Button variant="secondary" onClick={() => navigate("/agenda")} className="h-9 px-3 text-xs">
              Ver agenda
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingVisits.length === 0 ? (
              <ZeroBadge helper="Nenhum retorno agendado" />
            ) : (
              upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-3"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-primary-light,#e6f7f2)] text-[color:var(--color-primary,#0fa47a)] font-semibold">
                      <CalendarClock size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {visit.clientName || "Cliente"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {visit.analysisType === "tricologica" ? "Tricológica" : "Capilar"} · {visit.displayDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className="rounded-2xl border p-5 shadow-card"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>
                Linha do tempo
              </p>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Últimas 5 análises
              </h2>
            </div>
            <Button variant="secondary" onClick={() => navigate("/historico")} className="h-9 px-3 text-xs">
              Ver histórico
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {timelineEvents.length === 0 ? (
              <ZeroBadge helper="Sem análises recentes" />
            ) : (
              timelineEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-primary-light,#e6f7f2)] text-[color:var(--color-primary,#0fa47a)] font-semibold">
                    <Clock4 size={16} />
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {event.clientName || "Cliente"}
                      </p>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{event.displayDate}</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {event.analysisType === "tricologica"
                        ? "Tricológica"
                        : event.analysisType === "capilar"
                          ? "Capilar"
                          : "Integrada"}
                    </p>
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>
                      Score: {event.score ?? "--"}
                    </p>
                    <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                      {event.interpretation || "Resumo não disponível"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
