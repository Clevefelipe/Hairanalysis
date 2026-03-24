import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('analysis_history')
export class AnalysisHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  analysisType: 'tricologica' | 'capilar';

  @Column('jsonb')
  signals: Record<string, string>;

  @Column('int')
  score: number;

  @Column('jsonb')
  flags: string[];

  @Column('text')
  interpretation: string;

  @CreateDateColumn()
  createdAt: Date;
}
