import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Salon } from "../salon/salon.entity";

export type UserRole = "ADMIN" | "PROFESSIONAL";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column()
  password: string;

  // ✅ TIPO EXPLÍCITO PARA POSTGRES
  @Column({
    type: "varchar",
    nullable: true,
  })
  refreshToken: string | null;

  @Column({
    type: "varchar",
    default: "PROFESSIONAL",
  })
  role: UserRole;

  @ManyToOne(() => Salon, (salon) => salon.users)
  @JoinColumn({ name: "salonId" })
  salon: Salon;

  @Column({ type: 'uuid', nullable: true, name: 'salonId' })
  salonId?: string;
}

export { User as UserEntity };
