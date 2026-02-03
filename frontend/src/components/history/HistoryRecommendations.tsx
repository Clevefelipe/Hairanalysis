interface Recommendation {
  title?: string;
  description: string;
}

interface Props {
  domain: "capilar" | "tricologia";
  recommendations: Recommendation[];
}

export default function HistoryRecommendations({
  domain,
  recommendations,
}: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-slate-600 text-sm">
        <p className="font-medium mb-1">
          Recomendações Inteligentes
        </p>
        <p>
          No momento, não há recomendações adicionais
          para este caso {domain}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Recomendações Inteligentes
      </h3>

      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
        >
          {rec.title && (
            <div className="font-medium text-slate-800 mb-1">
              {rec.title}
            </div>
          )}

          <p className="text-sm text-slate-600">
            {rec.description}
          </p>
        </div>
      ))}
    </div>
  );
}
