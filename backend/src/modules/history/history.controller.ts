import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { HistoryService } from "./history.service";

@Controller("history")
@UseGuards(AuthGuard("jwt"))
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService
  ) {}

  @Get("dashboard")
  async dashboard(@Req() req: any) {
    const salonId = req.user.salonId;
    return this.historyService.getDashboard(salonId);
  }

  @Post("share/:id")
  async share(@Req() req: any, @Param("id") id: string) {
    const salonId = req.user.salonId;
    const token = await this.historyService.createShareToken(id, salonId);
    return {
      token,
      url: `/history/public/${token}`,
    };
  }
}
