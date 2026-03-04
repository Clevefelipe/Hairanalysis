// frontend/src/pages/HistoricoClinico.tsx
import { useEffect, useState } from "react";
import { formatDateBr } from "@/utils/date";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";
import { getClinicalReports, ClinicalReport } from "@/services/clinicalReportService";

export default function HistoricoClinico() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getClinicalReports();
        if (mounted) {
          setReports(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch {
        if (mounted) {
          setReports([]);
          setError("Não foi possível carregar o histórico clínico.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="section-stack animate-page-in w-full">
      <PageHero
        title="Histórico Clínico"
        subtitle="Relatórios clínicos e avaliações de saúde capilar"
        meta={[{ label: "Registros", value: loading ? "--" : reports.length }]}
      />

      <SectionToolbar className="justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Painel técnico</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            {loading ? "Carregando" : error ? "Erro" : "Atualizado"}
          </span>
          Tema: <span className="font-semibold">{isDark ? "Dark" : "Light"}</span>
        </div>
      </SectionToolbar>

      {loading && (
        <div className="panel-tight text-center text-sm text-slate-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            Carregando relatórios...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="panel-tight border border-rose-200 bg-rose-50 text-center text-sm text-rose-700 shadow-sm hover:shadow-md transition-shadow">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="panel-tight text-center shadow-sm hover:shadow-md transition-shadow">
          <p className="text-base font-semibold text-slate-900">Nenhum relatório clínico encontrado.</p>
          <p className="mt-2 text-sm text-slate-500">Cadastre uma nova análise para visualizar aqui.</p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="grid-dense md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const hairScore = report.summary?.hairHealthScore ?? 0;
            const scalpScore = report.summary?.scalpHealthScore ?? null;
            const alerts = report.summary?.alerts ?? [];
            const alertCount = alerts.length;

            return (
              <article key={report.id} className="panel-tight transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{report.clientName}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDateBr(report.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--color-success-100)] px-3 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">
                    Saúde
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Saúde do fio</span>
                  <span className="text-lg font-semibold text-[color:var(--color-success-600)]">{hairScore}%</span>
                </div>

                {scalpScore !== null && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Couro cabeludo</span>
                    <span className="text-base font-semibold text-slate-900">{scalpScore}%</span>
                  </div>
                )}

                {alertCount > 0 && (
                  <div className="mt-4 text-xs text-amber-700">
                    <p className="font-semibold">Alertas técnicos ({alertCount})</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {alerts.slice(0, 3).map((alert) => (
                        <span key={`${report.id}-${alert}`} className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium">
                          {alert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
