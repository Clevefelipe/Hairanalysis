import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./user.entity";
import { SalonEntity } from "../salon/salon.entity";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SalonEntity)
    private readonly salonRepository: Repository<SalonEntity>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  private async resolveSalonIdForUser(user: User): Promise<string> {
    const fromRelation = user?.salon?.id;
    const fromColumn = user?.salonId;
    const current = fromRelation || fromColumn;
    if (current) return current;

    // Backward compatibility: legacy users may exist without tenant binding.
    const preferredSalonId = String(process.env.DEFAULT_SALON_ID || "").trim();
    const fallbackSalon = preferredSalonId
      ? await this.salonRepository.findOne({ where: { id: preferredSalonId } })
      : (
          await this.salonRepository.find({
            order: { name: "ASC" },
            take: 1,
          })
        )[0];

    if (!fallbackSalon?.id) {
      throw new UnauthorizedException("Usuário sem salão vinculado.");
    }

    user.salonId = fallbackSalon.id;
    await this.userRepository.save(user);
    return fallbackSalon.id;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["salon"],
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const isHashed =
      user.password.startsWith("$2a$") ||
      user.password.startsWith("$2b$") ||
      user.password.startsWith("$2y$");

    let passwordValid = false;

    if (isHashed) {
      passwordValid = await bcrypt.compare(password, user.password);
    }

    if (!passwordValid && user.password === password) {
      user.password = await bcrypt.hash(password, this.SALT_ROUNDS);
      await this.userRepository.save(user);
      passwordValid = true;
    }

    if (!passwordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const salonId = await this.resolveSalonIdForUser(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    await this.auditService.log({
      action: "LOGIN_SUCCESS",
      userId: user.id,
      salonId,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { refreshToken },
      relations: ["salon"],
    });

    if (!user) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    const salonId = await this.resolveSalonIdForUser(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
