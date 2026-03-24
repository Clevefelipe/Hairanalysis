import { useState } from "react";
import { useCliente } from "../../core/cliente/ClienteContext";
import type { Cliente } from "../../core/cliente/cliente.service";
import "./SearchModal.css";

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const { clientes = [] } = useCliente();
  const [query, setQuery] = useState("");

  const filtrados = clientes.filter((c: Cliente) =>
    `${c.nome} ${c.telefone ?? ""} ${c.cpf ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text, #0f172a)" }}>
            Busca rápida de clientes
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md focus-ring-strong text-white transition"
            style={{ backgroundColor: "var(--color-error-600, #dc2626)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-error-700, #b91c1c)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-error-600, #dc2626)")}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <input
          className="modal-input"
          placeholder="Nome, telefone ou CPF"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="modal-results">
          {filtrados.length === 0 && (
            <p className="empty">Nenhum cliente encontrado</p>
          )}

          {filtrados.map((c: Cliente) => (
            <div
              key={c.id}
              className="result-item"
              onClick={() => {
                onClose();
              }}
            >
              <strong>{c.nome}</strong>
              <span>{c.telefone || "Sem telefone"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
