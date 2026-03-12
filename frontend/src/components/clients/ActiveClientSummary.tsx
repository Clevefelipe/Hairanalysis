import { SessionClient } from "@/context/ClientSessionContext";

export type ActiveClientSummaryProps = {
  client: SessionClient;
};

function formatPhone(value?: string | null) {
  const raw = (value || "").replace(/\D/g, "");
  if (!raw) return "—";

  // Se veio com DDI, preserva. Assume até 11 dígitos locais (DDD + número de 9 dígitos).
  let ddi = "";
  let local = raw;
  if (raw.length > 11) {
    ddi = raw.slice(0, raw.length - 11);
    local = raw.slice(-11);
  }

  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  if (!rest) return `${ddi ? `+${ddi} ` : ""}${ddd ? `(${ddd})` : ""}`.trim() || "—";
  if (rest.length <= 4) return `${ddi ? `+${ddi} ` : ""}(${ddd}) ${rest}`;
  const split = rest.length - 4;
  return `${ddi ? `+${ddi} ` : ""}(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

function formatCpf(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length !== 11) return "—";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatClientCode(value?: string | null) {
  const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  if (!clean) return "—";
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export default function ActiveClientSummary({ client }: ActiveClientSummaryProps) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Nome
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {client.nome}
          </p>
        </div>
        <div className="space-y-1.5">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cód
          </p>
          <p className="text-xs" style={{ color: "var(--color-text)" }}>
            #{formatClientCode(client.id)}
          </p>
        </div>
        <div className="space-y-1.5">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Tel
          </p>
          <p className="text-xs" style={{ color: "var(--color-text)" }}>{formatPhone(client.telefone)}</p>
        </div>
      </div>
    </div>
  );
}
