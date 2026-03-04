import { formatTreatmentCombo, normalizePeriodText } from "@/utils/treatmentText";

type ProfessionalDecisionPanelProps = {
  score: number;
  flags?: string[] | null;
  recommendations?: any;
  interpretation?: string;
};

type ScheduleItem = {
  window: string;
  action: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function toList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  if (input === undefined || input === null) return [];

  const text = String(input).trim();
  if (!text) return [];

  return text
    .split(/[,;|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniq(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}


function toScalpTreatmentList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      const nome = typeof (item as any).nome === "string" ? (item as any).nome.trim() : "";
      const indicacao =
        typeof (item as any).indicacao === "string"
          ? (item as any).indicacao.trim()
          : "";
      const frequencia =
        typeof (item as any).frequencia === "string"
          ? (item as any).frequencia.trim()
          : "";
      return [nome, indicacao, frequencia].filter(Boolean).join(" | ");
    })
    .filter((item: string) => item.length > 0);
}

function toPositiveNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function buildSchedule(
  technicalReturnDays: number,
  maintenanceDays: number,
  treatments: string[],
  homeCare: string[],
): ScheduleItem[] {
  const reinforcementDay = Math.min(maintenanceDays - 7, technicalReturnDays + 14);
  const safeReinforcementDay = Math.max(reinforcementDay, technicalReturnDays + 7);

  const reinforcementTreatment =
    treatments[1] || treatments[0] || "Nutrição + Reconstrução";

  const homeCareHint = homeCare.length
    ? `Rotina semanal: ${homeCare.slice(0, 2).join(" + ")}.`
    : "Rotina semanal: limpeza suave + máscara conforme necessidade.";

  return [
    {
      window: "Dia 0",
      action: "Execução do protocolo principal e registro técnico inicial.",
    },
    {
      window: `Dia ${technicalReturnDays}`,
      action: "Retorno técnico curto para validar resposta do fio e ajustar conduta.",
    },
    {
      window: `Dia ${safeReinforcementDay}`,
      action: `Sessão de reforço: ${reinforcementTreatment}.`,
    },
    {
      window: normalizePeriodText(`Dia ${maintenanceDays}`),
      action: "Retorno oficial de manutenção e nova leitura de risco clínico-estético.",
    },
    {
      window: "Ciclo semanal",
      action: homeCareHint,
    },
  ];
}

export default function ProfessionalDecisionPanel({
  score,
  flags,
  recommendations,
  interpretation,
}: ProfessionalDecisionPanelProps) {
  const safeFlags = Array.isArray(flags) ? flags : [];
  const textPool = [normalizeText(interpretation), ...safeFlags.map(normalizeText)].join(" ");

  const hasAlert =
    typeof recommendations?.professionalAlert === "string" &&
    recommendations.professionalAlert.trim().length > 0;
  const hasScore = typeof score === "number" && Number.isFinite(score);

  const criticalRisk =
    score < 55 ||
    /quebra|fragil|emborrach|inflam|descam|queda acentuada|nao apto|não apto/.test(textPool);
  const moderateRisk =
    !criticalRisk &&
    (score < 70 || /sensibil|ressec|oleosidade|restric/.test(textPool));

  const riskLabel = !hasScore && !hasAlert && safeFlags.length === 0
    ? "Não informado"
    : criticalRisk
      ? "Alto"
      : moderateRisk
        ? "Moderado"
        : "Controlado";
  const riskBadge = !hasScore && !hasAlert && safeFlags.length === 0
    ? {
        text: "#334155",
        border: "#e2e8f0",
        glow: "transparent",
        bg: "#f8fafc",
      }
    : criticalRisk
      ? {
          text: "#7f1d1d",
          border: "#fecaca",
          glow: "transparent",
          bg: "#fee2e2",
        }
      : moderateRisk
        ? {
            text: "#92400e",
            border: "#fcd34d",
            glow: "transparent",
            bg: "#fef3c7",
          }
        : {
            text: "#166534",
            border: "#bbf7d0",
            glow: "transparent",
            bg: "#ecfdf3",
          };

  const treatments = uniq(toList(recommendations?.treatments));
  const homeCare = uniq(toList(recommendations?.homeCare));
  const restrictedProcedures = uniq(toList(recommendations?.restrictedProcedures));
  const scalpTreatments = uniq(toScalpTreatmentList(recommendations?.scalpTreatments));
  const restrictedTokens = restrictedProcedures.map((item) => item.toLowerCase());
  const professionalAlert =
    typeof recommendations?.professionalAlert === "string"
      ? recommendations.professionalAlert.toLowerCase()
      : "";
  const straighteningBlockedByAlert =
    professionalAlert.includes("sem alisamento") ||
    professionalAlert.includes("nao apto") ||
    professionalAlert.includes("não apto");
  const medicalReferral =
    recommendations?.medicalReferral && typeof recommendations.medicalReferral === "object"
      ? recommendations.medicalReferral
      : null;

  const straighteningDetailedNames = Array.isArray(
    recommendations?.recommendedStraighteningsDetailed,
  )
    ? recommendations.recommendedStraighteningsDetailed
        .map((item: any) =>
          String(
            item?.name || item?.nome || item?.serviceName || item?.label || "",
          ).trim(),
        )
        .filter(Boolean)
    : [];

  const straightening = (straighteningBlockedByAlert
    ? []
    : uniq(
        toList(
          straighteningDetailedNames.length
            ? straighteningDetailedNames
            : recommendations?.recommendedStraightenings,
        ),
      )).filter((item) => {
    const normalized = item.toLowerCase();
    return !restrictedTokens.some(
      (token) => token.includes(normalized) || normalized.includes(token),
    );
  });

  const topStraightening = straightening[0] || null;
  const secondaryStraightening = straightening[1] || null;
  const hasStraightening = straightening.length > 0;

  const straighteningStatus = (() => {
    if (straighteningBlockedByAlert || (!hasStraightening && restrictedProcedures.length > 0)) {
      return "Não apto para alisamento no momento";
    }
    if (hasStraightening && restrictedProcedures.length > 0) {
      return "Apto com restrições";
    }
    if (hasStraightening) {
      return "Apto";
    }
    return !hasScore && !hasAlert && safeFlags.length === 0
      ? "Em avaliação"
      : "Avaliar presencialmente";
  })();

  const comboBaseTreatment =
    treatments[0] || (criticalRisk ? "Nutrição" : moderateRisk ? "Hidratação" : "Nutrição");
  const comboRecoveryTreatment = treatments[1] || "Reconstrução";

  const hasThinningFlag = /afin|afinamento|fibra fina|massa/i.test(textPool);
  const rootOnlyMaintenance = hasStraightening && !straighteningBlockedByAlert && restrictedProcedures.length > 0;

  const comboPrincipal = hasStraightening && !straighteningBlockedByAlert
    ? `${topStraightening} + ${comboBaseTreatment}${hasThinningFlag ? " + Reconstrução" : ""}`
    : `${comboBaseTreatment} + ${comboRecoveryTreatment}`;

  const comboAlternativo =
    hasStraightening && !straighteningBlockedByAlert && secondaryStraightening
      ? `${secondaryStraightening} + ${comboRecoveryTreatment}`
      : `${comboRecoveryTreatment} + ${homeCare[0] || "Blindagem de cutícula"}`;

  const summaryPills = [
    { label: "Score", value: `${score}` },
    { label: "Risco", value: riskLabel },
    { label: "Tratamentos", value: `${treatments.length}` },
    { label: "Home care", value: `${homeCare.length}` },
    { label: "Restrições", value: `${restrictedProcedures.length}` },
  ];

  const treatmentCombos = (() => {
    const generated: string[] = [];

    if (treatments.length >= 2) {
      for (let i = 0; i < treatments.length - 1 && generated.length < 3; i += 1) {
        generated.push(`${treatments[i]} + ${treatments[i + 1]}`);
      }
    } else if (treatments.length === 1) {
      generated.push(`${treatments[0]} + ${comboRecoveryTreatment}`);
    }

    if (!generated.length) {
      if (criticalRisk) {
        generated.push("Nutrição + Reconstrução", "Reconstrução + Cauterização leve");
      } else if (moderateRisk) {
        generated.push("Hidratação + Nutrição", "Nutrição + Reconstrução");
      } else {
        generated.push("Nutrição + Selagem de cutícula", "Hidratação + Nutrição");
      }
    }

    return uniq(generated).slice(0, 3);
  })();

  const maintenanceDays =
    toPositiveNumber(recommendations?.maintenanceIntervalDays) ||
    (criticalRisk ? 30 : moderateRisk ? 45 : 60);

  const technicalReturnDays = criticalRisk ? 7 : moderateRisk ? 14 : 21;
  const healthReturnDays = maintenanceDays;

  const schedule = buildSchedule(
    technicalReturnDays,
    maintenanceDays,
    treatments,
    homeCare,
  );

  const hasCautiousStraightening = !straighteningBlockedByAlert && hasStraightening;

  return (
    <div className="panel relative overflow-hidden p-6" style={{ borderRadius: "1.25rem" }}>
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: "var(--color-text-muted)" }}>
            Conduta clínico-estética
          </p>
          <p className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            Plano executivo de resultado
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)", maxWidth: "58ch" }}>
            Equilibramos risco clínico-estético, protocolos técnicos e agenda inteligente em um painel único e acionável.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: straighteningBlockedByAlert ? "#dc2626" : hasStraightening ? "#16a34a" : "#f59e0b" }} />
            {straighteningStatus}
          </div>
        </div>

        <div
          className="relative inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            color: riskBadge.text,
            background: "transparent",
            border: `1px solid ${riskBadge.text}`,
            boxShadow: "none",
          }}
        >
          <span className="relative z-10">Risco {riskLabel}</span>
          <span className="relative z-10 h-2 w-2 rounded-full" style={{ backgroundColor: riskBadge.text }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {summaryPills.map((pill) => (
          <span
            key={pill.label}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              backgroundColor: "var(--bg-primary)",
            }}
          >
            <span style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {pill.label}
            </span>
            <span>{pill.value}</span>
          </span>
        ))}
      </div>

      <div className="relative mt-6 grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <div className="space-y-3">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>
                  Combo recomendado
                </p>
                <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{comboPrincipal}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Alternativo: {comboAlternativo}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Retornos</span>
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                  <span>{technicalReturnDays}d</span>
                  <span className="h-1 w-8 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                  <span>{maintenanceDays}d</span>
                </div>
              </div>
            </div>
            {(straighteningBlockedByAlert || !hasStraightening) && (
              <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Sem alisamento elegível no momento. Priorize recuperação antes de química.
              </p>
            )}
            {rootOnlyMaintenance && (
              <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Manutenção apenas na raiz, com retorno/ajuste em até 90 dias; comprimento permanece em tratamento e protegido.
              </p>
            )}
            {hasCautiousStraightening && (
              <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Permitido com cautela: hidratação/nutrição antes e após {topStraightening}.
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Tratamentos combinados</p>
              <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                {treatmentCombos.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                    <span>{formatTreatmentCombo(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Cronograma inteligente</p>
              <div className="mt-3 space-y-2">
                {schedule.map((item, idx) => (
                  <div key={`${item.window}-${item.action}`} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                        {item.window}
                      </span>
                      {idx < schedule.length - 1 && (
                        <span className="mt-1 h-8 w-px" style={{ backgroundColor: "var(--color-border)" }} />
                      )}
                    </div>
                    <p className="flex-1 text-sm" style={{ color: "var(--color-text)" }}>{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Retornos rápidos</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm" style={{ color: "var(--color-text)" }}>
              <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)" }}>Técnico</p>
                <p className="text-base font-semibold">{technicalReturnDays}d</p>
              </div>
              <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)" }}>Manutenção</p>
                <p className="text-base font-semibold">{maintenanceDays}d</p>
              </div>
              <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)" }}>Saúde</p>
                <p className="text-base font-semibold">{healthReturnDays}d</p>
              </div>
            </div>
          </div>

          {(homeCare.length > 0 || scalpTreatments.length > 0 || restrictedProcedures.length > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {homeCare.length > 0 && (
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                  <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Home care semanal</p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
                    {homeCare.slice(0, 5).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scalpTreatments.length > 0 && (
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                  <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Couro cabeludo</p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
                    {scalpTreatments.slice(0, 5).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {restrictedProcedures.length > 0 && (
                <div className="md:col-span-2 rounded-2xl border p-4" style={{ borderColor: "#fcd34d", backgroundColor: "#fff7ed", boxShadow: "var(--shadow-card)" }}>
                  <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "#92400e" }}>Restrições técnicas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {restrictedProcedures.slice(0, 6).map((item) => (
                      <span key={item} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#fcd34d", color: "#92400e", backgroundColor: "white" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {medicalReferral?.needed && (
            <div className="rounded-2xl border p-4" style={{ borderColor: "#fcd34d", backgroundColor: "#fff7ed", boxShadow: "var(--shadow-card)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#92400e" }}>
                Orientação médica
              </p>
              {typeof medicalReferral?.reason === "string" && medicalReferral.reason.trim() !== "" && (
                <p className="mt-2 text-sm font-semibold" style={{ color: "#92400e" }}>
                  {medicalReferral.reason}
                </p>
              )}
              <p className="mt-1 text-sm" style={{ color: "#92400e" }}>
                {typeof medicalReferral?.guidance === "string" && medicalReferral.guidance.trim() !== ""
                  ? medicalReferral.guidance
                  : "Avaliação estética. Em sinais de saúde comprometida, orientar avaliação com dermatologista/tricologista médico."}
              </p>
            </div>
          )}

          {!!safeFlags.length && (
            <div className="rounded-2xl border p-4" style={{ borderColor: "#fcd34d", backgroundColor: "#fff7ed", boxShadow: "var(--shadow-card)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#92400e" }}>Alertas críticos da sessão</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {safeFlags.slice(0, 10).map((item) => (
                  <span key={item} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: "#fcd34d", color: "#92400e", backgroundColor: "white" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
