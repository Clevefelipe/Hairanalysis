import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";
import { listarAnalises } from "@/services/analiseCapilarStorage";

type AnaliseSalva = ReturnType<typeof listarAnalises>[number];

export default function HistoricoAnalises() {
  const navigate = useNavigate();
  const analises = listarAnalises();
  const [detalhe, setDetalhe] = useState<AnaliseSalva | null>(null);

  const analisesOrdenadas = useMemo(() => {
    return [...analises].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }, [analises]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  return (
    <section className="section-stack animate-page-in w-full">
      <PageHero
        title="Análises registradas"
        subtitle="Consulte rapidamente os registros salvos e acompanhe evoluções técnicas."
        meta={[{ label: "Total", value: analises.length }]}
      />

      <SectionToolbar className="justify-between">
        <div className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Histórico vivo</div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary focus-ring-strong"
            onClick={() => navigate("/dashboard")}
          >
            Voltar ao dashboard
          </button>
          <button
            className="btn-secondary focus-ring-strong"
            onClick={() => navigate("/comparacao-evolutiva")}
            disabled={analises.length < 2}
          >
            Comparar análises
          </button>
          <button
            className="btn-primary focus-ring-strong"
            onClick={() => navigate("/analise-capilar")}
          >
            Nova análise
          </button>
        </div>
      </SectionToolbar>

      {analisesOrdenadas.length === 0 ? (
        <div className="panel-tight border border-dashed text-center" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
            Nenhuma análise registrada
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Assim que você concluir uma análise ela aparecerá aqui com o resumo técnico.
          </p>
          <div className="mt-3">
            <button className="btn-primary" onClick={() => navigate("/analise-capilar")}>
              Registrar análise
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-dense lg:grid-cols-2">
          {analisesOrdenadas.map((analise) => (
            <button
              key={analise.id}
              onClick={() => setDetalhe(analise)}
              className="text-left panel-tight transition focus-ring-strong"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between text-sm" style={{ color: "var(--color-text-muted)" }}>
                <span>{dateFormatter.format(new Date(analise.data))}</span>
                <span className="uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                  {`${analise.flags?.length ?? 0} alertas`}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {analise.resumo || "Resumo indisponível"}
              </p>
              {analise.flags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]" style={{ color: "var(--risk-moderate)" }}>
                  {analise.flags.map((flag) => (
                    <span
                      key={`${analise.id}-${flag}`}
                      className="rounded-full border px-3 py-1"
                      style={{ borderColor: "#fde68a", backgroundColor: "#fef3c7" }}
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Sem alertas registrados
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {detalhe && (
        <Modal
          title="Detalhes da análise"
          isOpen={Boolean(detalhe)}
          onClose={() => setDetalhe(null)}
        >
          <div className="space-y-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Data</p>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {dateFormatter.format(new Date(detalhe.data))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Alertas</p>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {detalhe.flags?.length ?? 0}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Resumo técnico</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text)" }}>
                {detalhe.resumo || "Nenhum resumo salvo."}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Indicadores</p>
              {detalhe.flags?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--color-text)" }}>
                  {detalhe.flags.map((flag) => (
                    <li key={`${detalhe.id}-flag-${flag}`}>{flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhum indicador registrado.</p>
              )}
            </div>
            {detalhe.recomendacoes?.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Recomendações</p>
                <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {detalhe.recomendacoes.map((rec, index) => (
                    <li key={`${detalhe.id}-rec-${index}`}>
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary focus-ring-strong"
                onClick={() => setDetalhe(null)}
              >
                Fechar
              </button>
              <button
                className="btn-primary focus-ring-strong"
                onClick={() => {
                  setDetalhe(null);
                  navigate(`/analise-capilar?analysisId=${detalhe.id}`);
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
