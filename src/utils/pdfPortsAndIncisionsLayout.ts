import jsPDF from "jspdf";

interface DrawRectalStylePortsAndIncisionsOptions {
  pdf: jsPDF;
  x: number;
  y: number;
  pageHeight: number;
  diagramCanvas?: string | null;
  fallbackLabel: string;
}

export const drawRectalStylePortsAndIncisions = ({
  pdf,
  x,
  y,
  pageHeight,
  diagramCanvas,
  fallbackLabel,
}: DrawRectalStylePortsAndIncisionsOptions) => {
  let portsY = y;

  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("Legend:", x, portsY);
  portsY += 3.5;

  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "normal");

  const legendCol1X = x;
  const legendCol2X = x + 40;

  const legendRow1Y = portsY;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.6);
  pdf.line(legendCol1X, legendRow1Y, legendCol1X + 8, legendRow1Y);
  pdf.setFontSize(4.8);
  pdf.text("12mm", legendCol1X + 1.5, legendRow1Y - 0.8);
  pdf.setFontSize(6.5);
  pdf.text("Ports (with size)", legendCol1X + 10, legendRow1Y + 1);

  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(1.3);
  pdf.setLineDash([1.5, 1]);
  pdf.circle(legendCol2X + 3.5, legendRow1Y, 2, "S");
  pdf.setLineDash([]);
  pdf.setDrawColor(0, 0, 0);
  pdf.text("Ileostomy", legendCol2X + 7.5, legendRow1Y + 1);

  portsY += 3.5;

  const legendRow2Y = portsY;

  pdf.setDrawColor(139, 0, 0);
  pdf.setLineWidth(1.4);
  pdf.setLineDash([2.5, 1.8]);
  pdf.line(legendCol1X, legendRow2Y, legendCol1X + 8, legendRow2Y);
  pdf.setLineDash([]);
  pdf.setDrawColor(0, 0, 0);
  pdf.text("Incisions", legendCol1X + 10, legendRow2Y + 1);

  pdf.setDrawColor(22, 163, 74);
  pdf.setLineWidth(1.6);
  pdf.circle(legendCol2X + 3.5, legendRow2Y, 2, "S");
  pdf.setDrawColor(0, 0, 0);
  pdf.text("Colostomy", legendCol2X + 7.5, legendRow2Y + 1);

  portsY += 4.5;

  const diagramWidth = 80;
  const maxDiagramBottom = pageHeight - 32;
  const diagramHeight = Math.max(48, Math.min(60, maxDiagramBottom - portsY));

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.rect(x, portsY, diagramWidth, diagramHeight);

  if (diagramCanvas) {
    const imgProperties = pdf.getImageProperties(diagramCanvas);
    const aspectRatio = imgProperties.width / imgProperties.height;

    let finalWidth = diagramWidth - 4;
    let finalHeight = (diagramWidth - 4) / aspectRatio;

    if (finalHeight > diagramHeight - 4) {
      finalHeight = diagramHeight - 4;
      finalWidth = (diagramHeight - 4) * aspectRatio;
    }

    const centerX = x + (diagramWidth - finalWidth) / 2;
    const centerY = portsY + (diagramHeight - finalHeight) / 2;

    pdf.addImage(diagramCanvas, "PNG", centerX, centerY, finalWidth, finalHeight);
  } else {
    pdf.setFontSize(8);
    pdf.text(fallbackLabel, x + diagramWidth / 2, portsY + diagramHeight / 2, { align: "center" });
  }

  return {
    diagramBottomY: portsY + diagramHeight,
    diagramHeight,
    diagramWidth,
  };
};
