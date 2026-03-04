import { useEffect, useState } from "react";
import ImageCapture from "../components/vision/ImageCapture";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";
const HISTORY_KEY = "has_capilar_history";

interface AnalysisResult {
  score: number;
  flags: string[];
  signals: Record<string, string>;
  interpretation: string;
  date: string;
}

export default function AnaliseCapilar() {
  const { token } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("Iniciando sessão...");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Carregar histórico local
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    async function startSession() {
      try {
        const response = await fetch(`${API}/vision/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clientId: "cliente_demo",
            type: "capilar",
          }),
        });

        const data = await response.json();
        setSessionId(data.id);
        setStatus("Sessão capilar iniciada. Capture a imagem do fio.");
      } catch {
        setStatus("Erro ao iniciar sessão.");
      }
    }

    if (token) startSession();
  }, [token]);

  async function handleCapture(file: File) {
    if (!sessionId) return;

    setPreview(URL.createObjectURL(file));
    setStatus("Processando análise capilar...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("type", "capilar");

    const response = await fetch(`${API}/vision/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    const normalized: AnalysisResult = {
      score: Number(data.score) || 0,
      flags: Array.isArray(data.flags) ? data.flags : [],
      signals: data.signals || {},
      interpretation: data.interpretation || "",
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [normalized, ...(Array.isArray(history) ? history : [])];

    setResult(normalized);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    setStatus("Análise capilar concluída.");
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
          Análise Capilar
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
        <Card title="Resultado da Análise Capilar" variant={cardVariant}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Score Capilar</p>
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

      {history.length > 1 && (
        <Card title="Histórico de Análises Capilares">
          <ul className="space-y-2 text-sm">
            {history.slice(1).map((item, index) => (
              <li key={index} className="border-b pb-2">
                <strong>{item.date}</strong> — Score: {item.score}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
