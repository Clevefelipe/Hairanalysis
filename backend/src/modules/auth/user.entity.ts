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

  @Column()
  password: string;

  @Column({ nullable: true })
  fullName?: string;

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

  @Column({ nullable: true })
  salonId?: string;

  @ManyToOne(() => Salon, (salon) => salon.users)
  @JoinColumn({ name: "salon_id" })
  salon: Salon;
}

export const UserEntity = User;
export type UserEntity = User;


