import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

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
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const salonIdFromRequest =
      request.params?.salonId ||
      request.body?.salonId ||
      request.query?.salonId;

    if (!user || !user.salonId) {
      throw new ForbiddenException(
        "Usuário não autenticado ou sem salão"
      );
    }

    if (!salonIdFromRequest) {
      throw new ForbiddenException(
        "SalonId não informado na requisição"
      );
    }

    if (user.salonId !== salonIdFromRequest) {
      throw new ForbiddenException(
        "Acesso negado: salão incompatível"
      );
    }

    return true;
  }
}
