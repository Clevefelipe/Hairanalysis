type Props = {
  onNovoCliente: () => void;
};

export default function ClientesHeader({ onNovoCliente }: Props) {
  return (
    <div className="clientes-hero">
      <div>
        <span className="clientes-hero-badge">Gestão ativa</span>
        <h1>Clientes</h1>
        <p>Gerencie seus clientes e acompanhe históricos de atendimento.</p>
      </div>

      <button className="btn-primary" onClick={onNovoCliente}>
        Cadastrar cliente
      </button>
    </div>
  );
}
