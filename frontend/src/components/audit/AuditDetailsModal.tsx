import Modal from "../ui/Modal";

interface Props {
  open: boolean;
  onClose(): void;
  log: any | null;
}

export default function AuditDetailsModal({ open, onClose, log }: Props) {
  if (!open || !log) return null;

  return (
    <Modal title="Detalhes do Log" isOpen={open} onClose={onClose}>
      <div className="space-y-2 text-sm text-slate-700">
        <p>
          <strong className="text-slate-900">Ação:</strong> {log.action}
        </p>
        <p>
          <strong className="text-slate-900">Usuário:</strong> {log.userId}
        </p>
        <p>
          <strong className="text-slate-900">Salão:</strong> {log.salonId}
        </p>
        <p>
          <strong className="text-slate-900">Data:</strong> {new Date(log.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <strong className="text-sm text-slate-900">Metadata:</strong>
        <pre className="max-h-64 overflow-auto rounded-2xl bg-slate-50 p-3 text-xs font-mono text-slate-700 shadow-inner">
          {JSON.stringify(log.metadata ?? {}, null, 2)}
        </pre>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn-secondary" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  );
}
