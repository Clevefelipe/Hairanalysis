import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageCapture from "@/components/vision/ImageCapture";
import { useAuth } from "@/context/AuthContext";
import { useClientSession } from "@/context/ClientSessionContext";
import { useToast } from "@/components/ui/ToastProvider";
import ClientLookupModal from "@/components/clientes/ClientLookupModal";
import AnalysisClientContextCard from "@/components/analysis/AnalysisClientContextCard";
import AnalysisModeSelector from "@/components/analysis/AnalysisModeSelector";
import AnalysisResultDetails, { type AnalysisAesthetic } from "@/components/analysis/AnalysisResultDetails";
import AnalysisProcessingSkeleton from "@/components/analysis/AnalysisProcessingSkeleton";
import HighTechIntegrityPanel from "@/components/analysis/HighTechIntegrityPanel";
import ActiveClientSessionBar from "@/components/analysis/ActiveClientSessionBar";
import AnalysisStepProgress from "@/components/analysis/AnalysisStepProgress";
import ChemicalProfileForm from "@/components/analysis/ChemicalProfileForm";
import AnalysisHero from "@/components/analysis/AnalysisHero";
import AnalysisContextPanel from "@/components/analysis/AnalysisContextPanel";
import AnalysisWizardLayout from "@/components/analysis/AnalysisWizardLayout";
import Modal from "@/components/ui/Modal";
import { obterClientePorId } from "@/core/cliente/cliente.service";
import { salvarVisionBackend } from "@/services/visionApi";
import { getHistoryPdf } from "@/services/history.service";
import { AlertTriangle, CheckCircle2, Clock, Download, Loader2, Sparkles } from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api"
).replace(/\/+$/, "");

type AnalysisMode = "imagem" | "video" | "tempo-real";
type AnalysisStep = "config" | "capture" | "analyzing" | "processing" | "results";

export interface AnalysisResult {
  score: number;
  flags: string[];
  signals: Record<string, any>;
  interpretation: string;
  date: string;
  aesthetic?: AnalysisAesthetic | null;
  uvFlags?: string[];
  microscopyAlerts?: string[];
  aiExplanation?: any;
  recommendations?: any;
  professionalAlert?: string;
  recomendacoes?: Array<{ titulo: string; descricao: string; tempo?: string; compatibilidade?: number }>;
  historyId?: string;
  chemicalProfile?: any;
  riskAssessment?: { level: "low" | "medium" | "high"; reasons: string[] } | null;
}

const CAPTURE_SEQUENCE_STEPS = [
  "1. Visão geral da mecha (contexto de volume).",
  "2. Close em cutícula para leitura de porosidade.",
  "3. Registro de pontas para avaliar quebra/fissura.",
];

const CAPTURE_CHECKLIST_ITEMS = [
  "Fundo neutro sem reflexo forte",
  "Fio centralizado e sem tremor",
  "Áreas críticas com nitidez",
  "Uma imagem por região de interesse",
];

const CAPTURE_ENVIRONMENT_CARDS = [
  { label: "Luz", value: "Frontal difusa" },
  { label: "Distância", value: "20-30 cm" },
  { label: "Foco", value: "Cutícula e pontas" },
];

const CAPTURE_REQUIRED_SHOTS = [
  { key: "contexto", label: "Contexto da mecha", hint: "Visão geral para volume e distribuição da fibra." },
  { key: "macro", label: "Macro da fibra", hint: "Close da cutícula com foco em porosidade e brilho." },
  { key: "pontas", label: "Pontas", hint: "Registro de desgaste, quebra e necessidade de corte." },
] as const;

const PROCESSING_CHECKLIST_ITEMS = [
  "Porosidade",
  "Elasticidade",
  "Risco de quebra",
  "Histórico químico",
  "Score de integridade",
];

const UV_FLAGS = [
  "Oleosidade excessiva",
  "Acúmulo de resíduos",
  "Microdescamação",
  "Áreas de baixa oxigenação",
  "Poros obstruídos (visual UV)",
  "Irregularidade de densidade aparente",
];

const PROFESSIONAL_ALERT_FALLBACKS = [
  {
    normalized: "analise com baixa confiabilidade tecnica. recomenda se nova captura de imagem.",
    text: "Análise com baixa confiabilidade técnica. Recomenda-se nova captura de imagem.",
  },
] as const;

const normalizeAnalysisSource = (mode: AnalysisMode): "imagem" | "video" | "tempo-real" => {
  if (mode === "video") return "video";
  if (mode === "tempo-real") return "tempo-real";
  return "imagem";
};

const analysisSourceLabel = (source: "imagem" | "video" | "tempo-real") =>
  source === "video" ? "Frame em vídeo" : source === "tempo-real" ? "Tempo real" : "Captura fotográfica";

function fixMojibake(text: string) {
  return text
    .replace(/Ã¡/g, "á")
    .replace(/Ã /g, "à")
    .replace(/Ã£/g, "ã")
    .replace(/Ã¢/g, "â")
    .replace(/Ã©/g, "é")
    .replace(/Ãª/g, "ê")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ã´/g, "ô")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã§/g, "ç")
    .replace(/Ã‰/g, "É")
    .replace(/Ã€/g, "À")
    .replace(/Ã•/g, "Õ")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã”/g, "Ô")
    .replace(/Ã‡/g, "Ç")
    .replace(/Ã/g, "Á")
    .replace(/Ã/g, "Â")
    .replace(/Ã‰/g, "É")
    .replace(/ÃŠ/g, "Ê")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã•/g, "Õ")
    .replace(/Ãº/g, "ú");
}

function normalizeAlertComparison(text: string) {
  return text
    .replace(/\uFFFD/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sanitizeProfessionalAlert(text: string) {
  if (!text) return "";
  const cleaned = fixMojibake(text.replace(/\uFFFD/g, ""));
  const normalized = normalizeAlertComparison(cleaned);
  const fallback = PROFESSIONAL_ALERT_FALLBACKS.find((item) => item.normalized === normalized);
  return fallback ? fallback.text : cleaned;
}

type AnaliseCapilarProps = {
  testInitialResult?: AnalysisResult;
};

export default function AnaliseCapilar({ testInitialResult }: AnaliseCapilarProps = {}) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    activeClient,
    hasSession,
    startSession: startClientSession,
    endSession: endClientSession,
    flowState,
    setFlowMode,
    markAnalysisCompleted,
    nextRequiredStep,
    isCompleteProtocolReady,
  } = useClientSession();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AnalysisStep>("config");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("imagem");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [chemicalProfile, setChemicalProfile] = useState({
    scalp: {},
    fiber: {},
    chemistry: {},
    neutralizacao: {},
    evidencias: [],
    followUp: {},
  });
  const [showTechnical, setShowTechnical] = useState(false);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [savedHistoryId, setSavedHistoryId] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  } | null>(null);
  const [uvMode, setUvMode] = useState(false);
  const [uvFlags, setUvFlags] = useState<string[]>([]);
  const [microscopeOn, setMicroscopeOn] = useState(false);
  const [microscopeAlerts, setMicroscopeAlerts] = useState<string[]>([]);
  const [showAdvancedAlert, setShowAdvancedAlert] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [fallbackProgress, setFallbackProgress] = useState(0);
  const [fullscreenStatus, setFullscreenStatus] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [confirmEndSessionOpen, setConfirmEndSessionOpen] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<AnalysisResult["riskAssessment"]>(null);

  const premiumGoal = searchParams.get("premiumGoal");
  const premiumNote = searchParams.get("premiumNote");
  const clientIdParam = searchParams.get("clientId");
  const flowParam = (searchParams.get("flow") ?? null) as "completo" | "capilar_individual" | null;
  const autoSessionInitRef = useRef<string | null>(null);

  const isIntegratedFlow = flowState.mode === "completo";
  const configDone = isIntegratedFlow ? hasSession : true;
  const tricologicaDone = isIntegratedFlow ? flowState.tricologicaDone : true;
  const capilarDone = isIntegratedFlow ? flowState.capilarDone : Boolean(result);
  const protocolReady = isIntegratedFlow ? isCompleteProtocolReady : Boolean(result);
  const wizardStep = step === "processing" || step === "results" ? "analyzing" : step;

  const steps = useMemo(
    () => [
      { key: "config", label: "Configuração" },
      { key: "capture", label: "Captura" },
      { key: "analyzing", label: "Resultado" },
    ],
    [],
  );
  const currentStepIndex = steps.findIndex((s) => s.key === wizardStep);

  const safetyChecklist = useMemo(() => {
    const hasClient = Boolean(selectedClient || activeClient);
    const hasSessionActive = Boolean(sessionId);
    const hasContextNotes = Boolean((observacoes || "").trim() || premiumGoal || premiumNote);
    return [
      { key: "client", label: "Cliente confirmado", description: "Selecione a cliente para vincular histórico.", complete: hasClient },
      { key: "session", label: "Sessão IA ativa", description: "Inicie ou recupere sessão para registrar achados.", complete: hasSessionActive },
      { key: "notes", label: "Contexto técnico", description: "Notas e objetivo orientam a IA.", complete: hasContextNotes },
      { key: "tricologica", label: "Tricológica concluída", description: "O couro deve ser avaliado antes da fibra.", complete: tricologicaDone },
    ];
  }, [activeClient, premiumGoal, premiumNote, observacoes, selectedClient, sessionId, tricologicaDone]);

  const pendingChecklist = safetyChecklist.filter((i) => !i.complete).length;
  const statusLabel = wizardStep === "config" ? "Configuração" : wizardStep === "capture" ? "Captura" : result ? "Resultado" : "Processando";
  const progressLabel = wizardStep === "config" ? "Aguardando início" : wizardStep === "capture" ? "Pronto para capturar" : result ? "Resultado gerado" : "Processando";

  useEffect(() => {
    setShowAdvancedAlert(false);
  }, [mode, uvMode, microscopeOn]);

  useEffect(() => {
    if (testInitialResult) {
      setResult(testInitialResult);
      setStep("results");
    }
  }, [testInitialResult]);

  useEffect(() => {
    if (!token || !clientIdParam) return;
    const initKey = `${clientIdParam}:${flowParam ?? "default"}`;
    if (autoSessionInitRef.current === initKey) return;
    autoSessionInitRef.current = initKey;

    obterClientePorId(clientIdParam)
      .then((cliente) => {
        const incomingMode = flowParam === "completo" ? "completo" : "capilar_individual";
        startClientSession(cliente as any, incomingMode);
        setSelectedClient(cliente as any);
        startSession(cliente.id);
      })
      .catch(() => {
        autoSessionInitRef.current = null;
        notify("Cliente não encontrado", "error");
      });
  }, [clientIdParam, flowParam, notify, startClientSession, token]);

  useEffect(() => {
    if (!hasSession || !activeClient) return;
    setSelectedClient({
      id: activeClient.id,
      nome: activeClient.nome,
      telefone: activeClient.telefone,
      email: activeClient.email,
    });
  }, [activeClient, hasSession]);

  useEffect(() => {
    if (!premiumNote || observacoes.trim()) return;
    setObservacoes(premiumNote);
  }, [observacoes, premiumNote]);

  useEffect(() => {
    if (!setFlowMode) return;
    if (!flowParam && flowState.mode !== "capilar_individual") setFlowMode("capilar_individual");
    if (flowParam === "completo" && flowState.mode !== "completo") setFlowMode("completo");
  }, [flowParam, flowState.mode, setFlowMode]);

  useEffect(() => {
    if (wizardStep !== "analyzing" || result || !sessionId) return;
    let cancelled = false;
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API}/vision/status/${sessionId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) return;
        const data = await res.json();
        const p = typeof data?.progress === "number" ? clamp(data.progress) : null;
        if (p !== null && !cancelled) setAnalysisProgress(p);
      } catch {
        /* ignore polling */
      }
    };
    fetchProgress();
    const id = window.setInterval(fetchProgress, 1200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [API, result, sessionId, token, wizardStep]);

  useEffect(() => {
    if (wizardStep !== "analyzing" || result) {
      setFallbackProgress(0);
      return;
    }
    const start = performance.now();
    let raf = requestAnimationFrame(function tick() {
      const elapsed = performance.now() - start;
      const eased = Math.min(90, Math.round((elapsed / 9000) * 90));
      setFallbackProgress(eased);
      if (wizardStep === "analyzing" && !result && eased < 90) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [wizardStep, result]);

  function validateChemicalProfile(): boolean {
    const aggressive = (chemicalProfile as any).chemistry?.acaoAgressiva;
    const testDone = (chemicalProfile as any).chemistry?.testMechaFeito;
    if (aggressive && testDone === false) {
      notify("Para ações agressivas (alisamento/descoloração), realize o teste de mecha antes de continuar.", "error");
      return false;
    }

    const needsNeutralization = Boolean(
      (chemicalProfile as any).neutralizacao?.exigida ||
        (chemicalProfile as any).chemistry?.sistemaAtual === "hidroxido" ||
        (chemicalProfile as any).chemistry?.sistemaAtual === "tioglicolato" ||
        (chemicalProfile as any).chemistry?.sistemaAtual === "persulfato" ||
        (chemicalProfile as any).chemistry?.sistemaAtual === "coloracaoOx" ||
        (chemicalProfile as any).fiber?.elasticidade === "borrachuda",
    );

    if (needsNeutralization) {
      const hasProduct = Boolean((chemicalProfile as any).neutralizacao?.produto?.trim());
      const hasTime =
        typeof (chemicalProfile as any).neutralizacao?.tempoMinutos === "number" &&
        Number.isFinite((chemicalProfile as any).neutralizacao?.tempoMinutos);
      if (!hasProduct || !hasTime) {
        notify("Neutralização exigida: informe produto e tempo (minutos).", "warning");
        return false;
      }
    }
    return true;
  }

  async function startSession(clientId?: string) {
    if (!token) {
      notify("Sessão expirada. Entre novamente para iniciar a análise.", "error");
      return;
    }
    if (!validateChemicalProfile()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/vision/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId: clientId || activeClient?.id || "cliente_demo", analysisType: "capilar" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Erro ao iniciar sessão" })))?.message || "Falha ao iniciar sessão");
      const data = await res.json();
      if (!data?.id) throw new Error("Sessão inválida");
      setSessionId(data.id);
      setStep("capture");
    } catch (e: any) {
      notify(e?.message || "Erro ao iniciar sessão", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function runCapturePipeline(file: File) {
    if (!token || !sessionId) return;
    setPreview(URL.createObjectURL(file));
    setStep("analyzing");
    setIsLoading(true);
    const source = normalizeAnalysisSource(mode);
    const sourceLabel = analysisSourceLabel(source);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      formData.append("type", "capilar");
      formData.append("source", source);
      formData.append("notes", observacoes);
      formData.append("uvMode", uvMode ? "true" : "false");
      formData.append("uvFlags", JSON.stringify(uvFlags));
      formData.append("microscopy", JSON.stringify({ enabled: microscopeOn, alerts: microscopeAlerts, capturedAt: new Date().toISOString() }));

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${API}/vision/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error((await res.text()) || `Erro HTTP: ${res.status}`);

      const raw = await res.json();
      const data = {
        score: Number(raw?.score) || 0,
        flags: Array.isArray(raw?.flags) ? raw.flags : [],
        signals: raw?.signals && typeof raw.signals === "object" ? raw.signals : {},
        interpretation: raw?.interpretation || "",
        analyzedAt: raw?.analyzedAt,
        recomendacoes: Array.isArray(raw?.recomendacoes) ? raw.recomendacoes : [],
      };

      let savedHistory: any = null;
      try {
        const finalClientId = selectedClient?.id || searchParams.get("clientId") || "cliente_demo";
        if (!validateChemicalProfile()) return;
        savedHistory = await salvarVisionBackend(finalClientId, {
          type: "capilar",
          source,
          sourceLabel,
          chemicalProfile,
          visionResult: {
            type: "capilar",
            source,
            sourceLabel,
            score: data.score,
            flags: data.flags,
            signals: data.signals,
            interpretation: data.interpretation,
            analyzedAt: data.analyzedAt,
            uvFlags,
            microscopy: { enabled: microscopeOn, alerts: microscopeAlerts },
          },
          interpretation: data.interpretation || "",
          signals: data.signals || {},
        });
        setSavedClientId(finalClientId);
        setSavedHistoryId(savedHistory?.id ?? null);
        if (savedHistory?.recommendations?.riskAssessment || savedHistory?.visionResult?.riskAssessment) {
          setRiskAssessment(savedHistory.recommendations?.riskAssessment || savedHistory.visionResult?.riskAssessment);
        }
      } catch (e: any) {
        notify(e?.message || "A análise foi concluída, mas não foi possível salvar no histórico.", "error");
      }

      setResult({
        score: Number(savedHistory?.visionResult?.score) || data.score,
        flags: Array.isArray(savedHistory?.visionResult?.flags) ? savedHistory.visionResult.flags : data.flags,
        signals: savedHistory?.visionResult?.signals && typeof savedHistory.visionResult.signals === "object" ? savedHistory.visionResult.signals : data.signals,
        interpretation: savedHistory?.aiExplanation?.summary || savedHistory?.visionResult?.interpretation || data.interpretation || "",
        aesthetic: savedHistory?.recommendations?.aesthetic || savedHistory?.visionResult?.aesthetic || null,
        date: savedHistory?.createdAt ? new Date(savedHistory.createdAt).toLocaleString() : new Date().toLocaleString(),
        uvFlags,
        microscopyAlerts: microscopeAlerts,
        aiExplanation: savedHistory?.aiExplanation || null,
        recommendations: savedHistory?.recommendations || null,
        riskAssessment: savedHistory?.recommendations?.riskAssessment || savedHistory?.visionResult?.riskAssessment || null,
        professionalAlert: typeof savedHistory?.professionalAlert === "string" ? savedHistory.professionalAlert : "",
        recomendacoes: Array.isArray(savedHistory?.recomendacoes)
          ? savedHistory.recomendacoes
          : Array.isArray(savedHistory?.visionResult?.recomendacoes)
            ? savedHistory.visionResult.recomendacoes
            : data.recomendacoes,
        historyId: savedHistory?.id,
        chemicalProfile,
      });

      markAnalysisCompleted("capilar", savedHistory?.id);
      setStep("results");
      notify(`Análise capilar concluída (${sourceLabel})`, "success");
    } catch (e: any) {
      const msg = e?.name === "AbortError" ? "Tempo excedido na análise capilar." : e?.message || "Erro na análise";
      notify(msg, "error");
      setStep("config");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCapture(file: File) {
    if (!sessionId) {
      notify("Inicie ou recupere uma sessão ativa antes da captura.", "error");
      return;
    }
    if (!token) {
      notify("Token de autenticação não encontrado. Faça login novamente.", "error");
      setStep("capture");
      return;
    }
    if (flowState.mode === "completo" && !flowState.tricologicaDone) {
      notify("Finalize a tricologia antes da etapa capilar no fluxo completo.", "error");
      return;
    }
    if (!validateChemicalProfile()) return;
    await runCapturePipeline(file);
  }

  async function handleDownloadPdf(historyId: string) {
    try {
      setDownloadingPdf(true);
      const blob = await getHistoryPdf(historyId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analise-${historyId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notify("PDF gerado com sucesso.", "success");
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Erro ao gerar PDF";
      notify(message, "error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  function renderConfigStage() {
    return (
      <div className="space-y-6">
        <AnalysisClientContextCard
          selectedClient={selectedClient}
          observations={observacoes}
          onObservationsChange={setObservacoes}
          onSelectClient={() => setLookupOpen(true)}
          placeholder="Observações técnicas, químicas recentes, alertas de tricologia..."
          extra={
            premiumGoal || premiumNote ? (
              <div className="rounded-2xl border border-has-success/30 bg-has-success/10 p-3 text-xs text-has-success">
                Plano premium aplicado{premiumGoal ? ` (objetivo: ${premiumGoal})` : ""}.
              </div>
            ) : null
          }
        />

        <ChemicalProfileForm value={chemicalProfile as any} onChange={setChemicalProfile as any} disabled={isLoading || wizardStep !== "config"} />

        <AnalysisModeSelector
          selected={mode}
          onChange={(value) => setMode(value as AnalysisMode)}
          options={[
            { value: "imagem", title: "Captura fotográfica", description: "Recomendado para etapas rápidas ou follow-up." },
            { value: "video", title: "Frame em vídeo", description: "Usar quando precisar validar movimento ou brilho." },
            { value: "tempo-real", title: "Tempo real", description: "Modo contínuo com apoio de microscopia." },
          ]}
        />

        <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Modos avançados</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Luz UV e microscopia auxiliam a detectar oleosidade e descamação.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-text)" }}>
              <input type="checkbox" checked={uvMode} onChange={(e) => setUvMode(e.target.checked)} />
              Ativar luz UV
            </label>
          </div>
          {uvMode && (
            <div className="grid gap-2 sm:grid-cols-2">
              {UV_FLAGS.map((flag) => (
                <label key={flag} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <input
                    type="checkbox"
                    checked={uvFlags.includes(flag)}
                    onChange={() =>
                      setUvFlags((prev) =>
                        prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag],
                      )
                    }
                  />
                  {flag}
                </label>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setMicroscopeOn((prev) => !prev);
              if (!microscopeOn) setMicroscopeAlerts([]);
            }}
            className="btn-secondary"
          >
            {microscopeOn ? "Microscópio ativo" : "Ativar microscópio"}
          </button>
        </div>

        {showAdvancedAlert && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm" style={{ color: "#92400e" }}>
            <AlertTriangle size={18} />
            <div>
              <p className="font-semibold text-amber-700">Ative ao menos um modo avançado</p>
              <p className="text-xs text-amber-700/80">Ative luz UV ou microscopia para protocolos completos.</p>
            </div>
          </div>
        )}

        <button
          onClick={async () => {
            if (!selectedClient) {
              setLookupOpen(true);
              return;
            }
            if (mode === "tempo-real" && !microscopeOn) {
              notify("No modo tempo real, ative a microscopia antes de iniciar.", "error");
              return;
            }
            if (!validateChemicalProfile()) return;
            await startSession(selectedClient.id);
          }}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLoading}
        >
          Iniciar análise
        </button>
      </div>
    );
  }

  function renderCaptureStage() {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Coluna esquerda: instruções + ambiente em um só card */}
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>O que capturar</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>3 fotos rápidas, sem enrolação.</p>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>{CAPTURE_REQUIRED_SHOTS.length} capturas</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Sequência</p>
              <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                {CAPTURE_REQUIRED_SHOTS.map((shot) => (
                  <li key={shot.key} className="leading-snug">{shot.label}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Como capturar</p>
              <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-has-primary" /> Luz frontal difusa</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-has-primary" /> Fio centralizado, sem tremor</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-has-primary" /> Registre cada região uma vez</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {CAPTURE_ENVIRONMENT_CARDS.map((card) => (
              <div key={card.label} className="rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita: captura + status compacto */}
        <div className="space-y-3">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Capturar agora</p>

            <ImageCapture
              onCapture={handleCapture}
              isProcessing={isLoading}
              title="Captura guiada para análise capilar"
              subtitle="3 fotos rápidas: contexto, macro e pontas."
              allowQuickCapture
              requiredShots={CAPTURE_REQUIRED_SHOTS as any}
            />

            {!sessionId && (
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Inicie uma sessão antes de capturar para registrar o histórico corretamente.
              </p>
            )}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
            <div className="grid gap-2 text-sm" style={{ color: "var(--color-text)" }}>
              <div className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <span>Cliente vinculada</span>
                <span className="font-semibold" style={{ color: sessionId ? "var(--color-success-700)" : "var(--color-error-600)" }}>{sessionId ? "Sim" : "Não"}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <span>Modo</span>
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>{analysisSourceLabel(normalizeAnalysisSource(mode))}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <span>Checklist</span>
                <span className="font-semibold" style={{ color: pendingChecklist > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                  {safetyChecklist.length - pendingChecklist}/{safetyChecklist.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
    }

  function renderProcessingStage() {
    return (
      <div className="space-y-4">
        <AnalysisProcessingSkeleton mode="capilar" progressOverride={Math.max(analysisProgress, fallbackProgress)} durationMs={12000} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Checklist técnico</p>
            <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
              {PROCESSING_CHECKLIST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-has-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Captura enviada</p>
            <p className="text-sm" style={{ color: "var(--color-text)" }}>Validando textura, porosidade e sinais de dano químico.</p>
          </div>
        </div>
      </div>
    );
  }

  function renderResultStage() {
    if (!result) return null;
    const premium = result.aiExplanation;
    const aesthetic = (result as any).aesthetic ?? (result.recommendations as any)?.aesthetic ?? null;
    const professionalAlertText = sanitizeProfessionalAlert(
      (typeof result.professionalAlert === "string" && result.professionalAlert.trim()) ||
        (typeof result.recommendations?.professionalAlert === "string" && result.recommendations.professionalAlert.trim()) ||
        "",
    );

    return (
      <div className="section-stack">
        <AnalysisResultDetails
          kind="capilar"
          signals={result.signals}
          flags={result.flags}
          recommendations={result.recommendations}
          aesthetic={aesthetic}
          chemicalProfile={result.chemicalProfile as any}
          dataTestId="analysis-result-details"
        />

        <section data-testid="professional-decision-panel" data-aesthetic={aesthetic ? JSON.stringify(aesthetic) : undefined}>
          <HighTechIntegrityPanel
            score={result.score}
            flags={result.flags}
            interpretation={result.interpretation}
            riskLevel={typeof premium?.riskLevel === "string" ? premium.riskLevel : null}
            riskFactors={Array.isArray(premium?.riskFactors) ? premium.riskFactors : []}
            confidence={premium?.analysisConfidence ?? premium?.confidence ?? null}
          />
        </section>

        {riskAssessment && (
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  riskAssessment.level === "high"
                    ? "bg-[color:var(--color-error-50)] text-[color:var(--color-error-700)]"
                    : riskAssessment.level === "medium"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                }`}
              >
                Risco {riskAssessment.level}
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Motivos: {riskAssessment.reasons.join(", ") || "—"}
              </p>
            </div>
          </div>
        )}

        {typeof premium?.summary === "string" && premium.summary.trim() !== "" && (
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3" style={{ color: "var(--color-primary)" }}>
              <Sparkles size={18} />
              <p className="text-sm font-semibold">Resumo técnico assistido por IA</p>
            </div>
            <p className="mt-3 text-sm whitespace-pre-line" style={{ color: "var(--color-text)" }}>
              {premium.summary}
            </p>
          </div>
        )}

        {typeof premium?.technicalDetails === "string" && premium.technicalDetails.trim() !== "" && (
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <button
              onClick={() => setShowTechnical((prev) => !prev)}
              className="text-sm font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--color-text)" }}
            >
              {showTechnical ? "Ocultar justificativa técnica" : "Ver justificativa técnica"}
            </button>
            {showTechnical && (
              <p className="mt-3 text-sm whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
                {premium.technicalDetails}
              </p>
            )}
          </div>
        )}

        {professionalAlertText && (
          <div className="rounded-lg border p-4" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb", color: "#92400e", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle size={16} />
              Alerta profissional
            </div>
            <p className="mt-2 text-sm whitespace-pre-line">{professionalAlertText}</p>
            {sessionId && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setResult(null);
                    setPreview(null);
                    setStep("capture");
                  }}
                  className="btn-secondary"
                >
                  Refazer captura
                </button>
              </div>
            )}
          </div>
        )}

        {(result.recomendacoes?.length ?? 0) > 0 && (
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Storytelling estético</p>
            <div className="mt-4 space-y-3">
              {result.recomendacoes?.map((r, index) => (
                <div key={`${r.titulo}-${index}`} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-text)" }}>{r.titulo}</p>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{r.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setStep("config");
              setPreview(null);
              setResult(null);
              setSavedClientId(null);
              setSavedHistoryId(null);
            }}
            className="btn-secondary"
          >
            Nova análise
          </button>

          {savedClientId && (
            <>
              <button onClick={() => navigate(`/historico?clientId=${savedClientId}`)} className="btn-primary">
                Ver histórico
              </button>
              <button onClick={() => navigate(`/historico/evolucao?clientId=${savedClientId}`)} className="btn-secondary">
                Ver evolução
              </button>
            </>
          )}
          {savedHistoryId && (
            <button
              onClick={() => handleDownloadPdf(savedHistoryId)}
              disabled={downloadingPdf}
              className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download size={16} />
              {downloadingPdf ? "Gerando PDF..." : "Baixar PDF"}
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderMain() {
    if (wizardStep === "config") return renderConfigStage();
    if (wizardStep === "capture") return renderCaptureStage();
    if (wizardStep === "analyzing" && !result) return renderProcessingStage();
    if (wizardStep === "analyzing" && result) return renderResultStage();
    return null;
  }

  return (
    <main className="section-stack animate-page-in relative w-full pt-0">
      {fullscreenStatus.show && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[130] flex items-center justify-center" style={{ backgroundColor: "rgba(15, 23, 42, 0.34)" }}>
            <div className="flex flex-col items-center gap-3" style={{ color: "var(--color-text)" }}>
              <Loader2 className="h-8 w-8 animate-spin text-has-primary" />
              <p className="text-sm font-semibold">{fullscreenStatus.message || "Gerando transição..."}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Não feche a janela. Continuaremos automaticamente.</p>
            </div>
          </div>,
          document.body,
        )}

      <AnalysisWizardLayout
        heroSlot={
          <>
            {hasSession && activeClient && (
              <div className="space-y-3">
                <ActiveClientSessionBar
                  client={activeClient}
                  onOpenClient={() => navigate(`/clientes?clientId=${activeClient.id}`)}
                  onSwitchClient={() => setLookupOpen(true)}
                  onEndSession={() => setConfirmEndSessionOpen(true)}
                />
              </div>
            )}

            <AnalysisHero
              title="Análise Capilar"
              subtitle="Wizard em 3 etapas com inteligência estética ativa."
              chips={[
                {
                  label: "Modo",
                  value: analysisSourceLabel(normalizeAnalysisSource(mode)),
                  helper: flowState.mode === "completo" ? "Fluxo completo" : "Fluxo individual",
                },
                {
                  label: "Status",
                  value: statusLabel,
                  helper: progressLabel,
                  tone: wizardStep === "analyzing" && !result ? "warning" : result ? "success" : "default",
                },
                flowState.mode === "completo"
                  ? {
                      label: "Próximo passo",
                      value:
                        nextRequiredStep === "tricologica"
                          ? "Tricologia"
                          : nextRequiredStep === "capilar"
                            ? "Capilar"
                            : "Protocolo",
                    }
                  : null,
              ].filter(Boolean) as any}
              actions={[
                flowState.mode === "completo" && {
                  label: "Central integrada",
                  icon: <Sparkles size={16} />,
                  variant: "secondary" as const,
                  onClick: () => navigate("/analises"),
                },
                {
                  label: "Histórico",
                  icon: <Clock size={16} />,
                  variant: "ghost" as const,
                  onClick: () => navigate("/historico"),
                },
              ].filter(Boolean) as any}
            />
          </>
        }
        steps={
          <AnalysisStepProgress
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={(stepItem, index) => {
              if (index === 0) setStep("config");
            }}
          />
        }
        stats={[
          { id: "stage", label: "Etapa", value: statusLabel, helper: progressLabel },
          {
            id: "check",
            label: "Checklist",
            value: `${safetyChecklist.length - pendingChecklist}/${safetyChecklist.length}`,
            helper: pendingChecklist > 0 ? `${pendingChecklist} pendência(s)` : "Tudo validado",
            tone: pendingChecklist > 0 ? "warning" : "success",
          },
          {
            id: "client",
            label: "Cliente",
            value: selectedClient?.nome || activeClient?.nome || "Não definido",
            helper: flowState.mode === "completo" ? "Fluxo completo" : "Fluxo individual",
          },
          {
            id: "score",
            label: "Resultado",
            value: result ? `${result.score}/100` : "—",
            helper: result ? `${result.flags?.length ?? 0} alerta(s)` : "Sem score ainda",
            tone: result ? "success" : "default",
          },
        ]}
        main={renderMain()}
        sidebar={
          <AnalysisContextPanel
            readiness={{
              percent: safetyChecklist.length > 0 ? ((safetyChecklist.length - pendingChecklist) / safetyChecklist.length) * 100 : 0,
              checklist: safetyChecklist,
            }}
            sessionCard={
              result ? (
                <div className="text-sm" style={{ color: "var(--color-text)" }}>
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={16} className="text-[color:var(--accent-primary)]" />
                    Salvo no histórico
                  </div>
                  <p className="mt-2 text-sm">
                    Última análise registrada em {new Date(result.date).toLocaleString()}.
                  </p>
                </div>
              ) : undefined
            }
          />
        }
      />

      <ClientLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={(c) => {
          startClientSession(c);
          setSelectedClient(c);
          notify(`Sessão iniciada\n${c.nome || "Cliente"}`, "success");
        }}
      />

      <Modal
        title="Encerrar sessão da cliente"
        isOpen={confirmEndSessionOpen}
        onClose={() => setConfirmEndSessionOpen(false)}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          A análise atual será mantida, mas a navegação não ficará mais vinculada à cliente ativa.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmEndSessionOpen(false)}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              try {
                const clientName = activeClient?.nome || selectedClient?.nome;
                endClientSession();
                setSelectedClient(null);
                setStep("config");
                setConfirmEndSessionOpen(false);
                notify(clientName ? `Sessão encerrada\n${clientName}` : "Sessão encerrada.", "success");
              } catch (e: any) {
                notify(e?.message || "Não foi possível encerrar a sessão.", "error");
              }
            }}
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </main>
  );
}
