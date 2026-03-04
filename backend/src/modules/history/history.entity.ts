import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('analysis_history')
export class HistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  salonId: string;

  @Column()
  professionalId: string;

  @Column('jsonb')
  visionResult: any;

  @Column('jsonb', { nullable: true })
  aiExplanation: any;

  @Column('jsonb', { nullable: true })
  recommendations: any;

  @Column({ nullable: true })
  publicToken: string;

  @CreateDateColumn()
  createdAt: Date;
}
