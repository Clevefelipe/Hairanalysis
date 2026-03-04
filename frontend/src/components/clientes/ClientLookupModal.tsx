import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";

type ClientLookupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: { id: string; nome: string; telefone?: string; email?: string; cpf?: string }) => void;
};

type ClienteItem = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
};

export default function ClientLookupModal({ isOpen, onClose, onSelect }: ClientLookupModalProps) {
  const [items, setItems] = useState<ClienteItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api
      .get("/clientes")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setItems(
          data.map((item: any) => ({
            id: String(item?.id ?? ""),
            nome: String(item?.nome ?? "Cliente sem nome"),
            telefone: item?.telefone ? String(item.telefone) : undefined,
            email: item?.email ? String(item.email) : undefined,
            cpf: item?.cpf ? String(item.cpf) : undefined,
          })),
        );
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.nome, item.telefone, item.email, item.cpf]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [items, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Selecionar cliente</h3>
          <button onClick={onClose} className="rounded-md border px-2 py-1 text-sm">
            Fechar
          </button>
        </div>

        <input
          className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Buscar por nome, telefone, e-mail ou CPF"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-[360px] overflow-auto rounded-md border">
          {loading ? (
            <p className="p-3 text-sm text-slate-500">Carregando clientes...</p>
          ) : filtered.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Nenhum cliente encontrado.</p>
          ) : (
            filtered.map((cliente) => (
              <button
                key={cliente.id}
                onClick={() => onSelect(cliente)}
                className="block w-full border-b px-3 py-2 text-left hover:bg-slate-50"
              >
                <div className="text-sm font-medium">{cliente.nome}</div>
                <div className="text-xs text-slate-500">
                  {[cliente.telefone, cliente.email].filter(Boolean).join(" • ")}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

