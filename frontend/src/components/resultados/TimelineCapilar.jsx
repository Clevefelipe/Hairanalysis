import React from "react";

export default function TimelineCapilar({ analysis }) {
  const estadoAtual =
    analysis?.summary ||
    "O fio apresenta condição compatível com os dados informados na análise.";

  const tratamento =
    analysis?.treatmentRecommendation ||
    "Recomenda-se protocolo de tratamento compatível com o estado atual do fio.";

  const resultadoEsperado =
    "Com a aplicação correta do tratamento indicado, espera-se melhora gradual da resistência, alinhamento e aspecto geral do fio.";

  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        Evolução Capilar (Visão Técnica)
      </h3>

      <div className="mt-6 flex flex-col gap-6">
        <TimelineItem label="Estado Atual" text={estadoAtual} active />
        <TimelineItem label="Tratamento Indicado" text={tratamento} />
        <TimelineItem label="Resultado Esperado" text={resultadoEsperado} muted />
      </div>
    </div>
  );
}

function TimelineItem({ label, text, active, muted }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={[
          "mt-1 h-2.5 w-2.5 rounded-full",
          active
            ? "bg-slate-900"
            : muted
              ? "bg-slate-300"
              : "bg-slate-500",
        ].join(" ")}
      />

      <div className="flex-1">
        <strong className="block text-sm font-semibold text-slate-900">
          {label}
        </strong>
        <p
          className={`mt-1 text-sm leading-relaxed ${
            muted ? "text-slate-500" : "text-slate-700"
          }`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
