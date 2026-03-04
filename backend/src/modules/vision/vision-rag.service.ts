import { Injectable } from "@nestjs/common";
import { KnowledgeService } from "../knowledge/knowledge.service";

type KnowledgeDomain = "tricologia" | "capilar";

@Injectable()
export class VisionRagService {
  constructor(private readonly knowledge: KnowledgeService) {}

  private mapDomain(
    type: "tricologica" | "capilar",
  ): KnowledgeDomain {
    if (type === "tricologica") {
      return "tricologia";
    }
    return "capilar";
  }

  private buildQuery(
    analysisType: "tricologica" | "capilar",
    signals: Record<string, string>,
  ): string {
    const base =
      analysisType === "tricologica"
        ? "couro cabeludo"
        : "fio capilar";

    const details = Object.entries(signals)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ");

    return `${base} com ${details}`;
  }

  async enrichInterpretation(params: {
    analysisType: "tricologica" | "capilar";
    signals: Record<string, string>;
    baseInterpretation: string;
    salonId?: string;
  }) {
    const query = this.buildQuery(
      params.analysisType,
      params.signals,
    );

    const domain: KnowledgeDomain =
      this.mapDomain(params.analysisType);

    const knowledgeHits =
      await this.knowledge.semanticSearch(
        query,
        domain,
        3,
      );

    const knowledgeText = knowledgeHits
      .map(k => `• ${k.content}`)
      .join("\n");

    return `
${params.baseInterpretation}

Interpretação técnica:
${knowledgeText || "Nenhum material técnico relevante encontrado para este padrão."}
`.trim();
  }

  async buildPromptKnowledgeContext(params: {
    salonId: string;
    analysisType: "tricologica" | "capilar";
    notes?: string;
    extraSignals?: Record<string, string>;
    limit?: number;
  }) {
    void params;
    return "";
  }
}
