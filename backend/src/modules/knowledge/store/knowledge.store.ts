export interface KnowledgeEntry {
  id: string;
  content: string;
  domain: 'tricologia' | 'capilar';
  language: 'pt' | 'en';
}

export class KnowledgeStore {
  private static data: KnowledgeEntry[] = [];

  static add(entry: KnowledgeEntry) {
    this.data.push(entry);
  }

  static all() {
    return this.data;
  }

  static findByDomain(domain: 'tricologia' | 'capilar') {
    return this.data.filter((e) => e.domain === domain);
  }
}
