import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnaliseCapilar from "./AnaliseCapilar";

const navigateMock = vi.fn();
const notifyMock = vi.fn();
const setFlowModeMock = vi.fn();
const startClientSessionMock = vi.fn();
const endClientSessionMock = vi.fn();
const markAnalysisCompletedMock = vi.fn();
const obterClientePorIdMock = vi.fn();
const salvarVisionBackendMock = vi.fn();

let searchParamsValue = new URLSearchParams();
let authState: any;
let clientSessionState: any;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParamsValue],
  };
});

vi.mock("@/components/vision/ImageCapture", () => ({
  __esModule: true,
  default: () => <div data-testid="image-capture" />,
}));

vi.mock("@/components/clientes/ClientLookupModal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("@/components/analysis/AnalysisClientContextCard", () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock("@/components/analysis/AnalysisModeSelector", () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock("@/components/analysis/AnalysisResultDetails", () => ({
  __esModule: true,
  default: ({ aesthetic }: { aesthetic?: any }) => (
    <div data-testid="analysis-result-details" data-aesthetic={JSON.stringify(aesthetic)} />
  ),
}));

vi.mock("@/components/analysis/ProfessionalDecisionPanel", () => ({
  __esModule: true,
  default: ({ aesthetic }: { aesthetic?: any }) => (
    <div data-testid="professional-decision-panel" data-aesthetic={JSON.stringify(aesthetic)} />
  ),
}));

vi.mock("@/components/analysis/ActiveClientSessionBar", () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock("@/components/analysis/AnalysisStepProgress", () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock("@/components/ui/PageHero", () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock("@/components/ui/Modal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("@/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => authState,
}));

vi.mock("@/context/ClientSessionContext", () => ({
  __esModule: true,
  useClientSession: () => clientSessionState,
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  __esModule: true,
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("@/core/cliente/cliente.service", () => ({
  __esModule: true,
  obterClientePorId: (...args: unknown[]) => obterClientePorIdMock(...args),
}));

vi.mock("@/services/visionApi", () => ({
  __esModule: true,
  salvarVisionBackend: (...args: unknown[]) => salvarVisionBackendMock(...args),
}));

vi.mock("@/services/history.service", () => ({
  __esModule: true,
  getHistoryPdf: vi.fn(),
}));

vi.mock("@/services/aestheticDecision.service", () => ({
  __esModule: true,
  postAestheticDecision: vi.fn().mockResolvedValue({
    absorptionCoefficient: { index: 42, label: "media" },
    cuticleDiagnostic: { ipt: 65, label: "alta" },
    breakRiskPercentual: 75,
    protocoloPersonalizado: { baseTratamento: { foco: "alta", descricao: "Recuperação" } },
  }),
}));

function buildDefaultSessionState() {
  return {
    activeClient: null,
    hasSession: false,
    startSession: startClientSessionMock,
    endSession: endClientSessionMock,
    flowState: {
      mode: "completo",
      tricologicaDone: false,
      capilarDone: false,
    },
    setFlowMode: setFlowModeMock,
    markAnalysisCompleted: markAnalysisCompletedMock,
    nextRequiredStep: "tricologica",
    isCompleteProtocolReady: false,
  };
}

const mockVisionStatus = {
  analysis_quality: { criticalCompleteness: 80 },
  score: 70,
  flags: ["flag-x"],
  signals: { porosidade: 55, elasticidade: 60 },
  interpretation: "ok",
  historyId: "hist-1",
};

const mockVisionSession = { id: "sess-1" };

function setupFetchMocks() {
  const fetchMock = vi.fn((url: string, options?: any) => {
    if (url.includes("/vision/status")) {
      return Promise.resolve({ ok: true, json: async () => mockVisionStatus });
    }
    if (url.includes("/vision/upload")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockVisionStatus,
      });
    }
    if (url.includes("/vision/session")) {
      return Promise.resolve({ json: async () => mockVisionSession });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  vi.stubGlobal("fetch", fetchMock as any);
  return fetchMock;
}

describe("AnaliseCapilar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = new URLSearchParams();
    authState = { token: "token-1", user: { salonId: "salon-1" } };
    clientSessionState = buildDefaultSessionState();
    salvarVisionBackendMock.mockResolvedValue({ id: "hist-1", visionResult: mockVisionStatus });
    setupFetchMocks();
  });

  it("passa métricas estéticas para componentes e bloqueia alisamento quando risco > 70%", async () => {
    render(
      <AnaliseCapilar
        testInitialResult={{
          score: 80,
          flags: [],
          signals: { porosidade: 55 },
          interpretation: "ok",
          date: new Date().toISOString(),
          aesthetic: {
            resumoTecnico: "",
            scoreIntegridade: 80,
            absorptionCoefficient: { index: 42, label: "media" },
            cuticleDiagnostic: { ipt: 65, label: "alta" },
            breakRiskPercentual: 75,
            protocoloPersonalizado: { baseTratamento: { foco: "alta", descricao: "Recuperação" } },
          },
        }}
      />,
    );

    const panel = screen.getByTestId("professional-decision-panel");
    const details = screen.getByTestId("analysis-result-details");

    expect(panel.getAttribute("data-aesthetic")).toContain("\"breakRiskPercentual\":75");
    expect(details.getAttribute("data-aesthetic")).toContain("\"baseTratamento\"");
  });
});
