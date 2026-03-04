import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getHistoryById,
  getHistoryPdf,
  shareHistory,
  AnalysisHistory,
  listHistoryByClient,
} from "@/services/history.service";
import HighTechIntegrityPanel from "@/components/analysis/HighTechIntegrityPanel";
import { formatDateBr, formatDateShortBr } from "@/utils/date";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  Download,
  History as HistoryIcon,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { applyPeriodNormalization, formatTreatmentCombo } from "@/utils/treatmentText";
import {
  LineChart as ReLineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";
import PageHero from "@/components/ui/PageHero";
import { useToast } from "@/components/ui/ToastProvider";
import { useTheme } from "@/context/ThemeContext";
import SectionToolbar from "@/components/ui/SectionToolbar";

type ScoreTooltipProps = TooltipProps<number, string> & {
  payload?: { value?: number }[];
  label?: string;
};

const chartColors = {
  primary: "var(--chart-primary)",
  warning: "var(--chart-warning)",
  danger: "var(--chart-danger)",
  success: "var(--chart-success)",
  info: "var(--color-info)",
  border: "var(--chart-border)",
  axis: "var(--chart-axis)",
} as const;

const ScoreTooltip = ({ active, payload, label }: ScoreTooltipProps) => {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value;

  return (
    <div
      className="rounded-2xl border px-4 py-3 shadow-sm backdrop-blur"
      style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.85)" }}
    >
      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-lg font-semibold" style={{ color: "var(--color-text-inverse, #f8fafc)" }}>
        {value}/100
      </p>
    </div>
  );
};

function prettifyRecommendationText(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.includes("+")) {
    return formatTreatmentCombo(trimmed);
  }
  return applyPeriodNormalization(trimmed);
}

function humanizeFlag(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatClientCode(value?: string | null) {
  const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  if (!clean) return "—";
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [history, setHistory] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientHistory, setClientHistory] = useState<AnalysisHistory[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const sessionType =
    history?.analysisType === "tricologica"
      ? "Tricológica"
      : history?.analysisType === "geral"
        ? "Geral"
        : "Capilar";
  const alertFlags = useMemo(
    () =>
      Array.isArray(history?.flags)
        ? history.flags
            .map(humanizeFlag)
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    [history?.flags],
  );

  const alertsCount = alertFlags.length;
  const clientDisplayName =
    typeof history?.clientName === "string" && history.clientName.trim()
      ? history.clientName.trim()
      : "Cliente não identificado";

  useEffect(() => {
    if (!id) return;

    getHistoryById(id)
      .then((data) => setHistory(data))
      .catch((e: any) => setError(e?.message || "Erro ao carregar histórico."))
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!history?.clientId) return;

    let cancelled = false;
    setTimelineLoading(true);

    listHistoryByClient(history.clientId)
      .then((items) => {
        if (!cancelled) setClientHistory(items);
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [history?.clientId]);

  const scoreTrend = useMemo(() => {
    return clientHistory
      .filter((item) => typeof item.score === "number")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((item) => ({
        id: item.id,
        dateLabel: formatDateShortBr(item.createdAt),
        score: item.score,
        analysisType: item.analysisType,
      }));
  }, [clientHistory]);

  const currentIndex = useMemo(() => {
    if (!history) return -1;
    return scoreTrend.findIndex((point) => point.id === history.id);
  }, [history, scoreTrend]);

  const previousScore =
    currentIndex > 0 ? scoreTrend[currentIndex - 1]?.score ?? null : null;
  const scoreDelta =
    typeof previousScore === "number" && typeof history?.score === "number" 
      ? history.score - previousScore 
      : null;
  const averageScore =
    scoreTrend.length > 0
      ? Math.round(
          scoreTrend.reduce((total, point) => total + point.score, 0) /
            scoreTrend.length,
        )
      : null;

  const maintenancePlan = useMemo(() => {
    if (!history) return null;

    const safeList = (value: unknown): string[] =>
      Array.isArray(value)
        ? value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const rec = history.recommendations ?? {};
    const treatments = safeList(rec?.treatments);
    const homeCare = safeList(rec?.homeCare);

    const maintenance = (history as any)?.maintenance ?? {};
    const maintenanceIntervalDays = Number(maintenance?.intervalDays ?? 30);

    const rawReturnDate = maintenance?.nextReturnDate || history.createdAt;
    const returnDate = rawReturnDate ? new Date(rawReturnDate) : null;
    if (!returnDate || Number.isNaN(returnDate.getTime())) {
      return null;
    }
    const returnLabel = formatDateShortBr(returnDate);
    const daysUntilReturn = Math.max(
      0,
      Math.round(
        (returnDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000),
      ),
    );

    const pickAction = (list: string[], keywords: string[], fallback: string) => {
      if (!Array.isArray(list)) return fallback;
      const found = list.find((item) =>
        Array.isArray(keywords) && keywords.some((keyword) => item.toLowerCase().includes(keyword.toLowerCase())),
      );
      return found || fallback;
    };

    const straighteningDetailed = Array.isArray(
      rec?.recommendedStraighteningsDetailed,
    )
      ? rec?.recommendedStraighteningsDetailed
      : [];
    const straighteningName =
      straighteningDetailed[0]?.name ||
      (Array.isArray(rec?.recommendedStraightenings)
        ? rec.recommendedStraightenings[0]
        : undefined);

    const timelineBase = [
      {
        id: "detox",
        title: "Reset do couro cabeludo",
        window: "Dias 0 a 15 (primeiras 2 semanas)",
        focus: "Desintoxicar e equilibrar o couro cabeludo para receber ativos.",
        tag: "Tricologia",
        emoji: "🌀",
        actions: [
          pickAction(
            treatments,
            ["detox", "reconstru"],
            "Sessão detox + reconstrução leve no salão",
          ),
          pickAction(
            homeCare,
            ["detox", "couro", "esfol"],
            "Home care: esfoliante suave e shampoo calmante 2x/sem",
          ),
        ],
      },
      {
        id: "cronograma",
        title: "Cronograma inteligente",
        window: "Semanas 3 a 8 (dias 16 a 56)",
        focus:
          "Alternar reconstrução, nutrição e hidratação de acordo com a IA.",
        tag: "Salão + Home",
        emoji: "📆",
        actions: [
          pickAction(
            treatments,
            ["hidr", "nutri", "cronograma"],
            "Reconstrução guiada a cada 15 dias",
          ),
          pickAction(
            homeCare,
            ["máscara", "leave", "nutri"],
            "Máscara nutritiva + leave-in termoativo 2x/sem",
          ),
        ],
      },
    ];

    const hasStraighteningRecommendation = Boolean(
      straighteningName || straighteningDetailed.length > 0,
    );

    if (hasStraighteningRecommendation) {
      timelineBase.push({
        id: "alisamento",
        title: "Manutenção do alisamento",
        window: `Dia ${Math.max(maintenanceIntervalDays - 30, 1)} - ${maintenanceIntervalDays}`,
        focus: `Garantir alinhamento e brilho do ${straighteningName || "alisamento indicado"}`,
        tag: "Alisamento",
        emoji: "✨",
        actions: [
          straighteningName
            ? `Retoque programado de ${straighteningName}`
            : "Retoque alinhado às restrições da IA",
          pickAction(
            homeCare,
            ["térm", "term", "antifrizz", "blindagem"],
            "Blindagem térmica + finalização antifrizz semanal",
          ),
        ],
      });
    }

    const timeline = timelineBase.map((phase) => ({
      ...phase,
      actions: phase.actions
        .filter(Boolean)
        .filter((action, index, arr) => arr.indexOf(action) === index),
    }));

    const reminderBlueprint = hasStraighteningRecommendation
      ? [
        {
          id: "pre",
          label: "Pré-retorno",
          daysBefore: 15,
          description: "Reforce o detox e confirme a evolução do couro cabeludo.",
        },
        {
          id: "confirm",
          label: "Confirmação externa",
          daysBefore: 5,
          description: "Combine o horário na ferramenta de agenda usada pelo salão.",
        },
        {
          id: "day0",
          label: "Dia do retorno",
          daysBefore: 0,
          description: "Envie o checklist final e incentive registro fotográfico.",
        },
      ]
      : [];

    const reminders = reminderBlueprint
      .filter((bp) => maintenanceIntervalDays >= bp.daysBefore)
      .map((bp) => {
        const reminderDate = new Date(
          returnDate.getTime() - bp.daysBefore * 24 * 60 * 60 * 1000,
        );
        return {
          ...bp,
          reminderDate,
          dateLabel: formatDateShortBr(reminderDate),
        };
      });

    const status =
      daysUntilReturn <= 3
        ? {
            label: "Urgente",
            intent: "bg-has-danger/10 text-has-danger border-has-danger/40",
          }
        : daysUntilReturn <= 10
          ? {
              label: "Planeje já",
              intent: "bg-has-warning/10 text-has-warning border-has-warning/40",
            }
          : {
              label: "Em dia",
              intent: "bg-has-success/10 text-has-success border-has-success/40",
            };

    return {
      maintenanceIntervalDays,
      returnDate,
      returnIso: returnDate.toISOString(),
      returnLabel,
      daysUntilReturn,
      timeline,
      reminders,
      straighteningName,
      status,
      hasStraighteningRecommendation,
      highlight:
        typeof rec?.professionalAlert === "string"
          ? rec.professionalAlert
          : undefined,
    };
  }, [history]);

  async function handleCopyPlan() {
    if (!maintenancePlan) return;
    const summaryParts = [
      `Próximo retorno em ${maintenancePlan.daysUntilReturn} dias (${maintenancePlan.returnLabel})`,
    ];

    maintenancePlan.timeline.forEach((phase) => {
      if (!maintenancePlan.hasStraighteningRecommendation && phase.id === "alisamento") {
        return;
      }
      summaryParts.push(`${phase.title}: ${phase.actions.join(" | ")}`);
    });

    const summary = summaryParts.join("\n");

    try {
      await navigator.clipboard?.writeText(summary);
      alert("Cronograma copiado para a área de transferência.");
    } catch {
      alert(summary);
    }
  }

  function handleSendReminder(reminderId?: string) {
    if (!maintenancePlan || !maintenancePlan.hasStraighteningRecommendation) {
      return;
    }
    const targetReminder = reminderId
      ? maintenancePlan.reminders?.find((item) => item.id === reminderId)
      : maintenancePlan.reminders?.[0];

    const reminderTextParts = [
      `Olá! Estamos acompanhando seu plano premium de manutenção capilar.`,
      `Próximo retorno em ${maintenancePlan.daysUntilReturn} dias (${maintenancePlan.returnLabel}).`,
    ];

    if (targetReminder) {
      reminderTextParts.push(
        `${targetReminder.label}: ${targetReminder.description} (referência ${targetReminder.dateLabel}).`,
      );
    }

    const timelineHint = maintenancePlan.timeline
      .filter((phase) => maintenancePlan.hasStraighteningRecommendation || phase.id !== "alisamento")
      .map((phase) => `${phase.title}: ${phase.actions.join(" | ")}`)
      .join(" / ");
    reminderTextParts.push(`Linha do tempo: ${timelineHint}`);

    const message = encodeURIComponent(reminderTextParts.join("\n"));
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  async function handleDownloadPdf() {
    if (!id) return;

    try {
      const pdf = await getHistoryPdf(id);
      if (!pdf) return;

      const url = window.URL.createObjectURL(pdf);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      let message = "Erro ao baixar o PDF.";

      const axiosMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message;
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
      alert(status ? `PDF (${status}): ${message}` : message);
    }
  }

  async function handleShare() {
    if (!id) return;

    const result = await shareHistory(id);
    if (!result) return;

    alert(`Link gerado:\n${window.location.origin}${result.url}`);
  }

  if (loading) {
    return (
      <div className="section-stack animate-page-in w-full">
        <HighTechIntegrityPanel isLoading />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
      </div>
    );
  }

  if (error || !history) {
    return <p className="text-red-600">{error}</p>;
  }

  const heroMeta = [
    { label: "Score", value: `${history.score}/100` },
    { label: "Tipo", value: sessionType },
    { label: "Flags", value: alertsCount || "Sem alertas" },
    { label: "Cód cliente", value: `#${formatClientCode(history.clientId)}` },
  ];

  const heroActions = [
    {
      label: "Voltar ao histórico",
      variant: "ghost" as const,
      icon: <ArrowLeft size={16} />,
      onClick: () => navigate("/historico"),
    },
    {
      label: "Ver evolução",
      variant: "secondary" as const,
      icon: <HistoryIcon size={16} />,
      onClick: () =>
        navigate(
          `/historico/evolucao?clientId=${history.clientId}&to=${history.id}`,
        ),
    },
    {
      label: "Baixar PDF",
      icon: <Download size={16} />,
      onClick: handleDownloadPdf,
    },
    {
      label: "Compartilhar",
      variant: "ghost" as const,
      icon: <Share2 size={16} />,
      onClick: handleShare,
    },
  ];

  const aiSummary =
    history.aiExplanation?.summary ||
    history.aiExplanationText ||
    history.interpretation ||
    "Sem narrativa registrada.";
  const aiTechnical = history.aiExplanation?.technicalDetails;
  const aiRisk = history.aiExplanation?.riskLevel;
  const aiRiskFactors = Array.isArray(history.aiExplanation?.riskFactors)
    ? history.aiExplanation.riskFactors
    : [];
  const recommendations = history.recommendations ?? {};
  const scalpTreatments = Array.isArray(recommendations?.scalpTreatments)
    ? recommendations.scalpTreatments
        .map((item: any) => {
          if (typeof item === "string") return prettifyRecommendationText(item);
          if (!item || typeof item !== "object") return "";
          const nome = typeof item.nome === "string" ? item.nome.trim() : "";
          const indicacao =
            typeof item.indicacao === "string" ? item.indicacao.trim() : "";
          const frequencia =
            typeof item.frequencia === "string"
              ? applyPeriodNormalization(item.frequencia.trim())
              : "";
          return [nome, indicacao, frequencia].filter(Boolean).join(" | ");
        })
        .filter((item: string) => item.length > 0)
    : [];
  const returnPlanGoal =
    typeof recommendations?.returnPlan?.objetivo === "string"
      ? recommendations.returnPlan.objetivo.trim()
      : "";
  const medicalReferral =
    recommendations?.medicalReferral &&
    typeof recommendations.medicalReferral === "object"
      ? recommendations.medicalReferral
      : null;

  const professionalAlert =
    typeof recommendations?.professionalAlert === "string"
      ? recommendations.professionalAlert
      : "";

  const blockStraightenings =
    professionalAlert.toLowerCase().includes("sem alisamento") ||
    professionalAlert.toLowerCase().includes("nao apto") ||
    professionalAlert.toLowerCase().includes("não apto");

  const hasStraighteningSuggestion = Array.isArray(
    recommendations?.recommendedStraightenings,
  )
    ? recommendations.recommendedStraightenings.length > 0
    : false;

  const hasMedicalReferral = Boolean(medicalReferral?.needed);
  const nextReturnSummary = maintenancePlan
    ? `${maintenancePlan.daysUntilReturn} dia(s) • ${maintenancePlan.returnLabel}`
    : "Sem plano registrado";

  const hasStraightenings = Array.isArray(
    recommendations?.recommendedStraightenings,
  )
    ? recommendations.recommendedStraightenings.length > 0
    : false;
  const recommendedItemsCount =
    (Array.isArray(recommendations?.treatments)
      ? recommendations.treatments.length
      : 0) +
    (Array.isArray(recommendations?.homeCare)
      ? recommendations.homeCare.length
      : 0) +
    scalpTreatments.length;
  const riskSummaryLabel = hasMedicalReferral
    ? "Atenção clínica"
    : alertsCount > 0
      ? `${alertsCount} sinalização(ões)`
      : "Sem alertas críticos";
  const trendLabel =
    typeof scoreDelta === "number"
      ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(1)} pts`
      : "Sem base comparativa";

  return (
    <div className="space-y-8 animate-page-in">
      <PageHero
        title={`Sessão ${sessionType}`}
        subtitle={`Captura realizada em ${formatDateBr(history.createdAt)}`}
        meta={heroMeta}
        actions={heroActions}
      />
      <HighTechIntegrityPanel
        score={history.score}
        flags={history.flags}
        interpretation={history.interpretation}
        riskLevel={typeof aiRisk === "string" ? aiRisk : null}
        riskFactors={aiRiskFactors}
        confidence={
          history.aiExplanation?.analysisConfidence ??
          history.aiExplanation?.confidence ??
          null
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card-premium p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">Score atual</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">{history.score}/100</p>
          <p className="text-xs text-[color:var(--color-text-muted)]">{sessionType}</p>
        </article>
        <article className="card-premium p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">Tendência</p>
          <p className={`mt-1 text-2xl font-semibold ${typeof scoreDelta === "number" ? (scoreDelta >= 0 ? "text-has-success" : "text-has-danger") : "text-[color:var(--color-text)]"}`}>
            {trendLabel}
          </p>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            {typeof averageScore === "number" ? `Média histórica ${averageScore}/100` : "Sem histórico suficiente"}
          </p>
        </article>
        <article className="card-premium p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">Próximo retorno</p>
          <p className="mt-1 text-xl font-semibold text-[color:var(--color-text)]">{nextReturnSummary}</p>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            {maintenancePlan?.status?.label ?? "Plano não definido"}
          </p>
        </article>
        <article className="card-premium p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">Risco e plano</p>
          <p className={`mt-1 text-2xl font-semibold ${hasMedicalReferral ? "text-has-warning" : alertsCount > 0 ? "text-has-danger" : "text-has-success"}`}>
            {riskSummaryLabel}
          </p>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            {recommendedItemsCount} ações listadas
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {maintenancePlan && (
            <div className="card-premium card-premium-interactive p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-has-primary">Retorno programado</p>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    Cronograma inteligente de manutenção
                  </h3>
                </div>
                <div className="flex min-w-[180px] flex-col items-center gap-2 text-center">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${maintenancePlan.status.intent}`}>
                    {maintenancePlan.status.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10">
                      <p className="text-lg font-bold text-[color:var(--color-primary)]">{maintenancePlan.daysUntilReturn}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Retorno em</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {maintenancePlan.daysUntilReturn === 1 ? "1 dia" : `${maintenancePlan.daysUntilReturn} dias`}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{maintenancePlan.returnLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {maintenancePlan.highlight && (
                <div className="mt-5 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                  <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--color-text)" }}>
                    <Sparkles size={16} className="text-has-primary" />
                    Insight da IA
                  </div>
                  <p className="mt-2" style={{ color: "var(--color-text)" }}>{maintenancePlan.highlight}</p>
                </div>
              )}

              <div className="mt-6 space-y-6">
                {maintenancePlan.timeline.map((phase, index) => (
                  <div key={phase.id} className="card-premium-soft card-premium-interactive p-6">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                          <span className="text-2xl" aria-hidden>{phase.emoji}</span>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-primary)]">{phase.tag}</span>
                            <span className="text-xs text-[color:var(--color-text-muted)]">•</span>
                            <span className="text-xs font-medium text-[color:var(--color-text-muted)]">Fase {String(index + 1).padStart(2, "0")}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">{phase.title}</h3>
                          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{phase.focus}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
                        <CalendarCheck size={16} className="text-[color:var(--color-primary)]" />
                        <span className="text-sm font-medium text-[color:var(--color-text)]">{phase.window}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-[color:var(--color-border)]"></div>
                        <span className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-text-muted)]">Ações recomendadas</span>
                        <div className="h-px flex-1 bg-[color:var(--color-border)]"></div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-1">
                        {phase.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-start gap-3 rounded-lg border border-[color:var(--color-border)]/50 bg-[color:var(--color-surface)]/50 p-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-success-200)] bg-[color:var(--color-success-100)]">
                              <div className="h-2 w-2 rounded-full bg-[color:var(--color-success-500)]"></div>
                            </div>
                            <p className="text-sm leading-relaxed text-[color:var(--color-text)]">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {maintenancePlan.hasStraighteningRecommendation && maintenancePlan.reminders && maintenancePlan.reminders.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-has-success/30 bg-has-success/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-has-success">
                      <CalendarCheck size={16} />
                      Lembretes inteligentes
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {maintenancePlan.reminders.map((reminder) => (
                        <button
                          key={reminder.id}
                          type="button"
                          onClick={() => handleSendReminder(reminder.id)}
                          className="rounded-2xl border px-4 py-3 text-left text-sm hover:border-has-success/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-has-success/20"
                          style={{ borderColor: "rgba(5, 150, 105, 0.4)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-has-primary">{reminder.label}</p>
                          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{reminder.dateLabel}</p>
                          <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>{reminder.description}</p>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-has-primary">Disparar via WhatsApp</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => handleSendReminder()} className="btn-primary inline-flex items-center gap-2">
                    <CalendarCheck size={16} />
                    Notificar cliente via WhatsApp
                  </button>
                  <button type="button" onClick={handleCopyPlan} className="btn-secondary inline-flex items-center gap-2">
                    <Share2 size={16} />
                    Copiar cronograma / QR Code
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card-premium card-premium-interactive p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-has-primary">Storytelling IA</p>
                <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                  Narrativa curada para o profissional
                </h2>
              </div>
              {typeof scoreDelta === "number" && (
                <div className={`rounded-full px-4 py-1 text-sm font-semibold ${scoreDelta >= 0 ? "bg-has-success/10 text-has-success" : "bg-has-danger/10 text-has-danger"}`}>
                  {scoreDelta > 0 ? "+" : ""}
                  {scoreDelta.toFixed(1)} pts desde a última sessão
                </div>
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
              {aiSummary}
            </p>

            {aiTechnical && (
              <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  Justificativa técnica
                </p>
                <p className="mt-2 text-sm whitespace-pre-line" style={{ color: "var(--color-text)" }}>
                  {aiTechnical}
                </p>
              </div>
            )}

            {aiRisk && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-has-warning/40 bg-has-warning/10 px-4 py-2 text-sm text-has-warning">
                <AlertTriangle size={16} />
                Risco estimado: {aiRisk}
              </div>
            )}
          </div>

          <div className="card-premium card-premium-interactive p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-px w-8 bg-[color:var(--color-primary)]"></div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--color-primary)]">Plano combinado</p>
                    <div className="h-px w-8 bg-[color:var(--color-primary)]"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-[color:var(--color-text)]">Tratamentos, manutenção e home care</h3>
                </div>
                {history.recommendations?.maintenanceIntervalDays && (
                  <div className="flex min-w-[180px] flex-col items-center gap-2 text-center">
                    <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold border-has-success/40 bg-has-success/10 text-has-success">Em dia</span>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10">
                        <p className="text-lg font-bold text-[color:var(--color-primary)]">{history.recommendations.maintenanceIntervalDays}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Retorno em</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {history.recommendations.maintenanceIntervalDays === 1 ? "1 dia" : `${history.recommendations.maintenanceIntervalDays} dias`}
                        </p>
                        {maintenancePlan?.returnLabel && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{maintenancePlan.returnLabel}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {alertsCount > 0 && (
                <div className="rounded-2xl border border-has-warning/40 bg-has-warning/10 p-4 text-sm text-has-warning">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle size={18} />
                    {alertsCount} sinalização(ões) crítica(s)
                  </div>
                  <ul className="mt-3 space-y-2">
                    {alertFlags.map((flag, idx) => (
                      <li key={`${flag}-${idx}`} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-has-warning" aria-hidden />
                        <span className="leading-relaxed text-[color:var(--color-text)]">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1.3fr,1fr]">
              <div className="space-y-5">
                {Array.isArray(history?.recommendations?.treatments) && history.recommendations.treatments.length > 0 && (
                  <details className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--bg-primary)] p-4" open>
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-primary)]/10">
                          <span className="text-xs font-bold text-[color:var(--color-primary)]" aria-hidden="true" />
                        </div>
                        <h4 className="text-base font-semibold text-[color:var(--color-text)]">Sessão no salão</h4>
                      </div>
                    </summary>
                    <div className="ml-10 mt-3 space-y-2">
                      {history.recommendations.treatments.map((t: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 rounded-lg border border-[color:var(--color-border)]/30 bg-[color:var(--color-surface)]/30 p-3">
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-primary)]"></div>
                          <p className="text-sm leading-relaxed text-[color:var(--color-text)]">{prettifyRecommendationText(t)}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {Array.isArray(history?.recommendations?.homeCare) && history.recommendations.homeCare.length > 0 && (
                  <details className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--bg-primary)] p-4">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-success)]/10">
                          <span className="text-xs font-bold text-[color:var(--color-success)]" aria-hidden="true" />
                        </div>
                        <h4 className="text-base font-semibold text-[color:var(--color-text)]">Home care inteligente</h4>
                      </div>
                    </summary>
                    <div className="ml-10 mt-3 space-y-2">
                      {history.recommendations.homeCare.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 rounded-lg border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/5 p-3">
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-success)]"></div>
                          <p className="text-sm leading-relaxed text-[color:var(--color-text)]">{prettifyRecommendationText(item)}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {scalpTreatments.length > 0 && (
                  <details className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--bg-primary)] p-4">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-warning)]/10">
                          <span className="text-xs font-bold text-[color:var(--color-warning)]" aria-hidden="true" />
                        </div>
                        <h4 className="text-base font-semibold text-[color:var(--color-text)]">Tratamentos para couro cabeludo</h4>
                      </div>
                    </summary>
                    <div className="ml-10 mt-3 space-y-2">
                      {scalpTreatments.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 rounded-lg border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/5 p-3">
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-warning)]"></div>
                          <p className="text-sm leading-relaxed text-[color:var(--color-text)]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {returnPlanGoal && (
                  <div className="rounded-2xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-success)]">
                        <span className="text-xs font-bold text-white">!</span>
                      </div>
                      <p className="text-sm font-semibold text-[color:var(--color-success)]">Objetivo no próximo retorno</p>
                    </div>
                    <p className="pl-8 text-sm leading-relaxed text-[color:var(--color-success)]/90">{returnPlanGoal}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {blockStraightenings ? (
                  <div className="card-premium card-premium-interactive border-has-warning/40 bg-has-warning/10 p-5 text-has-warning">
                    <p className="text-xs uppercase tracking-[0.35em] text-has-warning">Alisamento não indicado agora</p>
                    <p className="mt-2 text-sm whitespace-pre-line">{professionalAlert || "Priorizar recuperação antes de qualquer alisamento."}</p>
                  </div>
                ) : Array.isArray(history?.recommendations?.recommendedStraighteningsDetailed) &&
                    history.recommendations.recommendedStraighteningsDetailed.length > 0 ? (
                  <details className="card-premium card-premium-interactive p-6" open>
                    <summary className="cursor-pointer list-none">
                      <p className="text-xs uppercase tracking-[0.35em] text-has-danger">IA de alisamentos</p>
                      <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        Compatibilidades sugeridas
                      </h3>
                    </summary>

                    <div className="mt-4 space-y-4">
                      {history.recommendations.recommendedStraighteningsDetailed.map((s: any) => (
                        <div key={s.id || s.name} className="card-premium-soft card-premium-interactive p-6">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{s.name}</h4>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[color:var(--color-success)]"></div>
                                <span className="text-sm text-[color:var(--color-success)]">Compatível</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 px-3 py-2">
                              <span className="text-sm font-medium text-[color:var(--color-success)]">Recomendado</span>
                            </div>
                          </div>

                          {s.description && (
                            <div className="rounded-lg border border-[color:var(--color-border)]/30 bg-[color:var(--color-surface)]/30 p-4">
                              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{s.description}</p>
                            </div>
                          )}

                          {Array.isArray(s.warnings) && s.warnings.length > 0 && (
                            <div className="rounded-2xl border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-warning)]">
                                  <span className="text-xs font-bold text-white">!</span>
                                </div>
                                <p className="text-sm font-semibold text-[color:var(--color-warning)]">Considerações importantes</p>
                              </div>
                              <ul className="space-y-2">
                                {s.warnings.map((warning: string, wIdx: number) => (
                                  <li key={wIdx} className="flex items-start gap-3">
                                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-warning)]"></div>
                                    <p className="text-sm leading-relaxed text-[color:var(--color-warning)]/90">{warning}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : Array.isArray(history?.recommendations?.recommendedStraightenings) && history.recommendations.recommendedStraightenings.length > 0 ? (
                  <details className="card-premium card-premium-interactive p-6" open>
                    <summary className="cursor-pointer list-none">
                      <p className="text-xs uppercase tracking-[0.35em] text-has-danger">Alisamentos recomendados</p>
                      <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        Compatibilidades sugeridas
                      </h3>
                    </summary>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm" style={{ color: "var(--color-text)" }}>
                      {history.recommendations.recommendedStraightenings.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {Array.isArray(history?.recommendations?.restrictedProcedures) && history.recommendations.restrictedProcedures.length > 0 && (
                  <details className="rounded-3xl border border-has-warning/40 bg-has-warning/10 p-4 shadow-sm" open>
                    <summary className="cursor-pointer list-none">
                      <p className="text-xs uppercase tracking-[0.35em] text-has-warning">Procedimentos restritos</p>
                    </summary>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-has-warning">
                      {history.recommendations.restrictedProcedures.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 self-start lg:sticky lg:top-24">
          <div className="card-premium card-premium-interactive p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-2" style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>
                  Panorama
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  Insights da sessão
                </p>
              </div>
            </div>

            {history.recommendations?.professionalAlert && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--color-text)" }}>
                  <Sparkles size={18} />
                  Alerta profissional
                </div>
                <p className="text-sm whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
                  {history.recommendations.professionalAlert}
                </p>
              </div>
            )}
          </div>

          {medicalReferral?.needed && (
            <div className="card-premium border-has-warning/40 bg-has-warning/10 p-5 text-has-warning">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} />
                Orientação médica
              </div>
              {typeof medicalReferral?.reason === "string" && medicalReferral.reason.trim() !== "" && (
                <p className="mt-2 text-sm font-medium">{medicalReferral.reason}</p>
              )}
              <p className="mt-2 text-sm whitespace-pre-line">
                {typeof medicalReferral?.guidance === "string" && medicalReferral.guidance.trim() !== ""
                  ? medicalReferral.guidance
                  : "Esta avaliação é estética. Na presença de sinais de saúde comprometida, orientar avaliação com dermatologista/tricologista médico."}
              </p>
            </div>
          )}
        </aside>
      </section>

      <section className="card-premium card-premium-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>
              Evolução do score
            </p>
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Linha do tempo inteligente
            </h3>
          </div>
          {typeof averageScore === "number" && (
            <div className="text-right text-sm" style={{ color: "var(--color-text-muted)" }}>
              Média histórica
              <p className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {averageScore}/100
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 h-64">
          {timelineLoading ? (
            <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              Carregando evolução...
            </div>
          ) : scoreTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={scoreTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.12)" />
                <XAxis dataKey="dateLabel" stroke={chartColors.axis} fontSize={12} />
                <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={12} />
                <Tooltip content={<ScoreTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ r: 4, fill: chartColors.primary }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              Histórico insuficiente para gerar gráfico.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
