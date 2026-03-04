import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { File as MulterFile } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SalonService } from './salon.service';
import { UpdateSalonBrandingDto } from './dto/update-salon-branding.dto';
import { ApplyBrandingPresetDto } from './dto/apply-branding-preset.dto';

@Controller('salon')
export class SalonController {
  constructor(private readonly salonService: SalonService) {}

  @Get('branding/presets')
  @UseGuards(JwtAuthGuard)
  getBrandingPresets() {
    return this.salonService.getBrandingPresets();
  }

  @Get('me/branding')
  @UseGuards(JwtAuthGuard)
  async getMyBranding(@Req() req: any) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }
    return this.salonService.getBrandingBySalonId(salonId);
  }

  @Patch('me/branding')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateMyBranding(
    @Req() req: any,
    @Body() body: UpdateSalonBrandingDto,
  ) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }
    return this.salonService.updateBrandingBySalonId(salonId, body);
  }

  @Post('me/branding/preset')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async applyPreset(@Req() req: any, @Body() body: ApplyBrandingPresetDto) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }
    return this.salonService.applyBrandingPresetBySalonId(
      salonId,
      body?.presetId,
    );
  }

  @Post('me/branding/logo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Logo deve ser PNG, JPG ou WEBP (m\u00e1ximo 2MB)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@Req() req: any, @UploadedFile() file: MulterFile) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo de logo \u00e9 obrigat\u00f3rio');
    }
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.salonService.updateLogoBySalonId(salonId, dataUrl);
  }

  @Delete('me/branding/logo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removeLogo(@Req() req: any) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }
    return this.salonService.clearLogoBySalonId(salonId);
  }
}
