import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportClinicalReportPdf(
  elementId: string,
  fileName = "relatorio-clinico.pdf"
) {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error("Relatorio clinico nao encontrado");
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
