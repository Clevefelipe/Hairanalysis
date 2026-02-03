import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("knowledge_embeddings")
export class KnowledgeEmbedding {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "varchar" })
  domain: "tricologia" | "capilar";

  @Column({ type: "varchar" })
  language: "pt" | "en";

  // pgvector
  @Column({ type: "vector", length: 1536 })
  embedding: number[];
}
