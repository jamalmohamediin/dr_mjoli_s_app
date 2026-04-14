import jsPDF from "jspdf";
import { getFullASAText } from "@/utils/asaDescriptions";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { formatPatientGender, normalizePatientInfo } from "@/utils/patientSticker";
import { hasText, toArray } from "@/utils/templateDataHelpers";

export interface StructuredTemplatePdfEntry {
  label: string;
  value?: string | string[];
}

export interface StructuredTemplatePdfSection {
  title: string;
  entries: StructuredTemplatePdfEntry[];
}

interface StructuredTemplatePdfOptions {
  title: string;
  patientInfo?: any;
  sections: StructuredTemplatePdfSection[];
  diagram?: {
    title: string;
    imageData?: string | null;
    placement?: "end" | "inlineRight";
    sectionTitle?: string;
  };
  signature?: {
    text?: string;
    imageData?: string;
    dateTime?: string;
  };
}

const calculateSignatureDimensions = (
  imageDataUrl: string,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      const maxWidth = 45;
      const maxHeight = 15;
      const aspectRatio = this.naturalWidth / this.naturalHeight;
      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      resolve({ width, height });
    };
    img.onerror = () => resolve({ width: 45, height: 15 });
    img.src = imageDataUrl;
  });

export const generateStructuredTemplatePdf = async ({
  title,
  patientInfo,
  sections,
  diagram,
  signature,
}: StructuredTemplatePdfOptions) => {
  const pdf = new jsPDF("portrait", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const lineHeight = 4.5;
  const contentWidth = pageWidth - margin * 2;
  const columnWidth = 84;
  let y = margin;

  const info = normalizePatientInfo(patientInfo || {});
  const filteredSections = sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) =>
        Array.isArray(entry.value) ? entry.value.length > 0 : hasText(entry.value),
      ),
    }))
    .filter((section) => section.entries.length > 0);

  const ensureSpace = (height = 10, bottomPadding = 20) => {
    if (y + height > pageHeight - bottomPadding) {
      pdf.addPage();
      y = margin;
    }
  };

  const drawRule = () => {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const drawTwoColRow = (left: string, right: string) => {
    if (!left && !right) return;
    const leftLines = pdf.splitTextToSize(left, columnWidth);
    const rightLines = pdf.splitTextToSize(right, columnWidth);
    const lineCount = Math.max(leftLines.length, rightLines.length, 1);
    ensureSpace(lineCount * lineHeight + 1);

    for (let index = 0; index < lineCount; index += 1) {
      if (leftLines[index]) {
        pdf.text(leftLines[index], margin, y);
      }

      if (rightLines[index]) {
        pdf.text(rightLines[index], margin + 96, y);
      }

      y += lineHeight;
    }
  };

  const drawSingleRow = (value: string) => {
    if (!value) return;
    const lines = pdf.splitTextToSize(value, contentWidth);
    ensureSpace(lines.length * lineHeight + 1);
    lines.forEach((line: string) => {
      pdf.text(line, margin, y);
      y += lineHeight;
    });
  };

  const toEntryText = (entry: StructuredTemplatePdfEntry) =>
    `${entry.label}: ${Array.isArray(entry.value) ? toArray(entry.value).join(", ") : entry.value || ""}`;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Dr. Monde Mjoli", margin, y);
  pdf.text("St. Dominic's Medical Suites B", pageWidth - margin, y, { align: "right" });
  y += lineHeight;
  pdf.text("Specialist Surgeon", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text("56 St James Road, Southernwood", pageWidth - margin, y, { align: "right" });
  y += lineHeight;
  pdf.text("MBChB (UNITRA), MMed (UKZN), FCS(SA),", margin, y);
  pdf.text("East London, 5201", pageWidth - margin, y, { align: "right" });
  y += lineHeight;
  pdf.text("Cert Gastroenterology, Surg (SA)", margin, y);
  pdf.text("Tel: 043 743 7872", pageWidth - margin, y, { align: "right" });
  y += lineHeight;
  pdf.text("Practice No. 0560812", margin, y);
  pdf.text("Fax: 043 743 6653", pageWidth - margin, y, { align: "right" });
  y += lineHeight;
  pdf.text("Cell: 082 417 2630", margin, y);
  y += 6;
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(title, pageWidth / 2, y, { align: "center" });
  y += 8;
  drawRule();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Patient Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const gender = formatPatientGender(info);
  const asaText = hasText(info.asaScore) ? getFullASAText(info.asaScore) : "";

  drawTwoColRow(`Patient Name: ${info.name || ""}`, `Patient ID: ${info.patientId || ""}`);
  drawTwoColRow(
    `Date of Birth: ${formatDateDDMMYYYYWithDashes(info.dateOfBirth)}`,
    `Age / Sex: ${[info.age, gender].filter(Boolean).join(" / ")}`,
  );
  drawTwoColRow(
    `Weight / Height: ${[info.weight ? `${info.weight} kg` : "", info.height ? `${info.height} cm` : ""]
      .filter(Boolean)
      .join(" / ")}`,
    `BMI: ${info.bmi || ""}`,
  );
  drawSingleRow(`ASA Score: ${asaText}`);
  if (hasText(info.asaNotes)) {
    drawSingleRow(`ASA Notes: ${info.asaNotes}`);
  }

  let inlineDiagramRendered = false;

  filteredSections.forEach((section) => {
    y += 2;
    ensureSpace(16);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(section.title, margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const shouldRenderInlineDiagram =
      Boolean(diagram?.imageData) &&
      diagram?.placement === "inlineRight" &&
      diagram?.sectionTitle === section.title &&
      !inlineDiagramRendered;

    if (shouldRenderInlineDiagram) {
      const gap = 6;
      const rightWidth = 80;
      const leftWidth = contentWidth - rightWidth - gap;
      const leftX = margin;
      const rightX = margin + leftWidth + gap;

      const leftLines = section.entries.map((entry) => pdf.splitTextToSize(toEntryText(entry), leftWidth));
      const leftHeight = leftLines.reduce((total, lines) => total + lines.length * lineHeight, 0);
      const estimatedRightHeight = 74;
      const sectionHeight = Math.max(leftHeight, estimatedRightHeight) + 2;

      ensureSpace(sectionHeight + 2, 24);

      let leftY = y;
      leftLines.forEach((lines) => {
        lines.forEach((line: string) => {
          pdf.text(line, leftX, leftY);
          leftY += lineHeight;
        });
      });

      const portsAndIncisionsLayout = drawRectalStylePortsAndIncisions({
        pdf,
        x: rightX,
        y,
        pageHeight,
        diagramCanvas: diagram?.imageData || null,
        fallbackLabel: hasText(diagram?.title) ? String(diagram?.title) : "DIAGRAM",
      });
      const rightBottomY = portsAndIncisionsLayout.diagramBottomY;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      y += Math.max(sectionHeight, rightBottomY - y + 2);
      inlineDiagramRendered = true;
      return;
    }

    for (let index = 0; index < section.entries.length; index += 2) {
      const leftEntry = section.entries[index];
      const rightEntry = section.entries[index + 1];
      const leftValue = `${leftEntry.label}: ${
        Array.isArray(leftEntry.value) ? toArray(leftEntry.value).join(", ") : leftEntry.value || ""
      }`;
      const rightValue = rightEntry
        ? `${rightEntry.label}: ${
            Array.isArray(rightEntry.value)
              ? toArray(rightEntry.value).join(", ")
              : rightEntry.value || ""
          }`
        : "";

      const useSingleRow =
        leftValue.length > 110 ||
        rightValue.length > 110;

      if (useSingleRow) {
        drawSingleRow(leftValue);
        if (rightValue) {
          drawSingleRow(rightValue);
        }
      } else {
        drawTwoColRow(leftValue, rightValue);
      }
    }
  });

  const shouldRenderDiagramAtEnd =
    Boolean(diagram?.imageData) &&
    !(diagram?.placement === "inlineRight" && inlineDiagramRendered);

  if (shouldRenderDiagramAtEnd) {
    y += 2;
    ensureSpace(90, 30);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(diagram?.title || "Diagram", margin, y);
    y += 7;
    pdf.addImage(diagram?.imageData || "", "PNG", margin, y, contentWidth, 75);
    y += 80;
  }

  if (signature && (hasText(signature.text) || hasText(signature.imageData) || hasText(signature.dateTime))) {
    y += 2;
    ensureSpace(30, 20);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Signature", margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    if (hasText(signature.text)) {
      pdf.text(`Name: ${signature.text}`, margin, y);
      y += lineHeight;
    }

    if (hasText(signature.imageData)) {
      const { width, height } = await calculateSignatureDimensions(signature.imageData as string);
      pdf.addImage(signature.imageData as string, "PNG", margin, y, width, height);
      y += height + 3;
    }

    if (hasText(signature.dateTime)) {
      pdf.text(
        `Date: ${formatDateTimeDDMMYYYYWithDashes(signature.dateTime || "") || signature.dateTime}`,
        margin,
        y,
      );
      y += lineHeight;
    }
  }

  const blob = pdf.output("blob");
  return { success: true as const, blob };
};
