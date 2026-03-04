export interface SicInput {
  porosidade: number;
  elasticidade: number;
  resistencia: number;
  historico_quimico: number;
  dano_termico: number;
  dano_mecanico: number;
  instabilidade_pos_quimica: number;
  quimicas_incompativeis: number;
}

export interface SicResult {
  score_final: number;
  classificacao:
    | 'Saudável'
    | 'Leve comprometimento'
    | 'Comprometimento moderado'
    | 'Alto risco'
    | 'Crítico';
  penalidade_aplicada: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const round2 = (value: number) => Math.round(value * 100) / 100;

export function calculateSic(input: SicInput): SicResult {
  const safe = (value: number) => clamp(Number(value) || 0, 0, 100);

  const porosidade = safe(input.porosidade);
  const elasticidade = safe(input.elasticidade);
  const resistencia = safe(input.resistencia);
  const historico = safe(input.historico_quimico);
  const danoTermico = safe(input.dano_termico);
  const danoMecanico = safe(input.dano_mecanico);
  const instabilidade = safe(input.instabilidade_pos_quimica);
  const quimicas = Number.isFinite(input.quimicas_incompativeis)
    ? Math.max(0, Math.round(input.quimicas_incompativeis))
    : 0;

  let sic =
    porosidade * 0.15 +
    elasticidade * 0.2 +
    resistencia * 0.2 +
    historico * 0.15 +
    danoTermico * 0.1 +
    danoMecanico * 0.1 +
    instabilidade * 0.1;

  const penalidade =
    elasticidade < 40 ||
    resistencia < 40 ||
    instabilidade <= 25 ||
    quimicas > 3;

  if (penalidade) {
    sic = sic * 0.85;
  }

  sic = clamp(round2(sic), 0, 100);

  const classificacao: SicResult['classificacao'] =
    sic >= 85
      ? 'Saudável'
      : sic >= 70
        ? 'Leve comprometimento'
        : sic >= 50
          ? 'Comprometimento moderado'
          : sic >= 30
            ? 'Alto risco'
            : 'Crítico';

  return {
    score_final: sic,
    classificacao,
    penalidade_aplicada: penalidade,
  };
}
