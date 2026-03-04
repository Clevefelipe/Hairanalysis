import React from 'react';
import { useNavigate } from "react-router-dom";

interface TricologicaResult {
  score: number;
  scalp_type: string;
  sensitivity: string;
  density: string;
  hairLoss: string;
  inflammation: string;
  interpretation: string;
  date: string;
  recomendacoes?: Array<{ titulo: string; descricao: string; tempo?: string; compatibilidade?: number }>;
}

export default function AnaliseTricologicaRelatorio() {
  const navigate = useNavigate();

  const result: TricologicaResult = JSON.parse(
    sessionStorage.getItem("resultadoAnaliseTricologica") || JSON.stringify({
      score: 0,
      scalp_type: "Indeterminado",
      sensitivity: "Indeterminada",
      density: "Indeterminada",
      hairLoss: "Indeterminado",
      inflammation: "Não detectada",
      interpretation: "Análise em andamento",
      date: new Date().toLocaleDateString("pt-BR"),
      recomendacoes: []
    })
  );

  const selectedClient = JSON.parse(
    sessionStorage.getItem("selectedClient") || JSON.stringify({ nome: "Cliente" })
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 md:p-5">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho Premium */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Relatório de Análise Tricológica
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Avaliação técnica profissional do couro cabeludo</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("resultadoAnaliseTricologica");
              navigate("/analise-tricologica");
            }}
            className="btn-secondary"
          >
            ↺ Nova Análise
          </button>
        </div>

        {/* Cabeçalho com informações do cliente - Estilo Premium */}
        <div className="mb-4 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="pr-6 md:border-r" style={{ borderColor: "var(--color-border)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Cliente</p>
              <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{selectedClient?.nome || "Cliente"}</p>
            </div>
            <div className="pr-6 md:border-r" style={{ borderColor: "var(--color-border)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Data da análise</p>
              <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{result.date}</p>
            </div>
            <div className="pr-6 md:border-r" style={{ borderColor: "var(--color-border)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Tipo de análise</p>
              <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>Tricológica completa</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Status</p>
              <p className="text-base font-semibold" style={{ color: "var(--risk-low)" }}>Concluída</p>
            </div>
          </div>
        </div>

        {/* Score principal - Estilo Premium com cores do sistema */}
        <div className="mb-4 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Índice de Saúde Tricológica</p>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-5xl font-bold" style={{ color: "var(--color-text)" }}>{result.score}<span className="ml-2 text-2xl font-semibold" style={{ color: "var(--color-text-muted)" }}>/100</span></div>
              <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{result.interpretation}</p>
            </div>
            <div className="hidden md:block flex-1">
              <div className="flex items-center gap-3">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
                  <div
                    className="absolute inset-y-0 left-0 h-full rounded-full transition-all"
                    style={{ backgroundColor: "var(--color-primary)", boxShadow: "none", width: `${result.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Saúde Tricológica: {result.score}%</p>
            </div>
          </div>
        </div>

        {/* Análise Técnica Clínica Detalhada */}
        <div className="mb-5 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>🔬 Análise Clínica Detalhada</h2>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Tipo de Couro Cabeludo</p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-primary)" }}>{result.scalp_type}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Sensibilidade</p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{result.sensitivity}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Densidade Capilar</p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{result.density}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "#92400e" }}>Queda de Cabelos</p>
              <p className="text-lg font-semibold" style={{ color: "#92400e" }}>{result.hairLoss}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "#b91c1c" }}>Inflamação</p>
              <p className="text-lg font-semibold" style={{ color: "#b91c1c" }}>{result.inflammation}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Saúde Geral</p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Avaliada</p>
            </div>
          </div>
        </div>

        {/* Recomendações Clínicas */}
        <div className="mb-5 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>💊 Recomendações Clínicas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.recomendacoes?.map((rec, idx) => (
              <div key={idx} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="mb-3 flex items-start justify-between">
                  <h4 className="flex-1 pr-3 text-base font-semibold" style={{ color: "var(--color-text)" }}>{rec.titulo}</h4>
                  <span className="whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#bbf7d0", backgroundColor: "#dcfce7", color: "#166534" }}>
                    {rec.compatibilidade}% ✓
                  </span>
                </div>
                <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{rec.descricao}</p>
                {rec.tempo && (
                  <p className="flex items-center gap-2 border-t pt-3 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                    <span>⏱️</span> Frequência: <strong>{rec.tempo}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Protocolo de Tratamento */}
        <div className="mb-5 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            <span>📋</span> Protocolo de Tratamento Recomendado
          </h3>
          <div className="space-y-4">
            <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--bg-primary)" }}>
              <p className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>Fase 1: Limpeza e Detox</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Utilizar xampus específicos para remover resíduos, oleosidade excessiva e toxinas do couro cabeludo</p>
            </div>
            <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--bg-primary)" }}>
              <p className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>Fase 2: Restauração</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Aplicar máscaras terapêuticas e tratamentos específicos para restaurar a saúde do couro cabeludo</p>
            </div>
            <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--bg-primary)" }}>
              <p className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>Fase 3: Manutenção</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Manutenção contínua com produtos indicados para manter a saúde tricológica a longo prazo</p>
            </div>
          </div>
        </div>

        {/* Orientações Profissionais */}
        <div className="mb-5 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>👨‍⚕️ Orientações Profissionais</h3>
          <div className="space-y-4">
            <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--bg-primary)" }}>
              <h4 className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>🔬 Frequência de Consulta</h4>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Avaliação tricológica a cada 30 dias ou conforme recomendação profissional</p>
            </div>
            <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--bg-primary)" }}>
              <h4 className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>💇 Procedimentos Recomendados</h4>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Avaliação profissional para procedimentos específicos como máscaras capilares e esfoliação do couro cabeludo</p>
            </div>
            <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--bg-primary)" }}>
              <h4 className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>📊 Acompanhamento</h4>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Monitoramento contínuo da saúde tricológica com progressão de tratamentos conforme evolução</p>
            </div>
          </div>
        </div>

        {/* Contraindicações */}
        <div className="mb-5 rounded-xl border p-5" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb", boxShadow: "var(--shadow-card)" }}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold" style={{ color: "#92400e" }}>
            <span>⚠️</span> Contraindicações e Precauções
          </h3>
          <p className="text-sm font-semibold leading-relaxed" style={{ color: "#92400e" }}>Evitar produtos muito agressivos ou com alta concentração de químicos. Não aplicar alisamentos ou relaxadores enquanto não houver melhora na saúde tricológica. Sempre realizar teste de sensibilidade antes de novos procedimentos.</p>
        </div>

        {/* Rodapé */}
        <div className="mb-4 rounded-xl border p-4 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>✓ Análise Clínica Profissional Assistida por IA</p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Resultado para fins informativos e orientação profissional. Não substitui diagnóstico dermatológico formal.</p>
        </div>
      </div>
    </div>
  );
}
