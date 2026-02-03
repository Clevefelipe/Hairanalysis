import { Injectable } from "@nestjs/common";
import { HistoryService } from "../history/history.service";

@Injectable()
export class VisionService {
  constructor(
    private readonly historyService: HistoryService,
  ) {}

  async process(
    payload: any,
    salonId: string,
    clientId: string | null,
  ) {
    // 🔹 fluxo existente mantido
    const baseResult = this.runAnalysis(payload);
    const ragResult = await this.enrichWithRag(baseResult);

    // 🔹 FASE 2.9 — salvar com clientId (opcional)
    await this.historyService.save({
      salonId,
      clientId: clientId ?? undefined, // ✅ correção de tipagem
      domain: baseResult.analysisType === "capilar" ? "capilar" : "tricologia",
      baseResult,
      ragResult,
    });

    return {
      baseResult,
      ragResult,
    };
  }

  // ⬇️ métodos já existentes no seu service (mantidos)
  private runAnalysis(payload: any) {
    return payload;
  }

  private async enrichWithRag(result: any) {
    return result.interpretation ?? "";
  }
}
