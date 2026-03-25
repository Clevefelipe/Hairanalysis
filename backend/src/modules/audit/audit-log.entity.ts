import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  salonId?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @CreateDateColumn()
  createdAt: Date;
}
