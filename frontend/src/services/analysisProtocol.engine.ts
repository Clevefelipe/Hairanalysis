import { AnalysisHistory } from "./history.service";

export type PremiumGoal = "alisar" | "reduzir_volume" | "tratar";
export type PremiumEligibility = "apto" | "restricoes" | "nao_apto";

export type PremiumProtocol = {
  eligibility: PremiumEligibility;
  riskScore: number;
  riskFactors: string[];
  combos: string[];
  timeline: {
    pre: string[];
    during: string[];
    post: string[];
  };
};

export function deriveProtocolFromHistory(
  history: AnalysisHistory[] | null | undefined,
  goal: PremiumGoal,
): PremiumProtocol {
  const safeHistory = Array.isArray(history) ? history : [];
  const recent = [...safeHistory]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);

  const avgScore =
    recent.length > 0
      ? Math.round(recent.reduce((acc, item) => acc + (item.score ?? 0), 0) / recent.length)
      : 65;
  const totalFlags = recent.reduce((acc, item) => acc + (item.flags?.length ?? 0), 0);
  const recentFlags = recent.flatMap((item) => item.flags || []).slice(0, 8);

  let riskScore = Math.max(0, 100 - avgScore) + Math.min(40, totalFlags * 4);
  const riskFactors: string[] = [];

  if (avgScore < 55) {
    riskFactors.push("Score técnico recente abaixo do ideal");
    riskScore += 20;
  } else if (avgScore < 70) {
    riskFactors.push("Score técnico intermediário");
    riskScore += 10;
  }

  if (totalFlags >= 6) {
    riskFactors.push("Alta incidência de flags em análises recentes");
  } else if (totalFlags >= 3) {
    riskFactors.push("Flags moderadas no histórico recente");
  }

  if (recentFlags.some((flag) => /quebra|fragil|sensibil|inflam|descama/i.test(flag))) {
    riskFactors.push("Sinais de fragilidade/inflamação identificados");
    riskScore += 10;
  }

  const eligibility: PremiumEligibility =
    riskScore >= 75 ? "nao_apto" : riskScore >= 45 ? "restricoes" : "apto";

  if (riskFactors.length === 0) {
    riskFactors.push("Sem fator crítico ativo no histórico recente");
  }

  const timeline =
    eligibility === "nao_apto"
      ? {
          pre: ["Checkup técnico de recuperação", "Teste de resistência e elasticidade por mecha"],
          during: ["Química bloqueada até recuperação da fibra"],
          post: ["Reconstrução progressiva (21-30 dias)", "Reavaliação técnica para nova elegibilidade"],
        }
      : eligibility === "restricoes"
        ? {
            pre: ["Teste de mecha em 2 áreas", "Adequar concentração e tempo por histórico"],
            during: ["Aplicação por quadrantes com pausas de segurança", "Controle térmico e monitoramento contínuo"],
            post: ["Reconstrução + nutrição em 7 dias", "Retorno técnico em 7-14 dias"],
          }
        : {
            pre: ["Teste rápido de compatibilidade", "Checklist de segurança e assinatura técnica"],
            during: ["Execução padrão premium com controle de tempo", "Monitoramento de resposta da fibra"],
            post: ["Home care de manutenção por 4 semanas", "Retorno de controle em 21-30 dias"],
          };

  const combos =
    eligibility === "nao_apto"
      ? [
          "Reconstrução de fibra + barreira cuticular",
          "Nutrição reparadora + pausa química monitorada",
        ]
      : goal === "alisar"
        ? [
            "Alisamento de baixa agressão + blindagem de fibra",
            "Alisamento + reposição proteica controlada",
          ]
        : goal === "reduzir_volume"
          ? [
              "Redução de volume + hidratação disciplinante",
              "Selagem térmica + nutrição lipídica",
            ]
          : [
              "Recuperação capilar progressiva sem química",
              "Tratamento de equilíbrio couro cabeludo + fibra",
            ];

  return { eligibility, riskScore, riskFactors, combos, timeline };
}

export function buildPremiumProtocolNote(protocol: PremiumProtocol, goal: PremiumGoal): string {
  const eligibilityLabel =
    protocol.eligibility === "apto"
      ? "APTO"
      : protocol.eligibility === "restricoes"
        ? "APTO COM RESTRIÇÕES"
        : "NÃO APTO";
  return [
    "[PROTOCOLO PREMIUM]",
    `Objetivo: ${goal}`,
    `Elegibilidade: ${eligibilityLabel}`,
    `Risco técnico: ${protocol.riskScore}`,
    `Fatores: ${protocol.riskFactors.join("; ")}`,
    `Pré: ${protocol.timeline.pre.join(" | ")}`,
    `Durante: ${protocol.timeline.during.join(" | ")}`,
    `Pós: ${protocol.timeline.post.join(" | ")}`,
    `Combos: ${protocol.combos.join(" | ")}`,
  ].join("\n");
}
