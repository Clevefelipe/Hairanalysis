import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { SalonEntity } from '../salon/salon.entity';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SalonEntity)
    private readonly salonRepository: Repository<SalonEntity>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly config: ConfigService,
  ) {}

  private getRefreshSecret() {
    const secret =
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET não configurado');
    }
    return secret;
  }

  private getRefreshExpiresIn(): SignOptions['expiresIn'] {
    return (this.config.get<string | number>('JWT_REFRESH_EXPIRES_IN') ||
      '7d') as SignOptions['expiresIn'];
  }

  private getSaltRounds() {
    const raw = this.config.get<string>('BCRYPT_SALT_ROUNDS') || '12';
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
  }

  async login(email: LoginDto['email'], password: LoginDto['password']) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['salon'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      salonId: user.salon?.id || user.salonId,
      role: user.role,
      name: user.name,
    };

    await this.auditService.log({
      action: 'LOGIN',
      userId: user.id,
      salonId: user.salon?.id || user.salonId,
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: this.getRefreshExpiresIn(),
        secret: this.getRefreshSecret(),
      }),
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('refresh_token é obrigatório');
    }

    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        relations: ['salon'],
      });

      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        salonId: user.salon?.id || user.salonId,
        role: user.role,
        name: user.name,
      };

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign(payload, {
          expiresIn: this.getRefreshExpiresIn(),
          secret: this.getRefreshSecret(),
        }),
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async listProfessionals(salonId: string) {
    if (!salonId) {
      throw new BadRequestException('salonId é obrigatório');
    }

    return this.userRepository.find({
      where: {
        role: 'PROFESSIONAL',
        salon: { id: salonId } as any,
      },
      relations: ['salon'],
      order: { email: 'ASC' },
      select: {
        id: true,
        email: true,
        fullName: true,
        name: true,
        role: true,
        salonId: true,
      } as any,
    });
  }

  async createProfessional(salonId: string, body: CreateProfessionalDto) {
    if (!salonId) {
      throw new BadRequestException('salonId é obrigatório');
    }

    if (!body?.email || !body?.password) {
      throw new BadRequestException('email e password são obrigatórios');
    }

    const existing = await this.userRepository.findOne({
      where: { email: body.email },
    });
    if (existing) {
      throw new BadRequestException('email já cadastrado');
    }

    const salon = await this.salonRepository.findOne({
      where: { id: salonId },
    });
    if (!salon) {
      throw new NotFoundException('Salão não encontrado');
    }

    const hashed = await bcrypt.hash(body.password, this.getSaltRounds());
    const created = this.userRepository.create({
      email: body.email,
      password: hashed,
      fullName: body.fullName,
      name: body.fullName,
      role: 'PROFESSIONAL',
      salon,
      salonId,
    });

    const saved = await this.userRepository.save(created);

    await this.auditService.log({
      action: 'CREATE_PROFESSIONAL',
      userId: saved.id,
      salonId,
      metadata: { email: saved.email },
    });

    return {
      id: saved.id,
      email: saved.email,
      fullName: saved.fullName,
      name: saved.name,
      role: saved.role,
    };
  }

  async updateProfessional(
    salonId: string,
    professionalId: string,
    body: UpdateProfessionalDto,
  ) {
    if (!salonId || !professionalId) {
      throw new BadRequestException(
        'salonId e professionalId são obrigatórios',
      );
    }

    const professional = await this.userRepository.findOne({
      where: { id: professionalId, salonId, role: 'PROFESSIONAL' as any },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    if (body.email && body.email !== professional.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: body.email },
      });
      if (existingEmail && existingEmail.id !== professionalId) {
        throw new BadRequestException('email já cadastrado');
      }
      professional.email = body.email;
    }

    if (body.fullName) {
      professional.fullName = body.fullName;
      professional.name = body.fullName;
    }

    if (body.password) {
      professional.password = await bcrypt.hash(
        body.password,
        this.getSaltRounds(),
      );
    }

    const saved = await this.userRepository.save(professional);

    await this.auditService.log({
      action: 'UPDATE_PROFESSIONAL',
      userId: saved.id,
      salonId,
      metadata: { email: saved.email },
    });

    return {
      id: saved.id,
      email: saved.email,
      fullName: saved.fullName,
      name: saved.name,
      role: saved.role,
    };
  }

  async deleteProfessional(salonId: string, professionalId: string) {
    if (!salonId || !professionalId) {
      throw new BadRequestException(
        'salonId e professionalId são obrigatórios',
      );
    }

    const professional = await this.userRepository.findOne({
      where: { id: professionalId, salonId, role: 'PROFESSIONAL' as any },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    await this.userRepository.delete(professional.id);

    await this.auditService.log({
      action: 'DELETE_PROFESSIONAL',
      userId: professional.id,
      salonId,
      metadata: { email: professional.email },
    });

    return { success: true };
  }
}
