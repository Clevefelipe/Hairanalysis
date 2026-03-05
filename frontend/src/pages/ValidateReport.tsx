import { useEffect, useState } from "react";
import axios from "axios";
import Section from "@/components/ui/Section";

export default function ValidateReport() {
  const [status, setStatus] = useState<"carregando" | "valid" | "invalid">("carregando");
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");

    if (!payload) {
      setStatus("invalid");
      return;
    }

    axios
      .get("/api/reports/validate", { params: { payload } })
      .then((res) => {
        if (res.data.valid) {
          setReportId(res.data.reportId);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, []);

  if (!reportId) return null;

  return (
    <section className="section-stack animate-page-in min-h-[70vh] flex items-center justify-center w-full">
      <Section className="w-full max-w-lg space-y-5">
        {status === "carregando" && (
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }}></div>
              <span>Validando relatório...</span>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Aguarde enquanto confirmamos a integridade do relatório.
            </p>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold" style={{ backgroundColor: "var(--color-error-100)", color: "var(--color-error-700)" }}>
              Relatório inválido
            </div>
            <p style={{ color: "var(--color-text)" }}>O link fornecido é inválido ou o documento foi adulterado.</p>
          </div>
        )}

        {status === "valid" && (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-success-100)] px-4 py-1 text-sm font-semibold text-[color:var(--color-success-700)]">
              Relatório autenticado
            </div>
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>Relatório Clínico Validado</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Este relatório é autêntico e permanece registrado em nossa base.
              </p>
            </div>
            <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--color-text)" }}>ID:</span> {reportId}
            </div>
          </div>
        )}
      </Section>
    </section>
  );
}
