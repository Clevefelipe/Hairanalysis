import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  telefone: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  cpf?: string;

  @Column({ nullable: true, length: 30, unique: true })
  codigo?: string;

  @Column({ type: 'date', nullable: true })
  dataNascimento?: string;

  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
