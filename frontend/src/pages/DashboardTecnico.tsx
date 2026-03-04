import { useEffect, useState } from "react";
import { Activity, ClipboardList, Users } from "lucide-react";
import { fetchProfessionalDashboard } from "../api/dashboard.api";

interface ProfessionalDashboardData {
  myAnalyses: number;
  clientsToday: number;
  pendingReports: number;
}

export default function DashboardTecnico() {
  const [data, setData] = useState<ProfessionalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfessionalDashboard()
      .then(setData)
      .catch(() => setError("Não foi possível carregar o dashboard técnico."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="card-premium card-premium-interactive">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando dashboard...</p>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-6 animate-pulse rounded-full" style={{ backgroundColor: "var(--bg-primary)" }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="card-premium border-rose-200 bg-rose-50/80 text-rose-700">
          {error || "Sem dados disponíveis."}
        </div>
      </section>
    );
  }

  const cards = [
    {
      label: "Minhas análises",
      value: data.myAnalyses,
      description: "Sessões concluidas com IA assistente.",
      icon: <Activity className="text-[color:var(--color-success-600)]" size={18} />,
    },
    {
      label: "Clientes hoje",
      value: data.clientsToday,
      description: "Agendamentos confirmados para este turno.",
      icon: <Users className="text-indigo-500" size={18} />,
    },
    {
      label: "Relatórios pendentes",
      value: data.pendingReports,
      description: "PDFs e análises aguardando assinatura.",
      icon: <ClipboardList className="text-amber-500" size={18} />,
    },
  ];

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="page-hero">
        <div>
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>Operação diária</p>
          <h1 className="page-hero-title">Dashboard do profissional</h1>
          <p className="page-hero-subtitle">
            Acompanhe suas análises, agenda e entregas pendentes com o mesmo nível premium do HAS.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary focus-ring-strong">Ver agenda</button>
          <button className="btn-primary focus-ring-strong">Nova análise</button>
        </div>
      </div>

      <div className="grid-dense md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card-premium-soft card-premium-interactive">
            <div className="flex items-center gap-3">
              {card.icon}
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
                <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>{card.value}</p>
              </div>
            </div>
            <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>{card.description}</p>
          </div>
        ))}
      </div>

      <div className="card-premium border border-dashed border-slate-200">
        <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>Fluxo assistido</p>
        <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>Integração com histórico e relatórios</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Em breve, você verá alertas inteligentes sobre necessidade de revisão, tempo médio por análise
          e indicadores de satisfação do cliente diretamente aqui.
        </p>
      </div>
    </section>
  );
}
