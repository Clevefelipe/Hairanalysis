import { describe, expect, it, vi, beforeEach } from "vitest";
import { postAestheticDecision } from "./aestheticDecision.service";

vi.mock("./api", () => ({
  __esModule: true,
  default: { post: vi.fn() },
}));

const apiModule = await import("./api");
const apiMock = apiModule.default as unknown as { post: ReturnType<typeof vi.fn> };

describe("postAestheticDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia payload para /ai/aesthetic-decision e retorna dados normalizados", async () => {
    const mockResponse = {
      resumoTecnico: "Resumo",
      scoreIntegridade: 80,
      absorptionCoefficient: { index: 42, label: "media" },
      cuticleDiagnostic: { ipt: 55, label: "alta" },
      breakRiskPercentual: 30,
      protocoloPersonalizado: { baseTratamento: { foco: "media", descricao: "Equilíbrio" } },
    };

    apiMock.post.mockResolvedValue({ data: mockResponse });

    const payload = {
      structuredData: { porosidade: 50 },
      absorptionTest: { volumeMl: 10, timeSeconds: 20 },
    };

    const result = await postAestheticDecision(payload);

    expect(apiMock.post).toHaveBeenCalledWith("/ai/aesthetic-decision", payload);
    expect(result).toEqual(mockResponse);
  });

  it("propaga erro quando request falha", async () => {
    apiMock.post.mockRejectedValue(new Error("falha"));

    await expect(postAestheticDecision({})).rejects.toThrow("falha");
  });
});
