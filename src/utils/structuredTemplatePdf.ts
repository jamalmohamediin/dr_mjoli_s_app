import jsPDF from "jspdf";
import { getFullASAText } from "@/utils/asaDescriptions";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { formatPatientGender, getPdfSafePatientInfo } from "@/utils/patientSticker";
import {
  hasPdfDisplayValue,
  hasText,
  isPostPreoperativeAlwaysVisibleField,
  isPreoperativeSectionTitle,
  toArray,
} from "@/utils/templateDataHelpers";

export interface StructuredTemplatePdfEntry {
  label: string;
  value?: string | string[];
  fullWidth?: boolean;
  subheading?: boolean;
  keepWhenEmpty?: boolean;
}

export interface StructuredTemplatePdfSection {
  title: string;
  entries: StructuredTemplatePdfEntry[];
  startOnNewPage?: boolean;
  layout?:
    | "default"
    | "colonoscopy-preoperative"
    | "aligned-preoperative-grid"
    | "label-value-table"
    | "label-value-three-column";
  columns?: 1 | 2;
  fixedLabelWidth?: number;
  labelGap?: number;
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
    legendTitle?: string;
    legendItems?: string[];
    legendPosition?: "top" | "bottom";
    boxHeight?: number;
    inlineValueOffset?: number;
  };
  signature?: {
    text?: string;
    imageData?: string;
    dateTime?: string;
    alwaysShow?: boolean;
  };
  patientInfoLayout?: "default" | "appendectomy";
  signatureLayout?: "default" | "appendectomy";
  prioritizeSignsBeforeIndication?: boolean;
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

const detectImageFormat = (value: string): "PNG" | "JPEG" => {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized.startsWith("data:image/jpeg") ||
    normalized.startsWith("data:image/jpg")
  ) {
    return "JPEG";
  }

  return "PNG";
};

export const generateStructuredTemplatePdf = async ({
  title,
  patientInfo,
  sections,
  diagram,
  signature,
  patientInfoLayout = "default",
  signatureLayout = "default",
  prioritizeSignsBeforeIndication = false,
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
  const firstPreoperativeSectionIndex = sections.findIndex((section) =>
    isPreoperativeSectionTitle(section.title),
  );
  const filteredSections = sections
    .map((section, sectionIndex) => {
      const isAfterPreoperativeSection =
        firstPreoperativeSectionIndex >= 0 &&
        sectionIndex > firstPreoperativeSectionIndex;
      const entries = section.entries
        .map((entry) => {
          const keepWhenEmpty =
            isAfterPreoperativeSection &&
            isPostPreoperativeAlwaysVisibleField(entry.label);
          return { ...entry, keepWhenEmpty };
        })
        .filter((entry) =>
          entry.subheading
            ? true
            : entry.keepWhenEmpty || hasPdfDisplayValue(entry.value),
        );

      return {
        ...section,
        entries,
      };
    })
    .filter(
      (section) =>
        section.entries.some((entry) => !entry.subheading) ||
        (section.layout !== "label-value-three-column" && section.entries.length > 0),
    );
  const normalizedDiagramLegendItems = toArray(diagram?.legendItems)
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);

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
    drawWhenEmpty: boolean = false,
    valueGap: number = 2,
  ) => {
    if (!value && !drawWhenEmpty) return;

    const gap = valueGap;
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

  const drawThreeColLabelValueRow = (
    first?: { label: string; value: string },
    second?: { label: string; value: string },
    third?: { label: string; value: string },
    rowGap: number = 0,
  ) => {
    const gap = 4;
    const cellWidth = (contentWidth - gap * 2) / 3;
    const cells: PreparedLabelValueCell[] = [];
    const candidates = [first, second, third];

    candidates.forEach((candidate, index) => {
      if (!candidate || !hasText(candidate.value)) {
        return;
      }
      cells.push(
        prepareLabelValueCell(
          candidate.label,
          candidate.value,
          cellWidth,
          margin + index * (cellWidth + gap),
        ),
      );
    });

    drawPreparedLabelValueCellsRow(cells, rowGap);
  };

  const drawTwoColLabelValueRow = (
    left: { label: string; value: string; keepWhenEmpty?: boolean },
    right?: { label: string; value: string; keepWhenEmpty?: boolean },
  ) => {
    const cells: PreparedLabelValueCell[] = [];

    if (hasText(left.value) || left.keepWhenEmpty) {
      cells.push(prepareLabelValueCell(left.label, left.value, columnWidth, margin));
    }
    if (right && (hasText(right.value) || right.keepWhenEmpty)) {
      cells.push(prepareLabelValueCell(right.label, right.value, columnWidth, margin + 96));
    }

    drawPreparedLabelValueCellsRow(cells);
  };

  const entryHasRenderableValue = (entry: StructuredTemplatePdfEntry) =>
    Boolean(entry.keepWhenEmpty) || hasText(toEntryValue(entry));

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
          if (entryHasRenderableValue(entries[scanIndex])) {
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
        if (entryHasRenderableValue(entries[index])) {
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
    drawSingleRow(formatEntry("Urgency") || formatEntry("Procedure Urgency"));
    drawSingleRow(formatEntry("Preoperative Imaging"));
    drawSingleRow(formatEntry("Signs & Symptoms"));
    drawSingleRow(formatEntry("Indication for Colonoscopy"));
  };

  const renderAlignedPreoperativeGridSection = (entries: StructuredTemplatePdfEntry[]) => {
    const normalizedEntries = entries
      .map((entry) => ({
        label: entry.label,
        value: toEntryValue(entry),
      }))
      .filter((entry) => hasText(entry.value));

    if (normalizedEntries.length === 0) {
      return;
    }

    const consumed = new Set<string>();
    const findEntry = (labels: string[]) =>
      normalizedEntries.find(
        (entry) => labels.includes(entry.label) && !consumed.has(entry.label),
      );
    const pick = (labels: string[]) => {
      const entry = findEntry(labels);
      if (!entry) {
        return undefined;
      }
      consumed.add(entry.label);
      return { label: entry.label, value: entry.value };
    };

    drawThreeColLabelValueRow(
      pick(["Endoscopist", "Surgeon"]),
      pick(["Assistant"]),
      pick(["Anaesthetist", "Anesthetist"]),
      1,
    );
    drawThreeColLabelValueRow(
      pick(["Start Time", "Start Time (24-hour)"]),
      pick(["End Time", "End Time (24-hour)"]),
      pick([
        "Total Duration (Min)",
        "Duration Of Procedure",
        "Duration Of Operation (In Minutes)",
        "Duration of Procedure",
      ]),
      1,
    );
    drawThreeColLabelValueRow(
      pick(["Caecal Intubation Time"]),
      pick(["Start of Withdrawal Time"]),
      pick(["Duration of Withdrawal (Min)"]),
      1,
    );
    drawThreeColLabelValueRow(
      pick(["Procedure Urgency", "Urgency"]),
      pick(["Preoperative Imaging", "Pre-Operative Imaging"]),
      pick(["Tumour Staging"]),
      1,
    );
    const signsAndSymptomsEntry = pick(["Signs & Symptoms", "Signs and Symptoms"]);
    const indicationEntry = pick([
      "Indication for Colonoscopy",
      "Indication for Surgery",
      "Indications",
      "Indication",
    ]);
    if (prioritizeSignsBeforeIndication) {
      if (signsAndSymptomsEntry) {
        drawLabelValueRow(signsAndSymptomsEntry.label, signsAndSymptomsEntry.value, margin, contentWidth);
      }
      if (indicationEntry) {
        drawLabelValueRow(indicationEntry.label, indicationEntry.value, margin, contentWidth, 46);
      }
    } else {
      if (indicationEntry) {
        drawLabelValueRow(indicationEntry.label, indicationEntry.value, margin, contentWidth, 46);
      }
      if (signsAndSymptomsEntry) {
        drawLabelValueRow(signsAndSymptomsEntry.label, signsAndSymptomsEntry.value, margin, contentWidth);
      }
    }
    const operationDescriptionEntry = pick(["Operation Description"]);
    if (operationDescriptionEntry) {
      drawLabelValueRow(
        operationDescriptionEntry.label,
        operationDescriptionEntry.value,
        margin,
        contentWidth,
        46,
      );
    }
    const preOperativeDiagnosisEntry = pick(["Pre-Operative Diagnosis"]);
    if (preOperativeDiagnosisEntry) {
      drawLabelValueRow(
        preOperativeDiagnosisEntry.label,
        preOperativeDiagnosisEntry.value,
        margin,
        contentWidth,
        46,
      );
    }

    const remainingEntries = normalizedEntries.filter((entry) => !consumed.has(entry.label));
    if (remainingEntries.length === 0) {
      return;
    }

    const sectionLabelWidth = Math.min(
      Math.max(
        remainingEntries.reduce(
          (maxWidth, entry) => Math.max(maxWidth, pdf.getTextWidth(`${entry.label}:`) + 2),
          0,
        ),
        26,
      ),
      50,
    );

    remainingEntries.forEach((entry) => {
      drawLabelValueRow(entry.label, entry.value, margin, contentWidth, sectionLabelWidth);
    });
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
  const formattedDob = formatDateDDMMYYYYWithDashes(info.dateOfBirth);
  const weightValue = info.weight ? `${info.weight} kg` : "";
  const heightValue = info.height ? `${info.height} cm` : "";

  if (patientInfoLayout === "appendectomy") {
    drawThreeColLabelValueRow(
      { label: "Patient Name", value: info.name || "" },
      { label: "Gender", value: gender || "" },
      { label: "Age", value: info.age || "" },
      1,
    );
    drawThreeColLabelValueRow(
      { label: "Patient ID", value: info.patientId || "" },
      { label: "Date Of Birth", value: formattedDob },
      { label: "Address", value: info.address || "" },
      1,
    );
    drawThreeColLabelValueRow(
      { label: "Weight", value: weightValue },
      { label: "Height", value: heightValue },
      { label: "BMI", value: info.bmi || "" },
      1,
    );
    drawLabelValueRow("ASA Physical Status Classification", asaText);
    if (hasText(info.asaNotes)) {
      drawLabelValueRow("ASA Notes", info.asaNotes);
    }
  } else {
    drawTwoColLabelValueRow(
      { label: "Patient Name", value: info.name || "" },
      { label: "Patient ID", value: info.patientId || "" },
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
    drawLabelValueRow("ASA Physical Status Classification", asaText);
    if (hasText(info.asaNotes)) {
      drawLabelValueRow("ASA Notes", info.asaNotes);
    }
  }

  let inlineDiagramRendered = false;

  filteredSections.forEach((section) => {
    if (section.startOnNewPage && y > margin + 2) {
      pdf.addPage();
      y = margin;
    }

    const shouldRenderInlineDiagram =
      Boolean(diagram?.imageData) &&
      diagram?.placement === "inlineRight" &&
      diagram?.sectionTitle === section.title &&
      !inlineDiagramRendered;

    y += 2;
    const sectionOpeningHeight =
      shouldRenderInlineDiagram
        ? 94
        : section.layout === "label-value-three-column"
          ? 26
          : 16;
    ensureSpace(sectionOpeningHeight);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(section.title, margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    if (shouldRenderInlineDiagram) {
      const gap = 6;
      const rightWidth = 70;
      const leftWidth = contentWidth - rightWidth - gap;
      const leftX = margin;
      const rightX = margin + leftWidth + gap;
      const labelGap = 2;
      const inlineValueOffset = Math.max(0, Number(diagram?.inlineValueOffset) || 0);
      const legendLineHeight = Math.max(lineHeight - 0.5, 3.8);
      const renderedEntries = section.entries
        .map((entry) => ({
          label: entry.label,
          value: toEntryValue(entry),
          keepWhenEmpty: entry.keepWhenEmpty,
        }))
        .filter((entry) => hasText(entry.value) || entry.keepWhenEmpty);
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
        const valueWidth = Math.max(
          leftWidth - inlineLabelWidth - labelGap - inlineValueOffset,
          20,
        );
        const labelLines = pdf.splitTextToSize(labelText, inlineLabelWidth);
        const valueLines = pdf.splitTextToSize(entry.value, valueWidth);
        return Math.max(labelLines.length, valueLines.length, 1);
      };
      const leftHeight =
        renderedEntries.reduce(
          (total, entry) => total + countEntryLines(entry) * lineHeight,
          0,
        ) || lineHeight;
      const legendPosition = diagram?.legendPosition === "top" ? "top" : "bottom";
      const legendLinesCount = normalizedDiagramLegendItems.reduce(
        (count, item) => count + pdf.splitTextToSize(`- ${item}`, rightWidth - 1).length,
        0,
      );
      const legendBlockHeight =
        normalizedDiagramLegendItems.length > 0
          ? lineHeight + legendLinesCount * legendLineHeight + 1
          : 0;
      const inlinePlainDiagramBoxHeight = Math.max(50, Number(diagram?.boxHeight) || 56);
      const estimatedRightHeight =
        diagram?.style === "plain"
          ? inlinePlainDiagramBoxHeight +
            (normalizedDiagramLegendItems.length > 0 ? 3 + legendBlockHeight : 0)
          : 66;
      const sectionHeight = Math.max(leftHeight, estimatedRightHeight) + 2;

      ensureSpace(sectionHeight + 2, 24);

      let leftY = y;
      renderedEntries.forEach((entry) => {
        const labelText = `${entry.label}:`;
        const valueWidth = Math.max(
          leftWidth - inlineLabelWidth - labelGap - inlineValueOffset,
          20,
        );
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
            pdf.text(
              valueLines[index],
              leftX + inlineLabelWidth + labelGap + inlineValueOffset,
              leftY,
            );
          }

          leftY += lineHeight;
        }
      });
      pdf.setFont("helvetica", "normal");

      let rightBottomY = y;
      if (diagram?.style === "plain") {
        const diagramBoxHeight = inlinePlainDiagramBoxHeight;
        let diagramY = y;
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);

        if (normalizedDiagramLegendItems.length > 0 && legendPosition === "top") {
          let legendY = y;
          pdf.setFont("helvetica", "bold");
          pdf.text(diagram?.legendTitle || "Legend", rightX, legendY);
          legendY += lineHeight;

          pdf.setFont("helvetica", "normal");
          normalizedDiagramLegendItems.forEach((item) => {
            const legendLines = pdf.splitTextToSize(`- ${item}`, rightWidth - 1);
            legendLines.forEach((line: string) => {
              pdf.text(line, rightX, legendY);
              legendY += legendLineHeight;
            });
          });
          diagramY = legendY + 2;
        }

        pdf.rect(rightX, diagramY, rightWidth, diagramBoxHeight);

        if (diagram?.imageData) {
          try {
            const imageProps = pdf.getImageProperties(diagram.imageData);
            const imageAspectRatio = imageProps.width / imageProps.height;
            let imageWidth = rightWidth - 2;
            let imageHeight = imageWidth / imageAspectRatio;

            if (imageHeight > diagramBoxHeight - 2) {
              imageHeight = diagramBoxHeight - 2;
              imageWidth = imageHeight * imageAspectRatio;
            }

            const imageX = rightX + (rightWidth - imageWidth) / 2;
            const imageY = diagramY + (diagramBoxHeight - imageHeight) / 2;
            pdf.addImage(
              diagram.imageData,
              detectImageFormat(diagram.imageData),
              imageX,
              imageY,
              imageWidth,
              imageHeight,
            );
          } catch (error) {
            pdf.setFont("helvetica", "normal");
            pdf.text("Diagram unavailable", rightX + rightWidth / 2, diagramY + diagramBoxHeight / 2, {
              align: "center",
            });
          }
        }

        rightBottomY = diagramY + diagramBoxHeight;
        if (normalizedDiagramLegendItems.length > 0 && legendPosition === "bottom") {
          let legendY = rightBottomY + 3;
          pdf.setFont("helvetica", "bold");
          pdf.text(diagram?.legendTitle || "Legend", rightX, legendY);
          legendY += lineHeight;

          pdf.setFont("helvetica", "normal");
          normalizedDiagramLegendItems.forEach((item) => {
            const legendLines = pdf.splitTextToSize(`- ${item}`, rightWidth - 1);
            legendLines.forEach((line: string) => {
              pdf.text(line, rightX, legendY);
              legendY += legendLineHeight;
            });
          });
          rightBottomY = Math.max(rightBottomY, legendY);
        }
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

    if (section.layout === "aligned-preoperative-grid") {
      renderAlignedPreoperativeGridSection(section.entries);
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
            {
              label: leftEntry.label,
              value: toEntryValue(leftEntry),
              keepWhenEmpty: leftEntry.keepWhenEmpty,
            },
            rightEntry
              ? {
                  label: rightEntry.label,
                  value: toEntryValue(rightEntry),
                  keepWhenEmpty: rightEntry.keepWhenEmpty,
                }
              : undefined,
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
      const effectiveLabelWidth = section.fixedLabelWidth || sectionLabelWidth;
      const effectiveLabelGap = section.labelGap || 2;
      section.entries.forEach((entry) => {
        drawLabelValueRow(
          entry.label,
          toEntryValue(entry),
          margin,
          contentWidth,
          effectiveLabelWidth,
          Boolean(entry.keepWhenEmpty),
          effectiveLabelGap,
        );
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
    const endLegendPosition = diagram?.legendPosition === "top" ? "top" : "bottom";
    const endLegendLineHeight = Math.max(lineHeight - 0.5, 3.8);
    const endLegendLinesCount = normalizedDiagramLegendItems.reduce(
      (count, item) => count + pdf.splitTextToSize(`- ${item}`, contentWidth).length,
      0,
    );
    const endLegendHeight =
      normalizedDiagramLegendItems.length > 0
        ? lineHeight + endLegendLinesCount * endLegendLineHeight + 1
        : 0;
    const endDiagramHeight = 75;
    ensureSpace(
      15 + endDiagramHeight + (normalizedDiagramLegendItems.length > 0 ? endLegendHeight + 3 : 0),
      30,
    );
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(diagram?.title || "Diagram", margin, y);
    y += 7;
    if (normalizedDiagramLegendItems.length > 0 && endLegendPosition === "top") {
      pdf.setFont("helvetica", "bold");
      pdf.text(diagram?.legendTitle || "Legend", margin, y);
      y += lineHeight;
      pdf.setFont("helvetica", "normal");
      normalizedDiagramLegendItems.forEach((item) => {
        const lines = pdf.splitTextToSize(`- ${item}`, contentWidth);
        lines.forEach((line: string) => {
          ensureSpace(endLegendLineHeight + 1, 20);
          pdf.text(line, margin, y);
          y += endLegendLineHeight;
        });
      });
      y += 2;
    }
    const endDiagramImageData = String(diagram?.imageData || "");
    pdf.addImage(
      endDiagramImageData,
      detectImageFormat(endDiagramImageData),
      margin,
      y,
      contentWidth,
      endDiagramHeight,
    );
    y += endDiagramHeight + 5;
    if (normalizedDiagramLegendItems.length > 0 && endLegendPosition === "bottom") {
      ensureSpace(endLegendHeight + 4, 20);
      pdf.setFont("helvetica", "bold");
      pdf.text(diagram?.legendTitle || "Legend", margin, y);
      y += lineHeight;
      pdf.setFont("helvetica", "normal");
      normalizedDiagramLegendItems.forEach((item) => {
        const lines = pdf.splitTextToSize(`- ${item}`, contentWidth);
        lines.forEach((line: string) => {
          ensureSpace(endLegendLineHeight + 1, 20);
          pdf.text(line, margin, y);
          y += endLegendLineHeight;
        });
      });
      y += 1;
    }
  }

  const shouldRenderSignatureSection =
    Boolean(signature) &&
    (Boolean(signature?.alwaysShow) ||
      hasText(signature?.text) ||
      hasText(signature?.imageData) ||
      hasText(signature?.dateTime));

  if (shouldRenderSignatureSection) {
    y += 2;
    ensureSpace(signatureLayout === "appendectomy" ? 36 : 30, 20);
    drawRule();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    if (signatureLayout !== "appendectomy") {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Signature", margin, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    }

    const signatureName = hasText(signature?.text) ? signature?.text : "";
    const signatureDate = hasText(signature?.dateTime)
      ? formatDateTimeDDMMYYYYWithDashes(signature?.dateTime || "") || signature?.dateTime
      : "";
    const signatureNameLine = hasText(signatureName) ? `Name: ${signatureName}` : signature?.alwaysShow ? "Name:" : "";
    const signatureDateLine = hasText(signatureDate)
      ? `Date and Time: ${signatureDate}`
      : signature?.alwaysShow
        ? "Date and Time:"
        : "";

    if (signatureLayout === "appendectomy") {
      const signatureCol1X = margin;
      const signatureCol2X = margin + 100;
      const signatureY = y;
      const signatureLabel = "Surgeon's Signature:";
      const dateLabel = "Date & Time:";

      pdf.setFont("helvetica", "bold");
      pdf.text(signatureLabel, signatureCol1X, signatureY);
      pdf.text(dateLabel, signatureCol2X, signatureY);
      pdf.setFont("helvetica", "normal");

      const signatureValueX = signatureCol1X + pdf.getTextWidth(signatureLabel) + 2;
      const dateValueX = signatureCol2X + pdf.getTextWidth(dateLabel) + 2;

      if (hasText(signatureDate)) {
        pdf.text(signatureDate, dateValueX, signatureY);
      }

      let signatureBottomY = signatureY + 8;
      if (hasText(signature?.imageData)) {
        const imageData = String(signature?.imageData);
        const { width, height } = await calculateSignatureDimensions(imageData);
        const imageY = signatureY - height + 3;
        pdf.addImage(imageData, detectImageFormat(imageData), signatureValueX, imageY, width, height);
        signatureBottomY = Math.max(signatureBottomY, imageY + height + 3);
      } else if (hasText(signatureName)) {
        pdf.text(signatureName, signatureValueX, signatureY);
      }

      y = signatureBottomY + 4;
    } else {
      if (hasText(signatureNameLine) || hasText(signatureDateLine)) {
        drawTwoColRow(signatureNameLine, signatureDateLine);
      }

      if (hasText(signature?.imageData)) {
        const { width, height } = await calculateSignatureDimensions(signature?.imageData as string);
        pdf.addImage(
          signature?.imageData as string,
          detectImageFormat(signature?.imageData as string),
          margin,
          y,
          width,
          height,
        );
        y += height + 3;
      }
    }
  }

  const blob = pdf.output("blob");
  return { success: true as const, blob };
};
