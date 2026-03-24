type Status = "melhora" | "estavel" | "piora";

const badgeConfigs: Record<Status, { label: string; classes: string }> = {
  melhora: {
    label: "Evolução positiva",
    classes: "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]",
  },
  estavel: {
    label: "Condição mantida",
    classes: "bg-slate-100 text-slate-700",
  },
  piora: {
    label: "Atenção aumentada",
    classes: "bg-rose-50 text-rose-700",
  },
};

export default function VisualStatusBadge({ status }: { status: Status }) {
  const { label, classes } = badgeConfigs[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
