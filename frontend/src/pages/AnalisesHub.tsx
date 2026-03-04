import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Layers, Loader2, Microscope, Sparkles, Timer, User, UserRound, Wand2 } from "lucide-react";

import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";
import ClientLookupModal from "@/components/clientes/ClientLookupModal";
import { useClientSession } from "@/context/ClientSessionContext";
import { useToast } from "@/components/ui/ToastProvider";
import { AnalysisHistory, listHistoryByClient } from "@/services/history.service";
import { formatDateShortBr } from "@/utils/date";

function safeDate(value: string | number | Date | undefined | null) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

export default function AnalisesHub() {
  const navigate = useNavigate();
  const { activeClient, hasSession, startSession, endSession, flowState, setFlowMode, resetFlowProgress } = useClientSession();
  const { notify } = useToast();

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<AnalysisHistory[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [includeTricologica, setIncludeTricologica] = useState(true);
  const [includeCapilar, setIncludeCapilar] = useState(true);

  const manualSequence = useMemo(() => {
    const steps: { key: "tricologica" | "capilar"; label: string }[] = [];
    if (includeTricologica) steps.push({ key: "tricologica", label: "Análise Tricológica" });
    if (includeCapilar) steps.push({ key: "capilar", label: "Análise Capilar" });
    return steps;
  }, [includeCapilar, includeTricologica]);

  useEffect(() => {
    if (!activeClient?.id) {
      setHistoryItems([]);
      return;
    }

    let alive = true;
    setHistoryLoading(true);
    setHistoryError(null);

    listHistoryByClient(activeClient.id)
      .then((items) => {
        if (!alive) return;
        setHistoryItems(items);
      })
      .catch((err: any) => {
        if (!alive) return;
        const msg = err?.response?.data?.message || err?.message || "Não foi possível carregar o histórico.";
        setHistoryItems([]);
        setHistoryError(msg);
        notify(msg, "warning");
      })
      .finally(() => {
        if (alive) setHistoryLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeClient?.id, notify]);

  const currentClientName = useMemo(() => activeClient?.nome || "Nenhum", [activeClient?.nome]);
  const sessionGate = useMemo(() => !hasSession || !activeClient, [hasSession, activeClient]);

  const latestTricologica = useMemo(() => {
    return [...historyItems]
      .map((item) => ({ item, date: safeDate(item.createdAt) }))
      .filter(({ item, date }) => item.analysisType === "tricologica" && date)
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0]?.item;
  }, [historyItems]);

  const latestCapilar = useMemo(() => {
    return [...historyItems]
      .map((item) => ({ item, date: safeDate(item.createdAt) }))
      .filter(({ item, date }) => item.analysisType === "capilar" && date)
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0]?.item;
  }, [historyItems]);

  const latestIntegrated = useMemo(() => {
    return [...historyItems]
      .map((item) => ({ item, date: safeDate(item.createdAt) }))
      .filter(({ item, date }) => item.analysisType === "geral" && date)
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0]?.item;
  }, [historyItems]);

  const latestTricologicaForCard = latestTricologica ?? latestIntegrated;
  const latestCapilarForCard = latestCapilar ?? latestIntegrated;
  const tricologicaSourceLabel = latestTricologica ? "Origem: individual" : latestIntegrated ? "Origem: integrada" : null;
  const capilarSourceLabel = latestCapilar ? "Origem: individual" : latestIntegrated ? "Origem: integrada" : null;

  const ensureClient = () => {
    if (!hasSession || !activeClient) {
      setLookupOpen(true);
      notify("Selecione uma cliente antes de iniciar a análise.", "warning");
      return false;
    }
    return true;
  };

  const startIndividualAnalysis = (path: string, flow: "capilar_individual" | "tricologica_individual") => {
    if (!ensureClient()) return;
    setFlowMode(flow);
    const params = new URLSearchParams();
    params.set("flow", flow);
    params.set("clientId", activeClient!.id);
    navigate(`${path}?${params.toString()}`);
  };

  const startManualJourney = () => {
    if (!ensureClient()) return;
    if (!includeTricologica && !includeCapilar) {
      notify("Selecione ao menos um tipo de análise para a jornada manual.", "warning");
      return;
    }

    const params = new URLSearchParams();
    params.set("journey", "manual");
    if (includeTricologica) params.set("tricologica", "1");
    if (includeCapilar) params.set("capilar", "1");
    if (manualSequence.length > 0) {
      params.set("journeyStep", manualSequence[0].key);
    }

    const nextPath = includeTricologica ? "/analise-tricologica" : "/analise-capilar";
    navigate(`${nextPath}?${params.toString()}`);
  };

  const startIntegratedJourney = () => {
    if (!ensureClient()) return;
    setFlowMode("completo");
    resetFlowProgress();
    const params = new URLSearchParams();
    params.set("flow", "completo");
    params.set("clientId", activeClient!.id);
    params.set("start", "config");
    navigate(`/analise-tricologica?${params.toString()}`);
  };

  const openUnifiedResult = () => {
    if (!ensureClient()) return;
    navigate(`/historico?clientId=${activeClient!.id}`);
  };

  const tricoCount = useMemo(() => historyItems.filter((i) => i.analysisType === "tricologica").length, [historyItems]);
  const capilarCount = useMemo(() => historyItems.filter((i) => i.analysisType === "capilar").length, [historyItems]);
  const integradaCount = useMemo(() => historyItems.filter((i) => i.analysisType === "geral").length, [historyItems]);
  const latestAny = useMemo(() => {
    return [...historyItems]
      .map((item) => ({ item, date: safeDate(item.createdAt) }))
      .filter(({ date }) => Boolean(date))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0]?.item;
  }, [historyItems]);

  const recentHistoryFiltered = useMemo(() => {
    const sorted = [...historyItems]
      .map((item) => ({ item, date: safeDate(item.createdAt) }))
      .filter(({ date }) => Boolean(date))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    const seenKeys = new Set<string>();

    return sorted
      .filter(({ item, date }) => {
        if (!date) return false;
        const dayKey = date.toISOString().slice(0, 10);
        const key = `${item.analysisType}-${dayKey}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      })
      .map(({ item }) => item)
      .slice(0, 5);
  }, [historyItems]);

  const recommendedNext = useMemo(() => {
    if (!hasSession || !activeClient) {
      return { label: "Selecione uma cliente para iniciar", path: null as string | null };
    }

    if (flowState.mode === "completo") {
      if (!flowState.tricologicaDone) {
        return {
          label: "Inicie pela análise tricológica (protocolo completo)",
          path: `/analise-tricologica?flow=completo&clientId=${activeClient.id}`,
        };
      }
      if (!flowState.capilarDone) {
        return {
          label: "Continue com a análise capilar para concluir o protocolo",
          path: `/analise-capilar?flow=completo&clientId=${activeClient.id}`,
        };
      }
      return { label: "Resultado integrado pronto para revisão", path: `/historico?clientId=${activeClient.id}` };
    }

    if (!latestAny) {
      return { label: "Inicie pela análise tricológica", path: `/analise-tricologica?flow=tricologica_individual&clientId=${activeClient.id}` };
    }
    if (latestAny.analysisType === "tricologica") {
      return { label: "Continue com a análise capilar", path: `/analise-capilar?flow=capilar_individual&clientId=${activeClient.id}` };
    }
    return { label: "Revisar histórico integrado da cliente", path: `/historico?clientId=${activeClient.id}` };
  }, [activeClient, flowState.capilarDone, flowState.mode, flowState.tricologicaDone, hasSession, latestAny]);

  const hasRecommendedStep = Boolean(recommendedNext.path);

  const handleExecuteRecommendedStep = () => {
    if (!recommendedNext.path) {
      setLookupOpen(true);
      return;
    }

    navigate(recommendedNext.path);
  };

  const handleStartCompleteProtocol = () => {
    startIntegratedJourney();
  };

  const heroActions = hasSession
    ? [
        {
          label: "Trocar cliente",
          icon: <UserRound size={16} />,
          variant: "secondary" as const,
          onClick: () => setLookupOpen(true),
        },
        {
          label: "Encerrar sessão",
          variant: "ghost" as const,
          onClick: endSession,
        },
      ]
    : undefined;

  const analysisTypeLabel = (type: AnalysisHistory["analysisType"]) => {
    if (type === "tricologica") return "Tricológica";
    if (type === "geral") return "Integrada";
    return "Capilar";
  };

  return (
    <section className="section-stack animate-page-in w-full">
      <PageHero
        title="Central de Análises"
        subtitle="Inicie análises individuais ou coordene uma jornada manual."
        meta={[
          { label: "Cliente em sessão", value: currentClientName },
          { label: "Histórico", value: `${historyItems.length} análises` },
        ]}
        actions={heroActions}
      />

      {sessionGate && (
        <section className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <div className="rounded-xl border p-6 sm:p-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}>
                <User size={36} strokeWidth={1.35} />
              </span>
              <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>Nenhuma cliente ativa</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Selecione uma cliente para iniciar ou registrar análises.</p>
              <div className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <p>1. Busque a cliente ou crie um novo cadastro</p>
                <p>2. Inicie a análise desejada ou combine uma jornada</p>
                <p>3. Finalize pelo histórico integrado</p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  className="btn-primary text-sm"
                  onClick={() => setLookupOpen(true)}
                >
                  Selecionar cliente
                </button>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => navigate("/clientes")}
                >
                  Ir para clientes
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--color-text-muted)" }}>Roteiro inteligente</p>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{recommendedNext.label}</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button
              className="btn-secondary flex w-full items-center justify-center gap-2 sm:w-auto"
              onClick={handleStartCompleteProtocol}
              disabled={!hasSession}
            >
              <Layers size={15} />
              Iniciar protocolo completo
            </button>
            <button
              className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
              onClick={handleExecuteRecommendedStep}
              disabled={!hasRecommendedStep}
            >
              <ArrowRight size={15} />
              Executar próximo passo
            </button>
          </div>
        </div>
      </section>

      {hasSession && (
        <section className="panel-tight">
          <div className="grid-dense sm:grid-cols-3">
            <article className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Cliente ativa</p>
              <p className="mt-1 text-lg font-semibold line-clamp-1" style={{ color: "var(--color-text)" }}>{activeClient?.nome}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Sessão em andamento</p>
            </article>
            <article className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Última análise</p>
                <Timer size={16} className="text-[color:var(--color-success-600)]" />
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text)" }}>{latestAny ? formatDateShortBr(latestAny.createdAt) : "Sem histórico"}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{latestAny ? analysisTypeLabel(latestAny.analysisType) : "Registre a primeira análise."}</p>
            </article>
            <article className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Volume de análises</p>
                <Wand2 size={16} className="text-cyan-600" />
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text)" }}>{tricoCount} tricológicas • {capilarCount} capilares • {integradaCount} integradas</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Contagem desta cliente</p>
            </article>
          </div>
        </section>
      )}

      <section className="panel-tight section-stack">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Análises individuais</p>
            <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Escolha o tipo de análise</h3>
          </div>

          <div className="grid-dense sm:grid-cols-2">
            <article className="panel-tight p-4 md:p-5 transition-shadow hover:shadow-md h-full flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <Microscope size={24} className="text-cyan-600" />
                <h4 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Análise Tricológica</h4>
              </div>
              <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>Avaliação do couro cabeludo, densidade folicular e sinais de sensibilidade.</p>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>Tempo médio: 8-10 min • Inclui questionário rápido</p>
              {!latestAny && hasSession && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Recomendado para iniciar</p>
              )}
              <button className="btn-primary w-full mt-auto" onClick={() => startIndividualAnalysis("/analise-tricologica", "tricologica_individual")}>Iniciar análise tricológica</button>
            </article>

            <article className="panel-tight p-4 md:p-5 transition-shadow hover:shadow-md h-full flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <Sparkles size={24} className="text-[color:var(--color-success-600)]" />
                <h4 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Análise Capilar</h4>
              </div>
              <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>Avaliação da fibra capilar, danos, porosidade e segurança química.</p>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>Tempo médio: 10-12 min • Checagem de pH e cutícula</p>
              {latestAny?.analysisType === "tricologica" && hasSession && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-success-700)]">Próxima etapa ideal</p>
              )}
              <button className="btn-primary w-full mt-auto" onClick={() => startIndividualAnalysis("/analise-capilar", "capilar_individual")}>Iniciar análise capilar</button>
            </article>
          </div>
        </div>
      </section>

      <section className="panel-tight section-stack">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Jornada manual</p>
            <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Combine análises</h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Selecione quais etapas quer executar e navegue manualmente.</p>
          </div>

          <div className="glass-panel p-6 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <div className="border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
            <SectionToolbar className="justify-between gap-4 flex-wrap">
              <div className="chip-group">
                <label className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                  <input type="checkbox" className="accent-[color:var(--color-success-600)]" checked={includeTricologica} onChange={() => setIncludeTricologica((prev) => !prev)} />
                  Incluir tricologia
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                  <input type="checkbox" className="accent-[color:var(--color-success-600)]" checked={includeCapilar} onChange={() => setIncludeCapilar((prev) => !prev)} />
                  Incluir capilar
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="btn-primary flex items-center gap-2" onClick={startManualJourney}>
                  <Layers size={16} />
                  Iniciar jornada selecionada
                </button>
                <button className="btn-secondary flex items-center gap-2" onClick={openUnifiedResult} disabled={!hasSession}>
                  <CheckCircle2 size={16} />
                  Ver resultado unificado
                </button>
              </div>
            </SectionToolbar>
            </div>

            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Sequência planejada</p>
              {manualSequence.length > 0 ? (
                <ol className="mt-3 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
                  {manualSequence.map((step, index) => (
                    <li key={step.key} className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shadow-sm" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                        {index + 1}
                      </span>
                      {step.label}
                      {step.key === "capilar" && includeTricologica && " • abre automaticamente após concluir a tricologia"}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Selecione ao menos uma análise para montar a jornada.</p>
              )}
            </div>

            <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Execute cada análise separadamente e finalize pelo histórico da cliente.
            </p>
          </div>
        </div>
      </section>

      <section className="panel-tight section-stack">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <Layers size={17} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Resultado integrado</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Resumo rápido do couro cabeludo (tricologia) e da haste capilar.</p>
            </div>
          </div>

          <div className="grid-dense sm:grid-cols-2">
            <article className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Microscope size={18} className="text-cyan-700" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--color-text-muted)" }}>Couro cabeludo</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Análise tricológica</p>
                    {tricologicaSourceLabel && (
                      <span className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                        {tricologicaSourceLabel}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {latestTricologicaForCard ? formatDateShortBr(latestTricologicaForCard.createdAt) : "—"}
                </span>
              </div>

              {historyLoading ? (
                <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando dados...</p>
              ) : !latestTricologicaForCard ? (
                <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhuma análise tricológica registrada para esta cliente.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm line-clamp-3" style={{ color: "var(--color-text)" }}>{latestTricologicaForCard.interpretation || "Sem interpretação disponível."}</p>
                  {latestTricologicaForCard.aiExplanationText && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{latestTricologicaForCard.aiExplanationText}</p>
                  )}
                  <button className="btn-text text-sm text-[color:var(--color-success-700)]" onClick={openUnifiedResult}>
                    Ver laudo detalhado
                  </button>
                </div>
              )}
            </article>

            <article className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[color:var(--color-success-700)]" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--color-text-muted)" }}>Haste capilar</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Análise capilar</p>
                    {capilarSourceLabel && (
                      <span className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                        {capilarSourceLabel}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {latestCapilarForCard ? formatDateShortBr(latestCapilarForCard.createdAt) : "—"}
                </span>
              </div>

              {historyLoading ? (
                <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando dados...</p>
              ) : !latestCapilarForCard ? (
                <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhuma análise capilar registrada para esta cliente.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm line-clamp-3" style={{ color: "var(--color-text)" }}>{latestCapilarForCard.interpretation || "Sem interpretação disponível."}</p>
                  {latestCapilarForCard.aiExplanationText && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{latestCapilarForCard.aiExplanationText}</p>
                  )}
                  <button className="btn-text text-sm text-[color:var(--color-success-700)]" onClick={openUnifiedResult}>
                    Ver laudo detalhado
                  </button>
                </div>
              )}
            </article>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={openUnifiedResult} disabled={!hasSession}>
              <CheckCircle2 size={16} />
              Ver histórico completo
            </button>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Últimos registros combinam couro cabeludo e haste capilar para um diagnóstico integrado.
            </p>
          </div>
        </div>
      </section>

      <section className="panel-tight section-stack">
        <div className="flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          <CheckCircle2 size={17} />
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Histórico recente</p>
        </div>

        <div className="mt-4">
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <Loader2 size={14} className="animate-spin" />
              Carregando histórico...
            </div>
          ) : historyError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm">
              {historyError}
            </div>
          ) : historyItems.length > 0 ? (
            <div className="grid-dense">
              {recentHistoryFiltered.map((item) => (
                <div key={item.id} className="rounded-xl border p-3 text-sm shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: "var(--color-text)" }}>
                      {analysisTypeLabel(item.analysisType)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatDateShortBr(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{item.interpretation || "Sem interpretação disponível."}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {hasSession ? "Nenhuma análise encontrada para esta cliente." : "Selecione uma cliente para ver o histórico."}
            </p>
          )}
        </div>
      </section>

      <ClientLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={(cliente) => {
          startSession(cliente, "completo");
          setLookupOpen(false);
        }}
      />
    </section>
  );
}
