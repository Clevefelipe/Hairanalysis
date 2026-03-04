import { BadRequestException } from '@nestjs/common';
import { VisionService } from './vision.service';

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
        weightProfileVersion: 'v1.0.0',
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
          weightProfileVersion: 'v1.0.0',
        }),
        visionResult: expect.objectContaining({
          score: 74,
          legalAudit: { modelVersion: 'gpt-4o-mini' },
        }),
      }),
    );
  });
});
