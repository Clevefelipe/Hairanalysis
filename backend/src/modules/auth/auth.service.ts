import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./user.entity";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId: user.salon.id,
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
      salonId: user.salon.id,
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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId: user.salon.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
