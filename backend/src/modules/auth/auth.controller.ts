import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 300 } })
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refresh_token);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('professionals/:salonId')
  listProfessionals(@Param('salonId') salonId: string, @Req() req: any) {
    if (req.user?.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado a outro salão');
    }
    return this.authService.listProfessionals(salonId);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('professionals/:salonId')
  createProfessional(
    @Param('salonId') salonId: string,
    @Body() body: CreateProfessionalDto,
    @Req() req: any,
  ) {
    if (req.user?.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado a outro salão');
    }
    return this.authService.createProfessional(salonId, body);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch('professionals/:salonId/:professionalId')
  updateProfessional(
    @Param('salonId') salonId: string,
    @Param('professionalId') professionalId: string,
    @Body() body: UpdateProfessionalDto,
    @Req() req: any,
  ) {
    if (req.user?.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado a outro salão');
    }
    return this.authService.updateProfessional(salonId, professionalId, body);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete('professionals/:salonId/:professionalId')
  deleteProfessional(
    @Param('salonId') salonId: string,
    @Param('professionalId') professionalId: string,
    @Req() req: any,
  ) {
    if (req.user?.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado a outro salão');
    }
    return this.authService.deleteProfessional(salonId, professionalId);
  }
}
