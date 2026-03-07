import { type JSX, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import AnalysisProcessingSkeleton from "@/components/analysis/AnalysisProcessingSkeleton";
import HighTechIntegrityPanel from "@/components/analysis/HighTechIntegrityPanel";
import DecisionMatrix from "@/components/analysis/DecisionMatrix";
import ActiveClientSessionBar from "@/components/analysis/ActiveClientSessionBar";
import AnalysisStepProgress from "@/components/analysis/AnalysisStepProgress";
import { FlowTimeline, FlowTimelineStep } from "@/components/analysis/FlowTimeline";
import { obterClientePorId } from "@/core/cliente/cliente.service";
import { salvarVisionBackend } from "@/services/visionApi";
import { getHistoryPdf } from "@/services/history.service";
import { postAestheticDecision, type AestheticDecisionResponseFrontend } from "@/services/aestheticDecision.service";
import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";
import Modal from "@/components/ui/Modal";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  FlaskConical,
  Loader2,
  Microscope,
  Sparkles,
  X,
  UserRound,
} from "lucide-react";

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
  aiExplanation?: any;
  recommendations?: any;
  professionalAlert?: string;
  recomendacoes?: Array<{
    titulo: string;
    descricao: string;
    tempo?: string;
    compatibilidade?: number;
  }>;
  historyId?: string;
  aesthetic?: AestheticDecisionResponseFrontend | null;
  chemicalProfile?: any;
}

const normalizeAnalysisSource = (mode: AnalysisMode): "imagem" | "video" | "tempo-real" => {
  return mode === "video" ? "video" : mode === "tempo-real" ? "tempo-real" : "imagem";
};

const analysisSourceLabel = (source: "imagem" | "video" | "tempo-real"): string => {
  if (source === "video") return "Frame em vídeo";
  if (source === "tempo-real") return "Tempo real";
  return "Captura fotográfica";
};

type OverviewCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  valueClass?: string;
  helperClass?: string;
};

type CaptureShot = {
  key: string;
  label: string;
  hint?: string;
};

type CaptureEnvironmentCard = {
  label: string;
  value: string;
};

type ChemicalProfileInput = {
  acidicOrOrganic: boolean;
  alkaline: boolean;
  relaxation: boolean;
  bleaching: boolean;
  thermalFrequency: 'eventual' | 'semanal' | 'diaria';
};

const CAPTURE_REQUIRED_SHOTS: CaptureShot[] = [
  {
    key: "contexto",
    label: "Contexto da mecha",
    hint: "Visão geral para volume e distribuição da fibra.",
  },
  {
    key: "macro",
    label: "Macro da fibra",
    hint: "Close da cutícula com foco em porosidade e brilho.",
  },
  {
    key: "pontas",
    label: "Pontas",
    hint: "Registro de desgaste, quebra e necessidade de corte.",
  },
] as const;

const CAPTURE_ENVIRONMENT_CARDS: CaptureEnvironmentCard[] = [
  { label: "Luz", value: "Frontal difusa" },
  { label: "Distância", value: "20-30 cm" },
  { label: "Foco", value: "Cutícula e pontas" },
];

const CAPTURE_SEQUENCE_STEPS: string[] = [
  "1. Visão geral da mecha (contexto de volume).",
  "2. Close em cutícula para leitura de porosidade.",
  "3. Registro de pontas para avaliar quebra/fissura.",
];

const CAPTURE_CHECKLIST_ITEMS: string[] = [
  "Fundo neutro sem reflexo forte",
  "Fio centralizado e sem tremor",
  "Áreas críticas com nitidez",
  "Uma imagem por região de interesse",
];

const PROCESSING_CHECKLIST_ITEMS: string[] = [
  "Porosidade",
  "Elasticidade",
  "Risco de quebra",
  "Histórico químico",
  "Score de integridade",
];

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
    .replace(/Ãé/g, "é")
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

const toNumberOrNull = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

type AnaliseCapilarProps = {
  testInitialResult?: AnalysisResult;
};

export default function AnaliseCapilar({ testInitialResult }: AnaliseCapilarProps = {}) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const {
    activeClient,
    hasSession,
    startSession: startClientSession,
    endSession: endClientSession,
    flowState,
    setFlowMode,
    setTricologicaOverride,
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
  const [aestheticLoading, setAestheticLoading] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>("imagem");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [chemicalProfile, setChemicalProfile] = useState<ChemicalProfileInput>({
    acidicOrOrganic: false,
    alkaline: false,
    relaxation: false,
    bleaching: false,
    thermalFrequency: 'eventual',
  });
  const [fullscreenStatus, setFullscreenStatus] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });
  const [showTechnical, setShowTechnical] = useState(false);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  } | null>(null);
  const [absorptionForm, setAbsorptionForm] = useState({ volumeMl: "", timeSeconds: "" });
  const [cuticleForm, setCuticleForm] = useState({ toquePoints: "", brilhoPoints: "", elasticidadePoints: "", chemicalEvents: "" });
  const [riskContext, setRiskContext] = useState({ porosityPercent: "", elasticityPercent: "" });

  const [savedHistoryId, setSavedHistoryId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [fallbackProgress, setFallbackProgress] = useState(0);
  const [confirmEndSessionOpen, setConfirmEndSessionOpen] = useState(false);
  const [showTricoBypassModal, setShowTricoBypassModal] = useState(false);
  const [allowCapilarOverride, setAllowCapilarOverride] = useState(false);
  const [bypassAcknowledged, setBypassAcknowledged] = useState(false);
  const autoSessionInitRef = useRef<string | null>(null);
  const pendingCapilarCaptureRef = useRef<File | null>(null);
  const premiumGoal = searchParams.get("premiumGoal");
  const premiumNote = searchParams.get("premiumNote");
  const clientIdParam = searchParams.get("clientId");
  const flowParam = (searchParams.get("flow") ?? null) as
    | "completo"
    | "capilar_individual"
    | "tricologica_individual"
    | null;

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

  const focusOnWizard = useCallback(() => {
    document.getElementById("capilar-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const isIntegratedFlow = flowState.mode === "completo";
  const configDone = isIntegratedFlow ? hasSession : true;
  const tricologicaDone = isIntegratedFlow ? flowState.tricologicaDone : true;
  const capilarDone = isIntegratedFlow ? flowState.capilarDone : Boolean(result);
  const protocolReady = isIntegratedFlow ? isCompleteProtocolReady : Boolean(result);
  const tricologicaOverrideActive = useMemo(
    () =>
      isIntegratedFlow &&
      !flowState.tricologicaDone &&
      (allowCapilarOverride || flowState.tricologicaOverride),
    [allowCapilarOverride, flowState.tricologicaDone, flowState.tricologicaOverride, isIntegratedFlow],
  );
  const nextStepLabel =
    nextRequiredStep === "tricologica"
      ? "Tricologia"
      : nextRequiredStep === "capilar"
        ? "Capilar"
        : "Protocolo";

  const flowTimelineSteps = useMemo<FlowTimelineStep[]>(
    () => {
      if (!isIntegratedFlow) return [];
      return [
        {
          key: "config",
          step: "Passo 1",
          title: "Configuração",
          description: "Inicie sessão, objetivo premium e contexto clínico.",
          status: configDone ? "done" : "active",
          actionLabel: configDone ? "Trocar cliente" : "Selecionar cliente",
          onAction: () => setLookupOpen(true),
          disabled: false,
          icon: <UserRound size={18} className="text-has-primary" />,
          buttonVariant: configDone ? "secondary" : "primary",
        },
        {
          key: "tricologica",
          step: "Passo 2",
          title: "Análise Tricológica",
          description: "Execute couro cabeludo e microscopia antes da fibra.",
          status: !configDone ? "blocked" : tricologicaDone ? "done" : "active",
          actionLabel: tricologicaDone ? "Reabrir tricologia" : "Ir para tricologia",
          onAction: () => navigate(buildFlowUrl("/analise-tricologica", { forceFlow: true })),
          disabled: !configDone,
          icon: <Microscope size={18} className="text-has-primary" />,
          buttonVariant: "secondary",
        },
        {
          key: "capilar",
          step: "Passo 3",
          title: "Análise Capilar",
          description: "Valide danos, porosidade e segurança química da fibra.",
          status: !tricologicaDone ? "blocked" : capilarDone ? "done" : "active",
          actionLabel: capilarDone ? "Reabrir capilar" : "Continuar nesta etapa",
          onAction: focusOnWizard,
          disabled: !tricologicaDone,
          icon: <Sparkles size={18} className="text-has-primary" />,
          buttonVariant: "primary",
        },
        {
          key: "protocolo",
          step: "Passo 4",
          title: "Resultado completo",
          description: "Emita protocolo integrado e cronogramas.",
          status: protocolReady ? "done" : capilarDone ? "active" : "blocked",
          actionLabel: protocolReady ? "Abrir protocolo completo" : "Aguardando",
          onAction: protocolReady ? () => navigate(buildFlowUrl("/historico")) : undefined,
          disabled: !protocolReady,
          icon: <FlaskConical size={18} className="text-has-warning" />,
          buttonVariant: "secondary",
        },
      ];
    },
    [buildFlowUrl, capilarDone, configDone, focusOnWizard, isIntegratedFlow, navigate, protocolReady, tricologicaDone],
  );

  const safetyChecklist = useMemo(
    () => {
      const hasClient = Boolean(selectedClient || activeClient);
      const tricologicaLiberada = !isIntegratedFlow || flowState.tricologicaDone;
      const hasSessionActive = Boolean(sessionId);
      const hasContextNotes = Boolean((observacoes || "").trim() || premiumGoal || premiumNote);

      return [
        {
          key: "client",
          label: "Cliente confirmado",
          description: "Selecione a cliente para vincular histórico, KPIs e protocolos.",
          complete: hasClient,
        },
        {
          key: "session",
          label: "Sessão IA ativa",
          description: "Inicie ou recupere a sessão para registrar achados com timestamp.",
          complete: hasSessionActive,
        },
        {
          key: "notes",
          label: "Contexto técnico registrado",
          description: "Notas premium e objetivo orientam a IA sem extrapolar dados (README).",
          complete: hasContextNotes,
        },
        {
          key: "tricologica",
          label: "Tricológica concluída",
          description: "A etapa do couro cabeludo deve anteceder a avaliação da fibra.",
          complete: tricologicaLiberada,
        },
      ];
    },
    [
      activeClient,
      flowState.mode,
      flowState.tricologicaDone,
      observacoes,
      premiumGoal,
      premiumNote,
      selectedClient,
      sessionId,
    ],
  );

  const pendingChecklist = safetyChecklist.filter((item) => !item.complete).length;

  const wizardStep = step === "processing" || step === "results" ? "analyzing" : step;

  useEffect(() => {
    setAllowCapilarOverride(flowState.tricologicaOverride);
  }, [flowState.tricologicaOverride]);

  useEffect(() => {
    if (testInitialResult) {
      setResult(testInitialResult);
      setStep("results");
    }
  }, [testInitialResult]);

  useEffect(() => {
    if (!showTricoBypassModal) {
      setBypassAcknowledged(false);
    }
  }, [showTricoBypassModal]);

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
        if (!res.ok) {
          // status inválido (ex.: 404) cancela polling e volta para captura
          if (!cancelled) {
            setAnalysisProgress(0);
            setFallbackProgress(0);
            setStep("capture");
            setIsLoading(false);
          }
          return;
        }
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

  // fallback suave para não ficar em 0% se API não reportar a tempo
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

  // ================= SESSION =================

  async function startSession(clientId?: string) {
    if (!token) {
      notify("Sessão expirada. Entre novamente para iniciar a análise.", "error");
      return;
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
          analysisType: "capilar",
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Erro ao iniciar sessão" }));
        throw new Error(error?.message || "Falha ao iniciar sessão");
      }

      const data = await res.json();
      if (!data?.id) throw new Error("Sessão inválida");

      setSessionId(data.id);
      setStep("capture");
    } catch (e: any) {
      notify(e.message || "Erro ao iniciar sessão", "error");
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

    if (
      flowState.mode === "completo" &&
      !flowState.tricologicaDone &&
      !(allowCapilarOverride || flowState.tricologicaOverride)
    ) {
      pendingCapilarCaptureRef.current = file;
      setShowTricoBypassModal(true);
      return;
    }

    await runCapturePipeline(file);
  }

  const handleBypassCancel = () => {
    pendingCapilarCaptureRef.current = null;
    setShowTricoBypassModal(false);
    setBypassAcknowledged(false);
  };

  const handleBypassConfirm = () => {
    setShowTricoBypassModal(false);
    setAllowCapilarOverride(true);
    setTricologicaOverride(true);
    setBypassAcknowledged(false);
    const pendingFile = pendingCapilarCaptureRef.current;
    pendingCapilarCaptureRef.current = null;
    if (pendingFile) {
      notify("Fluxo completo liberado manualmente. Registre a tricologia posteriormente para consistência.", "info");
      void runCapturePipeline(pendingFile);
    }
  };

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

  // ================= AUTO CLIENT =================

  useEffect(() => {
    if (!token) return;
    if (!clientIdParam) return;

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
    
    // Se não há parâmetro flow, assume modo individual (acesso direto pelo sidebar)
    if (!flowParam) {
      const targetMode: "capilar_individual" = "capilar_individual";
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

    const targetMode: "capilar_individual" = "capilar_individual";
    if (flowState.mode !== targetMode) {
      setFlowMode(targetMode);
    }
  }, [flowParam, flowState.mode, setFlowMode]);

  // ================= CAPTURE =================

  async function runCapturePipeline(file: File) {
    if (!sessionId) {
      notify("Sessão não encontrada. Reinicie a análise antes de capturar.", "error");
      setStep("config");
      return;
    }

    const activeSessionId = sessionId;
    setPreview(URL.createObjectURL(file));
    setStep("analyzing");
    setIsLoading(true);
    const source = normalizeAnalysisSource(mode);
    const sourceLabel = analysisSourceLabel(source);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", activeSessionId);
      formData.append("type", "capilar");
      formData.append("source", source);
      formData.append("notes", observacoes);
      formData.append("chemicalProfile", JSON.stringify(chemicalProfile));

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
      const finalClientId =
        selectedClient?.id ||
        activeClient?.id ||
        searchParams.get("clientId") ||
        "cliente_demo";
      const uploadHistoryId =
        raw?.historyId ||
        raw?.history?.id ||
        raw?.visionResult?.historyId ||
        null;

      if (finalClientId) {
        setSavedClientId(finalClientId);
      }
      if (uploadHistoryId) {
        setSavedHistoryId(uploadHistoryId);
      }

      try {
        const clientIdToPersist = finalClientId || "cliente_demo";
        const persistedAnalysisType = flowState.mode === "completo" ? "geral" : "capilar";

        savedHistory = await salvarVisionBackend(clientIdToPersist, {
          type: persistedAnalysisType,
          analysisType: persistedAnalysisType,
          chemicalProfile,
        });
        setSavedHistoryId(savedHistory?.id ?? null);
      } catch (e: any) {
        notify(
          e?.message ||
            "A análise foi concluída, mas não foi possível salvar no histórico.",
          "error",
        );
      }

      const baseResult: AnalysisResult = {
        score: Number(savedHistory?.visionResult?.score) || Number(data.score) || 0,
        flags: Array.isArray(savedHistory?.visionResult?.flags)
          ? savedHistory.visionResult.flags
          : Array.isArray(data.flags)
            ? data.flags
            : [],
        signals:
          savedHistory?.visionResult?.signals && typeof savedHistory.visionResult.signals === "object"
            ? savedHistory.visionResult.signals
            : data.signals || {},
        interpretation: savedHistory?.aiExplanation?.summary || savedHistory?.visionResult?.interpretation || data.interpretation || "",
        date: savedHistory?.createdAt
          ? new Date(savedHistory.createdAt).toLocaleString()
          : new Date().toLocaleString(),
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
              : data.recomendacoes || [],
        historyId: savedHistory?.id || uploadHistoryId || undefined,
        aesthetic: null,
        chemicalProfile: savedHistory?.chemicalProfile || null,
      };

      setResult(baseResult);

      // Acionar decisão estética usando sinais já obtidos
      try {
        setAestheticLoading(true);
        const aesthetic = await postAestheticDecision({
          structuredData: baseResult.signals,
          imageSignals: baseResult.signals,
          absorptionTest: {
            volumeMl: toNumberOrNull(absorptionForm.volumeMl),
            timeSeconds: toNumberOrNull(absorptionForm.timeSeconds),
          },
          cuticleDiagnostic: {
            toquePoints: toNumberOrNull(cuticleForm.toquePoints),
            brilhoPoints: toNumberOrNull(cuticleForm.brilhoPoints),
            elasticidadePoints: toNumberOrNull(cuticleForm.elasticidadePoints),
            chemicalEvents: toNumberOrNull(cuticleForm.chemicalEvents),
          },
          straighteningRiskContext: {
            porosityPercent: toNumberOrNull(riskContext.porosityPercent),
            elasticityPercent: toNumberOrNull(riskContext.elasticityPercent),
          },
        });
        setResult((prev) => (prev ? { ...prev, aesthetic } : prev));
      } catch (err: any) {
        notify(
          err?.response?.data?.message || err?.message || "Falha ao obter decisão estética.",
          "warning",
        );
      } finally {
        setAestheticLoading(false);
      }

      markAnalysisCompleted("capilar", savedHistory?.id);

      setStep("results");
      notify(`Análise capilar concluída (${sourceLabel})`, "success");

      if (flowState.mode === "completo") {
        notify("Protocolo completo concluído. Revise e confirme antes de abrir o histórico integrado.", "success");
      }
    } catch (e: any) {
      const msg =
        e?.name === "AbortError"
          ? "Tempo excedido na análise capilar. Tente novamente ou gere o resultado com o que já foi processado."
          : e?.message || e?.response?.data?.message || "Erro na análise";
      notify(msg, "error");
      setStep("config");
    } finally {
      setIsLoading(false);
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
      ? "Existem sinais de atenção. Revise o histórico detalhado antes de definir conduta final."
      : "Sem alertas críticos no recorte atual. Confirme no histórico antes de concluir o protocolo.") ||
    "";
  const displayProfessionalAlert = useMemo(
    () => sanitizeProfessionalAlert(professionalAlertText),
    [professionalAlertText],
  );
  const hasResult = wizardStep === "analyzing" && !!result;
  const isAnalysisModalOpen = wizardStep !== "config";

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
  const source = normalizeAnalysisSource(mode);
  const modeUiLabel = analysisSourceLabel(source);
  const modeCompactLabel = source === "video" ? "Vídeo" : source === "tempo-real" ? "Tempo real" : "Imagem";
  const sourceUiLabel = source === "video" ? "Frame de vídeo" : source === "tempo-real" ? "Tempo real" : "Captura";

  const heroMeta = [
    { label: "Modo", value: modeUiLabel },
    { label: "Status", value: statusLabel },
    flowState.mode === "completo"
      ? {
          label: "Próximo passo",
          value:
            nextRequiredStep === "tricologica"
              ? "Executar tricologia"
              : nextRequiredStep === "capilar"
                ? "Finalizar capilar"
                : "Emitir protocolo",
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];
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

        <AnalysisModeSelector
          selected={mode}
          onChange={(value) => setMode(value as AnalysisMode)}
          options={[
            {
              value: "imagem",
              title: "Captura fotográfica",
              description: "Recomendado para etapas rápidas ou follow-up.",
            },
            {
              value: "video",
              title: "Frame em vídeo",
              description: "Usar quando precisar validar movimento ou brilho.",
            },
          ]}
        />

        <button
          onClick={() => {
            if (!hasSession || !selectedClient) {
              setLookupOpen(true);
              return;
            }
            startSession(selectedClient.id);
          }}
          disabled={isLoading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Iniciando sessão..." : "Iniciar análise"}
        </button>
      </div>
    );
  }

  function renderCaptureStage() {
    return (
      <div className="space-y-6 capture-stage-enter">
        <div className="relative overflow-hidden rounded-xl border p-5 capture-hero-premium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", boxShadow: "var(--shadow-card)" }}>
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                <Camera size={18} />
                Captura premium
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                  Modo: {modeCompactLabel}
                </span>
                <span className="rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                  Qualidade assistida
                </span>
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold">
              Capture com padrão clínico para diagnóstico mais confiável.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Orientação, estabilize o enquadramento e priorize regiões com dano visível para aumentar precisão do laudo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
          <div className="rounded-xl border p-5 capture-card-premium capture-stage-enter capture-stage-enter-delay-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <ImageCapture
              onCapture={handleCapture}
              isProcessing={isLoading}
              title="Captura guiada para análise capilar"
              subtitle="Priorize enquadramento da fibra, brilho e textura para elevar a precisão do laudo."
              requiredShots={CAPTURE_REQUIRED_SHOTS}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {CAPTURE_ENVIRONMENT_CARDS.map((card) => (
                <div key={card.label} className="rounded-lg border p-3 capture-card-subtle" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border p-4 capture-card-subtle" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>Sequência recomendada</p>
              <ol className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
                {CAPTURE_SEQUENCE_STEPS.map((stepText) => (
                  <li key={stepText}>{stepText}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-4 capture-stage-enter capture-stage-enter-delay-2">
            <div className="rounded-xl border p-5 capture-card-premium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>Checklist premium</p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
                {CAPTURE_CHECKLIST_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-has-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border p-5 capture-card-premium" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", boxShadow: "var(--shadow-card)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#166534" }}>Compliance de sessão</p>
              <p className="mt-2 text-sm" style={{ color: "#166534" }}>
                Registre a mesma ordem de fotos em cada visita para comparação histórica consistente e leitura evolutiva precisa.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full border bg-white px-2.5 py-1" style={{ borderColor: "#bbf7d0", color: "#166534" }}>Padronização ativa</span>
                <span className="rounded-full border bg-white px-2.5 py-1" style={{ borderColor: "#bbf7d0", color: "#166534" }}>Rastreabilidade</span>
              </div>
            </div>
          </div>
        </div>

        {preview && wizardStep === "capture" && (
          <div className="rounded-xl border p-4 capture-preview-premium capture-stage-enter capture-stage-enter-delay-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--color-text-muted)" }}>Pré-visualização confirmada</p>
            <img
              src={preview}
              alt="Pré-visualização"
              className="mt-3 w-full rounded-lg border"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>
        )}
      </div>
    );
  }

  function renderProcessingStage() {
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
                IA em processamento · Capilar
              </p>
              <h3 className="text-2xl font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
                Lendo textura, cutícula e integridade química
              </h3>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Sequenciando achados estruturais, riscos e compatibilidade para montar o protocolo técnico.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                Confiabilidade ativa
              </span>
              <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                Modo {modeCompactLabel}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.55fr,1fr]">
            <div className="relative overflow-hidden rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <div className="relative flex flex-col gap-6 text-center">
                <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 0 0 6px rgba(10,132,255,0.08)" }} />
                    Integridade da fibra
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
                  {[{ label: "Modo", value: modeCompactLabel }, { label: "Cliente", value: selectedClient?.nome || "Não informado" }, { label: "Fonte", value: sourceUiLabel }].map((item) => (
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
                  {PROCESSING_CHECKLIST_ITEMS.map((item) => (
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
                      boxShadow: "0 6px 18px rgba(10,132,255,0.12)",
                    }}
                  />
                </div>
                <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Continuamos avaliando textura, porosidade, corte da cutícula e risco químico. Avisaremos quando o laudo estiver pronto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderResultStage() {
    if (!result) return null;
    return (
      <div className="space-y-6">
        <div className="rounded-xl border p-5" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#166534" }}>
            1º passo do profissional
          </p>
          <p className="mt-2 text-base font-semibold" style={{ color: "#166534" }}>
            Valide a decisão no histórico completo da cliente.
          </p>
          <p className="mt-2 text-sm whitespace-pre-line" style={{ color: "#166534" }}>
            {displayProfessionalAlert}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {savedHistoryId && (
              <button
                onClick={() => navigate(`/historico/${savedHistoryId}`)}
                className="btn-primary"
              >
                Abrir resultado detalhado
              </button>
            )}
            {savedClientId && (
              <button
                onClick={() => navigate(`/historico?clientId=${savedClientId}`)}
                className="btn-secondary"
              >
                Ir para histórico da cliente
              </button>
            )}
          </div>
        </div>

        {/* Inputs técnicos opcionais para coeficiente/IPT/risco */}
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
            Dados técnicos para decisão estética
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--color-text-muted)" }}>Coeficiente de absorção</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border px-2 py-1 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }}
                  placeholder="Volume (mL)"
                  value={absorptionForm.volumeMl}
                  onChange={(e) => setAbsorptionForm((p) => ({ ...p, volumeMl: e.target.value }))}
                />
                <input
                  className="rounded-lg border px-2 py-1 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }}
                  placeholder="Tempo (s)"
                  value={absorptionForm.timeSeconds}
                  onChange={(e) => setAbsorptionForm((p) => ({ ...p, timeSeconds: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--color-text-muted)" }}>Diagnóstico de cutícula (IPT)</p>
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }} placeholder="Toque" value={cuticleForm.toquePoints} onChange={(e) => setCuticleForm((p) => ({ ...p, toquePoints: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }} placeholder="Brilho" value={cuticleForm.brilhoPoints} onChange={(e) => setCuticleForm((p) => ({ ...p, brilhoPoints: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }} placeholder="Elasticidade" value={cuticleForm.elasticidadePoints} onChange={(e) => setCuticleForm((p) => ({ ...p, elasticidadePoints: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }} placeholder="Eventos químicos" value={cuticleForm.chemicalEvents} onChange={(e) => setCuticleForm((p) => ({ ...p, chemicalEvents: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--color-text-muted)" }}>Contexto de risco</p>
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }} placeholder="Porosidade %" value={riskContext.porosityPercent} onChange={(e) => setRiskContext((p) => ({ ...p, porosityPercent: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--bg-primary)" }} placeholder="Elasticidade %" value={riskContext.elasticityPercent} onChange={(e) => setRiskContext((p) => ({ ...p, elasticityPercent: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <ProfessionalDecisionPanel
          score={result.score}
          flags={result.flags}
          recommendations={result.recommendations}
          interpretation={result.interpretation}
          aesthetic={result.aesthetic || null}
        />
        <AnalysisResultDetails
          kind="capilar"
          signals={result.signals}
          flags={result.flags}
          recommendations={result.recommendations}
          aesthetic={result.aesthetic}
          chemicalProfile={(result as any)?.chemicalProfile || null}
        />
        <DecisionMatrix
          recommendations={result.recommendations}
          flags={result.flags}
          breakRiskPercentual={result.aesthetic?.breakRiskPercentual ?? null}
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
            <p className="mt-3 text-sm whitespace-pre-line" style={{ color: "var(--color-text)" }}>
              {premium.summary}
            </p>
            {aestheticLoading && (
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Refinando decisão estética...
              </p>
            )}
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

  function renderMain() {
    if (wizardStep === "config") return renderConfigStage();
    if (wizardStep === "capture") return renderCaptureStage();
    if (wizardStep === "analyzing" && !result) return renderProcessingStage();
    if (wizardStep === "analyzing" && result) return renderResultStage();
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
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Não feche a janela. Continuaremos automaticamente.
              </p>
            </div>
          </div>,
          document.body,
        )}

      {!isAnalysisModalOpen && hasSession && activeClient && (
        <div className="space-y-3">
          <ActiveClientSessionBar
            client={activeClient}
            onOpenClient={() => navigate(`/clientes?clientId=${activeClient.id}`)}
            onSwitchClient={() => setLookupOpen(true)}
            onEndSession={() => setConfirmEndSessionOpen(true)}
          />
        </div>
      )}

      {!isAnalysisModalOpen && (
        <PageHero
          title="Análise Capilar"
          subtitle="Wizard em 3 etapas com inteligência estética ativa."
          meta={heroMeta}
          actions={heroActions as any}
        />
      )}

      {!isAnalysisModalOpen && (
        <>
          <AnalysisStepProgress
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={(stepItem, index) => {
              if (index === 0) {
                setStep("config");
                focusOnWizard();
              }
            }}
          />

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => (
              <article
                key={card.id}
                className="panel-tight"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
                  {card.label}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${card.valueClass ?? ""}`}
                  style={{ color: card.valueClass ? undefined : "var(--color-text)" }}
                >
                  {card.value}
                </p>
                <p
                  className={`text-xs ${card.helperClass ?? ""}`}
                  style={{ color: card.helperClass ? undefined : "var(--color-text-muted)" }}
                >
                  {card.helper}
                </p>
              </article>
            ))}
          </section>

          <section className="grid-dense lg:grid-cols-[2fr,1fr] items-start gap-3 md:gap-4">
            <div id="capilar-wizard" className="panel-tight premium-card p-3 md:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
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
                <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {sessionId ? "Ativa" : "Aguardando"}
                </p>
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

              {hasResult && result && (
                <div className="panel-tight" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 size={16} className="text-has-primary" />
                    Salvo no histórico
                  </div>
                  <p className="mt-2 text-sm">
                    Última análise registrada em {new Date(result.date).toLocaleString()}.
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
        </>
      )}

      {isAnalysisModalOpen && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[200] overflow-hidden" style={{ backgroundColor: "rgba(15, 23, 42, 0.22)", backdropFilter: "blur(8px)" }}>
            <div className="flex h-full w-full flex-col overflow-hidden border-0" style={{ backgroundColor: "var(--color-bg)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Modo imersivo</p>
                {flowState.mode === "completo" && (
                  <span className="mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                    Fluxo completo • Etapa 2/2
                  </span>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>IA premium</span>
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>Rastreabilidade ativa</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  className="btn-secondary inline-flex items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    const historyIdForPdf = savedHistoryId || result?.historyId;
                    if (historyIdForPdf) handleDownloadPdf(historyIdForPdf);
                  }}
                  disabled={!(savedHistoryId || result?.historyId) || downloadingPdf}
                >
                  <Download size={14} /> {downloadingPdf ? "Gerando PDF..." : "PDF"}
                </button>
                <button
                  className="btn-secondary inline-flex items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    const historyIdForNavigation = savedHistoryId || result?.historyId;
                    const clientIdForNavigation = savedClientId || selectedClient?.id || activeClient?.id;

                    if (historyIdForNavigation) {
                      navigate(`/historico/${historyIdForNavigation}`);
                      return;
                    }
                    if (clientIdForNavigation) {
                      navigate(`/historico?clientId=${clientIdForNavigation}`);
                    }
                  }}
                  disabled={!(savedHistoryId || result?.historyId || savedClientId || selectedClient?.id || activeClient?.id)}
                >
                  <Clock size={14} /> Histórico
                </button>
                <button
                  className="btn-secondary inline-flex items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    if (isLoading) return;
                    setStep("config");
                  }}
                  disabled={isLoading}
                >
                  <X size={14} /> {isLoading ? "Processando..." : "Fechar"}
                </button>
              </div>
            </div>

            {wizardStep === "analyzing" && !result && (
              <div className="premium-shimmer-track h-1 w-full rounded-none" style={{ backgroundColor: "var(--bg-primary)" }}>
                <div className="premium-shimmer-bar" style={{ backgroundColor: "var(--color-primary)" }} />
              </div>
            )}

            <div className="border-b px-4 py-2 sm:px-6 sm:py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <AnalysisStepProgress steps={steps} currentStepIndex={currentStepIndex} />
            </div>

            <div className="analysis-grid-immersive">
              <div className="min-h-0 h-full overflow-y-auto px-3 pb-3 pt-0 sm:px-6 sm:pb-4 sm:pt-1">
                <div className="h-full w-full analysis-immersive-shell">
                  <div className="panel-tight premium-card analysis-card-tight flex h-full w-full flex-col" style={{ boxShadow: "var(--shadow-card)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <div key={`immersive-${wizardStep}`} className="analysis-stage-transition h-full">
                      {renderMain()}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="hidden min-h-0 overflow-y-auto border-l p-4 lg:block" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="section-stack">
                  <div className="panel-tight border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                      <Clock size={16} />
                      Sessão
                    </div>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>{sessionId ? "Ativa" : "Aguardando"}</p>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {sessionId ? "Sessão IA conectada" : "Clique em Iniciar análise"}
                    </p>
                  </div>

                  <div className="panel-tight border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Status do fluxo</p>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Cliente: <strong style={{ color: "var(--color-text)" }}>{selectedClient?.nome ?? "Não definido"}</strong></p>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Modo: <strong style={{ color: "var(--color-text)" }}>{modeUiLabel}</strong></p>
                  </div>

                  {wizardStep === "analyzing" && !result && (
                    <div className="panel-tight border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="h-8 w-8 animate-spin rounded-full border-2"
                          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Processando análise capilar</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Identificando textura, porosidade e sinais de dano químico.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Integridade</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {[
                              "Calculando score (0-100)",
                              "Identificando risco químico",
                              "Checando porosidade",
                              "Validando cutícula",
                            ].map((label) => (
                              <div
                                key={label}
                                className="rounded-md border px-2 py-2 text-xs font-semibold"
                                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}
                              >
                                {label}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>Checklist técnico</p>
                          <div className="mt-2 space-y-1.5">
                            {["Textura e brilho", "Compatibilidade química", "Sensibilidade do couro", "Alerta microscópico"].map((label) => (
                              <div
                                key={label}
                                className="rounded-md border px-2 py-2 text-xs font-semibold"
                                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}
                              >
                                {label} · em processamento
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasResult && result && (
                    <div className="panel-tight border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 size={16} className="text-has-primary" />
                        Salvo no histórico
                      </div>
                      <p className="mt-2 text-sm">
                        Última análise registrada em {new Date(result.date).toLocaleString()}.
                      </p>
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
          notify(`Sessão iniciada\n${c.nome || "Cliente"}`, "success");
        }}
      />

      <Modal
        title="Ignorar tricologia nesta captura?"
        isOpen={showTricoBypassModal}
        onClose={handleBypassCancel}
      >
        <div className="space-y-4 text-sm" style={{ color: "var(--color-text)" }}>
          <div className="rounded-xl border p-3" style={{ borderColor: "#fbbf24", backgroundColor: "#fffbeb", color: "#92400e" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Fluxo completo em risco</p>
            <p className="mt-1 text-sm">
              A análise tricológica ainda não foi concluída. Prosseguir força o segundo passo do protocolo completo e exige retorno posterior ao couro
              cabeludo para manter rastreabilidade clínica.
            </p>
          </div>

          <ul className="space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
            <li className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 text-amber-500" />
              <span>Os achados capilares ficarão sinalizados como "aguardando tricologia" no hub.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 text-amber-500" />
              <span>É obrigatório registrar a tricologia antes de emitir recomendações finais.</span>
            </li>
          </ul>

          <label className="flex items-start gap-3 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text)" }}>
            <input
              type="checkbox"
              className="mt-1 accent-[color:var(--color-primary)]"
              checked={bypassAcknowledged}
              onChange={(event) => setBypassAcknowledged(event.target.checked)}
            />
            <span>
              Reconheço o risco de prosseguir sem tricologia e assumo o compromisso de retomar o couro cabeludo para fechar o protocolo completo.
            </span>
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-secondary" onClick={handleBypassCancel}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleBypassConfirm} disabled={!bypassAcknowledged}>
              Prosseguir
            </button>
          </div>
        </div>
      </Modal>

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
