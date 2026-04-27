import jsPDF from "jspdf";
import {
  formatDateTimeDDMMYYYYWithDashes,
  getLocalDateTimeValue,
} from "@/utils/dateFormatter";
import { drawStandardPatientInformation } from "@/utils/pdfPatientInfoLayout";
import { getPdfSafePatientInfo } from "@/utils/patientSticker";
import {
  hasText,
  isPostPreoperativeAlwaysVisibleField,
  joinSelections,
  toArray,
  toUiTitleCase,
} from "@/utils/templateDataHelpers";

const hasSelection = (values: unknown, option: string) => toArray(values).includes(option);

const toCsv = (values: unknown, titleCase = true) =>
  toArray(values)
    .map((value) => (titleCase ? toUiTitleCase(value) : value))
    .join(", ");

const addLine = (list: string[], label: string, value: unknown) => {
  const csv = toCsv(value);
  if (csv) {
    list.push(`${toUiTitleCase(label)}: ${csv}`);
  }
};

const formatValue = (value: unknown, titleCase = true) => {
  if (Array.isArray(value)) {
    return toArray(value)
      .map((entry) => (titleCase ? toUiTitleCase(entry) : entry))
      .join(", ");
  }

  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  return titleCase ? toUiTitleCase(normalized) : normalized;
};

const detectImageFormat = (value: string): "PNG" | "JPEG" => {
  const lower = value.toLowerCase();
  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg")) {
    return "JPEG";
  }

  return "PNG";
};

export const generateGastroscopyPDF = async (data: any, patientInfo?: any) => {
  const preoperative = data?.preoperative || {};
  const pharynxLarynx = data?.pharynxLarynx || {};
  const oesophagus = data?.oesophagus || {};
  const stomach = data?.stomach || {};
  const duodenum = data?.duodenum || {};
  const interventions = data?.interventions || {};
  const diagnosis = data?.diagnosis || {};
  const additionalInfo = data?.additionalInfo || {};
  const diagram = data?.diagram || {};
  const diagramImageData =
    String(diagram?.canvasImageData || "").trim() ||
    String(data?.gastroscopyCanvasData || "").trim() ||
    String(data?.gastroscopyFindings?.canvasImageData || "").trim() ||
    "";

  const oesophagusDetails: string[] = [];
  if (hasSelection(oesophagus.findings, "Barrett’s Oesophagus")) {
    const barrett = joinSelections(oesophagus.barrettType);
    const length = oesophagus.barrettLength ? `Length ${oesophagus.barrettLength} cm` : "";
    const value = [barrett, length].filter(Boolean).join(", ");
    if (value) oesophagusDetails.push(`Barrett’s Oesophagus: ${value}`);
  }
  if (hasSelection(oesophagus.findings, "Candida Oesophagitis")) {
    addLine(oesophagusDetails, "Candida Oesophagitis", oesophagus.candidaSeverity);
  }
  if (hasSelection(oesophagus.findings, "Oesophageal Ulcer")) {
    addLine(oesophagusDetails, "Oesophageal Ulcer", oesophagus.ulcerAppearance);
  }
  if (hasSelection(oesophagus.findings, "Oesophagitis")) {
    addLine(oesophagusDetails, "Oesophagitis", oesophagus.oesophagitisGrade);
  }
  if (hasSelection(oesophagus.findings, "Hiatus Hernia")) {
    const grades = toCsv(oesophagus.hiatusHerniaGrade);
    const length = oesophagus.hiatusHerniaLength
      ? `Length ${oesophagus.hiatusHerniaLength} cm`
      : "";
    const value = [grades, length].filter(Boolean).join(", ");
    if (value) oesophagusDetails.push(`Hiatus Hernia: ${value}`);
  }
  if (hasSelection(oesophagus.findings, "Kaposi Sarcoma")) {
    addLine(oesophagusDetails, "Kaposi Sarcoma", oesophagus.kaposiMultiplicity);
  }
  if (hasSelection(oesophagus.findings, "Mallory-Weiss Tear")) {
    addLine(oesophagusDetails, "Mallory-Weiss Tear", oesophagus.malloryWeissBleeding);
  }
  if (hasSelection(oesophagus.findings, "Oesophageal Web")) {
    addLine(oesophagusDetails, "Oesophageal Web", oesophagus.webLocation);
  }
  if (hasSelection(oesophagus.findings, "Stricture")) {
    addLine(oesophagusDetails, "Stricture", oesophagus.strictureType);
  }
  if (hasSelection(oesophagus.findings, "Malignancy")) {
    const location = toCsv(oesophagus.malignancyLocation);
    const length = oesophagus.malignancyLength
      ? `Length ${oesophagus.malignancyLength} cm`
      : "";
    const value = [location, length].filter(Boolean).join(", ");
    if (value) oesophagusDetails.push(`Malignancy: ${value}`);
  }
  if (hasSelection(oesophagus.findings, "Diverticulum")) {
    addLine(oesophagusDetails, "Diverticulum", oesophagus.diverticulumLocation);
  }
  if (hasSelection(oesophagus.findings, "Varices")) {
    addLine(oesophagusDetails, "Varices", oesophagus.varicesGrade);
  }
  if (hasSelection(oesophagus.findings, "Other") && hasText(oesophagus.other)) {
    oesophagusDetails.push(`Other: ${oesophagus.other}`);
  }

  const stomachDetails: string[] = [];
  if (hasSelection(stomach.findings, "Ulcer")) {
    addLine(stomachDetails, "Ulcer", stomach.ulcerSelections);
    addLine(stomachDetails, "Forrest Classification", stomach.forrestClassification);
  }
  if (hasSelection(stomach.findings, "Mass / Tumour")) {
    addLine(stomachDetails, "Mass / Tumour", stomach.massMorphology);
  }
  if (hasSelection(stomach.findings, "Erosion(s)")) {
    addLine(stomachDetails, "Erosion(s)", stomach.erosionSelections);
  }
  if (hasSelection(stomach.findings, "Gastritis")) {
    const types = joinSelections(stomach.gastritisType, stomach.gastritisTypeOther);
    if (types) stomachDetails.push(`Gastritis Type: ${types}`);
    addLine(stomachDetails, "Gastritis Severity", stomach.gastritisSeverity);
  }
  if (hasSelection(stomach.findings, "GIST")) {
    addLine(stomachDetails, "GIST", stomach.gistMucosa);
  }
  if (hasSelection(stomach.findings, "Kaposi Sarcoma")) {
    addLine(stomachDetails, "Kaposi Sarcoma", stomach.kaposiPattern);
  }
  if (hasSelection(stomach.findings, "Gastric Antral Vascular Ectasia (GAVE)")) {
    addLine(stomachDetails, "Gastric Antral Vascular Ectasia (GAVE)", stomach.gavePattern);
  }
  if (hasSelection(stomach.findings, "Varices")) {
    addLine(stomachDetails, "Varices Number", stomach.varicesNumber);
    addLine(stomachDetails, "Varices Classification", stomach.varicesClassification);
  }
  if (hasSelection(stomach.findings, "Polyps")) {
    addLine(stomachDetails, "Polyps", stomach.polypNumber);
    addLine(stomachDetails, "Polyp Size", stomach.polypSize);
  }
  if (hasSelection(stomach.findings, "Portal Gastropathy")) {
    addLine(stomachDetails, "Portal Gastropathy Severity", stomach.portalGastropathySeverity);
    addLine(stomachDetails, "Portal Gastropathy Mucosa", stomach.portalGastropathyMucosa);
  }
  if (hasSelection(stomach.findings, "Stricture")) {
    addLine(stomachDetails, "Stricture Overlying Mucosa", stomach.strictureMucosa);
  }
  if (hasSelection(stomach.findings, "Other") && hasText(stomach.other)) {
    stomachDetails.push(`Other: ${stomach.other}`);
  }

  const duodenumDetails: string[] = [];
  if (hasSelection(duodenum.findings, "Duodenitis")) {
    addLine(duodenumDetails, "Duodenitis Severity", duodenum.duodenitisSeverity);
    addLine(
      duodenumDetails,
      "Duodenitis Additional Findings",
      duodenum.duodenitisWithErosions,
    );
  }
  if (hasSelection(duodenum.findings, "Ulcer")) {
    addLine(duodenumDetails, "Ulcer", duodenum.ulcerSelections);
    addLine(duodenumDetails, "Forrest Classification", duodenum.forrestClassification);
  }
  if (hasSelection(duodenum.findings, "Polyp")) {
    addLine(duodenumDetails, "Polyp", duodenum.polypNumber);
    addLine(duodenumDetails, "Polyp Size", duodenum.polypSize);
  }
  if (hasSelection(duodenum.findings, "Tumour")) {
    addLine(duodenumDetails, "Tumour", duodenum.tumourMorphology);
  }
  if (hasSelection(duodenum.findings, "Stricture")) {
    addLine(duodenumDetails, "Stricture Overlying Mucosa", duodenum.strictureMucosa);
  }
  if (hasSelection(duodenum.findings, "Other") && hasText(duodenum.other)) {
    duodenumDetails.push(`Other: ${duodenum.other}`);
  }

  const interventionDetails: string[] = [];
  if (hasSelection(interventions.interventions, "Dilatation")) {
    addLine(interventionDetails, "Dilatation Type", interventions.dilatationTypes);
    if (hasText(interventions.maxDilatationMm)) {
      interventionDetails.push(`Max Dilatation (mm): ${interventions.maxDilatationMm}`);
    }
  }
  if (hasSelection(interventions.interventions, "Banding") && hasText(interventions.bandingCount)) {
    interventionDetails.push(`No Of Bands Applied: ${interventions.bandingCount}`);
  }
  if (hasSelection(interventions.interventions, "Haemoclip") && hasText(interventions.clipCount)) {
    interventionDetails.push(`No Of Clips Applied: ${interventions.clipCount}`);
  }
  if (hasSelection(interventions.interventions, "Stent Insertion")) {
    addLine(interventionDetails, "Stent Type", interventions.stentTypes);
    if (hasText(interventions.stentLengthCm)) {
      interventionDetails.push(`Stent Length (cm): ${interventions.stentLengthCm}`);
    }
    if (hasText(interventions.stentDiameterMm)) {
      interventionDetails.push(`Stent Diameter (mm): ${interventions.stentDiameterMm}`);
    }
  }
  if (hasSelection(interventions.interventions, "Injection Therapy") && hasText(interventions.injectionAgent)) {
    interventionDetails.push(`Injection Agent: ${interventions.injectionAgent}`);
  }
  if (hasSelection(interventions.interventions, "Other") && hasText(interventions.other)) {
    interventionDetails.push(`Other: ${interventions.other}`);
  }

  const otherSpecimensTakenValue =
    additionalInfo.otherSpecimensTaken === "Yes" && hasText(additionalInfo.otherSpecimensDetails)
      ? `Yes - ${additionalInfo.otherSpecimensDetails}`
      : String(additionalInfo.otherSpecimensTaken || "");

  const legendLines = hasText(diagramImageData)
    ? ["Diagram annotations are included directly in the image."]
    : [];

  const pdf = new jsPDF("portrait", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 4.4;
  const columnWidth = 84;
  let y = margin;
  let postPreoperativeSectionActive = false;

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

  const parseLabeledCell = (text: string, width: number) => {
    const normalized = String(text || "").trim();
    if (!normalized) {
      return {
        labelLines: [] as string[],
        valueLines: [] as string[],
        labelWidth: 0,
        lineCount: 1,
      };
    }

    const separatorIndex = normalized.indexOf(":");
    if (separatorIndex <= 0) {
      const valueLines = pdf.splitTextToSize(normalized, width);
      return {
        labelLines: [] as string[],
        valueLines,
        labelWidth: 0,
        lineCount: Math.max(valueLines.length, 1),
      };
    }

    const labelText = normalized.slice(0, separatorIndex).trim();
    const valueText = normalized.slice(separatorIndex + 1).trim();
    const labelWithColon = `${labelText}:`;
    const inferredLabelWidth = Math.min(
      Math.max(pdf.getTextWidth(labelWithColon) + 2, 24),
      width * 0.52,
    );
    const valueWidth = Math.max(width - inferredLabelWidth - 1, 12);
    const labelLines = pdf.splitTextToSize(labelWithColon, inferredLabelWidth);
    const valueLines = pdf.splitTextToSize(valueText, valueWidth);
    const lineCount = Math.max(labelLines.length, valueLines.length, 1);

    return {
      labelLines,
      valueLines,
      labelWidth: inferredLabelWidth,
      lineCount,
    };
  };

  const drawTwoColRow = (left: string, right: string) => {
    if (!left && !right) return;

    const leftCell = parseLabeledCell(left, columnWidth);
    const rightCell = parseLabeledCell(right, columnWidth);
    const lineCount = Math.max(leftCell.lineCount, rightCell.lineCount, 1);
    ensureSpace(lineCount * lineHeight + 1);

    for (let index = 0; index < lineCount; index += 1) {
      if (leftCell.labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(leftCell.labelLines[index], margin, y);
      }

      if (leftCell.valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(leftCell.valueLines[index], margin + leftCell.labelWidth + 1, y);
      }

      if (rightCell.labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(rightCell.labelLines[index], margin + 96, y);
      }

      if (rightCell.valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(
          rightCell.valueLines[index],
          margin + 96 + rightCell.labelWidth + 1,
          y,
        );
      }

      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawThreeColRow = (first: string, second: string, third: string) => {
    if (!first && !second && !third) return;
    const gap = 4;
    const threeColWidth = (contentWidth - gap * 2) / 3;
    const firstCell = parseLabeledCell(first, threeColWidth);
    const secondCell = parseLabeledCell(second, threeColWidth);
    const thirdCell = parseLabeledCell(third, threeColWidth);
    const lineCount = Math.max(
      firstCell.lineCount,
      secondCell.lineCount,
      thirdCell.lineCount,
      1,
    );

    ensureSpace(lineCount * lineHeight + 1);

    for (let index = 0; index < lineCount; index += 1) {
      if (firstCell.labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(firstCell.labelLines[index], margin, y);
      }
      if (firstCell.valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(firstCell.valueLines[index], margin + firstCell.labelWidth + 1, y);
      }

      const secondX = margin + threeColWidth + gap;
      if (secondCell.labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(secondCell.labelLines[index], secondX, y);
      }
      if (secondCell.valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(
          secondCell.valueLines[index],
          secondX + secondCell.labelWidth + 1,
          y,
        );
      }

      const thirdX = margin + (threeColWidth + gap) * 2;
      if (thirdCell.labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(thirdCell.labelLines[index], thirdX, y);
      }
      if (thirdCell.valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(thirdCell.valueLines[index], thirdX + thirdCell.labelWidth + 1, y);
      }

      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawEntryRow = (
    label: string,
    value: unknown,
    drawWhenEmpty = false,
    titleCaseValue = true,
  ) => {
    const normalized = formatValue(value, titleCaseValue);
    const keepWhenEmpty =
      drawWhenEmpty ||
      (postPreoperativeSectionActive && isPostPreoperativeAlwaysVisibleField(label));
    if (!normalized && !keepWhenEmpty) return;
    const labelText = `${toUiTitleCase(label)}:`;
    const labelColumnWidth = 58;
    const valueColumnWidth = contentWidth - labelColumnWidth - 2;
    const labelLines = pdf.splitTextToSize(labelText, labelColumnWidth);
    const valueLines = pdf.splitTextToSize(normalized, valueColumnWidth);
    const lineCount = Math.max(labelLines.length, valueLines.length, 1);

    ensureSpace(lineCount * lineHeight + 1);

    for (let index = 0; index < lineCount; index += 1) {
      if (labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(labelLines[index], margin, y);
      }

      if (valueLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(valueLines[index], margin + labelColumnWidth + 2, y);
      }

      y += lineHeight;
    }

    pdf.setFont("helvetica", "normal");
  };

  const drawSectionTitle = (value: string) => {
    y += 2;
    ensureSpace(16);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(value, margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
  };

  const info = getPdfSafePatientInfo(patientInfo || data?.patientInfo || {});

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
  pdf.text("GASTROSCOPY REPORT", pageWidth / 2, y, { align: "center" });
  y += 8;
  drawRule();

  y = drawStandardPatientInformation({
    pdf,
    patientInfo: info,
    y,
    margin,
    pageWidth,
    pageHeight,
    lineHeight,
  });

  drawSectionTitle("Preoperative Information");
  const preopCell = (label: string, value: unknown, titleCaseValue = true) => {
    const normalized = formatValue(value, titleCaseValue);
    return normalized ? `${label}: ${normalized}` : "";
  };
  drawThreeColRow(
    preopCell("Endoscopist", toArray(preoperative.endoscopists).join(", "), false),
    preopCell("Surgeon", toArray(preoperative.surgeons).join(", "), false),
    preopCell("Anesthetist", toArray(preoperative.anaesthetists).join(", "), false),
  );
  drawThreeColRow(
    preopCell("Urgency", preoperative.procedureUrgency),
    preopCell(
      "Imaging",
      joinSelections(preoperative.preoperativeImaging, preoperative.preoperativeImagingOther),
    ),
    "",
  );
  drawThreeColRow(
    preopCell("Start Time", preoperative.startTime, false),
    preopCell("End Time", preoperative.endTime, false),
    preopCell(
      "Total Duration",
      preoperative.duration ? `${preoperative.duration} minutes` : "",
      false,
    ),
  );
  drawEntryRow(
    "Signs & Symptoms",
    joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther),
    false,
    false,
  );
  drawEntryRow(
    "Indications",
    joinSelections(preoperative.indications, preoperative.indicationOther),
    false,
    false,
  );
  drawEntryRow(
    "Extent Of Examination",
    toArray(preoperative.extentOfExamination).join(", "),
    false,
    false,
  );
  postPreoperativeSectionActive = true;

  const drawDiagramInBox = (
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number,
  ) => {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);

    if (hasText(diagramImageData)) {
      try {
        const imageData = diagramImageData;
        const imageType = detectImageFormat(imageData);
        const imageProperties = pdf.getImageProperties(imageData);
        const maxImageWidth = boxWidth - 1;
        const maxImageHeight = boxHeight - 1;
        const aspectRatio = imageProperties.width / imageProperties.height;

        let imageWidth = maxImageWidth;
        let imageHeight = maxImageWidth / aspectRatio;

        if (imageHeight > maxImageHeight) {
          imageHeight = maxImageHeight;
          imageWidth = maxImageHeight * aspectRatio;
        }

        const imageX = boxX + (boxWidth - imageWidth) / 2;
        const imageY = boxY + (boxHeight - imageHeight) / 2;
        pdf.addImage(imageData, imageType, imageX, imageY, imageWidth, imageHeight);
      } catch (error) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.text("Diagram could not be rendered", boxX + boxWidth / 2, boxY + boxHeight / 2, {
          align: "center",
        });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
      }
      return;
    }

    return;
  };

  type GastroscopyPdfRow = { label: string; value: string };
  type GastroscopyPdfFindingGroup = { title: string; rows: GastroscopyPdfRow[] };

  const procedureFindingGroups: GastroscopyPdfFindingGroup[] = [];
  const appendFindingRow = (
    rows: GastroscopyPdfRow[],
    label: string,
    value: unknown,
    titleCaseValue = true,
  ) => {
    const normalized = formatValue(value, titleCaseValue);
    if (normalized) {
      rows.push({ label, value: normalized });
    }
  };
  const appendFindingDetailsRows = (rows: GastroscopyPdfRow[], details: string[]) => {
    const filtered = details.map((entry) => String(entry || "").trim()).filter(Boolean);
    if (filtered.length === 0) {
      return;
    }

    filtered.forEach((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex > 0) {
        const label = entry.slice(0, separatorIndex).trim();
        const value = entry.slice(separatorIndex + 1).trim();
        if (label && value) {
          rows.push({ label, value });
          return;
        }
      }

      rows.push({ label: "Details", value: entry });
    });
  };

  const addFindingGroup = (title: string, rows: GastroscopyPdfRow[]) => {
    if (rows.length > 0) {
      procedureFindingGroups.push({ title, rows });
    }
  };

  const pharynxLarynxRows: GastroscopyPdfRow[] = [];
  appendFindingRow(
    pharynxLarynxRows,
    "Pharynx",
    pharynxLarynx.pharynxStatus === "Abnormal"
      ? `Abnormal: ${pharynxLarynx.pharynxAbnormality || ""}`
      : pharynxLarynx.pharynxStatus,
    false,
  );
  appendFindingRow(
    pharynxLarynxRows,
    "Vocal Cords",
    pharynxLarynx.vocalCordsStatus === "Abnormal"
      ? `Abnormal: ${pharynxLarynx.vocalCordsAbnormality || ""}`
      : pharynxLarynx.vocalCordsStatus,
    false,
  );
  addFindingGroup("Pharynx / Larynx", pharynxLarynxRows);

  const oesophagusRows: GastroscopyPdfRow[] = [];
  appendFindingRow(oesophagusRows, "Oesophagus Findings", toCsv(oesophagus.findings));
  appendFindingDetailsRows(oesophagusRows, oesophagusDetails);
  addFindingGroup("Oesophagus", oesophagusRows);

  const stomachRows: GastroscopyPdfRow[] = [];
  appendFindingRow(stomachRows, "Stomach Findings", toCsv(stomach.findings));
  appendFindingDetailsRows(stomachRows, stomachDetails);
  addFindingGroup("Stomach", stomachRows);

  const duodenumRows: GastroscopyPdfRow[] = [];
  appendFindingRow(duodenumRows, "Duodenum Findings", toCsv(duodenum.findings));
  appendFindingDetailsRows(duodenumRows, duodenumDetails);
  addFindingGroup("Duodenum", duodenumRows);

  const questionColumnWidth = 42;
  const answerColumnWidth = 64;
  const diagramColumnWidth = contentWidth - questionColumnWidth - answerColumnWidth - 8;
  const questionX = margin;
  const answerX = margin + questionColumnWidth + 4;
  const diagramX = answerX + answerColumnWidth + 4;
  const diagramBoxHeight = 92;

  const drawSpacedFindingRow = (row: GastroscopyPdfRow) => {
    const labelColumnWidth = 78;
    const valueColumnWidth = contentWidth - labelColumnWidth - 3;
    const labelLines = pdf.splitTextToSize(`${toUiTitleCase(row.label)}:`, labelColumnWidth);
    const answerLines = pdf.splitTextToSize(row.value, valueColumnWidth);
    const lineCount = Math.max(labelLines.length, answerLines.length, 1);

    ensureSpace(lineCount * lineHeight + 1);
    for (let index = 0; index < lineCount; index += 1) {
      if (labelLines[index]) {
        pdf.setFont("helvetica", "bold");
        pdf.text(labelLines[index], margin, y);
      }

      if (answerLines[index]) {
        pdf.setFont("helvetica", "normal");
        pdf.text(answerLines[index], margin + labelColumnWidth + 3, y);
      }

      y += lineHeight;
    }
    y += 0.4;
  };

  drawSectionTitle("Procedure Findings");
  procedureFindingGroups.forEach((group, index) => {
    if (index > 0) {
      y += 1.2;
    }
    ensureSpace(8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(group.title, margin, y);
    y += lineHeight + 0.8;
    pdf.setFontSize(9);

    group.rows.forEach(drawSpacedFindingRow);
  });
  pdf.setFont("helvetica", "normal");

  drawSectionTitle("Interventions / Therapy and Diagnosis");
  const interventionRows: GastroscopyPdfRow[] = [];
  appendFindingRow(interventionRows, "Interventions / Therapy", toArray(interventions.interventions).join(", "));
  appendFindingDetailsRows(interventionRows, interventionDetails);
  appendFindingRow(interventionRows, "Final Endoscopic Diagnosis", toArray(diagnosis.diagnoses).join(", "));
  appendFindingRow(interventionRows, "Other Diagnosis", diagnosis.diagnosisOther, false);

  if (hasText(diagramImageData)) {
    const interventionsStartY = y;
    let interventionsY = interventionsStartY;

    interventionRows.forEach((row) => {
      const questionLines = pdf.splitTextToSize(`${toUiTitleCase(row.label)}:`, questionColumnWidth);
      const answerLines = pdf.splitTextToSize(row.value, answerColumnWidth);
      const lineCount = Math.max(questionLines.length, answerLines.length, 1);

      for (let index = 0; index < lineCount; index += 1) {
        if (questionLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(questionLines[index], questionX, interventionsY);
        }

        if (answerLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(answerLines[index], answerX, interventionsY);
        }

        interventionsY += lineHeight;
      }
      interventionsY += 0.2;
    });
    pdf.setFont("helvetica", "normal");

    let diagramY = interventionsStartY;
    if (legendLines.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Legend", diagramX, diagramY);
      diagramY += lineHeight;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      legendLines.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, diagramColumnWidth);
        wrapped.forEach((segment: string) => {
          pdf.text(segment, diagramX, diagramY);
          diagramY += lineHeight;
        });
      });

      diagramY += 2;
    }

    drawDiagramInBox(diagramX, diagramY, diagramColumnWidth, diagramBoxHeight);
    y = Math.max(interventionsY, diagramY + diagramBoxHeight) + 6;
  } else {
    interventionRows.forEach((row) => drawEntryRow(row.label, row.value, false, false));
  }

  drawSectionTitle("SPECIMEN");
  drawEntryRow("Specimen Sent For Pathology", additionalInfo.specimenSentForPathology);
  drawEntryRow("Other Specimens Taken", otherSpecimensTakenValue);
  drawEntryRow(
    "Specify Laboratory Sent To",
    additionalInfo.specimenSentForPathology === "Yes"
      ? additionalInfo.laboratorySentTo
      : "",
    false,
    false,
  );

  drawSectionTitle("CONCLUSION");
  drawEntryRow("Conclusion", additionalInfo.conclusion, false, false);

  drawSectionTitle("ADDITIONAL NOTES");
  drawEntryRow("Additional Notes", additionalInfo.additionalNotes, true, false);

  drawSectionTitle("POST OPERATIVE MANAGEMENT");
  drawEntryRow("Post Operative Management", additionalInfo.postOperativeManagement, true, false);

  ensureSpace(24, 18);
  drawSectionTitle("Signature");
  const signatureText =
    String(additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName || "").trim();
  const rawSignatureDate = String(additionalInfo.dateTime || "").trim() || getLocalDateTimeValue();
  const signatureDate =
    formatDateTimeDDMMYYYYWithDashes(rawSignatureDate) || rawSignatureDate;
  drawTwoColRow(
    `Surgeon's Signature: ${signatureText}`,
    `Date and Time: ${signatureDate}`,
  );

  const blob = pdf.output("blob");
  return { success: true as const, blob };
};
