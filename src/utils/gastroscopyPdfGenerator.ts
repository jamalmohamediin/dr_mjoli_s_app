import jsPDF from "jspdf";
import { getFullASAText } from "@/utils/asaDescriptions";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { formatPatientGender, normalizePatientInfo } from "@/utils/patientSticker";
import {
  hasText,
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

  const followUpValue = joinSelections(additionalInfo.followUp, additionalInfo.followUpOther);
  const diagramFindings = Array.isArray(diagram.findings) ? diagram.findings : [];
  const legendLines =
    diagramFindings.length > 0
      ? diagramFindings.flatMap((finding: any, index: number) => {
          const main = `${index + 1}. ${[
            String(finding?.type || "").trim(),
            String(finding?.location || "").trim(),
          ]
            .filter(Boolean)
            .join(" - ")}`;
          const description = String(finding?.description || "").trim();
          return description ? [main, `   ${description}`] : [main];
        })
      : ["No legend entries recorded."];

  const pdf = new jsPDF("portrait", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 4.4;
  const columnWidth = 84;
  let y = margin;

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

  const drawSingleRow = (text: string) => {
    if (!text) return;
    const lines = pdf.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * lineHeight + 1);
    lines.forEach((line: string) => {
      pdf.text(line, margin, y);
      y += lineHeight;
    });
  };

  const drawEntryRow = (
    label: string,
    value: unknown,
    drawWhenEmpty = false,
    titleCaseValue = true,
  ) => {
    const normalized = formatValue(value, titleCaseValue);
    if (!normalized && !drawWhenEmpty) return;
    drawSingleRow(`${toUiTitleCase(label)}: ${normalized}`);
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

  const info = normalizePatientInfo(patientInfo || data?.patientInfo || {});
  const gender = formatPatientGender(info);
  const asaText = hasText(info.asaScore) ? getFullASAText(info.asaScore) : "";

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

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Patient Information", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  drawTwoColRow(`Patient Name: ${info.name || ""}`, `Patient ID: ${info.patientId || ""}`);
  drawTwoColRow(
    `Date Of Birth: ${formatDateDDMMYYYYWithDashes(info.dateOfBirth)}`,
    `Age / Sex: ${[info.age, gender].filter(Boolean).join(" / ")}`,
  );
  drawTwoColRow(
    `Weight / Height: ${[
      info.weight ? `${info.weight} kg` : "",
      info.height ? `${info.height} cm` : "",
    ]
      .filter(Boolean)
      .join(" / ")}`,
    `BMI: ${info.bmi || ""}`,
  );
  drawSingleRow(`ASA Score: ${asaText}`);
  if (hasText(info.asaNotes)) {
    drawSingleRow(`ASA Notes: ${info.asaNotes}`);
  }

  drawSectionTitle("Preoperative Information");
  drawEntryRow("Endoscopist", toArray(preoperative.endoscopists).join(", "), false, false);
  drawEntryRow("Surgeon", toArray(preoperative.surgeons).join(", "), false, false);
  drawEntryRow("Anesthetist", toArray(preoperative.anaesthetists).join(", "), false, false);
  drawEntryRow("Procedure Urgency", preoperative.procedureUrgency);
  drawEntryRow(
    "Preoperative Imaging",
    joinSelections(preoperative.preoperativeImaging, preoperative.preoperativeImagingOther),
  );
  drawEntryRow("Indications", joinSelections(preoperative.indications, preoperative.indicationOther));
  drawEntryRow(
    "Signs & Symptoms",
    joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther),
  );
  drawEntryRow("Extent Of Examination", toArray(preoperative.extentOfExamination).join(", "));

  const leftFindingLines: string[] = [];
  const appendFindingLine = (label: string, value: unknown, titleCaseValue = true) => {
    const normalized = formatValue(value, titleCaseValue);
    if (normalized) {
      leftFindingLines.push(`${toUiTitleCase(label)}: ${normalized}`);
    }
  };
  const appendFindingDetails = (label: string, details: string[]) => {
    if (details.length === 0) return;
    leftFindingLines.push(`${toUiTitleCase(label)}: ${details[0]}`);
    details.slice(1).forEach((detail) => leftFindingLines.push(`- ${detail}`));
  };

  appendFindingLine(
    "Pharynx",
    pharynxLarynx.pharynxStatus === "Abnormal"
      ? `Abnormal: ${pharynxLarynx.pharynxAbnormality || ""}`
      : pharynxLarynx.pharynxStatus,
    false,
  );
  appendFindingLine(
    "Vocal Cords",
    pharynxLarynx.vocalCordsStatus === "Abnormal"
      ? `Abnormal: ${pharynxLarynx.vocalCordsAbnormality || ""}`
      : pharynxLarynx.vocalCordsStatus,
    false,
  );
  appendFindingLine("Oesophagus Findings", toCsv(oesophagus.findings));
  appendFindingDetails("Oesophagus Details", oesophagusDetails);
  appendFindingLine("Stomach Findings", toCsv(stomach.findings));
  appendFindingDetails("Stomach Details", stomachDetails);
  appendFindingLine("Duodenum Findings", toCsv(duodenum.findings));
  appendFindingDetails("Duodenum Details", duodenumDetails);

  if (leftFindingLines.length === 0) {
    leftFindingLines.push("No procedure findings recorded.");
  }

  const rightColumnWidth = 74;
  const columnGap = 6;
  const leftColumnWidth = contentWidth - rightColumnWidth - columnGap;
  const estimatedLeftLineCount = leftFindingLines.reduce(
    (count, line) => count + Math.max(1, pdf.splitTextToSize(line, leftColumnWidth).length),
    0,
  );
  const estimatedLegendLineCount = legendLines.reduce(
    (count, line) => count + Math.max(1, pdf.splitTextToSize(line, rightColumnWidth).length),
    0,
  );
  const diagramBoxHeight = 82;
  const estimatedFindingsSectionHeight =
    Math.max(
      estimatedLeftLineCount * lineHeight + 8,
      estimatedLegendLineCount * lineHeight + diagramBoxHeight + 12,
    ) + 20;

  ensureSpace(estimatedFindingsSectionHeight, 24);
  drawSectionTitle("Procedure Findings");

  const findingsStartY = y;
  const rightColumnX = margin + leftColumnWidth + columnGap;

  let leftY = findingsStartY;
  leftFindingLines.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, leftColumnWidth);
    wrapped.forEach((segment: string) => {
      pdf.text(segment, margin, leftY);
      leftY += lineHeight;
    });
    leftY += 0.4;
  });

  let rightY = findingsStartY;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Legend", rightColumnX, rightY);
  rightY += lineHeight;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);

  legendLines.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, rightColumnWidth);
    wrapped.forEach((segment: string) => {
      pdf.text(segment, rightColumnX, rightY);
      rightY += lineHeight;
    });
  });

  rightY += 2;
  const diagramTopY = rightY;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.rect(rightColumnX, diagramTopY, rightColumnWidth, diagramBoxHeight);

  if (hasText(diagram.canvasImageData)) {
    try {
      const imageData = String(diagram.canvasImageData);
      const imageType = detectImageFormat(imageData);
      const imageProperties = pdf.getImageProperties(imageData);
      const maxImageWidth = rightColumnWidth - 4;
      const maxImageHeight = diagramBoxHeight - 4;
      const aspectRatio = imageProperties.width / imageProperties.height;

      let imageWidth = maxImageWidth;
      let imageHeight = maxImageWidth / aspectRatio;

      if (imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight;
        imageWidth = maxImageHeight * aspectRatio;
      }

      const imageX = rightColumnX + (rightColumnWidth - imageWidth) / 2;
      const imageY = diagramTopY + (diagramBoxHeight - imageHeight) / 2;
      pdf.addImage(imageData, imageType, imageX, imageY, imageWidth, imageHeight);
    } catch (error) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.text("Diagram could not be rendered", rightColumnX + rightColumnWidth / 2, diagramTopY + diagramBoxHeight / 2, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    }
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.text("No diagram captured", rightColumnX + rightColumnWidth / 2, diagramTopY + diagramBoxHeight / 2, {
      align: "center",
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
  }

  y = Math.max(leftY, diagramTopY + diagramBoxHeight) + 6;

  drawSectionTitle("Interventions / Therapy and Diagnosis");
  drawEntryRow("Interventions / Therapy", toArray(interventions.interventions).join(", "));
  drawEntryRow("Intervention Details", interventionDetails.join(" | "), false, false);
  drawEntryRow("Final Endoscopic Diagnosis", toArray(diagnosis.diagnoses).join(", "));
  drawEntryRow("Other Diagnosis", diagnosis.diagnosisOther, false, false);

  drawSectionTitle("SPECIMEN");
  drawEntryRow("Specimen Sent For Pathology", additionalInfo.specimenSentForPathology, true);
  drawEntryRow("Other Specimens Taken", otherSpecimensTakenValue, true);
  drawEntryRow(
    "Specify Laboratory Sent To",
    additionalInfo.specimenSentForPathology === "Yes"
      ? additionalInfo.laboratorySentTo
      : "",
    true,
    false,
  );

  drawSectionTitle("CONCLUSION");
  drawEntryRow("Conclusion", additionalInfo.conclusion, true, false);

  drawSectionTitle("FOLLOW UP");
  drawEntryRow("Follow Up", followUpValue, true);

  drawSectionTitle("ADDITIONAL NOTES");
  drawEntryRow("Additional Notes", additionalInfo.additionalNotes, true, false);

  drawSectionTitle("POST OPERATIVE MANAGEMENT");
  drawEntryRow("Post Operative Management", additionalInfo.postOperativeManagement, true, false);

  ensureSpace(24, 18);
  drawSectionTitle("Signature");
  const signatureText =
    String(additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName || "").trim();
  const signatureDate = formatDateTimeDDMMYYYYWithDashes(additionalInfo.dateTime || "");
  drawTwoColRow(
    `Surgeon's Signature: ${signatureText}`,
    `Date and Time: ${signatureDate || additionalInfo.dateTime || ""}`,
  );

  const blob = pdf.output("blob");
  return { success: true as const, blob };
};
