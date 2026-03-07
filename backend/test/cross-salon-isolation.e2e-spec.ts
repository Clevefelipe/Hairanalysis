/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  ForbiddenException,
  Get,
  INestApplication,
  Req,
  UseGuards,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SalonGuard } from '../src/common/guards/salon.guard';

class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { salonId: 'salon-A' } as any;
    return true;
  }
}

@Controller('tenant-probe')
@UseGuards(MockJwtGuard, SalonGuard)
class TenantProbeController {
  @Get(':salonId')
  byParam(@Req() req: any) {
    if (req.user?.salonId !== req.params?.salonId) {
      throw new ForbiddenException('Acesso negado: salao incompativel');
    }
    return { ok: true, salonId: req.params.salonId };
  }
}

describe('cross-salon-isolation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantProbeController],
      providers: [SalonGuard, MockJwtGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows access when salonId matches authenticated salon', async () => {
    await request(app.getHttpServer())
      .get('/tenant-probe/salon-A')
      .expect(200)
      .expect({ ok: true, salonId: 'salon-A' });
  });

  it('blocks cross-salon access when salonId is different', async () => {
    await request(app.getHttpServer()).get('/tenant-probe/salon-B').expect(403);
  });
});
