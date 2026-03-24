
type Props = {
  value: string;
  onChange: (value: string) => void;
  onNovoCliente: () => void;
};

export default function ClientesBusca({ value, onChange, onNovoCliente }: Props) {
  return (
    <div className="clientes-toolbar">
      <div className="clientes-filter-row">
        <div className="clientes-filter-group">
          <label className="clientes-filter-label">Procurar por:</label>
          <input
            className="clientes-input clientes-filter-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nome, telefone ou CPF"
          />
          <select className="clientes-input clientes-filter-select">
            <option>Filtrar por Nome</option>
            <option>Filtrar por Telefone</option>
            <option>Filtrar por CPF</option>
          </select>
          <select className="clientes-input clientes-filter-select">
            <option>Ativos</option>
            <option>Inativos</option>
            <option>Todos</option>
          </select>
          <button className="btn-primary clientes-filter-action">Buscar</button>
          <button className="btn-secondary clientes-filter-action">Exibir todos</button>
        </div>
        <button className="clientes-filter-toggle">Esconder filtros</button>
      </div>

      <div className="clientes-actions-row">
        <button className="btn-primary" onClick={onNovoCliente}>+ Novo Cliente</button>
        <button className="btn-secondary">Remover selecionados</button>
        <button className="btn-secondary">Importar Clientes</button>
        <button className="btn-secondary">Mesclar duplicados</button>
        <button className="btn-secondary">Salvar no Excel</button>
      </div>
    </div>
  );
}



