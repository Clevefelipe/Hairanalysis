import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, History, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Modal from "../components/ui/Modal";
import NivelBadge from "../components/ui/NivelBadge";
import { listarAnalises } from "../services/analiseCapilarStorage";
import { compararAnalises } from "../engine/comparacaoEvolutiva";

export default function ComparacaoEvolutiva() {
  const navigate = useNavigate();
  const analises = listarAnalises();
  const [indexAnterior, setIndexAnterior] = useState<number | null>(null);
  const [indexAtual, setIndexAtual] = useState<number | null>(null);
  const [detalheAberto, setDetalheAberto] = useState<string | null>(null);

  const analisesOrdenadas = useMemo(() => {
    return [...analises].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }, [analises]);

  useEffect(() => {
    if (analisesOrdenadas.length >= 2) {
      setIndexAtual((prev) => (prev === null ? 0 : prev));
      setIndexAnterior((prev) => (prev === null ? 1 : prev));
    }
  }, [analisesOrdenadas]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  if (analisesOrdenadas.length < 2) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="page-hero">
          <div>
            <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>
              Comparação Evolutiva
            </p>
            <h1 className="page-hero-title">Capture a evolução da saúde capilar</h1>
            <p className="page-hero-subtitle">
              Registre pelo menos duas análises para desbloquear o comparativo premium.
            </p>
          </div>
          <div className="page-actions">
            <button className="btn-secondary" onClick={() => navigate("/historico-analises")}>
              Ver histórico
            </button>
            <button className="btn-primary" onClick={() => navigate("/analise-capilar") }>
              Nova análise
            </button>
          </div>
        </div>

        <div className="panel-tight border-dashed text-center hover:shadow-md transition-shadow" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Você ainda não possui dados suficientes</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Assim que duas análises forem registradas, o comparativo apresentará uma linha do tempo com insights e recomendações dinamicamente.
          </p>
        </div>
      </section>
    );
  }

  const anterior = indexAnterior !== null ? analisesOrdenadas[indexAnterior] : null;
  const atual = indexAtual !== null ? analisesOrdenadas[indexAtual] : null;
  const selecionouMesmo = anterior && atual && anterior.id === atual.id;

  const resultado = useMemo(() => {
    if (!anterior || !atual || selecionouMesmo) return null;
    return compararAnalises(
      {
        data: anterior.data,
        score: Number(anterior.score ?? 0),
        nivel: (anterior.nivel as "baixo" | "moderado" | "elevado") ?? "moderado",
        flags: anterior.flags ?? [],
      },
      {
        data: atual.data,
        score: Number(atual.score ?? 0),
        nivel: (atual.nivel as "baixo" | "moderado" | "elevado") ?? "moderado",
        flags: atual.flags ?? [],
      },
    );
  }, [anterior, atual, selecionouMesmo]);

  const diferencaDias = useMemo(() => {
    if (!anterior || !atual) return null;
    const diff =
      (new Date(atual.data).getTime() - new Date(anterior.data).getTime()) /
      (1000 * 60 * 60 * 24);
    return Math.abs(Math.round(diff));
  }, [anterior, atual]);

  const statusStyles: Record<string, { label: string; badge: string; border: string }> = {
    melhora: {
      label: "Evolução positiva",
      badge: "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] border-[color:var(--color-success-200)]",
      border: "border-[color:var(--color-success-200)]",
    },
    piora: {
      label: "Atenção imediata",
      badge: "bg-[color:var(--color-error-50)] text-[color:var(--color-error-700)] border-[color:var(--color-error-200)]",
      border: "border-[color:var(--color-error-200)]",
    },
    estavel: {
      label: "Manutenção",
      badge: "bg-[var(--bg-primary)] text-[var(--color-text-muted)] border-[var(--color-border)]",
      border: "border-[var(--color-border)]",
    },
  };

  const timelinePreview = analisesOrdenadas.slice(0, 6);

  const renderSelect = (
    label: string,
    value: number | null,
    onChange: (val: number) => void,
    excludeId?: string,
  ) => (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <select
        className="w-full rounded-2xl border px-4 py-3 text-sm focus:border-[color:var(--color-success-400)] focus:outline-none"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="">Escolha uma análise</option>
        {analisesOrdenadas.map((analise, index) => (
          <option
            key={analise.id}
            value={index}
            disabled={excludeId ? analise.id === excludeId : false}
          >
            {dateFormatter.format(new Date(analise.data))} · {analise.nivel || "—"}
          </option>
        ))}
      </select>
    </div>
  );

  const detalheSelecionado = analisesOrdenadas.find((item) => item.id === detalheAberto);

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="page-hero">
        <div>
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>Comparação Evolutiva</p>
          <h1 className="page-hero-title">Insights entre análises</h1>
          <p className="page-hero-subtitle">
            Cruce resultados, evidencie progressos e planeje intervenções com rapidez.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={() => navigate("/historico-analises")}>
            Histórico
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button className="btn-primary" onClick={() => navigate("/analise-capilar") }>
            Nova análise
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel-tight lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Seleção inteligente</p>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Escolha os pontos de comparação</h2>
            </div>
            <button
              className="btn-ghost text-sm"
              onClick={() => {
                setIndexAtual(0);
                setIndexAnterior(1);
              }}
            >
              <RefreshCcw size={16} className="mr-1" /> Resetar
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {renderSelect("Análise anterior", indexAnterior, setIndexAnterior, atual?.id)}
            {renderSelect("Análise atual", indexAtual, setIndexAtual, anterior?.id)}
          </div>

          {selecionouMesmo && (
            <div className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--color-warning-200)", backgroundColor: "var(--color-warning-50)", color: "var(--color-warning-800)" }}>
              Escolha registros diferentes para visualizar a evolução.
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[anterior, atual].map((item, idx) => (
              <button
                key={idx}
                onClick={() => item && setDetalheAberto(item.id)}
                className="flex flex-col rounded-2xl border p-4 text-left shadow-sm transition hover:border-[color:var(--color-success-200)] hover:shadow-md focus-ring-strong"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                  <span>{idx === 0 ? "Anterior" : "Atual"}</span>
                  {item && <span>{item.score ? `${item.score} pts` : "Sem score"}</span>}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {item ? dateFormatter.format(new Date(item.data)) : "Selecione uma análise"}
                </p>
                {item ? (
                  <p className="mt-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.resumo || "Sem resumo cadastrado"}
                  </p>
                ) : (
                  <p className="mt-1 text-base font-semibold" style={{ color: "var(--color-text-muted)" }}>—</p>
                )}
                {item?.nivel && (
                  <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                    <History size={14} style={{ color: "var(--color-text-muted)" }} /> {item.nivel}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-tight space-y-4">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Linha do tempo</p>
          <div className="space-y-3">
            {timelinePreview.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition hover:border-[color:var(--color-success-200)] hover:shadow-md"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}
                onClick={() => setDetalheAberto(item.id)}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {dateFormatter.format(new Date(item.data))}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.resumo || "Sem resumo"}</p>
                </div>
                <ArrowUpRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel-tight lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Resultado</p>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Comparativo técnico</h2>
            </div>
            {resultado && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[resultado.status].badge
              }`}
              >
                {statusStyles[resultado.status].label}
              </span>
            )}
          </div>

          {resultado ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className={`rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${statusStyles[resultado.status].border}`}>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Resumo automático</p>
                <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>{resultado.resumo}</p>
                <p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>Diferença de score</p>
                <p className="text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {resultado.diferencaScore > 0 ? "+" : ""}
                  {resultado.diferencaScore}
                </p>
                {diferencaDias !== null && (
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>Intervalo de {diferencaDias} dias</p>
                )}
              </div>

              <div className="rounded-3xl border p-5 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Antes x Depois</p>
                <div className="mt-4 grid gap-4">
                  {anterior && (
                    <div className="flex items-center justify-between rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: "var(--bg-primary)" }}>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Antes</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {dateFormatter.format(new Date(anterior.data))}
                        </p>
                      </div>
                      <NivelBadge nivel={(anterior.nivel as "baixo" | "moderado" | "elevado") ?? "moderado"} />
                    </div>
                  )}
                  {atual && (
                    <div className="flex items-center justify-between rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: "var(--bg-primary)" }}>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Depois</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {dateFormatter.format(new Date(atual.data))}
                        </p>
                      </div>
                      <NivelBadge nivel={(atual.nivel as "baixo" | "moderado" | "elevado") ?? "moderado"} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border px-5 py-6 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
              Defina duas análises diferentes para desbloquear o comparativo automático.
            </div>
          )}
        </div>

        <div className="panel-tight space-y-4">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Ações rápidas</p>
          <button className="btn-outline w-full" onClick={() => navigate("/historico-analises")}>
            <History size={16} className="mr-2" /> Ver histórico completo
          </button>
          <button className="btn-outline w-full" onClick={() => navigate("/dashboard")}>
            <ArrowRight size={16} className="mr-2" /> Voltar ao dashboard
          </button>
          <button className="btn-primary w-full" onClick={() => navigate("/analise-capilar") }>
            <ArrowUpRight size={16} className="mr-2" /> Iniciar nova análise
          </button>
        </div>
      </div>

      {detalheSelecionado && (
        <Modal
          title="Detalhes da análise"
          isOpen={Boolean(detalheSelecionado)}
          onClose={() => setDetalheAberto(null)}
        >
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Data</p>
                <p className="text-base font-semibold text-slate-900">
                  {dateFormatter.format(new Date(detalheSelecionado.data))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
                <p className="text-base font-semibold text-slate-900">
                  {detalheSelecionado.score ?? "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resumo técnico</p>
              <p className="mt-2 text-sm text-slate-700">
                {detalheSelecionado.resumo || "Nenhum resumo salvo."}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Indicadores</p>
              {detalheSelecionado.flags?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                  {detalheSelecionado.flags.map((flag) => (
                    <li key={`${detalheSelecionado.id}-${flag}`}>{flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nenhum indicador registrado.</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDetalheAberto(null)}>
                Fechar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setDetalheAberto(null);
                  navigate(`/analise-capilar?analysisId=${detalheSelecionado.id}`);
                }}
              >
                Reabrir análise
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
