import { Provider } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export const REPORTS_STORAGE_PROVIDER = 'REPORTS_STORAGE_PROVIDER';

export interface StorageProvider {
  save: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  getSignedUrl: (key: string) => Promise<string>;
  getPath?: (key: string) => Promise<string>;
}

class InMemoryStorage implements StorageProvider {
  private store = new Map<string, Buffer>();

  async save(key: string, buffer: Buffer, _contentType: string) {
    this.store.set(key, buffer);
  }

  async getSignedUrl(key: string) {
    return `memory://${key}`;
  }

  async getPath(key: string) {
    return `memory://${key}`;
  }
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly basePath = './storage/reports') {}

  async save(key: string, buffer: Buffer, _contentType: string) {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async getSignedUrl(key: string) {
    return `file://${path.join(this.basePath, key)}`;
  }

  async getPath(key: string) {
    return path.join(this.basePath, key);
  }
}

export class S3StorageProvider implements StorageProvider {
  async save(key: string, _buffer: Buffer, _contentType: string) {
    // placeholder: implementar S3 real se necessário
    return Promise.resolve();
  }

  async getSignedUrl(key: string) {
    return `https://s3.amazonaws.com/your-bucket/${key}`;
  }

  async getPath(key: string) {
    return `s3://${key}`;
  }
}

export const ReportsStorageProvider: Provider = {
  provide: REPORTS_STORAGE_PROVIDER,
  useFactory: () => new InMemoryStorage(),
};
