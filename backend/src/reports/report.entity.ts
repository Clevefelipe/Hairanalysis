import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export type ReportStatus = 'pending' | 'ready' | 'failed';

@Entity('reports')
export class ReportEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  analysisId?: string;

  @Column({ default: 'pending' })
  status!: ReportStatus;

  @Column({ nullable: true })
  storageKey?: string;

  @Column({ nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  finishedAt?: Date;
}
