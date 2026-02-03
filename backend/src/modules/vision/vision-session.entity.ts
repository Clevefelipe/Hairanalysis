import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("vision_sessions")
export class VisionSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  clientId: string;

  @Index()
  @Column()
  salonId: string;

  @Column({
    type: "varchar",
    length: 20,
  })
  type: "tricologica" | "capilar";

  @Column({
    type: "varchar",
    length: 20,
    default: "started",
  })
  status: "started" | "finished";

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn({ nullable: true })
  finishedAt: Date | null;
}
