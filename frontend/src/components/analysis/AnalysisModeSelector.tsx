type AnalysisModeSelectorProps<TMode extends string> = {
  options: Array<{
    value: TMode;
    title: string;
    description: string;
  }>;
  selected: TMode;
  onChange: (mode: TMode) => void;
};

export default function AnalysisModeSelector<TMode extends string>({
  options,
  selected,
  onChange,
}: AnalysisModeSelectorProps<TMode>) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Modo de captura</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={[
                "rounded-2xl border px-4 py-4 text-left transition",
                isActive
                  ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-800)] shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.28em]">{option.title}</p>
                <span
                  className={[
                    "mt-0.5 h-4 w-4 rounded-full border",
                    isActive
                      ? "border-[color:var(--color-success-500)] bg-[color:var(--color-success-200)]"
                      : "border-slate-300",
                  ].join(" ")}
                />
              </div>
              <p className="mt-2 text-sm opacity-85">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
