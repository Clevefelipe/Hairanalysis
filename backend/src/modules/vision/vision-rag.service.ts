import { Injectable } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';

type KnowledgeDomain = 'tricologia' | 'capilar';

@Injectable()
export class VisionRagService {
  constructor(private readonly knowledge: KnowledgeService) {}

  private mapDomain(
    type: 'tricologica' | 'capilar' | 'geral',
  ): KnowledgeDomain {
    if (type === 'tricologica') {
      return 'tricologia';
    }
    return 'capilar';
  }

  private buildQuery(
    analysisType: 'tricologica' | 'capilar' | 'geral',
    signals: Record<string, string>,
  ): string {
    const base =
      analysisType === 'tricologica' ? 'couro cabeludo' : 'fio capilar';

    const details = Object.entries(signals)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');

    return `${base} com ${details}`;
  }

  async enrichInterpretation(params: {
    salonId: string;
    analysisType: 'tricologica' | 'capilar' | 'geral';
    signals: Record<string, string>;
    baseInterpretation: string;
  }) {
    const query = this.buildQuery(params.analysisType, params.signals);

    const domains: KnowledgeDomain[] =
      params.analysisType === 'geral'
        ? ['tricologia', 'capilar']
        : [this.mapDomain(params.analysisType)];

    const knowledgeHits = (
      await Promise.all(
        domains.map((domain) =>
          this.knowledge.semanticSearch(query, params.salonId, domain, 3),
        ),
      )
    ).flat();

    const maxChunkChars = 280;
    const maxTotalChars = 1100;

    const clipped = knowledgeHits
      .map((k) => {
        const text = String(k.content || '')
          .replace(/\s+/g, ' ')
          .trim();
        const short =
          text.length > maxChunkChars
            ? `${text.slice(0, maxChunkChars).trim()}...`
            : text;
        return `• ${short}`;
      })
      .filter(Boolean);

    let knowledgeText = clipped.join('\n');
    if (knowledgeText.length > maxTotalChars) {
      knowledgeText = `${knowledgeText.slice(0, maxTotalChars).trim()}...`;
    }

    return `
${params.baseInterpretation}

Interpretação técnica:
${knowledgeText || 'Nenhum material técnico relevante encontrado para este padrão.'}
`.trim();
  }

  async buildPromptKnowledgeContext(params: {
    salonId: string;
    analysisType: 'tricologica' | 'capilar' | 'geral';
    notes?: string;
    extraSignals?: Record<string, string>;
    limit?: number;
  }) {
    const queryParts: string[] = [];
    if (params.notes && params.notes.trim()) {
      queryParts.push(params.notes.trim());
    }
    if (params.extraSignals) {
      const extra = Object.entries(params.extraSignals)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (extra) queryParts.push(extra);
    }
    if (queryParts.length === 0) {
      queryParts.push(
        params.analysisType === 'tricologica'
          ? 'couro cabeludo'
          : 'fibra capilar',
      );
    }

    const domains: KnowledgeDomain[] =
      params.analysisType === 'geral'
        ? ['tricologia', 'capilar']
        : [this.mapDomain(params.analysisType)];

    const hits = (
      await Promise.all(
        domains.map((domain) =>
          this.knowledge.semanticSearch(
            queryParts.join(' | '),
            params.salonId,
            domain,
            params.limit ?? 4,
          ),
        ),
      )
    ).flat();

    return hits
      .map((item, idx) => {
        const text = String(item.content || '')
          .replace(/\s+/g, ' ')
          .trim();
        const clipped =
          text.length > 320 ? `${text.slice(0, 320).trim()}...` : text;
        return `${idx + 1}. ${clipped}`;
      })
      .join('\n');
  }
}
