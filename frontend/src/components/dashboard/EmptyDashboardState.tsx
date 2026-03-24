import Section from "@/components/ui/Section";

export default function EmptyDashboardState() {
  return (
    <Section className="flex flex-col items-center justify-center gap-2 text-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--bg-primary)" }}>
        ∅
      </span>
      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        Nenhum cliente selecionado
      </p>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Selecione um cliente na busca para visualizar dados individuais.
      </p>
    </Section>
  );
}
