import { HistoryService } from './history.service';

describe('HistoryService - governança de modos', () => {
  let service: HistoryService;

  beforeEach(() => {
    const repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const clienteRepositoryMock = {
      find: jest.fn(),
    };

    service = new HistoryService(
      repositoryMock as any,
      clienteRepositoryMock as any,
    );
  });

  it('deve bloquear alisamentos em análise tricológica', () => {
    const item = {
      id: 'h-1',
      clientId: 'c-1',
      createdAt: new Date('2026-02-20T12:00:00.000Z'),
      visionResult: {
        type: 'tricologica',
        score: 72,
        interpretation: 'Ambiente sensibilizado',
        flags: [],
      },
      aiExplanation: null,
      recommendations: {
        recommendedStraightenings: ['Progressiva X'],
        recommendedStraighteningsDetailed: [
          { name: 'Progressiva X', score: 0.9 },
        ],
        rejectedStraighteningsDetailed: [{ name: 'Selagem Y', score: 0.1 }],
        restrictedProcedures: [],
        treatments: ['Alisamento com ácido'],
      },
    } as any;

    const normalized = (service as any).normalizeHistory(item, new Map());

    expect(normalized.analysisType).toBe('tricologica');
    expect(normalized.recommendations.recommendedStraightenings).toEqual([]);
    expect(
      normalized.recommendations.recommendedStraighteningsDetailed,
    ).toEqual([]);
    expect(normalized.recommendations.rejectedStraighteningsDetailed).toEqual(
      [],
    );
    expect(normalized.recommendations.restrictedProcedures).toContain(
      'Alisamentos (fora do escopo da análise tricológica estética)',
    );
    expect(
      String(normalized.recommendations.professionalAlert).toLowerCase(),
    ).toContain('não são recomendados neste escopo');
  });

  it('deve sanitizar termos clínicos em alerta profissional', () => {
    const item = {
      id: 'h-2',
      clientId: 'c-2',
      createdAt: new Date('2026-02-20T12:00:00.000Z'),
      visionResult: {
        type: 'capilar',
        score: 66,
        interpretation: 'Com indícios de desequilíbrio',
        flags: [],
      },
      aiExplanation: null,
      recommendations: {
        recommendedStraightenings: ['Progressiva Premium'],
        restrictedProcedures: [],
        professionalAlert:
          'Diagnóstico de dermatite e alopecia. Doença em possível inflamação crônica.',
      },
    } as any;

    const normalized = (service as any).normalizeHistory(item, new Map());
    const alert = String(
      normalized.recommendations.professionalAlert || '',
    ).toLowerCase();

    expect(alert).not.toContain('diagnóstico');
    expect(alert).not.toContain('alopecia');
    expect(alert).not.toContain('doença');
    expect(alert).not.toContain('couro');
    // Em análises capilares, alertas de couro são filtrados; pode resultar em string vazia.
    expect(alert === '' || alert.includes('avaliações estéticas')).toBe(true);
  });

  it('não deve manter alisamento detalhado quando estiver restrito', () => {
    const item = {
      id: 'h-3',
      clientId: 'c-3',
      createdAt: new Date('2026-02-20T12:00:00.000Z'),
      visionResult: {
        type: 'capilar',
        score: 81,
        interpretation: 'Fibra com histórico químico',
        flags: [],
      },
      aiExplanation: null,
      recommendations: {
        recommendedStraightenings: ['Progressiva Orgânica'],
        recommendedStraighteningsDetailed: [
          {
            name: 'Progressiva Orgânica',
            score: 0.84,
            reasons: ['Compatível com o nível de dano identificado nos fios.'],
            warnings: ['Restrição: alisamento orgânico'],
          },
        ],
        restrictedProcedures: ['Progressiva Organica'],
      },
    } as any;

    const normalized = (service as any).normalizeHistory(item, new Map());
    const rec = normalized.recommendations;

    expect(rec.recommendedStraighteningsDetailed).toEqual([]);
    expect(
      rec.restrictedProcedures.map((value: string) => value.toLowerCase()),
    ).toContain('progressiva orgânica');
  });
});
