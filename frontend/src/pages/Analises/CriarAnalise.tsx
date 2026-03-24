import { useState } from 'react';
import { criarAnaliseCapilar } from '../../services/analysis.service';

interface Props {
  clienteId: string | number;
}

export function CriarAnalise({ clienteId }: Props) {
  const [couroCabeludo, setCouroCabeludo] = useState('');
  const [fio, setFio] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [profissional, setProfissional] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await criarAnaliseCapilar(clienteId, {
      couroCabeludo,
      fio,
      observacoes,
      profissional,
    });

    setCouroCabeludo('');
    setFio('');
    setObservacoes('');
    setProfissional('');
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 animate-page-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Criar Análise</h1>
        <p className="text-slate-600">Registre uma nova análise capilar para o cliente</p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Couro Cabeludo</label>
          <input
            placeholder="Descreva o estado do couro cabeludo"
            value={couroCabeludo}
            onChange={(e) => setCouroCabeludo(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-sm focus:shadow-md transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Fio</label>
          <input
            placeholder="Descreva o tipo de fio capilar"
            value={fio}
            onChange={(e) => setFio(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-sm focus:shadow-md transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
          <textarea
            placeholder="Adicione observações importantes sobre a análise"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-sm focus:shadow-md transition-shadow resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Profissional Responsável</label>
          <input
            placeholder="Nome do profissional que realizou a análise"
            value={profissional}
            onChange={(e) => setProfissional(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-sm focus:shadow-md transition-shadow"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Criar Análise"}
          </button>
        </div>
      </div>
    </form>
  );
}
