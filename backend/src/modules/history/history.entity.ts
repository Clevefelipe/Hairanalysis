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

  @Column({ type: 'text', nullable: true })
  visionResult?: string;

  @Column({ type: 'text', nullable: true })
  aiExplanation?: string;

  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Column({ type: 'text', nullable: true })
  chemicalProfile?: string;

  @Column({ nullable: true })
  publicToken?: string;

  @CreateDateColumn()
  createdAt: Date;
}
