const clientesMock = [
  { id: 1, nome: "Maria Silva", telefone: "(41) 99999-9999", perfil: "VIP" },
  { id: 2, nome: "Ana Souza", telefone: "(41) 98888-8888", perfil: "Ativa" },
];

function getInitials(nome: string) {
  const partes = nome.split(" ").filter(Boolean);
  const iniciais = partes.slice(0, 2).map((parte) => parte[0].toUpperCase());
  return iniciais.join("");
}

export default function ClientesLista() {
  return (
    <div className="clientes-list">
      {clientesMock.map((cliente) => (
        <div key={cliente.id} className="cliente-card">
          <div className="cliente-card-header">
            <div className="cliente-avatar">{getInitials(cliente.nome)}</div>
            <div className="cliente-info">
              <strong>{cliente.nome}</strong>
              <span>{cliente.telefone}</span>
              <span>Perfil: {cliente.perfil}</span>
            </div>
          </div>

          <div className="cliente-actions">
            <button className="btn-secondary">Ver detalhes</button>
            <button className="btn-primary">Novo atendimento</button>
          </div>
        </div>
      ))}
    </div>
  );
}
