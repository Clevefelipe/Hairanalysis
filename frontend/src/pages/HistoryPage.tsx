import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listHistoryByClient,
  getHistoryPdf,
  AnalysisHistory,
} from "@/services/history.service";
import ClientLookupModal from "@/components/clientes/ClientLookupModal";
import HighTechIntegrityPanel from "@/components/analysis/HighTechIntegrityPanel";
import { useToast } from "@/components/ui/ToastProvider";
import PageHero from "@/components/ui/PageHero";
import {
  Activity,
  CalendarClock,
  Eye,
  Download,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Cliente,
  obterClientePorId,
} from "../core/cliente/cliente.service";
import { useClientSession } from "../context/ClientSessionContext";

function formatClientCode(value?: string | null) {
  const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  if (!clean) return "—";
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

type ViewMode = "timeline" | "evolucao";

const MILLI_DAY = 24 * 60 * 60 * 1000;
const chartColors = {
  primary: "var(--chart-primary)",
  warning: "var(--chart-warning)",
  axis: "var(--chart-axis)",
  border: "var(--chart-border)",
} as const;

const tooltipScoreFormatter = (value: any): [string, string] => {
  const normalized = Array.isArray(value) ? value[0] : value;
  const hasScore = typeof normalized === "number" && Number.isFinite(normalized);
  return [`${hasScore ? normalized : "—"}/100`, "Score"];
};

const tooltipAlertsFormatter = (value: any): [string, string] => {
  const normalized = Array.isArray(value) ? value[0] : value;
  return [`${normalized ?? 0}`, "Alertas"];
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useToast();
  const { activeClient, startSession, endSession } = useClientSession();
  const compareSectionRef = useRef<HTMLDivElement | null>(null);

  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState<Cliente | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [view, setView] = useState<ViewMode>("timeline");

  const clientIdParam = searchParams.get("clientId");
  const sessionClientId = activeClient?.id;
  const effectiveClientId = clientIdParam || sessionClientId || undefined;

  useEffect(() => {
    if (!effectiveClientId) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    const resolvedClientId = effectiveClientId;

    async function load() {
      setHistoryLoading(true);
      try {
        const data = await listHistoryByClient(resolvedClientId!);
        const ordered = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          : [];
        setHistory(ordered);
      } catch (e: any) {
        setHistory([]);

        const status = e?.response?.status;
        if (status === 404 && activeClient?.id === resolvedClientId) {
          endSession();
          setLookupOpen(true);
          notify("Cliente não encontrado. Selecione outro cliente.", "warning");
          return;
        }

        notify(e?.message || "Erro ao carregar histórico.", "error");
      } finally {
        setHistoryLoading(false);
      }
    }

    load();
  }, [effectiveClientId, notify, activeClient?.id, endSession]);

  useEffect(() => {
    if (!effectiveClientId) {
      setClientInfo(null);
      return;
    }

    setClientLoading(true);
    obterClientePorId(effectiveClientId)
      .then((data) => setClientInfo(data))
      .catch((e: any) => {
        setClientInfo(null);
        const status = e?.response?.status;
        if (status === 404 && activeClient?.id === effectiveClientId) {
          endSession();
          setLookupOpen(true);
          notify("Cliente não encontrado. Selecione outro cliente.", "warning");
        }
      })
      .finally(() => setClientLoading(false));
  }, [effectiveClientId, activeClient?.id, endSession, notify]);

  async function handleDownloadPdf(historyId: string) {
    try {
      setDownloadingId(historyId);
      const blob = await getHistoryPdf(historyId);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${historyId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      let message = "Erro ao baixar o PDF.";

      const axiosMessage =
        e?.response?.data?.message || e?.response?.data?.error || e?.message;
      if (typeof axiosMessage === "string" && axiosMessage.trim()) {
        message = axiosMessage;
      }

      const data = e?.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              const parsedMsg = parsed?.message || parsed?.error;
              if (typeof parsedMsg === "string" && parsedMsg.trim()) {
                message = parsedMsg;
              }
            } catch {
              if (text.trim()) message = text;
            }
          }
        } catch {}
      }

      const status = e?.response?.status;
      notify(status ? `PDF (${status}): ${message}` : message, "error");
    } finally {
      setDownloadingId(null);
    }
  }

  const latestAnalysis = history[0];
  const hasClientSelected = Boolean(effectiveClientId);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );
  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  const summary = useMemo(() => {
    if (!history.length) {
      return {
        total: 0,
        avgScore: 0,
        lastAnalysisLabel: "--",
        growthLabel: "0%",
        flagged: 0,
        capilar: 0,
        tricologica: 0,
        integrada: 0,
      };
    }

    const total = history.length;
    const avgScore = Math.round(
      history.reduce((sum, item) => sum + (item.score ?? 0), 0) / total,
    );
    const lastAnalysisLabel = dateFormatter.format(new Date(history[0].createdAt));
    const capilar = history.filter((item) => item.analysisType === "capilar").length;
    const tricologica = history.filter((item) => item.analysisType === "tricologica").length;
    const integrada = history.filter((item) => item.analysisType === "geral").length;
    const flagged = history.filter((item) => (item.flags?.length ?? 0) > 0).length;

    const now = Date.now();
    const last30 = history.filter(
      (item) => now - new Date(item.createdAt).getTime() <= 30 * MILLI_DAY,
    ).length;
    const prev30 = history.filter((item) => {
      const diff = now - new Date(item.createdAt).getTime();
      return diff > 30 * MILLI_DAY && diff <= 60 * MILLI_DAY;
    }).length;
    const growthLabel = prev30 === 0
      ? last30 > 0
        ? "+100%"
        : "0%"
      : `${(((last30 - prev30) / prev30) * 100).toFixed(0)}%`;

    return {
      total,
      avgScore,
      lastAnalysisLabel,
      growthLabel,
      flagged,
      capilar,
      tricologica,
      integrada,
    };
  }, [history, dateFormatter]);

  const scoreTrend = useMemo(() => {
    return history
      .filter((item) => typeof item.score === "number" && Number.isFinite(item.score))
      .slice(0, 8)
      .reverse()
      .map((item) => ({
        id: item.id,
        score: item.score as number,
        alerts: item.flags?.length ?? 0,
        date: shortDateFormatter.format(new Date(item.createdAt)),
        type:
          item.analysisType === "tricologica"
            ? "Tricológica"
            : item.analysisType === "geral"
              ? "Integrada"
              : "Capilar",
      }));
  }, [history, shortDateFormatter]);

  const evolutionStats = useMemo(() => {
    if (!history.length) {
      return {
        latestScore: 0,
        delta: 0,
      };
    }
    const newest = history[0];
    const oldest = history[history.length - 1];
    const delta = (newest?.score ?? 0) - (oldest?.score ?? 0);
    return {
      latestScore: newest?.score ?? 0,
      delta,
    };
  }, [history]);

  const safetyIndex = useMemo(() => {
    if (!summary.total) return 0;
    return Math.round(((summary.total - summary.flagged) / summary.total) * 100);
  }, [summary.flagged, summary.total]);

  const nextVisitText = useMemo(() => {
    if (!latestAnalysis) return null;
    const interval =
      latestAnalysis.recommendations?.maintenanceIntervalDays ||
      latestAnalysis.recommendations?.nextVisitDays;
    if (!interval) return null;
    const nextDate = new Date(latestAnalysis.createdAt);
    nextDate.setDate(nextDate.getDate() + interval);
    return dateFormatter.format(nextDate);
  }, [latestAnalysis, dateFormatter]);

  const tags: string[] = [];
  if (summary.avgScore >= 80) tags.push("Premium");
  if (summary.flagged > 0) tags.push("Em risco");

  const heroTitle = clientInfo?.nome ?? "Histórico de análises";
  const heroSubtitle = clientInfo
    ? "Linha do tempo clínica, evolução técnica e inteligência estética em uma única visão."
    : "Selecione um cliente para visualizar o histórico completo de análises e evolução.";

  const heroActions = [
    {
      label: "Nova análise",
      icon: <Sparkles size={16} />,
      onClick: () =>
        effectiveClientId
          ? navigate(`/analise-capilar?clientId=${effectiveClientId}`)
          : setLookupOpen(true),
      disabled: !effectiveClientId,
    },
    {
      label: "Comparar",
      icon: <Layers size={16} />,
      variant: "secondary" as const,
      onClick: () => {
        if (history.length < 2) {
          notify("É preciso ter ao menos duas análises para comparar.", "warning");
          return;
        }
        setView("evolucao");
        setTimeout(() => {
          compareSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      },
      disabled: history.length < 2,
    },
    {
      label: "Gerar PDF",
      icon: <Download size={16} />,
      onClick: () => latestAnalysis && handleDownloadPdf(latestAnalysis.id),
      disabled: !latestAnalysis || downloadingId === latestAnalysis?.id,
    },
    {
      label: "Visão detalhada",
      icon: <Eye size={16} />,
      variant: "secondary" as const,
      onClick: () => latestAnalysis && navigate(`/historico/${latestAnalysis.id}`),
      disabled: !latestAnalysis,
    },
    {
      label: "Selecionar cliente",
      variant: "ghost" as const,
      onClick: () => setLookupOpen(true),
    },
  ];

  const heroMeta = [
    { label: "Análises", value: summary.total },
    { label: "Score médio", value: `${summary.avgScore}/100` },
    { label: "Última análise", value: summary.lastAnalysisLabel },
    { label: "Último mês", value: summary.growthLabel },
  ];
  const latestRiskLevel =
    typeof latestAnalysis?.aiExplanation?.riskLevel === "string"
      ? latestAnalysis.aiExplanation.riskLevel
      : null;
  const latestRiskFactors = Array.isArray(latestAnalysis?.aiExplanation?.riskFactors)
    ? latestAnalysis.aiExplanation.riskFactors
    : [];
  const latestConfidence =
    latestAnalysis?.aiExplanation?.analysisConfidence ??
    latestAnalysis?.aiExplanation?.confidence ??
    null;

  function getAptidao(item: AnalysisHistory) {
    const flagged = (item.flags?.length ?? 0) > 0;
    return {
      label: flagged ? "Revisar protocolo" : "Apto",
      className: flagged
        ? "bg-has-danger/10 text-has-danger"
        : "bg-has-success/15 text-has-success",
    };
  }

  const timelineEmptyCopy = !hasClientSelected
    ? "Selecione um cliente para visualizar a linha do tempo."
    : historyLoading
    ? "Carregando análises..."
    : "Nenhuma análise registrada para este cliente.";

  const latestSimpleSummary = useMemo(() => {
    const interpretationText = latestAnalysis?.interpretation?.trim();
    if (!interpretationText) return null;
    if (interpretationText.length <= 380) return interpretationText;
    return `${interpretationText.slice(0, 377)}...`;
  }, [latestAnalysis?.interpretation]);

  return (
    <div className="section-stack space-y-6 animate-page-in w-full">
      <PageHero
        title={heroTitle}
        subtitle={heroSubtitle}
        meta={heroMeta}
        actions={heroActions}
      />
      <section>
        {historyLoading && hasClientSelected ? (
          <HighTechIntegrityPanel isLoading />
        ) : latestAnalysis ? (
          <HighTechIntegrityPanel
            score={latestAnalysis.score}
            flags={latestAnalysis.flags}
            interpretation={latestAnalysis.interpretation}
            riskLevel={latestRiskLevel}
            riskFactors={latestRiskFactors}
            confidence={latestConfidence}
          />
        ) : (
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
              Mapa de Integridade
            </p>
            <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Selecione um cliente e registre análises para ativar o painel high-tech.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              O painel exibirá score de integridade da fibra, risco global e índices segmentados.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="card-premium card-premium-interactive p-6">
          <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            <Activity size={18} />
            Performance técnica
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card-premium-soft card-premium-interactive p-4">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Capilar
              </p>
              <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                {summary.capilar}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>análises registradas</p>
            </div>
            <div className="card-premium-soft card-premium-interactive p-4">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Tricológica
              </p>
              <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                {summary.tricologica}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>análises registradas</p>
            </div>
            <div className="card-premium-soft card-premium-interactive p-4">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Integrada
              </p>
              <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                {summary.integrada}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>análises registradas</p>
            </div>
          </div>
        </div>

        <div className="card-premium card-premium-interactive p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Cliente
              </p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {clientLoading ? "Carregando..." : clientInfo?.nome ?? "Nenhum cliente"}
              </p>
              {effectiveClientId && (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Cód: #{formatClientCode(effectiveClientId)}
                </p>
              )}
              {clientInfo?.telefone && (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{clientInfo.telefone}</p>
              )}
              {clientInfo?.email && (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{clientInfo.email}</p>
              )}
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Alertas
              </p>
              <p className="mt-2 text-3xl font-semibold">{summary.flagged}</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>protocolos com atenção</p>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-has-primary/10 px-3 py-1 text-xs font-medium text-has-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section ref={compareSectionRef} className="card-premium card-premium-interactive">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            <CalendarClock size={16} />
            Linha do tempo vs Evolução
          </div>
          <div className="flex gap-2">
            {([
              { mode: "timeline", label: "Timeline" },
              { mode: "evolucao", label: "Evolução" },
            ] as const).map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setView(tab.mode)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition focus-ring-strong",
                  view === tab.mode
                    ? "border border-has-primary/30 bg-has-primary/10 text-has-primary"
                    : "border bg-white hover:bg-[var(--bg-primary)]",
                ].join(" ")}
                style={
                  view === tab.mode
                    ? undefined
                    : { borderColor: "var(--color-border)", color: "var(--color-text-muted)" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {view === "timeline" ? (
            historyLoading ? (
              <div
                className="h-48 rounded-2xl animate-pulse"
                style={{ backgroundColor: "var(--bg-primary)" }}
              />
            ) : history.length ? (
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 h-full w-px" style={{ backgroundColor: "var(--color-border)" }} />
                <div className="space-y-4">
                  {history.map((item, index) => {
                    const aptidao = getAptidao(item);
                    const indicatorColor =
                      item.analysisType === "capilar"
                        ? "bg-has-primary"
                        : item.analysisType === "geral"
                          ? "bg-has-warning"
                          : "bg-has-danger";
                    return (
                      <div key={item.id} className="relative pl-6">
                        <div
                          className={`absolute left-0 top-4 h-3 w-3 rounded-full ${indicatorColor}`}
                        />
                        <div className="card-premium-soft card-premium-interactive p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                                {item.analysisType === "capilar"
                                  ? "Capilar"
                                  : item.analysisType === "geral"
                                    ? "Integrada"
                                    : "Tricológica"}
                              </p>
                              <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                                {shortDateFormatter.format(new Date(item.createdAt))}
                              </p>
                              <p className="text-sm max-w-xl" style={{ color: "var(--color-text-muted)" }}>
                                {item.interpretation || "Sem resumo da IA disponível."}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase" style={{ color: "var(--color-text-muted)" }}>Score</p>
                              <p className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                                {typeof item.score === "number" && Number.isFinite(item.score)
                                  ? item.score
                                  : "—"}
                              </p>
                              <span
                                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${aptidao.className}`}
                              >
                                {aptidao.label}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => navigate(`/historico/${item.id}`)}
                              className="text-xs font-medium underline-offset-2 hover:underline"
                              style={{ color: "var(--color-text)" }}
                            >
                              Abrir detalhe
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(item.id)}
                              disabled={downloadingId === item.id}
                              className="text-xs font-medium"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {downloadingId === item.id ? "Baixando..." : "Gerar PDF"}
                            </button>
                            {index === 0 && (
                              <button
                                onClick={() => setView("evolucao")}
                                className="text-xs font-medium text-has-primary hover:text-has-success"
                              >
                                Ver evolução
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{timelineEmptyCopy}</p>
            )
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="card-premium-soft card-premium-interactive p-5">
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                    Score médio
                  </p>
                  <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                    {summary.avgScore}
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Últimas análises</p>
                </div>
                <div className="card-premium-soft card-premium-interactive p-5">
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                    Variação
                  </p>
                  <p
                    className={`mt-2 text-3xl font-semibold ${
                      evolutionStats.delta >= 0 ? "text-has-primary" : "text-has-danger"
                    }`}
                  >
                    {evolutionStats.delta >= 0 ? "+" : ""}
                    {evolutionStats.delta}
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>vs. primeira análise</p>
                </div>
                <div className="card-premium-soft card-premium-interactive p-5">
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                    Alertas técnicos
                  </p>
                  <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                    {summary.flagged}
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>protocolos com revisão</p>
                </div>
                <div className="card-premium-soft card-premium-interactive border border-has-success/30 bg-has-success/10 p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-has-success">
                    <ShieldCheck size={14} />
                    Segurança
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-has-success">
                    {safetyIndex}%
                  </p>
                  <p className="text-sm text-has-success">protocolos dentro da faixa segura</p>
                </div>
              </div>

              <div className="card-premium-soft p-6" style={{ color: "var(--color-text)" }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-has-primary">
                      Inteligência estética
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {latestAnalysis?.analysisType === "tricologica"
                        ? "Panorama tricológico"
                        : latestAnalysis?.analysisType === "geral"
                          ? "Panorama integrado"
                          : "Panorama capilar"}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {latestAnalysis?.interpretation ||
                        "Assim que uma nova análise for registrada, o resumo IA ficará disponível aqui."}
                    </p>
                  </div>
                  <button
                    onClick={() => latestAnalysis && navigate(`/historico/${latestAnalysis.id}`)}
                    className="rounded-full border bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--bg-primary)]"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Ver detalhe completo
                  </button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="panel-tight">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Evolução de score
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        Últimas {scoreTrend.length || 0} análises registradas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Próxima visita prevista</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {nextVisitText ?? "--"}
                      </p>
                    </div>
                  </div>
                  {scoreTrend.length ? (
                    <div className="mt-6 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scoreTrend} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="rgba(15,23,42,0.12)" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke={chartColors.axis} fontSize={12} />
                          <YAxis stroke={chartColors.axis} fontSize={12} domain={[0, 100]} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: 12, borderColor: chartColors.border }}
                            formatter={tooltipScoreFormatter as any}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke={chartColors.primary}
                            strokeWidth={3}
                            fill={chartColors.primary}
                            fillOpacity={0.12}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Registre análises com score para plotar a evolução.
                    </p>
                  )}
                </div>

                <div className="panel-tight">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      Alertas por visita
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Monitore variações para ajustar protocolo e retorno.
                    </p>
                  </div>
                  {scoreTrend.length ? (
                    <div className="mt-6 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scoreTrend} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="rgba(15,23,42,0.12)" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke={chartColors.axis} fontSize={12} />
                          <YAxis stroke={chartColors.axis} fontSize={12} allowDecimals={false} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: 12, borderColor: chartColors.border }}
                            formatter={tooltipAlertsFormatter as any}
                            labelFormatter={(label) => `Data: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="alerts"
                            stroke={chartColors.warning}
                            strokeWidth={3}
                            dot={{ r: 4, fill: chartColors.warning }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Sem dados suficientes para montar o gráfico.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel-tight">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
              Resumo IA mais recente
            </p>
            <p className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              {latestAnalysis ?
                shortDateFormatter.format(new Date(latestAnalysis.createdAt)) :
                "Nenhuma análise selecionada"}
            </p>
            <p className="max-w-3xl text-sm" style={{ color: "var(--color-text-muted)" }}>
              {latestSimpleSummary ||
                "Assim que a IA gerar um novo laudo, traremos o resumo técnico aqui."}
            </p>
          </div>
          <div className="flex min-w-[200px] flex-col gap-2">
            <button
              onClick={() => latestAnalysis && handleDownloadPdf(latestAnalysis.id)}
              disabled={!latestAnalysis}
              className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Baixar PDF completo
            </button>
            <button
              onClick={() => latestAnalysis && navigate(`/historico/${latestAnalysis.id}`)}
              disabled={!latestAnalysis}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Abrir visão detalhada
            </button>
          </div>
        </div>
      </section>

      <ClientLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={(cliente) => {
          if (!cliente?.id) return;
          startSession({ id: String(cliente.id), nome: cliente.nome || "Cliente" });
          navigate(`/historico?clientId=${cliente.id}`);
          notify("Cliente selecionado.", "success");
        }}
      />
    </div>
  );
}
