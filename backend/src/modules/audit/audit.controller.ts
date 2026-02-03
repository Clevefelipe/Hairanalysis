import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuditService } from "./audit.service";

@Controller("audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query("action") action?: string,
    @Query("userId") userId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const user = (req as any).user;

    if (user.role !== "ADMIN") {
      throw new ForbiddenException(
        "Acesso restrito a administradores",
      );
    }

    return this.auditService.findAll({
      salonId: user.salonId,
      action,
      userId,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
