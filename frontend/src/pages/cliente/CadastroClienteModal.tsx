import { useState } from "react";
import "../../styles/system.css";

type ClienteFake = {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
};

type Props = {
  onClose: () => void;
  clienteInicial?: ClienteFake | null;
};

type Tab = "dados" | "endereco" | "adicionais";

export default function CadastroClienteModal({
  onClose,
  clienteInicial,
}: Props) {
  const [tabAtiva, setTabAtiva] = useState<Tab>("dados");

  const modoEdicao = Boolean(clienteInicial);

  return (
    <div className="clientes-modal">
      <div className="clientes-modal-card">
        <div className="clientes-modal-header">
          <h1 className="clientes-modal-title">
            {modoEdicao ? "Editar cadastro" : "Cadastrar cliente"}
          </h1>
          <p className="clientes-modal-subtitle">
            Registro básico para acompanhamento capilar
          </p>
        </div>

        <div className="clientes-tabs">
          {[
            { id: "dados", label: "Dados do Cliente" },
            { id: "endereco", label: "Endereço" },
            { id: "adicionais", label: "Informações Adicionais" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`clientes-tab ${tabAtiva === tab.id ? "active" : ""}`}
              onClick={() => setTabAtiva(tab.id as Tab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="clientes-modal-body">
          {tabAtiva === "dados" && (
            <div className="clientes-form-grid">
              <input
                className="clientes-input"
                placeholder="Nome completo *"
                defaultValue={clienteInicial?.nome}
              />
              <input
                className="clientes-input"
                placeholder="Telefone *"
                defaultValue={clienteInicial?.telefone}
              />
              <input
                className="clientes-input"
                placeholder="Email"
                defaultValue={clienteInicial?.email}
              />
              <input className="clientes-input" placeholder="Data de nascimento" />
              <input className="clientes-input" placeholder="CPF (opcional)" />
              <textarea
                className="clientes-textarea clientes-span-full"
                placeholder="Observações técnicas"
                rows={3}
              />
            </div>
          )}

          {tabAtiva === "endereco" && (
            <div className="clientes-form-grid">
              <input className="clientes-input" placeholder="CEP" />
              <input className="clientes-input" placeholder="Rua" />
              <input className="clientes-input" placeholder="Número" />
              <input className="clientes-input" placeholder="Complemento" />
              <input className="clientes-input" placeholder="Bairro" />
              <input className="clientes-input" placeholder="Cidade" />
              <input className="clientes-input" placeholder="Estado" />
            </div>
          )}

          {tabAtiva === "adicionais" && (
            <div className="clientes-form-grid">
              <textarea
                className="clientes-textarea clientes-span-full"
                placeholder="Histórico químico informado pelo cliente"
                rows={3}
              />
              <textarea
                className="clientes-textarea clientes-span-full"
                placeholder="Sensibilidade ou desconfortos relatados"
                rows={3}
              />
              <textarea
                className="clientes-textarea clientes-span-full"
                placeholder="Observações técnicas do profissional"
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="clientes-modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary">
            {modoEdicao ? "Salvar alterações" : "Salvar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
