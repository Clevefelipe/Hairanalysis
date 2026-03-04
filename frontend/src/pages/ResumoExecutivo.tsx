import { useNavigate } from "react-router-dom";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NivelBadge from "@/components/ui/NivelBadge";
import { gerarResumoIntegrado } from "@/engine/analiseIntegradaHeuristica";

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
    <div className="space-y-8 p-6 animate-page-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Resumo Executivo</h1>
        <p className="text-slate-600">Síntese integrada entre análises capilar e tricológica</p>
      </div>

      <Card title="Nível técnico geral do atendimento">
        <div className="mb-3">
          <NivelBadge nivel={resumoIntegrado.nivelGeral} />
        </div>
        <p className="text-sm text-slate-600">
          {resumoIntegrado.recomendacoes?.[0] || "Análise não disponível"}
        </p>
      </Card>

      <Card title="Pontos de atenção">
        {resumoIntegrado.pontosAtencao.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum ponto crítico aparente no momento da análise.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {resumoIntegrado.pontosAtencao.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recomendações estéticas">
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {resumoIntegrado.recomendacoes.map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card title="Análise Capilar">
        <NivelBadge nivel={resultadoCapilar.nivel || "baixo"} />
        <p className="mt-2 text-sm text-slate-600">
          {resultadoCapilar.resumo || "Nenhuma análise capilar registrada."}
        </p>
      </Card>

      <Card title="Análise Tricológica">
        <NivelBadge nivel={resultadoTricologico.nivel || "baixo"} />
        <p className="mt-2 text-sm text-slate-600">
          {resultadoTricologico.resumo || "Nenhuma análise tricológica registrada."}
        </p>
      </Card>

      <Card title="Observação importante" variant="attention">
        <p className="text-sm text-slate-600">{resumoIntegrado.aviso}</p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard")}
          className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto"
        >
          Voltar ao Dashboard
        </Button>
        <Button className="w-full sm:w-auto">
          Registrar decisão do atendimento
        </Button>
      </div>
    </div>
  );
}
