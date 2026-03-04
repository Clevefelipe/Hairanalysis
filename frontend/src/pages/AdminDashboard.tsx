import { useEffect, useState } from "react";
import { Activity, Layers, Users } from "lucide-react";
import { obterDashboardAdmin } from "../services/dashboard.service";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState({
    totalClientes: 0,
    totalAnalises: 0,
    totalEvolucoes: 0,
  });

  useEffect(() => {
    async function carregar() {
      try {
        const response = await obterDashboardAdmin();
        setDados(response);
      } catch (err) {
        setError("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  if (loading) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="card-premium card-premium-interactive">Carregando dashboard...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="card-premium text-center" style={{ borderColor: "var(--color-error-200)", backgroundColor: "var(--color-error-50)", color: "var(--color-error-700)" }}>{error}</div>
      </section>
    );
  }

  const metricCards = [
    {
      label: "Clientes ativos",
      value: dados.totalClientes,
      description: "Usuários autorizados com histórico vivo.",
      icon: <Users className="text-[color:var(--color-success-500)]" size={20} />,
    },
    {
      label: "Análises registradas",
      value: dados.totalAnalises,
      description: "Fluxos capilar + tricologia com IA assistente.",
      icon: <Activity style={{ color: "var(--color-text-muted)" }} size={20} />,
    },
    {
      label: "Evoluções guiadas",
      value: dados.totalEvolucoes,
      description: "Comparativos e planos em execução.",
      icon: <Layers className="text-indigo-500" size={20} />,
    },
  ];

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="page-hero">
        <div>
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>Camada administrativa</p>
          <h1 className="page-hero-title">Dashboard global</h1>
          <p className="page-hero-subtitle">
            Monitoramento de clientes, análises e evoluções em tempo real para garantir governança.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary focus-ring-strong">Exportar dados</button>
          <button className="btn-primary focus-ring-strong">Sincronizar agora</button>
        </div>
      </div>

      <div className="grid-dense md:grid-cols-3">
        {metricCards.map((card) => (
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

      <div className="card-premium border border-dashed border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)]/35">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-success-600)]">IA Operacional</p>
        <h2 className="mt-3 text-xl font-semibold" style={{ color: "var(--color-text)" }}>Integração com dashboards técnicos</h2>
        <p className="mt-2 text-sm max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Este módulo consolida indicadores do HAS para administradores. Em breve, exibirá alertas
          de anomalia, saúde das integrações e status do processamento de PDFs premium.
        </p>
      </div>
    </section>
  );
}
