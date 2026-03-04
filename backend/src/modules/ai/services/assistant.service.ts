import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { KnowledgeService } from '../../knowledge/knowledge.service';

type AssistantContext = {
  analysisType?: string;
  domain?: string;
  salonId?: string;
} & Record<string, unknown>;

type AssistantAnswer = {
  answer: string;
  sources: { label: string; reference?: string }[];
};

@Injectable()
export class AssistantService {
  private client: OpenAI | null = null;

  constructor(private readonly knowledge: KnowledgeService) {}

  private getClient(): OpenAI {
    if (this.client) return this.client;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY não configurada. IA indisponível neste ambiente.',
      );
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  private resolveDomain(context?: AssistantContext): 'tricologia' | 'capilar' {
    const analysisTypeRaw =
      typeof context?.analysisType === 'string'
        ? context.analysisType
        : typeof context?.domain === 'string'
          ? context.domain
          : '';
    const analysisType = analysisTypeRaw.toLowerCase();

    if (analysisType.includes('trico')) return 'tricologia';
    if (analysisType.includes('capilar') || analysisType === 'capilar') {
      return 'capilar';
    }
    return 'capilar';
  }

  private async buildKnowledgeContext(params: {
    question: string;
    context?: AssistantContext;
    salonId?: string;
  }): Promise<AssistantAnswer['sources'] & { text: string }> {
    if (!params.salonId) return Object.assign([], { text: '' });

    const domain = this.resolveDomain(params.context);
    const queryParts = [params.question];

    if (params.context) {
      const ctxString = JSON.stringify(params.context);
      if (ctxString && ctxString.length <= 800) queryParts.push(ctxString);
    }

    const hits = await this.knowledge.semanticSearch(
      queryParts.join(' | '),
      params.salonId,
      domain,
      4,
    );

    const sources = hits.map((hit, idx) => {
      const content = String(hit.content || '')
        .replace(/\s+/g, ' ')
        .trim();
      const clipped =
        content.length > 320 ? `${content.slice(0, 320).trim()}...` : content;
      return {
        label: `${idx + 1}. ${clipped}`,
        reference: hit.groupId,
      };
    });

    const text = sources.map((s) => s.label).join('\n');
    return Object.assign(sources, { text });
  }

  async ask(
    question: string,
    context?: AssistantContext,
  ): Promise<AssistantAnswer> {
    const safeQuestion = String(question || '').trim();
    const safeContext: AssistantContext = {};

    if (context && typeof context === 'object') {
      const candidate = context as Record<string, unknown>;
      const analysisType = candidate.analysisType;
      const domain = candidate.domain;
      const salonId = candidate.salonId;

      if (typeof analysisType === 'string')
        safeContext.analysisType = analysisType;
      if (typeof domain === 'string') safeContext.domain = domain;
      if (typeof salonId === 'string') safeContext.salonId = salonId;

      // preserva demais campos para contexto, mantendo tipagem ampla
      Object.entries(candidate).forEach(([key, value]) => {
        if (!(key in safeContext)) {
          safeContext[key] = value;
        }
      });
    }

    const knowledge = await this.buildKnowledgeContext({
      question: safeQuestion,
      context: safeContext,
      salonId: safeContext.salonId,
    });

    const promptParts = [
      'Você é o Assistente IA do salão.',
      'Responda em PT-BR, de forma objetiva e útil para operação do sistema.',
      'Não invente dados não fornecidos, não faça afirmações clínicas e evite recomendações de alisamento.',
      `Contexto da tela: ${JSON.stringify(safeContext)}`,
    ];

    if (knowledge.text) {
      promptParts.push(
        'Fontes da base de conhecimento (resuma, cite só o que for relevante):',
        knowledge.text,
      );
    }

    promptParts.push(`Pergunta: ${safeQuestion}`);

    const prompt = promptParts.join('\n');

    const completion = await this.getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) {
      throw new Error('IA retornou resposta vazia');
    }

    return {
      answer: String(content).trim(),
      sources: Array.isArray(knowledge)
        ? (knowledge as AssistantAnswer['sources'])
        : [],
    };
  }
}
