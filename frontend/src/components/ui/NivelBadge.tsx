type Nivel = "baixo" | "moderado" | "elevado";

interface NivelBadgeProps {
  nivel: Nivel;
}

const estilos: Record<Nivel, { label: string; classes: string }> = {
  baixo: {
    label: "Condição favorável",
    classes: "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]",
  },
  moderado: {
    label: "Atenção técnica",
    classes: "bg-amber-50 text-amber-700",
  },
  elevado: {
    label: "Atenção elevada",
    classes: "bg-rose-50 text-rose-700",
  },
};

export default function NivelBadge({ nivel }: NivelBadgeProps) {
  const { label, classes } = estilos[nivel];

  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
