import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { HistoryController } from '../src/modules/history/history.controller';
import { HistoryPublicController } from '../src/modules/history/history.public.controller';
import { HistoryService } from '../src/modules/history/history.service';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { UserEntity } from '../src/modules/auth/user.entity';
import { Cliente } from '../src/clientes/entities/cliente.entity';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';
import { ReportsWorker } from '../src/reports/reports.worker';
import { ClientesService } from '../src/clientes/clientes.service';
import { SalonEntity } from '../src/modules/salon/salon.entity';

describe('History + Reports (e2e)', () => {
  let app: INestApplication<App>;

  type AuthenticatedRequest = {
    headers?: { authorization?: string };
    user?: { salonId?: string };
  };

  type ExecutionContextLike = {
    switchToHttp: () => {
      getRequest: () => AuthenticatedRequest;
    };
  };

  type PublicHistoryPayload = {
    valid: boolean;
    token: string;
    report: { id: string };
  };

  type HistoryByIdPayload = {
    id: string;
    salonId: string;
    clientId: string;
    professionalId: string;
    createdAt: Date;
    visionResult: Record<string, unknown>;
    aiExplanation: Record<string, unknown>;
    recommendations: Record<string, unknown>;
  };

  const historyServiceMock = {
    findByPublicToken: jest.fn<Promise<PublicHistoryPayload>, [string]>(
      (token: string) =>
        Promise.resolve({
          valid: true,
          token,
          report: { id: 'analysis-1' },
        }),
    ),
    findById: jest.fn<Promise<HistoryByIdPayload>, [string]>((id: string) =>
      Promise.resolve({
        id,
        salonId: 'salon-1',
        clientId: 'client-1',
        professionalId: 'pro-1',
        createdAt: new Date('2026-01-10T10:00:00.000Z'),
        visionResult: {},
        aiExplanation: {},
        recommendations: {},
      }),
    ),
  };

  const generatedReportId = '44444444-4444-4444-8444-444444444444';

  const reportsServiceMock = {
    enqueue: jest.fn<Promise<{ id: string; status: string }>, [string]>(() =>
      Promise.resolve({ id: generatedReportId, status: 'queued' }),
    ),
    generateAndStore: jest.fn<
      Promise<void>,
      [string, unknown, (payload: unknown) => Buffer]
    >(() => Promise.resolve(undefined)),
    getStatus: jest.fn<
      Promise<
        | { status: string; analysisId?: string }
        | { id: string; status: string; analysisId: string }
        | null
      >,
      [string]
    >(() => Promise.resolve({ status: 'ready', analysisId: 'analysis-xyz' })),
    getDownloadUrl: jest.fn<Promise<string | undefined>, [string]>(() =>
      Promise.resolve(undefined),
    ),
  };

  const reportsWorkerMock = {
    renderPdf: jest.fn<Promise<Buffer>, [unknown]>(() =>
      Promise.resolve(Buffer.from('pdf-data')),
    ),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn((context: ExecutionContextLike) => {
      const req = context.switchToHttp().getRequest();
      const authHeader = String(req.headers?.authorization || '');

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException();
      }

      const token = authHeader.slice('Bearer '.length).trim();
      if (!token) {
        throw new UnauthorizedException();
      }

      if (token === 'valid-token') {
        req.user = { salonId: 'salon-1' };
        return true;
      }

      if (token === 'token-sem-salao') {
        req.user = {};
        return true;
      }

      if (token === 'token-outro-salao') {
        req.user = { salonId: 'salon-2' };
        return true;
      }

      throw new UnauthorizedException();
    }),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [
        HistoryPublicController,
        HistoryController,
        ReportsController,
      ],
      providers: [
        { provide: HistoryService, useValue: historyServiceMock },
        { provide: ReportsService, useValue: reportsServiceMock },
        { provide: ReportsWorker, useValue: reportsWorkerMock },
        { provide: ClientesService, useValue: { findOne: jest.fn() } },
        {
          provide: 'PROM_METRIC_REPORTS_CREATED_TOTAL',
          useValue: { inc: jest.fn() },
        },
        {
          provide: getRepositoryToken(SalonEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: { findOne: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock);

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('GET /history/public/:token returns public history payload', async () => {
    await request(app.getHttpServer())
      .get('/history/public/token-abc')
      .expect(200)
      .expect((res: { body?: { valid?: boolean; token?: string } }) => {
        expect(res.body?.valid).toBe(true);
        expect(res.body?.token).toBe('token-abc');
      });

    expect(historyServiceMock.findByPublicToken).toHaveBeenCalledWith(
      'token-abc',
    );
  });

  it('GET /reports/:id/status returns report status', async () => {
    const id = '11111111-1111-4111-8111-111111111111';

    await request(app.getHttpServer())
      .get(`/reports/${id}/status`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect({ status: 'ready', analysisId: 'analysis-xyz' });

    expect(reportsServiceMock.getStatus).toHaveBeenCalledWith(id);
  });

  it('GET /reports/:id/download returns not_ready when url is unavailable', async () => {
    const id = '22222222-2222-4222-8222-222222222222';

    await request(app.getHttpServer())
      .get(`/reports/${id}/download`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect({ status: 'not_ready' });

    expect(reportsServiceMock.getDownloadUrl).toHaveBeenCalledWith(id);
  });

  it('GET /reports/:id/download returns URL when report is ready', async () => {
    const id = '33333333-3333-4333-8333-333333333333';
    reportsServiceMock.getStatus.mockResolvedValueOnce({
      id,
      status: 'ready',
      analysisId: 'analysis-xyz',
    });
    reportsServiceMock.getDownloadUrl.mockResolvedValueOnce(
      'https://example.com/report.pdf',
    );

    await request(app.getHttpServer())
      .get(`/reports/${id}/download`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect({ url: 'https://example.com/report.pdf' });
  });

  it('GET /history/public/:token returns 404 for invalid token', async () => {
    historyServiceMock.findByPublicToken.mockRejectedValueOnce(
      new NotFoundException('Link público inválido'),
    );

    await request(app.getHttpServer())
      .get('/history/public/token-invalido')
      .expect(404);
  });

  it('GET /reports/:id/status returns not_found when report does not exist', async () => {
    const id = '55555555-5555-4555-8555-555555555555';
    reportsServiceMock.getStatus.mockResolvedValueOnce(null);

    await request(app.getHttpServer())
      .get(`/reports/${id}/status`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect({ status: 'not_found' });
  });

  it('GET /reports/:id/status returns 400 for invalid UUID', async () => {
    await request(app.getHttpServer())
      .get('/reports/abc/status')
      .set('Authorization', 'Bearer valid-token')
      .expect(400);
  });

  it('GET /reports/:id/download returns 400 for invalid UUID', async () => {
    await request(app.getHttpServer())
      .get('/reports/abc/download')
      .set('Authorization', 'Bearer valid-token')
      .expect(400);
  });

  it('POST /reports creates report and allows status/download polling flow', async () => {
    reportsServiceMock.getStatus.mockResolvedValueOnce({
      id: generatedReportId,
      status: 'queued',
      analysisId: 'analysis-xyz',
    });
    reportsServiceMock.getDownloadUrl.mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', 'Bearer valid-token')
      .send({ analysisId: 'analysis-xyz' })
      .expect(201)
      .expect({ id: generatedReportId, status: 'queued' });

    await request(app.getHttpServer())
      .get(`/reports/${generatedReportId}/status`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect({
        id: generatedReportId,
        status: 'queued',
        analysisId: 'analysis-xyz',
      });

    await request(app.getHttpServer())
      .get(`/reports/${generatedReportId}/download`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect({ status: 'not_ready' });

    expect(historyServiceMock.findById).toHaveBeenCalledWith('analysis-xyz');
    expect(reportsServiceMock.enqueue).toHaveBeenCalledWith('analysis-xyz');
    expect(reportsServiceMock.generateAndStore).toHaveBeenCalled();
  });

  it('GET /history/:id returns 401 when Authorization header is missing', async () => {
    const id = '66666666-6666-4666-8666-666666666666';

    await request(app.getHttpServer()).get(`/history/${id}`).expect(401);
  });

  it('GET /history/:id returns 401 when token is malformed', async () => {
    const id = '77777777-7777-4777-8777-777777777777';

    await request(app.getHttpServer())
      .get(`/history/${id}`)
      .set('Authorization', 'Bearer')
      .expect(401);
  });

  it('GET /history/alerts returns 403 when token has no salon context', async () => {
    await request(app.getHttpServer())
      .get('/history/alerts')
      .set('Authorization', 'Bearer token-sem-salao')
      .expect(403);
  });

  it('GET /history/:id returns 403 when authenticated user belongs to another salon', async () => {
    const id = '88888888-8888-4888-8888-888888888888';

    await request(app.getHttpServer())
      .get(`/history/${id}`)
      .set('Authorization', 'Bearer token-outro-salao')
      .expect(403);
  });
});
