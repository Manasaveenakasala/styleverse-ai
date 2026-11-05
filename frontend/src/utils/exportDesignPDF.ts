
import { jsPDF } from "jspdf";
import type { SavedDesign } from "../services/api";

export function exportDesignPDF(design: SavedDesign): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Convert hex color to RGB
  const hex = design.color.replace("#", "");
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  // Header
  pdf.setFillColor(165, 61, 120);
  pdf.rect(0, 0, pageWidth, 42, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.text("StyleVerse AI", margin, 22);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("Fashion Design Sheet", margin, 31);

  // Design title
  pdf.setTextColor(45, 35, 45);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(`${design.garment} #${design.id}`, margin, 58);

  // Color preview
  pdf.setFillColor(red, green, blue);
  pdf.roundedRect(margin, 68, 55, 55, 5, 5, "F");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Selected Color", margin, 132);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(45, 35, 45);
  pdf.text(design.color.toUpperCase(), margin, 139);

  // Design details
  const detailsX = 90;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Design Details", detailsX, 73);

  pdf.setFontSize(10);

  const details = [
    ["Garment", design.garment],
    ["Fabric", design.fabric],
    ["Color", design.color.toUpperCase()],
    ["Favorite", design.is_favorite === 1 ? "Yes" : "No"],
    ["Created", design.created_at],
  ];

  let detailY = 84;

  details.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, detailsX, detailY);

    pdf.setFont("helvetica", "normal");

    const lines = pdf.splitTextToSize(
      value,
      pageWidth - detailsX - 40
    ) as string[];

    pdf.text(lines, detailsX, detailY + 5);
    detailY += 10 + (lines.length - 1) * 5;
  });

  // Description section
  const descriptionY = Math.max(155, detailY + 10);

  pdf.setDrawColor(220, 205, 215);
  pdf.line(margin, descriptionY - 10, pageWidth - margin, descriptionY - 10);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Design Description", margin, descriptionY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const descriptionLines = pdf.splitTextToSize(
    design.description,
    contentWidth
  ) as string[];

  let textY = descriptionY + 10;
  const pageHeight = pdf.internal.pageSize.getHeight();

  descriptionLines.forEach((line) => {
    if (textY > pageHeight - 25) {
      pdf.addPage();
      textY = 25;
    }

    pdf.text(line, margin, textY);
    textY += 6;
  });

  // Footer on every page
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(230, 220, 225);
    pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Created with StyleVerse AI", margin, pageHeight - 11);
    pdf.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 11,
      { align: "right" }
    );
  }

  // Download PDF
  pdf.save(
    `styleverse-${design.garment.toLowerCase()}-${design.id}.pdf`
  );
}
