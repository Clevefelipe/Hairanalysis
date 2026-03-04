import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Search, ShieldAlert } from "lucide-react";
import { getAuditLogs, AuditLog } from "@/services/audit.service";
import { useAuth } from "@/context/AuthContext";
import Section from "@/components/ui/Section";
import AuditDetailsModal from "@/components/audit/AuditDetailsModal";

export default function AuditLogs() {
  const { role } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (role !== "ADMIN") return;

    setLoading(true);
    getAuditLogs(page, 20, action || undefined)
      .then((res) => {
        setLogs(Array.isArray(res.items) ? res.items : []);
        setTotal(typeof res.total === "number" ? res.total : 0);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, action, role, reloadNonce]);

  const totalPages = useMemo(() => Math.ceil(total / 20) || 1, [total]);

  if (role !== "ADMIN") {
    return (
      <section className="section-stack animate-page-in w-full">
        <Section className="flex items-center gap-3 text-sm" style={{ borderColor: "var(--color-error-100)", backgroundColor: "var(--color-error-50)", color: "var(--color-error-700)" }}>
          <ShieldAlert size={20} />
          <div>
            <p className="text-sm font-semibold">Acesso restrito</p>
            <p className="text-xs" style={{ color: "var(--color-error-600)" }}>
              Somente administradores podem visualizar os registros de auditoria.
            </p>
          </div>
        </Section>
      </section>
    );
  }

  return (
    <section className="section-stack animate-page-in w-full">
      <Section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-text-muted)" }}>
            Segurança e compliance
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Audit logs do sistema
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Monitoramos todas as ações relevantes para garantir rastreabilidade e governança.
          </p>
        </div>
        <div className="toolbar justify-end">
          <button
            className="btn-secondary"
            disabled={loading || logs.length === 0}
            title={logs.length === 0 ? "Sem registros para exportar" : "Exportar logs atuais"}
          >
            Exportar CSV
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-success-600)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-shadow hover:bg-[color:var(--color-success-500)] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-success-600)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setReloadNonce((value) => value + 1)}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </Section>

      <Section>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
          <Search size={14} />
          Filtro por ação
        </label>
        <input
          className="clientes-input mt-3 w-full"
          placeholder="Ex: LOGIN_SUCCESS, HISTORY_DOWNLOAD"
          value={action}
          onChange={(e) => {
            setPage(1);
            setAction(e.target.value);
          }}
        />
      </Section>

      <Section className="overflow-hidden p-0">
        <div
          className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>
              Registros
            </p>
            <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {total} eventos monitorados
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: "var(--color-text)", color: "white" }}
          >
            Página {page} / {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 px-4 py-4 md:px-5 md:py-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-4 animate-pulse rounded-full"
                style={{ backgroundColor: "var(--color-bg-primary)" }}
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm md:px-5" style={{ color: "var(--color-text-muted)" }}>
            <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              Nenhum log encontrado
            </p>
            <p className="mt-2">
              Ajuste o filtro por ação ou clique em <strong>Atualizar</strong> para consultar novamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" style={{ color: "var(--color-text-muted)" }}>
              <thead
                className="text-xs uppercase tracking-[0.25em]"
                style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}
              >
                <tr>
                  <th className="px-4 py-3 text-left md:px-6">Data</th>
                  <th className="px-4 py-3 text-left md:px-6">Ação</th>
                  <th className="px-4 py-3 text-left md:px-6">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer transition hover:bg-[var(--bg-primary)]"
                    onClick={() => setSelected(log)}
                  >
                    <td className="px-4 py-4 font-medium md:px-6" style={{ color: "var(--color-text)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 md:px-6">{log.action}</td>
                    <td className="px-4 py-4 md:px-6">{log.userId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="toolbar">
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </button>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-1 text-xs"
          style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}
        >
          <ShieldCheck size={14} />
          20 eventos por página
        </div>
      </Section>

      <AuditDetailsModal open={!!selected} log={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
