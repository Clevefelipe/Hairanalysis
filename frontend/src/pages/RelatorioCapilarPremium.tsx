import React from 'react';
import { useNavigate } from "react-router-dom";

interface CapilarResult {
  score: number;
  interpretation: string;
  date: string;
  tipoFio?: string;
  volumeCapilar?: string;
  estruturaFio?: string;
  nivelDano?: string;
  coloracao?: string;
  nivelDescoloracao?: string;
  ultimoQuimico?: string;
  tipoDano?: string;
  tempoEstimado?: string;
  condicaoGeral?: string;
  recomendacoes?: Array<{ titulo: string; descricao: string; tempo?: string; compatibilidade?: number }>;
}

export default function RelatorioCapilarPremium() {
  const navigate = useNavigate();

  const result: CapilarResult = JSON.parse(
    sessionStorage.getItem("resultadoAnaliseCapilar") || JSON.stringify({
      score: 0,
      interpretation: "Análise em andamento",
      date: new Date().toLocaleDateString("pt-BR"),
      tipoFio: "Indeterminado",
      volumeCapilar: "Indeterminado",
      estruturaFio: "Indeterminada",
      nivelDano: "Não detectado",
      coloracao: "Natural",
      nivelDescoloracao: "Nenhum",
      ultimoQuimico: "Não aplicado",
      tipoDano: "Nenhum",
      tempoEstimado: "30 dias",
      recomendacoes: []
    })
  );

  const selectedClient = JSON.parse(
    sessionStorage.getItem("selectedClient") || JSON.stringify({ nome: "Cliente" })
  );

  const indicators = [
    { label: "Tipo de fio", value: result.tipoFio },
    { label: "Volume capilar", value: result.volumeCapilar },
    { label: "Estrutura do fio", value: result.estruturaFio },
    { label: "Nível de dano", value: result.nivelDano },
    { label: "Coloração", value: result.coloracao },
    { label: "Nível de descoloração", value: result.nivelDescoloracao },
    { label: "Último químico", value: result.ultimoQuimico },
    { label: "Tipo de dano", value: result.tipoDano },
    { label: "Tempo estimado", value: result.tempoEstimado },
  ];

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="panel-tight">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Relatório</p>
            <h1 className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>Relatório de Análise Capilar</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Avaliação técnica organizada no padrão clean da plataforma.</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("resultadoAnaliseCapilar");
              navigate("/analise-capilar");
            }}
            className="btn-secondary"
          >
            Nova análise
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel-tight">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Paciente</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>{selectedClient?.nome || "Cliente"}</p>
        </div>
        <div className="panel-tight">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Data</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>{result.date}</p>
        </div>
        <div className="panel-tight">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Tipo</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>Capilar completa</p>
        </div>
        <div className="panel-tight border-[color:var(--color-success-100)] bg-[color:var(--color-success-50)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-success-600)]">Status</p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--color-success-700)]">Concluída</p>
        </div>
      </div>

      <div className="panel-tight">
        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Índice de saúde capilar</p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-4xl font-semibold" style={{ color: "var(--color-text)" }}>{result.score}</p>
          <p className="pb-1 text-base" style={{ color: "var(--color-text-muted)" }}>/100</p>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text)" }}>{result.interpretation}</p>
      </div>

      <div className="panel-tight">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Análise técnica detalhada</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {indicators.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border p-3"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
              <p className="mt-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>{item.value || "--"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-tight">
        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Tratamentos recomendados</h3>
        {result.recomendacoes?.length ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.recomendacoes.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{rec.titulo}</h4>
                  {typeof rec.compatibilidade === "number" && (
                    <span className="rounded-full border border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">
                      {rec.compatibilidade}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>{rec.descricao}</p>
                {rec.tempo && (
                  <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                    Tempo médio: {rec.tempo}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Sem recomendações registradas.</p>
        )}
      </div>

      <div
        className="rounded-3xl border p-3 text-sm shadow-sm"
        style={{ borderColor: "var(--color-warning-200)", backgroundColor: "var(--color-warning-50)", color: "var(--color-warning-800)" }}
      >
        Alerta de segurança: procedimentos químicos devem respeitar avaliação profissional para evitar risco de quebra capilar.
      </div>

      <div className="panel-tight text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
        Conteúdo assistido por IA. Não substitui avaliação profissional nem diagnóstico clínico.
      </div>
    </section>
  );
}
