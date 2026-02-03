import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('vision_tricologica_history')
export class VisionTricologicaHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  clientId: string;

  @Index()
  @Column()
  salonId: string;

  @Index()
  @Column()
  visionSessionId: string;

  @Column('float')
  tricologicaScore: number;

  @Column({
    type: 'varchar',
    length: 10,
  })
  riskLevel: 'low' | 'medium' | 'high';

  @CreateDateColumn()
  createdAt: Date;
}
