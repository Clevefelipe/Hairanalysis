import { useState } from "react";
import { useServices } from "../core/services/ServiceContext";

export default function Services() {
  const { services, addService, removeService } = useServices();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] =
    useState<"ALISAMENTO" | "TRATAMENTO">("TRATAMENTO");
  const [nivel, setNivel] =
    useState<"VERDE" | "AMARELO" | "VERMELHO">("VERDE");
  const [descricao, setDescricao] = useState("");

  function salvar() {
    if (!nome) return;

    addService({
      id: crypto.randomUUID(),
      nome,
      categoria,
      nivelPermitido: nivel,
      descricao,
    });

    setNome("");
    setDescricao("");
  }

  return (
    <div className="wizard-container">
      <h1>Serviços do Salão</h1>

      <section className="wizard-card">
        <h2>Novo Serviço</h2>

        <input
          placeholder="Nome do serviço"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <select value={categoria} onChange={(e) => setCategoria(e.target.value as any)}>
          <option value="ALISAMENTO">Alisamento</option>
          <option value="TRATAMENTO">Tratamento</option>
        </select>

        <select value={nivel} onChange={(e) => setNivel(e.target.value as any)}>
          <option value="VERDE">Permitido (Verde)</option>
          <option value="AMARELO">Atenção (Amarelo)</option>
          <option value="VERMELHO">Restrito (Vermelho)</option>
        </select>

        <textarea
          placeholder="Descrição técnica"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button onClick={salvar}>Cadastrar Serviço</button>
      </section>

      <section className="sdm-section">
        <h2>Serviços Cadastrados</h2>

        {services.map((s) => (
          <div key={s.id} className="alert-card alert-safe">
            <h4>{s.nome}</h4>
            <p>{s.descricao}</p>
            <span className="meta">
              {s.categoria} · {s.nivelPermitido}
            </span>
            <button onClick={() => removeService(s.id)}>Remover</button>
          </div>
        ))}
      </section>
    </div>
  );
}
