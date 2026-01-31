// frontend/src/utils/exportClinicalReportPdf.ts
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface ClinicalReportPdfInput {
  reportId: string;
  clientName: string;
  createdAt: string;
  summary: {
    hairHealthScore: number;
    scalpHealthScore?: number;
    alerts: string[];
  };
  professional?: {
    name: string;
    document?: string | null;
  };
  signature?: {
    signedAt: string;
    qrCodeUrl: string;
    signatureHash: string;
  };
}

/**
 * PDF COMERCIAL — CLIENTE FINAL
 * Branding: Hair Analysis System
 */
export async function exportClinicalReportPdf(
  data: ClinicalReportPdfInput
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const sectionTitle = (title: string) => {
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text(title, 20, y);
    y += 6;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;
  };

  const labelValue = (label: string, value: string) => {
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(label, 20, y);
    doc.setTextColor(17, 24, 39);
    doc.text(value, 90, y);
    y += 7;
  };

  /* ===== CABEÇALHO ===== */
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text("Hair Analysis System", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text(
    "Relatório Personalizado de Saúde Capilar",
    20,
    y
  );
  y += 6;

  doc.setDrawColor(209, 213, 219);
  doc.line(20, y, pageWidth - 20, y);
  y += 14;

  /* ===== DADOS DO CLIENTE ===== */
  sectionTitle("Seus Dados");

  labelValue("Nome", data.clientName);
  labelValue(
    "Data da avaliação",
    new Date(data.createdAt).toLocaleDateString()
  );

  y += 4;

  /* ===== RESULTADO ===== */
  sectionTitle("Resultado da Avaliação");

  labelValue(
    "Saúde do seu cabelo",
    `${data.summary.hairHealthScore}/100`
  );

  if (data.summary.scalpHealthScore !== undefined) {
    labelValue(
      "Saúde do seu couro cabeludo",
      `${data.summary.scalpHealthScore}/100`
    );
  }

  /* ===== PONTOS DE ATENÇÃO ===== */
  if (data.summary.alerts.length > 0) {
    y += 6;
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text("Pontos de Atenção", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    data.summary.alerts.forEach((alert) => {
      doc.text(`• ${alert}`, 22, y);
      y += 6;
    });
  }

  /* ===== ORIENTAÇÃO PROFISSIONAL ===== */
  y += 8;
  sectionTitle("Orientação Profissional");

  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text(
    "Este relatório foi preparado para ajudar você a entender melhor a saúde do seu cabelo e couro cabeludo. "
      + "Com base nesta avaliação, um plano de cuidados personalizado pode ser indicado pelo profissional.",
    20,
    y,
    { maxWidth: pageWidth - 40 }
  );
  y += 20;

  /* ===== ASSINATURA ===== */
  if (data.signature && data.professional) {
    sectionTitle("Profissional Responsável");

    labelValue("Nome", data.professional.name);

    const qrCodeDataUrl = await QRCode.toDataURL(
      data.signature.qrCodeUrl,
      { margin: 1, width: 120 }
    );

    doc.addImage(
      qrCodeDataUrl,
      "PNG",
      pageWidth - 60,
      y - 24,
      40,
      40
    );
  }

  /* ===== RODAPÉ ===== */
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Relatório informativo • Não substitui avaliação médica • Hair Analysis System",
    20,
    285
  );

  doc.save(
    `relatorio-capilar-${data.clientName
      .replace(/\s+/g, "-")
      .toLowerCase()}.pdf`
  );
}

/* ===================================================================================== */
/* FUNÇÃO DE CAPTURA (html2canvas) — NÃO ALTERADA */
/* ===================================================================================== */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportClinicalReportPdf(
  elementId: string,
  fileName = "relatorio-clinico.pdf"
) {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error("Relatório clínico não encontrado");
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  } else {
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
      position -= pageHeight;

      if (remainingHeight > 0) {
        pdf.addPage();
      }
    }
  }

  pdf.save(fileName);
}
