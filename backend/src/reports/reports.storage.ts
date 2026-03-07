/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Provider } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export const REPORTS_STORAGE_PROVIDER = 'REPORTS_STORAGE_PROVIDER';

export interface StorageProvider {
  save: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  getSignedUrl: (key: string) => Promise<string>;
  getPath: (key: string) => Promise<string>;
}

function normalizeStorageKey(key: string): string {
  const normalized = String(key || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim();

  if (!normalized || normalized.includes('..')) {
    throw new Error('Storage key inválida para relatórios.');
  }
  return normalized;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.baseDir = path.resolve(
      process.env.REPORTS_LOCAL_DIR || 'storage/reports',
    );
    this.publicBaseUrl =
      process.env.PUBLIC_REPORT_BASE_URL?.trim() || '/storage/reports';
  }

  async getPath(key: string) {
    const safeKey = normalizeStorageKey(key);
    return path.resolve(this.baseDir, safeKey);
  }

  async save(key: string, buffer: Buffer, _contentType: string) {
    const targetPath = await this.getPath(key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, buffer);
  }

  async getSignedUrl(key: string) {
    const safeKey = normalizeStorageKey(key);
    const encodedSegments = safeKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${encodedSegments}`;
  }
}

export class S3StorageProvider implements StorageProvider {
  private readonly bucket = process.env.REPORTS_S3_BUCKET || '';
  private readonly region = process.env.REPORTS_S3_REGION || '';
  private readonly accessKeyId = process.env.REPORTS_S3_ACCESS_KEY_ID || '';
  private readonly secretAccessKey =
    process.env.REPORTS_S3_SECRET_ACCESS_KEY || '';

  private assertConfig() {
    if (
      !this.bucket ||
      !this.region ||
      !this.accessKeyId ||
      !this.secretAccessKey
    ) {
      throw new Error(
        'Configuração S3 incompleta para relatórios (bucket/region/credentials).',
      );
    }
  }

  async getPath(key: string) {
    const safeKey = normalizeStorageKey(key);
    return `s3://${this.bucket}/${safeKey}`;
  }

  async save(key: string, buffer: Buffer, contentType: string) {
    this.assertConfig();
    const safeKey = normalizeStorageKey(key);

    const [{ S3Client, PutObjectCommand }] = await Promise.all([
      import('@aws-sdk/client-s3'),
    ]);

    const client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  async getSignedUrl(key: string) {
    this.assertConfig();
    const safeKey = normalizeStorageKey(key);

    const [{ S3Client, GetObjectCommand }, { getSignedUrl }] =
      await Promise.all([
        import('@aws-sdk/client-s3'),
        import('@aws-sdk/s3-request-presigner'),
      ]);

    const client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: safeKey,
      }),
      { expiresIn: 60 * 10 },
    );
  }
}

export const ReportsStorageProvider: Provider = {
  provide: REPORTS_STORAGE_PROVIDER,
  useFactory: () => {
    const provider = process.env.REPORTS_STORAGE_PROVIDER?.toLowerCase();
    if (provider === 's3') return new S3StorageProvider();
    return new LocalStorageProvider();
  },
};
