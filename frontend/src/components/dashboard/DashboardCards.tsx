interface DashboardCardsProps {
  totalClientes: number;
  totalAnalises: number;
  totalEvolucoes: number;
}

function Card({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: number;
  subtitulo?: string;
}) {
  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="mb-2 text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <h2 className="text-4xl font-semibold text-slate-900">
        {valor}
      </h2>

      {subtitulo && (
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
          {subtitulo}
        </p>
      )}
    </div>
  );
}

export default function DashboardCards({
  totalClientes,
  totalAnalises,
  totalEvolucoes,
}: DashboardCardsProps) {
  return (
    <div className="flex flex-wrap gap-5">
      <Card
        titulo="Clientes cadastrados"
        valor={totalClientes}
        subtitulo="Total no sistema"
      />

      <Card
        titulo="Análises realizadas"
        valor={totalAnalises}
        subtitulo="Diagnósticos capilares"
      />

      <Card
        titulo="Evoluções registradas"
        valor={totalEvolucoes}
        subtitulo="Acompanhamentos"
      />
    </div>
  );
}
