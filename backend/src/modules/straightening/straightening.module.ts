import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StraighteningEntity } from "./straightening.entity";
import { StraighteningService } from "./straightening.service";
import { StraighteningController } from "./straightening.controller";

@Module({
  imports: [TypeOrmModule.forFeature([StraighteningEntity])],
  controllers: [StraighteningController],
  providers: [StraighteningService],
  exports: [StraighteningService],
})
export class StraighteningModule {}
