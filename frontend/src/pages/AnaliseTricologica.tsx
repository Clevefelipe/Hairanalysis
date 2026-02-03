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
}

export default function AnaliseTricologica() {
  const { token } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("Iniciando sessão...");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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

  async function handleCapture(file: File) {
    if (!sessionId) return;

    setPreview(URL.createObjectURL(file));
    setStatus("Processando análise...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("type", "tricologica");

    const response = await fetch(`${API}/vision/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    // 🔒 NORMALIZAÇÃO SEGURA
    const normalizedResult: AnalysisResult = {
      score: Number(data.score) || 0,
      flags: Array.isArray(data.flags) ? data.flags : [],
      signals: data.signals || {},
      interpretation: data.interpretation || "",
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
          </div>
        </Card>
      )}
    </div>
  );
}
