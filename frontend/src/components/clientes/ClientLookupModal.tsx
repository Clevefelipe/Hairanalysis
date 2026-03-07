import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  criarCliente,
  listarClientes,
} from "@/core/cliente/cliente.service";
import { useToast } from "@/components/ui/ToastProvider";

type Cliente = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: Cliente) => void;
}

export default function ClientLookupModal({
  isOpen,
  onClose,
  onSelect,
}: Props) {
  const { notify } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [novo, setNovo] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
  });
  const [saving, setSaving] = useState(false);
  const [erros, setErros] = useState<{ nome?: string; telefone?: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    listarClientes()
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setClientes([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((c) => {
      const nome = String(c.nome ?? "").toLowerCase();
      const telefone = String(c.telefone ?? "").toLowerCase();
      const cpf = String(c.cpf ?? "").toLowerCase();
      return (
        nome.includes(term) ||
        telefone.includes(term) ||
        cpf.includes(term)
      );
    });
  }, [clientes, search]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (!ddd) return "";
    if (!rest) return `(${ddd}) `;
    if (rest.length <= 5) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  };

  async function handleCreate() {
    const nome = novo.nome.trim();
    const telefone = novo.telefone.replace(/\D/g, "").trim();
    const email = novo.email.trim();
    const cpf = novo.cpf.trim();

    const nextErrors: { nome?: string; telefone?: string } = {};
    if (!nome) {
      nextErrors.nome = "Nome é obrigatório.";
    }
    if (telefone && telefone.length < 10) {
      nextErrors.telefone = "Telefone incompleto.";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify("Informe um e-mail válido.", "warning");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErros(nextErrors);
      return;
    }

    setErros({});

    setSaving(true);
    try {
      const created = await criarCliente({
        nome,
        telefone: telefone || undefined,
        email: email || undefined,
        cpf: cpf || undefined,
      } as any);
      notify("Cliente criado com sucesso.", "success");
      onSelect(created as Cliente);
      onClose();
      setNovo({ nome: "", telefone: "", email: "", cpf: "" });
      setErros({});
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao criar cliente.";
      notify(Array.isArray(message) ? message.join(" | ") : String(message), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="LOCALIZAR CLIENTE" isOpen={isOpen} onClose={onClose}>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface, #fff)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>
                Selecionar cliente
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Busque por nome, telefone ou CPF. Clique em Selecionar para vincular.
              </p>
            </div>
            <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
              {clientes.length} registrados
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-sm">
            <Search size={18} className="text-[color:var(--color-text-muted)]" />
            <input
              className="w-full bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none"
              placeholder="Buscar por nome, telefone ou CPF"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-border) 60%, transparent)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border)] bg-white px-4 py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-primary-light, #e6f7f2)] text-[color:var(--color-primary, #0fa47a)]">☕</span>
              Nenhum cliente encontrado. Refine a busca ou crie um novo contato ao lado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-white shadow-sm">
              <div className="max-h-[360px] overflow-y-auto">
                <table className="min-w-full divide-y divide-[color:var(--color-border)] text-sm">
                  <thead className="bg-[color:var(--bg-primary)] text-xs uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>
                    <tr>
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-left">Telefone</th>
                      <th className="px-4 py-3 text-left">CPF</th>
                      <th className="px-4 py-3 text-right">Selecionar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-border)]" style={{ color: "var(--color-text)" }}>
                    {filtered.map((c) => (
                      <tr key={c.id} className="transition hover:bg-[color:var(--bg-primary)]">
                        <td className="px-4 py-2 font-semibold" style={{ color: "var(--color-text)" }}>{c.nome}</td>
                        <td className="px-4 py-2" style={{ color: "var(--color-text-muted)" }}>{c.telefone || "Sem telefone"}</td>
                        <td className="px-4 py-2" style={{ color: "var(--color-text-muted)" }}>{c.cpf || "Sem CPF"}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-text)] shadow-sm transition hover:border-[color:var(--color-success-200)] hover:bg-[color:var(--bg-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-success-600)]"
                            onClick={() => {
                              onSelect(c);
                              onClose();
                            }}
                          >
                            Selecionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface, #fff)] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text, #0f172a)" }}>Novo cliente</h3>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Informe ao menos nome e um contato. Outros campos são opcionais.
          </p>

          <div className="grid gap-2">
            <input
              className={`clientes-input w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--color-success-200)] focus:border-[color:var(--color-success-400)] ${erros.nome ? "border-[color:var(--color-error-400,#ef4444)]" : "border-[color:var(--color-border)]"}`}
              placeholder="Nome"
              value={novo.nome}
              onChange={(e) =>
                setNovo((prev) => ({ ...prev, nome: e.target.value }))
              }
            />
            {erros.nome && (
              <span className="text-[11px] font-semibold text-[color:var(--color-error-600,#b91c1c)]">{erros.nome}</span>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-2 shadow-inner focus-within:border-[color:var(--color-success-400)] focus-within:ring-2 focus-within:ring-[color:var(--color-success-100)]">
              <span className="flex items-center gap-1 rounded-md bg-[color:var(--color-success-50)] px-2 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">+55</span>
              <input
                className="clientes-input w-full border-none bg-transparent p-0 text-sm focus:outline-none focus-visible:outline-none"
                placeholder="(DD) 9XXXX-XXXX"
                value={novo.telefone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setNovo((prev) => ({ ...prev, telefone: formatted }));
                  if (formatted.replace(/\D/g, "").length >= 10) {
                    setErros((prev) => ({ ...prev, telefone: undefined }));
                  }
                }}
              />
            </div>
            {erros.telefone && (
              <span className="text-[11px] font-semibold text-[color:var(--color-error-600,#b91c1c)]">{erros.telefone}</span>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="clientes-input w-full rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--color-success-200)] focus:border-[color:var(--color-success-400)]"
                placeholder="E-mail"
                value={novo.email}
                onChange={(e) =>
                  setNovo((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <input
                className="clientes-input w-full rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--color-success-200)] focus:border-[color:var(--color-success-400)]"
                placeholder="CPF"
                value={novo.cpf}
                onChange={(e) =>
                  setNovo((prev) => ({ ...prev, cpf: e.target.value }))
                }
              />
            </div>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-success-600)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-shadow hover:bg-[color:var(--color-success-500)] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-success-600)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Criar cliente"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
