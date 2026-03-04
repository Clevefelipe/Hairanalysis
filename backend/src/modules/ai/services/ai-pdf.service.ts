import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class AiPdfService {
  generateFromAIResult(aiResult: unknown): Buffer {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (b: Buffer) => buffers.push(b));
    doc.on('end', () => {});

    doc.fontSize(20).text('Hair Analysis System', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text('Relatório Técnico Assistido por IA');
    doc.moveDown(1);

    const printable =
      typeof aiResult === 'string'
        ? aiResult
        : JSON.stringify(aiResult, null, 2);

    doc.fontSize(10).text(printable);

    doc.end();

    return Buffer.concat(buffers);
  }
}
