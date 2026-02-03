export interface StoredEmbedding {
  content: string;
  domain: "tricologia" | "capilar";
  language: "pt" | "en";
  embedding: number[];
}

export class EmbeddingStore {
  private static data: StoredEmbedding[] = [];

  static add(item: StoredEmbedding) {
    this.data.push(item);
  }

  static all(domain: "tricologia" | "capilar") {
    return this.data.filter(d => d.domain === domain);
  }
}
