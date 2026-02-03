type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ClientesBusca({ value, onChange }: Props) {
  return (
    <div className="clientes-toolbar">
      <div className="clientes-search">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por nome, telefone ou CPF"
        />
        <span>Filtro rápido</span>
      </div>
    </div>
  );
}
