import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('salons')
export class Salon {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @OneToMany(() => User, user => user.salon)
  users: User[];
}
