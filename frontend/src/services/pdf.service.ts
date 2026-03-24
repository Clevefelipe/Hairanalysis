import jsPDF from "jspdf";

interface PdfData {
  clientName: string;
  clientCode?: string;
  professionalName: string;
  diagnosis: string;
  recommendation: string;
  createdAt: string;
}

function formatClientCode(value?: string | null) {
  const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  if (!clean) return "—";
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
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
  doc.text(`Cód cliente: ${formatClientCode(data.clientCode)}`, 20, 53);
  doc.text(`Profissional: ${data.professionalName}`, 20, 61);
  doc.text(`Data da Análise: ${data.createdAt}`, 20, 69);

  doc.line(20, 74, 190, 74);

  /* ===== DIAGNÓSTICO ===== */
  doc.setFontSize(14);
  doc.text("Diagnóstico Capilar", 20, 88);

  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(data.diagnosis, 170), 20, 98);

  /* ===== RECOMENDAÇÕES ===== */
  const recommendationStartY =
    98 + doc.splitTextToSize(data.diagnosis, 170).length * 6 + 10;

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
