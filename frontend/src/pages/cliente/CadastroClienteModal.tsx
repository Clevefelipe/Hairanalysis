import { ChangeEvent, useEffect, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { criarCliente, atualizarCliente, type Cliente } from "@/core/cliente/cliente.service";
import { useToast } from "@/components/ui/ToastProvider";
import Modal from "@/components/ui/Modal";

const PHONE_DEFAULT_DDI = "55";

const parsePhoneParts = (phone?: string | null) => {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) {
    return { ddi: PHONE_DEFAULT_DDI, ddd: "", number: "" };
  }

  let ddi = PHONE_DEFAULT_DDI;
  let localDigits = digits;

  if (digits.length > 11) {
    const ddiDigits = digits.slice(0, digits.length - 10);
    ddi = ddiDigits || PHONE_DEFAULT_DDI;
    localDigits = digits.slice(-10);
  }

  const ddd = localDigits.slice(0, 2);
  const number = localDigits.slice(2);

  return {
    ddi: ddi || PHONE_DEFAULT_DDI,
    ddd,
    number,
  };
};

const formatCpfDigits = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ].filter(Boolean);

  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
};

const formatDateDigits = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]}/${parts[1]}`;
  return `${parts[0]}/${parts[1]}/${parts[2]}`;
};

const formatNumberDigits = (digits: string) => {
  if (!digits) return "";
  return digits.length > 5
    ? `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`
    : digits;
};

const buildPhoneString = (ddi?: string, ddd?: string, number?: string) => {
  const ddiDigits = (ddi ?? "").replace(/\D/g, "").slice(0, 3);
  const dddDigits = (ddd ?? "").replace(/\D/g, "").slice(0, 2);
  const numberDigits = (number ?? "").replace(/\D/g, "").slice(0, 9);

  if (!numberDigits) return "";

  const formattedNumber = formatNumberDigits(numberDigits);

  const parts = [
    ddiDigits ? `+${ddiDigits}` : null,
    dddDigits ? `(${dddDigits})` : null,
    formattedNumber,
  ].filter(Boolean);

  return parts.join(" ");
};

const buildLocalPhoneString = (ddd?: string, number?: string) => {
  const dddDigits = (ddd ?? "").replace(/\D/g, "").slice(0, 2);
  const numberDigits = (number ?? "").replace(/\D/g, "").slice(0, 9);

  if (!dddDigits && !numberDigits) return "";

  const formattedNumber = formatNumberDigits(numberDigits);
  const parts = [dddDigits ? `(${dddDigits})` : null, formattedNumber].filter(Boolean);
  return parts.join(" ");
};

type Props = {
  onClose: () => void;
  onSaved?: (cliente: Cliente) => void;
  clienteInicial?: Cliente | null;
};

type Tab = "dados" | "endereco" | "adicionais";

type PhoneParts = ReturnType<typeof parsePhoneParts>;

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

export default function CadastroClienteModal({
  onClose,
  onSaved,
  clienteInicial,
}: Props) {
  const { notify } = useToast();
  const [tabAtiva, setTabAtiva] = useState<Tab>("dados");
  const [saving, setSaving] = useState(false);
  const initialPhoneParts = parsePhoneParts(clienteInicial?.telefone);
  const initialPhoneString = buildPhoneString(
    initialPhoneParts.ddi,
    initialPhoneParts.ddd,
    initialPhoneParts.number,
  );
  const [form, setForm] = useState({
    nome: clienteInicial?.nome ?? "",
    telefone: initialPhoneString,
    email: clienteInicial?.email ?? "",
    dataNascimento: clienteInicial?.dataNascimento ?? "",
    cpf: clienteInicial?.cpf ?? "",
    codigo: clienteInicial?.codigo ?? "",
    observacoes: clienteInicial?.observacoes ?? "",
  });
  const [phoneParts, setPhoneParts] = useState<PhoneParts>({ ddi: PHONE_DEFAULT_DDI, ddd: "", number: "" });
  const [ddiOpen, setDdiOpen] = useState(false);
  const ddiButtonRef = useRef<HTMLButtonElement | null>(null);
  const [ddiPosition, setDdiPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const ddiRef = useRef<HTMLDivElement>(null);

  const modoEdicao = Boolean(clienteInicial);

  useEffect(() => {
    if (!clienteInicial) return;
    const parsed = parsePhoneParts(clienteInicial.telefone);
    setPhoneParts(parsed);
    setForm((prev) => ({
      ...prev,
      telefone: buildPhoneString(parsed.ddi, parsed.ddd, parsed.number),
      nome: clienteInicial.nome ?? prev.nome,
      email: clienteInicial.email ?? prev.email,
      dataNascimento: clienteInicial.dataNascimento ?? prev.dataNascimento,
      cpf: clienteInicial.cpf ?? prev.cpf,
      codigo: clienteInicial.codigo ?? prev.codigo,
      observacoes: clienteInicial.observacoes ?? prev.observacoes,
    }));
  }, [clienteInicial]);

  const handlePhonePartChange = (field: keyof PhoneParts, limit: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, "").slice(0, limit);
      setPhoneParts((prev) => {
        const next = { ...prev, [field]: digits } as PhoneParts;
        setForm((prevForm) => ({
          ...prevForm,
          telefone: buildPhoneString(next.ddi, next.ddd, next.number),
        }));
        return next;
      });
    };

  const handleFullPhoneInput = (value: string) => {
    const parsed = parsePhoneParts(value);
    const merged = {
      ...parsed,
      ddi: parsed.ddi || phoneParts.ddi || PHONE_DEFAULT_DDI,
    } as PhoneParts;

    setPhoneParts(merged);
    setForm((prevForm) => ({
      ...prevForm,
      telefone: buildPhoneString(merged.ddi, merged.ddd, merged.number),
    }));
  };

  const handleSelectDdi = (code: string) => {
    setPhoneParts((prev) => {
      const next = { ...prev, ddi: code };
      setForm((prevForm) => ({
        ...prevForm,
        telefone: buildPhoneString(next.ddi, next.ddd, next.number),
      }));
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ddiRef.current || ddiRef.current.contains(event.target as Node)) return;
      setDdiOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSave = async () => {
    const nome = form.nome.trim();
    const telefone = buildPhoneString(phoneParts.ddi, phoneParts.ddd, phoneParts.number).trim();
    const email = form.email.trim();
    const cpf = form.cpf.trim();
    const codigo = form.codigo.trim();
    const dataNascimento = form.dataNascimento.trim();
    const observacoes = form.observacoes.trim();

    if (!nome) {
      notify("Informe o nome da cliente.", "warning");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify("Informe um e-mail válido.", "warning");
      return;
    }

    setSaving(true);
    try {
      if (modoEdicao && clienteInicial?.id) {
        const updated = await atualizarCliente(clienteInicial.id, {
          nome,
          telefone: telefone || undefined,
          email: email || undefined,
          cpf: cpf || undefined,
          codigo: codigo || undefined,
          dataNascimento: dataNascimento || undefined,
          observacoes: observacoes || undefined,
        });
        notify("Cadastro atualizado com sucesso.", "success");
        onSaved?.(updated);
      } else {
        const created = await criarCliente({
          nome,
          telefone: telefone || undefined,
          email: email || undefined,
          cpf: cpf || undefined,
          codigo: codigo || undefined,
          dataNascimento: dataNascimento || undefined,
          observacoes: observacoes || undefined,
        });
        notify("Cliente salvo com sucesso.", "success");
        onSaved?.(created);
      }
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Não foi possível salvar o cliente.";
      notify(Array.isArray(message) ? message.join(" | ") : String(message), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={modoEdicao ? "Editar cadastro" : "Cadastrar cliente"}
      isOpen
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-500">Registro básico para acompanhamento capilar</p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {[{ id: "dados", label: "Dados do Cliente" }, { id: "endereco", label: "Endereço" }, { id: "adicionais", label: "Informações Adicionais" }].map((tab) => (
              <button
                key={tab.id}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${tabAtiva === tab.id ? "border-[color:var(--color-success-500)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setTabAtiva(tab.id as Tab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabAtiva === "dados" && (
            <div className="grid gap-3 md:grid-cols-2 md:items-center">
              <input
                className="input-base h-10 rounded-lg px-3 py-2 text-sm"
                placeholder="Nome completo *"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <span>Telefone *</span>
                <span className="text-xs font-normal text-slate-400">
                  {form.telefone || `+${phoneParts.ddi || PHONE_DEFAULT_DDI} (__) _____-____`}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div ref={ddiRef} className="relative w-full sm:w-auto" style={{ overflow: "visible" }}>
                  <div
                    className={`relative z-10 flex h-10 min-w-[160px] items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm transition ${ddiOpen ? "border-slate-400 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800 focus:outline-none"
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
                  </div>

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
                  placeholder="(__) _____-____"
                  value={buildLocalPhoneString(phoneParts.ddd, phoneParts.number)}
                  onChange={(e) => handleFullPhoneInput(e.target.value)}
                  className="h-10 min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-[color:var(--color-success-300)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-success-100)]"
                />
              </div>
              <input
                className="input-base h-10 rounded-lg px-3 py-2 text-sm"
                placeholder="Data de nascimento"
                value={form.dataNascimento}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dataNascimento: formatDateDigits(e.target.value) }))
                }
                inputMode="numeric"
              />
              <input
                className="input-base h-10 rounded-lg px-3 py-2 text-sm"
                placeholder="CPF (opcional)"
                value={form.cpf}
                onChange={(e) => setForm((prev) => ({ ...prev, cpf: formatCpfDigits(e.target.value) }))}
                inputMode="numeric"
              />
              <textarea
                className="input-base rounded-lg px-3 py-2 text-sm md:col-span-2"
                placeholder="Observações técnicas"
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>
          )}

          {tabAtiva === "endereco" && (
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input-base rounded-lg" placeholder="CEP" />
              <input className="input-base rounded-lg" placeholder="Rua" />
              <input className="input-base rounded-lg" placeholder="Número" />
              <input className="input-base rounded-lg" placeholder="Complemento" />
              <input className="input-base rounded-lg" placeholder="Bairro" />
              <input className="input-base rounded-lg" placeholder="Cidade" />
              <input className="input-base rounded-lg" placeholder="Estado" />
            </div>
          )}

          {tabAtiva === "adicionais" && (
            <div className="grid gap-3">
              <textarea
                className="input-base rounded-lg"
                placeholder="Histórico químico informado pelo cliente"
                rows={3}
              />
              <textarea
                className="input-base rounded-lg"
                placeholder="Sensibilidade ou desconfortos relatados"
                rows={3}
              />
              <textarea
                className="input-base rounded-lg"
                placeholder="Observações técnicas do profissional"
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Salvando..."
              : modoEdicao
                ? "Salvar alterações"
                : "Salvar cliente"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
