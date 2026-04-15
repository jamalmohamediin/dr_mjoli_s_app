import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import { getFullASAText } from "@/utils/asaDescriptions";
import { createSurgicalDiagramCanvas } from "@/utils/createSurgicalDiagramCanvas";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { formatPatientGender, normalizePatientInfo } from "@/utils/patientSticker";
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

const generateOpenGeneralSurgeryPdf = async (
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

  const info = normalizePatientInfo(patientInfo || narrativeData?.patientInfo || {});
  const preoperative = narrativeData?.preoperative || {};
  const narrative = narrativeData?.narrative || {};
  const additionalInfo = narrativeData?.additionalInfo || {};

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

    const width = 84;
    const leftLines = pdf.splitTextToSize(left, width);
    const rightLines = pdf.splitTextToSize(right, width);
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

  const drawMultiColumnRow = (
    entries: Array<{ label: string; value: unknown }>,
    columnCount: 2 | 3,
  ) => {
    const gap = 4;
    const contentWidth = pageWidth - margin * 2;
    const columnWidth = (contentWidth - gap * (columnCount - 1)) / columnCount;
    const rowEntries = entries.slice(0, columnCount);
    while (rowEntries.length < columnCount) {
      rowEntries.push({ label: "", value: "" });
    }

    const lineGroups = rowEntries.map((entry) => {
      if (!entry.label) {
        return [];
      }
      return pdf.splitTextToSize(formatLabeledValue(entry.label, entry.value), columnWidth);
    });

    const lineCount = Math.max(1, ...lineGroups.map((lines) => lines.length));
    ensureSpace(lineCount * lineHeight + 1);

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      rowEntries.forEach((_, columnIndex) => {
        const line = lineGroups[columnIndex][lineIndex];
        if (!line) {
          return;
        }

        const x = margin + columnIndex * (columnWidth + gap);
        pdf.text(line, x, y);
      });
      y += lineHeight;
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

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Patient Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const gender = formatPatientGender(info);
  const asaText = hasText(info.asaScore) ? getFullASAText(info.asaScore) : "";

  drawTwoColRow(
    `Patient Name: ${formatAnswerValue(info.name || "")}`,
    `Patient ID: ${stringifyValue(info.patientId || "")}`,
  );
  drawTwoColRow(
    `Date of Birth: ${formatDateDDMMYYYYWithDashes(info.dateOfBirth)}`,
    `Age / Sex: ${formatAnswerValue([info.age, gender].filter(Boolean).join(" / "))}`,
  );
  drawTwoColRow(
    `Weight / Height: ${[info.weight ? `${info.weight} kg` : "", info.height ? `${info.height} cm` : ""]
      .filter(Boolean)
      .join(" / ")}`,
    `BMI: ${info.bmi || ""}`,
  );
  drawTwoColRow(
    `ASA Score: ${formatAnswerValue(asaText)}`,
    hasText(info.asaNotes) ? `ASA Notes: ${formatAnswerValue(info.asaNotes)}` : "",
  );

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
        label: "Duration of Procedure",
        value: preoperative.duration ? `${preoperative.duration} min` : "",
      },
    ],
    3,
  );
  drawMultiColumnRow(
    [
      { label: "Urgency", value: preoperative.urgency },
      {
        label: "Pre-Operative Imaging",
        value: joinSelections(preoperative.imaging, preoperative.imagingOther),
      },
    ],
    2,
  );

  const narrativeEntries = [
    { label: "Operation Done", value: narrative.operationDone },
    { label: "Operative Findings", value: narrative.operativeFindings },
    { label: "Operation Details", value: narrative.operationDetails },
    { label: "Specimens Taken", value: narrative.specimensTaken },
    { label: "Points of Difficulty", value: narrative.pointsOfDifficulty },
    { label: "Intra-Operative Complications", value: narrative.intraoperativeComplications },
    { label: "Post-Operative Management", value: narrative.postOperativeManagement },
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
      const textValue = formatLabeledValue(entry.label, entry.value);
      const lines = pdf.splitTextToSize(textValue, leftColumnWidth);
      lines.forEach((line: string) => {
        pdf.text(line, margin, narrativeY);
        narrativeY += lineHeight;
      });
      narrativeY += 1;
    });

    const { diagramBottomY } = drawRectalStylePortsAndIncisions({
      pdf,
      x: rightColumnX,
      y,
      pageHeight,
      diagramCanvas: diagramImageData,
      fallbackLabel: "NO DIAGRAM MARKINGS",
    });

    y = Math.max(narrativeY, diagramBottomY + 2);
  }

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
    `Doctor: ${formatAnswerValue(additionalInfo.doctorName || "")}`,
    `Date and Time: ${
      formatDateTimeDDMMYYYYWithDashes(additionalInfo.dateTime || "") || additionalInfo.dateTime || ""
    }`,
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

  const normalizedValue = formatAnswerValue(value);

  if (hasText(normalizedValue)) {
    const lines = pdf.splitTextToSize(
      `${toUiTitleCase(label)}: ${normalizedValue}`,
      pageWidth - margin * 2,
    );
    lines.forEach((line: string) => {
      pdf.text(line, margin, yRef.value);
      yRef.value += lineHeight;
    });
  } else {
    pdf.text(`${toUiTitleCase(label)}:`, margin, yRef.value);
    yRef.value += lineHeight;
  }

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.line(margin, yRef.value + 0.5, pageWidth - margin, yRef.value + 0.5);
  yRef.value += 7;
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

  const info = normalizePatientInfo(patientInfo || narrativeData?.patientInfo || {});
  const preoperative = narrativeData?.preoperative || {};
  const access = narrativeData?.access || {};
  const narrative = narrativeData?.narrative || {};
  const additionalInfo = narrativeData?.additionalInfo || {};
  const additionalNotes = stringifyValue(narrativeData?.procedureFindings?.additionalNotes);

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

    const width = 84;
    const leftLines = pdf.splitTextToSize(left, width);
    const rightLines = pdf.splitTextToSize(right, width);
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

  const drawMultiColumnRow = (
    entries: Array<{ label: string; value: unknown }>,
    columnCount: 2 | 3,
  ) => {
    const gap = 4;
    const contentWidth = pageWidth - margin * 2;
    const columnWidth = (contentWidth - gap * (columnCount - 1)) / columnCount;
    const rowEntries = entries.slice(0, columnCount);
    while (rowEntries.length < columnCount) {
      rowEntries.push({ label: "", value: "" });
    }

    const lineGroups = rowEntries.map((entry) => {
      if (!entry.label) {
        return [];
      }
      return pdf.splitTextToSize(formatLabeledValue(entry.label, entry.value), columnWidth);
    });

    const lineCount = Math.max(1, ...lineGroups.map((lines) => lines.length));
    ensureSpace(lineCount * lineHeight + 1);

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      rowEntries.forEach((_, columnIndex) => {
        const line = lineGroups[columnIndex][lineIndex];
        if (!line) {
          return;
        }

        const x = margin + columnIndex * (columnWidth + gap);
        pdf.text(line, x, y);
      });
      y += lineHeight;
    }
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
      const leftValue = formatLabeledValue(leftEntry.label, leftEntry.value);
      const rightValue = rightEntry
        ? formatLabeledValue(rightEntry.label, rightEntry.value)
        : "";
      drawTwoColRow(leftValue, rightValue);
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

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Patient Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const gender = formatPatientGender(info);
  const asaText = hasText(info.asaScore) ? getFullASAText(info.asaScore) : "";

  drawTwoColRow(
    `Patient Name: ${formatAnswerValue(info.name || "")}`,
    `Patient ID: ${stringifyValue(info.patientId || "")}`,
  );
  drawTwoColRow(
    `Date of Birth: ${formatDateDDMMYYYYWithDashes(info.dateOfBirth)}`,
    `Age / Sex: ${formatAnswerValue([info.age, gender].filter(Boolean).join(" / "))}`,
  );
  drawTwoColRow(
    `Weight / Height: ${[info.weight ? `${info.weight} kg` : "", info.height ? `${info.height} cm` : ""]
      .filter(Boolean)
      .join(" / ")}`,
    `BMI: ${info.bmi || ""}`,
  );
  drawTwoColRow(
    `ASA Score: ${formatAnswerValue(asaText)}`,
    hasText(info.asaNotes) ? `ASA Notes: ${formatAnswerValue(info.asaNotes)}` : "",
  );

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
        label: "Duration of Procedure",
        value: preoperative.duration ? `${preoperative.duration} min` : "",
      },
    ],
    3,
  );
  drawMultiColumnRow(
    [
      { label: "Urgency", value: preoperative.urgency },
      {
        label: "Pre-Operative Imaging",
        value: joinSelections(preoperative.imaging, preoperative.imagingOther),
      },
    ],
    2,
  );

  drawSection("Abdominal Access and Incisions", [
    { label: "Approach", value: access.approach },
    {
      label: "Reason for Conversion",
      value: joinSelections(access.reasonForConversion, access.reasonForConversionOther),
    },
  ]);

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
      const textValue = formatLabeledValue(entry.label, entry.value);
      const lines = pdf.splitTextToSize(textValue, leftColumnWidth);
      lines.forEach((line: string) => {
        pdf.text(line, margin, narrativeY);
        narrativeY += lineHeight;
      });
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

  const complicationEntries = toArray(narrative.intraoperativeComplications).filter(
    (entry) => entry !== "Other",
  );
  if (hasText(narrative.intraoperativeComplicationsOther)) {
    complicationEntries.push(`Details: ${formatAnswerValue(narrative.intraoperativeComplicationsOther)}`);
  }

  const yRef = { value: y };
  drawPromptLineSection(
    pdf,
    "COMPLICATIONS",
    "Complications",
    complicationEntries.join(", "),
    margin,
    pageWidth,
    pageHeight,
    lineHeight,
    yRef,
  );
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
    `Doctor: ${formatAnswerValue(additionalInfo.doctorName || "")}`,
    `Date and Time: ${
      formatDateTimeDDMMYYYYWithDashes(additionalInfo.dateTime || "") || additionalInfo.dateTime || ""
    }`,
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
