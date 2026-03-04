import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';

@Injectable()
export class UploadCleanerService {
  async removeFile(path: string) {
    try {
      await fs.unlink(path);
    } catch {
      // ignora erro de remoção
    }
  }
}
