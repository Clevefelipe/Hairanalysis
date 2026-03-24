import { useParams } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { formatDateBr } from "@/utils/date";

import { listarVisionHistory } from "@/vision/VisionHistoryStorage";
import { VisionHistoryItem } from "@/vision/VisionHistory.types";

export default function RelatorioVisionCliente() {
  const { id } = useParams();
  const lista = listarVisionHistory();

  const item: VisionHistoryItem | undefined = lista.find(
    (i) => i.id === id
  );

  if (!item) {
    return (
      <div className="section-stack animate-page-in w-full">
        <Section>
          <Card title="Registro não encontrado">
            Não localizamos o registro visual solicitado.
          </Card>
        </Section>
      </div>
    );
  }

  const cuidadosRecomendados =
    item.findings.length === 0
      ? [
          "Manter rotina de cuidados indicada pelo profissional.",
          "Acompanhar a evolução em atendimentos futuros.",
        ]
      : [
          "Realizar tratamentos de cuidado e equilíbrio.",
          "Seguir as orientações personalizadas indicadas no atendimento.",
          "Evitar procedimentos sem avaliação prévia.",
        ];

  return (
    <div className="section-stack animate-page-in w-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          Relatório de Acompanhamento Capilar
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>Registro visual realizado durante seu atendimento</p>
      </div>

      <Section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <span>
            <strong>Data do atendimento:</strong> {formatDateBr(item.createdAt)}
          </span>
          <span className="rounded-full bg-[color:var(--color-success-50)] px-3 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">
            Relatório cliente
          </span>
        </div>

        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Imagem registrada</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            A imagem abaixo ajuda a acompanhar a evolução do cuidado com seus fios e couro cabeludo.
          </p>
          <img
            src={item.annotationBase64 || item.imageBase64}
            alt="Imagem do atendimento"
            className="mt-4 w-full rounded-2xl border"
            style={{ borderColor: "var(--color-border)" }}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>O que observamos</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            A análise visual permite acompanhar como estão os fios e o couro cabeludo no momento do atendimento,
            ajudando a definir os cuidados mais adequados.
          </p>
          {item.findings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--color-text)" }}>
              {item.findings.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Cuidados recomendados</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--color-text)" }}>
            {cuidadosRecomendados.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <Card title="Importante" variant="attention">
        Este relatório tem caráter informativo e de acompanhamento estético. As orientações são personalizadas
        para este atendimento e podem variar conforme a evolução ao longo do tempo.
        </Card>
      </Section>

      <div className="text-center">
        <Button
          variant="primary"
          onClick={() => window.print()}
          className="shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
        >
          Salvar ou Imprimir PDF
        </Button>
      </div>
    </div>
  );
}
