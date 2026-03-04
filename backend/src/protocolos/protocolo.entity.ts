import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('protocolos')
export class Protocolo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'simple-array', nullable: true })
  indicacoes: string[];

  @Column()
  clienteId: string;

  @Column({ nullable: true })
  analiseId: string;

  @Column({ default: false })
  sugeridoIA: boolean;
}
