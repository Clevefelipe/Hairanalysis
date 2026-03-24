import { useMemo } from "react";

export type ScalpForm = {
  tipoCouro?: "normal" | "oleoso" | "seco" | "sensivel";
  lesoes?: boolean;
  eritema?: boolean;
  descamacao?: "seca" | "oleosa" | "ausente";
  biofilmeOdor?: boolean;
};

export type FiberForm = {
  porosidade?: "baixa" | "media" | "alta";
  elasticidade?: "normal" | "baixa" | "borrachuda";
  espessura?: "fino" | "medio" | "grosso";
  danos?: string[];
  distribuicaoDano?: Array<"raiz" | "meio" | "pontas">;
};

export type ChemistryForm = {
  sistemaAtual?: "nenhum" | "hidroxido" | "tioglicolato" | "persulfato" | "coloracaoOx";
  diasDesdeUltimaQuimica?: number;
  incompatibilidade?: boolean;
  acaoAgressiva?: boolean;
  testMechaFeito?: boolean;
  testMechaResultado?: "ok" | "fraco" | "rompeu";
};

export type NeutralizacaoForm = {
  exigida?: boolean;
  produto?: string;
  tempoMinutos?: number;
  phAlvo?: string;
  justificativa?: string;
};

export type ChemicalProfileFormState = {
  scalp: ScalpForm;
  fiber: FiberForm;
  chemistry: ChemistryForm;
  neutralizacao: NeutralizacaoForm;
  evidencias: string[];
  followUp: {
    dataSugerida?: string;
    observacoes?: string;
  };
};

interface Props {
  value: ChemicalProfileFormState;
  onChange(next: ChemicalProfileFormState): void;
  disabled?: boolean;
}

export default function ChemicalProfileForm({ value, onChange, disabled }: Props) {
  const update = (path: string, newValue: unknown) => {
    const [section, key] = path.split(".");
    onChange({
      ...value,
      [section]: {
        ...(value as any)[section],
        [key]: newValue,
      },
    });
  };

  const aggressiveNeedsTest = useMemo(() => {
    return value.chemistry.acaoAgressiva && value.chemistry.testMechaFeito === false;
  }, [value.chemistry.acaoAgressiva, value.chemistry.testMechaFeito]);

  return (
    <div className="card-premium-soft space-y-4 border border-[color:var(--color-border)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>
            Perfil químico e risco
          </p>
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Anamnese
          </h3>
        </div>
        {aggressiveNeedsTest && (
          <span className="rounded-full bg-[color:var(--color-error-50)] px-3 py-1 text-xs font-medium text-[color:var(--color-error-600)]">
            Necessário teste de mecha
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface,white)]/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Couro
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Estado do couro e sinais visíveis
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <select
              className="clientes-input"
              value={value.scalp.tipoCouro || ""}
              onChange={(e) => update("scalp.tipoCouro", e.target.value as any)}
              disabled={disabled}
            >
              <option value="">Tipo de couro</option>
              <option value="normal">Normal</option>
              <option value="oleoso">Oleoso</option>
              <option value="seco">Seco</option>
              <option value="sensivel">Sensível</option>
            </select>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(value.scalp.lesoes)}
                  onChange={(e) => update("scalp.lesoes", e.target.checked)}
                  disabled={disabled}
                />
                Lesões / eritema / sensibilidade aparente
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(value.scalp.biofilmeOdor)}
                  onChange={(e) => update("scalp.biofilmeOdor", e.target.checked)}
                  disabled={disabled}
                />
                Biofilme / odor
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface,white)]/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Fio
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Porosidade, elasticidade e espessura
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="clientes-input"
                value={value.fiber.porosidade || ""}
                onChange={(e) => update("fiber.porosidade", e.target.value as any)}
                disabled={disabled}
              >
                <option value="">Porosidade</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
              <select
                className="clientes-input"
                value={value.fiber.elasticidade || ""}
                onChange={(e) => update("fiber.elasticidade", e.target.value as any)}
                disabled={disabled}
              >
                <option value="">Elasticidade</option>
                <option value="normal">Normal</option>
                <option value="baixa">Baixa</option>
                <option value="borrachuda">Borrachuda</option>
              </select>
            </div>
            <select
              className="clientes-input"
              value={value.fiber.espessura || ""}
              onChange={(e) => update("fiber.espessura", e.target.value as any)}
              disabled={disabled}
            >
              <option value="">Espessura</option>
              <option value="fino">Fino</option>
              <option value="medio">Médio</option>
              <option value="grosso">Grosso</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface,white)]/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Química
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Histórico recente e risco de incompatibilidade
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <select
              className="clientes-input"
              value={value.chemistry.sistemaAtual || ""}
              onChange={(e) => update("chemistry.sistemaAtual", e.target.value as any)}
              disabled={disabled}
            >
              <option value="">Sistema atual</option>
              <option value="nenhum">Nenhum</option>
              <option value="hidroxido">Hidróxido</option>
              <option value="tioglicolato">Tioglicolato</option>
              <option value="persulfato">Persulfato/Descoloração</option>
              <option value="coloracaoOx">Coloração oxidativa</option>
            </select>
            <div className="grid grid-cols-[1.1fr_0.9fr] gap-2">
              <input
                className="clientes-input"
                type="number"
                placeholder="Dias desde a última química"
                value={value.chemistry.diasDesdeUltimaQuimica ?? ""}
                onChange={(e) =>
                  update("chemistry.diasDesdeUltimaQuimica", e.target.value ? Number(e.target.value) : undefined)
                }
                disabled={disabled}
              />
              <label className="flex items-center gap-2 text-sm justify-self-start whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={Boolean(value.chemistry.incompatibilidade)}
                  onChange={(e) => update("chemistry.incompatibilidade", e.target.checked)}
                  disabled={disabled}
                />
                Incompatibilidade
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(value.chemistry.acaoAgressiva)}
                  onChange={(e) => update("chemistry.acaoAgressiva", e.target.checked)}
                  disabled={disabled}
                />
                Ação agressiva (alisamento/descoloração)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(value.chemistry.testMechaFeito)}
                  onChange={(e) => update("chemistry.testMechaFeito", e.target.checked)}
                  disabled={disabled}
                />
                Teste de mecha realizado
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface,white)]/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
                Neutralização
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Preencha apenas quando for exigida
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(value.neutralizacao.exigida)}
                onChange={(e) => update("neutralizacao.exigida", e.target.checked)}
                disabled={disabled}
              />
              Neutralização exigida
            </label>
            <input
              className="clientes-input"
              placeholder="Produto"
              value={value.neutralizacao.produto || ""}
              onChange={(e) => update("neutralizacao.produto", e.target.value)}
              disabled={disabled}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="clientes-input"
                placeholder="Tempo (min)"
                type="number"
                value={value.neutralizacao.tempoMinutos ?? ""}
                onChange={(e) => update("neutralizacao.tempoMinutos", e.target.value ? Number(e.target.value) : undefined)}
                disabled={disabled}
              />
              <input
                className="clientes-input"
                placeholder="pH alvo"
                value={value.neutralizacao.phAlvo || ""}
                onChange={(e) => update("neutralizacao.phAlvo", e.target.value)}
                disabled={disabled}
              />
            </div>
            <textarea
              className="clientes-input"
              placeholder="Justificativa"
              value={value.neutralizacao.justificativa || ""}
              onChange={(e) => update("neutralizacao.justificativa", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
