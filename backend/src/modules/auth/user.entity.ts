import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalonEntity } from '../salon/salon.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  fullName?: string;

  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', default: 'PROFESSIONAL' })
  role: 'ADMIN' | 'PROFESSIONAL';

  @Column({ type: 'uuid', nullable: true })
  salonId?: string;

  @ManyToOne(() => SalonEntity, { nullable: true })
  @JoinColumn({ name: 'salonId' })
  salon?: SalonEntity;
}

export { UserEntity as User };
