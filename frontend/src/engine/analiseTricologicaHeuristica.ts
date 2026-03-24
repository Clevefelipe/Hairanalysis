export interface AnaliseTricologicaInput {
  oleosidade: string[];
  condicoes: string[];
  sensacoes: string[];
  observacoes?: string;
}

export type NivelTricologico = "baixo" | "moderado" | "elevado";

export interface AnaliseTricologicaOutput {
  score: number;
  nivel: NivelTricologico;
  flags: string[];
  recomendacoes: string[];
  resumo: string;
}

const PESOS: Record<string, number> = {
  "Oleosidade elevada": 2,
  "Oleosidade baixa": 1,
  "Descamação visível": 3,
  "Sensibilidade relatada": 3,
  "Vermelhidão": 2,
  "Queda percebida": 2,
};

function classificarNivel(score: number): NivelTricologico {
  if (score >= 6) return "elevado";
  if (score >= 3) return "moderado";
  return "baixo";
}

export function avaliarAnaliseTricologica(
  input: AnaliseTricologicaInput
): AnaliseTricologicaOutput {
  const oleosidade = Array.isArray(input?.oleosidade) ? input.oleosidade : [];
  const condicoes = Array.isArray(input?.condicoes) ? input.condicoes : [];
  const sensacoes = Array.isArray(input?.sensacoes) ? input.sensacoes : [];

  let score = 0;
  const flags: string[] = [];
  const recomendacoes: string[] = [];

  [...oleosidade, ...condicoes, ...sensacoes].forEach(
    (item) => {
      const peso = PESOS[item] || 0;
      if (peso > 0) {
        score += peso;
        flags.push(item);
      }
    }
  );

  const nivel = classificarNivel(score);

  if (nivel === "baixo") {
    recomendacoes.push(
      "Couro cabeludo em equilíbrio estético no momento da análise.",
      "Procedimentos podem ser realizados respeitando avaliação técnica."
    );
  }

  if (nivel === "moderado") {
    recomendacoes.push(
      "Indicar tratamento de equilíbrio do couro cabeludo.",
      "Avaliar preparo do couro cabeludo antes de procedimentos químicos."
    );
  }

  if (nivel === "elevado") {
    recomendacoes.push(
      "Evitar procedimentos químicos no atendimento atual.",
      "Priorizar tratamento de recuperação do couro cabeludo.",
      "Orientar avaliação médica dermatológica caso os sinais persistam."
    );
  }

  const resumo =
    nivel === "baixo"
      ? "Couro cabeludo em condições estéticas favoráveis."
      : nivel === "moderado"
      ? "Couro cabeludo apresenta desequilíbrios que exigem atenção."
      : "Couro cabeludo com sinais elevados de desequilíbrio estético.";

  return {
    score,
    nivel,
    flags: Array.from(new Set(flags)),
    recomendacoes,
    resumo,
  };
}
