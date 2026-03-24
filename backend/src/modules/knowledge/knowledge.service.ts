import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngestTextDto } from './dto/ingest-text.dto';
import { EmbeddingService } from './embedding/embedding.service';
import { EmbeddingStore } from './store/embedding.store';
import { cosineSimilarity } from './utils/cosine';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { KnowledgeDocument } from './knowledge-document.entity';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private static readonly MIN_SEMANTIC_SCORE = 0.12;

  constructor(
    private readonly embeddingService: EmbeddingService,
    @InjectRepository(KnowledgeDocument)
    private readonly knowledgeRepo: Repository<KnowledgeDocument>,
  ) {}

  private splitIntoChunks(content: string, chunkSize = 1200, overlap = 150) {
    const normalized = (content || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (!normalized) return [];
    if (normalized.length <= chunkSize) return [normalized];

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      const hardEnd = Math.min(normalized.length, start + chunkSize);
      let end = hardEnd;

      if (hardEnd < normalized.length) {
        const windowStart = Math.max(start, hardEnd - 180);
        const window = normalized.slice(windowStart, hardEnd);
        const breakMatch = /[.!?]\s|\n/.exec(window);
        if (breakMatch && typeof breakMatch.index === 'number') {
          const candidate =
            windowStart + breakMatch.index + breakMatch[0].length;
          if (candidate - start >= Math.floor(chunkSize * 0.6)) {
            end = candidate;
          }
        } else {
          const lastSpace = normalized.lastIndexOf(' ', hardEnd);
          if (lastSpace > start + Math.floor(chunkSize * 0.6)) {
            end = lastSpace;
          }
        }
      }

      const slice = normalized.slice(start, end).trim();
      if (slice) chunks.push(slice);
      if (end >= normalized.length) break;
      start = Math.max(0, end - overlap);
    }

    return chunks;
  }

  private decodeTextFileBuffer(buffer: Buffer) {
    const utf8Text = buffer.toString('utf8');
    if (!utf8Text.includes('�')) {
      return utf8Text;
    }

    const latin1Text = buffer.toString('latin1');
    return Array.from(latin1Text)
      .filter((char) => {
        const code = char.charCodeAt(0);
        return !(code <= 0x08 || (code >= 0x0e && code <= 0x1f));
      })
      .join('');
  }

  async listDocuments(salonId: string, domain?: 'tricologia' | 'capilar') {
    const qb = this.knowledgeRepo
      .createQueryBuilder('k')
      .select('k.groupId', 'groupId')
      .addSelect('k.domain', 'domain')
      .addSelect('k.title', 'title')
      .addSelect('k.sourceType', 'sourceType')
      .addSelect('MIN(k.createdAt)', 'createdAt')
      .addSelect('COUNT(1)', 'chunks')
      .where('k.salonId = :salonId', { salonId })
      .andWhere('k.groupId IS NOT NULL')
      .groupBy('k.groupId')
      .addGroupBy('k.domain')
      .addGroupBy('k.title')
      .addGroupBy('k.sourceType')
      .orderBy('MIN(k.createdAt)', 'DESC');

    if (domain) {
      qb.andWhere('k.domain = :domain', { domain });
    }

    return qb.getRawMany();
  }

  async getDocumentGroup(salonId: string, groupId: string) {
    return this.knowledgeRepo.find({
      where: { salonId, groupId },
      order: { chunkIndex: 'ASC' },
    });
  }

  async getDocumentGroupPreview(
    salonId: string,
    groupId: string,
    maxChars?: number,
  ) {
    const group = await this.knowledgeRepo.find({
      where: { salonId, groupId },
      order: { chunkIndex: 'ASC' },
    });

    if (!group.length) {
      throw new BadRequestException('Documento não encontrado');
    }

    const safeMax =
      typeof maxChars === 'number' && Number.isFinite(maxChars)
        ? Math.max(200, Math.min(20000, Math.floor(maxChars)))
        : 6000;

    const fullText = group
      .map((c) => String(c.content || '').trim())
      .filter(Boolean)
      .join('\n\n');

    const previewText =
      fullText.length > safeMax
        ? `${fullText.slice(0, safeMax).trimEnd()}...`
        : fullText;

    return {
      groupId,
      domain: group[0].domain,
      title: group[0].title,
      sourceType: group[0].sourceType,
      createdAt: group[0].createdAt,
      chunks: group.length,
      previewText,
    };
  }

  async deleteDocumentGroup(salonId: string, groupId: string) {
    const result = await this.knowledgeRepo.delete({ salonId, groupId });
    EmbeddingStore.removeByGroupId(salonId, groupId);
    return { success: true, deleted: result.affected ?? 0 };
  }

  async onModuleInit() {
    await this.loadFromDatabase();
  }

  async ingestText(dto: IngestTextDto, salonId: string) {
    if (!dto || !String(dto.content || '').trim()) {
      throw new BadRequestException('content is required');
    }

    if (dto.domain !== 'tricologia' && dto.domain !== 'capilar') {
      throw new BadRequestException('domain inválido');
    }

    if (dto.language !== 'pt' && dto.language !== 'en') {
      throw new BadRequestException('language inválido');
    }

    const groupId = randomUUID();
    const chunks = this.splitIntoChunks(dto.content);
    if (!chunks.length) {
      throw new BadRequestException('content sem texto válido para indexação');
    }
    const entities: KnowledgeDocument[] = [];

    for (let i = 0; i < chunks.length; i++) {
      entities.push(
        this.knowledgeRepo.create({
          salonId,
          groupId,
          chunkIndex: i,
          domain: dto.domain,
          title: dto.title,
          content: chunks[i],
          sourceType: 'text',
        }),
      );
    }

    await this.knowledgeRepo.save(entities);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.embeddingService.embed(chunks[i]);
      EmbeddingStore.add({
        salonId,
        groupId,
        content: chunks[i],
        domain: dto.domain,
        language: dto.language,
        embedding,
      });
    }

    return { success: true };
  }

  async ingestFile(
    file: any,
    domain: 'tricologia' | 'capilar',
    salonId: string,
    title?: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    if (domain !== 'tricologia' && domain !== 'capilar') {
      throw new BadRequestException('domain inválido');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    let content = '';
    let sourceType = ext.replace('.', '') || file.mimetype;

    if (ext === '.txt' || ext === '.md') {
      content = this.decodeTextFileBuffer(file.buffer);
    } else if (ext === '.pdf') {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const parsed = await parser.getText();
        content = parsed.text || '';
      } catch {
        throw new BadRequestException(
          'Falha ao processar PDF. Verifique o arquivo.',
        );
      } finally {
        try {
          await parser.destroy();
        } catch {
          // best-effort cleanup
        }
      }
      sourceType = 'pdf';
    } else if (ext === '.docx') {
      try {
        const parsed = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        content = parsed.value || '';
      } catch {
        throw new BadRequestException(
          'Falha ao processar DOCX. Verifique se o arquivo está íntegro.',
        );
      }
      sourceType = 'docx';
    } else {
      throw new BadRequestException('Formato não suportado.');
    }

    if (!content.trim()) {
      throw new BadRequestException(
        'Não foi possível extrair texto do arquivo.',
      );
    }

    const groupId = randomUUID();
    const chunks = this.splitIntoChunks(content);
    if (!chunks.length) {
      throw new BadRequestException('Arquivo sem texto válido para indexação.');
    }
    const entities: KnowledgeDocument[] = [];

    for (let i = 0; i < chunks.length; i++) {
      entities.push(
        this.knowledgeRepo.create({
          salonId,
          groupId,
          chunkIndex: i,
          domain,
          title,
          content: chunks[i],
          sourceType,
        }),
      );
    }

    await this.knowledgeRepo.save(entities);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.embeddingService.embed(chunks[i]);
      EmbeddingStore.add({
        salonId,
        groupId,
        content: chunks[i],
        domain,
        language: 'pt',
        embedding,
      });
    }

    return { success: true };
  }

  async loadFromDatabase(): Promise<number> {
    EmbeddingStore.reset();
    const docs = await this.knowledgeRepo.find();
    for (const doc of docs) {
      const embedding = await this.embeddingService.embed(doc.content);
      EmbeddingStore.add({
        salonId: doc.salonId,
        groupId: doc.groupId,
        content: doc.content,
        domain: doc.domain,
        language: 'pt',
        embedding,
      });
    }
    return docs.length;
  }

  async reload(): Promise<{ success: boolean; loaded: number }> {
    const loaded = await this.loadFromDatabase();
    return { success: true, loaded };
  }

  async semanticSearch(
    query: string,
    salonId: string,
    domain: 'tricologia' | 'capilar',
    limit = 3,
  ) {
    if (!query || !String(query).trim()) {
      throw new BadRequestException('query inválida');
    }

    if (domain !== 'tricologia' && domain !== 'capilar') {
      throw new BadRequestException('domain inválido');
    }

    const safeLimit = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(10, Math.floor(Number(limit))))
      : 3;

    const qEmbedding = await this.embeddingService.embed(query);
    const items = EmbeddingStore.all(salonId, domain);

    return items
      .map((item) => ({
        content: item.content,
        groupId: item.groupId,
        score: item.embedding?.length
          ? cosineSimilarity(qEmbedding, item.embedding)
          : 0,
      }))
      .filter((item) => item.score >= KnowledgeService.MIN_SEMANTIC_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit);
  }
}
