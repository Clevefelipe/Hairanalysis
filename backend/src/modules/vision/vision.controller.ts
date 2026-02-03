import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VisionService } from "./vision.service";

@Controller("vision")
@UseGuards(JwtAuthGuard)
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post("process")
  async process(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const salonId = (req as any).user.salonId;
    const clientId = body.clientId ?? null;

    return this.visionService.process(body, salonId, clientId);
  }
}
