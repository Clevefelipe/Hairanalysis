import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
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

  @Column({ type: 'text', nullable: true })
  branding?: string;

  @Column({ type: 'datetime', nullable: true })
  createdAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  updatedAt?: Date;
}
