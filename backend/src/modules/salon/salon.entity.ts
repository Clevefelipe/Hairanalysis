import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('salons')
export class Salon {
  @PrimaryColumn()
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
  branding?: Record<string, any>;

  @OneToMany(() => User, user => user.salon)
  users: User[];
}

export const SalonEntity = Salon;
export type SalonEntity = Salon;


