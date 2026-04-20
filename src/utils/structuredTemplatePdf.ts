import jsPDF from "jspdf";
import { getFullASAText } from "@/utils/asaDescriptions";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { formatPatientGender, getPdfSafePatientInfo } from "@/utils/patientSticker";
import { hasText, toArray } from "@/utils/templateDataHelpers";

export interface StructuredTemplatePdfEntry {
  label: string;
  value?: string | string[];
  fullWidth?: boolean;
  subheading?: boolean;
}

export interface StructuredTemplatePdfSection {
  title: string;
  entries: StructuredTemplatePdfEntry[];
  layout?:
    | "default"
    | "colonoscopy-preoperative"
    | "label-value-table"
    | "label-value-three-column";
  columns?: 1 | 2;
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
    style?: "plain" | "portsLegend";
  };
  signature?: {
    text?: string;
    imageData?: string;
    dateTime?: string;
    alwaysShow?: boolean;
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

  const info = getPdfSafePatientInfo(patientInfo || {});
  const filteredSections = sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) =>
        entry.subheading
          ? true
          : Array.isArray(entry.value)
            ? entry.value.length > 0
            : hasText(entry.value),
      ),
    }))
    .filter(
      (section) =>
        section.entries.some((entry) => !entry.subheading) ||
        (section.layout !== "label-value-three-column" && section.entries.length > 0),
    );

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

  const drawLabelValueRow = (
    label: string,
    value: string,
    x: number = margin,
    width: number = contentWidth,
    fixedLabelWidth?: number,
  ) => {
    if (!value) return;

    const gap = 2;
    const labelText = `${label}:`;
    const preferredLabelWidth = Math.max(pdf.getTextWidth(labelText) + 2, width * 0.34);
    const labelWidth = fixedLabelWidth
      ? Math.min(Math.max(fixedLabelWidth, 30), width * 0.46)
      : Math.min(Math.max(preferredLabelWidth, 30), width * 0.46);
    const valueWidth = Math.max(width - labelWidth - gap, 20);
    const labelLines = pdf.splitTextToSize(labelText, labelWidth);
    const valueLines = pdf.splitTextToSize(value, valueWidth);
    const lineCount = Math.max(labelLines.length, valueLines.length, 1);

    ensureSpace(lineCount * lineHeight + 1);
    for (let index = 0; index < lineCount; index += 1) {
      if (labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(labelLines[index], x, y);
      }

      if (valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(valueLines[index], x + labelWidth + gap, y);
      }

      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawThreeColRow = (first: string, second: string, third: string) => {
    if (!first && !second && !third) return;
    const gap = 4;
    const threeColWidth = (contentWidth - gap * 2) / 3;
    const firstLines = pdf.splitTextToSize(first, threeColWidth);
    const secondLines = pdf.splitTextToSize(second, threeColWidth);
    const thirdLines = pdf.splitTextToSize(third, threeColWidth);
    const lineCount = Math.max(firstLines.length, secondLines.length, thirdLines.length, 1);
    ensureSpace(lineCount * lineHeight + 1);

    for (let index = 0; index < lineCount; index += 1) {
      if (firstLines[index]) {
        pdf.text(firstLines[index], margin, y);
      }
      if (secondLines[index]) {
        pdf.text(secondLines[index], margin + threeColWidth + gap, y);
      }
      if (thirdLines[index]) {
        pdf.text(thirdLines[index], margin + (threeColWidth + gap) * 2, y);
      }
      y += lineHeight;
    }
  };

  type PreparedLabelValueCell = {
    labelLines: string[];
    valueLines: string[];
    labelWidth: number;
    x: number;
  };

  const prepareLabelValueCell = (
    label: string,
    value: string,
    width: number,
    x: number,
  ): PreparedLabelValueCell => {
    const gap = 2;
    const labelText = `${label}:`;
    const preferredLabelWidth = Math.max(pdf.getTextWidth(labelText) + 2, width * 0.34);
    const labelWidth = Math.min(Math.max(preferredLabelWidth, 20), width * 0.48);
    const valueWidth = Math.max(width - labelWidth - gap, 16);

    return {
      labelLines: pdf.splitTextToSize(labelText, labelWidth),
      valueLines: pdf.splitTextToSize(value, valueWidth),
      labelWidth,
      x,
    };
  };

  const drawPreparedLabelValueCellsRow = (
    cells: PreparedLabelValueCell[],
    rowGap: number = 0,
  ) => {
    if (cells.length === 0) return;
    const gap = 2;
    const lineCount = Math.max(
      ...cells.map((cell) => Math.max(cell.labelLines.length, cell.valueLines.length, 1)),
      1,
    );

    ensureSpace(lineCount * lineHeight + 1 + rowGap);

    for (let index = 0; index < lineCount; index += 1) {
      cells.forEach((cell) => {
        if (cell.labelLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(cell.labelLines[index], cell.x, y);
        }
        if (cell.valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(cell.valueLines[index], cell.x + cell.labelWidth + gap, y);
        }
      });
      y += lineHeight;
    }

    if (rowGap > 0) {
      y += rowGap;
    }
    pdf.setFont("helvetica", "normal");
  };

  const drawTwoColLabelValueRow = (
    left: { label: string; value: string },
    right?: { label: string; value: string },
  ) => {
    const cells: PreparedLabelValueCell[] = [];

    if (hasText(left.value)) {
      cells.push(prepareLabelValueCell(left.label, left.value, columnWidth, margin));
    }
    if (right && hasText(right.value)) {
      cells.push(prepareLabelValueCell(right.label, right.value, columnWidth, margin + 96));
    }

    drawPreparedLabelValueCellsRow(cells);
  };

  const drawThreeColLabelValueSection = (entries: StructuredTemplatePdfEntry[]) => {
    const gap = 4;
    const cellWidth = (contentWidth - gap * 2) / 3;
    const rowGap = 3;
    let index = 0;

    while (index < entries.length) {
      const entry = entries[index];

      if (entry.subheading) {
        let hasFollowingValues = false;
        let scanIndex = index + 1;
        while (scanIndex < entries.length && !entries[scanIndex].subheading) {
          if (hasText(toEntryValue(entries[scanIndex]))) {
            hasFollowingValues = true;
            break;
          }
          scanIndex += 1;
        }

        if (hasFollowingValues) {
          ensureSpace(lineHeight + 2);
          pdf.setFont("helvetica", "bold");
          pdf.text(entry.label, margin, y);
          y += lineHeight + 1.2;
          pdf.setFont("helvetica", "normal");
        }

        index += 1;
        continue;
      }

      const rowEntries: StructuredTemplatePdfEntry[] = [];
      while (
        index < entries.length &&
        rowEntries.length < 3 &&
        !entries[index].subheading
      ) {
        if (hasText(toEntryValue(entries[index]))) {
          rowEntries.push(entries[index]);
        }
        index += 1;
      }

      if (rowEntries.length === 0) {
        continue;
      }

      const prepared = rowEntries.map((rowEntry, rowIndex) =>
        prepareLabelValueCell(
          rowEntry.label,
          toEntryValue(rowEntry),
          cellWidth,
          margin + rowIndex * (cellWidth + gap),
        ),
      );

      drawPreparedLabelValueCellsRow(prepared, rowGap);
    }
  };

  const toEntryValue = (entry: StructuredTemplatePdfEntry) =>
    Array.isArray(entry.value) ? toArray(entry.value).join(", ") : entry.value || "";

  const toEntryText = (entry: StructuredTemplatePdfEntry) =>
    `${entry.label}: ${toEntryValue(entry)}`;

  const renderColonoscopyPreoperativeSection = (entries: StructuredTemplatePdfEntry[]) => {
    const valueByLabel = new Map<string, string>();
    entries.forEach((entry) => {
      valueByLabel.set(entry.label, toEntryValue(entry));
    });

    const formatEntry = (label: string) => {
      const value = valueByLabel.get(label) || "";
      return value ? `${label}: ${value}` : "";
    };

    drawThreeColRow(
      formatEntry("Endoscopist"),
      formatEntry("Assistant"),
      formatEntry("Anaesthetist"),
    );
    drawThreeColRow(
      formatEntry("Start Time"),
      formatEntry("End Time"),
      formatEntry("Total Duration (Min)"),
    );
    drawSingleRow(formatEntry("Caecal Intubation Time"));
    drawSingleRow(formatEntry("Start of Withdrawal Time"));
    drawSingleRow(formatEntry("Duration of Withdrawal (Min)"));
    drawSingleRow(formatEntry("Procedure Urgency"));
    drawSingleRow(formatEntry("Preoperative Imaging"));
    drawSingleRow(formatEntry("Indication for Colonoscopy"));
    drawSingleRow(formatEntry("Signs & Symptoms"));
  };

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

  drawTwoColLabelValueRow(
    { label: "Patient Name", value: info.name || "" },
    { label: "Patient ID", value: info.patientId || "" },
  );
  drawTwoColLabelValueRow(
    { label: "Date Of Birth", value: formatDateDDMMYYYYWithDashes(info.dateOfBirth) },
    { label: "Age / Sex", value: [info.age, gender].filter(Boolean).join(" / ") },
  );
  drawTwoColLabelValueRow(
    {
      label: "Weight / Height",
      value: [info.weight ? `${info.weight} kg` : "", info.height ? `${info.height} cm` : ""]
        .filter(Boolean)
        .join(" / "),
    },
    { label: "BMI", value: info.bmi || "" },
  );
  drawLabelValueRow("ASA Score", asaText);
  if (hasText(info.asaNotes)) {
    drawLabelValueRow("ASA Notes", info.asaNotes);
  }

  let inlineDiagramRendered = false;

  filteredSections.forEach((section) => {
    y += 2;
    const sectionOpeningHeight =
      section.layout === "label-value-three-column" ? 26 : 16;
    ensureSpace(sectionOpeningHeight);
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
      const rightWidth = 70;
      const leftWidth = contentWidth - rightWidth - gap;
      const leftX = margin;
      const rightX = margin + leftWidth + gap;
      const labelGap = 2;
      const renderedEntries = section.entries
        .map((entry) => ({ label: entry.label, value: toEntryValue(entry) }))
        .filter((entry) => hasText(entry.value));
      const inlineLabelWidth = Math.min(
        Math.max(
          renderedEntries.reduce(
            (maxWidth, entry) =>
              Math.max(maxWidth, pdf.getTextWidth(`${entry.label}:`) + 2),
            0,
          ),
          leftWidth * 0.34,
          30,
        ),
        leftWidth * 0.46,
      );
      const countEntryLines = (entry: { label: string; value: string }) => {
        const labelText = `${entry.label}:`;
        const valueWidth = Math.max(leftWidth - inlineLabelWidth - labelGap, 20);
        const labelLines = pdf.splitTextToSize(labelText, inlineLabelWidth);
        const valueLines = pdf.splitTextToSize(entry.value, valueWidth);
        return Math.max(labelLines.length, valueLines.length, 1);
      };
      const leftHeight =
        renderedEntries.reduce(
          (total, entry) => total + countEntryLines(entry) * lineHeight,
          0,
        ) || lineHeight;
      const estimatedRightHeight = 66;
      const sectionHeight = Math.max(leftHeight, estimatedRightHeight) + 2;

      ensureSpace(sectionHeight + 2, 24);

      let leftY = y;
      renderedEntries.forEach((entry) => {
        const labelText = `${entry.label}:`;
        const valueWidth = Math.max(leftWidth - inlineLabelWidth - labelGap, 20);
        const labelLines = pdf.splitTextToSize(labelText, inlineLabelWidth);
        const valueLines = pdf.splitTextToSize(entry.value, valueWidth);
        const lineCount = Math.max(labelLines.length, valueLines.length, 1);

        for (let index = 0; index < lineCount; index += 1) {
          if (labelLines[index]) {
            pdf.setFont("helvetica", "bold");
            pdf.text(labelLines[index], leftX, leftY);
          }

          if (valueLines[index]) {
            pdf.setFont("helvetica", "normal");
            pdf.text(valueLines[index], leftX + inlineLabelWidth + labelGap, leftY);
          }

          leftY += lineHeight;
        }
      });
      pdf.setFont("helvetica", "normal");

      let rightBottomY = y;
      if (diagram?.style === "plain") {
        const diagramBoxHeight = 56;
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);
        pdf.rect(rightX, y, rightWidth, diagramBoxHeight);

        if (diagram?.imageData) {
          try {
            const imageProps = pdf.getImageProperties(diagram.imageData);
            const imageAspectRatio = imageProps.width / imageProps.height;
            let imageWidth = rightWidth - 4;
            let imageHeight = imageWidth / imageAspectRatio;

            if (imageHeight > diagramBoxHeight - 4) {
              imageHeight = diagramBoxHeight - 4;
              imageWidth = imageHeight * imageAspectRatio;
            }

            const imageX = rightX + (rightWidth - imageWidth) / 2;
            const imageY = y + (diagramBoxHeight - imageHeight) / 2;
            pdf.addImage(diagram.imageData, "PNG", imageX, imageY, imageWidth, imageHeight);
          } catch (error) {
            pdf.setFont("helvetica", "normal");
            pdf.text("Diagram unavailable", rightX + rightWidth / 2, y + diagramBoxHeight / 2, {
              align: "center",
            });
          }
        }

        rightBottomY = y + diagramBoxHeight;
      } else {
        const portsAndIncisionsLayout = drawRectalStylePortsAndIncisions({
          pdf,
          x: rightX,
          y,
          pageHeight,
          diagramCanvas: diagram?.imageData || null,
          fallbackLabel: hasText(diagram?.title) ? String(diagram?.title) : "DIAGRAM",
        });
        rightBottomY = portsAndIncisionsLayout.diagramBottomY;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      y = Math.max(leftY, rightBottomY + 2, y + sectionHeight);
      inlineDiagramRendered = true;
      return;
    }

    if (section.layout === "colonoscopy-preoperative") {
      renderColonoscopyPreoperativeSection(section.entries);
      return;
    }

    if (section.layout === "label-value-table") {
      if (section.columns === 2) {
        for (let index = 0; index < section.entries.length; index += 2) {
          const leftEntry = section.entries[index];
          const rightEntry = section.entries[index + 1];
          if (!leftEntry) {
            continue;
          }

          drawTwoColLabelValueRow(
            { label: leftEntry.label, value: toEntryValue(leftEntry) },
            rightEntry ? { label: rightEntry.label, value: toEntryValue(rightEntry) } : undefined,
          );
        }
        return;
      }

      const sectionLabelWidth = Math.min(
        Math.max(
          section.entries.reduce((maxWidth, entry) => {
            const entryValue = toEntryValue(entry);
            if (!hasText(entryValue)) {
              return maxWidth;
            }
            return Math.max(maxWidth, pdf.getTextWidth(`${entry.label}:`) + 2);
          }, 0),
          contentWidth * 0.34,
          30,
        ),
        contentWidth * 0.46,
      );
      section.entries.forEach((entry) => {
        drawLabelValueRow(entry.label, toEntryValue(entry), margin, contentWidth, sectionLabelWidth);
      });
      return;
    }

    if (section.layout === "label-value-three-column") {
      drawThreeColLabelValueSection(section.entries);
      return;
    }

    let index = 0;
    while (index < section.entries.length) {
      const leftEntry = section.entries[index];

      if (leftEntry.fullWidth) {
        drawSingleRow(toEntryText(leftEntry));
        index += 1;
        continue;
      }

      const rightEntry = section.entries[index + 1];
      if (!rightEntry || rightEntry.fullWidth) {
        drawTwoColRow(toEntryText(leftEntry), "");
        index += 1;
        continue;
      }

      const leftValue = toEntryText(leftEntry);
      const rightValue = toEntryText(rightEntry);
      const useSingleRow = leftValue.length > 110 || rightValue.length > 110;

      if (useSingleRow) {
        drawSingleRow(leftValue);
        drawSingleRow(rightValue);
      } else {
        drawTwoColRow(leftValue, rightValue);
      }

      index += 2;
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

  const shouldRenderSignatureSection =
    Boolean(signature) &&
    (Boolean(signature?.alwaysShow) ||
      hasText(signature?.text) ||
      hasText(signature?.imageData) ||
      hasText(signature?.dateTime));

  if (shouldRenderSignatureSection) {
    y += 2;
    ensureSpace(30, 20);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Signature", margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const signatureName = hasText(signature?.text) ? signature?.text : "";
    const signatureDate = hasText(signature?.dateTime)
      ? formatDateTimeDDMMYYYYWithDashes(signature?.dateTime || "") || signature?.dateTime
      : "";
    const signatureNameLine = hasText(signatureName) ? `Name: ${signatureName}` : signature?.alwaysShow ? "Name:" : "";
    const signatureDateLine = hasText(signatureDate) ? `Date: ${signatureDate}` : signature?.alwaysShow ? "Date:" : "";

    if (hasText(signatureNameLine) || hasText(signatureDateLine)) {
      drawTwoColRow(signatureNameLine, signatureDateLine);
    }

    if (hasText(signature?.imageData)) {
      const { width, height } = await calculateSignatureDimensions(signature?.imageData as string);
      pdf.addImage(signature?.imageData as string, "PNG", margin, y, width, height);
      y += height + 3;
    }
  }

  const blob = pdf.output("blob");
  return { success: true as const, blob };
};
