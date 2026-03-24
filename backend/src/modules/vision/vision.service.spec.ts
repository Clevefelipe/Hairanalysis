import { BadRequestException } from '@nestjs/common';
import { VisionService } from './vision.service';

describe('VisionService.computeRisk', () => {
  const makeService = () => new VisionService({} as any);

  it('deve retornar risco médio por dados insuficientes', () => {
    const service = makeService();
    const result = (service as any).computeRisk(undefined);
    expect(result).toEqual({ level: 'medium', reasons: ['dados_insuficientes'] });
  });

  it('eleva risco para alto quando couro tem lesão ou eritema', () => {
    const service = makeService();
    const result = (service as any).computeRisk({ scalp: { lesoes: true } });
    expect(result.level).toBe('high');
    expect(result.reasons).toContain('couro_sensivel_ou_lesao');
  });

  it('eleva risco para alto quando ação é agressiva sem teste de mecha', () => {
    const service = makeService();
    const result = (service as any).computeRisk({
      chemistry: { acaoAgressiva: true, testMechaFeito: false },
    });
    expect(result.level).toBe('high');
    expect(result.reasons).toContain('sem_teste_de_mecha_para_acao_agressiva');
  });

  it('sobe para médio quando há química recente', () => {
    const service = makeService();
    const result = (service as any).computeRisk({
      chemistry: { diasDesdeUltimaQuimica: 10 },
    });
    expect(result.level).toBe('medium');
    expect(result.reasons).toContain('quimica_recente');
  });

  it('retorna baixo quando nenhum fator de risco está presente', () => {
    const service = makeService();
    const result = (service as any).computeRisk({
      scalp: { tipoCouro: 'normal' },
      fiber: { porosidade: 'baixa' },
      chemistry: { sistemaAtual: 'nenhum' },
    });
    expect(result.level).toBe('low');
    expect(result.reasons.length).toBe(0);
  });
});

describe('VisionService', () => {
  it('must fail when score is manually altered against deterministic score', async () => {
    const historyService = {
      save: jest.fn(async (payload) => payload),
    };

    const service = new VisionService(historyService as any);

    await expect(
      service.process('salon-1', 'professional-1', 'client-1', {
        score: 88,
        deterministicResult: { score: 72, confidence: 90 },
        recommendations: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('must persist deterministic score and legal audit payload', async () => {
    const historyService = {
      save: jest.fn(async (payload) => payload),
    };

    const service = new VisionService(historyService as any);

    await service.process('salon-1', 'professional-1', 'client-1', {
      deterministicResult: {
        score: 74,
        confidence: 82,
        aptitude: 'APTO_COM_CAUTELA',
        aptitudeMessage: 'ok',
        weightProfileVersion: 'v1.2.0',
        weightProfileId: 'CHEMICALLY_TREATED',
      },
      legalAudit: { modelVersion: 'gpt-4o-mini' },
      recommendations: {},
      visionResult: {},
    });

    expect(historyService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        salonId: 'salon-1',
        professionalId: 'professional-1',
        recommendations: expect.objectContaining({
          score: 74,
          confidenceScore: 82,
          weightProfileVersion: 'v1.2.0',
        }),
        visionResult: expect.objectContaining({
          score: 74,
          legalAudit: { modelVersion: 'gpt-4o-mini' },
        }),
      }),
    );
  });
});
