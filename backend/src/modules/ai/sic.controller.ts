import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAnalysisService } from './services/ai-analysis.service';
import type { SicInput } from './types/ai.types';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class SicController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('sic')
  calculate(@Body() body: SicInput) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('payload inválido');
    }

    const requiredKeys: Array<keyof SicInput> = [
      'porosidade',
      'elasticidade',
      'resistencia',
      'historico_quimico',
      'dano_termico',
      'dano_mecanico',
      'instabilidade_pos_quimica',
      'quimicas_incompativeis',
    ];

    for (const key of requiredKeys) {
      if (body[key] === undefined || body[key] === null) {
        throw new BadRequestException(`campo obrigatório ausente: ${key}`);
      }
      if (key === 'quimicas_incompativeis') {
        if (!Number.isFinite(body[key] as any)) {
          throw new BadRequestException(`campo ${key} deve ser numérico`);
        }
      } else if (!Number.isFinite(body[key] as any)) {
        throw new BadRequestException(`campo ${key} deve ser numérico`);
      }
    }

    return this.aiAnalysisService.calculateSic(body);
  }
}
