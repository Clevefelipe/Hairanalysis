import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnaliseTricologica from "./AnaliseTricologica";

const navigateMock = vi.fn();
const notifyMock = vi.fn();
const setFlowModeMock = vi.fn();
const startClientSessionMock = vi.fn();
const endClientSessionMock = vi.fn();
const markAnalysisCompletedMock = vi.fn();
const obterClientePorIdMock = vi.fn();

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
  default: () => <div />,
}));

vi.mock("@/components/analysis/ProfessionalDecisionPanel", () => ({
  __esModule: true,
  default: () => <div />,
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
  salvarVisionBackend: vi.fn(),
}));

vi.mock("@/services/history.service", () => ({
  __esModule: true,
  getHistoryPdf: vi.fn(),
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
  };
}

describe("AnaliseTricologica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = new URLSearchParams();
    authState = { token: "token-1", user: { salonId: "salon-1" } };
    clientSessionState = buildDefaultSessionState();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ id: "session-1" }),
      }),
    );
  });

  it("força flow tricologica_individual quando rota abre sem parâmetro flow", async () => {
    clientSessionState = {
      ...buildDefaultSessionState(),
      flowState: { mode: "completo", tricologicaDone: false, capilarDone: false },
    };

    render(<AnaliseTricologica />);

    await waitFor(() => {
      expect(setFlowModeMock).toHaveBeenCalledWith("tricologica_individual");
    });
  });

  it("inicializa cliente via query param e inicia sessão automática", async () => {
    searchParamsValue = new URLSearchParams("clientId=client-123&flow=completo");
    obterClientePorIdMock.mockResolvedValue({ id: "client-123", nome: "Cliente Auto" });

    render(<AnaliseTricologica />);

    await waitFor(() => {
      expect(obterClientePorIdMock).toHaveBeenCalledWith("client-123");
    });

    expect(startClientSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "client-123" }),
      "completo",
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/vision/session"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
