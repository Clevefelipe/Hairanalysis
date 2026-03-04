import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("analysis_history")
export class HistoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  professionalId: string;

  // 🔐 MULTI-TENANT REAL
  @Column({ nullable: true })
  salonId: string;

  @Column({ default: 'capilar' })
  domain: "capilar" | "tricologia";

  @Column("jsonb", { nullable: true, default: {} })
  baseResult: any;

  @Column("jsonb", { nullable: true, default: {} })
  ragResult: any;

  @Column("jsonb", { nullable: true })
  visionResult?: any;

  @Column("jsonb", { nullable: true })
  aiExplanation?: any;

  @Column("jsonb", { nullable: true })
  recommendations?: any;

  @Column({ nullable: true })
  modelVersion?: string;

  @Column({ nullable: true })
  weightProfileVersion?: string;

  @Column({ nullable: true })
  promptVersion?: string;

  @Column({ type: 'float', nullable: true })
  temperature?: number;

  @Column('jsonb', { nullable: true })
  rawIAOutput?: any;

  @Column({ type: 'float', nullable: true })
  scoreCalculado?: number;

  @Column({ type: 'float', nullable: true })
  confidenceScore?: number;

  @Column({ nullable: true })
  previousAnalysisId?: string;

  @Column({ nullable: true, unique: true })
  publicToken?: string;

  @CreateDateColumn()
  createdAt: Date;
}
