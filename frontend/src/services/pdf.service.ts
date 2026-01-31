import jsPDF from "jspdf";

interface PdfData {
  clientName: string;
  professionalName: string;
  diagnosis: string;
  recommendation: string;
  createdAt: string;
}

export function generateClinicalPdf(data: PdfData) {
  const doc = new jsPDF();

  /* ===== CABEÇALHO — HAIR ANALYSIS SYSTEM ===== */
  doc.setFontSize(18);
  doc.text("Hair Analysis System", 20, 20);

  doc.setFontSize(11);
  doc.text("Relatório Profissional de Diagnóstico Capilar", 20, 28);

  doc.setDrawColor(180);
  doc.line(20, 32, 190, 32);

  /* ===== DADOS PRINCIPAIS ===== */
  doc.setFontSize(11);
  doc.text(`Cliente: ${data.clientName}`, 20, 45);
  doc.text(`Profissional: ${data.professionalName}`, 20, 53);
  doc.text(`Data da Análise: ${data.createdAt}`, 20, 61);

  doc.line(20, 66, 190, 66);

  /* ===== DIAGNÓSTICO ===== */
  doc.setFontSize(14);
  doc.text("Diagnóstico Capilar", 20, 80);

  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(data.diagnosis, 170), 20, 90);

  /* ===== RECOMENDAÇÕES ===== */
  const recommendationStartY =
    90 + doc.splitTextToSize(data.diagnosis, 170).length * 6 + 10;

  doc.setFontSize(14);
  doc.text("Recomendações Profissionais", 20, recommendationStartY);

  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(data.recommendation, 170),
    20,
    recommendationStartY + 10
  );

  /* ===== RODAPÉ ===== */
  doc.setDrawColor(200);
  doc.line(20, 270, 190, 270);

  doc.setFontSize(9);
  doc.text(
    "Relatório profissional para uso exclusivo em salão • Hair Analysis System",
    20,
    277
  );

  doc.save(`relatorio_clinico_${data.clientName}.pdf`);
}
