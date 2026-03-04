import { BadRequestException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingStore } from './store/embedding.store';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

jest.mock('pdf-parse', () => jest.fn());
jest.mock('mammoth', () => ({
  __esModule: true,
  default: {
    extractRawText: jest.fn(),
  },
}));

describe('KnowledgeService', () => {
  const pdfParseMock = pdfParse as unknown as jest.Mock;
  const mammothExtractRawTextMock = (mammoth as any)
    .extractRawText as jest.Mock;

  const repoMock = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (items) => items),
    find: jest.fn(async () => []),
    delete: jest.fn(async () => ({ affected: 0 })),
    createQueryBuilder: jest.fn(),
  };

  const embeddingServiceMock = {
    embed: jest.fn(),
  };

  let service: KnowledgeService;

  beforeEach(() => {
    EmbeddingStore.reset();
    jest.clearAllMocks();
    service = new KnowledgeService(
      embeddingServiceMock as any,
      repoMock as any,
    );
  });

  it('returns semantic search ordered by similarity and scoped by salon/domain', async () => {
    embeddingServiceMock.embed.mockResolvedValue([1, 0]);

    EmbeddingStore.add({
      salonId: 'salon-1',
      groupId: 'g1',
      content: 'hidratação profunda para fios porosos',
      domain: 'capilar',
      language: 'pt',
      embedding: [1, 0],
    });
    EmbeddingStore.add({
      salonId: 'salon-1',
      groupId: 'g2',
      content: 'nutrição leve para manutenção',
      domain: 'capilar',
      language: 'pt',
      embedding: [0.7, 0.3],
    });
    EmbeddingStore.add({
      salonId: 'salon-1',
      groupId: 'g3',
      content: 'controle de oleosidade do couro',
      domain: 'tricologia',
      language: 'pt',
      embedding: [1, 0],
    });
    EmbeddingStore.add({
      salonId: 'salon-2',
      groupId: 'g4',
      content: 'hidratação para outro salão',
      domain: 'capilar',
      language: 'pt',
      embedding: [1, 0],
    });

    const result = await service.semanticSearch(
      'hidratação capilar',
      'salon-1',
      'capilar',
      2,
    );

    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('hidratação profunda para fios porosos');
    expect(result[1].content).toBe('nutrição leve para manutenção');
    expect(embeddingServiceMock.embed).toHaveBeenCalledWith(
      'hidratação capilar',
    );
  });

  it('ingests text and generates embeddings from actual chunk text', async () => {
    embeddingServiceMock.embed.mockResolvedValue([0.5, 0.5]);

    await service.ingestText(
      {
        title: 'Guia técnico',
        content: 'Texto técnico de referência para protocolo capilar.',
        domain: 'capilar',
        language: 'pt',
      },
      'salon-1',
    );

    expect(repoMock.save).toHaveBeenCalledTimes(1);
    expect(embeddingServiceMock.embed).toHaveBeenCalledWith(
      'Texto técnico de referência para protocolo capilar.',
    );

    const results = await service.semanticSearch(
      'protocolo capilar',
      'salon-1',
      'capilar',
      1,
    );
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('protocolo capilar');
  });

  it('throws validation error for empty semantic search query', async () => {
    await expect(
      service.semanticSearch('   ', 'salon-1', 'capilar'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('filters out semantic results below minimum similarity threshold', async () => {
    embeddingServiceMock.embed.mockResolvedValue([1, 0]);

    EmbeddingStore.add({
      salonId: 'salon-1',
      groupId: 'g-low',
      content: 'conteúdo distante da consulta',
      domain: 'capilar',
      language: 'pt',
      embedding: [0, 1],
    });

    const result = await service.semanticSearch(
      'hidratação capilar',
      'salon-1',
      'capilar',
      3,
    );

    expect(result).toEqual([]);
  });

  it('throws validation error for ingestText with whitespace-only content', async () => {
    await expect(
      service.ingestText(
        {
          title: 'Inválido',
          content: '   ',
          domain: 'capilar',
          language: 'pt',
        },
        'salon-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses latin1 fallback decoding for txt files with invalid utf8 bytes', async () => {
    embeddingServiceMock.embed.mockResolvedValue([0.4, 0.6]);

    const latin1Bytes = Buffer.from([0x61, 0xe7, 0xe3, 0x6f]); // "ação" em latin1
    await service.ingestFile(
      {
        originalname: 'base.txt',
        mimetype: 'text/plain',
        buffer: latin1Bytes,
      },
      'capilar',
      'salon-1',
      'Base técnica',
    );

    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'ação',
      }),
    );
  });

  it('throws friendly error when PDF parsing fails', async () => {
    pdfParseMock.mockRejectedValue(new Error('invalid pdf'));

    await expect(
      service.ingestFile(
        {
          originalname: 'manual.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('dummy'),
        },
        'capilar',
        'salon-1',
      ),
    ).rejects.toThrow('Falha ao processar PDF. Verifique o arquivo.');
  });

  it('throws friendly error when DOCX parsing fails', async () => {
    mammothExtractRawTextMock.mockRejectedValue(new Error('invalid docx'));

    await expect(
      service.ingestFile(
        {
          originalname: 'manual.docx',
          mimetype:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: Buffer.from('dummy'),
        },
        'capilar',
        'salon-1',
      ),
    ).rejects.toThrow(
      'Falha ao processar DOCX. Verifique se o arquivo está íntegro.',
    );
  });
});
