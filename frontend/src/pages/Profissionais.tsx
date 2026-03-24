import { useEffect, useRef, useState, useMemo } from "react";
import { UserPlus, Users, Sparkles, ArrowUpDown } from "lucide-react";
import {
  createProfessional,
  deleteProfessional,
  listProfessionals,
  updateProfessional,
} from "@/services/authApi";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import Section from "@/components/ui/Section";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ConfirmModal";

type Professional = {
  id: string;
  email: string;
  fullName?: string;
  role: string;
};

export default function Profissionais() {
  const { notify } = useToast();
  const { role, user } = useAuth();
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editTarget, setEditTarget] = useState<Professional | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null);
  const [formError, setFormError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const createNameRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "PROFESSIONAL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<"name" | "role">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const salonId = user?.salonId;

  useEffect(() => {
    if (role !== "ADMIN" || !salonId) {
      setLoading(false);
      return;
    }

    listProfessionals(salonId)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => notify("Não foi possível carregar profissionais.", "error"))
      .finally(() => setLoading(false));
  }, [role, salonId, notify]);

  useEffect(() => {
    if (createOpen) {
      setTimeout(() => createNameRef.current?.focus(), 0);
    }
  }, [createOpen]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesTerm = term
        ? (item.fullName || "").toLowerCase().includes(term) || item.email.toLowerCase().includes(term)
        : true;
      const matchesRole = roleFilter === "ALL" ? true : item.role === roleFilter;
      return matchesTerm && matchesRole;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "name") {
        const an = (a.fullName || a.email).toLowerCase();
        const bn = (b.fullName || b.email).toLowerCase();
        return sortDirection === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      if (sortField === "role") {
        return sortDirection === "asc" ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
      }
      return 0;
    });

    return sorted;
  }, [items, searchTerm, roleFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filteredItems.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(filteredItems.length, startIndex + pageItems.length);

  function toggleSort(field: "name" | "role") {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (role !== "ADMIN" || !salonId) {
      notify("Apenas administradores podem cadastrar profissionais.", "error");
      return;
    }
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setFormError("Informe um e-mail válido.");
      return;
    }
    if (trimmedPassword.length < 8) {
      setFormError("Senha provisória deve ter pelo menos 8 caracteres.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const created = await createProfessional(
        {
          email: trimmedEmail,
          password: trimmedPassword,
          fullName,
        },
        salonId,
      );
      if (!created) {
        throw new Error("Resposta inválida ao criar profissional.");
      }
      setItems((prev) => [created, ...prev]);
      setFullName("");
      setEmail("");
      setPassword("");
      setCreateOpen(false);
      notify("Profissional cadastrado com sucesso.", "success");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível cadastrar o profissional.";
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

  function openEditModal(prof: Professional) {
    if (role !== "ADMIN" || !salonId) {
      notify("Apenas administradores podem editar.", "error");
      return;
    }
    setEditTarget(prof);
    setEditName(prof.fullName || "");
    setEditPassword("");
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditName("");
    setEditPassword("");
    setEditLoading(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || role !== "ADMIN" || !salonId) return;
    if (editPassword && editPassword.length < 8) {
      notify("Senha deve ter pelo menos 8 caracteres.", "error");
      return;
    }

    try {
      setEditLoading(true);
      const updated = await updateProfessional(salonId, editTarget.id, {
        fullName: editName || undefined,
        password: editPassword || undefined,
      });
      setItems((prev) => prev.map((p) => (p.id === editTarget.id ? { ...p, ...updated } : p)));
      notify("Profissional atualizado com sucesso.", "success");
      closeEditModal();
    } catch (err) {
      console.error(err);
      notify("Não foi possível atualizar o profissional.", "error");
      setEditLoading(false);
    }
  }

  function openDeleteModal(prof: Professional) {
    if (role !== "ADMIN" || !salonId) {
      notify("Apenas administradores podem excluir.", "error");
      return;
    }
    setDeleteTarget(prof);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || role !== "ADMIN" || !salonId) return;
    try {
      await deleteProfessional(salonId, deleteTarget.id);
      setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      notify("Profissional excluído.", "success");
    } catch (err) {
      console.error(err);
      notify("Não foi possível excluir o profissional.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <section className="section-stack animate-page-in w-full">
      <Section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            Administração
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>Profissionais</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Gerencie os profissionais do salão.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <Sparkles size={14} className="text-[color:var(--color-success-600)]" />
            Gestão de equipe
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <Users size={14} /> {items.length} ativos
          </span>
        </div>
      </Section>

      {role !== "ADMIN" ? (
        <div className="panel-tight border-rose-100 bg-rose-50 text-sm text-rose-700">
          Apenas administradores podem acessar o cadastro de profissionais.
        </div>
      ) : !salonId ? (
        <div className="panel-tight border-amber-100 bg-amber-50 text-sm text-amber-800">
          Nenhum salão associado ao seu usuário. Vincule-se a um salão para habilitar o cadastro.
        </div>
      ) : (
        <div className="panel-tight space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>Equipe</p>
              <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>Profissionais cadastrados</h2>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Gerencie a equipe com busca, filtro e paginação.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-900">
                <UserPlus size={14} /> {items.length} ativos
              </span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-900">
                <ArrowUpDown size={14} /> Ordenação: {sortField === "name" ? "Nome" : "Perfil"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-900">
                {startIndex + 1}–{endIndex} de {filteredItems.length}
              </span>
              <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
                Novo profissional
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <input
              className={inputClass}
              placeholder="Buscar por nome ou e-mail"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar profissional"
            />
            <select
              className={inputClass}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              aria-label="Filtrar por perfil"
            >
              <option value="ALL">Todos os perfis</option>
              <option value="ADMIN">Administradores</option>
              <option value="PROFESSIONAL">Profissionais</option>
            </select>
            <select
              className={inputClass}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Registros por página"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  Mostrar {size}
                </option>
              ))}
            </select>
            <div className="flex gap-2 md:justify-end">
              <button
                type="button"
                className="btn-secondary w-full md:w-auto"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("ALL");
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                <p className="mb-3">Nenhum profissional cadastrado ainda.</p>
                <div className="flex justify-center">
                  <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
                    Novo profissional
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Código</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 cursor-pointer select-none"
                        onClick={() => toggleSort("name")}
                      >
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">E-mail</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 cursor-pointer select-none"
                        onClick={() => toggleSort("role")}
                      >
                        Perfil
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pageItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{startIndex + idx + 1}</td>
                        <td className="px-4 py-3 text-slate-900 font-semibold min-w-[160px]">{item.fullName || "Sem nome"}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={item.email}>
                          {item.email}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-semibold text-[13px] uppercase tracking-[0.12em]">
                          {item.role}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" className="btn-secondary text-xs" onClick={() => openEditModal(item)}>
                              Editar
                            </button>
                            <button type="button" className="btn-danger text-xs" onClick={() => openDeleteModal(item)}>
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              Exibindo {pageItems.length === 0 ? 0 : startIndex + 1}–{endIndex} de {filteredItems.length} resultados
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="text-xs text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal title="Editar profissional" isOpen={!!editTarget} onClose={closeEditModal}>
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <p className="text-sm text-slate-500">{editTarget?.email}</p>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="edit-name">
              Nome completo (edição)
            </label>
            <input
              id="edit-name"
              className={inputClass}
              placeholder="Nome completo"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="edit-password">
              Nova senha (opcional)
            </label>
            <input
              id="edit-password"
              className={inputClass}
              type="password"
              placeholder="Nova senha (mín. 8 caracteres)"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
            />
            <p className="text-xs text-slate-500">Deixe em branco para manter a senha atual.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={closeEditModal} disabled={editLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={editLoading}>
              {editLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      {deleteTarget && (
        <ConfirmModal
          title="Excluir profissional"
          message={`Excluir ${deleteTarget.fullName || deleteTarget.email}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <Modal title="Cadastrar profissional" isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-500">Preencha os dados do novo profissional.</p>
          </div>
          <input
            className={inputClass}
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            ref={createNameRef}
          />
          <input
            className={inputClass}
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />
          <input
            className={inputClass}
            placeholder="Senha provisória"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="md:col-span-2 space-y-2">
            {formError && <p className="text-xs text-rose-600">{formError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                disabled={saving || !email.trim() || password.trim().length < 8}
                type="submit"
              >
                {saving ? "Salvando..." : "Cadastrar"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </section>
  );
}
