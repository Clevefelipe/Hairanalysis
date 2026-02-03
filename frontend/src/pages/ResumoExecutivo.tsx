import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import NivelBadge from "../components/ui/NivelBadge";
import { gerarResumoIntegrado } from "../engine/analiseIntegradaHeuristica";

export default function ResumoExecutivo() {
  const navigate = useNavigate();

  const resultadoCapilar = JSON.parse(
    sessionStorage.getItem("resultadoAnaliseCapilar") || "{}"
  );

  const resultadoTricologico = JSON.parse(
    sessionStorage.getItem("resultadoAnaliseTricologica") || "{}"
  );

  const resumoIntegrado = gerarResumoIntegrado({
    capilar: resultadoCapilar,
    tricologica: resultadoTricologico,
    uvFlags: resultadoTricologico?.uvFlags ?? [],
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 700 }}>Resumo Executivo</h1>

      <Card title="Nível técnico geral do atendimento">
        <div style={{ marginBottom: "12px" }}>
          <NivelBadge nivel={resumoIntegrado.nivelGeral} />
        </div>
        <p>{resumoIntegrado.recomendacoes[0]}</p>
      </Card>

      <Card title="Pontos de atenção">
        {resumoIntegrado.pontosAtencao.length === 0 ? (
          <p>Nenhum ponto crítico aparente no momento da análise.</p>
        ) : (
          <ul style={{ marginLeft: "18px", listStyle: "disc" }}>
            {resumoIntegrado.pontosAtencao.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recomendações estéticas">
        <ul style={{ marginLeft: "18px", listStyle: "disc" }}>
          {resumoIntegrado.recomendacoes.map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card title="Análise Capilar">
        <NivelBadge nivel={resultadoCapilar.nivel || "baixo"} />
        <p style={{ marginTop: "8px" }}>
          {resultadoCapilar.resumo || "Nenhuma análise capilar registrada."}
        </p>
      </Card>

      <Card title="Análise Tricológica">
        <NivelBadge nivel={resultadoTricologico.nivel || "baixo"} />
        <p style={{ marginTop: "8px" }}>
          {resultadoTricologico.resumo ||
            "Nenhuma análise tricológica registrada."}
        </p>
      </Card>

      <Card title="Observação importante" variant="attention">
        {resumoIntegrado.aviso}
      </Card>

      <div style={{ display: "flex", gap: "12px" }}>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Voltar ao Dashboard
        </Button>
        <Button variant="primary">Registrar decisão do atendimento</Button>
      </div>
    </div>
  );
}
