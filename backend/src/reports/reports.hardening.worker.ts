/* eslint-disable @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/no-require-imports */
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import type { ReportPayload } from './report.types';

@Injectable()
export class ReportsHardeningWorker {
  private readonly logger = new Logger(ReportsHardeningWorker.name);
  private readonly maxPayloadBytes = 2 * 1024 * 1024;
  private readonly maxListItems = 200;

  async renderPdf(payload: ReportPayload): Promise<Buffer> {
    this.assertPayloadLimits(payload);

    const doc = new PDFDocument({ size: 'A4', margin: 36, compress: true });
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => {
        this.logger.error(`Erro ao renderizar PDF hardened: ${err}`);
        reject(err);
      });

      doc.fontSize(16).text('Relatorio Tecnico H.A.S.');
      doc.moveDown(0.4);
      doc
        .fontSize(10)
        .text(
          'Decisao estetica assistida por IA. A validacao final e do profissional responsavel.',
        );

      this.writeBlock(doc, 'Cliente', payload?.cliente?.nome);
      this.writeBlock(doc, 'Profissional', payload?.profissional);
      this.writeBlock(doc, 'Aptidao', payload?.aptidao?.status);
      this.writeBlock(doc, 'Justificativa', payload?.aptidao?.justificativa);
      this.writeList(doc, 'Alertas', payload?.alertas);
      this.writeList(doc, 'Cuidados Pre/Pos', payload?.cuidadosPrePos);

      doc.end();
    });
  }

  private assertPayloadLimits(payload: ReportPayload) {
    const bytes = Buffer.byteLength(JSON.stringify(payload || {}), 'utf8');
    if (bytes > this.maxPayloadBytes) {
      throw new Error(
        `Payload do relatorio excede limite de memoria seguro (${bytes} bytes).`,
      );
    }
  }

  private writeBlock(doc: PDFKit.PDFDocument, title: string, value: unknown) {
    const text = String(value ?? '').trim();
    if (!text) return;
    doc.moveDown(0.3);
    doc.fontSize(12).text(title);
    doc.fontSize(10).text(text);
  }

  private writeList(
    doc: PDFKit.PDFDocument,
    title: string,
    value: unknown,
  ): void {
    if (!Array.isArray(value) || value.length === 0) return;
    doc.moveDown(0.3);
    doc.fontSize(12).text(title);
    value.slice(0, this.maxListItems).forEach((item) => {
      const line = String(item ?? '').trim();
      if (line) {
        doc.fontSize(10).text(`- ${line}`);
      }
    });
  }
}
