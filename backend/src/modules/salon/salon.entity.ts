import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('salons')
export class Salon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  brandPrimaryColor?: string;

  @Column({ nullable: true })
  brandSecondaryColor?: string;

  @Column({ nullable: true })
  brandAccentColor?: string;

  @Column({ nullable: true })
  brandFontFamily?: string;

  @Column({ type: 'jsonb', nullable: true })
  branding?: Record<string, unknown>;

  @CreateDateColumn({ nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  @OneToMany(() => User, user => user.salon)
  users: User[];
}

export { Salon as SalonEntity };
