import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldOff, Sparkles, FileDown, CalendarClock, Layers } from "lucide-react";
import api from "../services/api";
import Section from "@/components/ui/Section";

export default function PublicHistoryReport() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/history/public/${token}`);
        setData(res.data);
      } catch {
        setError("Link inválido ou expirado.");
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <section className="animate-page-in w-full">
        <Section className="text-sm text-slate-500 shadow-sm hover:shadow-md transition-shadow">Carregando relatório...</Section>
      </section>
    );
  }

  if (error || !data?.valid) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="page-hero">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-500">Acesso público</p>
            <h1 className="page-hero-title">Relatório indisponível</h1>
            <p className="page-hero-subtitle">{error || "Não foi possível validar este relatório."}</p>
          </div>
        </div>
        <Section className="border border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
          <ShieldOff size={18} />
          <span>Verifique o link compartilhado ou solicite um novo PDF autenticado.</span>
        </Section>
      </section>
    );
  }

  const report = data.report;
  const analysisTypeLabel = report.domain === "tricologia" ? "Tricológica" : "Capilar";
  const formattedDate = report.createdAt
    ? new Date(report.createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Data não informada";
  const clientName = report.clientName || report.client || "Cliente";

  return (
    <section className="space-y-4 md:space-y-6 animate-page-in w-full">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Relatório de Análise Capilar</h1>
          <p className="page-hero-subtitle">
            Observação estética assistida por IA.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/login" className="btn-secondary focus-ring-strong">
            Acessar sistema
          </Link>
          <button
            className="btn-primary focus-ring-strong inline-flex items-center gap-2"
            onClick={() => window.print()}
          >
            <FileDown size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <Section className="grid gap-4 md:grid-cols-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tipo</p>
          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
            {analysisTypeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-[var(--color-primary-light)]/40 p-2 text-[var(--color-primary)]">
            <CalendarClock size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Data</p>
            <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              {formattedDate}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cliente</p>
          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
            {clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-[var(--color-primary-light)]/40 p-2 text-[var(--color-primary)]">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Token</p>
            <p className="text-base font-semibold truncate" style={{ color: "var(--color-text)" }}>
              {token || "--"}
            </p>
          </div>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Section className="shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Resumo técnico</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Base</span>
          </div>
          <div className="rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
            <pre className="p-4 text-sm whitespace-pre-wrap overflow-auto">
              {JSON.stringify(report.baseResult, null, 2)}
            </pre>
          </div>
        </Section>

        <div className="space-y-4">
          {report.baseResult?.microscopy?.alerts?.length > 0 && (
            <Section className="border border-dashed border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  Microscópio em tempo real
                </h2>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Alertas</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                {report.baseResult.microscopy.alerts.map((alert: string) => (
                  <li key={alert} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {report.ragResult && (
            <Section className="border border-dashed border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resumo IA</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{report.ragResult}</p>
            </Section>
          )}
        </div>
      </div>

      <Section className="bg-slate-50 text-xs text-slate-500 flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
        <Sparkles size={14} className="text-[color:var(--color-success-500)]" />
        {data.disclaimer}
      </Section>
    </section>
  );
}
