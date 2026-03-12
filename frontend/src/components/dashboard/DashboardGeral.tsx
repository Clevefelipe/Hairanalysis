import ZeroBadge from "@/components/ui/ZeroBadge";
import "./dashboard-geral.css";

const cards = [
  { title: "Análises realizadas", description: "Volume total de análises" },
  { title: "Retornos vencidos", description: "Clientes que exigem acompanhamento" },
  { title: "Riscos ativos", description: "Histórico crítico detectado" },
  { title: "Status geral", description: "Base atual de análises" },
];

export default function DashboardGeral() {
  return (
    <div className="dashboard-geral">
      <header className="dashboard-header">
        <div>
          <p className="header-kicker">Painel auxiliar</p>
          <h1>Dashboard</h1>
          <p>Visão geral das análises e pontos de atenção</p>
        </div>
      </header>

      <section className="dashboard-cards">
        {cards.map((card) => (
          <div key={card.title} className="card">
            <div>
              <h3>{card.title}</h3>
              <ZeroBadge helper="Sem dados registrados" size="compact" />
            </div>
            <span>{card.description}</span>
          </div>
        ))}
      </section>

      <section className="dashboard-graficos">
        <div className="grafico-box">
          <ZeroBadge helper="Análises por período" size="compact" />
        </div>
        <div className="grafico-box">
          <ZeroBadge helper="Riscos ativos" size="compact" />
        </div>
        <div className="grafico-box">
          <ZeroBadge helper="Protocolos aplicados" size="compact" />
        </div>
        <div className="grafico-box">
          <ZeroBadge helper="Retornos previstos" size="compact" />
        </div>
      </section>
    </div>
  );
}
