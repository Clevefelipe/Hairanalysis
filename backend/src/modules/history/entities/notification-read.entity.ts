import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/user.entity';
import { SalonEntity } from '../../salon/salon.entity';

@Entity('history_notifications_read')
@Index(['notificationId', 'userId'], { unique: true })
export class NotificationReadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  notificationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  salonId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user?: UserEntity;

  @ManyToOne(() => SalonEntity, { onDelete: 'CASCADE' })
  salon?: SalonEntity;
}

export { NotificationReadEntity as NotificationRead };
