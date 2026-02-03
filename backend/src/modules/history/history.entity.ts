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

  // 🔐 MULTI-TENANT REAL
  @Column({ nullable: true })
  salonId: string;

  @Column()
  domain: "capilar" | "tricologia";

  @Column("jsonb")
  baseResult: any;

  @Column("jsonb")
  ragResult: any;

  @CreateDateColumn()
  createdAt: Date;
}
