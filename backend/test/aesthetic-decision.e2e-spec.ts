import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import type { Request } from 'express';
import { AestheticDecisionController } from '../src/modules/ai/aesthetic-decision.controller';
import { AiAnalysisService } from '../src/modules/ai/services/ai-analysis.service';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { AestheticDecisionResponse } from '../src/modules/ai/types/ai.types';

type AuthRequest = Request & { user?: { salonId?: string } };

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    req.user = { salonId: 'salon-123' };
    return true;
  }
}

describe('AestheticDecisionController (e2e)', () => {
  let app: INestApplication;
  const mockResponse: AestheticDecisionResponse = {
    resumoTecnico: 'Fibra com leve dano, couro equilibrado.',
    scoreIntegridade: 78,
    indicesRisco: {
      termico: 'moderado',
      quimico: 'baixo',
      quebra: 'baixo',
      elasticidade: 'moderado',
      sensibilidade: 'baixo',
    },
    classificacaoAptidao: 'apto',
    alisamentoSelecionado: {
      nome: 'Ácido Orgânico Seguro',
      justificativa: 'Compatível com histórico e baixa porosidade.',
    },
    protocoloPersonalizado: {
      preQuimica: ['Reconstrução leve - 1x'],
      alisamento: {
        produto: 'Ácido Orgânico Seguro',
        tempoEstimado: '35 minutos',
        neutralizacao: {
          obrigatoria: true,
          produto: 'Acidificante',
          tempo: '5 minutos',
          justificativa: 'Processo alcalino detectado, estabilizar pH.',
        },
      },
      posQuimica: ['Selagem térmica suave'],
      cronograma4Semanas: [
        'S1 - Reconstrução',
        'S2 - Hidratação',
        'S3 - Nutrição',
        'S4 - Manutenção',
      ],
    },
    alertasTecnicos: ['Controlar temperatura de prancha'],
    confiancaAnalise: 90,
  };

  const analyzeAestheticDecision = jest.fn().mockResolvedValue(mockResponse);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AestheticDecisionController],
      providers: [
        { provide: AiAnalysisService, useValue: { analyzeAestheticDecision } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  const getHttpServer = () =>
    app.getHttpServer() as unknown as import('http').Server;

  it('deve retornar análise estética com catálogo do salão', async () => {
    await request(getHttpServer())
      .post('/ai/aesthetic-decision')
      .send({ structuredData: { porosidade: 'media' } })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          resumoTecnico: mockResponse.resumoTecnico,
          scoreIntegridade: mockResponse.scoreIntegridade,
          classificacaoAptidao: mockResponse.classificacaoAptidao,
        });
        expect(analyzeAestheticDecision).toHaveBeenCalledWith(
          { structuredData: { porosidade: 'media' } },
          'salon-123',
        );
      });
  });

  it('deve falhar com payload inválido', async () => {
    await request(getHttpServer())
      .post('/ai/aesthetic-decision')
      .send('invalid')
      .expect(400);
    expect(analyzeAestheticDecision).not.toHaveBeenCalled();
  });
});
