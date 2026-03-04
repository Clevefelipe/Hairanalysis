import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Param,
  Query,
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

  @Get()
  async list(
    @Req() req: any,
    @Query("clientId") clientId?: string,
    @Query("domain") domain?: "capilar" | "tricologia"
  ) {
    const salonId = req.user.salonId;
    const rows = await this.historyService.listBySalon(salonId, {
      clientId,
      domain,
    });

    return rows.map((item) => ({
      id: item.id,
      clientId: item.clientId,
      createdAt: item.createdAt,
      domain: item.domain,
      analysisType: item.domain === "tricologia" ? "tricologica" : "capilar",
      score:
        Number(item?.scoreCalculado) ||
        Number(item?.baseResult?.score) ||
        Number(item?.ragResult?.score) ||
        0,
      interpretation:
        item?.recommendations?.justificativa ||
        item?.aiExplanation?.texto ||
        item?.ragResult?.interpretation ||
        item?.baseResult?.interpretation ||
        "",
      flags: Array.isArray(item?.baseResult?.flags)
        ? item.baseResult.flags
        : Array.isArray(item?.ragResult?.flags)
          ? item.ragResult.flags
          : [],
      signals:
        item?.baseResult?.signals ||
        item?.ragResult?.signals ||
        item?.visionResult?.signals ||
        {},
    }));
  }

  @Get(":id")
  async byId(@Req() req: any, @Param("id") id: string) {
    const salonId = req.user.salonId;
    const item = await this.historyService.findById(id);

    if (item.salonId !== salonId) {
      throw new ForbiddenException("Acesso negado");
    }

    return {
      id: item.id,
      clientId: item.clientId,
      createdAt: item.createdAt,
      domain: item.domain,
      analysisType: item.domain === "tricologia" ? "tricologica" : "capilar",
      score:
        Number(item?.scoreCalculado) ||
        Number(item?.baseResult?.score) ||
        Number(item?.ragResult?.score) ||
        0,
      interpretation:
        item?.recommendations?.justificativa ||
        item?.aiExplanation?.texto ||
        item?.ragResult?.interpretation ||
        item?.baseResult?.interpretation ||
        "",
      flags: Array.isArray(item?.baseResult?.flags)
        ? item.baseResult.flags
        : Array.isArray(item?.ragResult?.flags)
          ? item.ragResult.flags
          : [],
      signals:
        item?.baseResult?.signals ||
        item?.ragResult?.signals ||
        item?.visionResult?.signals ||
        {},
    };
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
