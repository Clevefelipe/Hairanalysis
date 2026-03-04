import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NivelBadge from "@/components/ui/NivelBadge";

export default function ResultadoAnaliseTricologica() {
  const navigate = useNavigate();

  const resultado = JSON.parse(
    sessionStorage.getItem("resultadoAnaliseTricologica") || "{}"
  );

  return (
    <div className="space-y-8 p-6 animate-page-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Resultado da Análise Tricológica
        </h1>
        <p className="text-slate-600">Panorama técnico do couro cabeludo com suporte da IA</p>
      </div>

      <Card title="Resumo técnico estético">
        <div className="mb-3">
          <NivelBadge nivel={resultado.nivel} />
        </div>

        <p className="text-sm text-slate-700">{resultado.resumo}</p>

        <p className="mt-3 text-sm text-slate-500">
          Pontuação técnica: <strong>{resultado.score}</strong>
        </p>
      </Card>

      <Card title="Indicadores técnicos" variant="attention">
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(resultado.flags || []).map((f: string) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Card>

      <Card title="Recomendações estéticas assistivas">
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(resultado.recomendacoes || []).map((r: string) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <Card title="Aviso importante" variant="attention">
        <p className="text-sm text-slate-600">
          Conteúdo gerado para apoio técnico-estético. O sistema não realiza diagnósticos clínicos.
        </p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="secondary"
          onClick={() => navigate("/analise-tricologica")}
          className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto"
        >
          Voltar à Análise
        </Button>
        <Button className="w-full sm:w-auto">
          Salvar no Histórico
        </Button>
      </div>
    </div>
  );
}
