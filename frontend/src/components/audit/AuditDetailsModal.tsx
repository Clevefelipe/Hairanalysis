import Card from "../ui/Card";
import Button from "../ui/Button";

interface Props {
  open: boolean;
  onClose(): void;
  log: any | null;
}

export default function AuditDetailsModal({ open, onClose, log }: Props) {
  if (!open || !log) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div style={{ width: 520 }}>
        <Card title="Detalhes do Log">
          <p><strong>Ação:</strong> {log.action}</p>
          <p><strong>Usuário:</strong> {log.userId}</p>
          <p><strong>Salão:</strong> {log.salonId}</p>
          <p>
            <strong>Data:</strong>{" "}
            {new Date(log.createdAt).toLocaleString()}
          </p>

          <div style={{ marginTop: 12 }}>
            <strong>Metadata:</strong>
            <pre
              style={{
                background: "#f3f4f6",
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                marginTop: 6,
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {JSON.stringify(log.metadata ?? {}, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
