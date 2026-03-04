import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssistantService } from './services/assistant.service';

type AssistantChatBody = {
  question?: string;
  context?: Record<string, unknown>;
};

type AuthenticatedRequest = {
  user?: {
    role?: string;
    salonId?: string;
  };
};

@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  async chat(
    @Body() body: AssistantChatBody,
    @Req() req: AuthenticatedRequest,
  ) {
    const question = String(body?.question || '').trim();
    if (!question) {
      throw new BadRequestException('question é obrigatória');
    }

    const { answer, sources } = await this.assistantService.ask(question, {
      ...(body?.context || {}),
      userRole: req?.user?.role,
      salonId: req?.user?.salonId,
    });

    return {
      answer,
      sources,
    };
  }
}
