import type { ReactNode } from "react";

type ClientLite = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
};

type AnalysisClientContextCardProps = {
  selectedClient: ClientLite | null;
  observations: string;
  onObservationsChange: (value: string) => void;
  onSelectClient: () => void;
  placeholder: string;
  extra?: ReactNode;
};

export default function AnalysisClientContextCard({
  selectedClient,
  observations,
  onObservationsChange,
  onSelectClient,
  placeholder,
  extra,
}: AnalysisClientContextCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Cliente e contexto tecnico
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          Etapa obrigatoria
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cliente atual</p>
            <p className="text-lg font-semibold text-slate-900">
              {selectedClient?.nome ?? "Nenhuma cliente selecionada"}
            </p>
            {selectedClient?.telefone ? (
              <p className="text-sm text-slate-500">{selectedClient.telefone}</p>
            ) : null}
          </div>

          {!selectedClient && (
            <button
              onClick={onSelectClient}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Selecionar cliente
            </button>
          )}
        </div>

        <textarea
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
          rows={4}
          placeholder={placeholder}
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
        />

        {extra ? <div className="mt-4">{extra}</div> : null}
      </div>
    </div>
  );
}
