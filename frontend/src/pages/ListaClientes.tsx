import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarClientes, Cliente } from "../core/cliente/cliente.service";

export default function ListaClientes() {
  // Observação: este componente usa a listagem simplificada legacy
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listarClientes()
      .then(setClientes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="section-stack animate-page-in w-full">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }}></div>
          Carregando clientes...
        </div>
      </div>
    </section>
  );

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>Clientes</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Gerencie todos os clientes cadastrados no sistema</p>
      </div>

      {clientes.length === 0 ? (
        <div className="text-center py-12">
          <div className="panel-tight max-w-md mx-auto text-center hover:shadow-md transition-shadow">
            <p style={{ color: "var(--color-text-muted)" }}>Nenhum cliente cadastrado.</p>
            <button 
              onClick={() => navigate('/clientes')}
              className="mt-4 btn-primary"
            >
              Cadastrar primeiro cliente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => navigate(`/clientes/${cliente.id}/historico`)}
              className="panel-tight hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{cliente.nome}</h3>
                  {cliente.telefone && (
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{cliente.telefone}</p>
                  )}
                </div>
                <div className="rounded-full bg-[color:var(--color-success-100)] p-2">
                  <div className="w-2 h-2 bg-[color:var(--color-success-500)] rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--color-success-600)]">
                <span>Ver histórico completo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
