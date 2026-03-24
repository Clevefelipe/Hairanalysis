import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard de isolamento por salão (tenant)
 *
 * Regras:
 * - O request DEVE conter o salonId
 * - O usuário autenticado DEVE pertencer ao mesmo salonId
 */
@Injectable()
export class SalonGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { salonId?: string };
      params?: Record<string, unknown>;
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
    }>();

    const userSalonId =
      typeof request.user?.salonId === 'string'
        ? request.user.salonId
        : undefined;
    const salonIdFromRequest = [
      request.params?.salonId,
      request.body?.salonId,
      request.query?.salonId,
    ].find(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );

    if (!userSalonId) {
      throw new ForbiddenException('Usuário não autenticado ou sem salão');
    }

    if (!salonIdFromRequest) {
      throw new ForbiddenException('SalonId não informado na requisição');
    }

    if (userSalonId !== salonIdFromRequest) {
      throw new ForbiddenException('Acesso negado: salão incompatível');
    }

    return true;
  }
}
