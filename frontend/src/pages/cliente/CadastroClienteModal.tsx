import { ChangeEvent, useEffect, useState } from "react";
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

type Props = {
  onClose: () => void;
  onSaved?: (cliente: Cliente) => void;
  clienteInicial?: Cliente | null;
};

type Tab = "dados" | "endereco" | "adicionais";

type PhoneParts = ReturnType<typeof parsePhoneParts>;

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
  const [phoneParts, setPhoneParts] = useState<PhoneParts>(initialPhoneParts);

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
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input-base rounded-lg"
                placeholder="Nome completo *"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span>Telefone *</span>
                  <span className="text-[10px] tracking-[0.15em] text-[color:var(--color-success-500)]">
                    {form.telefone || "+55 (__) _____-____"}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-within:border-[color:var(--color-success-300)] focus-within:ring-2 focus-within:ring-[color:var(--color-success-100)]">
                    <span className="text-[11px] font-semibold uppercase text-slate-400">DDI</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">+</span>
                      <input
                        type="text"
                        value={phoneParts.ddi}
                        onChange={handlePhonePartChange("ddi", 3)}
                        className="w-12 border-none bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      placeholder="DDD"
                      value={phoneParts.ddd}
                      onChange={handlePhonePartChange("ddd", 2)}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-[color:var(--color-success-300)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-success-100)]"
                      inputMode="numeric"
                    />
                    <input
                      type="text"
                      placeholder={phoneParts.number.length >= 5 ? "_____-____" : "____-____"}
                      value={formatNumberDigits(phoneParts.number)}
                      onChange={handlePhonePartChange("number", 9)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-[color:var(--color-success-300)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-success-100)]"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
              <input
                className="input-base rounded-lg"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className="input-base rounded-lg"
                placeholder="Data de nascimento"
                value={form.dataNascimento}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dataNascimento: formatDateDigits(e.target.value) }))
                }
                inputMode="numeric"
              />
              <input
                className="input-base rounded-lg"
                placeholder="CPF (opcional)"
                value={form.cpf}
                onChange={(e) => setForm((prev) => ({ ...prev, cpf: formatCpfDigits(e.target.value) }))}
                inputMode="numeric"
              />
              <textarea
                className="input-base rounded-lg md:col-span-2"
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
