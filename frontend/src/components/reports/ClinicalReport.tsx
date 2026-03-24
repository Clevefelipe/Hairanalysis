import React from "react";

type ClinicalReportProps = {
  data?: {
    summary?: {
      totalAnalyses?: number;
      criticalCases?: number;
      period?: string;
    };
    timeline?: Array<{
      date: string;
      total: number;
    }>;
  } | null;
};

export default function ClinicalReport({ data }: ClinicalReportProps) {
  // 🔒 GUARDA DEFENSIVA ABSOLUTA
  if (!data || !data.summary) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
        Relatório clínico indisponível no momento.
      </div>
    );
  }

  const { summary, timeline = [] } = data;

  return (
    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Relatórios</p>
        <h2 className="text-2xl font-semibold text-slate-900">Relatório Clínico</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Período</p>
          <p className="text-xl font-semibold text-slate-900">{summary.period ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total de análises</p>
          <p className="text-xl font-semibold text-slate-900">{summary.totalAnalyses ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Casos críticos</p>
          <p className="text-xl font-semibold text-slate-900">{summary.criticalCases ?? 0}</p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Evolução Temporal</h3>
          <p className="text-xs text-slate-500">{timeline.length} registros</p>
        </div>

        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nenhum dado temporal disponível.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {timeline.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-3">{item.date}</td>
                    <td className="px-6 py-3 text-right font-semibold">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
