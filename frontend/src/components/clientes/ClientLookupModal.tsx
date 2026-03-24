import { useEffect, useMemo, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
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

const PHONE_DEFAULT_DDI = "55";

const DDI_OPTIONS = [
  { code: "55", country: "Brasil", iso: "BR" },
  { code: "1", country: "EUA / Canadá", iso: "US" },
  { code: "351", country: "Portugal", iso: "PT" },
  { code: "34", country: "Espanha", iso: "ES" },
  { code: "33", country: "França", iso: "FR" },
  { code: "39", country: "Itália", iso: "IT" },
  { code: "44", country: "Reino Unido", iso: "GB" },
  { code: "49", country: "Alemanha", iso: "DE" },
  { code: "81", country: "Japão", iso: "JP" },
  { code: "54", country: "Argentina", iso: "AR" },
  { code: "52", country: "México", iso: "MX" },
];

type PhoneParts = {
  ddi: string;
  ddd: string;
  number: string;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (!ddd) return "";
  if (!rest) return `(${ddd}) `;
  if (rest.length <= 5) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
};

const formatNumberDigits = (digits: string) => {
  if (!digits) return "";
  return digits.length > 5
    ? `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`
    : digits;
};

const buildPhoneString = (ddi: string, ddd: string, number: string) => {
  const ddiDigits = (ddi || PHONE_DEFAULT_DDI).replace(/\D/g, "").slice(0, 3);
  const dddDigits = (ddd || "").replace(/\D/g, "").slice(0, 2);
  const numberDigits = (number || "").replace(/\D/g, "").slice(0, 9);

  if (!numberDigits) return "";

  const formattedNumber = formatNumberDigits(numberDigits);
  const parts = [
    ddiDigits ? `+${ddiDigits}` : null,
    dddDigits ? `(${dddDigits})` : null,
    formattedNumber,
  ].filter(Boolean);
  return parts.join(" ");
};

const parsePhoneParts = (value: string): PhoneParts => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return { ddi: PHONE_DEFAULT_DDI, ddd: "", number: "" };

  let ddi = PHONE_DEFAULT_DDI;
  let localDigits = digits;
  if (digits.length > 11) {
    ddi = digits.slice(0, digits.length - 11) || PHONE_DEFAULT_DDI;
    localDigits = digits.slice(-11);
  }

  const ddd = localDigits.slice(0, 2);
  const number = localDigits.slice(2);
  return { ddi, ddd, number };
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
  });
  const [phoneParts, setPhoneParts] = useState<PhoneParts>({ ddi: PHONE_DEFAULT_DDI, ddd: "", number: "" });
  const [ddiOpen, setDdiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erros, setErros] = useState<{ nome?: string; telefone?: string }>({});
  const ddiButtonRef = useRef<HTMLButtonElement | null>(null);
  const [ddiPosition, setDdiPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    listarClientes()
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setClientes([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const normalizeDigits = (value: string) => value.replace(/\D/g, "");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    const normalizedTermText = normalizeText(term);
    const normalizedTermDigits = normalizeDigits(term);
    return clientes.filter((c) => {
      const nome = normalizeText(String(c.nome ?? ""));
      const telefone = normalizeDigits(String(c.telefone ?? ""));
      const cpf = normalizeDigits(String(c.cpf ?? ""));
      return (
        (normalizedTermText && nome.includes(normalizedTermText)) ||
        (normalizedTermDigits && telefone.includes(normalizedTermDigits)) ||
        (normalizedTermDigits && cpf.includes(normalizedTermDigits))
      );
    });
  }, [clientes, search]);

  const handlePhoneInput = (value: string) => {
    const nextParts = parsePhoneParts(value);
    setPhoneParts(nextParts);
    setNovo((prev) => ({ ...prev, telefone: buildPhoneString(nextParts.ddi, nextParts.ddd, nextParts.number) }));

    if (nextParts.ddd && nextParts.number.length >= 8) {
      setErros((prev) => ({ ...prev, telefone: undefined }));
    }
  };

  const handleSelectDdi = (code: string) => {
    setPhoneParts((prev) => {
      const next = { ...prev, ddi: code };
      setNovo((prevNovo) => ({ ...prevNovo, telefone: buildPhoneString(next.ddi, next.ddd, next.number) }));
      return next;
    });
    setDdiOpen(false);
    setDdiPosition(null);
  };

  useEffect(() => {
    if (!ddiOpen) return;
    const updatePosition = () => {
      const rect = ddiButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDdiPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width + 40, 220),
      });
    };
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [ddiOpen]);

  async function handleCreate() {
    const nome = novo.nome.trim();
    const telefone = buildPhoneString(phoneParts.ddi, phoneParts.ddd, phoneParts.number).trim();

    const nextErrors: { nome?: string; telefone?: string } = {};
    if (!nome) {
      nextErrors.nome = "Nome é obrigatório.";
    }
    if (telefone && telefone.replace(/\D/g, "").length < 10) {
      nextErrors.telefone = "Telefone incompleto.";
    }
    // sem validação de email/CPF neste fluxo rápido

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
      } as any);
      notify("Cliente criado com sucesso.", "success");
      onSelect(created as Cliente);
      onClose();
      setNovo({ nome: "", telefone: "" });
      setPhoneParts({ ddi: PHONE_DEFAULT_DDI, ddd: "", number: "" });
      setDdiOpen(false);
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
      <div className="grid gap-5 lg:grid-cols-2" style={{ overflow: "visible" }}>
        {/* Coluna esquerda: busca e lista */}
        <div className="space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-modal-surface,var(--color-surface,#fff))] p-4 shadow-sm">
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

          <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface,#fff)] px-4 py-3 shadow-sm" style={{ overflow: "visible" }}>
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
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface,#fff)] px-4 py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-primary-light,#e6f7f2)] text-[color:var(--color-primary,#0fa47a)]">☕</span>
              Nenhum cliente encontrado. Refine a busca ou crie um novo contato ao lado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface,#fff)] shadow-sm">
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

        {/* Coluna direita: cadastro rápido */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-modal-surface,var(--color-surface,#fff))] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text, #0f172a)" }}>Novo cliente</h3>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Informe ao menos nome e um contato. Outros campos são opcionais.
          </p>

          <div className="grid gap-3">
            <input
              className={`clientes-input w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--color-success-200)] focus:border-[color:var(--color-success-400)] ${erros.nome ? "border-[color:var(--color-error-400,#ef4444)]" : "border-[color:var(--color-border)]"}`}
              placeholder="Nome"
              value={novo.nome}
              onChange={(e) => setNovo((prev) => ({ ...prev, nome: e.target.value }))}
            />
            {erros.nome && (
              <span className="text-[11px] font-semibold text-[color:var(--color-error-600,#b91c1c)]">{erros.nome}</span>
            )}

            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Telefone</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <div className="relative w-full sm:w-auto" style={{ overflow: "visible" }}>
                  <button
                    type="button"
                    className={`relative z-10 flex h-10 min-w-[120px] items-center justify-between gap-3 rounded-lg border bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition ${ddiOpen ? "border-slate-400 ring-2 ring-slate-200" : "border-[color:var(--color-border)] hover:border-slate-300"}`}
                    onClick={() => setDdiOpen((prev) => !prev)}
                    ref={ddiButtonRef}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold uppercase text-slate-500">DDI</span>
                      <span className="flex items-center gap-2 rounded-md px-2 py-0.5 text-sm font-semibold text-slate-800">
                        <span className="flex h-5 w-8 items-center justify-center rounded bg-white text-lg leading-none shadow-sm">
                          <ReactCountryFlag
                            countryCode={DDI_OPTIONS.find((item) => item.code === phoneParts.ddi)?.iso ?? "BR"}
                            svg
                            style={{ width: "18px", height: "12px" }}
                            title={DDI_OPTIONS.find((item) => item.code === phoneParts.ddi)?.country ?? ""}
                          />
                        </span>
                      </span>
                      <span className="text-slate-700">+{phoneParts.ddi || PHONE_DEFAULT_DDI}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-4 w-4 text-slate-300 transition ${ddiOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {ddiOpen && ddiPosition && (
                    <div
                      className="fixed z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
                      style={{ top: ddiPosition.top, left: ddiPosition.left, width: ddiPosition.width }}
                    >
                      <div className="max-h-60 overflow-y-auto p-1">
                        {DDI_OPTIONS.map((item) => {
                          const selected = item.code === phoneParts.ddi;
                          return (
                            <button
                              key={item.code + item.country}
                              type="button"
                              className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${selected ? "bg-[color:var(--color-success-30,#f3f9f5)] text-slate-800" : "text-slate-800"}`}
                              onClick={() => handleSelectDdi(item.code)}
                            >
                              <div className="flex items-center gap-3">
                                <ReactCountryFlag countryCode={item.iso} svg style={{ width: "20px", height: "14px" }} title={item.country} />
                                <span className="text-sm font-semibold">+{item.code}</span>
                              </div>
                              <span className="text-xs text-slate-500">{item.country}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="(DDD) 9XXXX-XXXX"
                  className="clientes-input h-10 min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--color-success-200)] focus:border-[color:var(--color-success-400)] border-[color:var(--color-border)]"
                  value={novo.telefone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                />
              </div>
            </div>

            {erros.telefone && (
              <span className="text-[11px] font-semibold text-[color:var(--color-error-600,#b91c1c)]">{erros.telefone}</span>
            )}
          </div>

          <button
            className="btn-primary w-full"
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
