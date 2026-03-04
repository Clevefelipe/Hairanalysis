import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageCircle,
  PencilLine,
  Phone,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { excluirCliente } from "@/core/cliente/cliente.service";
import { useToast } from "@/components/ui/ToastProvider";

function formatClientCode(value?: string | null) {
  const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  if (!clean) return "--";
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

type Props = {
  clientes: any[];
  loading: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  focusId?: string | null;
  onClientDeleted?: (id: string) => void;
  onEditCliente?: (cliente: any) => void;
};

export default function ClientesLista({
  clientes,
  loading,
  selectedIds = [],
  onSelectionChange,
  focusId,
  onClientDeleted,
  onEditCliente,
}: Props) {
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];
  const [detailClient, setDetailClient] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { notify } = useToast();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const iconButtonClass =
    "rounded-md border p-1.5 transition focus-ring-strong border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-success-200)] hover:text-[color:var(--color-success-600)]";
  const destructiveIconButtonClass =
    "rounded-md border p-1.5 transition focus-ring-strong border-[color:var(--color-error-200)] text-[color:var(--color-error-500)] hover:border-[color:var(--color-error-300)] hover:text-[color:var(--color-error-600)]";
  const paginationButtonBase =
    "rounded-md border px-2 py-1 text-xs font-medium transition focus-ring-strong border-[color:var(--color-border)] hover:border-[color:var(--color-primary-200)] hover:bg-[color:var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-40";
  const paginationPageButtonBase =
    "h-7 min-w-7 rounded-md border px-2 text-xs transition focus-ring-strong border-[color:var(--color-border)] hover:border-[color:var(--color-primary-200)] hover:bg-[color:var(--color-primary-light)]";

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const handleToggleOne = (id: string) => {
    if (!onSelectionChange) return;
    if (safeSelectedIds.includes(id)) {
      onSelectionChange(safeSelectedIds.filter((selected) => selected !== id));
    } else {
      onSelectionChange([...safeSelectedIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    const visibleIds = paginatedClientes.map((cliente) => cliente?.id || "").filter(Boolean);
    const allVisibleSelected = visibleIds.every((id) => safeSelectedIds.includes(id));
    if (allVisibleSelected) {
      onSelectionChange(safeSelectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = new Set([...safeSelectedIds, ...visibleIds]);
      onSelectionChange(Array.from(merged));
    }
  };

  const totalPages = Math.max(1, Math.ceil(safeClientes.length / pageSize));

  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return safeClientes.slice(start, start + pageSize);
  }, [safeClientes, currentPage, pageSize]);

  const visiblePages = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [currentPage, totalPages]);

  const allVisibleSelected = useMemo(() => {
    if (!paginatedClientes.length) return false;
    const visibleIds = paginatedClientes.map((cliente) => cliente?.id || "").filter(Boolean);
    return visibleIds.length > 0 && visibleIds.every((id) => safeSelectedIds.includes(id));
  }, [paginatedClientes, safeSelectedIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!focusId) return;
    const element = rowRefs.current[focusId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-[color:var(--color-success-300)]", "ring-2");
      const timeout = setTimeout(() => {
        element.classList.remove("ring-[color:var(--color-success-300)]", "ring-2");
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [focusId]);

  if (loading) {
    return (
      <div className="panel premium-card">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-6 animate-pulse rounded-full"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-border) 65%, transparent)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (safeClientes.length === 0) {
    return (
      <div
        className="panel premium-card border border-dashed text-center"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
      >
        <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          Nenhum cliente encontrado
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cadastre um cliente ou ajuste os filtros para visualizar os cartões técnicos.
        </p>
      </div>
    );
  }

  function getStatus(cliente: any) {
    if (!cliente.telefone || !cliente.cpf) {
      return {
        label: "Dados incompletos",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <AlertTriangle size={12} />,
      };
    }

    return {
      label: "Pronto para IA",
      className:
        "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] border-[color:var(--color-success-200)]",
      icon: <Sparkles size={12} />,
    };
  }

  function getInitials(name?: string) {
    if (!name) return "CL";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  return (
    <div className="panel premium-card overflow-hidden p-0 animate-page-in border" style={{ borderColor: "var(--color-border)" }}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[color:var(--color-border)]">
          <colgroup>
            <col className="w-10" />
            <col className="w-[88px]" />
            <col className="w-[280px]" />
            <col className="w-[170px]" />
            <col className="w-[160px]" />
            <col className="w-[120px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[140px]" />
            <col className="w-[70px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead
            className="text-[11px] font-semibold"
            style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}
          >
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[color:var(--color-border)] text-[color:var(--color-success-600)] focus:ring-[color:var(--color-success-500)]"
                  checked={allVisibleSelected}
                  onChange={handleToggleAll}
                />
              </th>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">CPF</th>
              <th className="px-4 py-3 text-left">Nascimento</th>
              <th className="px-4 py-3 text-left">Sexo</th>
              <th className="px-4 py-3 text-left">Visitas</th>
              <th className="px-4 py-3 text-left">Última visita</th>
              <th className="px-4 py-3 text-left">Faltas</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)] text-sm" style={{ color: "var(--color-text)" }}>
            {paginatedClientes.map((cliente) => {
              if (!cliente || !cliente.id) return null;
              const status = getStatus(cliente);
              const lastVisit = cliente.ultimaVisita
                ? dateFormatter.format(new Date(cliente.ultimaVisita))
                : "Sem registros";
              const nascimento = cliente.dataNascimento
                ? dateFormatter.format(new Date(cliente.dataNascimento))
                : "--";
              const visitas = cliente.visitas ?? cliente.totalVisitas ?? 0;
              const faltas = cliente.faltas ?? cliente.totalFaltas ?? 0;
              const genero = cliente.genero || cliente.sexo || "—";
              const isFocused = focusId === cliente.id;
              const whatsappPhone = String(cliente.telefone || "").replace(/\D/g, "");
              const canOpenWhatsapp = whatsappPhone.length >= 10;

              return (
                <tr
                  key={cliente.id || Math.random()}
                  ref={(node) => {
                    rowRefs.current[cliente.id || Math.random().toString()] = node;
                  }}
                  className={`transition ${
                    isFocused
                      ? "bg-[color:var(--color-success-50)]/80 shadow-sm"
                      : "hover:bg-[color:var(--bg-primary)]"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[color:var(--color-border)] text-[color:var(--color-success-600)] focus:ring-[color:var(--color-success-500)]"
                      checked={safeSelectedIds.includes(cliente.id)}
                      onChange={() => handleToggleOne(cliente.id)}
                    />
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>
                    #{formatClientCode(cliente.id)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <button
                        className={`text-left focus-ring-strong ${
                          isFocused
                            ? "text-[color:var(--color-success-700)]"
                            : "text-[color:var(--color-text)] hover:text-[color:var(--color-success-600)]"
                        }`}
                        onClick={() => setDetailClient(cliente)}
                      >
                        <span
                          className="font-semibold transition"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {cliente.nome || "Cliente sem nome"}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {status.icon}
                          {status.label}
                          {isFocused && (
                            <span className="rounded-full border border-[color:var(--color-success-200)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-success-600)]">
                              Foco ativo
                            </span>
                          )}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[color:var(--color-text-muted)]" />
                      {cliente.telefone || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <UserRound size={14} className="text-[color:var(--color-text-muted)]" />
                      {cliente.cpf || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{nascimento}</td>
                  <td className="px-4 py-2.5">{genero}</td>
                  <td className="px-4 py-2.5 text-center">{visitas}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} className="text-[color:var(--color-text-muted)]" />
                      {lastVisit}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">{faltas}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className={iconButtonClass}
                        onClick={() => navigate(`/historico?clientId=${cliente.id}`)}
                        title="Histórico"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        className={iconButtonClass}
                        onClick={() => navigate(`/analise-capilar?clientId=${cliente.id}`)}
                        title="Nova análise"
                      >
                        <Sparkles size={16} />
                      </button>
                      <button
                        className={[
                          iconButtonClass,
                          canOpenWhatsapp
                            ? ""
                            : "cursor-not-allowed opacity-40 hover:border-[color:var(--color-border)] hover:text-[color:var(--color-border)]",
                        ].join(" ")}
                        onClick={() =>
                          canOpenWhatsapp &&
                          window.open(`https://wa.me/${whatsappPhone}`, "_blank")
                        }
                        title="WhatsApp"
                        disabled={!canOpenWhatsapp}
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        className={iconButtonClass}
                        onClick={() => onEditCliente?.(cliente)}
                        title="Editar cadastro"
                      >
                        <PencilLine size={16} />
                      </button>

                      <button
                        className={destructiveIconButtonClass}
                        onClick={() => setDeleteTarget(cliente)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-sm"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
      >
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border bg-white px-2 py-1 text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            {[10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>clientes</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className={paginationButtonBase}
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            Primeira
          </button>

          <button
            type="button"
            className={`${paginationButtonBase} inline-flex items-center gap-1`}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} />
          </button>

          {visiblePages[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`${paginationPageButtonBase} h-8 px-2`}
              >
                1
              </button>
              {visiblePages[0] > 2 && (
                <span className="px-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  ...
                </span>
              )}
            </>
          )}

          {visiblePages.map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={[
                  paginationPageButtonBase,
                  isActive
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white font-bold"
                    : "text-[color:var(--color-text-muted)] font-semibold",
                ].join(" ")}
              >
                {page}
              </button>
            );
          })}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  ...
                </span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className={`${paginationPageButtonBase} h-8 px-2`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            className={`${paginationButtonBase} inline-flex items-center gap-1 px-2.5 py-1.5`}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            className={`${paginationButtonBase} px-2.5 py-1.5`}
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Última
          </button>
        </div>
      </div>

      {detailClient && (
        <Modal
          title="Detalhes do cliente"
          isOpen={Boolean(detailClient)}
          onClose={() => setDetailClient(null)}
        >
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Nome</span>
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {detailClient.nome || "Não informado"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Telefone</span>
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {detailClient.telefone || "Não informado"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>E-mail</span>
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {detailClient.email || "Não informado"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>CPF</span>
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {detailClient.cpf || "Não informado"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Data de nascimento</span>
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {detailClient.dataNascimento
                  ? dateFormatter.format(new Date(detailClient.dataNascimento))
                  : "Não informado"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Última visita</span>
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {detailClient.ultimaVisita
                  ? dateFormatter.format(new Date(detailClient.ultimaVisita))
                  : "Sem registros"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              className="btn-secondary focus-ring-strong"
              onClick={() => setDetailClient(null)}
            >
              Fechar
            </button>
            {onEditCliente && (
              <button
                className="btn-outline focus-ring-strong"
                onClick={() => {
                  setDetailClient(null);
                  onEditCliente(detailClient);
                }}
              >
                Editar cadastro
              </button>
            )}
            <button
              className="btn-primary focus-ring-strong"
              onClick={() => {
                setDetailClient(null);
                navigate(`/historico?clientId=${detailClient.id}`);
              }}
            >
              Ver histórico
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir cliente"
          message={`Tem certeza que deseja remover ${deleteTarget.nome || "este cliente"}? Todas as análises associadas serão apagadas, não será possível recuperar este cadastro.`}
          confirmText="Excluir"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              setDeleting(true);
              await excluirCliente(deleteTarget.id);
              notify("Cliente excluído com sucesso.", "success");
              onClientDeleted?.(deleteTarget.id);
              setDeleteTarget(null);
            } catch {
              notify("Não foi possível excluir o cliente.", "error");
            } finally {
              setDeleting(false);
            }
          }}
          loading={deleting}
        />
      )}
    </div>
  );
}
