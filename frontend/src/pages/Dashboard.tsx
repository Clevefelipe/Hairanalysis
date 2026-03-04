import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Microscope, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { historyService, DashboardResponse } from "../services/history.service";

function isRecent(dateIso: string) {
  const date = new Date(dateIso).getTime();
  const diff = Date.now() - date;
  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
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
      .catch(() => setError("Erro ao carregar dados do dashboard."))
      .finally(() => setLoading(false));
  }, [user?.salonId]);

  const cards = useMemo(() => {
    const total = data?.total ?? 0;
    const capilar = data?.capilar ?? 0;
    const tricologia = data?.tricologia ?? 0;
    return [
      {
        title: "Total de analises",
        value: total,
        subtitle: "Volume geral do salao",
        icon: <Activity size={16} />,
      },
      {
        title: "Analises capilares",
        value: capilar,
        subtitle: "Fluxo de haste/fibra",
        icon: <Microscope size={16} />,
      },
      {
        title: "Analises tricológicas",
        value: tricologia,
        subtitle: "Fluxo de couro cabeludo",
        icon: <Users size={16} />,
      },
    ];
  }, [data]);

  if (loading) return <div className="text-slate-500">Carregando dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const latest = data?.latest ?? [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Painel tecnico</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard do salao</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visao executiva de operacao, historico e acompanhamento.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/analises" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Ir para Analises <ArrowRight size={14} />
          </Link>
          <Link to="/clientes" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
            Abrir Clientes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{card.title}</p>
              <span className="text-slate-400">{card.icon}</span>
            </div>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Ultimas analises</h3>
        {latest.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhuma analise registrada ainda.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {latest.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.domain === "tricologica" ? "Tricologica" : "Capilar"}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isRecent(item.createdAt) && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      RECENTE
                    </span>
                  )}
                  <Link to={`/historico/${item.id}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                    Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
