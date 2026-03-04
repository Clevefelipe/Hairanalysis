type Props = {
  recommendation: {
    name: string;
    score: number;
    warnings?: string[];
    reasons?: string[];
    missingCriteria?: boolean;
    explanation?: {
      reasons: string[];
    };
  };
};

export default function StraighteningRecommendationCard({
  recommendation,
}: Props) {
  const reasons = recommendation.explanation?.reasons || recommendation.reasons || [];
  const warnings = recommendation.warnings || [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">
        Alisamento Recomendado
      </h3>

      <p className="mt-2 text-slate-700">
        <strong>Procedimento:</strong> {recommendation.name}
      </p>

      <p className="mt-1 text-slate-700">
        <strong>Score técnico:</strong>{" "}
        {recommendation.score.toFixed(2)}
      </p>

      {reasons.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-600">
          {reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Recomendação baseada na análise técnica global do
          cabelo.
        </p>
      )}

      {(warnings.length > 0 || recommendation.missingCriteria) && (
        <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Alertas desta recomendação</p>
          <ul className="list-disc space-y-1 pl-5">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
            {recommendation.missingCriteria && (
              <li>Critérios técnicos incompletos neste alisamento; revise cadastro para melhor precisão.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
