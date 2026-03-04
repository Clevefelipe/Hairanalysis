
type Props = {
  total: number;
};

export default function ClientesHeader({ total }: Props) {
  return (
    <div className="clientes-header">
      <div>
        <h1 className="clientes-title">Clientes</h1>
        <p className="clientes-subtitle">
          Cadastrados no sistema: <strong>{total}</strong>
        </p>
      </div>
      <button className="clientes-filter-toggle">Esconder filtros</button>
    </div>
  );
}
