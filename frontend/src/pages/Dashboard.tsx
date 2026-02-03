import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import {
  historyService,
  DashboardResponse,
} from "../services/history.service";
import "../styles/system.css";

function isRecent(dateIso: string) {
  const date = new Date(dateIso).getTime();
  const diff = Date.now() - date;
  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
}

function domainBadge(domain: string) {
  return domain === "tricologica"
    ? "bg-indigo-100 text-indigo-800 border-indigo-200"
    : "bg-cyan-100 text-cyan-800 border-cyan-200";
}

function trendBadge(value: number) {
  if (value >= 70) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (value >= 40) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    historyService
      .getDashboard(user?.salonId)
      .then(setData)
      .catch(() =>
        setError(
          "Erro ao carregar dados do dashboard."
        )
      )
      .finally(() => setLoading(false));
  }, [user?.salonId]);

  if (loading) {
    return (
      <div className="text-slate-500">
        Carregando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        {error}
      </div>
    );
  }

  const total = data?.total ?? 0;
  const capilar = data?.capilar ?? 0;
  const tricologia = data?.tricologia ?? 0;
  const latest = data?.latest ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            Dashboard
          </h2>
          <p className="text-slate-600">
            Visão geral do salão
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de Análises"
          value={total}
          subtitle="Período atual"
        />
        <StatCard
          title="Capilar"
          value={capilar}
          subtitle="Análises capilares"
        />
        <StatCard
          title="Tricológica"
          value={tricologia}
          subtitle="Análises tricológicas"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">
          Últimas Análises
        </h3>

        {latest.length === 0 ? (
          <p className="text-slate-500">
            Nenhuma análise registrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {latest.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-medium">
                    {item.domain === "tricologica"
                      ? "TRICOLÓGICA"
                      : "CAPILAR"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">
                    Cliente: {item.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${domainBadge(
                        item.domain
                      )}`}
                    >
                      {item.domain === "tricologica"
                        ? "Tricológica"
                        : "Capilar"}
                    </span>
                    {isRecent(item.createdAt) && (
                      <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-200">
                        Recente
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded border ${trendBadge(70)}`}>
                    Concluída
                  </span>
                  <Link
                    to={`/historico/${item.id}`}
                    className="text-xs px-2 py-1 rounded bg-slate-900 text-white"
                  >
                    Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 border-t pt-4">
        Sistema de apoio técnico-estético.
        Não substitui avaliação profissional nem diagnóstico clínico.
      </div>
    </div>
  );
}
