import { useEffect, useMemo, useState } from "react";
import {
  listHistoryByClient,
  type AnalysisHistory,
} from "../../services/history.service";

interface Props {
  clientId: string;
}

function formatDate(date: string) {
  if (!date) return "Data não informada";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientHistory({ clientId }: Props) {
  const [items, setItems] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listHistoryByClient(clientId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  );

  if (loading)
    return (
      <p className="text-sm text-slate-500">Carregando histórico...</p>
    );
  if (!sortedItems.length)
    return (
      <p className="text-sm text-slate-500">Nenhum histórico encontrado.</p>
    );

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Histórico Clínico</h3>

      <ul className="mt-4 space-y-4">
        {sortedItems.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="font-semibold text-slate-900">
                {formatDate(item.createdAt)} —
                {item.analysisType === "tricologica"
                  ? " Análise Tricológica"
                  : " Análise Capilar"}
              </div>

              <span className="rounded-full bg-[color:var(--color-success-50)] px-2 py-0.5 text-xs font-medium text-[color:var(--color-success-700)]">
                Score {item.score?.toFixed(1) ?? "--"}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-700">
              Observações: {item.interpretation || "Sem observações registradas."}
            </p>

            {item.flags?.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-slate-500">Alertas:</span>
                {item.flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            ) : null}

            {item.aiExplanationText ? (
              <p className="mt-2 text-xs text-slate-500">
                Insight IA: {item.aiExplanationText}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
