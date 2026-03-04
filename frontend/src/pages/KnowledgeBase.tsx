import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  RefreshCw,
  Sparkles,
  BookPlus,
  Eye,
  Trash2,
} from "lucide-react";
import {
  deleteKnowledgeDocumentGroup,
  getKnowledgeDocumentGroupPreview,
  ingestKnowledgeFile,
  ingestKnowledgeText,
  KnowledgeDocumentGroupRow,
  listKnowledgeDocuments,
  searchKnowledge,
} from "@/services/knowledge.service";
import { useToast } from "@/components/ui/ToastProvider";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ConfirmModal";

type Domain = "capilar" | "tricologia";

export default function KnowledgeBase() {
  const { notify } = useToast();
  const [domain, setDomain] = useState<Domain>("capilar");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ content: string; score: number }>
  >([]);

  const [documents, setDocuments] = useState<KnowledgeDocumentGroupRow[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [previewMeta, setPreviewMeta] = useState<{
    title?: string;
    sourceType?: string;
    chunks?: number;
    createdAt?: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocumentGroupRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const previewTitle = useMemo(() => {
    if (!previewMeta) return "Pré-visualização";
    const base = previewMeta.title?.trim() ? previewMeta.title : "Sem título";
    const extra =
      previewMeta.sourceType || previewMeta.chunks || previewMeta.createdAt
        ? ` (${[
            previewMeta.sourceType ? `Tipo: ${previewMeta.sourceType}` : null,
            typeof previewMeta.chunks === "number" ? `Chunks: ${previewMeta.chunks}` : null,
            previewMeta.createdAt ? `Data: ${new Date(previewMeta.createdAt).toLocaleString()}` : null,
          ]
            .filter(Boolean)
            .join(" | ")})`
        : "";
    return `${base}${extra}`;
  }, [previewMeta]);

  async function refreshDocuments() {
    setLoadingDocuments(true);
    try {
      const res = await listKnowledgeDocuments(domain);
      setDocuments(res);
    } catch {
      notify("Erro ao carregar documentos.", "error");
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      notify("Digite uma busca.", "error");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await searchKnowledge(searchQuery.trim(), domain);
      setSearchResults(Array.isArray(res) ? res : []);
    } catch {
      setSearchResults([]);
      notify("Erro ao buscar na Central de Análises.", "error");
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  async function handleTextSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await ingestKnowledgeText({
        content,
        domain,
        language: "pt",
        title: title || undefined,
      });
      setStatus("Conteúdo salvo e indexado com sucesso.");
      notify("Conteúdo salvo com sucesso.", "success");
      setContent("");
      setTitle("");
      await refreshDocuments();
    } catch {
      setStatus("Erro ao salvar conteúdo.");
      notify("Erro ao salvar conteúdo.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      await ingestKnowledgeFile({
        file,
        domain,
        title: title || undefined,
      });
      setStatus("Arquivo importado e indexado com sucesso.");
      notify("Arquivo importado com sucesso.", "success");
      setFile(null);
      setTitle("");
      await refreshDocuments();
    } catch {
      setStatus("Erro ao importar arquivo.");
      notify("Erro ao importar arquivo.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview(groupId: string) {
    setPreviewOpen(true);
    setPreviewText("");
    setPreviewMeta(null);
    setPreviewLoading(true);
    try {
      const res = await getKnowledgeDocumentGroupPreview(groupId, 8000);
      setPreviewText(res.previewText || "");
      setPreviewMeta({
        title: res.title,
        sourceType: res.sourceType,
        chunks: res.chunks,
        createdAt: res.createdAt,
      });
    } catch (e: any) {
      notify("Erro ao carregar conteúdo do documento.", "error");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deleteKnowledgeDocumentGroup(deleteTarget.groupId);
      const deleted = typeof res?.deleted === "number" ? res.deleted : undefined;
      notify(
        typeof deleted === "number"
          ? `Documento excluído (${deleted} chunks).`
          : "Documento excluído.",
        "success",
      );
      setDeleteTarget(null);
      await refreshDocuments();
    } catch {
      notify("Erro ao excluir documento.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalChunks = useMemo(() => {
    return documents.reduce((sum, doc) => {
      const value = typeof doc.chunks === "number" ? doc.chunks : Number(doc.chunks || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [documents]);

  const lastUpdate = useMemo(() => {
    return documents[0]?.createdAt
      ? new Date(documents[0].createdAt).toLocaleString()
      : "Sem registros";
  }, [documents]);

  const overviewCards = useMemo(() => [
    {
      label: "Materiais",
      value: documents.length,
      description: "Documentos treinando a IA.",
      icon: <BookPlus size={18} className="text-[color:var(--color-success-500)]" />,
    },
    {
      label: "Chunks indexados",
      value: totalChunks,
      description: "Blocos disponíveis para consulta.",
      icon: <Sparkles size={18} className="text-indigo-500" />,
    },
    {
      label: "Última atualização",
      value: lastUpdate,
      description: "Horário do último upload.",
      icon: <RefreshCw size={18} className="text-slate-500" />,
    },
  ], [documents.length, totalChunks, lastUpdate]);

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="panel-tight">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Gestão técnica</p>
            <div>
              <h1 className="text-[22px] font-semibold text-slate-900">Base de Conhecimento IA</h1>
              <p className="text-sm text-slate-600">
                Curadoria de protocolos, alertas técnicos e materiais para a IA.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="panel-tight transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-slate-900/5 p-3 ring-1 ring-slate-100">{card.icon}</div>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel-tight">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Configuração</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Domínio</label>
              <select
                className="clientes-input w-full"
                value={domain}
                onChange={(e) => setDomain(e.target.value as Domain)}
              >
                <option value="capilar">Capilar</option>
                <option value="tricologia">Tricologia</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Título (opcional)</label>
              <input
                className="clientes-input w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Estudo sobre porosidade capilar"
              />
            </div>
          </div>
        </div>

        <div className="panel-tight">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Importar arquivo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Envie documentos técnicos para indexação na base selecionada.
            </p>
          </div>

          <form onSubmit={handleFileSubmit} className="space-y-4">
            <label
              className={`block rounded-2xl border border-dashed p-4 transition ${
                dragActive
                  ? "border-slate-500 bg-slate-100/90 ring-4 ring-slate-200"
                  : "border-slate-300 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const droppedFile = e.dataTransfer.files?.[0] || null;
                setFile(droppedFile);
              }}
            >
              <span className="mb-2 block text-sm font-medium text-slate-700">Selecionar arquivo</span>
              <span className="mb-2 block text-xs text-slate-500">Arraste e solte aqui ou clique para escolher</span>
              <input
                type="file"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 transition focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white file:transition hover:file:bg-slate-800"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".txt,.pdf,.doc,.docx"
              />
              <span className="mt-2 block text-xs text-slate-500">Formatos aceitos: .txt, .pdf, .doc e .docx</span>
            </label>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              {file ? (
                <span>
                  Arquivo selecionado: <span className="font-medium text-slate-900">{file.name}</span>
                </span>
              ) : (
                <span>Nenhum arquivo selecionado.</span>
              )}
            </div>

            <button className="btn-primary w-full" disabled={loading || !file} type="submit">
              {loading ? "Importando..." : "Importar arquivo"}
            </button>
          </form>
        </div>
      </div>

      <div className="panel-tight">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Inserir texto manual</h2>
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Conteúdo</label>
            <textarea
              className="clientes-input w-full min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o conhecimento técnico..."
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Indexando..." : "Salvar Conhecimento"}
          </button>
        </form>
      </div>

      <div className="panel-tight">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Buscar (teste do índice)</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Termo de busca</label>
            <input
              className="clientes-input w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: porosidade alta"
            />
          </div>
          <button className="btn-secondary w-full" disabled={searchLoading} type="submit">
            {searchLoading ? "Buscando..." : "Testar Busca"}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold text-slate-900">Resultados encontrados:</p>
            {searchResults.map((res, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[color:var(--color-success-600)] uppercase tracking-wider">Score: {(res.score * 100).toFixed(1)}%</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">"{res.content}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-tight">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Materiais importados</h2>
          <button
            className="btn-outline inline-flex items-center gap-2"
            onClick={refreshDocuments}
            disabled={loadingDocuments}
            type="button"
          >
            <RefreshCw size={14} className={loadingDocuments ? "animate-spin" : ""} />
            Atualizar lista
          </button>
        </div>

        {loadingDocuments ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-5 animate-pulse rounded-full bg-slate-100" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">Nenhum material importado para este domínio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Título</th>
                  <th className="px-6 py-3 text-left">Metadados</th>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {documents.map((doc) => (
                  <tr key={doc.groupId} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">{doc.title || "Sem título"}</div>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        ID #{doc.groupId.slice(0, 8)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {doc.sourceType && (
                          <span className="rounded-full border border-slate-200 px-3 py-0.5">
                            {doc.sourceType}
                          </span>
                        )}
                        {typeof doc.chunks === "number" && (
                          <span className="rounded-full border border-slate-200 px-3 py-0.5">
                            {doc.chunks} chunks
                          </span>
                        )}
                        {doc.language && (
                          <span className="rounded-full border border-slate-200 px-3 py-0.5">
                            {doc.language.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Origem</p>
                          <p>{doc.sourceName || doc.sourceType || "--"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Chunks indexados</p>
                          <p>{typeof doc.chunks === "number" ? doc.chunks : "--"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Upload</p>
                        <p>{new Date(doc.createdAt).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn-secondary inline-flex items-center gap-1"
                          onClick={() => handlePreview(doc.groupId)}
                          type="button"
                        >
                          <Eye size={14} /> Visualizar
                        </button>
                        <button
                          className="btn-danger inline-flex items-center gap-1"
                          onClick={() => setDeleteTarget(doc)}
                          type="button"
                        >
                          <Trash2 size={14} /> Excluir
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

      {status && (
        <div className="rounded-3xl border border-[color:var(--color-success-100)] bg-[color:var(--color-success-50)] px-6 py-4 text-sm font-medium text-[color:var(--color-success-700)] shadow-sm">
          {status}
        </div>
      )}

      <Modal
        title={previewTitle}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        {previewLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">Carregando...</p>
          </div>
        ) : (
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-[13px]">
            {previewText || "(Sem conteúdo)"}
          </pre>
        )}
      </Modal>

      {deleteTarget && (
        <ConfirmModal
          title="Excluir documento"
          message={`Tem certeza que deseja remover o material "${deleteTarget.title || "Sem título"}"? Esta ação não poderá ser desfeita.`}
          confirmText="Excluir"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}
    </section>
  );
}
