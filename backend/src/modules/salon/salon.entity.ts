import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('salons')
export class SalonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  brandPrimaryColor?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  brandSecondaryColor?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  brandAccentColor?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  brandFontFamily?: string;

  @Column({ type: 'jsonb', nullable: true })
  branding?: Record<string, any>;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt?: Date;
}
