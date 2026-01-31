import { useEffect, useState } from "react";
import { getAuditLogs, AuditLog } from "../services/audit.service";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import AuditDetailsModal from "../components/audit/AuditDetailsModal";

export default function AuditLogs() {
  const { role } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (role !== "ADMIN") return;

    setLoading(true);
    getAuditLogs(page, 20, action || undefined)
      .then((res) => {
        setLogs(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, action, role]);

  if (role !== "ADMIN") {
    return (
      <p style={{ padding: 24, color: "#b91c1c" }}>
        Acesso restrito a administradores.
      </p>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>
        Audit Logs do Sistema
      </h1>

      <div style={{ margin: "16px 0", display: "flex", gap: 12 }}>
        <input
          placeholder="Filtrar por ação (ex: LOGIN_SUCCESS)"
          value={action}
          onChange={(e) => {
            setPage(1);
            setAction(e.target.value);
          }}
          style={{ padding: 8, width: 320 }}
        />
      </div>

      {loading ? (
        <p>Carregando logs...</p>
      ) : logs.length === 0 ? (
        <p>Nenhum log encontrado.</p>
      ) : (
        <Card title={`Registros (${total})`}>
          <table
            style={{
              width: "100%",
              fontSize: 14,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Data</th>
                <th>Ação</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelected(log)}
                  style={{
                    cursor: "pointer",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <td>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>{log.action}</td>
                  <td>{log.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <span style={{ margin: "0 12px" }}>
          Página {page}
        </span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * 20 >= total}
        >
          Próxima
        </Button>
      </div>

      <AuditDetailsModal
        open={!!selected}
        log={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
