import { render, screen } from "@testing-library/react";
import ProfessionalDecisionPanel from "./ProfessionalDecisionPanel";

describe("ProfessionalDecisionPanel", () => {
  const baseProps = {
    score: 80,
    flags: ["flag1"],
    recommendations: {},
    interpretation: "Teste",
  };

  it("exibe coeficiente, IPT, risco e base de tratamento, bloqueando alisamento quando risco > 70%", () => {
    render(
      <ProfessionalDecisionPanel
        {...baseProps}
        aesthetic={{
          absorptionCoefficient: { index: 42, label: "media" },
          cuticleDiagnostic: { ipt: 65, label: "alta" },
          breakRiskPercentual: 75,
          protocoloPersonalizado: { baseTratamento: { foco: "alta", descricao: "Recuperação" } },
        }}
      />,
    );

    expect(screen.getByText(/coef\. absorção/i)).not.toBeNull();
    expect(screen.getByText(/42 \(media\)/i)).not.toBeNull();
    expect(screen.getByText(/ipt \(cutícula\)/i)).not.toBeNull();
    expect(screen.getByText(/65 \(alta\)/i)).not.toBeNull();
    expect(screen.getByText(/risco de quebra/i)).not.toBeNull();
    expect(screen.getAllByText(/75%/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/base de tratamento/i)).not.toBeNull();
    expect(screen.getByText(/alta • Recuperação/i)).not.toBeNull();
    expect(screen.getByText(/Bloqueado por risco/i)).not.toBeNull();
  });

  it("permite alisamento quando risco <= 70%", () => {
    render(
      <ProfessionalDecisionPanel
        {...baseProps}
        aesthetic={{
          absorptionCoefficient: { index: 30, label: "baixa" },
          breakRiskPercentual: 40,
          protocoloPersonalizado: { baseTratamento: { foco: "media", descricao: "Equilíbrio" } },
        }}
      />,
    );

    expect(screen.queryByText(/Bloqueado por risco/i)).toBeNull();
    expect(screen.getAllByText(/40%/i).length).toBeGreaterThan(0);
  });
});
