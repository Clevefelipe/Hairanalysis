export type Nivel = "baixo" | "moderado" | "elevado";

export interface AnaliseCapilarResumo {
  nivel?: Nivel;
  tipoFio?: string[];
  estadoFio?: string[];
  comportamentoFio?: string[];
}

export interface AlisamentoCriteria {
  hairTypes?: string[];
  fiberStructure?: string[];
  volume?: string[];
  damageLevel?: string[];
  observations?: string;
  indicadoPara?: string;
}

export interface AlisamentoOption {
  id: string;
  criteria?: AlisamentoCriteria;
  isActive?: boolean;
  active?: boolean;
}

export interface MatchResult {
  score: number;
  tags: string[];
  recomendado: boolean;
}

const WEIGHTS = {
  damage: 3,
  hairType: 2,
  fiber: 2,
  volume: 1,
};

const MAX_SCORE =
  WEIGHTS.damage +
  WEIGHTS.hairType +
  WEIGHTS.fiber +
  WEIGHTS.volume;

function normalizeDamage(level?: Nivel) {
  if (level === "baixo") return "Leve";
  if (level === "moderado") return "Moderado";
  if (level === "elevado") return "Severo";
  return null;
}

function safeArray(value: any): string[] {
  return Array.isArray(value) ? value : [];
}

export function computeAlisamentoMatch(
  option: AlisamentoOption,
  analysis?: AnaliseCapilarResumo
): MatchResult {
  const isServiceActive =
    typeof option?.isActive === "boolean"
      ? option.isActive
      : option?.active;

  if (!isServiceActive || !analysis) {
    return {
      score: 0,
      tags: ["Serviço inativo ou análise inexistente"],
      recomendado: false,
    };
  }

  const criteria = option.criteria || {};

  const tipoFio = safeArray(analysis.tipoFio);
  const estadoFio = safeArray(analysis.estadoFio);
  const comportamentoFio = safeArray(analysis.comportamentoFio);

  const hairTypes = safeArray(criteria.hairTypes);
  const fiberStructure = safeArray(criteria.fiberStructure);
  const volume = safeArray(criteria.volume);
  const damageLevel = safeArray(criteria.damageLevel);

  let rawScore = 0;
  const tags: string[] = [];

  const targetDamage = normalizeDamage(analysis.nivel);

  if (targetDamage && damageLevel.includes(targetDamage)) {
    rawScore += WEIGHTS.damage;
    tags.push(`Compatível com dano ${targetDamage}`);
  }

  if (hairTypes.some((t) => tipoFio.includes(t))) {
    rawScore += WEIGHTS.hairType;
    tags.push("Tipo de fio compatível");
  }

  if (fiberStructure.some((t) => estadoFio.includes(t))) {
    rawScore += WEIGHTS.fiber;
    tags.push("Estrutura do fio compatível");
  }

  if (volume.some((t) => comportamentoFio.includes(t))) {
    rawScore += WEIGHTS.volume;
    tags.push("Volume compatível");
  }

  if (estadoFio.some((s) => String(s).toLowerCase().includes("fragil"))) {
    tags.push("⚠ Fio fragilizado");
  }

  if (estadoFio.some((s) => String(s).toLowerCase().includes("ressec"))) {
    tags.push("⚠ Indicar hidratação prévia");
  }

  const score = Math.round((rawScore / MAX_SCORE) * 100);

  return {
    score,
    tags,
    recomendado: score >= 60,
  };
}
