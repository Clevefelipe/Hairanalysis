import { useEffect, useMemo, useState } from "react";
import {
  createStraightening,
  listStraightenings,
  StraighteningOption,
} from "../services/straightening.service";
import "../styles/system.css";

type Nivel = "baixo" | "moderado" | "elevado";

export default function Alisamentos() {
  const [items, setItems] = useState<StraighteningOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nivel, setNivel] = useState<Nivel>("baixo");
  const [indicacao, setIndicacao] = useState("");
  const [saving, setSaving] = useState(false);

  const resultadoCapilar = JSON.parse(
    sessionStorage.getItem("resultadoAnaliseCapilar") || "{}"
  );
  const nivelCapilar: Nivel = resultadoCapilar?.nivel || "baixo";

  useEffect(() => {
    listStraightenings()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createStraightening({
        name,
        description,
        criteria: { nivel, indicacao },
      });
      setItems((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      setIndicacao("");
      setNivel("baixo");
    } finally {
      setSaving(false);
    }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const aScore = a.criteria?.nivel === nivelCapilar ? 1 : 0;
      const bScore = b.criteria?.nivel === nivelCapilar ? 1 : 0;
      return bScore - aScore;
    });
  }, [items, nivelCapilar]);

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Alisamentos cadastrados</h1>
          <p className="page-hero-subtitle">
            Cadastre opções do salão e receba a recomendação ideal conforme a
            análise estética.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2 className="text-lg font-semibold mb-4">Novo alisamento</h2>
        <form className="clientes-form-grid" onSubmit={handleSubmit}>
          <input
            className="clientes-input"
            placeholder="Nome do alisamento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select
            className="clientes-input"
            value={nivel}
            onChange={(e) => setNivel(e.target.value as Nivel)}
          >
            <option value="baixo">Baixo risco</option>
            <option value="moderado">Risco moderado</option>
            <option value="elevado">Risco elevado</option>
          </select>
          <input
            className="clientes-input clientes-span-full"
            placeholder="Indicação principal (ex: fios sensibilizados, frizz intenso)"
            value={indicacao}
            onChange={(e) => setIndicacao(e.target.value)}
          />
          <textarea
            className="clientes-textarea clientes-span-full"
            placeholder="Descrição e observações"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="clientes-span-full">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alisamento"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel panel-muted">
        <h2 className="text-lg font-semibold mb-3">Recomendação sugerida</h2>
        <p className="text-sm text-slate-600">
          Baseada na análise capilar atual (nível: {nivelCapilar}).
        </p>
      </div>

      <div className="panel">
        <h2 className="text-lg font-semibold mb-4">Opções cadastradas</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum alisamento cadastrado ainda.
          </p>
        ) : (
          <div className="clientes-list">
            {sorted.map((item) => {
              const recomendado = item.criteria?.nivel === nivelCapilar;
              return (
                <div key={item.id} className="cliente-card">
                  <div className="cliente-card-header">
                    <div className="cliente-avatar">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="cliente-info">
                      <strong>{item.name}</strong>
                      <span>{item.description || "Sem descrição"}</span>
                      <span>
                        Nível: {item.criteria?.nivel || "não informado"}
                      </span>
                    </div>
                  </div>
                  {item.criteria?.indicacao && (
                    <div className="text-sm text-slate-600">
                      Indicação: {item.criteria.indicacao}
                    </div>
                  )}
                  <div className="cliente-actions">
                    <span className={`chip ${recomendado ? "chip-flag" : ""}`}>
                      {recomendado ? "Recomendado" : "Alternativo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-4">
          Observação estética assistida por IA. A decisão final é sempre do
          profissional.
        </p>
      </div>
    </section>
  );
}
