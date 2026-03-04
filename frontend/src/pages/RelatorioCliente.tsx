import { useCliente } from "@/context/ClienteContext";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { useRef, useState, useEffect } from "react";
import { formatDateBr } from "@/utils/date";
import { FileText, Loader2 } from "lucide-react";
import { protocoloService, Protocolo as ProtocoloType } from "@/services/protocolo.service";
import ProtocoloEditor from "@/components/ProtocoloEditor";
import ReportQRCode from "@/components/ReportQRCode";
import Section from "@/components/ui/Section";



export default function RelatorioCliente() {
  const { cliente } = useCliente();
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);

  const [profissional, setProfissional] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [aceite, setAceite] = useState(false);

  if (!cliente) {
    return (
      <div className="section-stack animate-page-in w-full">
        <Section className="panel-tight text-center">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>Relatório da Cliente</h1>
          <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>Nenhuma cliente ativa nesta sessão.</p>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Voltar ao Dashboard
          </button>
        </Section>
      </div>
    );
  }

  const analises = Array.isArray(cliente?.analises) ? cliente.analises : [];
  const [protocolos, setProtocolos] = useState<ProtocoloType[]>([]);
  const [loadingProtocolos, setLoadingProtocolos] = useState(true);

  useEffect(() => {
    if (!cliente?.id) return;
    setLoadingProtocolos(true);
    protocoloService.getByCliente(cliente.id)
      .then((data) => setProtocolos(Array.isArray(data) ? data : []))
      .finally(() => setLoadingProtocolos(false));
  }, [cliente?.id]);

  function exportarPDF() {
    if (!pdfRef.current || !cliente) return;
    if (!aceite || !profissional || !clienteNome) {
      alert("Preencha os nomes e confirme o aceite antes de exportar o PDF.");
      return;
    }

    html2pdf()
      .set({
        margin: 10,
        filename: `relatorio-cliente-${cliente.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(pdfRef.current)
      .save();
  }


  const data = formatDateBr(new Date());

  // Exemplo de URL pública (ajustar integração real depois)
  const publicUrl = `https://hairanalysis.com.br/history/public/token_exemplo`;

  return (
    <div className="section-stack animate-page-in w-full">
      {/* AÇÕES */}
      <Section className="!panel-tight">
        <div className="flex flex-wrap gap-3">
          <button onClick={exportarPDF} className="btn-primary">
            Exportar PDF com Assinatura
          </button>
          <button onClick={() => navigate("/dashboard")} className="btn-secondary">
            Voltar
          </button>
        </div>
      </Section>

      {/* QR Code e Link público */}
      <ReportQRCode url={publicUrl} />

      {/* Editor de Protocolos */}
      <Section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} style={{ color: "var(--color-text-muted)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Protocolos Recomendados</h3>
        </div>
        
        {loadingProtocolos ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <Loader2 size={16} className="animate-spin" />
            Carregando protocolos...
          </div>
        ) : (
          <ProtocoloEditor protocolos={protocolos} onChange={setProtocolos} />
        )}
      </Section>

      {/* CONTEÚDO DO PDF */}
      <div ref={pdfRef}>
        <header className="panel-tight text-center mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>Relatório Técnico da Cliente</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Documento técnico-estético • Hair Analysis System
          </p>
        </header>

        <Section as="section">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: "var(--color-text-muted)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Identificação</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>ID</p>
              <p className="font-mono text-sm" style={{ color: "var(--color-text)" }}>{cliente.id}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Data</p>
              <p className="text-sm" style={{ color: "var(--color-text)" }}>{data}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Total de análises</p>
              <p className="text-sm" style={{ color: "var(--color-text)" }}>{analises.length}</p>
            </div>
          </div>
        </Section>

        <Section as="section">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: "var(--color-text-muted)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Histórico de Análises</h3>
          </div>
          
          {analises.length > 0 ? (
            <div className="space-y-3">
              {analises.map((a) => (
                <div
                  key={a.id || Math.random()}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Análise {a.tipo || 'Não especificada'}</h4>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                      {a.data || 'Sem data'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{a.descricao || 'Sem descrição'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>
              <FileText size={32} className="mx-auto mb-2" style={{ color: "var(--color-border)" }} />
              <p className="text-sm">Nenhuma análise encontrada</p>
            </div>
          )}
        </Section>

        <Section as="section">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: "var(--color-text-muted)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Protocolos Recomendados</h3>
          </div>
          
          {protocolos.length > 0 ? (
            <div className="space-y-3">
              {protocolos.map((p, i) => (
                <div
                  key={p.id || i}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}
                >
                  <h4 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>{p.titulo || 'Protocolo sem título'}</h4>
                  <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>{p.descricao || 'Sem descrição'}</p>
                  {p.indicacoes && Array.isArray(p.indicacoes) && p.indicacoes.length > 0 && (
                    <ul className="space-y-1">
                      {p.indicacoes.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: "var(--color-text-muted)" }}>
                          <span className="text-primary-600 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>
              <FileText size={32} className="mx-auto mb-2" style={{ color: "var(--color-border)" }} />
              <p className="text-sm">Nenhum protocolo disponível</p>
            </div>
          )}
        </Section>

        <Section as="section">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: "var(--color-text-muted)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Aceite e Assinaturas</h3>
          </div>

          <div className="rounded-xl p-4 mb-4" style={{ border: "1px solid var(--color-warning-200)", backgroundColor: "var(--color-warning-50)" }}>
            <p className="text-sm" style={{ color: "var(--color-warning-800)" }}>
              <strong>Importante:</strong> Declaro que recebi as orientações acima e estou ciente de que este relatório possui caráter técnico-estético, não clínico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Nome do Profissional</label>
              <input
                value={profissional}
                onChange={(e) => setProfissional(e.target.value)}
                className="clientes-input"
                placeholder="Digite o nome completo"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Nome da Cliente</label>
              <input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="clientes-input"
                placeholder="Digite o nome completo"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              className="rounded border-[var(--color-border)] text-primary-600 focus:ring-primary-500"
            />
            Confirmo o aceite das orientações acima
          </label>
        </Section>

        <footer className="border-t pt-6 mt-8 text-center" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Relatório gerado para uso profissional • Não clínico
          </p>
        </footer>
      </div>
    </div>
  );
}

