import { Injectable } from "@nestjs/common";

@Injectable()
export class EmbeddingService {
  /**
   * Stub técnico de embeddings.
   * Mantém o sistema funcional sem depender de OpenAI nesta fase.
   * A implementação real será feita na FASE DE IA.
   */
  async embed(text: string): Promise<number[]> {
    // Vetor fixo e determinístico (mock)
    return Array(1536).fill(0);
  }
}
