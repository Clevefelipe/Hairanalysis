const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number) => Math.round(value * 10) / 10;

const normalizeLikert = (value?: number | null, fallback = 3) => {
  if (value === undefined || value === null || Number.isNaN(value)) return fallback;
  return clamp(Math.round(value), 1, 5);
};

const normalizeFromText = (text?: string | null, map?: Record<string, number>, fallback = 3) => {
  if (!text) return fallback;
  const normalized = text.trim().toLowerCase();
  if (!normalized) return fallback;
  if (map && map[normalized] !== undefined) {
    return map[normalized];
  }
  return fallback;
};

export interface AbsorptionInput {
  volumeMl?: number | null;
  weightGainMl?: number | null;
  timeSeconds?: number | null;
  dryingTimeSeconds?: number | null;
}

export interface AbsorptionMetrics {
  index: number;
  label: "baixa" | "media" | "alta";
}

export const computeAbsorptionMetrics = (
  input: AbsorptionInput,
): AbsorptionMetrics | null => {
  const volume = input.volumeMl ?? input.weightGainMl;
  const time = input.timeSeconds ?? input.dryingTimeSeconds;
  if (!volume || !time || volume <= 0 || time <= 0) {
    return null;
  }

  const rate = volume / time; // ml por segundo
  const index = clamp(Math.round(rate * 100), 0, 100);

  let label: AbsorptionMetrics["label"];
  if (index >= 65) label = "alta";
  else if (index <= 35) label = "baixa";
  else label = "media";

  return { index, label };
};

export interface IptInput {
  toquePoints?: number | null;
  toqueText?: string | null;
  brilhoPoints?: number | null;
  brilhoText?: string | null;
  elasticidadePoints?: number | null;
  elasticidadeText?: string | null;
  chemicalEvents?: number | null;
}

export interface IptMetrics {
  score: number;
  label: "baixa" | "media" | "alta";
  components: {
    toque: number;
    brilho: number;
    elasticidade: number;
    historico: number;
  };
}

export const computeIptMetrics = (input: IptInput): IptMetrics | null => {
  const toque = normalizeLikert(
    input.toquePoints ?? normalizeFromText(input.toqueText, {
      aspero: 5,
      "áspero": 5,
      rugoso: 4,
      escorregadio: 1,
      liso: 1,
      sedoso: 1,
    }),
  );

  const brilho = normalizeLikert(
    input.brilhoPoints ?? normalizeFromText(input.brilhoText, {
      opaco: 5,
      fosco: 5,
      brilhante: 1,
      refletivo: 1,
    }),
  );

  const elasticidade = normalizeLikert(
    input.elasticidadePoints ?? normalizeFromText(input.elasticidadeText, {
      "estica e quebra": 5,
      emborrachado: 5,
      "retorna à forma": 1,
      "retorna a forma": 1,
      resiliente: 2,
    }),
  );

  const chemicalEvents = Math.max(0, Math.round(input.chemicalEvents ?? 0));
  const historyScore = clamp(1 + chemicalEvents * 2, 1, 5);

  const score = round1((toque + brilho + elasticidade + historyScore) / 4);

  let label: IptMetrics["label"];
  if (score < 2) label = "baixa";
  else if (score <= 3.5) label = "media";
  else label = "alta";

  return {
    score,
    label,
    components: {
      toque,
      brilho,
      elasticidade,
      historico: historyScore,
    },
  };
};

export const computeBreakRiskPercent = (
  porosityPercent?: number | null,
  elasticityPercent?: number | null,
): number | null => {
  if (
    porosityPercent === undefined ||
    porosityPercent === null ||
    Number.isNaN(porosityPercent) ||
    elasticityPercent === undefined ||
    elasticityPercent === null ||
    Number.isNaN(elasticityPercent)
  ) {
    return null;
  }

  const porosityScore = clamp(porosityPercent, 0, 100);
  const elasticityScore = clamp(elasticityPercent, 0, 100);
  const risk = clamp(
    Math.round(porosityScore * 0.6 + (100 - elasticityScore) * 0.4),
    0,
    100,
  );
  return risk;
};

export interface TreatmentBaseSuggestion {
  label: "baixa" | "media" | "alta";
  description: string;
}

export const deriveTreatmentBase = (
  label: TreatmentBaseSuggestion["label"],
): TreatmentBaseSuggestion => {
  if (label === "baixa") {
    return {
      label,
      description:
        "Calor térmico assistido + ativos de baixo peso molecular (umidificação guiada).",
    };
  }

  if (label === "alta") {
    return {
      label,
      description:
        "Selamento de cutícula (acidificação) + reposição de massa/proteínas para estabilizar perdas.",
    };
  }

  return {
    label,
    description: "Hidratação e nutrição alternadas mantendo equilíbrio térmico e de pH.",
  };
};

export const porosityLabelFromPercent = (
  percent?: number | null,
): TreatmentBaseSuggestion["label"] | null => {
  if (percent === undefined || percent === null || Number.isNaN(percent)) return null;
  if (percent >= 65) return "alta";
  if (percent <= 35) return "baixa";
  return "media";
};
