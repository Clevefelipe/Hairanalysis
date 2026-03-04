import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAnalysisService } from './services/ai-analysis.service';
import type { AestheticDecisionInput } from './types/ai.types';

interface AuthenticatedRequest {
  user?: {
    salonId?: string;
  };
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AestheticDecisionController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('aesthetic-decision')
  async analyze(
    @Body() body: AestheticDecisionInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const isPlainObject =
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.getPrototypeOf(body) === Object.prototype;
    const hasKnownField = Boolean(
      body?.structuredData ||
      body?.imageSignals ||
      body?.evolutionHistory ||
      body?.sicInput,
    );
    const hasPayload = isPlainObject && hasKnownField;

    if (!hasPayload) {
      throw new BadRequestException('payload inválido');
    }

    const result = await this.aiAnalysisService.analyzeAestheticDecision(
      body,
      req?.user?.salonId,
    );

    return result;
  }
}
