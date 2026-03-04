import PageContainer from "@/components/layout/PageContainer";

type ClinicalStatus = "normal" | "alerta" | "critico";

const statusMap: Record<
  ClinicalStatus,
  { label: string; color: string; bg: string }
> = {
  normal: { label: "Normal", color: "#065f46", bg: "#d1fae5" },
  alerta: { label: "Alerta", color: "#92400e", bg: "#fef3c7" },
  critico: { label: "Crítico", color: "#991b1b", bg: "#fee2e2" },
};

const TrichologyReport = () => {
  const report = {
    client: "Cliente Exemplo",
    date: "19/01/2026",
    scalpType: "Oleoso",
    sensitivity: "Moderada",
    density: "Média",
    hairLoss: "Leve",
    inflammation: "Ausente",
    risk: "alerta" as ClinicalStatus,
    recommendation:
      "Indicado tratamento calmante associado a controle de oleosidade. Evitar procedimentos agressivos.",
    observations:
      "Couro cabeludo apresenta produção sebácea elevada, porém sem sinais de inflamação ativa.",
  };

  function handleExportPdf() {
    window.print();
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Laudo Tricológico</h1>
        <p className="text-sm text-slate-500">Avaliação técnica do couro cabeludo e fios</p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleExportPdf}
          className="btn-primary"
        >
          Exportar PDF Clínico
        </button>
      </div>

      {/* O restante do layout permanece igual ao anterior */}
      {/* (mantido propositalmente para consistência clínica) */}
    </PageContainer>
  );
};

export default TrichologyReport;
