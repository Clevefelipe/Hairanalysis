import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareHistory, listHistoryByClient } from "../services/history.service";
import PageHero from "../components/ui/PageHero";
import { useMemo as useReactMemo } from "react";
import { useClientSession } from "../context/ClientSessionContext";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";

type EvolutionTooltipProps = TooltipProps<number, string> & {
  payload?: { value?: number }[];
  label?: string;
};

const EvolutionTooltip = ({ active, payload, label }: EvolutionTooltipProps) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}/100</p>
    </div>
  );
};

type ComparisonPayload = {
  from?: any;
  to?: any;
  scoreDelta?: number;
  summary?: string;
  details?: string[];
};

function formatDate(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryEvolutionPage() {
  const navigate = useNavigate();
  const { activeClient } = useClientSession();
  const [params] = useSearchParams();
  const firstId = params.get("from");
  const secondId = params.get("to");
  const clientIdParam = params.get("clientId");
  const clientId = clientIdParam || activeClient?.id || undefined;

  const formatClientCode = useReactMemo(
    () => (value?: string | null) => {
      const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
      if (!clean) return "—";
      if (clean.length <= 4) return clean;
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    },
    [],
  );

  const [data, setData] = useState<ComparisonPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseSession = data?.from;
  const currentSession = data?.to;
  const baseScore = baseSession?.recommendation?.score ?? baseSession?.score ?? null;
  const currentScore = currentSession?.recommendation?.score ?? currentSession?.score ?? null;
  const aiSummary = data?.summary || currentSession?.interpretation || "Comparativo registrado sem narrativa.";
  const detailList = Array.isArray(data?.details) ? data!.details : [];

  const timelineData = useMemo(() => {
    const basePoint = baseScore !== null && baseSession?.createdAt
      ? { label: formatDate(baseSession.createdAt), score: baseScore }
      : null;
    const currentPoint = currentScore !== null && currentSession?.createdAt
      ? { label: formatDate(currentSession.createdAt), score: currentScore }
      : null;
    return [basePoint, currentPoint].filter(Boolean) as { label: string; score: number }[];
  }, [baseScore, currentScore, baseSession?.createdAt, currentSession?.createdAt]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let a = firstId;
        let b = secondId;

        if ((!a || !b) && clientId) {
          const items = await listHistoryByClient(clientId);
          if (items.length >= 2) {
            a = items[1].id;
            b = items[0].id;
          } else {
            if (!cancelled) {
              setData(null);
              setError("Selecione um cliente com ao menos duas análises.");
            }
            return;
          }
        }

        if (!a || !b) {
          if (!cancelled) {
            setData(null);
            setError("Selecione um cliente com ao menos duas análises.");
          }
          return;
        }

        const result = await compareHistory(a, b);
        if (!cancelled) {
          if (result) {
            setData(result);
          } else {
            setError("Não foi possível comparar as análises. Verifique se há duas sessões válidas.");
            setData(null);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Não foi possível comparar as análises.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [firstId, secondId, clientId, activeClient?.id]);

  if (loading) {
    return (
      <section className="animate-page-in pb-12 pt-8">
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white text-sm text-slate-500 shadow-sm">
          Comparando análises...
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="animate-page-in pb-12 pt-8">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 px-6 py-4 text-center text-sm text-rose-800 shadow-sm">
          <p className="text-sm font-semibold">{error}</p>
          <p className="mt-2 text-xs text-rose-600">
            Garanta que o cliente possua pelo menos duas sessões registradas.
          </p>
        </div>
      </section>
    );
  }

  const scoreDelta = data?.scoreDelta;

  const heroMeta = [
    {
      label: "Delta técnico",
      value:
        typeof scoreDelta === "number"
          ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(1)} pts`
          : "--",
    },
    { label: "Base", value: formatDate(baseSession?.createdAt) },
    { label: "Atual", value: formatDate(currentSession?.createdAt) },
    { label: "Cód cliente", value: `#${formatClientCode(clientId)}` },
  ];

  const heroActions = [
    {
      label: "Voltar ao histórico",
      icon: <ArrowLeft size={16} />,
      variant: "ghost" as const,
      onClick: () => navigate("/historico"),
    },
    baseSession?.id && {
      label: "Ver análise anterior",
      icon: <ArrowUpRight size={16} />,
      variant: "secondary" as const,
      onClick: () => navigate(`/historico/${baseSession.id}`),
    },
    currentSession?.id && {
      label: "Ver análise atual",
      icon: <FileText size={16} />,
      onClick: () => navigate(`/historico/${currentSession.id}`),
    },
  ].filter(Boolean);

  return (
    <section className="animate-page-in space-y-8 pb-12 pt-8">
      <PageHero
        title="Evolução inteligente"
        subtitle="Comparativo premium entre sessões consecutivas com narrativa IA e visão técnica."
        meta={heroMeta}
        actions={heroActions as any}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="panel-tight">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sessão base</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {baseSession?.recommendation?.name || "Sem recomendação"}
              </h3>
              <p className="text-xs text-slate-500">{formatDate(baseSession?.createdAt)}</p>
            </div>
            {typeof baseScore === "number" && (
              <div className="rounded-2xl bg-slate-900/10 px-4 py-2 text-center">
                <p className="text-2xl font-semibold text-slate-900">{baseScore}</p>
                <p className="text-[11px] uppercase tracking-widest text-slate-500">Score</p>
              </div>
            )}
          </div>
          {baseSession?.flags && baseSession.flags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {baseSession.flags.map((flag: string) => (
                <span key={flag} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 shadow-sm hover:shadow-md transition-shadow">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="panel-tight hover:shadow-md transition-shadow">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-success-500)]">Sessão atual</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {currentSession?.recommendation?.name || "Sem recomendação"}
              </h3>
              <p className="text-xs text-slate-500">{formatDate(currentSession?.createdAt)}</p>
            </div>
            {typeof currentScore === "number" && (
              <div className="rounded-2xl bg-[color:var(--color-success-100)] px-4 py-2 text-center">
                <p className="text-2xl font-semibold text-[color:var(--color-success-700)]">{currentScore}</p>
                <p className="text-[11px] uppercase tracking-widest text-[color:var(--color-success-600)]">Score</p>
              </div>
            )}
          </div>
          {currentSession?.flags && currentSession.flags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentSession.flags.map((flag: string) => (
                <span key={flag} className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700 shadow-sm hover:shadow-md transition-shadow">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="panel-tight">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-500">Storytelling IA</p>
              <h3 className="text-lg font-semibold text-slate-900">
                Delta contextualizado para o profissional
              </h3>
            </div>
            {typeof scoreDelta === "number" && (
              <div
                className={`rounded-full px-4 py-1 text-sm font-semibold ${
                  scoreDelta >= 0
                    ? "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {scoreDelta > 0 ? "+" : ""}
                {scoreDelta.toFixed(1)} pts
              </div>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{aiSummary}</p>

          {detailList.length > 0 && (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pontos técnicos monitorados
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {detailList.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="panel-tight">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900/10 p-2 text-slate-800">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Status IA</p>
              <p className="text-lg font-semibold text-slate-900">Comparativo ativo</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Inteligência estética acompanha a jornada do cliente, apontando regressões e avanços
            com foco em retenção.
          </p>
          <div className="mt-4 rounded-2xl border border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] p-4 text-sm text-[color:var(--color-success-900)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles size={16} />
              Insights ativos
            </div>
            <p className="mt-1">
              {typeof scoreDelta === "number"
                ? scoreDelta >= 0
                  ? "Cliente apresenta evolução positiva. Considere reforçar manutenção."
                  : "Regressão detectada. Reavalie protocolos e home care."
                : "Aguardando dados suficientes para insights."}
            </p>
          </div>
        </div>
      </section>

      <section className="panel-tight">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Linha do tempo</p>
            <h3 className="text-lg font-semibold text-slate-900">Score comparativo</h3>
          </div>
        </div>

        <div className="mt-6 h-64">
          {timelineData.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<EvolutionTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 text-center px-4">
              Registre análises com score para plotar a evolução.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
