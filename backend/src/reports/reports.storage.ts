import { Provider } from '@nestjs/common';

export const REPORTS_STORAGE_PROVIDER = 'REPORTS_STORAGE_PROVIDER';

export interface StorageProvider {
  save: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  getSignedUrl: (key: string) => Promise<string>;
}

class InMemoryStorage implements StorageProvider {
  private store = new Map<string, Buffer>();

  async save(key: string, buffer: Buffer, _contentType: string) {
    this.store.set(key, buffer);
  }

  async getSignedUrl(key: string) {
    return `memory://${key}`;
  }
}

export const ReportsStorageProvider: Provider = {
  provide: REPORTS_STORAGE_PROVIDER,
  useFactory: () => new InMemoryStorage(),
};
