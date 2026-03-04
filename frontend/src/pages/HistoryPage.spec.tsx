import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HistoryPage from "./HistoryPage";

const navigateMock = vi.fn();
const notifyMock = vi.fn();
const startSessionMock = vi.fn();
const endSessionMock = vi.fn();
const listHistoryByClientMock = vi.fn();
const getHistoryPdfMock = vi.fn();
const obterClientePorIdMock = vi.fn();

let searchParamsValue = new URLSearchParams();
let clientSessionState: any;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParamsValue],
  };
});

vi.mock("@/components/ui/PageHero", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/clientes/ClientLookupModal", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="lookup-open" /> : null),
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  __esModule: true,
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("@/services/history.service", () => ({
  __esModule: true,
  listHistoryByClient: (...args: unknown[]) => listHistoryByClientMock(...args),
  getHistoryPdf: (...args: unknown[]) => getHistoryPdfMock(...args),
}));

vi.mock("../core/cliente/cliente.service", () => ({
  __esModule: true,
  obterClientePorId: (...args: unknown[]) => obterClientePorIdMock(...args),
}));

vi.mock("../context/ClientSessionContext", () => ({
  __esModule: true,
  useClientSession: () => clientSessionState,
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = new URLSearchParams();
    clientSessionState = {
      activeClient: { id: "session-client", nome: "Cliente Sessão" },
      startSession: startSessionMock,
      endSession: endSessionMock,
    };
    listHistoryByClientMock.mockResolvedValue([]);
    obterClientePorIdMock.mockResolvedValue({ id: "session-client", nome: "Cliente Sessão" });
  });

  it("usa clientId da query quando informado para carregar histórico", async () => {
    searchParamsValue = new URLSearchParams("clientId=query-client");
    obterClientePorIdMock.mockResolvedValue({ id: "query-client", nome: "Cliente Query" });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(listHistoryByClientMock).toHaveBeenCalledWith("query-client");
    });

    expect(obterClientePorIdMock).toHaveBeenCalledWith("query-client");
  });

  it("encerra sessão e abre seleção quando histórico retorna 404 para cliente ativo", async () => {
    listHistoryByClientMock.mockRejectedValue({ response: { status: 404 } });

    const { findByTestId } = render(<HistoryPage />);

    await waitFor(() => {
      expect(endSessionMock).toHaveBeenCalled();
    });

    expect(notifyMock).toHaveBeenCalledWith("Cliente não encontrado. Selecione outro cliente.", "warning");
    expect(await findByTestId("lookup-open")).toBeTruthy();
  });

  it("exibe erro com status quando falha download de PDF na timeline", async () => {
    listHistoryByClientMock.mockResolvedValue([
      {
        id: "hist-1",
        analysisType: "capilar",
        createdAt: "2026-02-20T10:00:00.000Z",
        interpretation: "Resumo",
        score: 82,
        flags: [],
      },
    ]);
    getHistoryPdfMock.mockRejectedValue({
      response: {
        status: 403,
        data: { message: "Acesso negado" },
      },
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Gerar PDF" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Gerar PDF" }));

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith("PDF (403): Acesso negado", "error");
    });
  });

  it("navega para detalhe ao clicar em 'Abrir detalhe' na timeline", async () => {
    listHistoryByClientMock.mockResolvedValue([
      {
        id: "hist-77",
        analysisType: "tricologica",
        createdAt: "2026-02-21T10:00:00.000Z",
        interpretation: "Resumo de teste",
        score: 76,
        flags: [],
      },
    ]);

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Abrir detalhe" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Abrir detalhe" }));

    expect(navigateMock).toHaveBeenCalledWith("/historico/hist-77");
  });
});
