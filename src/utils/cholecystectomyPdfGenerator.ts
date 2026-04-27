import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import { formatDateTimeDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { drawStandardPatientInformation } from "@/utils/pdfPatientInfoLayout";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";
import {
  hasPdfDisplayValue,
} from "@/utils/templateDataHelpers";

const CHOLECYSTECTOMY_DIAGRAM_MARKING_SCALE = 1.5;

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

const joinSelections = (values: string[], otherValue?: string) =>
  values
    .map((value) => (value === "Other" && otherValue?.trim() ? `Other: ${otherValue}` : value))
    .filter(Boolean)
    .join(", ");

const calculateSignatureDimensions = (imageDataUrl: string): Promise<{ width: number; height: number }> =>
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

const createSurgicalDiagramCanvas = async (markings: any[]): Promise<string | null> => {
  if (!markings || markings.length === 0) return null;
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);

    const image = new Image();
    image.onload = () => {
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(CHOLECYSTECTOMY_DIAGRAM_MARKING_SCALE);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      markings.forEach((marking) => {
        if (marking.type === "port") {
          ctx.save();
          ctx.font = `bold ${drawingMetrics.portFontSize}px Arial`;
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(marking.size, marking.x, marking.y - drawingMetrics.portLabelOffset);
          ctx.beginPath();
          ctx.moveTo(marking.x - drawingMetrics.portHalfLength, marking.y);
          ctx.lineTo(marking.x + drawingMetrics.portHalfLength, marking.y);
          ctx.strokeStyle = "black";
          ctx.lineWidth = drawingMetrics.portLineWidth;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "stoma") {
          ctx.save();
          ctx.beginPath();
          ctx.arc(marking.x, marking.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
          ctx.lineWidth =
            marking.stomaType === "ileostomy"
              ? drawingMetrics.ileostomyLineWidth
              : drawingMetrics.colostomyLineWidth;
          ctx.setLineDash(marking.stomaType === "ileostomy" ? drawingMetrics.ileostomyDash : []);
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "incision") {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = "#8B0000";
          ctx.lineWidth = drawingMetrics.incisionLineWidth;
          ctx.setLineDash(drawingMetrics.incisionDash);
          ctx.stroke();
          ctx.restore();
        }
      });
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(null);
    image.src = appendectomyImage;
  });
};

export const generateCholecystectomyPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  cholecystectomyData: any,
  patientInfo?: any
) => {
  try {
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const lineHeight = 4.5;
    let y = margin;

    const preop = cholecystectomyData?.preoperative || {};
    const intra = cholecystectomyData?.intraoperative || {};
    const proc = cholecystectomyData?.procedure || {};
    const closure = cholecystectomyData?.closure || {};
    const addInfo = cholecystectomyData?.additionalInfo || {};
    const diagramCanvas = await createSurgicalDiagramCanvas(diagrams);
    const col1X = margin;
    const col2X = margin + 63;
    const col3X = margin + 126;
    const twoCol2X = margin + 95;

    const ensureSpace = (h = 10) => {
      if (y + h > pageHeight - 20) {
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

    const sec = (title: string) => {
      y += 2;
      ensureSpace(14);
      drawRule();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const txt = (v: any) => (v === undefined || v === null ? "" : String(v));
    const shouldRenderCell = (rawValue: string) => {
      const raw = String(rawValue || "");
      const separatorIndex = raw.indexOf(":");
      if (separatorIndex === -1) {
        return hasPdfDisplayValue(raw);
      }

      const value = raw.slice(separatorIndex + 1).trim();
      return hasPdfDisplayValue(value);
    };

    const rowFull = (text: string) => {
      const normalized = text || "";
      const separatorIndex = normalized.indexOf(":");
      if (separatorIndex === -1) {
        if (!shouldRenderCell(normalized)) {
          return;
        }
        const lines = pdf.splitTextToSize(normalized, pageWidth - margin * 2);
        ensureSpace(lines.length * lineHeight + 1);
        lines.forEach((line: string) => {
          pdf.setFont("helvetica", "normal");
          pdf.text(line, col1X, y);
          y += lineHeight;
        });
        return;
      }

      if (!shouldRenderCell(normalized)) {
        return;
      }

      const label = `${normalized.slice(0, separatorIndex).trim()}:`;
      const value = normalized.slice(separatorIndex + 1).trim();
      const fullWidth = pageWidth - margin * 2;
      const labelWidth = Math.min(70, Math.max(24, fullWidth * 0.4));
      const valueWidth = Math.max(20, fullWidth - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(label, labelWidth);
      const valueLines = pdf.splitTextToSize(value, valueWidth);
      const lines = Math.max(labelLines.length, valueLines.length, 1);
      ensureSpace(lines * lineHeight + 1);
      for (let index = 0; index < lines; index += 1) {
        if (labelLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(labelLines[index], col1X, y);
        }
        if (valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(valueLines[index], col1X + labelWidth + 2, y);
        }
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const row3 = (a: string, b: string, c: string) => {
      const cells = [a, b, c].map((value) => (shouldRenderCell(value) ? value : ""));
      const buildCellLayout = (rawValue: string, width: number) => {
        const raw = rawValue || "";
        if (!raw.trim()) {
          return {
            isLabelValue: false,
            labelLines: [] as string[],
            valueLines: [] as string[],
            lineCount: 0,
            labelWidth: 0,
          };
        }
        const separatorIndex = raw.indexOf(":");
        if (separatorIndex === -1) {
          const lines = pdf.splitTextToSize(raw, width);
          return {
            isLabelValue: false,
            labelLines: [] as string[],
            valueLines: lines.length > 0 ? lines : [""],
            lineCount: Math.max(lines.length, 1),
            labelWidth: 0,
          };
        }

        const labelText = `${raw.slice(0, separatorIndex).trim()}:`;
        const valueText = raw.slice(separatorIndex + 1).trim();
        const labelWidth = Math.min(34, Math.max(20, width * 0.42));
        const valueWidth = Math.max(12, width - labelWidth - 2);
        const labelLines = pdf.splitTextToSize(labelText, labelWidth);
        const valueLines = pdf.splitTextToSize(valueText, valueWidth);
        return {
          isLabelValue: true,
          labelLines,
          valueLines,
          lineCount: Math.max(labelLines.length, valueLines.length, 1),
          labelWidth,
        };
      };

      const drawLayoutLine = (
        layout: ReturnType<typeof buildCellLayout>,
        lineIndex: number,
        x: number,
      ) => {
        if (layout.isLabelValue) {
          if (layout.labelLines[lineIndex]) {
            pdf.setFont("helvetica", "bold");
            pdf.text(layout.labelLines[lineIndex], x, y);
          }
          if (layout.valueLines[lineIndex]) {
            pdf.setFont("helvetica", "normal");
            pdf.text(layout.valueLines[lineIndex], x + layout.labelWidth + 2, y);
          }
        } else if (layout.valueLines[lineIndex]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(layout.valueLines[lineIndex], x, y);
        }
      };

      const cell1 = buildCellLayout(cells[0], 58);
      const cell2 = buildCellLayout(cells[1], 58);
      const cell3 = buildCellLayout(cells[2], 58);
      const lines = Math.max(cell1.lineCount, cell2.lineCount, cell3.lineCount, 1);
      if (lines <= 0 || (cell1.lineCount === 0 && cell2.lineCount === 0 && cell3.lineCount === 0)) {
        return;
      }
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i++) {
        drawLayoutLine(cell1, i, col1X);
        drawLayoutLine(cell2, i, col2X);
        drawLayoutLine(cell3, i, col3X);
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const row2 = (a: string, b: string) => {
      const cells = [a, b].map((value) => (shouldRenderCell(value) ? value : ""));
      const buildCellLayout = (rawValue: string, width: number) => {
        const raw = rawValue || "";
        if (!raw.trim()) {
          return {
            isLabelValue: false,
            labelLines: [] as string[],
            valueLines: [] as string[],
            lineCount: 0,
            labelWidth: 0,
          };
        }
        const separatorIndex = raw.indexOf(":");
        if (separatorIndex === -1) {
          const lines = pdf.splitTextToSize(raw, width);
          return {
            isLabelValue: false,
            labelLines: [] as string[],
            valueLines: lines.length > 0 ? lines : [""],
            lineCount: Math.max(lines.length, 1),
            labelWidth: 0,
          };
        }

        const labelText = `${raw.slice(0, separatorIndex).trim()}:`;
        const valueText = raw.slice(separatorIndex + 1).trim();
        const labelWidth = Math.min(38, Math.max(20, width * 0.42));
        const valueWidth = Math.max(12, width - labelWidth - 2);
        const labelLines = pdf.splitTextToSize(labelText, labelWidth);
        const valueLines = pdf.splitTextToSize(valueText, valueWidth);
        return {
          isLabelValue: true,
          labelLines,
          valueLines,
          lineCount: Math.max(labelLines.length, valueLines.length, 1),
          labelWidth,
        };
      };

      const drawLayoutLine = (
        layout: ReturnType<typeof buildCellLayout>,
        lineIndex: number,
        x: number,
      ) => {
        if (layout.isLabelValue) {
          if (layout.labelLines[lineIndex]) {
            pdf.setFont("helvetica", "bold");
            pdf.text(layout.labelLines[lineIndex], x, y);
          }
          if (layout.valueLines[lineIndex]) {
            pdf.setFont("helvetica", "normal");
            pdf.text(layout.valueLines[lineIndex], x + layout.labelWidth + 2, y);
          }
        } else if (layout.valueLines[lineIndex]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(layout.valueLines[lineIndex], x, y);
        }
      };

      const cell1 = buildCellLayout(cells[0], 88);
      const cell2 = buildCellLayout(cells[1], 88);
      const lines = Math.max(cell1.lineCount, cell2.lineCount, 1);
      if (lines <= 0 || (cell1.lineCount === 0 && cell2.lineCount === 0)) {
        return;
      }
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i++) {
        drawLayoutLine(cell1, i, col1X);
        drawLayoutLine(cell2, i, twoCol2X);
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const rowAlignedToUrgencyColumn = (text: string, widthOverride = 58) => {
      const normalized = text || "";
      if (!shouldRenderCell(normalized)) {
        return;
      }

      const x = col1X;
      const width = widthOverride;
      const separatorIndex = normalized.indexOf(":");
      if (separatorIndex === -1) {
        const lines = pdf.splitTextToSize(normalized, width);
        if (!lines.length) {
          return;
        }
        ensureSpace(lines.length * lineHeight + 1);
        lines.forEach((line: string) => {
          pdf.setFont("helvetica", "normal");
          pdf.text(line, x, y);
          y += lineHeight;
        });
        return;
      }

      const label = `${normalized.slice(0, separatorIndex).trim()}:`;
      const value = normalized.slice(separatorIndex + 1).trim();
      pdf.setFont("helvetica", "bold");
      const measuredLabelWidth = pdf.getTextWidth(label);
      pdf.setFont("helvetica", "normal");
      const labelWidth = Math.min(
        Math.max(measuredLabelWidth + 1.5, 12),
        Math.max(12, width - 10)
      );
      const valueWidth = Math.max(10, width - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(label, labelWidth);
      const valueLines = pdf.splitTextToSize(value, valueWidth);
      const lines = Math.max(labelLines.length, valueLines.length, 1);
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i += 1) {
        if (labelLines[i]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(labelLines[i], x, y);
        }
        if (valueLines[i]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(valueLines[i], x + labelWidth + 2, y);
        }
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const rowQuestionAnswer = (question: string, answer: string) => {
      const answerText = txt(answer).trim();
      if (!hasPdfDisplayValue(answerText)) {
        return;
      }

      const questionText = `${question}:`;
      const questionX = col1X;
      const questionWidth = 72;
      const answerX = questionX + questionWidth + 4;
      const answerWidth = pageWidth - margin - answerX;
      const questionLines = pdf.splitTextToSize(questionText, questionWidth);
      const answerLines = pdf.splitTextToSize(answerText, answerWidth);
      const lines = Math.max(questionLines.length, answerLines.length, 1);
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i += 1) {
        if (questionLines[i]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(questionLines[i], questionX, y);
        }
        if (answerLines[i]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(answerLines[i], answerX, y);
        }
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    // Header
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
    pdf.setFontSize(11);
    pdf.text("CHOLECYSTECTOMY REPORT", pageWidth / 2, y, { align: "center" });
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const additionalProceduresText = [
      joinSelections(toArray(proc?.additionalProcedures), proc?.additionalProceduresOther),
      txt(proc?.additionalProcedureDrainSite)
        ? `Drain site: ${txt(proc?.additionalProcedureDrainSite)}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const cholangiogramText = [
      joinSelections(toArray(proc?.cholangiogramFindings), proc?.cholangiogramOther),
      txt(proc?.cholangiogramStrictureSite)
        ? `Stricture site: ${txt(proc?.cholangiogramStrictureSite)}`
        : "",
      txt(proc?.cholangiogramDilatation)
        ? `Dilatation: ${txt(proc?.cholangiogramDilatation)}`
        : "",
      txt(proc?.cholangiogramLeakSite) ? `Leak site: ${txt(proc?.cholangiogramLeakSite)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const extentOfCholecystectomyText = joinSelections(
      toArray(proc?.extentOfCholecystectomy),
      proc?.extentOfCholecystectomyOther
    );
    const subtotalControlText = joinSelections(
      toArray(proc?.methodOfSubtotalControl),
      proc?.methodOfSubtotalControlOther
    );
    const criticalViewSafetyConfirmationText = joinSelections(
      toArray(proc?.criticalViewSafetyConfirmation),
      proc?.criticalViewSafetyConfirmationOther
    );
    const hemostasisText = joinSelections(toArray(proc?.hemostasis), proc?.hemostasisOther);
    const peritonealLavageText = joinSelections(
      toArray(proc?.peritonealLavage),
      proc?.peritonealLavageOther
    );
    const decompressionFluidTypeText = joinSelections(
      toArray(proc?.decompressionFluidType),
      proc?.decompressionFluidTypeOther
    );
    const typeOfStonesText = joinSelections(
      toArray(intra?.typeOfStones),
      intra?.typeOfStonesOther
    );
    const hasStonesPresent =
      intra?.stonesPresent === "Solitary Stones" || intra?.stonesPresent === "Multiple Stones";

    y += 2;
    drawRule();
    y = drawStandardPatientInformation({
      pdf,
      patientInfo: patientInfo || cholecystectomyData?.patientInfo,
      y,
      margin,
      pageWidth,
      pageHeight,
      lineHeight,
      patientNameFallback: patientName,
      patientIdFallback: patientId,
    });
    y += 2;

    sec("PREOPERATIVE INFORMATION");
    row3(
      `Surgeon: ${(preop?.surgeons || []).filter((x: string) => x?.trim()).join(", ")}`,
      `Assistant: ${(preop?.assistants || []).filter((x: string) => x?.trim()).join(", ")}`,
      `Anaesthetist: ${(preop?.anaesthetists || []).filter((x: string) => x?.trim()).join(", ")}`
    );
    row3(`Start Time: ${txt(preop?.startTime)}`, `End Time: ${txt(preop?.endTime)}`, `Total Duration: ${preop?.duration ? `${preop.duration} minutes` : ""}`);
    row3(
      `Urgency: ${txt(preop?.procedureUrgency)}`,
      `Imaging: ${joinSelections(toArray(preop?.imaging), preop?.imagingOther)}`,
      ""
    );
    rowAlignedToUrgencyColumn(
      `Indication: ${joinSelections(toArray(preop?.indication), preop?.indicationOther)}`,
      pageWidth - margin * 2
    );
    rowAlignedToUrgencyColumn(
      `Operation Description: ${txt(preop?.operationDescription)}`,
      pageWidth - margin * 2
    );
    y += 2;

    sec("INTRAOPERATIVE FINDINGS");
    rowQuestionAnswer(
      "Gallbladder Appearance",
      joinSelections(toArray(intra?.gallbladderAppearance), intra?.gallbladderAppearanceOther)
    );
    rowQuestionAnswer("Adhesions to Gallbladder", txt(intra?.adhesionsToGallbladder));
    rowQuestionAnswer("Stones Present", txt(intra?.stonesPresent));
    if (hasStonesPresent) {
      rowQuestionAnswer("Type of Stones", typeOfStonesText);
      rowQuestionAnswer("Size of Stones", txt(intra?.sizeOfStones));
    }
    y += 2;

    const leftXCh = col1X;
    const rightXCh = twoCol2X;
    const leftWCh = 82;
    const rightWCh = 80;

    y += 2;
    ensureSpace(18);
    drawRule();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    const blockTitleYCh = y;
    pdf.text("PROCEDURE DETAILS", leftXCh, blockTitleYCh);
    pdf.text("PORTS AND INCISIONS", rightXCh, blockTitleYCh);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const blockTopCh = y;
    let lyCh = blockTopCh;

    const addLeftCh = (label: string, value: string) => {
      const labelText = `${label}:`;
      const valueText = value || "";
      if (!hasPdfDisplayValue(valueText)) {
        return;
      }
      const labelWidth = Math.min(40, Math.max(24, leftWCh * 0.5));
      const valueWidth = Math.max(14, leftWCh - labelWidth - 4);
      const labelLines = pdf.splitTextToSize(labelText, labelWidth);
      const valueLines = pdf.splitTextToSize(valueText, valueWidth);
      const lines = Math.max(labelLines.length, valueLines.length, 1);
      for (let index = 0; index < lines; index += 1) {
        if (labelLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(labelLines[index], leftXCh, lyCh);
        }
        if (valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(valueLines[index], leftXCh + labelWidth + 4, lyCh);
        }
        lyCh += lineHeight;
      }
    };

    addLeftCh("Surgical Approach", toArray(proc?.approach).join(", "));
    addLeftCh("Reason for Conversion", joinSelections(toArray(proc?.reasonForConversion), proc?.reasonForConversionOther));
    addLeftCh("Number of Ports Inserted", txt(proc?.numberOfPortsInserted));
    addLeftCh("Subtotal Cholecystectomy", txt(proc?.subtotalCholecystectomy));
    addLeftCh("Reason for Subtotal Cholecystectomy", joinSelections(toArray(proc?.subtotalReason), proc?.subtotalReasonOther));
    addLeftCh("Adhesiolysis", txt(proc?.adhesiolysis));
    addLeftCh("Extent of Cholecystectomy", extentOfCholecystectomyText);
    addLeftCh("Method of Subtotal Cholecystectomy Control", subtotalControlText);
    addLeftCh("Gall Bladder Decompression Required", txt(proc?.gallbladderDecompressionRequired));
    if (txt(proc?.gallbladderDecompressionRequired) === "Yes") {
      addLeftCh("Type of Fluid Drained from Gall Bladder", decompressionFluidTypeText);
    }

    let ryCh = blockTopCh + 2;
    const { diagramBottomY } = drawRectalStylePortsAndIncisions({
      pdf,
      x: rightXCh,
      y: ryCh,
      pageHeight,
      diagramCanvas,
      fallbackLabel: "CHOLECYSTECTOMY DIAGRAM",
    });

    pdf.setDrawColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    y = Math.max(lyCh, diagramBottomY + 10) + 5;

    pdf.addPage();
    y = margin;

    sec("PROCEDURE DETAILS");
    rowQuestionAnswer("Critical View of Safety Confirmation", criticalViewSafetyConfirmationText);
    rowQuestionAnswer("Critical View of Safety - Calot's Triangle Dissected", txt(proc?.calotsTriangleDissected));
    rowQuestionAnswer("Critical View of Safety - Cystic Duct Identified", txt(proc?.cysticDuctIdentified));
    rowQuestionAnswer("Critical View of Safety - Cystic Artery Identified", txt(proc?.cysticArteryIdentified));
    rowQuestionAnswer("Critical View of Safety - Two Structures Entering", txt(proc?.twoStructuresConfirmed));
    rowFull(`Cystic Duct Control: ${joinSelections(toArray(proc?.cysticDuctControl), proc?.cysticDuctControlOther)}`);
    rowFull(`Cystic Artery Control: ${joinSelections(toArray(proc?.cysticArteryControl), proc?.cysticArteryControlOther)}`);
    rowFull(
      `Gall Bladder Dissected from Liver Bed: ${joinSelections(
        toArray(proc?.gallbladderDissectedFromLiverBed),
        proc?.gallbladderDissectedFromLiverBedOther
      )}`
    );
    rowFull(`Hemostasis: ${hemostasisText}`);
    rowFull(`Bile Spillage: ${txt(proc?.bileSpillage)}`);
    rowFull(`Stones Spillage: ${txt(proc?.stonesSpillage)}`);
    rowFull(`Additional Procedures: ${additionalProceduresText}`);
    rowFull(`Cholangiogram Findings: ${cholangiogramText}`);
    rowFull(
      `Gall Bladder Retrieval: ${joinSelections(
        toArray(proc?.gallbladderRetrieval),
        proc?.gallbladderRetrievalOther
      )}`
    );
    rowFull(`Use Of Specimen Bag: ${txt(proc?.useOfSpecimenBag)}`);
    rowFull(`Peritoneal Lavage: ${peritonealLavageText}`);
    rowFull(
      `Points of Difficulty: ${joinSelections(
        toArray(closure?.intraoperativeDifficulty),
        closure?.intraoperativeDifficultyOther
      )}`
    );
    rowFull(
      `Intraoperative Events/Complications: ${joinSelections(
        toArray(closure?.complications),
        closure?.complicationsOther
      )}`
    );

    sec("CLOSURE");
    rowFull(`Drain Insertion: ${txt(proc?.drainInsertion)}`);
    rowFull(`Type of Drain: ${joinSelections(toArray(proc?.drainType), proc?.drainTypeOther)}`);
    rowFull(
      `Intra-Peritoneal Placement: ${joinSelections(
        toArray(proc?.intraPeritonealPlacement),
        proc?.intraPeritonealPlacementOther
      )}`
    );
    rowFull(`Drain Exit Site: ${joinSelections(toArray(proc?.drainExitSite), proc?.drainExitSiteOther)}`);
    rowFull(`Fascial Closure: ${txt(closure?.fascialClosure)}`);
    rowFull(
      `Fascial Material Used: ${joinSelections(
        toArray(closure?.fascialSutureMaterial),
        closure?.fascialSutureMaterialOther
      )}`
    );
    rowFull(`Skin Closure: ${txt(closure?.skinClosure)}`);
    rowFull(`Skin Material Used: ${joinSelections(toArray(closure?.skinClosureMethod), closure?.skinClosureOther)}`);

    sec("SPECIMEN");
    rowFull("Specimen: Gallbladder");
    rowFull(`Use Of Specimen Bag: ${txt(closure?.useOfSpecimenBag)}`);
    rowFull(`Gallbladder Sent For Histology: ${txt(closure?.gallbladderSentForHistology)}`);
    rowFull(`Specify Laboratory Sent to: ${txt(closure?.laboratoryName)}`);

    sec("ADDITIONAL NOTES");
    rowFull(`Additional Notes: ${txt(addInfo?.additionalInformation)}`);

    sec("POST OPERATIVE MANAGEMENT");
    rowFull(`Post Operative Management: ${txt(addInfo?.postOperativeManagement)}`);

    sec("SURGEON'S SIGNATURE");
    ensureSpace(24);
    const signatureY = y;
    const signatureCol1X = margin;
    const signatureCol2X = margin + 100;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Surgeon's Signature:", signatureCol1X, signatureY);
    pdf.text("Date & Time:", signatureCol2X, signatureY);
    pdf.setFont("helvetica", "normal");

    const hasImageSignature =
      addInfo?.surgeonSignature && String(addInfo.surgeonSignature).startsWith("data:image");

    if (hasImageSignature) {
      const sig = await calculateSignatureDimensions(addInfo.surgeonSignature);
      pdf.addImage(
        addInfo.surgeonSignature,
        "PNG",
        signatureCol1X + 40,
        signatureY - sig.height + 3,
        sig.width,
        sig.height
      );
    } else if (hasPdfDisplayValue(txt(addInfo?.surgeonSignatureText))) {
      pdf.text(txt(addInfo?.surgeonSignatureText), signatureCol1X + 40, signatureY);
    }

    pdf.text(
      addInfo?.dateTime
        ? formatDateTimeDDMMYYYYWithDashes(addInfo.dateTime)
        : formatDateTimeDDMMYYYYWithDashes(new Date()),
      signatureCol2X + 25,
      signatureY
    );

    y = signatureY + 20;

    return { success: true, blob: pdf.output("blob") };
  } catch (error) {
    console.error("Error generating cholecystectomy PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
};
