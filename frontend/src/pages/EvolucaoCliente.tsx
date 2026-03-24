export default function EvolucaoCliente() {
  return (
    <div className="section-stack animate-page-in">
      <div className="rounded-xl border px-4 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>Evolução do Fio</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Acompanhe a progressão da saúde capilar ao longo do tempo.
        </p>
      </div>

      <div className="panel-tight text-sm" style={{ color: "var(--color-text-muted)" }}>
        Comparativo detalhado indisponível nesta versão. Use a página de comparação evolutiva para visualizar
        progresso entre análises.
      </div>
    </div>
  );
}
