import { VisionController } from './vision.controller';

describe('VisionController - governanÃ§a tricolÃ³gica', () => {
  it('deve remover recomendaÃ§Ãµes de alisamento no modo tricolÃ³gico durante process', async () => {
    const visionService = {
      process: jest.fn(
        async (_salonId, _professionalId, _clientId, payload) => payload,
      ),
    };

    const visionRagService = {
      enrichInterpretation: jest.fn(),
      buildPromptKnowledgeContext: jest.fn(),
    };

    const straighteningService = {
      listWithFilter: jest.fn(async () => [
        { id: 's1', name: 'Progressiva X', criteria: {} },
      ]),
      getPreset: jest.fn(async () => ({
        weights: { damage: 0.5, porosity: 0.3, elasticity: 0.2 },
      })),
      recommendFromAnalysis: jest.fn(() => ({
        items: [{ id: 's1', name: 'Progressiva X', score: 0.9, criteria: {} }],
      })),
    };

    const historyAiService = {
      buildStraighteningExplanation: jest.fn(() => ({
        reasons: ['compatibilidade'],
        warnings: [],
      })),
    };

    const aiAnalysisService = {
      analyzePremium: jest.fn(),
    };

    const visionUploads = {
      inc: jest.fn(),
    };

    const visionUploadDuration = {
      startTimer: jest.fn(() => jest.fn()),
    };
    const analysisEngineService = {
      calculateAnalysisResult: jest.fn(() => ({
        score: 72,
        confidence: 85,
        aptitude: 'BLOQUEADO_MODO_TRICOLOGICO',
        aptitudeLabel: 'Sem aptidÃ£o de alisamento no modo tricolÃ³gico',
        aptitudeMessage:
          'Modo tricolÃ³gico estÃ©tico: foco em cuidados do couro cabeludo e retorno de manutenÃ§Ã£o.',
        canSuggestStraightening: false,
        weightProfileVersion: 'v1.0.0',
        weightProfileId: 'CHEMICALLY_TREATED',
      })),
    };

    const controller = new VisionController(
      visionService as any,
      visionRagService as any,
      straighteningService as any,
      historyAiService as any,
      aiAnalysisService as any,
      analysisEngineService as any,
      visionUploads as any,
      visionUploadDuration as any,
    );

    const req = {
      user: {
        salonId: 'salon-1',
        userId: 'professional-1',
      },
    } as any;

    const result = await controller.process(req, {
      clientId: 'client-1',
      analysisType: 'tricologica',
      signals: { oleosidade: 'alta' },
      aiExplanation: {
        summary: 'Resumo estÃ©tico',
        riskLevel: 'medio',
        technicalDetails: 'Detalhes tÃ©cnicos',
        ragSupport: 'Suporte tÃ©cnico existente',
      },
      recommendations: {
        recommendedStraightenings: ['Progressiva X'],
        restrictedProcedures: [],
      },
    });

    expect(visionService.process).toHaveBeenCalledTimes(1);
    expect(result.recommendations.recommendedStraightenings).toEqual([]);
    expect(result.recommendations.recommendedStraighteningsDetailed).toEqual(
      [],
    );
    expect(result.recommendations.rejectedStraighteningsDetailed).toEqual([]);
    expect(result.recommendations.restrictedProcedures).toContain(
      'Alisamentos (fora do escopo da anÃ¡lise tricolÃ³gica estÃ©tica)',
    );
    expect(
      String(result.recommendations.professionalAlert).toLowerCase(),
    ).toContain('nÃ£o sÃ£o recomendados neste escopo');
  });

  it('deve aplicar governanÃ§a tricolÃ³gica removendo alisamentos e alertando', async () => {
    const visionService = {
      process: jest.fn((_, __, ___, body) => ({
        ...body,
        analysisType: 'tricologica',
      })),
    } as any;
    const visionRagService = { enrichInterpretation: jest.fn() } as any;
    const straighteningService = {
      listWithFilter: jest.fn(async () => []),
      getPreset: jest.fn(async () => ({ weights: {} })),
      recommendFromAnalysis: jest.fn(() => ({ items: [] })),
    } as any;
    const historyAiService = {} as any;
    const aiAnalysisService = {
      analyzePremium: jest.fn(async () => ({
        aiExplanation: {
          summary: 'ok',
          riskLevel: 'baixo',
          technicalDetails: 'td',
        },
        recommendations: {},
        professionalAlert: '',
      })),
    } as any;
    const visionUploads = { inc: jest.fn() } as any;
    const visionUploadDuration = {
      startTimer: jest.fn(() => jest.fn()),
    } as any;
    const analysisEngineService = {
      calculateAnalysisResult: jest.fn(() => ({
        score: 65,
        confidence: 82,
        aptitude: 'BLOQUEADO_MODO_TRICOLOGICO',
        aptitudeLabel: 'Sem aptidÃ£o de alisamento no modo tricolÃ³gico',
        aptitudeMessage:
          'Modo tricolÃ³gico estÃ©tico: foco em cuidados do couro cabeludo e retorno de manutenÃ§Ã£o.',
        canSuggestStraightening: false,
        weightProfileVersion: 'v1.0.0',
        weightProfileId: 'CHEMICALLY_TREATED',
      })),
    } as any;

    const controller = new VisionController(
      visionService,
      visionRagService,
      straighteningService,
      historyAiService,
      aiAnalysisService,
      analysisEngineService,
      visionUploads,
      visionUploadDuration,
    );

    const req = { user: { salonId: 's-1', userId: 'p-1' } } as any;
    const body = {
      clientId: 'c-1',
      analysisType: 'tricologica',
      aiExplanation: {
        summary: 'Resumo',
        riskLevel: 'medio',
        technicalDetails: 'detalhe',
        ragSupport: 'jÃ¡ veio',
      },
      recommendations: {},
    };

    const result = await controller.process(req, body);

    expect(visionService.process).toHaveBeenCalledTimes(1);
    expect((result as any).analysisType).toBe('tricologica');
    expect(result.recommendations.restrictedProcedures).toContain(
      'Alisamentos (fora do escopo da anÃ¡lise tricolÃ³gica estÃ©tica)',
    );
    expect(
      String(result.recommendations.professionalAlert).toLowerCase(),
    ).toContain('nÃ£o sÃ£o recomendados neste escopo');
  });

  it('deve aceitar analysisType geral e repassar ao service', async () => {
    const visionService = {
      process: jest.fn((_, __, ___, body) => ({ ...body })),
    } as any;
    const visionRagService = { enrichInterpretation: jest.fn() } as any;
    const straighteningService = {
      listWithFilter: jest.fn(async () => []),
      getPreset: jest.fn(async () => ({ weights: {} })),
      recommendFromAnalysis: jest.fn(() => ({ items: [] })),
    } as any;
    const historyAiService = {} as any;
    const aiAnalysisService = {
      analyzePremium: jest.fn(async () => ({
        aiExplanation: {
          summary: 'ok',
          riskLevel: 'baixo',
          technicalDetails: 'td',
        },
        recommendations: {},
        professionalAlert: '',
      })),
    } as any;
    const visionUploads = { inc: jest.fn() } as any;
    const visionUploadDuration = {
      startTimer: jest.fn(() => jest.fn()),
    } as any;
    const analysisEngineService = {
      calculateAnalysisResult: jest.fn(() => ({
        score: 78,
        confidence: 88,
        aptitude: 'APTO_COM_CAUTELA',
        aptitudeLabel: 'Apto com cautela',
        aptitudeMessage:
          'Apresenta aptidÃ£o estÃ©tica para procedimentos de alisamento, conforme parÃ¢metros tÃ©cnicos do sistema.',
        canSuggestStraightening: true,
        weightProfileVersion: 'v1.0.0',
        weightProfileId: 'CHEMICALLY_TREATED',
      })),
    } as any;

    const controller = new VisionController(
      visionService,
      visionRagService,
      straighteningService,
      historyAiService,
      aiAnalysisService,
      analysisEngineService,
      visionUploads,
      visionUploadDuration,
    );

    const req = { user: { salonId: 's-1', userId: 'p-1' } } as any;
    const body = {
      clientId: 'c-1',
      analysisType: 'geral',
      aiExplanation: {
        summary: 'Resumo',
        riskLevel: 'medio',
        technicalDetails: 'detalhe',
        ragSupport: 'jÃ¡ veio',
      },
      recommendations: {},
    };

    const result = await controller.process(req, body);

    expect(visionService.process).toHaveBeenCalledTimes(1);
    expect((result as any).analysisType).toBe('geral');
  });

  it('deve rejeitar analysisType invÃ¡lido', async () => {
    const controller = new VisionController(
      { process: jest.fn() } as any,
      { enrichInterpretation: jest.fn() } as any,
      {} as any,
      {} as any,
      {
        analyzePremium: jest.fn(async () => ({
          aiExplanation: {
            summary: 'ok',
            riskLevel: 'baixo',
            technicalDetails: 'td',
          },
          recommendations: {},
          professionalAlert: '',
        })),
      } as any,
      {
        calculateAnalysisResult: jest.fn(() => ({
          score: 70,
          confidence: 85,
          aptitude: 'APTO_COM_CAUTELA',
          aptitudeLabel: 'Apto com cautela',
          aptitudeMessage:
            'Apresenta aptidÃ£o estÃ©tica para procedimentos de alisamento, conforme parÃ¢metros tÃ©cnicos do sistema.',
          canSuggestStraightening: true,
          weightProfileVersion: 'v1.0.0',
          weightProfileId: 'CHEMICALLY_TREATED',
        })),
      } as any,
      { inc: jest.fn() } as any,
      { startTimer: jest.fn(() => jest.fn()) } as any,
    );

    const req = { user: { salonId: 's-1', userId: 'p-1' } } as any;
    await expect(
      controller.process(req, { clientId: 'c-1', analysisType: 'invalido' }),
    ).rejects.toThrow('analysisType invÃ¡lido');
  });
});
