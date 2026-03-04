import { Module, forwardRef } from "@nestjs/common";
import { VisionController } from "./vision.controller";
import { VisionService } from "./vision.service";
import { VisionRagService } from "./vision-rag.service";
import { HistoryModule } from "../history/history.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { StraighteningModule } from "../straightening/straightening.module";
import { AiModule } from "../ai/ai.module";
import { AnalysisEngineModule } from "../analysis-engine/analysis-engine.module";
import { ObservabilityModule } from "../../observability/observability.module";

@Module({
  imports: [
    forwardRef(() => HistoryModule),
    KnowledgeModule, // 🔑 NECESSÁRIO para VisionRagService
    StraighteningModule,
    AiModule,
    AnalysisEngineModule,
    ObservabilityModule,
  ],
  controllers: [VisionController],
  providers: [VisionService, VisionRagService],
  exports: [VisionService, VisionRagService],
})
export class VisionModule {}
