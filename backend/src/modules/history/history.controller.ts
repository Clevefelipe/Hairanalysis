import {
  Controller,
  Get,
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
    return this.historyService.dashboard(salonId);
  }
}
