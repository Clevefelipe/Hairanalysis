import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClientesLista from "./components/ClientesLista";
import CadastroClienteModal from "./CadastroClienteModal";
import ConfirmModal from "../../components/ConfirmModal";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastProvider";
import {
  criarCliente,
  excluirCliente,
  listarClientes,
  type ClienteSearchScope,
} from "../../core/cliente/cliente.service";
import { Search, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type ImportClientDraft = {
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  dataNascimento?: string;
  observacoes?: string;
};

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const normalizeDate = (value?: string) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return undefined;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return `${year}-${month}-${day}`;
  }

  return trimmed;
};

const detectCsvDelimiter = (content: string) => {
  const firstLine = content.split(/\r?\n/, 1)[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
};

const parseCsvRows = (content: string, delimiter: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      const next = content[index + 1];
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && content[index + 1] === "\n") {
        index += 1;
      }
      row.push(value.trim());
      value = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
};

const parseClientCsv = (raw: string) => {
  const content = raw.replace(/^\uFEFF/, "");
  const delimiter = detectCsvDelimiter(content);
  const rows = parseCsvRows(content, delimiter);

  if (!rows.length) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headerMap = headerRow.map((cell) => normalizeHeader(cell));

  return dataRows
    .map((row) => {
      const record = Object.fromEntries(
        headerMap.map((header, index) => [header, row[index] || ""]),
      ) as Record<string, string>;

      const draft: ImportClientDraft = {
        nome: record.nome?.trim() || "",
        telefone: record.telefone?.trim() || undefined,
        email: record.email?.trim() || undefined,
        cpf: record.cpf?.trim() || undefined,
        dataNascimento: normalizeDate(record.datanascimento || record.data_nascimento),
        observacoes: record.observacoes?.trim() || undefined,
      };

      return draft;
    })
    .filter((item) => item.nome.trim().length > 0);
};

export default function VisaoGeralCliente() {
  const [busca, setBusca] = useState("");
  const [buscaCodigo, setBuscaCodigo] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<any | null>(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchScope, setSearchScope] = useState("nome");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDialog, setActiveDialog] = useState<
    "remover" | "duplicados" | "excel" | "importar" | null
  >(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportScope, setExportScope] = useState<"selecionados" | "filtro">(
    "selecionados",
  );
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skipped: number;
    failed: number;
    samples: string[];
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const { logout } = useAuth();
  const [focusedClientId, setFocusedClientId] = useState<string | null>(null);
  const [focusedClient, setFocusedClient] = useState<any | null>(null);
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      listarClientes({
        q: busca.trim() || undefined,
        scope: busca.trim() ? (searchScope as ClienteSearchScope) : undefined,
      })
        .then((data) => {
          if (active) setClientes(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          if (active) {
            setClientes([]);
            if (error?.response?.status === 401) {
              notify("Sessão expirada. Faça login novamente.", "warning");
              logout();
            }
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [busca, searchScope]);

  useEffect(() => {
    setSelectedIds((prev) =>
      (Array.isArray(prev) ? prev : []).filter((id) =>
        Array.isArray(safeClientes) && safeClientes.some((cliente) => cliente?.id === id),
      ),
    );
  }, [safeClientes]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryTerm = params.get("q")?.trim();
    if (queryTerm && queryTerm !== busca) {
      setBusca(queryTerm);
    }

    const clientIdParam = params.get("clientId");
    if (clientIdParam) {
      setFocusedClientId(clientIdParam);
    } else {
      setFocusedClientId(null);
      setFocusedClient(null);
    }
  }, [location.search, busca]);

  useEffect(() => {
    if (!focusedClientId) return;
    const match = safeClientes.find((cliente) => cliente?.id === focusedClientId);
    setFocusedClient(match ?? null);
  }, [focusedClientId, safeClientes]);

  const quickFilterOptions = [
    { label: "Todos", value: "all" },
    { label: "Com telefone", value: "phone" },
    { label: "Com CPF", value: "cpf" },
    { label: "Dados incompletos", value: "incomplete" },
  ];

  const searchScopes = [
    { label: "Nome", value: "nome" },
    { label: "Telefone", value: "telefone" },
    { label: "CPF", value: "cpf" },
    { label: "Código", value: "codigo" },
  ];

  const statusOptions = [
    { label: "Ativos", value: "ready" },
    { label: "Pendências", value: "incomplete" },
    { label: "Todos", value: "all" },
  ];

  const filterClientes = (
    list: any[],
    quick: typeof quickFilter,
    status: typeof statusFilter,
  ) => {
    return list.filter((cliente) => {
      const matchesQuick = (() => {
        if (quick === "phone") return Boolean(cliente.telefone);
        if (quick === "cpf") return Boolean(cliente.cpf);
        if (quick === "incomplete") return !cliente.telefone || !cliente.cpf;
        return true;
      })();

      const readyForAI = Boolean(cliente.telefone && cliente.cpf);
      const matchesStatus = (() => {
        if (status === "ready") return readyForAI;
        if (status === "incomplete") return !readyForAI;
        return true;
      })();

      return matchesQuick && matchesStatus;
    });
  };

  const filtrados = useMemo(
    () => filterClientes(safeClientes, quickFilter, statusFilter),
    [safeClientes, quickFilter, statusFilter],
  );

  const selectedClients = useMemo(
    () => safeClientes.filter((cliente) => cliente?.id && safeSelectedIds.includes(cliente.id)),
    [safeClientes, safeSelectedIds],
  );

  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, any[]>();

    safeClientes.forEach((cliente) => {
      if (!cliente) return;
      const normalizedCpf = cliente.cpf?.replace(/\D/g, "") || "";
      const normalizedPhone = cliente.telefone?.replace(/\D/g, "") || "";

      if (normalizedCpf) {
        const key = `CPF:${normalizedCpf}`;
        const list = groups.get(key) ?? [];
        list.push(cliente);
        groups.set(key, list);
      } else if (normalizedPhone) {
        const key = `TEL:${normalizedPhone}`;
        const list = groups.get(key) ?? [];
        list.push(cliente);
        groups.set(key, list);
      }
    });

    return Array.from(groups.entries())
      .filter(([, group]) => Array.isArray(group) && group.length > 1)
      .map(([identifier, group]) => ({ identifier, group }));
  }, [safeClientes]);

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkRemoval = async () => {
    if (!safeSelectedIds.length) {
      notify("Selecione ao menos um cliente para remover.", "warning");
      setActiveDialog(null);
      return;
    }

    setBulkLoading(true);
    try {
      await Promise.all(safeSelectedIds.map((id) => excluirCliente(id)));
      setClientes((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (cliente) => !safeSelectedIds.includes(cliente?.id),
        ),
      );
      setSelectedIds([]);
      notify("Clientes removidos com sucesso.", "error");
      setActiveDialog(null);
    } catch (error) {
      notify("Não foi possível remover os clientes selecionados.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const formatCsvValue = (value: any) => {
    if (value === null || value === undefined) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const handleExportClients = () => {
    const scope =
      exportScope === "selecionados" && !selectedClients.length ? "filtro" : exportScope;
    const exportFiltered = filterClientes(safeClientes, exportQuickFilter, exportStatusFilter);
    const dataset = scope === "selecionados" ? selectedClients : exportFiltered;

    if (!dataset.length) {
      notify("Nenhum cliente disponível para exportar.", "warning");
      return;
    }

    const header = ["Código", "Nome", "Telefone", "CPF", "E-mail", "Nascimento", "Status"];
    const rows = dataset.map((cliente) => {
      const readyForAI = Boolean(cliente.telefone && cliente.cpf);
      return [
        cliente.id,
        cliente.nome,
        cliente.telefone,
        cliente.cpf,
        cliente.email,
        cliente.dataNascimento,
        readyForAI ? "Pronto para IA" : "Dados incompletos",
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map(formatCsvValue).join(";"))
      .join("\n");

    triggerDownload(`\uFEFF${csv}`, `clientes-${scope}.csv`);
    notify("Arquivo Excel gerado com sucesso.", "success");
    setActiveDialog(null);
  };

  const handleDownloadTemplate = () => {
    const header = ["nome", "telefone", "email", "cpf", "dataNascimento", "observacoes"];
    const csv = `${header.join(";")}\n`;
    triggerDownload(`\uFEFF${csv}`, "modelo-importacao-clientes.csv");
    notify("Modelo em CSV gerado com sucesso.", "success");
  };

  const buildClientFingerprint = (draft: ImportClientDraft) => {
    const normalizedName = draft.nome.trim().toLowerCase();
    const normalizedCpf = (draft.cpf || "").replace(/\D/g, "");
    const normalizedPhone = (draft.telefone || "").replace(/\D/g, "");
    return `${normalizedName}|${normalizedCpf}|${normalizedPhone}`;
  };

  const handleImportCsv = async () => {
    if (!importFile) {
      notify("Selecione um arquivo CSV antes de importar.", "warning");
      return;
    }

    setImportingCsv(true);
    setImportSummary(null);

    try {
      const raw = await importFile.text();
      const drafts = parseClientCsv(raw);

      if (!drafts.length) {
        notify("Arquivo sem registros válidos para importação.", "warning");
        return;
      }

      const existingKeys = new Set(
        safeClientes.map((cliente) =>
          buildClientFingerprint({
            nome: cliente?.nome || "",
            cpf: cliente?.cpf,
            telefone: cliente?.telefone,
          }),
        ),
      );

      const imported: any[] = [];
      const samples: string[] = [];
      let skipped = 0;
      let failed = 0;

      for (const draft of drafts) {
        const fingerprint = buildClientFingerprint(draft);
        if (existingKeys.has(fingerprint)) {
          skipped += 1;
          continue;
        }

        try {
          const created = await criarCliente({
            nome: draft.nome,
            telefone: draft.telefone,
            email: draft.email,
            cpf: draft.cpf,
            dataNascimento: draft.dataNascimento,
            observacoes: draft.observacoes,
          });
          imported.push(created);
          existingKeys.add(fingerprint);
        } catch (error: any) {
          failed += 1;
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "erro não identificado";
          if (samples.length < 5) {
            samples.push(`${draft.nome}: ${message}`);
          }
        }
      }

      if (imported.length > 0) {
        setClientes((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          const ids = new Set(base.map((item) => item?.id));
          const merged = [...base];
          imported.forEach((item) => {
            if (!ids.has(item.id)) {
              merged.unshift(item);
              ids.add(item.id);
            }
          });
          return merged;
        });
      }

      setImportSummary({
        imported: imported.length,
        skipped,
        failed,
        samples,
      });

      notify(
        `Importação concluída: ${imported.length} incluído(s), ${skipped} ignorado(s), ${failed} falha(s).`,
        failed > 0 ? "warning" : "success",
      );

      if (imported.length > 0) {
        setImportFile(null);
      }
    } catch {
      notify("Não foi possível ler o arquivo CSV.", "error");
    } finally {
      setImportingCsv(false);
    }
  };

  const handleDuplicateReport = () => {
    if (!duplicateGroups.length) {
      notify("Nenhum possível duplicado encontrado para exportar.", "info");
      return;
    }

    const header = ["Chave", "Código", "Nome", "Telefone", "CPF"];
    const rows = duplicateGroups.flatMap(({ identifier, group }) =>
      (Array.isArray(group) ? group : []).map((cliente: any) => [
        identifier,
        cliente.id,
        cliente.nome,
        cliente.telefone,
        cliente.cpf,
      ]),
    );

    const csv = [header, ...rows]
      .map((row) => row.map(formatCsvValue).join(";"))
      .join("\n");

    triggerDownload(`\uFEFF${csv}`, "possiveis-duplicados.csv");
    notify("Relatório de duplicados exportado.", "success");
  };

  const handleClienteSalvo = (cliente: any) => {
    setClientes((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const exists = base.some((c) => c?.id === cliente?.id);
      if (exists) {
        return base.map((c) => (c?.id === cliente?.id ? { ...c, ...cliente } : c));
      }
      return [cliente, ...base];
    });
    setClienteEmEdicao(null);
    setModalAberto(false);
  };

  const handleEditarCliente = (cliente: any) => {
    if (!cliente) return;
    setClienteEmEdicao(cliente);
    setModalAberto(true);
  };

  const clientsWithPhone = safeClientes.filter((c) => c?.telefone).length;
  const clientsWithCpf = safeClientes.filter((c) => c?.cpf).length;
  const incomplete = safeClientes.filter((cliente) => !(cliente?.telefone && cliente?.cpf)).length;
  const aiReadyClients = safeClientes.filter((cliente) => cliente?.telefone && cliente?.cpf).length;

  const resumoCards = [
    { label: "Cadastrados", value: safeClientes.length },
    { label: "Com telefone", value: clientsWithPhone },
    { label: "Com CPF", value: clientsWithCpf },
    { label: "Pendências", value: Math.max(incomplete, 0) },
  ];

  const [exportSearchScope, setExportSearchScope] = useState(searchScope);
  const [exportStatusFilter, setExportStatusFilter] = useState(statusFilter);
  const [exportQuickFilter, setExportQuickFilter] = useState(quickFilter);

  useEffect(() => {
    if (activeDialog === "excel") {
      setExportSearchScope(searchScope);
      setExportStatusFilter(statusFilter);
      setExportQuickFilter(quickFilter);
    }
  }, [activeDialog, searchScope, statusFilter, quickFilter]);

  const handleBulkAction = (action: string) => {
    if (action === "novo") {
      setModalAberto(true);
      return;
    }
    if (action === "analise") {
      navigate("/analise-capilar");
      return;
    }
    if (action === "importar") {
      setActiveDialog("importar");
      return;
    }
    if (action === "remover") {
      if (!safeSelectedIds.length) {
        notify("Selecione ao menos um cliente para remover.", "warning");
        return;
      }
      setActiveDialog("remover");
      return;
    }
    if (action === "duplicados") {
      setActiveDialog("duplicados");
      return;
    }
    if (action === "excel") {
      setExportScope(safeSelectedIds.length ? "selecionados" : "filtro");
      setActiveDialog("excel");
      return;
    }
    notify("Funcionalidade em desenvolvimento.", "info");
  };

  const clearFocusContext = () => {
    const params = new URLSearchParams(location.search);
    params.delete("clientId");
    const searchString = params.toString();
    navigate(`${location.pathname}${searchString ? `?${searchString}` : ""}`, {
      replace: true,
    });
  };

  return (
    <div className="section-stack">
      {modalAberto && (
        <CadastroClienteModal
          onClose={() => {
            setModalAberto(false);
            setClienteEmEdicao(null);
          }}
          onSaved={handleClienteSalvo}
          clienteInicial={clienteEmEdicao}
        />
      )}
      {focusedClient && (
        <section className="card-premium card-premium-interactive border" style={{ borderColor: "var(--color-success-100)", backgroundColor: "var(--color-success-50)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-success-600)" }}>
                Resultado vindo da busca rápida
              </p>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {focusedClient.nome || "Cliente sem nome"}
              </h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                <span>
                  <strong>Telefone:</strong> {focusedClient.telefone || "—"}
                </span>
                <span>
                  <strong>CPF:</strong> {focusedClient.cpf || "—"}
                </span>
                {focusedClient.email && (
                  <span>
                    <strong>E-mail:</strong> {focusedClient.email}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-shadow hover:shadow-md"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                onClick={() => navigate(`/historico?clientId=${focusedClient.id}`)}
              >
                Ver histórico
              </button>
              <button
                className="rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-shadow hover:shadow-md"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                onClick={() => navigate(`/analise-capilar?clientId=${focusedClient.id}`)}
              >
                Nova análise IA
              </button>
              {focusedClient.telefone && (
                <button
                  className="rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onClick={() => window.open(`https://wa.me/${focusedClient.telefone.replace(/\D/g, "")}`, "_blank")}
                >
                  WhatsApp
                </button>
              )}
              <button
                className="rounded-full border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--color-text-muted)" }}
                onClick={clearFocusContext}
              >
                Dispensar foco
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="card-premium card-premium-interactive border" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Clientes</p>
            <h1 className="text-[20px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>Lista de clientes</h1>
            <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              Cadastrados no sistema: <strong>{safeClientes.length}</strong> · Em exibição: <strong>{filtrados.length}</strong>
            </p>
          </div>
        </div>

        {/* Removido bloco de cards de temas para reduzir poluição visual */}

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[2.2fr,1.2fr,1fr,1fr,1fr,auto,auto] lg:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Procurar por:</label>
            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 shadow-sm focus-within:border-[color:var(--color-success-400)] focus-within:ring-1 focus-within:ring-[color:var(--color-success-100)]" style={{ borderColor: "var(--color-border)" }}>
              <Search size={16} className="text-[color:var(--color-text-muted)]" />
              <input
                placeholder="Nome, telefone, CPF, código ou e-mail"
                className="w-full border-none bg-transparent text-[13px] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus:ring-0"
                style={{ color: "var(--color-text)", caretColor: "var(--color-text)" }}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Código</label>
            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 shadow-sm focus-within:border-[color:var(--color-success-400)] focus-within:ring-1 focus-within:ring-[color:var(--color-success-100)]" style={{ borderColor: "var(--color-border)" }}>
              <Search size={16} className="text-[color:var(--color-text-muted)]" />
              <input
                placeholder="Buscar por código do cliente"
                className="w-full border-none bg-transparent text-[13px] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus:ring-0"
                style={{ color: "var(--color-text)", caretColor: "var(--color-text)" }}
                value={buscaCodigo}
                onChange={(e) => {
                  const raw = e.target.value;
                  const cleaned = raw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 36);
                  setBuscaCodigo(cleaned);
                  setSearchScope("codigo");
                  setBusca(cleaned);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Filtro</label>
            <select
              className="rounded-md border px-3 py-2 text-[13px] shadow-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value)}
            >
              {searchScopes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Status</label>
            <select
              className="rounded-md border px-3 py-2 text-[13px] shadow-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Visão rápida</label>
            <select
              className="rounded-md border px-3 py-2 text-[13px] shadow-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
            >
              {quickFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary w-full justify-center sm:w-auto"
            onClick={() => setBusca((prev) => prev.trim())}
          >
            Buscar
          </button>
          <button
            type="button"
            className="btn-secondary w-full justify-center sm:w-auto"
            onClick={() => {
              setBusca("");
              setBuscaCodigo("");
              setSearchScope("nome");
              setStatusFilter("all");
              setQuickFilter("all");
            }}
          >
            Exibir todos
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
          <Button
            variant="primary"
            className="w-full justify-center sm:w-auto"
            onClick={() => {
              setClienteEmEdicao(null);
              handleBulkAction("novo");
            }}
          >
            + Novo Cliente
          </Button>
          <Button
            variant="danger"
            className="w-full justify-center sm:w-auto"
            disabled={!safeSelectedIds.length || bulkLoading}
            onClick={() => handleBulkAction("remover")}
          >
            <Trash2 size={16} />
            Remover selecionados
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-center sm:w-auto"
            onClick={() => handleBulkAction("importar")}
          >
            Importar clientes
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-center sm:w-auto"
            onClick={() => handleBulkAction("duplicados")}
          >
            Mesclar duplicados
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-center sm:w-auto"
            onClick={() => handleBulkAction("excel")}
          >
            Salvar no Excel
          </Button>
        </div>

        <div className="mt-4">
          <ClientesLista
            clientes={filtrados}
            loading={loading}
            selectedIds={safeSelectedIds}
            onSelectionChange={setSelectedIds}
            focusId={focusedClientId}
            onEditCliente={handleEditarCliente}
            onClientDeleted={(id) =>
              setClientes((prev) => (Array.isArray(prev) ? prev.filter((c) => c?.id !== id) : []))
            }
          />
        </div>
      </section>

      {safeSelectedIds.length > 0 && (
        <div className="card-premium-soft flex flex-wrap items-center justify-between gap-3 border-[color:var(--color-success-100)] bg-[color:var(--color-success-50)] p-4 text-sm text-[color:var(--color-success-900)]">
          <p className="font-medium">
            {safeSelectedIds.length} cliente{safeSelectedIds.length > 1 ? "s" : ""} selecionado{safeSelectedIds.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-[color:var(--color-success-200)] px-4 py-1 text-sm shadow-sm hover:shadow-md transition-shadow"
              onClick={() => setSelectedIds([])}
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {activeDialog === "excel" && (
        <Modal title="Exportar clientes" isOpen onClose={() => setActiveDialog(null)}>
          <div className="space-y-4 text-sm" style={{ color: "var(--color-text)" }}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Filtro</label>
                <select
                  className="rounded-md border px-3 py-2 text-[13px] shadow-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={exportSearchScope}
                  onChange={(e) => setExportSearchScope(e.target.value)}
                >
                  {searchScopes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Status</label>
                <select
                  className="rounded-md border px-3 py-2 text-[13px] shadow-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={exportStatusFilter}
                  onChange={(e) => setExportStatusFilter(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Visão rápida</label>
                <select
                  className="rounded-md border px-3 py-2 text-[13px] shadow-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={exportQuickFilter}
                  onChange={(e) => setExportQuickFilter(e.target.value)}
                >
                  {quickFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setActiveDialog(null)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleExportClients}>
              Exportar CSV
            </button>
          </div>
        </Modal>
      )}

      {activeDialog === "remover" && (
        <Modal title="Remover clientes selecionados" isOpen onClose={() => setActiveDialog(null)}>
          <div className="space-y-4 text-sm" style={{ color: "var(--color-text)" }}>
            <p>
              Esta ação removerá definitivamente {safeSelectedIds.length} cliente
              {safeSelectedIds.length > 1 ? "s" : ""} da base. Confirme para prosseguir.
            </p>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              Operação irreversível. Recomenda-se exportar um backup antes de excluir.
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setActiveDialog(null)} disabled={bulkLoading}>
              Cancelar
            </button>
            <button className="btn-danger" onClick={handleBulkRemoval} disabled={bulkLoading}>
              {bulkLoading ? "Removendo..." : "Confirmar remoção"}
            </button>
          </div>
        </Modal>
      )}

      {activeDialog === "duplicados" && (
        <Modal title="Possíveis duplicados" isOpen onClose={() => setActiveDialog(null)}>
          <div className="space-y-4 text-sm" style={{ color: "var(--color-text)" }}>
            {duplicateGroups.length === 0 ? (
              <p>Nenhum padrão suspeito encontrado. Continue preenchendo CPF e telefone para manter a base limpa.</p>
            ) : (
              <>
                <p>
                  Encontramos <strong>{duplicateGroups.length}</strong> grupos com CPF ou telefone semelhantes. Revise-os ou exporte o relatório completo para planilhas.
                </p>
                <div className="list-scroll max-h-64 space-y-3 overflow-y-auto rounded-2xl border p-3 pr-1" style={{ borderColor: "var(--color-border)" }}>
                  {duplicateGroups.slice(0, 5).map((group) => (
                    <div key={group.identifier} className="rounded-2xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                      <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>{group.identifier}</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {group.group.map((cliente: any) => (
                          <li key={cliente.id} className="flex items-center justify-between" style={{ color: "var(--color-text)" }}>
                            <span>{cliente.nome || "Cliente sem nome"}</span>
                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>#{cliente.id?.slice(0, 6)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {duplicateGroups.length > 5 && (
                    <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                      +{duplicateGroups.length - 5} grupos adicionais no relatório completo
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setActiveDialog(null)}>
              Fechar
            </button>
            {duplicateGroups.length > 0 && (
              <button className="btn-primary" onClick={handleDuplicateReport}>
                Exportar relatório
              </button>
            )}
          </div>
        </Modal>
      )}

      {activeDialog === "importar" && (
        <Modal title="Importar clientes" isOpen onClose={() => setActiveDialog(null)}>
          <div className="space-y-4 text-sm" style={{ color: "var(--color-text)" }}>
            <p>
              Faça upload de planilhas no formato CSV seguindo o modelo oficial para garantir validações automáticas e enriquecimento de dados pela IA.
            </p>
            <ol className="list-decimal space-y-2 pl-5" style={{ color: "var(--color-text-muted)" }}>
              <li>Baixe o modelo atualizado e preencha campos obrigatórios (nome, telefone ou CPF).</li>
              <li>Valide duplicidades antes do envio para evitar cartões técnicos em duplicidade.</li>
              <li>Envie o arquivo aqui mesmo no módulo de Clientes (botão “Importar clientes”).</li>
            </ol>
            <div className="rounded-2xl border p-4 text-xs" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
              Dica: utilize o mesmo padrão de cabeçalhos para evitar reprovações e manter a evolução histórica alinhada.
            </div>

            <div className="rounded-xl border border-dashed bg-white p-4 shadow-sm" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Selecionar arquivo CSV</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Tamanho máximo 5MB. Cabeçalhos conforme modelo.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-[var(--bg-primary)]"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  Escolher arquivo
                </label>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {importFile ? importFile.name : "Nenhum arquivo selecionado"}
                </span>
              </div>
            </div>

            {importSummary ? (
              <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-text-muted)" }}>Última importação</p>
                <p className="mt-2">
                  <strong>{importSummary.imported}</strong> importado(s) ·{" "}
                  <strong>{importSummary.skipped}</strong> ignorado(s) ·{" "}
                  <strong>{importSummary.failed}</strong> falha(s)
                </p>
                {importSummary.samples?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {importSummary.samples.map((sample, index) => (
                      <li key={index}>{sample}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setActiveDialog(null)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleImportCsv} disabled={importingCsv}>
              {importingCsv ? "Importando..." : "Importar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
