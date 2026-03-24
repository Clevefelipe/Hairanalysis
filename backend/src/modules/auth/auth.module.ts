import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignOptions } from 'jsonwebtoken';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './admin.guard';

import { UserEntity } from './user.entity';
import { SalonEntity } from '../salon/salon.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule,

    PassportModule,

    TypeOrmModule.forFeature([UserEntity, SalonEntity]),

    AuditModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET não configurado');
        }

        const accessExpiresIn = (config.get<string | number>(
          'JWT_ACCESS_EXPIRES_IN',
        ) ?? '15m') as SignOptions['expiresIn'];

        return {
          secret,
          signOptions: {
            expiresIn: accessExpiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminGuard],
  exports: [AuthService],
})
export class AuthModule {}
