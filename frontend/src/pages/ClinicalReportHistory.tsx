import { useEffect, useState } from "react";
import { getClinicalReports, ClinicalReport } from "@/services/clinicalReportService";
import { formatDateBr } from "@/utils/date";

export default function ClinicalReportHistoryPage() {
  const [reports, setReports] = useState<ClinicalReport[]>([]);

  useEffect(() => {
    getClinicalReports()
      .then(setReports);
  }, []);

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="page-hero">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Relatórios clínicos</p>
          <h1>Histórico de Relatórios Clínicos</h1>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Período</th>
            <th>Total análises</th>
            <th>Variação</th>
            <th>Arquivo</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id}>
              <td>{formatDateBr(r.createdAt)}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
