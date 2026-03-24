import { useState } from "react";
import "./DrawerCadastroCliente.css";

type Cliente = {
  nome: string;
  telefone: string;
  cpf?: string;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (cliente: Cliente) => void;
};

export default function DrawerCadastroCliente({ aberto, onFechar, onSalvar }: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  if (!aberto) return null;

  return (
    <aside className="sdm-drawer">
      <header>
        <h3>Cadastrar nova cliente</h3>
        <button onClick={onFechar}>✕</button>
      </header>

      <div className="sdm-drawer-body">
        <label>Nome completo*</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} />

        <label>Telefone*</label>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />

        <label>CPF (opcional)</label>
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
      </div>

      <footer>
        <button
          className="btn-primario"
          onClick={() => onSalvar({ nome, telefone, cpf })}
        >
          Salvar e iniciar diagnóstico
        </button>
      </footer>
    </aside>
  );
}
