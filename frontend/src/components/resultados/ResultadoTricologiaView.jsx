export default function ResultadoTricologiaView({ resultado }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Resultado Tricológico</h1>
        <p className="mt-2 text-sm text-slate-600">{resultado.resumoGeral}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Couro Cabeludo</h3>
        <ul className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
          <li>Oleosidade: {resultado.couroCabeludo.oleosidade}</li>
          <li>Sensibilidade: {resultado.couroCabeludo.sensibilidade}</li>
          <li>Descamação: {resultado.couroCabeludo.descamacao}</li>
          <li>Inflamação: {resultado.couroCabeludo.inflamacao}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Fios</h3>
        <ul className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
          <li>Espessura: {resultado.fios.espessura}</li>
          <li>Densidade: {resultado.fios.densidade}</li>
          <li>Resistência: {resultado.fios.resistencia}</li>
          <li>Elasticidade: {resultado.fios.elasticidade}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Sinais Observados</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          {resultado.sinaisObservados.map((sinal, i) => (
            <li key={i}>{sinal}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Recomendações Profissionais</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          {resultado.recomendacoes.tratamentos.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-600">
          <strong>Frequência:</strong> {resultado.recomendacoes.frequencia}
        </p>
      </section>

      <p className="text-sm italic text-slate-500">
        {resultado.observacaoProfissional}
      </p>
    </div>
  );
}
