import jsPDF from "jspdf";
import { formatDateTimeDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import smallBowelDiagramImage from "@/assets/APPENDECTOMY IMAGE.png";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
import { drawStandardPatientInformation } from "@/utils/pdfPatientInfoLayout";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

const SMALL_BOWEL_DIAGRAM_MARKING_SCALE = 1.8;

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

const createSurgicalDiagramCanvas = async (markings: any[]): Promise<string | null> =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);

    const image = new Image();
    image.onload = () => {
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(SMALL_BOWEL_DIAGRAM_MARKING_SCALE);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      (Array.isArray(markings) ? markings : []).forEach((marking) => {
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
    image.src = smallBowelDiagramImage;
  });

export const generateSmallBowelSurgeryPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  smallBowelData: any,
  patientInfo?: any,
) => {
  try {
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 4.5;
    let y = margin;

    const preop = smallBowelData?.preoperative || {};
    const findings = smallBowelData?.operativeFindings || {};
    const proc = smallBowelData?.procedure || {};
    const recon = smallBowelData?.reconstruction || {};
    const events = smallBowelData?.operativeEvents || {};
    const closure = smallBowelData?.closure || {};
    const addInfo = smallBowelData?.additionalInfo || {};
    const diagramCanvas = await createSurgicalDiagramCanvas(diagrams);

    const colWidth = 55;
    const col2X = margin + 60;
    const col3X = margin + 120;
    const twoColWidth = 84;
    const twoCol2X = margin + 96;

    const txt = (value: any) => (value === undefined || value === null ? "" : String(value));
    const cell = (label: string, value: string, drawWhenEmpty = false) => {
      const normalized = value.trim();
      return normalized ? `${label}: ${normalized}` : drawWhenEmpty ? `${label}:` : "";
    };

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

    const sec = (title: string, bottomPadding = 20) => {
      y += 3;
      ensureSpace(16, bottomPadding);
      drawRule();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 7;
      y += 1;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const row3 = (a: string, b: string, c: string, bottomPadding = 20) => {
      if (!a && !b && !c) return;
      const buildCellLayout = (rawValue: string, width: number) => {
        const raw = rawValue || "";
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
        const labelWidth = Math.min(60, Math.max(22, width * 0.42));
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

      const cell1 = buildCellLayout(a, colWidth);
      const cell2 = buildCellLayout(b, colWidth);
      const cell3 = buildCellLayout(c, colWidth);
      const lines = Math.max(cell1.lineCount, cell2.lineCount, cell3.lineCount, 1);
      ensureSpace(lines * lineHeight + 1, bottomPadding);

      for (let index = 0; index < lines; index += 1) {
        drawLayoutLine(cell1, index, margin);
        drawLayoutLine(cell2, index, col2X);
        drawLayoutLine(cell3, index, col3X);
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const row2 = (a: string, b: string, bottomPadding = 20) => {
      if (!a && !b) return;
      const buildCellLayout = (rawValue: string, width: number) => {
        const raw = rawValue || "";
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
        const labelWidth = Math.min(60, Math.max(22, width * 0.42));
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

      const cell1 = buildCellLayout(a, twoColWidth);
      const cell2 = buildCellLayout(b, twoColWidth);
      const lines = Math.max(cell1.lineCount, cell2.lineCount, 1);
      ensureSpace(lines * lineHeight + 1, bottomPadding);

      for (let index = 0; index < lines; index += 1) {
        drawLayoutLine(cell1, index, margin);
        drawLayoutLine(cell2, index, twoCol2X);
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const row1 = (value: string, bottomPadding = 20) => {
      if (!value) return;
      const separatorIndex = value.indexOf(":");
      if (separatorIndex === -1) {
        const lines = pdf.splitTextToSize(value, contentWidth);
        ensureSpace(lines.length * lineHeight + 1, bottomPadding);
        lines.forEach((line: string) => {
          pdf.setFont("helvetica", "normal");
          pdf.text(line, margin, y);
          y += lineHeight;
        });
        return;
      }

      const label = `${value.slice(0, separatorIndex).trim()}:`;
      const body = value.slice(separatorIndex + 1).trim();
      const labelWidth = Math.min(68, Math.max(24, contentWidth * 0.4));
      const valueWidth = Math.max(20, contentWidth - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(label, labelWidth);
      const valueLines = pdf.splitTextToSize(body, valueWidth);
      const lines = Math.max(labelLines.length, valueLines.length, 1);
      ensureSpace(lines * lineHeight + 1, bottomPadding);
      for (let index = 0; index < lines; index += 1) {
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

    const rowCompactFirstColumnLabelValue = (
      label: string,
      value: string,
      bottomPadding = 20,
      widthOverride = colWidth
    ) => {
      const normalizedValue = txt(value).trim();
      if (!normalizedValue) return;

      const x = margin;
      const width = widthOverride;
      const labelText = `${label}:`;
      pdf.setFont("helvetica", "bold");
      const measuredLabelWidth = pdf.getTextWidth(labelText);
      pdf.setFont("helvetica", "normal");
      const labelWidth = Math.min(
        Math.max(measuredLabelWidth + 1.5, 12),
        Math.max(12, width - 10)
      );
      const valueWidth = Math.max(10, width - labelWidth - 2);
      const valueLines = pdf.splitTextToSize(normalizedValue, valueWidth);
      const lines = Math.max(valueLines.length, 1);

      ensureSpace(lines * lineHeight + 1, bottomPadding);
      for (let index = 0; index < lines; index += 1) {
        if (index === 0) {
          pdf.setFont("helvetica", "bold");
          pdf.text(labelText, x, y);
        }
        if (valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(valueLines[index], x + labelWidth + 2, y);
        }
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const rowQuestionAnswer = (label: string, value: string, bottomPadding = 20) => {
      const normalizedLabel = label.trim();
      const normalizedValue = value.trim();
      if (!normalizedLabel || !normalizedValue) return;

      const labelWidth = 60;
      const answerX = margin + 68;
      const answerWidth = Math.max(20, pageWidth - margin - answerX);
      const labelLines = pdf.splitTextToSize(`${normalizedLabel}:`, labelWidth);
      const valueLines = normalizedValue ? pdf.splitTextToSize(normalizedValue, answerWidth) : [""];
      const lines = Math.max(labelLines.length, valueLines.length, 1);

      ensureSpace(lines * lineHeight + 1, bottomPadding);
      for (let index = 0; index < lines; index += 1) {
        if (labelLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(labelLines[index], margin, y);
        }
        if (valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(valueLines[index], answerX, y);
        }
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const estimateRow1Height = (value: string) => {
      if (!value) return 0;
      const lines = pdf.splitTextToSize(value, contentWidth);
      return lines.length * lineHeight + 1;
    };

    const showStomaFields = toArray(recon?.reconstructionType).includes("Stoma");

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
    pdf.text("SMALL BOWEL SURGERY REPORT", pageWidth / 2, y, { align: "center" });
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    y += 3;
    drawRule();
    y = drawStandardPatientInformation({
      pdf,
      patientInfo: patientInfo || smallBowelData?.patientInfo,
      y,
      margin,
      pageWidth,
      pageHeight,
      lineHeight,
      patientNameFallback: patientName,
      patientIdFallback: patientId,
    });
    y += 1;

    sec("PREOPERATIVE INFORMATION");
    row3(
      cell(
        "Surgeon",
        (preop?.surgeons || []).filter((value: string) => value?.trim()).join(", "),
      ),
      cell(
        "Assistant",
        (preop?.assistants || []).filter((value: string) => value?.trim()).join(", "),
      ),
      cell(
        "Anaesthetist",
        (preop?.anaesthetists || []).filter((value: string) => value?.trim()).join(", "),
      ),
    );
    row3(
      cell("Start Time", txt(preop?.startTime)),
      cell("End Time", txt(preop?.endTime)),
      cell("Total Duration", preop?.duration ? `${preop.duration} minutes` : ""),
    );
    row3(
      cell("Urgency", txt(preop?.procedureUrgency)),
      cell("Imaging", joinSelections(toArray(preop?.imaging), preop?.imagingOther)),
      "",
    );
    rowCompactFirstColumnLabelValue("Indication", txt(preop?.indication), 20, contentWidth);
    row3(cell("Operation Description", txt(preop?.operationDescription)), "", "");

    sec("OPERATIVE FINDINGS");
    rowQuestionAnswer("Description of Operation Findings", txt(findings?.description));
    rowQuestionAnswer(
      "Pathology Found",
      joinSelections(toArray(findings?.pathology), findings?.pathologyOther),
    );
    rowQuestionAnswer(
      "Distance from DJ Flexure",
      findings?.distanceFromDjFlexure ? `${findings.distanceFromDjFlexure} cm` : "",
    );
    rowQuestionAnswer("Mesenteric Involvement", txt(findings?.mesentericInvolvement));
    rowQuestionAnswer(
      "Distance from Ileocecal Valve",
      findings?.distanceFromIleocecalValve ? `${findings.distanceFromIleocecalValve} cm` : "",
    );
    rowQuestionAnswer("Lymph Nodes", txt(findings?.lymphNodes));
    rowQuestionAnswer(
      "Length of Diseased Segment",
      findings?.diseasedSegmentLength ? `${findings.diseasedSegmentLength} cm` : "",
    );
    rowQuestionAnswer("Degree of Contamination", txt(findings?.contamination));
    rowQuestionAnswer("Bowel Viability", txt(findings?.bowelViability));
    rowQuestionAnswer("Adhesions", txt(findings?.adhesions));

    ensureSpace(112);
    sec("PROCEDURE DETAILS");
    const blockTop = y;
    const leftWidth = 78;
    const rightX = twoCol2X + 2;
    const rightWidth = twoColWidth;
    const procedureEntries = [
      cell("Operation Done", txt(proc?.operationDone)),
      cell("Surgical Approach", toArray(proc?.approach).join(", ")),
      cell(
        "Reason for Conversion",
        joinSelections(toArray(proc?.reasonForConversion), proc?.reasonForConversionOther),
      ),
      cell("Trocar Number", txt(proc?.trocarNumber)),
      cell(
        "Procedure Performed",
        joinSelections(toArray(proc?.procedurePerformed), proc?.procedurePerformedOther),
      ),
      cell("Length Resected", proc?.lengthResected ? `${proc.lengthResected} cm` : ""),
      cell("Margins", toArray(proc?.margins).join(", ")),
      cell(
        "Vascular Control",
        joinSelections(toArray(proc?.vascularControl), proc?.vascularControlOther),
      ),
      cell("Adhesiolysis", txt(proc?.adhesiolysis)),
      cell(
        "Peritoneal Lavage",
        proc?.peritonealLavage === "Yes" && proc?.peritonealLavageVolume
          ? `Yes (${proc.peritonealLavageVolume})`
          : txt(proc?.peritonealLavage),
      ),
      cell(
        "Points of Difficulty",
        joinSelections(toArray(events?.pointsOfDifficulty), events?.pointsOfDifficultyOther),
      ),
      cell(
        "Intraoperative Events/Complications",
        joinSelections(
          toArray(events?.intraoperativeEvents),
          events?.intraoperativeEventsOther,
        ),
      ),
    ].filter(Boolean);

    let leftY = blockTop;
    procedureEntries.forEach((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex === -1) {
        const lines = pdf.splitTextToSize(entry, leftWidth);
        lines.forEach((line: string) => {
          pdf.setFont("helvetica", "normal");
          pdf.text(line, margin, leftY);
          leftY += lineHeight;
        });
        return;
      }

      const label = `${entry.slice(0, separatorIndex).trim()}:`;
      const value = entry.slice(separatorIndex + 1).trim();
      const labelWidth = Math.min(40, Math.max(24, leftWidth * 0.5));
      const valueWidth = Math.max(18, leftWidth - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(label, labelWidth);
      const valueLines = pdf.splitTextToSize(value, valueWidth);
      const lines = Math.max(labelLines.length, valueLines.length, 1);

      for (let index = 0; index < lines; index += 1) {
        if (labelLines[index]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(labelLines[index], margin, leftY);
        }
        if (valueLines[index]) {
          pdf.setFont("helvetica", "normal");
          pdf.text(valueLines[index], margin + labelWidth + 2, leftY);
        }
        leftY += lineHeight;
      }
    });
    pdf.setFont("helvetica", "normal");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("PORTS AND INCISIONS", rightX, blockTop);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let rightY = blockTop + 5;
    const { diagramBottomY } = drawRectalStylePortsAndIncisions({
      pdf,
      x: rightX,
      y: rightY,
      pageHeight,
      diagramCanvas,
      fallbackLabel: "SMALL BOWEL DIAGRAM",
    });

    y = Math.max(leftY, diagramBottomY + 10) + 4;

    sec("RECONSTRUCTION");
    rowQuestionAnswer(
      "Reconstruction Type",
      joinSelections(toArray(recon?.reconstructionType), recon?.reconstructionOther),
    );
    if (showStomaFields) {
      rowQuestionAnswer(
        "Ileostomy Type",
        recon?.stomaDetails?.ileostomyType === "Other"
          ? txt(recon?.stomaDetails?.ileostomyTypeOther)
          : txt(recon?.stomaDetails?.ileostomyType),
      );
    }
    rowQuestionAnswer("Site of Anastomosis", txt(recon?.anastomosisDetails?.site));
    if (showStomaFields) {
      rowQuestionAnswer(
        "Stoma Location",
        recon?.stomaDetails?.location === "Other"
          ? txt(recon?.stomaDetails?.locationOther)
          : txt(recon?.stomaDetails?.location),
      );
    }
    rowQuestionAnswer(
      "Configuration",
      recon?.anastomosisDetails?.configuration === "Other"
        ? txt(recon?.anastomosisDetails?.configurationOther)
        : txt(recon?.anastomosisDetails?.configuration),
    );
    if (showStomaFields) {
      rowQuestionAnswer("Stoma Eversion", txt(recon?.stomaDetails?.eversion));
    }
    rowQuestionAnswer("Anastomotic Technique", txt(recon?.anastomosisDetails?.technique));
    if (showStomaFields) {
      rowQuestionAnswer("Site of Maturation", txt(recon?.stomaDetails?.maturationSite));
    }
    rowQuestionAnswer(
      "Suture Material",
      joinSelections(
        toArray(recon?.anastomosisDetails?.sutureMaterial),
        recon?.anastomosisDetails?.sutureMaterialOther,
      ),
    );
    if (showStomaFields) {
      rowQuestionAnswer(
        "Material Used",
        joinSelections(
          toArray(recon?.stomaDetails?.materialUsed),
          recon?.stomaDetails?.materialUsedOther,
        ),
      );
    }
    rowQuestionAnswer(
      "Linear Stapler Sizes",
      joinSelections(
        toArray(recon?.anastomosisDetails?.linearStaplerSize),
        recon?.anastomosisDetails?.linearStaplerSizeOther,
      ),
    );
    rowQuestionAnswer(
      "Circular Stapler Sizes",
      joinSelections(
        toArray(recon?.anastomosisDetails?.circularStaplerSize),
        recon?.anastomosisDetails?.circularStaplerSizeOther,
      ),
    );

    sec("CLOSURE");
    row1(cell("Wound Protector Used", txt(events?.woundProtector)));
    row1(cell("Peritoneal Drainage", txt(events?.drainInsertion)));
    row1(
      cell("Type of Drain", joinSelections(toArray(events?.drainType), events?.drainTypeOther)),
    );
    row1(
      cell(
        "Intra-Peritoneal Placement",
        joinSelections(
          toArray(events?.intraPeritonealPlacement),
          events?.intraPeritonealPlacementOther,
        ),
      ),
    );
    row1(
      cell(
        "Drain Exit Site",
        joinSelections(toArray(events?.drainExitSite), events?.drainExitSiteOther),
      ),
    );
    row1(
      cell(
        "Fascial Closure",
        joinSelections(toArray(closure?.fascialClosure), closure?.fascialClosureOther),
      ),
    );
    row1(
      cell(
        "Fascial Material Used",
        joinSelections(
          toArray(closure?.fascialSutureMaterial),
          closure?.fascialSutureMaterialOther,
        ),
      ),
    );
    row1(
      cell(
        "Skin Closure",
        joinSelections(toArray(closure?.skinClosure), closure?.skinClosureOther),
      ),
    );
    row1(
      cell(
        "Skin Material Used",
        joinSelections(
          toArray(closure?.skinClosureMaterial),
          closure?.skinClosureMaterialOther,
        ),
      ),
    );

    const specimenBottomPadding = 10;
    const specimenRows = [
      cell("Specimen", joinSelections(toArray(events?.specimen), events?.specimenOther)),
      cell("Specimen Sent to Laboratory", txt(events?.specimenSentToLaboratory)),
      cell("Specify Laboratory Sent to", txt(events?.specifyLaboratorySentTo)),
    ].filter(Boolean);
    const specimenSectionHeight =
      16 + specimenRows.reduce((total, row) => total + estimateRow1Height(row), 0);
    ensureSpace(specimenSectionHeight, specimenBottomPadding);
    sec("SPECIMEN", specimenBottomPadding);
    specimenRows.forEach((row) => row1(row, specimenBottomPadding));

    sec("ADDITIONAL NOTES");
    row1(cell("Additional Notes", txt(addInfo?.additionalInformation), true));

    sec("POST OPERATIVE MANAGEMENT");
    row1(cell("Post Operative Management", txt(addInfo?.postOperativeManagement), true));

    ensureSpace(42);
    sec("SURGEON'S SIGNATURE");
    if (addInfo?.surgeonSignature && String(addInfo.surgeonSignature).startsWith("data:image")) {
      ensureSpace(24);
      const signatureDimensions = await calculateSignatureDimensions(addInfo.surgeonSignature);
      pdf.addImage(
        addInfo.surgeonSignature,
        "PNG",
        margin,
        y,
        signatureDimensions.width,
        signatureDimensions.height,
      );
      y += signatureDimensions.height + 3;
    }
    row2(
      cell("Typed Signature", txt(addInfo?.surgeonSignatureText), true),
      cell(
        "Date/Time",
        addInfo?.dateTime
          ? formatDateTimeDDMMYYYYWithDashes(addInfo.dateTime)
          : formatDateTimeDDMMYYYYWithDashes(new Date()),
      ),
    );

    return { success: true, blob: pdf.output("blob") };
  } catch (error) {
    console.error("Error generating small bowel surgery PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
