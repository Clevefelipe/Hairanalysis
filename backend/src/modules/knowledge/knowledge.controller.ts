import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Delete,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { IngestTextDto } from './dto/ingest-text.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  private assertDomain(domain: any) {
    if (domain !== 'tricologia' && domain !== 'capilar') {
      throw new BadRequestException('domain inválido');
    }
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listDocuments(
    @Req() req: any,
    @Query('domain') domain?: 'tricologia' | 'capilar',
  ) {
    const salonId = req.user.salonId;
    if (domain) this.assertDomain(domain);
    return this.service.listDocuments(salonId, domain);
  }

  @Get('documents/:groupId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getDocumentGroup(
    @Req() req: any,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    const salonId = req.user.salonId;
    return this.service.getDocumentGroup(salonId, groupId);
  }

  @Get('documents/:groupId/preview')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async previewDocumentGroup(
    @Req() req: any,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Query('maxChars') maxChars?: number,
  ) {
    const salonId = req.user.salonId;
    const parsedMax =
      typeof maxChars === 'string' || typeof maxChars === 'number'
        ? Number(maxChars)
        : undefined;
    return this.service.getDocumentGroupPreview(salonId, groupId, parsedMax);
  }

  @Delete('documents/:groupId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteDocumentGroup(
    @Req() req: any,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    const salonId = req.user.salonId;
    return this.service.deleteDocumentGroup(salonId, groupId);
  }

  @Post('ingest-text')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async ingest(@Body() dto: IngestTextDto, @Req() req: any) {
    const salonId = req.user.salonId;
    if (!dto || !String(dto.content || '').trim()) {
      throw new BadRequestException('content é obrigatório');
    }
    this.assertDomain(dto.domain);
    if (dto.language !== 'pt' && dto.language !== 'en') {
      throw new BadRequestException('language inválido');
    }
    return this.service.ingestText(dto, salonId);
  }

  @Post('ingest-file')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  async ingestFile(
    @UploadedFile() file: any,
    @Query('domain') domain: 'tricologia' | 'capilar',
    @Req() req: any,
    @Query('title') title?: string,
  ) {
    const salonId = req.user.salonId;
    this.assertDomain(domain);
    const safeTitle =
      typeof title === 'string' && title.trim() ? title.trim() : undefined;
    return this.service.ingestFile(file, domain, salonId, safeTitle);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async search(
    @Query('q') q: string,
    @Query('domain') domain: 'tricologia' | 'capilar',
    @Req() req: any,
    @Query('limit') limit?: number,
  ) {
    const salonId = req.user.salonId;
    if (!q || !String(q).trim()) {
      throw new BadRequestException('q é obrigatório');
    }
    this.assertDomain(domain);
    const parsedLimit =
      typeof limit === 'string' || typeof limit === 'number'
        ? Number(limit)
        : undefined;
    return this.service.semanticSearch(String(q), salonId, domain, parsedLimit);
  }

  @Post('reload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reload() {
    return this.service.reload();
  }
}
