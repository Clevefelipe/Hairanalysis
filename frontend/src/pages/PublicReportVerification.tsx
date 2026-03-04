import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, LinkIcon } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import Section from "@/components/ui/Section";

export default function PublicReportVerification() {
  const { reportId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/reports/verify/${reportId}`);
        setData(res.data);
      } catch {
        setData({ valid: false });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [reportId]);

  if (loading) {
    return (
      <section className="animate-page-in w-full">
        <Section className="text-sm text-slate-500 shadow-sm hover:shadow-md transition-shadow">Verificando assinatura...</Section>
      </section>
    );
  }

  if (!data?.valid) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="page-hero">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-500">Verificação pública</p>
            <h1 className="page-hero-title">Relatório inválido</h1>
            <p className="page-hero-subtitle">Não encontramos uma assinatura válida para este identificador.</p>
          </div>
        </div>
        <Section className="border border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
          <ShieldOff size={20} />
          <div>
            <p className="font-semibold">Assinatura ausente ou expirada</p>
            <p className="text-sm">Confirme o link compartilhado ou solicite um novo relatório assinado.</p>
          </div>
        </Section>
      </section>
    );
  }

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="page-hero">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-success-500)]">Verificação pública</p>
          <h1 className="page-hero-title">Relatório autenticado</h1>
          <p className="page-hero-subtitle">Assinatura digital encontrada e confirmada pelo HAS.</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary focus-ring-strong" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="btn-primary focus-ring-strong" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Copiar link
          </button>
        </div>
      </div>

      <div className="grid-dense md:grid-cols-2">
        <Section className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-[color:var(--color-success-600)]">
            <ShieldCheck size={20} />
            <span className="text-xs uppercase tracking-[0.35em]">Metadados</span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Assinado por</p>
          <p className="text-lg font-semibold text-slate-900">{data.signedBy}</p>
          <p className="mt-4 text-sm text-slate-500">Data da assinatura</p>
          <p className="text-lg font-semibold text-slate-900">{new Date(data.signedAt).toLocaleString()}</p>
        </Section>

        <Section className="shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Hash criptográfico</p>
          <p className="mt-4 break-all font-mono text-sm text-slate-600">{data.signatureHash}</p>
          <p className="mt-3 text-xs text-slate-500">
            Este hash garante integridade do relatório, permitindo a qualquer pessoa validar se houve alteração.
          </p>
        </Section>
      </div>

      <Section className="flex flex-wrap items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
        <LinkIcon size={18} className="text-slate-400" />
        <span className="text-sm text-slate-500">URL pública</span>
        <code className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 break-all">
          {window.location.href}
        </code>
      </Section>
    </section>
  );
}
