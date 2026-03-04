import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { CreateStraighteningDTO } from "./straightening.service";
import { StraighteningService } from "./straightening.service";

@Controller("straightenings")
@UseGuards(JwtAuthGuard)
export class StraighteningController {
  constructor(private readonly service: StraighteningService) {}

  @Get()
  async list(@Req() req: any) {
    const salonId = req.user.salonId;
    return this.service.list(salonId);
  }

  @Post()
  async create(@Req() req: any, @Body() body: CreateStraighteningDTO) {
    const salonId = req.user.salonId;
    return this.service.create(salonId, body);
  }
}
