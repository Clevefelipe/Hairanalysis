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

  @Column()
  domain: "capilar" | "tricologia";

  @Column("jsonb")
  baseResult: any;

  @Column("jsonb")
  ragResult: any;

  @Column("jsonb", { nullable: true })
  visionResult?: any;

  @Column("jsonb", { nullable: true })
  aiExplanation?: any;

  @Column("jsonb", { nullable: true })
  recommendations?: any;

  @Column({ nullable: true })
  publicToken?: string;

  @CreateDateColumn()
  createdAt: Date;
}
