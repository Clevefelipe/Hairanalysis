import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { HistoryEntity } from "./history.entity";

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly historyRepo: Repository<HistoryEntity>,
    private readonly jwtService: JwtService
  ) {}

  /**
   * ⚠️ MÉTODO JÁ EXISTENTE
   * Usado pelo VisionService
   * NÃO REMOVER
   */
  async save(data: Partial<HistoryEntity>) {
    const entity = this.historyRepo.create(data);
    return this.historyRepo.save(entity);
  }

  /**
   * ✅ Dashboard agregado por salão
   */
  async getDashboard(salonId: string) {
    const total = await this.historyRepo.count({ where: { salonId } });

    const capilar = await this.historyRepo.count({
      where: { salonId, domain: "capilar" },
    });

    const tricologia = await this.historyRepo.count({
      where: { salonId, domain: "tricologia" },
    });

    const latest = await this.findLatest(salonId, 5);

    return {
      total,
      capilar,
      tricologia,
      latest: latest.map((item) => ({
        id: item.id,
        domain: item.domain,
        createdAt: item.createdAt,
      })),
    };
  }

  /**
   * ✅ Últimas análises por salão
   */
  async findLatest(salonId: string, limit = 5) {
    return this.historyRepo.find({
      where: { salonId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async createShareToken(historyId: string, salonId: string) {
    return this.jwtService.sign(
      { historyId, salonId, scope: "history_share" },
      { expiresIn: "30d" }
    );
  }

  async getPublicReport(token: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado.");
    }

    if (payload?.scope !== "history_share") {
      throw new UnauthorizedException("Token inválido.");
    }

    const history = await this.historyRepo.findOne({
      where: { id: payload.historyId, salonId: payload.salonId },
    });

    if (!history) {
      throw new NotFoundException("Relatório não encontrado.");
    }

    return {
      valid: true,
      report: {
        id: history.id,
        domain: history.domain,
        createdAt: history.createdAt,
        baseResult: history.baseResult,
        ragResult: history.ragResult,
      },
      disclaimer:
        "Observação estética assistida por IA. A decisão final é sempre do profissional.",
    };
  }
}
