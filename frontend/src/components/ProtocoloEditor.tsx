import React, { useState } from "react";
import { Protocolo, protocoloService } from "../services/protocolo.service";

interface Props {
  protocolos: Protocolo[];
  onChange: (protocolos: Protocolo[]) => void;
}


const ProtocoloEditor: React.FC<Props> = ({ protocolos, onChange }) => {
  const [editList, setEditList] = useState<Protocolo[]>(protocolos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFieldChange(idx: number, field: keyof Protocolo, value: any) {
    setError(null);
    const updated = [...editList];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditList(updated);
    onChange(updated);
    // Salvar edição no backend se já existir
    if (updated[idx].id) {
      setLoading(true);
      try {
        await protocoloService.update(updated[idx].id!, updated[idx]);
      } catch (e) {
        setError("Erro ao salvar protocolo");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleIndicacaoChange(idx: number, indicacoes: string[]) {
    await handleFieldChange(idx, "indicacoes", indicacoes);
  }

  async function addProtocolo() {
    setError(null);
    setLoading(true);
    try {
      const novo: Protocolo = { titulo: "", descricao: "", indicacoes: [], clienteId: editList[0]?.clienteId || "" };
      const criado = await protocoloService.create(novo);
      const updated = [...editList, criado];
      setEditList(updated);
      onChange(updated);
    } catch (e) {
      setError("Erro ao adicionar protocolo");
    } finally {
      setLoading(false);
    }
  }

  async function removeProtocolo(idx: number) {
    setError(null);
    const toRemove = editList[idx];
    if (toRemove.id) {
      setLoading(true);
      try {
        await protocoloService.remove(toRemove.id);
      } catch (e) {
        setError("Erro ao remover protocolo");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    const updated = editList.filter((_, i) => i !== idx);
    setEditList(updated);
    onChange(updated);
  }

  async function sugestaoIA() {
    setError(null);
    setLoading(true);
    try {
      // Mock IA: pode ser trocado por chamada real
      const sugestao = {
        titulo: "Sugestão IA: Cronograma Capilar",
        descricao: "Protocolo sugerido automaticamente com base na análise do fio e histórico do cliente.",
        indicacoes: [
          "Hidratação semanal",
          "Nutrição quinzenal",
          "Reconstrução mensal",
        ],
        clienteId: editList[0]?.clienteId || ""
      };
      const criado = await protocoloService.create(sugestao);
      const updated = [...editList, criado];
      setEditList(updated);
      onChange(updated);
    } catch (e) {
      setError("Erro ao obter sugestão da IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Protocolos</p>
          <h2 className="text-xl font-semibold text-slate-900">Protocolos Personalizados</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={addProtocolo}
            className="btn-primary"
          >
            Adicionar Protocolo
          </button>
          <button
            onClick={sugestaoIA}
            className="btn-secondary"
          >
            Sugestão IA
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Salvando...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="space-y-4">
        {editList.map((p, idx) => (
          <div
            key={p.id || idx}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <input
              placeholder="Título"
              value={p.titulo}
              onChange={(e) => handleFieldChange(idx, "titulo", e.target.value)}
              className="clientes-input mb-3 w-full"
            />
            <textarea
              placeholder="Descrição"
              value={p.descricao}
              onChange={(e) => handleFieldChange(idx, "descricao", e.target.value)}
              rows={3}
              className="clientes-textarea mb-3 w-full"
            />
            <input
              placeholder="Indicações (separadas por vírgula)"
              value={p.indicacoes?.join(", ") || ""}
              onChange={(e) => handleIndicacaoChange(idx, e.target.value.split(",").map((s) => s.trim()))}
              className="clientes-input mb-4 w-full"
            />
            <button
              onClick={() => removeProtocolo(idx)}
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProtocoloEditor;
