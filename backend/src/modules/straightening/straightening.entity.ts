import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('straightenings')
export class StraighteningEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  salonId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  criteria?: string;

  /* =====================================================
   * STATUS
   * ===================================================== */

  @Column({ default: true })
  active: boolean;

  /* =====================================================
   * CRITÉRIOS TÉCNICOS (IA)
   * ===================================================== */

  /**
   * 🔹 Tolerância a dano químico (0–1)
   */
  @Column({ type: 'float', default: 0 })
  maxDamageTolerance: number;

  /**
   * 🔹 Suporte à porosidade (0–1)
   */
  @Column({ type: 'float', default: 0 })
  porositySupport: number;

  /**
   * 🔹 Compatibilidade com elasticidade (0–1)
   */
  @Column({ type: 'float', default: 0 })
  elasticitySupport: number;

  /* =====================================================
   * METADADOS
   * ===================================================== */

  @CreateDateColumn()
  createdAt: Date;
}
