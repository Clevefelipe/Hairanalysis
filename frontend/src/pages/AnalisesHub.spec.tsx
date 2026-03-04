import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnalisesHub from "./AnalisesHub";

const navigateMock = vi.fn();
const notifyMock = vi.fn();
const setFlowModeMock = vi.fn();
const resetFlowProgressMock = vi.fn();
const startSessionMock = vi.fn();
const endSessionMock = vi.fn();
const listHistoryByClientMock = vi.fn();

let clientSessionState: any;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/components/ui/PageHero", () => ({
  __esModule: true,
  default: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

vi.mock("@/components/ui/SectionToolbar", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/clientes/ClientLookupModal", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="client-lookup-open" /> : null),
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  __esModule: true,
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("@/context/ClientSessionContext", () => ({
  __esModule: true,
  useClientSession: () => clientSessionState,
}));

vi.mock("@/services/history.service", () => ({
  __esModule: true,
  listHistoryByClient: (...args: unknown[]) => listHistoryByClientMock(...args),
}));

function buildDefaultSessionState() {
  return {
    activeClient: null,
    hasSession: false,
    startSession: startSessionMock,
    endSession: endSessionMock,
    flowState: {
      mode: "completo",
      tricologicaDone: false,
      capilarDone: false,
    },
    setFlowMode: setFlowModeMock,
    resetFlowProgress: resetFlowProgressMock,
  };
}

describe("AnalisesHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listHistoryByClientMock.mockResolvedValue([]);
    clientSessionState = buildDefaultSessionState();
  });

  it("bloqueia início de análise quando não há cliente em sessão", async () => {
    render(<AnalisesHub />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar análise tricológica" }));

    expect(notifyMock).toHaveBeenCalledWith("Selecione uma cliente antes de iniciar a análise.", "warning");
    expect(navigateMock).not.toHaveBeenCalled();
    expect(await screen.findByTestId("client-lookup-open")).toBeTruthy();
  });

  it("executa próximo passo para fluxo completo iniciando pela tricologia", async () => {
    clientSessionState = {
      ...buildDefaultSessionState(),
      hasSession: true,
      activeClient: { id: "client-1", nome: "Ana" },
      flowState: {
        mode: "completo",
        tricologicaDone: false,
        capilarDone: false,
      },
    };

    listHistoryByClientMock.mockResolvedValue([
      {
        id: "h-1",
        analysisType: "tricologica",
        createdAt: "2026-02-20T10:00:00.000Z",
        interpretation: "Tudo ok",
      },
    ]);

    render(<AnalisesHub />);

    await waitFor(() => {
      expect(listHistoryByClientMock).toHaveBeenCalledWith("client-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Executar próximo passo" }));

    expect(navigateMock).toHaveBeenCalledWith("/analise-tricologica?flow=completo&clientId=client-1");
  });
});
