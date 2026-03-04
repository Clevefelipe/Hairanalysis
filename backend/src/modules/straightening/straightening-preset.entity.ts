import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('straightening_presets')
export class StraighteningPresetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  salonId: string;

  @Column({ type: 'jsonb', default: {} })
  weights: Record<string, number>;
}
