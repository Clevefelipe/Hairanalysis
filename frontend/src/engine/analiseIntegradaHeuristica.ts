import type { AnaliseCapilarOutput } from "./analiseCapilarHeuristica";
import type { AnaliseTricologicaOutput } from "./analiseTricologicaHeuristica";

export interface AnaliseIntegradaInput {
  capilar?: AnaliseCapilarOutput;
  tricologica?: AnaliseTricologicaOutput;
  uvFlags?: string[];
}

export interface AnaliseIntegradaOutput {
  nivelGeral: "baixo" | "moderado" | "elevado";
  pontosAtencao: string[];
  recomendacoes: string[];
  aviso: string;
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function gerarResumoIntegrado(
  input: AnaliseIntegradaInput
): AnaliseIntegradaOutput {
  const capilar = input.capilar;
  const tricologica = input.tricologica;

  const nivelGeral =
    capilar?.nivel === "elevado" || tricologica?.nivel === "elevado"
      ? "elevado"
      : capilar?.nivel === "moderado" || tricologica?.nivel === "moderado"
      ? "moderado"
      : "baixo";

  const pontosAtencao = dedupe([
    ...(capilar?.flags ?? []),
    ...(tricologica?.flags ?? []),
    ...(input.uvFlags ?? []),
  ]);

  const recomendacoes = dedupe([
    ...(capilar?.recomendacoes ?? []),
    ...(tricologica?.recomendacoes ?? []),
    nivelGeral === "elevado"
      ? "Priorizar recuperação estética antes de procedimentos químicos."
      : nivelGeral === "moderado"
      ? "Planejar preparo técnico com hidratação e equilíbrio do couro cabeludo."
      : "Manter rotina de manutenção estética e monitoramento periódico.",
  ]);

  return {
    nivelGeral,
    pontosAtencao,
    recomendacoes,
    aviso:
      "Observação estética assistida por IA. A decisão final é sempre do profissional.",
  };
}
