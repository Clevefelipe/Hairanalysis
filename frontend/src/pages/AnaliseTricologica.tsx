import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { JSX } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import ImageCapture from "@/components/vision/ImageCapture";
import { useAuth } from "@/context/AuthContext";
import { useClientSession } from "@/context/ClientSessionContext";
import { useToast } from "@/components/ui/ToastProvider";
import ClientLookupModal from "@/components/clientes/ClientLookupModal";
import AnalysisClientContextCard from "@/components/analysis/AnalysisClientContextCard";
import AnalysisModeSelector from "@/components/analysis/AnalysisModeSelector";
import AnalysisResultDetails from "@/components/analysis/AnalysisResultDetails";
import ProfessionalDecisionPanel from "@/components/analysis/ProfessionalDecisionPanel";
import HighTechIntegrityPanel from "@/components/analysis/HighTechIntegrityPanel";
import ActiveClientSessionBar from "@/components/analysis/ActiveClientSessionBar";
import AnalysisStepProgress from "@/components/analysis/AnalysisStepProgress";
import { obterClientePorId } from "@/core/cliente/cliente.service";
import { salvarVisionBackend } from "@/services/visionApi";
import { getHistoryPdf } from "@/services/history.service";
import PageHero from "@/components/ui/PageHero";
import Modal from "@/components/ui/Modal";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api"
).replace(/\/+$/, "");

type AnalysisMode = "imagem" | "video" | "tempo-real" | "microscopio";
type AnalysisStep = "config" | "capture" | "analyzing" | "processing" | "results";

interface AnalysisResult {
  score: number;
  flags: string[];
  signals: Record<string, any>;
  interpretation: string;
  date: string;
  uvFlags?: string[];
  microscopyAlerts?: string[];
  aiExplanation?: any;
  recommendations?: any;
  professionalAlert?: string;
  recomendacoes?: Array<{ titulo: string; descricao: string }>;
  historyId?: string;
}

const UV_FLAGS = [
  "Oleosidade excessiva",
  "Acúmulo de resíduos",
  "Microdescamação",
  "Áreas de baixa oxigenação",
  "Poros obstruídos (visual UV)",
  "Irregularidade de densidade aparente",
];

const MICRO_ALERTS = [
  "Microfissuras no fio",
  "Irregularidade de cutícula",
  "Resíduos aderidos",
  "Poros obstruídos",
  "Descamação localizada",
  "Fio sensibilizado",
];

type OverviewCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  helperClass?: string;
};

const CAPTURE_ENVIRONMENT_CARDS = [
  { label: "Região", value: "Couro cabeludo" },
  { label: "Distância", value: "10-20 cm" },
  { label: "Nitidez", value: "Raiz e densidade" },
] as const;

const CAPTURE_SEQUENCE_STEPS = [
  "1. Frontal da linha do cabelo.",
  "2. Lateral direita e esquerda.",
  "3. Região superior com foco em densidade.",
];

const CAPTURE_CHECKLIST_ITEMS = [
  "Separação limpa da região",
  "Sem sombra sobre a raiz",
  "Registro frontal e lateral",
];

const PROCESSING_CHECKLIST_ITEMS = [
  "Triagem clínica",
  "Microcirculação",
  "Microscopia de cutícula",
  "Risco inflamatório",
  "Score de integridade",
];

const normalizeAnalysisSource = (
  mode: AnalysisMode,
): "imagem" | "video" | "tempo-real" | "microscopio" => {
  if (mode === "video") return "video";
  if (mode === "tempo-real") return "tempo-real";
  if (mode === "microscopio") return "microscopio";
  return "imagem";
};

const analysisSourceLabel = (
  source: "imagem" | "video" | "tempo-real" | "microscopio",
): string => {
  if (source === "video") return "Frame em vídeo";
  if (source === "tempo-real") return "Tempo real";
  if (source === "microscopio") return "Microscópio";
  return "Captura fotográfica";
};

const PROFESSIONAL_ALERT_FALLBACKS = [
  {
    normalized:
      "analise com baixa confiabilidade tecnica. recomenda se nova captura de imagem.",
    text: "Análise com baixa confiabilidade técnica. Recomenda-se nova captura de imagem.",
  },
] as const;

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
    .replace(/Ã/g, "Á")
    .replace(/Ã/g, "Â")
    .replace(/Ã‰/g, "É")
    .replace(/ÃŠ/g, "Ê")
    .replace(/Ã/g, "Í")
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
  if (fallback) return fallback.text;
  return cleaned;
}

export default function AnaliseTricologica() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const {
    activeClient,
    hasSession,
    startSession: startClientSession,
    endSession: endClientSession,
    flowState,
    setFlowMode,
    markAnalysisCompleted,
    nextRequiredStep,
  } = useClientSession();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AnalysisStep>("config");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("imagem");
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fullscreenStatus, setFullscreenStatus] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });
  const [showTechnical, setShowTechnical] = useState(false);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [savedHistoryId, setSavedHistoryId] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [nextStepModal, setNextStepModal] = useState<{ open: boolean; title: string; description: string; targetUrl: string | null }>({
    open: false,
    title: "",
    description: "",
    targetUrl: null,
  });

  const [uvMode, setUvMode] = useState(false);
  const [uvFlags, setUvFlags] = useState<string[]>([]);
  const [microscopeOn, setMicroscopeOn] = useState(false);
  const [microscopeAlerts, setMicroscopeAlerts] = useState<string[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [fallbackProgress, setFallbackProgress] = useState(0);

  const [lookupOpen, setLookupOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    nome: string;
    telefone?: string;
  } | null>(null);
  const [confirmEndSessionOpen, setConfirmEndSessionOpen] = useState(false);
  const autoSessionInitRef = useRef<string | null>(null);
  const premiumGoal = searchParams.get("premiumGoal");
  const premiumNote = searchParams.get("premiumNote");
  const flowParam = (searchParams.get("flow") ?? null) as
    | "completo"
    | "capilar_individual"
    | "tricologica_individual"
    | null;
  const manualJourney = searchParams.get("journey") === "manual";
  const manualTricologica = searchParams.get("tricologica") === "1";
  const manualCapilar = searchParams.get("capilar") === "1";
  const journeyStepParam = searchParams.get("journeyStep");
  const isCompleteFlow = flowParam === "completo" || flowState.mode === "completo";
  const wizardStep = step === "processing" || step === "results" ? "analyzing" : step;

  // ================= SESSION =================

  async function startSession(clientId?: string) {
    if (!token) {
      notify("Sessão expirada. Entre novamente para iniciar a análise.", "error");
      return false;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/vision/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: clientId || activeClient?.id || "cliente_demo",
          analysisType: "tricologica",
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Erro ao iniciar sessão" }));
        throw new Error(error?.message || "Falha ao iniciar sessão");
      }

      const data = await res.json();
      if (!data?.id) throw new Error("Sessão inválida");

      setSessionId(data.id);
      setStep("config");
      notify("Sessão tricológica iniciada.", "success");
      return true;
    } catch (e: any) {
      notify(e.message || "Erro ao iniciar sessão", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // ================= AUTO CLIENT =================

  useEffect(() => {
    if (!token) return;
    if (!clientIdParam) return;

    const initKey = `${clientIdParam}:${flowParam ?? "default"}`;
    if (autoSessionInitRef.current === initKey) return;
    autoSessionInitRef.current = initKey;

    obterClientePorId(clientIdParam)
      .then((cliente) => {
        const incomingMode = flowParam === "completo" ? "completo" : "tricologica_individual";
        startClientSession(cliente as any, incomingMode);
        setSelectedClient(cliente as any);
        startSession(cliente.id);
      })
      .catch(() => {
        autoSessionInitRef.current = null;
        notify("Cliente não encontrado", "error");
      });
  }, [token, clientIdParam, flowParam, notify, startClientSession]);

  useEffect(() => {
    if (!hasSession || !activeClient) return;
    setSelectedClient({
      id: activeClient.id,
      nome: activeClient.nome,
      telefone: activeClient.telefone,
    });
  }, [activeClient, hasSession]);

  useEffect(() => {
    if (!premiumNote || observacoes.trim()) return;
    setObservacoes(premiumNote);
  }, [observacoes, premiumNote]);

  useEffect(() => {
    if (mode !== "tempo-real") return;
    if (!microscopeOn) {
      setMicroscopeOn(true);
    }
  }, [microscopeOn, mode]);

  useEffect(() => {
    if (!setFlowMode) return;
    
    // Se não há parâmetro flow, assume modo individual (acesso direto pelo sidebar)
    if (!flowParam) {
      const targetMode: "tricologica_individual" = "tricologica_individual";
      if (flowState.mode !== targetMode) {
        setFlowMode(targetMode);
      }
      return;
    }
    
    if (flowParam === "completo") {
      if (flowState.mode !== "completo") {
        setFlowMode("completo");
      }
      return;
    }

    if (flowState.mode === "completo") {
      return;
    }

    const targetMode: "tricologica_individual" = "tricologica_individual";
    if (flowState.mode !== targetMode) {
      setFlowMode(targetMode);
    }
  }, [flowParam, flowState.mode, setFlowMode]);

  const buildFlowUrl = useCallback(
    (path: string, opts?: { forceFlow?: boolean }) => {
      const params = new URLSearchParams();
      const clientParam = activeClient?.id || searchParams.get("clientId");
      if (clientParam) params.set("clientId", clientParam);
      if (premiumGoal) params.set("premiumGoal", premiumGoal);
      if (premiumNote) params.set("premiumNote", premiumNote);
      if (opts?.forceFlow || flowState.mode === "completo") {
        params.set("flow", "completo");
      }

      const query = params.toString();
      return query ? `${path}?${query}` : path;
    },
    [activeClient?.id, flowState.mode, premiumGoal, premiumNote, searchParams],
  );

  // ================= MICROSCOPE SIM =================

  useEffect(() => {
    if (!microscopeOn) return;

    const interval = setInterval(() => {
      setMicroscopeAlerts((prev) => {
        if (prev.length >= 6) return prev;
        const next =
          MICRO_ALERTS[Math.floor(Math.random() * MICRO_ALERTS.length)];
        if (prev.includes(next)) return prev;
        return [...prev, next];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [microscopeOn]);

  // ================= CAPTURE =================

  const manualCapilarIntent = useMemo(() => {
    const isCurrentManualStep = manualJourney && manualTricologica && (journeyStepParam === "tricologica" || !journeyStepParam);
    if (!isCurrentManualStep || !manualCapilar) return null;

    const params = new URLSearchParams(searchParams);
    params.set("journeyStep", "capilar");

    return {
      url: `/analise-capilar?${params.toString()}`,
      title: "Avançar para análise capilar",
      description: "Você marcou que deseja continuar com a análise capilar nesta jornada manual. Confirmar avanço agora?",
    } as const;
  }, [journeyStepParam, manualCapilar, manualJourney, manualTricologica, searchParams]);

  const integratedCapilarIntent = useMemo(() => {
    if (!(flowParam === "completo" || flowState.mode === "completo")) return null;
    return {
      url: buildFlowUrl("/analise-capilar", { forceFlow: true }),
      title: "Continuar protocolo completo",
      description: "A etapa capilar é a sequência obrigatória do protocolo completo. Deseja continuar agora?",
    } as const;
  }, [buildFlowUrl, flowParam, flowState.mode]);

  const defaultNextIntent = integratedCapilarIntent ?? manualCapilarIntent ?? null;

  const promptNextStep = useCallback(
    (intent?: typeof defaultNextIntent) => {
      const chosen = intent ?? defaultNextIntent;
      if (!chosen) return;
      setNextStepModal({ open: true, title: chosen.title, description: chosen.description, targetUrl: chosen.url });
    },
    [defaultNextIntent],
  );

  useEffect(() => {
    if (wizardStep !== "analyzing" || result) return;
    if (!sessionId) return;

    let cancelled = false;
    let intervalId: number;

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API}/vision/status/${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        const p = typeof data?.progress === "number" ? clamp(data.progress) : null;
        if (p !== null && !cancelled) setAnalysisProgress(p);
      } catch {
        /* silencia polling */
      }
    };

    fetchProgress();
    intervalId = window.setInterval(fetchProgress, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [API, wizardStep, result, sessionId, token]);

  // fallback suave para não ficar em 0% se API demorar
  useEffect(() => {
    if (wizardStep !== "analyzing" || result) {
      setFallbackProgress(0);
      return;
    }

    let rafId: number;
    const start = performance.now();
    const duration = 9000;

    const tick = () => {
      const elapsed = performance.now() - start;
      const eased = Math.min(90, Math.round((elapsed / duration) * 90));
      setFallbackProgress(eased);
      if (eased < 90 && wizardStep === "analyzing" && !result) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [wizardStep, result]);

  async function handleCapture(file: File) {
    if (!sessionId) {
      notify("Inicie ou recupere uma sessão ativa antes da captura.", "error");
      return;
    }

    if (!token) {
      notify("Token de autenticação não encontrado. Faça login novamente.", "error");
      setStep("config");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setStep("analyzing");
    setIsLoading(true);
    const source = normalizeAnalysisSource(mode);
    const sourceLabel = analysisSourceLabel(source);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      formData.append("type", "tricologica");
      formData.append("source", source);
      formData.append("notes", observacoes);
      formData.append("uvMode", uvMode ? "true" : "false");
      formData.append("uvFlags", JSON.stringify(uvFlags));
      formData.append(
        "microscopy",
        JSON.stringify({
          enabled: microscopeOn,
          alerts: microscopeAlerts,
          capturedAt: new Date().toISOString(),
        }),
      );

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${API}/vision/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const raw = await res.text();
        let apiMessage = "";
        try {
          const parsed = JSON.parse(raw);
          apiMessage = parsed?.message || parsed?.error || "";
        } catch {
          apiMessage = raw;
        }
        throw new Error(apiMessage || `Erro HTTP: ${res.status}`);
      }

      const raw = await res.json();
      const data = {
        score: Number(raw?.score) || 0,
        flags: Array.isArray(raw?.flags) ? raw.flags : [],
        signals: raw?.signals && typeof raw.signals === "object" ? raw.signals : {},
        interpretation: raw?.interpretation || "",
        analyzedAt: raw?.analyzedAt,
        recomendacoes: Array.isArray(raw?.recomendacoes) ? raw.recomendacoes : [],
      };

      const criticalCompleteness = Number(
        (data.signals as any)?.analysis_quality?.criticalCompleteness ??
          (raw?.analysis_quality as any)?.criticalCompleteness,
      );
      const isLowQuality = Number.isFinite(criticalCompleteness) && criticalCompleteness < 60;
      if (isLowQuality) {
        notify(
          `Captura inconclusiva (${Math.max(0, Math.round(criticalCompleteness))}% de completude crítica). Refaça com foco e luz frontal difusa.`,
          "warning",
        );
        setResult(null);
        setPreview(null);
        setStep("config");
        return;
      }

      let savedHistory: any = null;

      try {
        const finalClientId =
          selectedClient?.id ||
          searchParams.get("clientId") ||
          "cliente_demo";

        savedHistory = await salvarVisionBackend(finalClientId, {
          type: "tricologica",
          source,
          sourceLabel,
          visionResult: {
            type: "tricologica",
            source,
            sourceLabel,
            score: data.score,
            flags: data.flags,
            signals: data.signals,
            interpretation: data.interpretation,
            analyzedAt: data.analyzedAt,
            uvFlags,
            microscopy: {
              enabled: microscopeOn,
              alerts: microscopeAlerts,
            },
          },
          interpretation: data.interpretation || "",
          signals: data.signals || {},
        });

        setSavedClientId(finalClientId);
        setSavedHistoryId(savedHistory?.id ?? null);
      } catch (e: any) {
        notify(
          e?.message ||
            "A análise foi concluída, mas não foi possível salvar no histórico.",
          "error",
        );
      }

      setResult({
        score: Number(savedHistory?.visionResult?.score) || data.score,
        flags: Array.isArray(savedHistory?.visionResult?.flags)
          ? savedHistory.visionResult.flags
          : Array.isArray(data.flags)
            ? data.flags
            : [],
        signals:
          (savedHistory?.visionResult?.signals && typeof savedHistory.visionResult.signals === "object"
            ? savedHistory.visionResult.signals
            : data.signals) || {},
        interpretation:
          savedHistory?.aiExplanation?.summary || savedHistory?.visionResult?.interpretation || data.interpretation || "",
        date: savedHistory?.createdAt
          ? new Date(savedHistory.createdAt).toLocaleString()
          : new Date().toLocaleString(),
        uvFlags,
        microscopyAlerts: microscopeAlerts,
        aiExplanation: savedHistory?.aiExplanation || null,
        recommendations: savedHistory?.recommendations || null,
        professionalAlert:
          (typeof savedHistory?.professionalAlert === "string" &&
          savedHistory.professionalAlert.trim()
            ? savedHistory.professionalAlert
            : "") ||
          (typeof savedHistory?.recommendations?.professionalAlert === "string" &&
          savedHistory.recommendations.professionalAlert.trim()
            ? savedHistory.recommendations.professionalAlert
            : ""),
        recomendacoes:
          Array.isArray(savedHistory?.recomendacoes)
            ? savedHistory.recomendacoes
            : Array.isArray(savedHistory?.visionResult?.recomendacoes)
              ? savedHistory.visionResult.recomendacoes
              : data.recomendacoes,
        historyId: savedHistory?.id,
      });

      markAnalysisCompleted("tricologica", savedHistory?.id);

      setStep("results");
      notify(`Análise tricológica concluída (${sourceLabel})`, "success");

      if (isCompleteFlow) {
        setFullscreenStatus({
          show: true,
          message: "Concluindo tricologia e iniciando etapa capilar...",
        });
        setTimeout(() => {
          navigate(buildFlowUrl("/analise-capilar", { forceFlow: true }));
        }, 1800);
      } else {
        promptNextStep();
      }
    } catch (e: any) {
      const msg =
        e?.message === "TIMEOUT"
          ? "Tempo excedido na análise tricológica. Tente novamente ou avance para a capilar."
          : e?.message || e?.response?.data?.message || "Erro na análise";
      notify(msg, "error");
      setStep("config");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadPdf(historyId: string) {
    try {
      setDownloadingPdf(true);
      const blob = await getHistoryPdf(historyId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analise-tricologica-${historyId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notify("PDF gerado com sucesso.", "success");
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Erro ao gerar PDF";
      notify(message, "error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  // ================= RENDER =================

  const steps = useMemo(
    () => [
      { key: "config", label: "Configuração" },
      { key: "capture", label: "Captura" },
      { key: "analyzing", label: "Resultado" },
    ],
    [],
  );

  const currentStepIndex = steps.findIndex((s) => s.key === wizardStep);
  const premium = result?.aiExplanation;
  const rec = result?.recommendations;
  const professionalAlertText =
    (typeof result?.professionalAlert === "string" && result.professionalAlert.trim()) ||
    (typeof rec?.professionalAlert === "string" && rec.professionalAlert.trim()) ||
    (result?.flags?.length
      ? "Existem sinais tricológicos de atenção. Valide o caso no histórico detalhado antes da conduta final."
      : "Sem alertas críticos no recorte atual. Confirme o histórico antes de concluir o protocolo.") ||
    "";
  const displayProfessionalAlert = useMemo(
    () => sanitizeProfessionalAlert(professionalAlertText),
    [professionalAlertText],
  );
  const hasResult = wizardStep === "analyzing" && !!result;
  const [immersiveMode, setImmersiveMode] = useState(true);
  const isAnalysisModalOpen = immersiveMode || wizardStep !== "config";
  const lastAnalysisLabel = result?.date
    ? new Date(result.date).toLocaleString()
    : null;

  useEffect(() => {
    if (wizardStep !== "config") {
      setImmersiveMode(true);
    }
  }, [wizardStep]);

  const statusLabel =
    wizardStep === "config"
      ? "Configuração"
      : wizardStep === "capture"
        ? "Captura"
        : hasResult
          ? "Resultado"
          : "Processando";

  const heroActions = [
    flowState.mode === "completo" && {
      label: "Voltar à central integrada",
      variant: "ghost" as const,
      onClick: () => navigate("/analises"),
    },
  ].filter(Boolean) as {
    label: string;
    icon?: JSX.Element;
    variant?: "primary" | "secondary" | "ghost";
    onClick?: () => void;
  }[];

  const pendingCapilar = isCompleteFlow && !flowState.capilarDone;
  const readyForProtocol = isCompleteFlow && flowState.capilarDone && flowState.tricologicaDone;
  const source = normalizeAnalysisSource(mode);
  const modeUiLabel = analysisSourceLabel(source);
  const heroMeta = [
    { label: "Modo", value: modeUiLabel },
    { label: "Status", value: statusLabel },
    flowState.mode === "completo"
      ? {
          label: "Próximo passo",
          value: pendingCapilar
            ? "Análise capilar"
            : readyForProtocol
              ? "Protocolo"
              : "",
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const safetyChecklist = useMemo(
    () => {
      const hasClient = Boolean(selectedClient || activeClient);
      const hasSessionActive = Boolean(sessionId);
      const hasContextNotes = Boolean((observacoes || "").trim() || premiumGoal || premiumNote);
      const hasAdvancedSignals = uvMode || microscopeOn;
      const hasRecordedResult = Boolean(result);

      return [
        {
          key: "client",
          label: "Cliente confirmado",
          description: "Vincula histórico e rastreabilidade da sessão tricológica.",
          complete: hasClient,
        },
        {
          key: "session",
          label: "Sessão IA ativa",
          description: "Sessão ativa garante registro técnico com data e contexto.",
          complete: hasSessionActive,
        },
        {
          key: "context",
          label: "Contexto clínico registrado",
          description: "Notas premium orientam leitura de risco sem extrapolar conduta.",
          complete: hasContextNotes,
        },
        {
          key: "signals",
          label: "Sinais avançados (UV/microscópio)",
          description: "Opcional, mas recomendado para enriquecer a triagem do couro cabeludo.",
          complete: hasAdvancedSignals || mode === "imagem" || mode === "video",
        },
        {
          key: "result",
          label: "Resultado registrado",
          description: "Concluir análise para liberar o próximo passo no fluxo.",
          complete: hasRecordedResult,
        },
      ];
    },
    [
      activeClient,
      microscopeAlerts.length,
      microscopeOn,
      mode,
      observacoes,
      premiumGoal,
      premiumNote,
      result,
      selectedClient,
      sessionId,
      uvFlags.length,
      uvMode,
    ],
  );
  const pendingChecklist = safetyChecklist.filter((item) => !item.complete).length;
  const completedChecklist = safetyChecklist.length - pendingChecklist;
  const checklistProgressPct =
    safetyChecklist.length > 0
      ? Math.round((completedChecklist / safetyChecklist.length) * 100)
      : 0;
  const progressLabel =
    wizardStep === "config"
      ? "Aguardando início"
      : wizardStep === "capture"
        ? "Pronto para capturar"
        : hasResult
          ? "Resultado gerado"
          : "Processando";
  const attentionToneClass =
    pendingChecklist > 0 ? "text-has-warning" : "text-has-success";
  const overviewCards = useMemo<OverviewCard[]>(
    () => [
      {
        id: "stage",
        label: "Etapa atual",
        value: statusLabel,
        helper: progressLabel,
      },
      {
        id: "checklist",
        label: "Checklist técnico",
        value: `${completedChecklist}/${safetyChecklist.length}`,
        helper: pendingChecklist > 0 ? `${pendingChecklist} pendência(s)` : "Tudo validado",
        helperClass: attentionToneClass,
      },
      {
        id: "client",
        label: "Cliente",
        value: selectedClient?.nome || activeClient?.nome || "Não definido",
        helper: flowState.mode === "completo" ? "Fluxo completo" : "Fluxo individual",
      },
      {
        id: "result",
        label: "Resultado",
        value: hasResult && result ? `${result.score}/100` : "—",
        helper:
          hasResult && result
            ? `${result.flags?.length ?? 0} alerta(s)`
            : "Sem score ainda",
      },
    ],
    [
      statusLabel,
      progressLabel,
      completedChecklist,
      safetyChecklist.length,
      pendingChecklist,
      attentionToneClass,
      selectedClient?.nome,
      activeClient?.nome,
      flowState.mode,
      hasResult,
      result,
    ],
  );

  function renderMain() {
    if (wizardStep === "config") {
      return (
        <div className="space-y-6">
          <AnalysisClientContextCard
            selectedClient={selectedClient}
            observations={observacoes}
            onObservationsChange={setObservacoes}
            onSelectClient={() => setLookupOpen(true)}
            placeholder="Observações técnicas, sensações relatadas, histórico químico..."
            extra={
              premiumGoal || premiumNote ? (
                <div className="rounded-2xl border border-has-success/30 bg-has-success/10 p-3 text-xs text-has-success">
                  Plano premium aplicado{premiumGoal ? ` (objetivo: ${premiumGoal})` : ""}.
                </div>
              ) : null
            }
          />

          <AnalysisModeSelector
            selected={mode}
            onChange={(value) => setMode(value as AnalysisMode)}
            options={[
              {
                value: "imagem",
                title: "Captura fotográfica",
                description: "Recomendado para acompanhamento e registros rápidos.",
              },
              {
                value: "video",
                title: "Frame em vídeo",
                description: "Utilize vídeo para avaliar brilho e microcirculação.",
              },
              {
                value: "tempo-real",
                title: "Tempo real",
                description: "Modo contínuo com apoio de microscopia para triagem dinâmica.",
              },
            ]}
          />

          <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Modos avançados</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Luz UV e microscopia auxiliam a detectar oleosidade e descamação.</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-text)" }}>
                <input
                  type="checkbox"
                  checked={uvMode}
                  onChange={(e) => setUvMode(e.target.checked)}
                />
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
                          prev.includes(flag)
                            ? prev.filter((f) => f !== flag)
                            : [...prev, flag],
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
              const ok = await startSession(selectedClient.id);
              if (ok) {
                setStep("capture");
              }
            }}
            disabled={isLoading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Iniciando sessão..." : "Iniciar análise"}
          </button>
        </div>
      );
    }

    if (wizardStep === "capture") {
      return (
        <div className="space-y-6">
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>
                  Captura tricológica
                </p>
                <p className="mt-3 text-2xl font-semibold">
                  Capture o couro cabeludo com padrão clínico e comparável.
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Estruture os registros por região para avaliar descamação, sensibilidade e densidade ao longo do tempo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                  UV: {uvMode ? "Ativa" : "Inativa"}
                </span>
                <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                  Microscópio: {microscopeOn ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
            <div className="rounded-xl border p-5 capture-card-premium capture-stage-enter capture-stage-enter-delay-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <ImageCapture
                onCapture={handleCapture}
                isProcessing={isLoading}
                title="Captura guiada para análise tricológica"
                subtitle="Foque couro cabeludo, densidade e sinais de sensibilidade para leitura clínica mais assertiva."
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3 capture-card-subtle" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Região</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>Couro cabeludo</p>
                </div>
                <div className="rounded-lg border p-3 capture-card-subtle" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Distância</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>10-20 cm</p>
                </div>
                <div className="rounded-lg border p-3 capture-card-subtle" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Nitidez</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>Raiz e densidade</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border p-4 capture-card-subtle" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Sequência recomendada</p>
                <ol className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
                  <li>1. Frontal da linha do cabelo.</li>
                  <li>2. Lateral direita e esquerda.</li>
                  <li>3. Região superior com foco em densidade.</li>
                </ol>
              </div>
            </div>

            <div className="space-y-4 capture-stage-enter capture-stage-enter-delay-2">
              <div className="rounded-xl border p-5 capture-card-premium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>Modos ativos</p>
                <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                  <p className="flex items-center gap-2"><CheckCircle2 size={14} className={uvMode ? "text-has-primary" : "text-[var(--color-text-muted)]"} /> Luz UV: <strong>{uvMode ? "Ativa" : "Inativa"}</strong></p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={14} className={microscopeOn ? "text-has-primary" : "text-[var(--color-text-muted)]"} /> Microscópio: <strong>{microscopeOn ? "Ativo" : "Inativo"}</strong></p>
                </div>
              </div>

              <div className="rounded-xl border p-5 capture-card-premium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>Checklist clínico</p>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-has-primary" /> Separação limpa da região</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-has-primary" /> Sem sombra sobre a raiz</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-has-primary" /> Registro frontal e lateral</li>
                </ul>
              </div>
            </div>
          </div>

          {preview && wizardStep === "capture" && (
            <div className="rounded-xl border p-4 capture-preview-premium capture-stage-enter capture-stage-enter-delay-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>Pré-visualização confirmada</p>
              <img src={preview} alt="Pré-visualização" className="mt-3 w-full rounded-lg border" style={{ borderColor: "var(--color-border)" }} />
            </div>
          )}
        </div>
      );
    }

    if (wizardStep === "analyzing" && !result) {
      const progressoLateral = Math.max(analysisProgress || 0, fallbackProgress || 0);

      return (
        <div className="space-y-5">
          <div
            className="rounded-3xl border p-5 md:p-7 premium-card"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.12)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                  IA em processamento · Tricologia
                </p>
                <h3 className="text-2xl font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
                  Lendo couro cabeludo, microscopia e sinais de sensibilidade
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Mantemos protocolo ativo, consolidando achados com rastreabilidade e foco em segurança.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                  Confiabilidade ativa
                </span>
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                  UV {uvMode ? "ligado" : "desligado"}
                </span>
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                  Microscopia {microscopeOn ? "ativa" : "pausada"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.55fr,1fr]">
              <div className="relative overflow-hidden rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="relative flex flex-col gap-6 text-center">
                  <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 0 0 6px rgba(10,132,255,0.08)" }} />
                      Integridade do couro cabeludo
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-success-500)" }} />
                      IA premium com rastreabilidade
                    </span>
                  </div>

                  <div className="relative mx-auto h-60 w-60 sm:h-64 sm:w-64">
                    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`Progresso ${progressoLateral}%`}>
                      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                      <circle
                        cx="100"
                        cy="100"
                        r="92"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 92}`}
                        strokeDashoffset={`${2 * Math.PI * 92 - (Math.min(100, Math.max(0, progressoLateral)) / 100) * 2 * Math.PI * 92}`}
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-surface)", boxShadow: "0 10px 40px rgba(15,23,42,0.08)" }}>
                      <p className="text-4xl font-semibold" style={{ color: "var(--color-text)" }}>{progressoLateral}%</p>
                      <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Processando análise</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "UV", value: uvMode ? "Ativo" : "Inativo" },
                      { label: "Flags UV", value: `${uvFlags.length || 0}` },
                      { label: "Microscopia", value: microscopeOn ? `${microscopeAlerts.length || 0} alertas` : "Desligada" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border px-3 py-2 text-left" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Checklist técnico em tempo real</p>
                  <div className="mt-3 grid gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                    {["Triagem clínica", "Microcirculação", "Microscopia de cutícula", "Risco inflamatório", "Score de integridade"].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <span>{item}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--color-success-700)]">
                          <span className="h-2 w-2 rounded-full bg-[color:var(--color-success-500)] animate-pulse" /> Em processamento
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Linha do tempo</p>
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>{progressoLateral}%</span>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }} aria-label={`Progresso ${progressoLateral}%`}>
                    <div
                      className="h-full has-progress-bar-animated"
                      style={{
                        width: `${Math.min(100, Math.max(0, progressoLateral))}%`,
                        backgroundColor: "var(--color-primary)",
                        transition: "width 0.45s ease",
                        boxShadow: "0 6px 18px rgba(10,132,255,0.2)",
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Continuamos avaliando couro cabeludo, microscopia e sinais inflamatórios. Você será avisado quando o laudo estiver pronto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === "analyzing" && result) {
      return (
        <div className="space-y-6">
          <div className="rounded-xl border p-5" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#166534" }}>
              1º passo do profissional
            </p>
            <p className="mt-2 text-base font-semibold" style={{ color: "#166534" }}>
              Confira primeiro o histórico detalhado desta cliente.
            </p>
            <p className="mt-2 text-sm whitespace-pre-line" style={{ color: "#166534" }}>
              {displayProfessionalAlert}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(savedHistoryId || savedClientId || selectedClient?.id) && (
                <>
                  <button
                    onClick={() => {
                      const targetId = savedHistoryId;
                      if (targetId) {
                        navigate(`/historico/${targetId}`);
                      } else if (savedClientId || selectedClient?.id) {
                        navigate(`/historico?clientId=${savedClientId || selectedClient?.id}`);
                      }
                    }}
                    className="btn-primary"
                  >
                    Abrir histórico
                  </button>
                  <button
                    onClick={() => {
                      const cid = savedClientId || selectedClient?.id;
                      if (cid) {
                        navigate(`/historico/evolucao?clientId=${cid}`);
                      }
                    }}
                    className="btn-secondary"
                    disabled={!savedClientId && !selectedClient?.id}
                  >
                    Ver evolução
                  </button>
                </>
              )}
            </div>
          </div>

          <ProfessionalDecisionPanel
            score={result.score}
            flags={result.flags}
            recommendations={result.recommendations}
            interpretation={result.interpretation}
          />
          <AnalysisResultDetails
            kind="tricologica"
            signals={result.signals}
            flags={result.flags}
            recommendations={result.recommendations}
          />
          <HighTechIntegrityPanel
            score={result.score}
            flags={result.flags}
            interpretation={result.interpretation}
            riskLevel={typeof premium?.riskLevel === "string" ? premium.riskLevel : null}
            riskFactors={Array.isArray(premium?.riskFactors) ? premium.riskFactors : []}
            confidence={premium?.analysisConfidence ?? premium?.confidence ?? null}
          />

          {typeof premium?.summary === "string" && premium.summary.trim() !== "" && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-3" style={{ color: "var(--color-primary)" }}>
                <Sparkles size={18} />
                <p className="text-sm font-semibold">Resumo técnico assistido por IA</p>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line" style={{ color: "var(--color-text)" }}>{premium.summary}</p>
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
                <p className="mt-3 text-sm whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>{premium.technicalDetails}</p>
              )}
            </div>
          )}

          {displayProfessionalAlert && (
            <div className="rounded-lg border p-4" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb", color: "#92400e", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={16} />
                Alerta profissional
              </div>
              <p className="mt-2 text-sm whitespace-pre-line">{displayProfessionalAlert}</p>
              {sessionId && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setPreview(null);
                      setStep("config");
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

          {(result.uvFlags?.length ?? 0) > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Flags UV detectadas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.uvFlags?.map((flag) => (
                  <span key={flag} className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--accent-soft)", color: "var(--color-primary)" }}>
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(result.microscopyAlerts?.length ?? 0) > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Alertas microscópicos</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                {result.microscopyAlerts?.map((alert) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
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
            
            {/* Botão para continuar fluxo integrado */}
            {(integratedCapilarIntent || manualCapilarIntent) && (
              <button
                onClick={() => promptNextStep()}
                className="btn-primary"
              >
                {(flowParam === "completo" || flowState.mode === "completo")
                  ? "Continuar para Análise Capilar ->"
                  : "Seguir para a análise capilar selecionada ->"}
              </button>
            )}
            
            {savedClientId && (
              <>
                <button
                  onClick={() => navigate(`/historico?clientId=${savedClientId}`)}
                  className="btn-primary"
                >
                  Ver histórico
                </button>
                <button
                  onClick={() => navigate(`/historico/evolucao?clientId=${savedClientId}`)}
                  className="btn-secondary"
                >
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

    return null;
  }

  return (
    <main
      className={`section-stack animate-page-in relative w-full pt-0 ${
        isAnalysisModalOpen ? "h-screen overflow-hidden" : ""
      }`}
    >
      {fullscreenStatus.show && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[130] flex items-center justify-center" style={{ backgroundColor: "rgba(15, 23, 42, 0.34)" }}>
            <div className="flex flex-col items-center gap-3" style={{ color: "var(--color-text)" }}>
              <Loader2 className="h-8 w-8 animate-spin text-has-primary" />
              <p className="text-sm font-semibold">
                {fullscreenStatus.message || "Gerando transição para análise capilar..."}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Não feche a janela. Continuaremos automaticamente.</p>
            </div>
          </div>,
          document.body,
        )}

      {!isAnalysisModalOpen && (
        <div className="space-y-3 md:space-y-4">
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

          <PageHero
            title="Análise Tricológica"
            subtitle="Wizard premium com modos avançados (UV + microscópio) e inteligência estética ativa."
            meta={heroMeta}
            actions={heroActions}
          />

          <AnalysisStepProgress
            steps={steps}
            currentStepIndex={currentStepIndex}
          />

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => (
              <article
                key={card.id}
                className="panel-tight"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {card.label}
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  {card.value}
                </p>
                <p
                  className={`text-xs ${card.helperClass ?? ""}`.trim()}
                  style={card.helperClass ? undefined : { color: "var(--color-text-muted)" }}
                >
                  {card.helper}
                </p>
              </article>
            ))}
          </section>

          <section className="grid-dense lg:grid-cols-[2fr,1fr] items-start w-full gap-3 md:gap-4">
            <div className="panel-tight premium-card p-3 md:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <div key={wizardStep} className="analysis-stage-transition">
                {renderMain()}
              </div>
            </div>

            <aside className="section-stack lg:sticky lg:top-2">
              <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                  <Clock size={16} />
                  Sessão
                </div>
                <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{sessionId ? "Ativa" : "Aguardando"}</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {sessionId ? "Sessão IA conectada" : "Clique em Iniciar análise"}
                </p>
              </div>

              <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Prontidão da análise</p>
                  <span className={`text-xs font-semibold ${attentionToneClass}`}>{checklistProgressPct}%</span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, checklistProgressPct))}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
                <ul className="mt-3 space-y-2">
                  {safetyChecklist.map((item) => (
                    <li key={item.key} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                        {item.complete ? "Concluído" : "Pendente"} • {item.label}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Modos avançados</p>
                <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <p>
                    Luz UV: <span className="font-semibold">{uvMode ? "Ativa" : "Inativa"}</span>
                  </p>
                  <p>
                    Microscópio: <span className="font-semibold">{microscopeOn ? "Capturando" : "Desligado"}</span>
                  </p>
                  {uvMode && uvFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uvFlags.map((flag) => (
                        <span key={flag} className="rounded-full border px-2 py-1 text-[11px]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--accent-soft)", color: "var(--color-primary)" }}>
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {hasResult && result && (
                <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 size={16} className="text-has-primary" />
                    Salvo no histórico
                  </div>
                  <p className="mt-2 text-sm">
                    {lastAnalysisLabel
                      ? `Última análise registrada em ${lastAnalysisLabel}.`
                      : "Análise registrada, mas sem registro de data."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => {
                        const historyIdForNavigation = savedHistoryId || result.historyId;
                        if (historyIdForNavigation) navigate(`/historico/${historyIdForNavigation}`);
                      }}
                      disabled={!(savedHistoryId || result.historyId)}
                    >
                      Abrir detalhe
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => {
                        const cid = savedClientId || selectedClient?.id || activeClient?.id;
                        if (cid) navigate(`/historico?clientId=${cid}`);
                      }}
                      disabled={!(savedClientId || selectedClient?.id || activeClient?.id)}
                    >
                      Histórico cliente
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </section>
        </div>
      )}

      {isAnalysisModalOpen && typeof document !== "undefined" &&
        createPortal(
        <div className="fixed inset-0 z-[200] overflow-hidden" style={{ backgroundColor: "rgba(15, 23, 42, 0.34)" }}>
          <div className="flex h-full w-full flex-col overflow-hidden border-0" style={{ backgroundColor: "var(--color-bg)" }}>
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Modo imersivo</p>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Análise Tricológica em tela cheia</h2>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Fluxo técnico contínuo da captura ao resultado.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {flowState.mode === "completo" && (
                    <span className="inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                      Fluxo completo • Etapa 1/2
                    </span>
                  )}
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>Triagem clínica</span>
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>Confiabilidade ativa</span>
                </div>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                onClick={() => {
                  if (isLoading) return;
                  setStep("config");
                  setImmersiveMode(false);
                }}
                disabled={isLoading}
              >
                <X size={14} /> {isLoading ? "Processando..." : "Fechar"}
              </button>
            </div>

            {wizardStep === "analyzing" && !result && (
              <div className="premium-shimmer-track h-1 w-full rounded-none" style={{ backgroundColor: "#e5e7eb" }}>
                <div className="premium-shimmer-bar" style={{ backgroundColor: "var(--color-primary)" }} />
              </div>
            )}

            <div className="border-b px-4 py-2 sm:px-6 sm:py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <AnalysisStepProgress steps={steps} currentStepIndex={currentStepIndex} />
            </div>

            <div className="analysis-grid-immersive">
              <div className="min-h-0 overflow-y-auto px-3 pb-3 pt-0 sm:px-6 sm:pb-4 sm:pt-1">
                <div className="analysis-immersive-shell">
                  <div className="panel-tight premium-card analysis-card-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <div key={`immersive-${wizardStep}`} className="analysis-stage-transition">
                      {renderMain()}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="hidden min-h-0 overflow-y-auto border-l p-4 lg:block" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="section-stack">
                  <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                      <Clock size={16} />
                      Sessão
                    </div>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{sessionId ? "Ativa" : "Aguardando"}</p>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {sessionId ? "Sessão IA conectada" : "Clique em Iniciar análise"}
                    </p>
                  </div>

                  <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Modos avançados</p>
                    <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      <p>Luz UV: <strong>{uvMode ? "Ativa" : "Inativa"}</strong></p>
                      <p>Microscópio: <strong>{microscopeOn ? "Capturando" : "Desligado"}</strong></p>
                    </div>
                  </div>

                  {wizardStep === "analyzing" && !result && (
                    <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="h-8 w-8 animate-spin rounded-full border-2"
                          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Processando análise</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Sincronizando leitura clínica e consolidando indicadores.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {["Analisando microcirculação", "Detectando descamação/oleosidade", "Checando risco inflamatório"].map((label) => (
                          <div
                            key={label}
                            className="rounded-md border px-2 py-2 text-xs font-semibold"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                          >
                            {label} · em processamento
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <ClientLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={(c) => {
          startClientSession(c);
          setSelectedClient(c);
          notify("Cliente selecionado", "success");
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
                endClientSession();
                setSelectedClient(null);
                setStep("config");
                setConfirmEndSessionOpen(false);
                notify("Sessão do cliente encerrada.", "success");
              } catch (e: any) {
                notify(e?.message || "Não foi possível encerrar a sessão.", "error");
              }
            }}
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        title={nextStepModal.title || "Avançar para próxima etapa"}
        isOpen={nextStepModal.open}
        onClose={() => setNextStepModal((prev) => ({ ...prev, open: false }))}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{nextStepModal.description || "Deseja continuar para a próxima etapa?"}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn-secondary"
            onClick={() => setNextStepModal((prev) => ({ ...prev, open: false }))}
          >
            Manter nesta etapa
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              if (nextStepModal.targetUrl) {
                navigate(nextStepModal.targetUrl);
              }
              setNextStepModal({ open: false, title: "", description: "", targetUrl: null });
            }}
          >
            Avançar
          </button>
        </div>
      </Modal>
    </main>
  );
}

