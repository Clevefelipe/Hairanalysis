import { useEffect, useMemo, useState } from "react";
import { Sparkles, PlusCircle, Pencil, Trash2, Power } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  listStraightenings,
  createStraightening,
  updateStraightening,
  deleteStraightening,
  toggleStraighteningStatus,
  Straightening,
} from "@/services/straightening.service";
import {
  computeAlisamentoMatch,
  AnaliseCapilarResumo,
} from "@/engine/alisamentoRecomendador";
import { useToast } from "@/components/ui/ToastProvider";

const HAIR_TYPES = ["Liso", "Ondulado", "Cacheado", "Crespo", "Afro"];
const HAIR_STRUCTURES = ["Fina", "Média", "Grossa"];
const VOLUME_LEVELS = ["Baixo", "Médio", "Alto"];
const DAMAGE = ["Leve", "Moderado", "Severo"];

type StraighteningForm = {
  name: string;
  description: string;
  criteria: {
    hairTypes: string[];
    structures: string[];
    volume: string[];
    damageLevel: string[];
    observations: string;
  };
};

export default function Alisamentos() {
  const { notify } = useToast();

  const [items, setItems] = useState<Straightening[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Straightening | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { type: "delete" | "toggle"; item: Straightening }
    | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState<StraighteningForm>({
    name: "",
    description: "",
    criteria: {
      hairTypes: [],
      structures: [],
      volume: [],
      damageLevel: [],
      observations: "",
    },
  });

  /* =========================
     🧠 RESUMO DA ANÁLISE CAPILAR
     ========================= */
  let resumoRaw: any = {};
  try {
    resumoRaw = JSON.parse(
      sessionStorage.getItem("resultadoAnaliseCapilar") || "{}"
    );
  } catch {}

  const resumo: AnaliseCapilarResumo = {
    nivel: resumoRaw?.nivel,
    tipoFio: Array.isArray(resumoRaw?.tipoFio) ? resumoRaw.tipoFio : [],
    estadoFio: Array.isArray(resumoRaw?.estadoFio) ? resumoRaw.estadoFio : [],
    comportamentoFio: Array.isArray(resumoRaw?.comportamentoFio)
      ? resumoRaw.comportamentoFio
      : [],
  };

  /* =========================
     📡 LOAD
     ========================= */
  useEffect(() => {
    listStraightenings(true)
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setItems([]);
        notify("Não foi possível carregar os alisamentos.", "error");
      });
  }, []);

  function toggle(list: string[], value: string) {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function toggleCriterion(
    key: keyof StraighteningForm["criteria"],
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: toggle(Array.isArray(prev.criteria[key]) ? prev.criteria[key] : [], value),
      },
    }));
  }

  const formValido =
    form.name.trim().length > 2 &&
    (form.criteria.hairTypes.length > 0 ||
      form.criteria.damageLevel.length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValido) {
      notify("Preencha ao menos o nome e um critério técnico.", "error");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateStraightening(editing.id, {
          name: form.name,
          description: form.description,
          active: editing.active,
          criteria: form.criteria,
        });
        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        notify("Alisamento atualizado com sucesso.", "success");
      } else {
        const created = await createStraightening({
          name: form.name,
          description: form.description,
          active: true,
          criteria: form.criteria,
        });
        setItems((prev) => [created, ...prev]);
        notify("Alisamento cadastrado com sucesso.", "success");
      }
      setModalOpen(false);
      setForm({
        name: "",
        description: "",
        criteria: {
          hairTypes: [],
          structures: [],
          volume: [],
          damageLevel: [],
          observations: "",
        },
      });
      setEditing(null);
    } catch {
      notify("Não foi possível salvar o alisamento.", "error");
    } finally {
      setSaving(false);
    }
  }

  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        computeAlisamentoMatch(b, resumo).score -
        computeAlisamentoMatch(a, resumo).score
    );
  }, [items, resumo]);

  function openCreateModal() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      criteria: {
        hairTypes: [],
        structures: [],
        volume: [],
        damageLevel: [],
        observations: "",
      },
    });
    setModalOpen(true);
  }

  function openEditModal(item: Straightening) {
    setEditing(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      criteria: {
        hairTypes: item.criteria?.hairTypes || [],
        structures: (item as any)?.criteria?.structures || [],
        volume: (item as any)?.criteria?.volume || [],
        damageLevel: item.criteria?.damageLevel || [],
        observations: item.criteria?.observations || "",
      },
    });
    setModalOpen(true);
  }

  async function confirmDelete(item: Straightening) {
    setConfirmAction({ type: "delete", item });
  }

  async function confirmToggle(item: Straightening) {
    setConfirmAction({ type: "toggle", item });
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    const { type, item } = confirmAction;
    setActionLoading(true);
    try {
      if (type === "delete") {
        await deleteStraightening(item.id);
        setItems((prev) => prev.filter((p) => p.id !== item.id));
        notify("Alisamento excluído com sucesso.", "success");
      } else {
        const updated = await toggleStraighteningStatus(item.id, !item.active);
        setItems((prev) =>
          prev.map((service) => (service.id === item.id ? updated : service)),
        );
        notify(
          updated.active
            ? "Alisamento reativado com sucesso."
            : "Alisamento desativado.",
          "success",
        );
      }
    } catch {
      notify("Não foi possível concluir a ação.", "error");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  const modalTitle = editing ? "Editar alisamento" : "Cadastrar alisamento";

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Gestão técnica
          </p>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Protocolos de alisamento</h1>
            <p className="text-sm text-slate-500">
              Cadastre e valide procedimentos compatíveis com as análises IA.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button className="btn-primary" onClick={openCreateModal}>
            <PlusCircle size={16} />
            Cadastrar alisamento
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Protocolos
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {sorted.length} fórmulas cadastradas
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            <Sparkles size={14} /> compatibilidade baseada no último resumo de análise
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              <tr>
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">Compatibilidade IA</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((item) => {
                const match = computeAlisamentoMatch(item, resumo);
                const criteria = item.criteria || {};
                return (
                  <tr key={item.id} className="bg-white transition hover:bg-slate-50/60">
                    <td className="px-6 py-4 align-top">
                      <div className="text-base font-semibold text-slate-900">{item.name}</div>
                      {item.description && (
                        <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                      )}
                      <div className="mt-4 space-y-2">
                        {Array.isArray(criteria.hairTypes) && criteria.hairTypes.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {criteria.hairTypes.map((type) => (
                              <span
                                key={`${item.id}-hair-${type}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-semibold"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                        {Array.isArray((item as any)?.criteria?.structures) && (item as any).criteria.structures.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {(item as any).criteria.structures.map((structure: string) => (
                              <span
                                key={`${item.id}-structure-${structure}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-semibold"
                              >
                                {structure}
                              </span>
                            ))}
                          </div>
                        )}
                        {Array.isArray((item as any)?.criteria?.volume) && (item as any).criteria.volume.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {(item as any).criteria.volume.map((volume: string) => (
                              <span
                                key={`${item.id}-volume-${volume}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-semibold"
                              >
                                {volume}
                              </span>
                            ))}
                          </div>
                        )}
                        {Array.isArray(criteria.damageLevel) && criteria.damageLevel.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {criteria.damageLevel.map((damage) => (
                              <span
                                key={`${item.id}-damage-${damage}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-semibold"
                              >
                                {damage}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-slate-900">{match.score}%</span>
                        {match.recomendado && (
                          <span className="rounded-full bg-[color:var(--color-success-50)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-success-700)]">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.active ? (
                        <span className="rounded-full bg-[color:var(--color-success-50)] px-3 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">Ativo</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button className="btn-secondary text-sm" onClick={() => openEditModal(item)}>
                          <Pencil size={14} /> Editar
                        </button>
                        <button className="btn-secondary text-sm" onClick={() => confirmToggle(item)}>
                          <Power size={14} /> {item.active ? "Desativar" : "Ativar"}
                        </button>
                        <button className="btn-danger text-sm" onClick={() => confirmDelete(item)}>
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={modalTitle}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Informações básicas</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">Nome do alisamento</label>
                <input
                  className="clientes-input w-full"
                  placeholder="Ex: Progressiva Orgânica"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">Descrição técnica</label>
                <textarea
                  className="clientes-textarea w-full"
                  rows={2}
                  placeholder="Informações técnicas, química utilizada, restrições..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Critérios técnicos</h3>

            <div>
              <p className="mb-4 text-sm font-semibold text-slate-700">Tipo de cabelo indicado</p>
              <div className="flex flex-wrap gap-3">
                {HAIR_TYPES.map((type) => {
                  const active = form.criteria.hairTypes.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleCriterion("hairTypes", type)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-700">Estrutura do fio indicada</p>
                <div className="flex flex-wrap gap-3">
                  {HAIR_STRUCTURES.map((structure) => {
                    const active = form.criteria.structures.includes(structure);
                    return (
                      <button
                        type="button"
                        key={structure}
                        onClick={() => toggleCriterion("structures", structure)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {structure}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-700">Volume capilar indicado</p>
                <div className="flex flex-wrap gap-3">
                  {VOLUME_LEVELS.map((volume) => {
                    const active = form.criteria.volume.includes(volume);
                    return (
                      <button
                        type="button"
                        key={volume}
                        onClick={() => toggleCriterion("volume", volume)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {volume}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-slate-700">Nível de dano compatível</p>
              <div className="flex flex-wrap gap-3">
                {DAMAGE.map((damage) => {
                  const active = form.criteria.damageLevel.includes(damage);
                  return (
                    <button
                      type="button"
                      key={damage}
                      onClick={() => toggleCriterion("damageLevel", damage)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {damage}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-600">Observações para IA</label>
              <textarea
                className="clientes-textarea w-full"
                rows={3}
                placeholder="Ex: não recomendado para fios loiros descoloridos ou para redução extrema de volume."
                value={form.criteria.observations}
                onChange={(e) =>
                  setForm({
                    ...form,
                    criteria: {
                      ...form.criteria,
                      observations: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              type="submit"
              className="btn-primary w-full focus-ring-strong"
              disabled={!formValido || saving}
            >
              {saving ? "Salvando..." : editing ? "Atualizar" : "Salvar Alisamento"}
            </button>
          </div>
        </form>
      </Modal>

      {confirmAction && (
        <ConfirmModal
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          loading={actionLoading}
          message={
            confirmAction.type === "delete"
              ? "Deseja remover este alisamento de forma permanente?"
              : confirmAction.item.active
                ? "O serviço ficará indisponível para recomendações até ser reativado."
                : "Reativar o serviço para voltar a sugeri-lo nas recomendações."
          }
          confirmText={confirmAction.type === "delete" ? "Excluir" : "Confirmar"}
          cancelText="Cancelar"
          title={
            confirmAction.type === "delete"
              ? "Excluir alisamento"
              : confirmAction.item.active
                ? "Desativar alisamento"
                : "Ativar alisamento"
          }
        />
      )}
    </section>
  );
}
