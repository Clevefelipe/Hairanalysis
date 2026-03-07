type AnalysisKind = "capilar" | "tricologica";

type ChemicalProfileSummary = {
  acidicOrOrganic?: boolean;
  alkaline?: boolean;
  relaxation?: boolean;
  bleaching?: boolean;
  thermalFrequency?: "eventual" | "semanal" | "diaria";
} | null;

export type AnalysisAesthetic = {
  absorptionCoefficient?: { index: number; label: string };
  cuticleDiagnostic?: {
    ipt: number;
    label: string;
    toque?: number;
    brilho?: number;
    elasticidade?: number;
    historico?: number;
  };
  breakRiskPercentual?: number;
  protocoloPersonalizado?: { baseTratamento?: { foco: string; descricao: string } };
} | null;

type AnalysisResultDetailsProps = {
  kind: AnalysisKind;
  signals?: Record<string, any> | null;
  flags?: string[] | null;
  recommendations?: any;
  aesthetic?: AnalysisAesthetic;
  chemicalProfile?: ChemicalProfileSummary;
};

function flattenSignals(source: Record<string, any> | undefined | null): Record<string, any> {
  const out: Record<string, any> = {};
  if (!source || typeof source !== "object") return out;

  const walk = (obj: Record<string, any>, prefix = "") => {
    Object.entries(obj).forEach(([key, value]) => {
      const full = prefix ? `${prefix}.${key}` : key;
      out[full.toLowerCase()] = value;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        walk(value, full);
      }
    });
  };
  walk(source);
  return out;
}

function pickValue(flat: Record<string, any>, candidates: string[]) {
  for (const key of Object.keys(flat)) {
    if (Array.isArray(candidates) && candidates.some((candidate) => key.includes(candidate.toLowerCase()))) {
      const value = flat[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
  }
  return undefined;
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (value === undefined || value === null) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.includes(",")) return text.split(",").map((item) => item.trim()).filter(Boolean);
  return [text];
}

function display(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") return "--";
  const text = String(value).trim();
  const normalized = text.toLowerCase();
  if (
    normalized === "-" ||
    normalized === "--" ||
    normalized.includes("nao observ") ||
    normalized.includes("não observ") ||
    normalized.includes("avaliar presencialmente")
  ) {
    return "Avaliar presencialmente";
  }
  return text;
}

export default function AnalysisResultDetails({
  kind,
  signals,
  flags,
  recommendations,
  aesthetic,
  chemicalProfile,
}: AnalysisResultDetailsProps) {
  const flat = flattenSignals(signals);

  const hairType = pickValue(flat, ["tipo_fio", "tipofio", "hair_type", "tipo de fio"]);
  const curlType = pickValue(flat, ["curvatura", "curl", "tipo_curvatura"]);
  const volume = pickValue(flat, ["volume", "densidade"]);
  const porosity = pickValue(flat, ["porosidade", "porosity"]);
  const elasticity = pickValue(flat, ["elasticidade", "elasticity"]);
  const resistance = pickValue(flat, ["resistencia", "resistência", "strength"]);
  const damageTypes = toList(pickValue(flat, ["dano", "damage", "tipos_danos"]));
  const coloring = pickValue(flat, ["coloracao", "coloração", "descoloracao", "descoloração"]);
  const whiteHair = pickValue(flat, ["fios_brancos", "brancos", "gray"]);
  const chemicalTime = pickValue(flat, ["tempo_ultima_quimica", "ultima_quimica", "last_chemical"]);
  const cutNeedSignal = pickValue(flat, ["necessidade_corte", "need_cut", "corte"]);

  const oiliness = pickValue(flat, ["oleosidade", "oil"]);
  const scaling = pickValue(flat, ["descamacao", "descamação", "scaling", "flaking"]);
  const sensitivity = pickValue(flat, ["sensibilidade", "sensitive"]);
  const thinning = pickValue(flat, ["afinamento", "thinning"]);
  const shedding = pickValue(flat, ["queda", "shedding", "fall"]);

  const absorptionText = aesthetic?.absorptionCoefficient
    ? `${aesthetic.absorptionCoefficient.index} (${aesthetic.absorptionCoefficient.label})`
    : null;
  const cuticleText = aesthetic?.cuticleDiagnostic
    ? `${aesthetic.cuticleDiagnostic.ipt} (${aesthetic.cuticleDiagnostic.label})`
    : null;
  const breakRiskText =
    typeof aesthetic?.breakRiskPercentual === "number"
      ? `${aesthetic.breakRiskPercentual}%`
      : null;
  const baseTratamento = aesthetic?.protocoloPersonalizado?.baseTratamento;

  const flagText = (flags || []).join(" ").toLowerCase();
  const directCutRecommendation =
    recommendations?.haircutRecommendation ||
    recommendations?.cutRecommendation ||
    pickValue(flat, ["corte_recomendado", "cut_recommendation"]);

  const inferredCutNeed =
    typeof cutNeedSignal !== "undefined"
      ? cutNeedSignal
      : /quebra|pontas duplas|emborrachado|fragil|danificado/.test(flagText)
        ? "Sim"
        : "Avaliar no atendimento";

  const inferredCutType =
    directCutRecommendation ||
    (/pontas duplas|quebra/.test(flagText)
      ? "Corte de saneamento (pontas e áreas fragilizadas)"
      : "Corte técnico apenas se houver perda de forma/estrutura");
  const qualityRaw =
    (signals as any)?.analysis_quality?.criticalCompleteness ??
    pickValue(flat, ["analysis_quality.criticalcompleteness"]);
  const qualityPct = Number(qualityRaw);
  const hasLowQuality = Number.isFinite(qualityPct) && qualityPct < 60;

  const chemicalChips = (
    chemicalProfile
      ? [
          chemicalProfile.acidicOrOrganic ? "Ácido/Orgânico" : null,
          chemicalProfile.alkaline ? "Alcalino" : null,
          chemicalProfile.relaxation ? "Relaxamento" : null,
          chemicalProfile.bleaching ? "Descoloração" : null,
        ].filter(Boolean)
      : []
  ) as string[];
  const thermalFreqLabel = chemicalProfile?.thermalFrequency
    ? chemicalProfile.thermalFrequency === "diaria"
      ? "Ferramenta térmica: diária"
      : chemicalProfile.thermalFrequency === "semanal"
        ? "Ferramenta térmica: semanal"
        : "Ferramenta térmica: eventual"
    : null;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Resultado técnico</p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">Leitura estruturada</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Tipo de fio</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(hairType)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Curvatura</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(curlType)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Volume</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(volume)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Porosidade</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(porosity)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Elasticidade</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(elasticity)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Resistência</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(resistance)}</p>
        </div>
        {absorptionText && (
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Coef. absorção</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{absorptionText}</p>
          </div>
        )}
        {cuticleText && (
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">IPT (cutícula)</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{cuticleText}</p>
          </div>
        )}
        {breakRiskText && (
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Risco de quebra</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{breakRiskText}</p>
          </div>
        )}
      </div>

      {hasLowQuality && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">
            Leitura inconclusiva para parte dos campos ({qualityPct}% de completude crítica).
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Refaça a captura com foco, iluminação frontal difusa e distância entre 20 e 30 cm.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Tipo(s) de dano</p>
          {damageTypes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {damageTypes.map((damage) => (
                <span key={damage} className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  {damage}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-900">--</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Coloração/descoloração</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(coloring)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Fios brancos</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(whiteHair)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Tempo desde última química</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(chemicalTime)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Necessidade de corte</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(inferredCutNeed)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Corte recomendado</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{display(inferredCutType)}</p>
        </div>
        {chemicalChips.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Histórico químico</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chemicalChips.map((chip) => (
                <span key={chip} className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        )}
        {thermalFreqLabel && (
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Ferramenta térmica</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{thermalFreqLabel}</p>
          </div>
        )}
      </div>

      {kind === "tricologica" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Oleosidade</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{display(oiliness)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Descamação</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{display(scaling)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Sensibilidade</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{display(sensitivity)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Afinamento aparente</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{display(thinning)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Queda</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{display(shedding)}</p>
          </div>
        </div>
      )}

      {baseTratamento && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Base de tratamento</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{baseTratamento.foco.toUpperCase()} • {baseTratamento.descricao}</p>
        </div>
      )}
    </div>
  );
}
