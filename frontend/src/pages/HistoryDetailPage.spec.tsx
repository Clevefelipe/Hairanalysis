import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HistoryDetailPage from "./HistoryDetailPage";

const navigateMock = vi.fn();
const getHistoryByIdMock = vi.fn();
const getHistoryPdfMock = vi.fn();
const shareHistoryMock = vi.fn();
const listHistoryByClientMock = vi.fn();
const alertMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: "hist-1" }),
  };
});

vi.mock("@/components/ui/PageHero", () => ({
  __esModule: true,
  default: ({ actions }: { actions?: Array<{ label: string; onClick?: () => void }> }) => (
    <div>
      {actions?.map((action) => (
        <button key={action.label} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/services/history.service", () => ({
  __esModule: true,
  getHistoryById: (...args: unknown[]) => getHistoryByIdMock(...args),
  getHistoryPdf: (...args: unknown[]) => getHistoryPdfMock(...args),
  shareHistory: (...args: unknown[]) => shareHistoryMock(...args),
  listHistoryByClient: (...args: unknown[]) => listHistoryByClientMock(...args),
}));

describe("HistoryDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("alert", alertMock);
    listHistoryByClientMock.mockResolvedValue([]);
    getHistoryByIdMock.mockResolvedValue({
      id: "hist-1",
      clientId: "client-1",
      clientName: "Cliente 1",
      analysisType: "capilar",
      score: 80,
      createdAt: "2026-02-20T10:00:00.000Z",
      flags: [],
      interpretation: "Resumo",
      recommendations: {},
    });
  });

  it("exibe mensagem de erro quando falha ao carregar histórico", async () => {
    getHistoryByIdMock.mockRejectedValue(new Error("Falha de rede"));

    render(<HistoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Falha de rede")).toBeTruthy();
    });
  });

  it("mostra alerta com link ao compartilhar histórico", async () => {
    shareHistoryMock.mockResolvedValue({ token: "tok-1", url: "/history/public/tok-1" });

    render(<HistoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Compartilhar" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("/history/public/tok-1"));
    });
  });

  it("mostra erro de status quando falha download de PDF", async () => {
    getHistoryPdfMock.mockRejectedValue({
      response: {
        status: 403,
        data: { message: "Sem permissão" },
      },
    });

    render(<HistoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF" }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("PDF (403): Sem permissão");
    });
  });

  it("navega para /historico ao clicar em 'Voltar ao histórico'", async () => {
    render(<HistoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Voltar ao histórico" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao histórico" }));

    expect(navigateMock).toHaveBeenCalledWith("/historico");
  });

  it("navega para evolução com clientId e id atual ao clicar em 'Ver evolução'", async () => {
    render(<HistoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Ver evolução" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver evolução" }));

    expect(navigateMock).toHaveBeenCalledWith("/historico/evolucao?clientId=client-1&to=hist-1");
  });
});
