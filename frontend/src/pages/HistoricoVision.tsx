import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Section from "@/components/ui/Section";
import { useNavigate } from "react-router-dom";
import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";

import { listarVisionHistory, limparVisionHistory } from "../vision/VisionHistoryStorage";

export default function HistoricoVision() {
  const navigate = useNavigate();
  const lista = listarVisionHistory();

  return (
    <main className="section-stack animate-page-in w-full">
      <PageHero
        title="Histórico Visual"
        subtitle="Registros de análises visuais e capturas de imagem"
        meta={[{ label: "Registros", value: lista.length }]}
      />

      <SectionToolbar className="justify-between">
        <div className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Vision IA</div>
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span className="rounded-full px-3 py-1 font-medium" style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
            {lista.length ? "Atualizado" : "Sem registros"}
          </span>
          {lista.length ? `${lista.length} registros locais` : "Sem capturas salvas"}
        </div>
      </SectionToolbar>

      {lista.length === 0 ? (
        <Section className="border border-dashed text-center shadow-sm hover:shadow-md" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>Nenhum registro visual salvo.</p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Capture novas imagens para acompanhar a evolução.</p>
        </Section>
      ) : (
        <div className="grid-dense lg:grid-cols-2">
          {lista.map((item) => (
            <Card
              key={item.id}
              title={new Date(item.createdAt).toLocaleString()}
            >
              <img
                src={item.annotationBase64 || item.imageBase64}
                alt="Registro visual"
                className="w-full rounded-xl"
              />

              {item.findings.length > 0 && (
                <div className="mt-4">
                  <strong className="text-sm" style={{ color: "var(--color-text)" }}>Observações:</strong>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--color-text)" }}>
                    {item.findings.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/relatorio-vision/${item.id}`)}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  PDF Técnico
                </Button>

                <Button
                  variant="primary"
                  onClick={() => navigate(`/relatorio-vision-cliente/${item.id}`)}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  PDF Cliente
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {lista.length > 0 && (
        <Section className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Precisa liberar espaço? Limpe o histórico local.</p>
          <Button
            variant="secondary"
            onClick={() => {
              if (window.confirm("Deseja limpar todo o histórico visual?")) {
                limparVisionHistory();
                window.location.reload();
              }
            }}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            Limpar Histórico Visual
          </Button>
        </Section>
      )}
    </main>
  );
}
