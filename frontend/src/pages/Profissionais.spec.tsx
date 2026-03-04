import { describe, it, vi, beforeAll, beforeEach, afterEach, expect } from "vitest";
import { render, screen, waitFor, fireEvent, act, waitForElementToBeRemoved } from "@testing-library/react";
import "@testing-library/jest-dom";

type Professional = { id: string; email: string; fullName: string; role: string };

let mockStore: Professional[] = [];

const listProfessionals = vi.fn((): Promise<Professional[]> => Promise.resolve([...mockStore]));
const updateProfessional = vi.fn(
  (salonId: string, id: string, payload: Partial<Professional>): Promise<Professional> => {
    mockStore = mockStore.map((p) => (p.id === id ? { ...p, ...payload } : p));
    return Promise.resolve(mockStore.find((p) => p.id === id) as Professional);
  },
);
const deleteProfessional = vi.fn((_salonId: string, id: string) => {
  mockStore = mockStore.filter((p) => p.id !== id);
  return Promise.resolve({ success: true } as const);
});
const createProfessional = vi.fn((payload: Professional): Promise<Professional> => {
  mockStore = [{ ...payload }, ...mockStore];
  return Promise.resolve(payload);
});

vi.mock("@/services/authApi", () => ({
  listProfessionals,
  updateProfessional,
  deleteProfessional,
  createProfessional,
}));

const notifyMock = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ notify: notifyMock }),
}));

const useAuthMock = vi.fn(() => ({ role: "ADMIN", user: { salonId: "salon-1" } }));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

// importar após mocks para garantir substituição
let Profissionais: typeof import("./Profissionais").default;

beforeAll(async () => {
  Profissionais = (await import("./Profissionais")).default;
});

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Profissionais", () => {
  beforeEach(() => {
    mockStore = [{ id: "p1", email: "pro@example.com", fullName: "Antigo", role: "PROFESSIONAL" }];
    notifyMock.mockClear();
    listProfessionals.mockClear();
    updateProfessional.mockClear();
    deleteProfessional.mockClear();
    createProfessional.mockClear();
    useAuthMock.mockReturnValue({ role: "ADMIN", user: { salonId: "salon-1" } });
  });

  it("exibe lista e permite editar profissional", async () => {
    updateProfessional.mockResolvedValueOnce({
      id: "p1",
      email: "pro@example.com",
      fullName: "Novo Nome",
      role: "PROFESSIONAL",
    });

    await act(async () => {
      render(<Profissionais />);
      await flushPromises();
    });

    await screen.findByText("Antigo");

    await act(async () => {
      fireEvent.click(screen.getByText("Editar"));
    });

    await screen.findByText("Editar profissional");

    const nomeInputs = await screen.findAllByPlaceholderText("Nome completo");
    const nomeInput = nomeInputs[nomeInputs.length - 1];
    fireEvent.change(nomeInput, { target: { value: "Novo Nome" } });
    fireEvent.change(screen.getByPlaceholderText("Nova senha (mín. 8 caracteres)"), {
      target: { value: "nova-senha-123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Salvar"));
    });

    await waitFor(() =>
      expect(updateProfessional).toHaveBeenCalledWith("salon-1", "p1", {
        fullName: "Novo Nome",
        password: "nova-senha-123",
      }),
    );

    await waitFor(() => expect(screen.queryByText("Novo Nome")).toBeInTheDocument());
  });

  it("remove profissional após confirmação", async () => {
    deleteProfessional.mockResolvedValueOnce({ success: true });

    await act(async () => {
      render(<Profissionais />);
      await flushPromises();
    });

    const toRemove = await screen.findByText("Antigo");

    await act(async () => {
      fireEvent.click(screen.getByText("Excluir"));
    });

    await screen.findByText("Excluir profissional");
    const confirmButtons = screen.getAllByText("Excluir");
    const confirmButton = confirmButtons[confirmButtons.length - 1];

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => expect(deleteProfessional).toHaveBeenCalledWith("salon-1", "p1"));
    await waitFor(() => expect(screen.queryByText("Antigo")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Nenhum profissional cadastrado ainda.")).toBeInTheDocument());
  });

  it("cadastra novo profissional e limpa campos", async () => {
    mockStore = [];
    createProfessional.mockResolvedValueOnce({
      id: "p2",
      email: "novo@example.com",
      fullName: "Novo Prof",
      role: "PROFESSIONAL",
    });

    await act(async () => {
      render(<Profissionais />);
      await flushPromises();
    });

    await screen.findByText("Profissionais cadastrados");

    await act(async () => {
      const newButtons = screen.getAllByText("Novo profissional");
      const trigger = newButtons[newButtons.length - 1];
      fireEvent.click(trigger);
    });

    await screen.findByText("Cadastrar profissional");

    const nomeInput = await screen.findByPlaceholderText("Nome completo");
    fireEvent.change(nomeInput, { target: { value: "Novo Prof" } });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "novo@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha provisória"), {
      target: { value: "senha1234" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Cadastrar"));
    });

    await waitFor(() =>
      expect(createProfessional).toHaveBeenCalledWith(
        { email: "novo@example.com", password: "senha1234", fullName: "Novo Prof" },
        "salon-1",
      ),
    );

    await waitFor(() => expect(screen.queryByText("Novo Prof")).toBeInTheDocument());

    // modal fecha após criar; reabrir para confirmar campos limpos
    await act(async () => {
      const newButtons = screen.getAllByText("Novo profissional");
      const trigger = newButtons[newButtons.length - 1];
      fireEvent.click(trigger);
    });

    await screen.findByText("Cadastrar profissional");
    const nomeInputAgain = await screen.findByPlaceholderText("Nome completo");
    expect((nomeInputAgain as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText("E-mail") as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText("Senha provisória") as HTMLInputElement).value).toBe("");
  });

  it("bloqueia acesso quando não é ADMIN", async () => {
    (listProfessionals as any).mockResolvedValueOnce([]);
    useAuthMock.mockReturnValue({ role: "PROFESSIONAL", user: { salonId: "salon-1" } });

    await act(async () => {
      render(<Profissionais />);
    });

    expect(
      await screen.findByText("Apenas administradores podem acessar o cadastro de profissionais."),
    ).not.toBeNull();
    expect(listProfessionals).not.toHaveBeenCalled();
  });

  it("avisa quando não há salonId associado", async () => {
    (listProfessionals as any).mockResolvedValueOnce([]);
    useAuthMock.mockReturnValue({ role: "ADMIN", user: { salonId: undefined as any } });

    await act(async () => {
      render(<Profissionais />);
    });

    expect(
      await screen.findByText(
        "Nenhum salão associado ao seu usuário. Vincule-se a um salão para habilitar o cadastro.",
      ),
    ).not.toBeNull();
    expect(listProfessionals).not.toHaveBeenCalled();
  });
});
