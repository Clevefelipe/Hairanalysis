import { useEffect, useState } from "react";
import ImageCapture from "../components/vision/ImageCapture";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface AnalysisResult {
  score: number;
  flags: string[];
  signals: Record<string, string>;
  interpretation: string;
  uvFlags?: string[];
}

const UV_FLAGS = [
  "Oleosidade excessiva",
  "Acúmulo de resíduos",
  "Microdescamação",
  "Áreas de baixa oxigenação",
  "Poros obstruídos (visual UV)",
  "Irregularidade de densidade aparente",
];

export default function AnaliseTricologica() {
  const { token } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("Iniciando sessão...");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uvMode, setUvMode] = useState(false);
  const [uvFlags, setUvFlags] = useState<string[]>([]);

  useEffect(() => {
    async function startSession() {
      try {
        const response = await fetch(`${API}/vision/session/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clientId: "cliente_demo",
            type: "tricologica",
          }),
        });

        const data = await response.json();
        setSessionId(data.id);
        setStatus("Sessão tricológica iniciada. Capture a imagem.");
      } catch {
        setStatus("Erro ao iniciar sessão.");
      }
    }

    if (token) startSession();
  }, [token]);

  function toggleUvFlag(flag: string) {
    setUvFlags((prev) =>
      prev.includes(flag)
        ? prev.filter((item) => item !== flag)
        : [...prev, flag]
    );
  }

  async function handleCapture(file: File) {
    if (!sessionId) return;

    setPreview(URL.createObjectURL(file));
    setStatus("Processando análise...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("type", "tricologica");
    formData.append("uvMode", uvMode ? "true" : "false");
    formData.append("uvFlags", JSON.stringify(uvFlags));

    const response = await fetch(`${API}/vision/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    const normalizedResult: AnalysisResult = {
      score: Number(data.score) || 0,
      flags: Array.isArray(data.flags) ? data.flags : [],
      signals: data.signals || {},
      interpretation: data.interpretation || "",
      uvFlags,
    };

    setResult(normalizedResult);
    setStatus("Análise concluída.");
  }

  const cardVariant =
    result?.flags?.includes("alert")
      ? "alert"
      : result?.flags?.includes("attention")
      ? "attention"
      : "default";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">
          Análise Tricológica
        </h1>
        <p className="text-text-muted">Status: {status}</p>
      </div>

      <Card title="Modo de análise">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={uvMode}
              onChange={(e) => setUvMode(e.target.checked)}
            />
            Ativar avaliação com luz UV
          </label>

          {uvMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {UV_FLAGS.map((flag) => (
                <label key={flag} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={uvFlags.includes(flag)}
                    onChange={() => toggleUvFlag(flag)}
                  />
                  {flag}
                </label>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Observação estética assistida por IA. A decisão final é do profissional.
          </p>
        </div>
      </Card>

      {sessionId && <ImageCapture onCapture={handleCapture} />}

      {preview && (
        <Card title="Imagem analisada">
          <img
            src={preview}
            alt="Pré-visualização"
            className="max-h-64 rounded-md border"
          />
        </Card>
      )}

      {result && (
        <Card title="Resultado da Análise" variant={cardVariant}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Score Técnico</p>
              <p className="text-3xl font-bold text-primary">
                {result.score}/100
              </p>
            </div>

            {result.uvFlags && result.uvFlags.length > 0 && (
              <div>
                <p className="font-semibold">Flags UV selecionadas:</p>
                <ul className="list-disc ml-5 text-sm">
                  {result.uvFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="font-semibold">Sinais detectados:</p>
              <ul className="list-disc ml-5 text-sm">
                {Object.entries(result.signals).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold">Interpretação profissional:</p>
              <p className="text-text-main">{result.interpretation}</p>
            </div>

            <p className="text-xs text-slate-500">
              Observação estética assistida por IA. Não substitui avaliação profissional nem diagnóstico clínico.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
