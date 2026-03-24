type Props = {
  tipo_fio: string;
  porosidade: string;
  nivel_dano: string;
};

export default function ServiceRecommendations({
  tipo_fio,
  porosidade,
  nivel_dano,
}: Props) {
  const services = [];

  if (porosidade === "alta" || nivel_dano !== "baixo") {
    services.push({
      title: "Reconstrução SDM",
      description:
        "Reconstrução profunda para recuperar massa, força e resistência do fio.",
    });
  }

  if (porosidade !== "baixa") {
    services.push({
      title: "Nutrição Lipídica SDM",
      description:
        "Reposição de óleos essenciais para eliminar frizz e selar a fibra capilar.",
    });
  }

  services.push({
    title: "Hidratação SDM",
    description:
      "Reposição de água e ativos para devolver maciez, brilho e elasticidade.",
  });

  if (tipo_fio !== "liso") {
    services.push({
      title: "Alinhamento / Selagem SDM",
      description:
        "Redução de volume e alinhamento sem comprometer a saúde do fio.",
    });
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Serviços Recomendados SDM</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <strong className="text-sm font-semibold text-slate-900">
              {s.title}
            </strong>
            <p className="mt-2 text-sm text-slate-600">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
