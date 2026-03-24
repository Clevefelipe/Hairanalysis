import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('knowledge_documents')
export class KnowledgeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  salonId: string;

  @Column({ type: 'uuid', nullable: true })
  groupId?: string;

  @Column({ type: 'int', nullable: true })
  chunkIndex?: number;

  @Column({ nullable: false })
  domain: 'tricologia' | 'capilar';

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: false })
  sourceType: string;

  @CreateDateColumn()
  createdAt: Date;
}
