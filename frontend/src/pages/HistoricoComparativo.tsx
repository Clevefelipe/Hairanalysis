import React, { useEffect, useState } from "react";
import { formatDateShortBr } from "@/utils/date";
import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";
import api from "@/services/api";

interface Analysis {
  id: string;
  analysisType: string;
  clientName: string;
  status: string;
  createdAt: string;
}

export default function HistoricoComparativo() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalyses() {
      try {
        const response = await api.get("/analysis");
        const data = Array.isArray(response.data) ? response.data : [];
        setAnalyses(data);
      } catch {
        setError("Não foi possível carregar o histórico clínico.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalyses();
  }, []);

  const metaValue = loading ? "--" : analyses.length;
  const statusLabel = loading ? "Carregando registros" : error ? "Erro ao carregar" : "Atualizado";

  return (
    <main className="section-stack animate-page-in w-full">
      <PageHero
        title="Histórico Comparativo"
        subtitle="Acompanhamento das análises clínicas realizadas"
        meta={[{ label: "Registros", value: metaValue }]}
      />

      <SectionToolbar className="justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Visão longitudinal</div>
        <p className="text-xs text-slate-500">{statusLabel}</p>
      </SectionToolbar>

      {loading && (
        <div className="panel-tight text-center text-sm text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }}
            />
            Carregando histórico clínico...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="panel-tight border border-rose-200 bg-rose-50 text-center text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        analyses.length === 0 ? (
          <div className="panel-tight text-center">
            <h3 className="text-lg font-semibold text-slate-900">Nenhuma análise registrada</h3>
            <p className="mt-2 text-sm text-slate-500">
              Assim que análises capilares ou tricológicas forem registradas, elas aparecerão aqui para comparação clínica.
            </p>
          </div>
        ) : (
          <div className="grid-dense md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis: Analysis) => (
              <article key={analysis.id} className="panel-tight transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{analysis.clientName}</h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{analysis.analysisType}</span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    Status: <span className="font-semibold text-slate-900">{analysis.status}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Data: {formatDateShortBr(analysis.createdAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      <div className="panel-tight bg-slate-50 text-center text-xs text-slate-500">
        O histórico comparativo não substitui avaliação dermatológica. Uso técnico-profissional.
      </div>
    </main>
  );
}
