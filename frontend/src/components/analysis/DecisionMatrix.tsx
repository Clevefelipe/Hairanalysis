import React from "react";

export type DecisionMatrixProps = {
  recommendations?: any;
  flags?: string[] | null;
  breakRiskPercentual?: number | null;
};

type Status = "apto" | "restrito" | "bloqueado" | "avaliar";

type Card = {
  key: string;
  title: string;
  status: Status;
  reasons: string[];
};

function normalize(text: unknown) {
  return String(text ?? "").toLowerCase();
}

function toList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((i) => String(i)).filter(Boolean);
  if (input === undefined || input === null) return [];
  return String(input)
    .split(/[,;|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function computeStatus(
  name: string,
  recommended: string[],
  restricted: string[],
  blockedByAlert: boolean,
  blockedByRisk: boolean,
): Status {
  if (blockedByAlert || blockedByRisk) return "bloqueado";
  const isRestricted = restricted.some((item) => normalize(item).includes(normalize(name)) || normalize(name).includes(normalize(item)));
  const isRecommended = recommended.some((item) => normalize(item).includes(normalize(name)) || normalize(name).includes(normalize(item)));
  if (isRestricted && isRecommended) return "restrito";
  if (isRestricted) return "restrito";
  if (isRecommended) return "apto";
  return "avaliar";
}

function statusBadge(status: Status) {
  switch (status) {
    case "apto":
      return { label: "Apto", bg: "#ecfdf3", border: "#bbf7d0", text: "#166534" };
    case "restrito":
      return { label: "Restrito", bg: "#fff7ed", border: "#fcd34d", text: "#92400e" };
    case "bloqueado":
      return { label: "Bloqueado", bg: "#fee2e2", border: "#fecaca", text: "#7f1d1d" };
    default:
      return { label: "Avaliar", bg: "#f8fafc", border: "#e2e8f0", text: "#334155" };
  }
}

export default function DecisionMatrix({ recommendations, flags, breakRiskPercentual }: DecisionMatrixProps) {
  const recommendedDetailed = Array.isArray(recommendations?.recommendedStraighteningsDetailed)
    ? recommendations.recommendedStraighteningsDetailed
    : [];
  const recommended = recommendedDetailed.length
    ? recommendedDetailed.map((item: any) => String(item?.name || item?.nome || item?.serviceName || item?.label || "").trim()).filter(Boolean)
    : toList(recommendations?.recommendedStraightenings);

  const restricted = toList(recommendations?.restrictedProcedures);
  const professionalAlert = normalize(recommendations?.professionalAlert);
  const blockedByAlert = professionalAlert.includes("sem alisamento") || professionalAlert.includes("nao apto") || professionalAlert.includes("não apto");
  const blockedByRisk = typeof breakRiskPercentual === "number" && breakRiskPercentual > 70;
  const globalFlags = Array.isArray(flags) ? flags : [];

  const baseReasons = [] as string[];
  if (blockedByRisk) baseReasons.push("Risco de quebra > 70%");
  if (blockedByAlert) baseReasons.push("Alerta profissional bloqueia alisamento");

  const blockedKeywords: string[] = restricted.map((item) => normalize(item));
  const detailedWarnings: string[] = Array.isArray(recommendedDetailed)
    ? recommendedDetailed
        .flatMap((item: any) => (Array.isArray(item?.warnings) ? item.warnings : []))
        .filter((w: any) => typeof w === "string" && w.trim().length > 0)
        .map((w: any) => String(w).trim())
    : [];

  const cards: Card[] = [
    { key: "progressiva", title: "Progressiva", status: "avaliar", reasons: [...baseReasons] },
    { key: "selagem", title: "Selagem", status: "avaliar", reasons: [...baseReasons] },
    { key: "relaxamento", title: "Relaxamento", status: "avaliar", reasons: [...baseReasons] },
  ];

  cards.forEach((card) => {
    card.status = computeStatus(card.title, recommended, restricted, blockedByAlert, blockedByRisk);

    restricted
      .filter((item: string) => {
        const normalizedItem = normalize(item);
        return normalizedItem.includes(card.key) || card.key.includes(normalizedItem);
      })
      .forEach((item: string) => {
        const normalizedItem = normalize(item);
        const overlapWithBlocked = blockedKeywords.some((block: string) => normalizedItem.includes(block) || block.includes(normalizedItem));
        if (!overlapWithBlocked) {
          card.reasons.push(`Restrito: ${item}`);
        }
      });

    recommended
      .filter((item: string) => {
        const normalizedItem = normalize(item);
        return normalizedItem.includes(card.key) || card.key.includes(normalizedItem);
      })
      .forEach((item: string) => {
        card.reasons.push(`Compatível: ${item}`);
      });

    detailedWarnings
      .filter((w) => normalize(w).includes(card.key) || card.key.includes(normalize(w)))
      .forEach((w) => {
        card.reasons.push(`Atenção: ${w}`);
      });

    if (card.status === "avaliar" && recommended.length === 0 && restricted.length === 0 && !blockedByAlert && !blockedByRisk) {
      card.reasons.push("Sem dados suficientes. Avaliar presencialmente.");
    }

    card.reasons = Array.from(new Set(card.reasons));
  });

  return (
    <div className="panel" style={{ borderRadius: "1.25rem" }} data-testid="decision-matrix">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "var(--color-text-muted)" }}>
            Decisão de alisamento
          </p>
          <p className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            Matrix de compatibilidade
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Status por tipo de alisamento, com restrições e justificativas rápidas.
          </p>
        </div>
        {globalFlags.length > 0 && (
          <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }}>
            {globalFlags.slice(0, 3).join(" • ")}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const badge = statusBadge(card.status);
          return (
            <div key={card.key} className="rounded-2xl border p-4" style={{ borderColor: badge.border, backgroundColor: badge.bg }}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>
                    {card.title}
                  </p>
                  <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{badge.label}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ border: `1px solid ${badge.border}`, color: badge.text, backgroundColor: "white" }}>
                  {badge.label}
                </span>
              </div>
              {card.reasons.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
                  {card.reasons.slice(0, 4).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.text }} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
