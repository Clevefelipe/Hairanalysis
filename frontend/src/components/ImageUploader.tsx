import { useState } from "react";
import api from "../services/api";

type Props = {
  onResult: (analysis: any) => void;
};

export default function ImageUploader({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!file) {
      setError("Selecione uma imagem");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/v2/vision/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onResult(response.data.analysis);
    } catch (err) {
      setError("Erro ao analisar imagem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Análise Capilar e Tricológica</h2>
        <p className="text-sm text-slate-500">
          Envie uma imagem para gerar insights automáticos da IA.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Imagem do fio ou couro cabeludo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="clientes-input w-full"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="btn-primary w-full shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Analisando..." : "Analisar agora"}
      </button>

      {error && (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}
