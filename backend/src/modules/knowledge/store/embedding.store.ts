export interface StoredEmbedding {
  salonId: string;
  groupId?: string;
  content: string;
  domain: 'tricologia' | 'capilar';
  language: 'pt' | 'en';
  embedding: number[];
}

export class EmbeddingStore {
  private static data: StoredEmbedding[] = [];

  static add(item: StoredEmbedding) {
    this.data.push(item);
  }

  static reset() {
    this.data = [];
  }

  static removeByGroupId(salonId: string, groupId: string) {
    this.data = this.data.filter(
      (d) => !(d.salonId === salonId && d.groupId === groupId),
    );
  }

  static all(salonId: string, domain: 'tricologia' | 'capilar') {
    return this.data.filter(
      (d) => d.salonId === salonId && d.domain === domain,
    );
  }
}
