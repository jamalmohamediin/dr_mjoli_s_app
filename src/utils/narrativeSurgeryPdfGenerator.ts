import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import { createSurgicalDiagramCanvas } from "@/utils/createSurgicalDiagramCanvas";
import { formatDateTimeDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { drawStandardPatientInformation } from "@/utils/pdfPatientInfoLayout";
import { hasText, joinSelections, toArray, toUiTitleCase } from "@/utils/templateDataHelpers";

const parseMarkings = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const stringifyValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return toArray(value).join(", ");
  }

  if (typeof value === "number") {
    return String(value);
  }

  return String(value || "").trim();
};

const formatAnswerValue = (value: unknown) => toUiTitleCase(stringifyValue(value));

const formatLabeledValue = (
  label: string,
  value: unknown,
  options: { titleCaseValue?: boolean } = {},
) => {
  const rawValue = options.titleCaseValue === false ? stringifyValue(value) : formatAnswerValue(value);
  return rawValue ? `${toUiTitleCase(label)}: ${rawValue}` : `${toUiTitleCase(label)}:`;
};

const resolveSignatureDateTimeText = (source: any) => {
  const additionalInfo = source?.additionalInfo || {};
  const rawDateTime =
    stringifyValue(additionalInfo?.dateTime) ||
    stringifyValue(additionalInfo?.date) ||
    stringifyValue(additionalInfo?.dateAndTime) ||
    stringifyValue(source?.dateTime) ||
    stringifyValue(source?.signature?.dateTime) ||
    "";

  return formatDateTimeDDMMYYYYWithDashes(rawDateTime) || rawDateTime;
};

const generateOpenGeneralSurgeryPdf = async (
  title: string,
  narrativeData: any,
  patientInfo: any,
) => {
  const pdf = new jsPDF("portrait", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const lineHeight = 4.5;
  let y = margin;

  const preoperative = narrativeData?.preoperative || {};
  const narrative = narrativeData?.narrative || {};
  const additionalInfo = narrativeData?.additionalInfo || {};
  const diagnosisText = joinSelections(
    preoperative.diagnosis ||
      preoperative.preOperativeDiagnosis ||
      preoperative.preoperativeDiagnosis,
    preoperative.diagnosisOther ||
      preoperative.preOperativeDiagnosisOther ||
      preoperative.preoperativeDiagnosisOther,
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

  type LabeledEntry = { label: string; value: unknown };
  type LabeledCell = {
    labelLines: string[];
    valueLines: string[];
    lineCount: number;
    labelColumnWidth: number;
    hasContent: boolean;
  };

  const buildLabeledCell = (
    entry: LabeledEntry | null | undefined,
    width: number,
    labelRatio = 0.4,
  ): LabeledCell => {
    const label = toUiTitleCase(String(entry?.label || "").trim());
    const value = formatAnswerValue(entry?.value);

    if (!label && !hasText(value)) {
      return {
        labelLines: [],
        valueLines: [],
        lineCount: 0,
        labelColumnWidth: 0,
        hasContent: false,
      };
    }

    if (!label) {
      const valueLines = hasText(value) ? pdf.splitTextToSize(value, width) : [];
      return {
        labelLines: [],
        valueLines,
        lineCount: Math.max(valueLines.length, 1),
        labelColumnWidth: 0,
        hasContent: valueLines.length > 0,
      };
    }

    const labelText = `${label}:`;
    const labelColumnWidth = Math.min(36, Math.max(24, width * labelRatio));
    const valueColumnWidth = Math.max(10, width - labelColumnWidth - 1.5);
    const labelLines = pdf.splitTextToSize(labelText, labelColumnWidth);
    const valueLines = hasText(value) ? pdf.splitTextToSize(value, valueColumnWidth) : [];
    const lineCount = Math.max(labelLines.length, valueLines.length, 1);

    return {
      labelLines,
      valueLines,
      lineCount,
      labelColumnWidth,
      hasContent: true,
    };
  };

  const drawLabeledCellLine = (
    cell: LabeledCell,
    x: number,
    lineIndex: number,
    yPosition: number,
  ) => {
    if (!cell.hasContent) {
      return;
    }

    const fieldLine = cell.labelLines[lineIndex];
    const valueLine = cell.valueLines[lineIndex];

    if (fieldLine) {
      pdf.setFont("helvetica", "bold");
      pdf.text(fieldLine, x, yPosition);
    }

    if (valueLine) {
      pdf.setFont("helvetica", "normal");
      const valueX = cell.labelColumnWidth > 0 ? x + cell.labelColumnWidth + 1.5 : x;
      pdf.text(valueLine, valueX, yPosition);
    }
  };

  const drawTwoColRow = (left?: LabeledEntry, right?: LabeledEntry) => {
    const width = 84;
    const leftCell = buildLabeledCell(left, width, 0.42);
    const rightCell = buildLabeledCell(right, width, 0.42);

    if (!leftCell.hasContent && !rightCell.hasContent) {
      return;
    }

    const lineCount = Math.max(leftCell.lineCount, rightCell.lineCount, 1);
    ensureSpace(lineCount * lineHeight + 1);

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      drawLabeledCellLine(leftCell, margin, lineIndex, y);
      drawLabeledCellLine(rightCell, margin + 96, lineIndex, y);
      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawMultiColumnRow = (
    entries: LabeledEntry[],
    columnCount: 2 | 3,
  ) => {
    const gap = 4;
    const contentWidth = pageWidth - margin * 2;
    const columnWidth = (contentWidth - gap * (columnCount - 1)) / columnCount;
    const rowEntries = entries.slice(0, columnCount);
    while (rowEntries.length < columnCount) {
      rowEntries.push({ label: "", value: "" });
    }

    const cells = rowEntries.map((entry) =>
      buildLabeledCell(entry.label ? entry : null, columnWidth, 0.44),
    );
    if (cells.every((cell) => !cell.hasContent)) {
      return;
    }

    const lineCount = Math.max(1, ...cells.map((cell) => cell.lineCount));
    ensureSpace(lineCount * lineHeight + 1);

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      cells.forEach((cell, columnIndex) => {
        const x = margin + columnIndex * (columnWidth + gap);
        drawLabeledCellLine(cell, x, lineIndex, y);
      });
      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawFullWidthLabeledRows = (entries: LabeledEntry[]) => {
    const width = pageWidth - margin * 2;

    entries.forEach((entry) => {
      const cell = buildLabeledCell(entry, width, 0.3);
      if (!cell.hasContent) {
        return;
      }

      ensureSpace(cell.lineCount * lineHeight + 1, 24);
      for (let lineIndex = 0; lineIndex < cell.lineCount; lineIndex += 1) {
        drawLabeledCellLine(cell, margin, lineIndex, y);
        y += lineHeight;
      }
      y += 1;
    });

    pdf.setFont("helvetica", "normal");
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

  y = drawStandardPatientInformation({
    pdf,
    patientInfo: patientInfo || narrativeData?.patientInfo,
    y,
    margin,
    pageWidth,
    pageHeight,
    lineHeight,
  });

  y += 2;
  ensureSpace(20);
  drawRule();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Preoperative Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  drawMultiColumnRow(
    [
      { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
      { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", ") },
      { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
    ],
    3,
  );
  drawMultiColumnRow(
    [
      { label: "Start Time", value: preoperative.startTime },
      { label: "End Time", value: preoperative.endTime },
      {
        label: "Duration",
        value: preoperative.duration ? `${preoperative.duration} min` : "",
      },
    ],
    3,
  );
  drawMultiColumnRow(
    [
      { label: "Urgency", value: preoperative.urgency },
      {
        label: "Imaging",
        value: joinSelections(preoperative.imaging, preoperative.imagingOther),
      },
      { label: hasText(diagnosisText) ? "Diagnosis" : "", value: diagnosisText },
    ],
    3,
  );

  const narrativeEntries = [
    { label: "Operation Done", value: narrative.operationDone },
    { label: "Operative Findings", value: narrative.operativeFindings },
    { label: "Operation Details", value: narrative.operationDetails },
    { label: "Specimens Taken", value: narrative.specimensTaken },
    { label: "Points of Difficulty", value: narrative.pointsOfDifficulty },
    { label: "Intra-Operative Complications", value: narrative.intraoperativeComplications },
  ].filter((entry) => hasText(formatAnswerValue(entry.value)));

  if (narrativeEntries.length > 0) {
    y += 2;
    ensureSpace(30, 24);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Narrative Report", margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    drawFullWidthLabeledRows(narrativeEntries);
  }

  y += 2;
  ensureSpace(20, 22);
  drawRule();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("POST OPERATIVE MANAGEMENT", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  drawFullWidthLabeledRows([
    {
      label: "Post Operative Management",
      value: narrative.postOperativeManagement,
    },
  ]);

  y += 2;
  ensureSpace(20, 20);
  drawRule();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Doctor Signature", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  drawTwoColRow(
    { label: "Doctor", value: formatAnswerValue(additionalInfo.doctorName || "") },
    {
      label: "Date and Time",
      value: resolveSignatureDateTimeText(narrativeData),
    },
  );

  return {
    success: true as const,
    blob: pdf.output("blob"),
  };
};

const drawPromptLineSection = (
  pdf: jsPDF,
  sectionTitle: string,
  label: string,
  value: string,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  lineHeight: number,
  yRef: { value: number },
  options: { drawBottomLine?: boolean } = {},
) => {
  const ensureSpace = (height = 10, bottomPadding = 20) => {
    if (yRef.value + height > pageHeight - bottomPadding) {
      pdf.addPage();
      yRef.value = margin;
    }
  };

  const drawRule = () => {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, yRef.value, pageWidth - margin, yRef.value);
    yRef.value += 5;
  };

  yRef.value += 2;
  ensureSpace(24, 22);
  drawRule();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(sectionTitle, margin, yRef.value);
  yRef.value += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const sectionWidth = pageWidth - margin * 2;
  const labelColumnWidth = Math.min(46, Math.max(34, sectionWidth * 0.32));
  const valueColumnWidth = Math.max(10, sectionWidth - labelColumnWidth - 2);
  const normalizedValue = formatAnswerValue(value);
  const labelText = `${toUiTitleCase(label)}:`;
  const labelLines = pdf.splitTextToSize(labelText, labelColumnWidth);
  const valueLines = hasText(normalizedValue)
    ? pdf.splitTextToSize(normalizedValue, valueColumnWidth)
    : [];
  const lineCount = Math.max(labelLines.length, valueLines.length, 1);
  ensureSpace(lineCount * lineHeight + 1, 22);

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
    const fieldLine = labelLines[lineIndex];
    const answerLine = valueLines[lineIndex];
    if (fieldLine) {
      pdf.setFont("helvetica", "bold");
      pdf.text(fieldLine, margin, yRef.value);
    }
    if (answerLine) {
      pdf.setFont("helvetica", "normal");
      pdf.text(answerLine, margin + labelColumnWidth + 2, yRef.value);
    }
    yRef.value += lineHeight;
  }

  if (options.drawBottomLine ?? true) {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, yRef.value + 0.5, pageWidth - margin, yRef.value + 0.5);
    yRef.value += 7;
  } else {
    yRef.value += 4;
  }
};

const generateOpenAbdominalSurgeryPdf = async (
  title: string,
  narrativeData: any,
  patientInfo: any,
  diagramImageData: string | null,
) => {
  const pdf = new jsPDF("portrait", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const lineHeight = 4.5;
  const rightColumnX = 114;
  const leftColumnWidth = rightColumnX - margin - 4;
  let y = margin;

  const preoperative = narrativeData?.preoperative || {};
  const access = narrativeData?.access || {};
  const narrative = narrativeData?.narrative || {};
  const additionalInfo = narrativeData?.additionalInfo || {};
  const additionalNotes = stringifyValue(narrativeData?.procedureFindings?.additionalNotes);
  const diagnosisText = joinSelections(
    preoperative.diagnosis ||
      preoperative.preOperativeDiagnosis ||
      preoperative.preoperativeDiagnosis,
    preoperative.diagnosisOther ||
      preoperative.preOperativeDiagnosisOther ||
      preoperative.preoperativeDiagnosisOther,
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

  type LabeledEntry = { label: string; value: unknown };
  type LabeledCell = {
    labelLines: string[];
    valueLines: string[];
    lineCount: number;
    labelColumnWidth: number;
    hasContent: boolean;
  };

  const buildLabeledCell = (
    entry: LabeledEntry | null | undefined,
    width: number,
    labelRatio = 0.4,
  ): LabeledCell => {
    const label = toUiTitleCase(String(entry?.label || "").trim());
    const value = formatAnswerValue(entry?.value);

    if (!label && !hasText(value)) {
      return {
        labelLines: [],
        valueLines: [],
        lineCount: 0,
        labelColumnWidth: 0,
        hasContent: false,
      };
    }

    if (!label) {
      const valueLines = hasText(value) ? pdf.splitTextToSize(value, width) : [];
      return {
        labelLines: [],
        valueLines,
        lineCount: Math.max(valueLines.length, 1),
        labelColumnWidth: 0,
        hasContent: valueLines.length > 0,
      };
    }

    const labelText = `${label}:`;
    const labelColumnWidth = Math.min(36, Math.max(24, width * labelRatio));
    const valueColumnWidth = Math.max(10, width - labelColumnWidth - 1.5);
    const labelLines = pdf.splitTextToSize(labelText, labelColumnWidth);
    const valueLines = hasText(value) ? pdf.splitTextToSize(value, valueColumnWidth) : [];
    const lineCount = Math.max(labelLines.length, valueLines.length, 1);

    return {
      labelLines,
      valueLines,
      lineCount,
      labelColumnWidth,
      hasContent: true,
    };
  };

  const drawLabeledCellLine = (
    cell: LabeledCell,
    x: number,
    lineIndex: number,
    yPosition: number,
  ) => {
    if (!cell.hasContent) {
      return;
    }

    const fieldLine = cell.labelLines[lineIndex];
    const valueLine = cell.valueLines[lineIndex];

    if (fieldLine) {
      pdf.setFont("helvetica", "bold");
      pdf.text(fieldLine, x, yPosition);
    }

    if (valueLine) {
      pdf.setFont("helvetica", "normal");
      const valueX = cell.labelColumnWidth > 0 ? x + cell.labelColumnWidth + 1.5 : x;
      pdf.text(valueLine, valueX, yPosition);
    }
  };

  const drawTwoColRow = (left?: LabeledEntry, right?: LabeledEntry) => {
    const width = 84;
    const leftCell = buildLabeledCell(left, width, 0.42);
    const rightCell = buildLabeledCell(right, width, 0.42);

    if (!leftCell.hasContent && !rightCell.hasContent) {
      return;
    }

    const lineCount = Math.max(leftCell.lineCount, rightCell.lineCount, 1);
    ensureSpace(lineCount * lineHeight + 1);

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      drawLabeledCellLine(leftCell, margin, lineIndex, y);
      drawLabeledCellLine(rightCell, margin + 96, lineIndex, y);
      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawMultiColumnRow = (
    entries: LabeledEntry[],
    columnCount: 2 | 3,
  ) => {
    const gap = 4;
    const contentWidth = pageWidth - margin * 2;
    const columnWidth = (contentWidth - gap * (columnCount - 1)) / columnCount;
    const rowEntries = entries.slice(0, columnCount);
    while (rowEntries.length < columnCount) {
      rowEntries.push({ label: "", value: "" });
    }

    const cells = rowEntries.map((entry) =>
      buildLabeledCell(entry.label ? entry : null, columnWidth, 0.44),
    );
    if (cells.every((cell) => !cell.hasContent)) {
      return;
    }

    const lineCount = Math.max(1, ...cells.map((cell) => cell.lineCount));
    ensureSpace(lineCount * lineHeight + 1);

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      cells.forEach((cell, columnIndex) => {
        const x = margin + columnIndex * (columnWidth + gap);
        drawLabeledCellLine(cell, x, lineIndex, y);
      });
      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawSection = (sectionTitle: string, entries: { label: string; value: unknown }[]) => {
    const filteredEntries = entries.filter((entry) => hasText(stringifyValue(entry.value)));
    if (filteredEntries.length === 0) {
      return;
    }

    y += 2;
    ensureSpace(16);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(sectionTitle, margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    for (let index = 0; index < filteredEntries.length; index += 2) {
      const leftEntry = filteredEntries[index];
      const rightEntry = filteredEntries[index + 1];
      drawTwoColRow(leftEntry, rightEntry);
    }
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

  y = drawStandardPatientInformation({
    pdf,
    patientInfo: patientInfo || narrativeData?.patientInfo,
    y,
    margin,
    pageWidth,
    pageHeight,
    lineHeight,
  });

  y += 2;
  ensureSpace(20);
  drawRule();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Preoperative Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  drawMultiColumnRow(
    [
      { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
      { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", ") },
      { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
    ],
    3,
  );
  drawMultiColumnRow(
    [
      { label: "Start Time", value: preoperative.startTime },
      { label: "End Time", value: preoperative.endTime },
      {
        label: "Duration",
        value: preoperative.duration ? `${preoperative.duration} min` : "",
      },
    ],
    3,
  );
  drawMultiColumnRow(
    [
      { label: "Urgency", value: preoperative.urgency },
      {
        label: "Imaging",
        value: joinSelections(preoperative.imaging, preoperative.imagingOther),
      },
      { label: hasText(diagnosisText) ? "Diagnosis" : "", value: diagnosisText },
    ],
    3,
  );

  drawSection("Abdominal Access and Incisions", [
    { label: "Approach", value: access.approach },
    {
      label: "Reason for Conversion",
      value: joinSelections(access.reasonForConversion, access.reasonForConversionOther),
    },
  ]);

  const complicationEntries = toArray(narrative.intraoperativeComplications).filter(
    (entry) => entry !== "Other",
  );
  if (hasText(narrative.intraoperativeComplicationsOther)) {
    complicationEntries.push(`Details: ${formatAnswerValue(narrative.intraoperativeComplicationsOther)}`);
  }

  const narrativeEntries = [
    { label: "Operation Done", value: narrative.operationDone },
    { label: "Operative Findings", value: narrative.operativeFindings },
    { label: "Operation Details", value: narrative.operationDetails },
    {
      label: "Specimens",
      value: joinSelections(narrative.specimensTaken, narrative.specimensTakenOther),
    },
    {
      label: "Points of Difficulty",
      value: joinSelections(narrative.pointsOfDifficulty, narrative.pointsOfDifficultyOther),
    },
    { label: "Complications", value: complicationEntries.join(", ") },
  ].filter((entry) => hasText(formatAnswerValue(entry.value)));

  if (narrativeEntries.length > 0 || diagramImageData) {
    y += 2;
    ensureSpace(96, 32);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Narrative Report", margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let narrativeY = y;
    narrativeEntries.forEach((entry) => {
      const narrativeCell = buildLabeledCell(entry, leftColumnWidth, 0.42);
      for (let lineIndex = 0; lineIndex < narrativeCell.lineCount; lineIndex += 1) {
        drawLabeledCellLine(narrativeCell, margin, lineIndex, narrativeY);
        narrativeY += lineHeight;
      }
      narrativeY += 1;
    });

    const { diagramBottomY } = drawRectalStylePortsAndIncisions({
      pdf,
      x: rightColumnX,
      y,
      pageHeight,
      diagramCanvas: diagramImageData,
      fallbackLabel: "OPEN ABDOMINAL SURGERY DIAGRAM",
    });

    y = Math.max(narrativeY, diagramBottomY + 2);
  }

  const yRef = { value: y };
  drawPromptLineSection(
    pdf,
    "ADDITIONAL NOTES",
    "Additional Notes",
    additionalNotes,
    margin,
    pageWidth,
    pageHeight,
    lineHeight,
    yRef,
    { drawBottomLine: false },
  );
  drawPromptLineSection(
    pdf,
    "POST OPERATIVE MANAGEMENT",
    "Post Operative Management",
    stringifyValue(narrative.postOperativeManagement),
    margin,
    pageWidth,
    pageHeight,
    lineHeight,
    yRef,
    { drawBottomLine: false },
  );
  y = yRef.value;

  y += 2;
  ensureSpace(20, 20);
  drawRule();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Doctor Signature", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  drawTwoColRow(
    { label: "Doctor", value: formatAnswerValue(additionalInfo.doctorName || "") },
    {
      label: "Date and Time",
      value: resolveSignatureDateTimeText(narrativeData),
    },
  );

  return {
    success: true as const,
    blob: pdf.output("blob"),
  };
};

export const generateNarrativeSurgeryPDF = async (
  title: string,
  narrativeData: any,
  patientInfo: any,
  variant: "general" | "abdominal",
) => {
  const diagramImageData = await createSurgicalDiagramCanvas(
    appendectomyImage,
    parseMarkings(narrativeData?.procedureFindings?.findings || ""),
    1.5,
  );

  if (variant === "general") {
    return generateOpenGeneralSurgeryPdf(title, narrativeData, patientInfo, diagramImageData);
  }

  return generateOpenAbdominalSurgeryPdf(title, narrativeData, patientInfo, diagramImageData);
};
