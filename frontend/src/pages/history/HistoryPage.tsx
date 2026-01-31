import { useEffect, useState } from "react";
import {
  getHistoryByClient,
  AnalysisHistory,
  AnalysisType,
} from "../../services/history.service";
import HistoryList from "./HistoryList";

export default function HistoryPage() {
  const [data, setData] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<AnalysisType | "all">("all");

  const clientId = "cliente_123"; // 🔧 depois vem do contexto/rota

  async function load() {
    setLoading(true);

    const filters: any = {};
    if (domain !== "all") filters.domain = domain;
    if (search.trim()) filters.q = search;

    const result = await getHistoryByClient(clientId, filters);
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [domain]);

  function handleSearch() {
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Histórico de Análises
      </h1>

      {/* 🔎 Filtros */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="Buscar no histórico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            minWidth: "240px",
          }}
        />

        <select
          value={domain}
          onChange={(e) =>
            setDomain(e.target.value as any)
          }
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <option value="all">Todos</option>
          <option value="capilar">Capilar</option>
          <option value="tricologica">Tricológica</option>
        </select>

        <button
          onClick={handleSearch}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Buscar
        </button>
      </div>

      {/* 📄 Conteúdo */}
      {loading ? (
        <p className="text-gray-500">
          Carregando histórico...
        </p>
      ) : (
        <HistoryList items={data} />
      )}
    </div>
  );
}
