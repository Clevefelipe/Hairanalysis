import "./BuscaResultados.css";

interface Props {
  onClose: () => void;
}

export default function BuscaResultados({ onClose }: Props) {
  // Mock de clientes (UI fake)
  const clientes = [
    {
      id: "1",
      nome: "Maria Silva",
      cpf: "123.456.789-00",
      telefone: "(41) 99999-9999",
    },
    {
      id: "2",
      nome: "Ana Souza",
      cpf: "987.654.321-00",
      telefone: "(41) 98888-8888",
    },
  ];

  type ClienteResultado = (typeof clientes)[number];

  function handleSelect(_cliente: ClienteResultado) {
    onClose();
  }

  return (
    <div className="busca-resultados">
      {clientes.map((cliente) => (
        <div
          key={cliente.id}
          className="resultado-item"
          onClick={() => handleSelect(cliente)}
        >
          <strong>{cliente.nome}</strong>
          <span>{cliente.telefone}</span>
          <small>{cliente.cpf}</small>
        </div>
      ))}
    </div>
  );
}
