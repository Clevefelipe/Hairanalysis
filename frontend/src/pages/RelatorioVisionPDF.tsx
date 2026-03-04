import { useParams } from "react-router-dom";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";

import { listarVisionHistory } from "@/vision/VisionHistoryStorage";
import { VisionHistoryItem } from "@/vision/VisionHistory.types";

export default function RelatorioVisionPDF() {
  const { id } = useParams();
  const lista = listarVisionHistory();

  const item: VisionHistoryItem | undefined = lista.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="section-stack animate-page-in w-full">
        <Section>
          <Card title="Registro visual não encontrado">
            Não localizamos o registro selecionado.
          </Card>
        </Section>
      </div>
    );
  }

  return (
    <div className="section-stack animate-page-in w-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          Relatório Técnico — Análise Visual
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>Resumo do registro capturado para uso interno</p>
      </div>

      <Section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <span>
            <strong>Data:</strong> {new Date(item.createdAt).toLocaleString()}
          </span>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
            Uso técnico
          </span>
        </div>

        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Imagem analisada</h2>
          <img
            src={item.annotationBase64 || item.imageBase64}
            alt="Registro visual"
            className="mt-4 w-full rounded-2xl border"
            style={{ borderColor: "var(--color-border)" }}
          />
        </div>

        {item.findings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Achados visuais automáticos</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--color-text)" }}>
              {item.findings.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section>
        <Card title="Observação importante" variant="attention">
          Este relatório é de uso técnico-estético interno. Não substitui avaliação profissional nem diagnóstico clínico.
        </Card>
      </Section>

      <div className="text-center">
        <Button
          variant="primary"
          onClick={() => window.print()}
          className="shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
        >
          Exportar / Imprimir PDF
        </Button>
      </div>
    </div>
  );
}
