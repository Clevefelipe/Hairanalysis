import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import type { Request } from 'express';
import { SicController } from '../src/modules/ai/sic.controller';
import { AiAnalysisService } from '../src/modules/ai/services/ai-analysis.service';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import type { SicInput, SicResult } from '../src/modules/ai/types/ai.types';

type AuthRequest = Request & { user?: { salonId?: string } };

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    req.user = { salonId: 'salon-123' };
    return true;
  }
}

describe('SIC Controller (e2e)', () => {
  let app: INestApplication;
  const baseInput: SicInput = {
    porosidade: 70,
    elasticidade: 80,
    resistencia: 90,
    historico_quimico: 60,
    dano_termico: 50,
    dano_mecanico: 50,
    instabilidade_pos_quimica: 70,
    quimicas_incompativeis: 1,
  };

  const mockResult: SicResult = {
    score_final: 69.5,
    classificacao: 'Comprometimento moderado',
    penalidade_aplicada: false,
  };

  const calculateSic = jest.fn().mockReturnValue(mockResult);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SicController],
      providers: [{ provide: AiAnalysisService, useValue: { calculateSic } }],
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

  it('deve calcular SIC com payload válido', async () => {
    await request(getHttpServer())
      .post('/ai/sic')
      .send(baseInput)
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual(mockResult);
        expect(calculateSic).toHaveBeenCalledWith(baseInput);
      });
  });

  it('deve falhar quando campo obrigatório está ausente', async () => {
    const { porosidade: _omitPorosidade, ...payloadSemPorosidade } = baseInput;
    void _omitPorosidade;

    await request(getHttpServer())
      .post('/ai/sic')
      .send(payloadSemPorosidade)
      .expect(400);
    expect(calculateSic).not.toHaveBeenCalled();
  });

  it('deve falhar quando valor não é numérico', async () => {
    await request(getHttpServer())
      .post('/ai/sic')
      .send({ ...baseInput, dano_mecanico: 'alto' })
      .expect(400);
    expect(calculateSic).not.toHaveBeenCalled();
  });
});
