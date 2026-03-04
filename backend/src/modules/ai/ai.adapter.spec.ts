/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { runHairAnalysisPremiumAI, runAestheticDecisionAI } from './ai.adapter';

jest.mock('openai', () => ({
  __esModule: true,
  createMock: jest.fn(),
  default: jest.fn().mockImplementation(function mockOpenAI(this: unknown) {
    const mockModule = jest.requireMock('openai');
    return {
      chat: {
        completions: {
          create: mockModule.createMock,
        },
      },
    };
  }),
}));

const openAIMockModule = jest.requireMock('openai');

describe('runHairAnalysisPremiumAI', () => {
  beforeEach(() => {
    openAIMockModule.createMock.mockReset();
    openAIMockModule.default.mockClear();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.clearAllMocks();
  });

  it('sends response_format json_object in premium requests', async () => {
    openAIMockModule.createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              aiExplanation: {
                summary: 'Resumo técnico',
                riskLevel: 'medio',
                technicalDetails: 'Detalhes técnicos',
              },
              recommendations: {
                recommendedStraightenings: [],
                restrictedProcedures: [],
                treatments: [],
                maintenanceIntervalDays: 45,
                homeCare: [],
                neutralization: {
                  obrigatoria: false,
                  justificativa: 'Não aplicável para este caso.',
                },
              },
              professionalAlert: 'Apto com restricoes',
            }),
          },
        },
      ],
    });

    await runHairAnalysisPremiumAI({
      visionResult: { analysisType: 'capilar', score: 80 },
    });

    expect(openAIMockModule.createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: 'json_object' },
      }),
    );
  });
});

describe('runAestheticDecisionAI', () => {
  const validPayload = {
    resumoTecnico: 'Resumo técnico objetivo',
    scoreIntegridade: 72.4,
    indicesRisco: {
      termico: 'baixo',
      quimico: 'moderado',
      quebra: 'elevado',
      elasticidade: 'moderado',
      sensibilidade: 'baixo',
    },
    classificacaoAptidao: 'apto_com_restricoes',
    alisamentoSelecionado: {
      nome: 'Alisamento X',
      justificativa: 'Menor risco estrutural',
    },
    protocoloPersonalizado: {
      preQuimica: ['Reconstrução leve'],
      alisamento: {
        produto: 'Alisamento X',
        tempoEstimado: '35 minutos',
        neutralizacao: {
          obrigatoria: true,
          produto: 'Acidificante',
          tempo: '5 minutos',
          justificativa: 'Processo alcalino; estabilizar pH.',
        },
      },
      posQuimica: ['Selagem térmica'],
      cronograma4Semanas: ['S1', 'S2', 'S3', 'S4'],
    },
    alertasTecnicos: ['Controlar temperatura'],
    confiancaAnalise: 88,
  };

  beforeEach(() => {
    openAIMockModule.createMock.mockReset();
    openAIMockModule.default.mockClear();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.clearAllMocks();
  });

  it('usa response_format json_object e valida resposta estética', async () => {
    openAIMockModule.createMock.mockResolvedValue({
      choices: [
        {
          message: { content: JSON.stringify(validPayload) },
        },
      ],
    });

    const result = await runAestheticDecisionAI({
      structuredData: { porosidade: 1 },
    });

    expect(openAIMockModule.createMock).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: { type: 'json_object' } }),
    );
    expect(result.scoreIntegridade).toBe(72); // arredondado/clamp
    expect(result.indicesRisco.quebra).toBe('elevado');
    expect(
      result.protocoloPersonalizado.alisamento.neutralizacao.obrigatoria,
    ).toBe(true);
  });

  it('lança erro quando índice de risco é inválido', async () => {
    openAIMockModule.createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              indicesRisco: {
                ...validPayload.indicesRisco,
                termico: 'desconhecido',
              },
            }),
          },
        },
      ],
    });

    await expect(
      runAestheticDecisionAI({ structuredData: { porosidade: 1 } }),
    ).rejects.toThrow('indice termico inválido');
  });
});
