import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_analysis')
export class AIAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  salonId: string;

  @Index()
  @Column()
  clientId: string;

  @Index()
  @Column()
  sessionId: string;

  @Column({ default: 'hair-analysis-system' })
  system: string;

  @Column()
  promptVersion: string;

  @Column({ default: 'openai' })
  provider: string;

  @Column({ default: 'gpt-4.1-mini' })
  model: string;

  @Column({ type: 'jsonb' })
  inputSnapshot: any;

  @Column({ type: 'jsonb' })
  aiResponse: any;

  @CreateDateColumn()
  createdAt: Date;
}
