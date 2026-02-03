import { Controller, Get, Param } from "@nestjs/common";
import { HistoryService } from "./history.service";

@Controller("history")
export class HistoryPublicController {
  constructor(private readonly historyService: HistoryService) {}

  @Get("public/:token")
  async getPublic(@Param("token") token: string) {
    return this.historyService.getPublicReport(token);
  }
}
