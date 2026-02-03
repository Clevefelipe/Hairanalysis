import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { HistoryEntity } from "./history.entity";
import { Salon } from "../salon/salon.entity";

@Injectable()
export class HistoryPdfService {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly historyRepository: Repository<HistoryEntity>,

    @InjectRepository(Salon)
    private readonly salonRepository: Repository<Salon>,
  ) {}

  async generatePdf(
    historyId: string,
    salonId: string,
    domain: "capilar" | "tricologia",
  ): Promise<Uint8Array> {
    const history = await this.historyRepository.findOne({
      where: { id: historyId, salonId },
    });

    if (!history) {
      throw new NotFoundException("Histórico não encontrado");
    }

    const salon = await this.salonRepository.findOne({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException("Salão não encontrado");
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    /* ===== CORES ===== */
    const primary = rgb(0.15, 0.25, 0.35);
    const lightGray = rgb(0.95, 0.95, 0.95);
    const textGray = rgb(0.35, 0.35, 0.35);

    /* ===== CABEÇALHO ===== */
    page.drawRectangle({
      x: 0,
      y: 760,
      width: 595,
      height: 82,
      color: lightGray,
    });

    page.drawText(salon.name, {
      x: 50,
      y: 810,
      size: 20,
      font: boldFont,
      color: primary,
    });

    page.drawText("Laudo Técnico Profissional", {
      x: 50,
      y: 785,
      size: 11,
      font,
      color: textGray,
    });

    page.drawText(
      domain === "tricologia"
        ? "Análise Tricológica"
        : "Análise Capilar",
      {
        x: 50,
        y: 768,
        size: 10,
        font,
        color: textGray,
      },
    );

    let y = 700;

    const section = (title: string) => {
      page.drawText(title, {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: primary,
      });

      y -= 10;

      page.drawLine({
        start: { x: 50, y },
        end: { x: 545, y },
        thickness: 1,
        color: primary,
      });

      y -= 20;
    };

    const text = (value: string, size = 11) => {
      page.drawText(value, {
        x: 50,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      y -= size + 6;
    };

    /* ===== METADADOS ===== */
    text(
      `Data da análise: ${new Date(
        history.createdAt,
      ).toLocaleString()}`,
      10,
    );

    y -= 20;

    /* ===== INTERPRETAÇÃO ===== */
    section("Interpretação Técnica");

    history.baseResult?.analysis
      ?.split("\n")
      .forEach((line: string) => {
        text(line);
      });

    /* ===== ALERTAS ===== */
    if (history.baseResult?.alerts?.length) {
      y -= 10;
      section("Pontos de Atenção");

      history.baseResult.alerts.forEach(
        (alert: string) => {
          text(`• ${alert}`);
        },
      );
    }

    /* ===== RODAPÉ ===== */
    page.drawLine({
      start: { x: 50, y: 70 },
      end: { x: 545, y: 70 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(
      "Documento profissional gerado automaticamente • Hair Analysis System",
      {
        x: 50,
        y: 50,
        size: 9,
        font,
        color: textGray,
      },
    );

    return pdfDoc.save();
  }
}
