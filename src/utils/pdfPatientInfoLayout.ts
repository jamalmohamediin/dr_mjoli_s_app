import jsPDF from "jspdf";
import { getFullASAText } from "@/utils/asaDescriptions";
import { formatDateDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import { formatPatientGender, getPdfSafePatientInfo } from "@/utils/patientSticker";
import { hasText } from "@/utils/templateDataHelpers";

interface DrawStandardPatientInfoOptions {
  pdf: jsPDF;
  patientInfo?: any;
  y: number;
  margin?: number;
  pageWidth?: number;
  pageHeight?: number;
  lineHeight?: number;
  patientNameFallback?: string;
  patientIdFallback?: string;
  bottomPadding?: number;
  asaLabel?: string;
}

interface PreparedLabelValueCell {
  labelLines: string[];
  valueLines: string[];
  labelWidth: number;
  lineCount: number;
  x: number;
}

export const drawStandardPatientInformation = ({
  pdf,
  patientInfo,
  y: initialY,
  margin = 15,
  pageWidth = 210,
  pageHeight = 297,
  lineHeight = 4.5,
  patientNameFallback = "",
  patientIdFallback = "",
  bottomPadding = 20,
  asaLabel = "ASA Score",
}: DrawStandardPatientInfoOptions) => {
  let y = initialY;
  const contentWidth = pageWidth - margin * 2;
  const columnWidth = 84;
  const info = getPdfSafePatientInfo(patientInfo || {});
  const gender = formatPatientGender(info);
  const asaText = hasText(info.asaScore) ? getFullASAText(info.asaScore) : "";
  const formattedDob = formatDateDDMMYYYYWithDashes(info.dateOfBirth);
  const weightValue = info.weight ? `${info.weight} kg` : "";
  const heightValue = info.height ? `${info.height} cm` : "";

  const ensureSpace = (height = 10) => {
    if (y + height > pageHeight - bottomPadding) {
      pdf.addPage();
      y = margin;
    }
  };

  const prepareLabelValueCell = (
    label: string,
    value: string,
    width: number,
    x: number,
  ): PreparedLabelValueCell => {
    const labelText = `${label}:`;
    const labelWidth = Math.min(
      Math.max(pdf.getTextWidth(labelText) + 2, 24),
      width * 0.52,
    );
    const valueWidth = Math.max(width - labelWidth - 1, 12);
    const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
    const valueLines = pdf.splitTextToSize(value, valueWidth) as string[];

    return {
      labelLines,
      valueLines,
      labelWidth,
      lineCount: Math.max(labelLines.length, valueLines.length, 1),
      x,
    };
  };

  const drawPreparedCellsRow = (cells: PreparedLabelValueCell[]) => {
    if (cells.length === 0) {
      return;
    }

    const rowLineCount = Math.max(...cells.map((cell) => cell.lineCount), 1);
    ensureSpace(rowLineCount * lineHeight + 1);

    for (let index = 0; index < rowLineCount; index += 1) {
      cells.forEach((cell) => {
        if (cell.labelLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(cell.labelLines[index], cell.x, y);
        }

        if (cell.valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(cell.valueLines[index], cell.x + cell.labelWidth + 1, y);
        }
      });

      y += lineHeight;
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
      cells.push(
        prepareLabelValueCell(right.label, right.value, columnWidth, margin + 96),
      );
    }

    drawPreparedCellsRow(cells);
  };

  const drawLabelValueRow = (label: string, value: string, labelWidthOverride?: number) => {
    if (!hasText(value)) {
      return;
    }

    const labelText = `${label}:`;
    const preferredLabelWidth = Math.max(pdf.getTextWidth(labelText) + 2, contentWidth * 0.34);
    const labelWidth =
      labelWidthOverride ??
      Math.min(Math.max(preferredLabelWidth, 30), contentWidth * 0.46);
    const valueWidth = Math.max(contentWidth - labelWidth - 2, 20);
    const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
    const valueLines = pdf.splitTextToSize(value, valueWidth) as string[];
    const lineCount = Math.max(labelLines.length, valueLines.length, 1);

    ensureSpace(lineCount * lineHeight + 1);

    for (let index = 0; index < lineCount; index += 1) {
      if (labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(labelLines[index], margin, y);
      }

      if (valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(valueLines[index], margin + labelWidth + 2, y);
      }

      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Patient Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  drawTwoColLabelValueRow(
    { label: "Patient Name", value: info.name || patientNameFallback || "" },
    { label: "Patient ID", value: info.patientId || patientIdFallback || "" },
  );
  drawTwoColLabelValueRow(
    { label: "Date Of Birth", value: formattedDob },
    { label: "Age / Sex", value: [info.age, gender].filter(Boolean).join(" / ") },
  );
  drawTwoColLabelValueRow(
    {
      label: "Weight / Height",
      value: [weightValue, heightValue].filter(Boolean).join(" / "),
    },
    { label: "BMI", value: info.bmi || "" },
  );
  const dateOfBirthLabelWidth = Math.min(
    Math.max(pdf.getTextWidth("Date Of Birth:") + 2, 24),
    columnWidth * 0.52,
  );
  drawLabelValueRow(asaLabel, asaText, dateOfBirthLabelWidth);
  drawLabelValueRow("ASA Notes", info.asaNotes || "", dateOfBirthLabelWidth);

  return y;
};
