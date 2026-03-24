import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("straightening_options")
export class StraighteningEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  salonId: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: "jsonb", default: {} })
  criteria: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  maxDamageTolerance?: number;

  @Column({ type: 'float', nullable: true })
  porositySupport?: number;

  @Column({ type: 'float', nullable: true })
  elasticitySupport?: number;

  @CreateDateColumn()
  createdAt: Date;
}
