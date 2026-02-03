import { Injectable, BadRequestException } from "@nestjs/common";
import { IngestTextDto } from "./dto/ingest-text.dto";
import { EmbeddingService } from "./embedding/embedding.service";
import { EmbeddingStore } from "./store/embedding.store";
import { cosineSimilarity } from "./utils/cosine";

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly embeddingService: EmbeddingService,
  ) {}

  async ingestText(dto: IngestTextDto) {
    if (!dto || !dto.content) {
      throw new BadRequestException("content is required");
    }

    const embedding = await this.embeddingService.embed(dto.content);

    EmbeddingStore.add({
      content: dto.content,
      domain: dto.domain,
      language: dto.language,
      embedding,
    });

    return { success: true };
  }

  async semanticSearch(
    query: string,
    domain: "tricologia" | "capilar",
    limit = 3,
  ) {
    const qEmbedding = await this.embeddingService.embed(query);
    const items = EmbeddingStore.all(domain);

    return items
      .map((item) => ({
        content: item.content,
        score: cosineSimilarity(qEmbedding, item.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
