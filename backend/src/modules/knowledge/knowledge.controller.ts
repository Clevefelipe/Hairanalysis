import {
  Controller,
  Post,
  Get,
  Body,
  Query,
} from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { IngestTextDto } from "./dto/ingest-text.dto";

@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Post("ingest-text")
  async ingest(@Body() dto: IngestTextDto) {
    return this.service.ingestText(dto);
  }

  @Get("search")
  async search(
    @Query("q") q: string,
    @Query("domain") domain: "tricologia" | "capilar",
  ) {
    return this.service.semanticSearch(q, domain);
  }
}
