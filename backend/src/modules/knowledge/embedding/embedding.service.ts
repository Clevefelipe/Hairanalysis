import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  /**
   * Embedding determinístico local (fallback sem dependência externa).
   * Não substitui embeddings semânticos reais, mas diferencia documentos
   * por conteúdo e permite busca por similaridade funcional no MVP.
   */
  async embed(text?: string): Promise<number[]> {
    const dimension = 256;
    const vector = Array(dimension).fill(0);
    const normalized = String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return vector;
    }

    const tokens = normalized.split(' ').filter(Boolean);
    for (const token of tokens) {
      let hash = 2166136261;
      for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }

      const index = Math.abs(hash) % dimension;
      const sign = hash & 1 ? 1 : -1;
      vector[index] += sign;
    }

    const norm = Math.sqrt(vector.reduce((sum, n) => sum + n * n, 0));
    if (!norm) return vector;
    return vector.map((n) => n / norm);
  }
}
