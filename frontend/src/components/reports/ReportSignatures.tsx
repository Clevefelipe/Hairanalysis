interface Signature {
  role: "TECHNICIAN" | "RESPONSIBLE";
  name: string;
  document: string;
  signedAt: string;
}

export default function ReportSignatures({
  signatures
}: {
  signatures: Signature[];
}) {
  return (
    <div className="mt-8 space-y-4">
      {signatures.map(sig => (
        <div
          key={sig.role}
          className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"
        >
          <strong className="text-sm font-semibold text-slate-900">
            {sig.role === "TECHNICIAN"
              ? "Técnico Responsável"
              : "Responsável Técnico"}
          </strong>
          <div className="text-sm text-slate-700">{sig.name}</div>
          <div className="text-xs text-slate-500">Documento: {sig.document}</div>
          <div className="text-[11px] text-slate-400">
            Assinado em {new Date(sig.signedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
