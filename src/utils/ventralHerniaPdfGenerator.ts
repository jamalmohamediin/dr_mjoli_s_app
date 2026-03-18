import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "./dateFormatter";
import {
  formatPatientGender,
  formatPatientStickerDate,
  normalizePatientInfo,
} from "./patientSticker";
import { getFullASAText } from "./asaDescriptions";
import { drawRectalStylePortsAndIncisions } from "./pdfPortsAndIncisionsLayout";
import { getSurgicalDiagramMarkingMetrics } from "./surgicalDiagramMarkings";

const VENTRAL_HERNIA_DIAGRAM_MARKING_SCALE = 1.5;

const txt = (value: any) => String(value || "").trim();

const hasText = (value: any) => txt(value).length > 0;

const hasCellValue = (cell: string) =>
  txt(String(cell || "").replace(/^[^:]+:\s*/, "")).length > 0;

const mapSelectionValues = (values: any[] = [], otherValue = "") =>
  (Array.isArray(values) ? values : [])
    .map((value) => {
      if (value === "Other" && hasText(otherValue)) {
        return `Other: ${txt(otherValue)}`;
      }

      return txt(value);
    })
    .filter(Boolean);

const joinSelectionValues = (values: any[] = [], otherValue = "") =>
  mapSelectionValues(values, otherValue).join(", ");

const createSurgicalDiagramCanvas = async (markings: any[] = []): Promise<string | null> =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(VENTRAL_HERNIA_DIAGRAM_MARKING_SCALE);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      markings.forEach((marking) => {
        if (marking.type === "port") {
          context.save();
          context.font = `bold ${drawingMetrics.portFontSize}px Arial`;
          context.fillStyle = "black";
          context.textAlign = "center";
          context.textBaseline = "bottom";
          context.fillText(marking.size, marking.x, marking.y - drawingMetrics.portLabelOffset);
          context.beginPath();
          context.moveTo(marking.x - drawingMetrics.portHalfLength, marking.y);
          context.lineTo(marking.x + drawingMetrics.portHalfLength, marking.y);
          context.strokeStyle = "black";
          context.lineWidth = drawingMetrics.portLineWidth;
          context.stroke();
          context.restore();
          return;
        }

        if (marking.type === "stoma") {
          context.save();
          context.beginPath();
          context.arc(marking.x, marking.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
          context.strokeStyle = marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
          context.lineWidth =
            marking.stomaType === "ileostomy"
              ? drawingMetrics.ileostomyLineWidth
              : drawingMetrics.colostomyLineWidth;
          context.setLineDash(marking.stomaType === "ileostomy" ? drawingMetrics.ileostomyDash : []);
          context.stroke();
          context.restore();
          return;
        }

        if (marking.type === "incision") {
          context.save();
          context.beginPath();
          context.moveTo(marking.start.x, marking.start.y);
          context.lineTo(marking.end.x, marking.end.y);
          context.strokeStyle = "#8B0000";
          context.lineWidth = drawingMetrics.incisionLineWidth;
          context.setLineDash(drawingMetrics.incisionDash);
          context.stroke();
          context.restore();
        }
      });

      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(null);
    image.src = appendectomyImage;
  });

const addFooter = (
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageNum: number,
  totalPages: number,
) => {
  const footerY = pageHeight - 15;
  const reportDate = formatDateDDMMYYYYWithDashes(new Date());
  const footerLines = [
    "Dr. Monde Mjoli - Specialist Surgeon",
    "Practice Number: 0560812",
    `Report Date: ${reportDate} | Page ${pageNum} of ${totalPages}`,
  ];

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  footerLines.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, footerY + index * 4, { align: "center" });
  });
};

export const generateVentralHerniaPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  ventralHerniaData: any,
) => {
  try {
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const pageCenter = pageWidth / 2;
    const threeColWidth = 58;
    const twoColWidth = 88;
    const footerReserve = 24;
    const firstPageBottom = pageHeight - margin;
    const laterPageBottom = pageHeight - footerReserve;
    let currentPage = 1;
    let y = margin;

    const startNewPage = () => {
      pdf.addPage();
      currentPage += 1;
      y = margin;
    };

    const getBottomLimit = () => (currentPage === 1 ? firstPageBottom : laterPageBottom);

    const ensureSpace = (neededSpace: number) => {
      if (y + neededSpace > getBottomLimit()) {
        startNewPage();
      }
    };

    const splitText = (value: string, width: number) =>
      (pdf.splitTextToSize(txt(value), Math.max(width, 20)) as string[]) || [];

    const drawSeparator = () => {
      ensureSpace(4);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.15);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(8);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, y);
      y += 5;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
    };

    const drawAdaptiveRow = (cells: string[]) => {
      const filteredCells = cells.filter((cell) => hasCellValue(cell));
      if (!filteredCells.length) {
        return;
      }

      let layout: Array<{ text: string; x: number; width: number }>;
      if (cells.length === 1) {
        layout = [{ text: cells[0], x: margin, width: contentWidth }];
      } else if (cells.length === 2) {
        layout = [
          { text: cells[0], x: margin, width: twoColWidth },
          { text: cells[1], x: pageCenter + 2, width: twoColWidth },
        ];
      } else {
        layout = [
          { text: cells[0], x: margin, width: threeColWidth },
          { text: cells[1], x: margin + 66, width: threeColWidth },
          { text: cells[2], x: margin + 132, width: threeColWidth },
        ];
      }

      const activeLayout = layout.filter((cell) => hasCellValue(cell.text));
      const rowLines = activeLayout.map((cell) => splitText(cell.text, cell.width));
      const rowHeight =
        Math.max(...rowLines.map((lines) => Math.max(lines.length, 1)), 1) * 4.2 + 1;

      ensureSpace(rowHeight);

      rowLines.forEach((lines, cellIndex) => {
        lines.forEach((line, lineIndex) => {
          pdf.text(line, activeLayout[cellIndex].x, y + lineIndex * 4.2);
        });
      });

      y += rowHeight;
    };

    const drawLabelValue = (
      label: string,
      value: string,
      options: { x?: number; width?: number; indent?: number } = {},
    ) => {
      if (!hasText(value)) {
        return;
      }

      const x = options.x ?? margin;
      const width = options.width ?? contentWidth;
      const indent = options.indent ?? 0;
      const fullText = `${label}: ${value}`;
      const lines = splitText(fullText, width - indent);
      const lineHeight = 4.4;

      ensureSpace(Math.max(lines.length, 1) * lineHeight + 1.2);
      pdf.setFont("helvetica", "normal");

      lines.forEach((line) => {
        if (y + lineHeight > getBottomLimit()) {
          startNewPage();
          pdf.setFont("helvetica", "normal");
        }

        pdf.text(line, x + indent, y);
        y += lineHeight;
      });

      y += 1.2;
    };

    const patientInfo = normalizePatientInfo(ventralHerniaData?.patientInfo || {});
    const gender = formatPatientGender(patientInfo);
    const asaClassification = patientInfo.asaScore
      ? getFullASAText(patientInfo.asaScore)
      : "";

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Dr. Monde Mjoli", margin, y);
    pdf.text("St. Dominic's Medical Suites B", pageWidth - margin, y, { align: "right" });
    y += 5;

    pdf.setFontSize(9);
    pdf.text("Specialist Surgeon", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text("56 St James Road, Southernwood", pageWidth - margin, y, { align: "right" });
    y += 4.5;

    pdf.setFontSize(8);
    pdf.text("MBChB (UNITRA), MMed (UKZN), FCS(SA),", margin, y);
    pdf.text("East London, 5201", pageWidth - margin, y, { align: "right" });
    y += 4;

    pdf.text("Cert Gastroenterology, Surg (SA)", margin, y);
    pdf.text("Tel: 043 743 7872", pageWidth - margin, y, { align: "right" });
    y += 4;

    pdf.text("Practice No. 0560812", margin, y);
    pdf.text("Fax: 043 743 6653", pageWidth - margin, y, { align: "right" });
    y += 4;

    pdf.text("Cell: 082 417 2630", margin, y);
    y += 6;

    drawSeparator();

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("VENTRAL HERNIA REPAIR REPORT", pageWidth / 2, y, { align: "center" });
    y += 8;

    drawSectionTitle("PATIENT INFORMATION");
    pdf.setFont("helvetica", "bold");
    pdf.text("Patient Details", margin, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    drawAdaptiveRow([
      `Patient Name: ${txt(patientInfo.name || patientName)}`,
      `Gender: ${gender}`,
      `Age: ${txt(patientInfo.age)}`,
    ]);
    drawAdaptiveRow([
      `Patient ID: ${txt(patientInfo.patientId || patientId)}`,
      `Date Of Birth: ${formatPatientStickerDate(patientInfo.dateOfBirth)}`,
      `Address: ${txt(patientInfo.address)}`,
    ]);

    pdf.setFont("helvetica", "bold");
    pdf.text("Medical Aid Details", margin, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    drawAdaptiveRow([
      `Medical Aid Name: ${txt(patientInfo.medicalAidName)}`,
      `Medical Aid Number: ${txt(patientInfo.medicalAidNumber)}`,
      `Main Member: ${txt(patientInfo.mainMember)}`,
    ]);
    drawAdaptiveRow([
      `Main Member ID: ${txt(patientInfo.mainMemberId)}`,
      `Work Number: ${txt(patientInfo.workNumber)}`,
      `Home Number: ${txt(patientInfo.homeNumber)}`,
    ]);
    drawAdaptiveRow([
      `Authorization: ${txt(patientInfo.authorization)}`,
      `Depend Code: ${txt(patientInfo.dependCode)}`,
      "",
    ]);

    pdf.setFont("helvetica", "bold");
    pdf.text("Hospital Details", margin, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    drawAdaptiveRow([`Hospital Name: ${txt(patientInfo.hospitalName)}`]);
    drawAdaptiveRow([`Hospital Visit Number: ${txt(patientInfo.hospitalVisitNumber)}`]);
    drawAdaptiveRow([`Doctor's Name: ${txt(patientInfo.doctorName)}`]);
    drawAdaptiveRow([`Doctor's Practice Number: ${txt(patientInfo.doctorPracticeNumber)}`]);
    drawAdaptiveRow([`ASA Physical Status Classification: ${asaClassification}`]);
    if (hasText(patientInfo.asaNotes)) {
      drawAdaptiveRow([`ASA Notes: ${txt(patientInfo.asaNotes)}`]);
    }
    drawAdaptiveRow([
      `Weight: ${txt(patientInfo.weight) ? `${txt(patientInfo.weight)} kg` : ""}`,
      `Height: ${txt(patientInfo.height) ? `${txt(patientInfo.height)} cm` : ""}`,
      `BMI: ${txt(patientInfo.bmi)}`,
    ]);
    drawAdaptiveRow([
      `Date: ${formatPatientStickerDate(patientInfo.visitDate)}`,
      `Time: ${txt(patientInfo.visitTime)}`,
      "",
    ]);

    drawSeparator();

    const preoperative = ventralHerniaData?.preoperative || {};
    const surgeonText = (preoperative.surgeons || []).filter((value: string) => txt(value)).join(", ");
    const assistantText = (preoperative.assistants || []).filter((value: string) => txt(value)).join(", ");
    const anaesthetistText =
      (preoperative.anaesthetists || []).filter((value: string) => txt(value)).join(", ") ||
      txt(preoperative.anaesthetist);
    const procedureUrgencyText = (preoperative.procedureUrgency || []).join(", ");
    const indicationText = joinSelectionValues(
      preoperative.indication || [],
      preoperative.indicationOther || "",
    );
    const imagingText = joinSelectionValues(
      preoperative.imaging || [],
      preoperative.imagingOther || "",
    );

    drawSectionTitle("PREOPERATIVE INFORMATION");
    drawAdaptiveRow([
      `Surgeon: ${surgeonText}`,
      `Assistant: ${assistantText}`,
      `Anaesthetist: ${anaesthetistText}`,
    ]);
    drawAdaptiveRow([
      `Start Time: ${txt(preoperative.startTime)}`,
      `End Time: ${txt(preoperative.endTime)}`,
      `Total Duration: ${txt(preoperative.duration) ? `${txt(preoperative.duration)} minutes` : ""}`,
    ]);
    drawAdaptiveRow([
      `Procedure Urgency: ${procedureUrgencyText}`,
      `Preoperative Imaging: ${imagingText}`,
      "",
    ]);
    drawAdaptiveRow([`Indication for Surgery: ${indicationText}`]);

    drawSeparator();

    const operative = ventralHerniaData?.operative || {};
    const procedure = ventralHerniaData?.procedure || {};
    const herniaTypeText = joinSelectionValues(operative.herniaType || [], operative.herniaTypeOther || "");
    const herniaSiteText = joinSelectionValues(operative.herniaSite || [], operative.herniaSiteOther || "");
    const contentsText = joinSelectionValues(operative.contents || [], operative.contentsOther || "");
    const herniaDefectText =
      operative.herniaDefectLength || operative.herniaDefectWidth
        ? `${txt(operative.herniaDefectLength) || "___"} cm (Length) x ${txt(operative.herniaDefectWidth) || "___"} cm (Width)`
        : "";

    drawSectionTitle("OPERATIVE FINDINGS");
    drawAdaptiveRow([
      `Hernia Type: ${herniaTypeText}`,
      `Total Hernia Defect Size: ${herniaDefectText}`,
    ]);
    drawAdaptiveRow([
      `Site of Hernia: ${herniaSiteText}`,
      `Number of Defects: ${txt(operative.numberOfDefects)}`,
    ]);
    drawAdaptiveRow([
      `Contents: ${contentsText}`,
      `Strangulation/Ischaemia: ${txt(operative.strangulation)}`,
    ]);

    drawSeparator();

    const operationDescription = txt(operative.operationDescription);
    const approachText = joinSelectionValues(operative.approach || [], operative.approachOther || "");
    const showConversionReason = (operative.approach || []).includes("Laparoscopic Converted To Open");
    const conversionReasonText = joinSelectionValues(
      operative.conversionReason || [],
      operative.conversionReasonOther || "",
    );
    const closureTechniqueText =
      procedure.defectClosed === "Yes"
        ? joinSelectionValues(
            procedure.closureTechnique || [],
            procedure.closureTechniqueOther || "",
          )
        : "";
    const materialUsedText = joinSelectionValues(
      procedure.closureMaterial || [],
      procedure.closureMaterialOther || "",
    );

    let primaryRepairText = joinSelectionValues(
      procedure.primaryRepair || [],
      procedure.primaryRepairOther || "",
    );
    let meshPlacementText = joinSelectionValues(
      procedure.meshType || [],
      procedure.meshPlacementOther || "",
    );
    let meshMaterialText = joinSelectionValues(
      procedure.meshMaterial || [],
      procedure.meshMaterialOther || "",
    );
    let meshSizeText =
      procedure.meshLength || procedure.meshWidth
        ? `${txt(procedure.meshLength) || "___"} x ${txt(procedure.meshWidth) || "___"} cm`
        : "";
    let fixationText = joinSelectionValues(procedure.fixation || [], procedure.fixationOther || "");

    if (procedure.repairType === "Primary Suture Closure (Non-Mesh)") {
      meshPlacementText = "N/A";
      meshMaterialText = "N/A";
      meshSizeText = "N/A";
      fixationText = "N/A";
    } else if (procedure.repairType === "Mesh Repair") {
      primaryRepairText = "N/A";
    }

    const leftColumnItems: Array<[string, string]> = [
      ["Operation Description", operationDescription],
      ["Surgical Approach", approachText],
      ["Reason for Conversion", showConversionReason ? conversionReasonText : ""],
      ["Trocar Number", txt(operative.trocarNumber)],
      ["Sac Excised", txt(procedure.sacExcised)],
      ["Pre-peritoneal Fat Dissected Off Sheath", txt(procedure.fatDissected)],
      ["Hernia Defect Closed", txt(procedure.defectClosed)],
      ["Closure Technique", closureTechniqueText],
      ["Material Used", materialUsedText],
      ["Repair Type", txt(procedure.repairType)],
      ["Primary Tissue Repair", primaryRepairText],
      ["Mesh Placement", meshPlacementText],
      ["Mesh Material", meshMaterialText],
      ["Mesh Size", meshSizeText],
      ["Fixation", fixationText],
    ];

    const addColumnItem = (
      label: string,
      value: string,
      x: number,
      width: number,
      currentY: number,
    ) => {
      if (!hasText(value)) {
        return currentY;
      }

      pdf.setFont("helvetica", "normal");
      const lines = splitText(`${label}: ${value}`, width);
      const lineHeight = 4.4;

      lines.forEach((line, lineIndex) => {
        pdf.text(line, x, currentY + lineIndex * lineHeight);
      });

      return currentY + Math.max(lines.length, 1) * lineHeight + 1.4;
    };

    ensureSpace(90);
    const leftColX = margin;
    const rightColX = pageCenter + 2;
    const columnWidth = pageWidth / 2 - margin - 6;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROCEDURE DETAILS", leftColX, y);
    pdf.text("PORTS AND INCISIONS", rightColX, y);
    y += 5;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    let leftY = y;
    let rightY = y;

    leftColumnItems.forEach(([label, value]) => {
      leftY = addColumnItem(label, value, leftColX, columnWidth, leftY);
    });

    const diagramImageData = await createSurgicalDiagramCanvas(diagrams || []);
    const { diagramBottomY } = drawRectalStylePortsAndIncisions({
      pdf,
      x: rightColX,
      y: rightY,
      pageHeight,
      diagramCanvas: diagramImageData,
      fallbackLabel: "VENTRAL HERNIA DIAGRAM",
    });

    rightY = diagramBottomY + 10;
    y = Math.max(leftY, rightY) + 8;

    drawSeparator();

    const difficultyText = joinSelectionValues(
      procedure.intraOperativeDifficulty || [],
      procedure.intraOperativeDifficultyOther || "",
    );
    const complicationsText = joinSelectionValues(
      procedure.complications || [],
      procedure.complicationOther || "",
    );

    drawSectionTitle("COMPLICATIONS");
    drawLabelValue("Intra-Operative Difficulty", difficultyText);
    drawLabelValue("Intraoperative Complications", complicationsText);

    drawSeparator();

    const drainTypeText = joinSelectionValues(procedure.drainType || [], procedure.drainTypeOther || "");
    const drainPlacementText = joinSelectionValues(
      procedure.intraPeritonealPlacement || [],
      procedure.intraPeritonealPlacementOther || "",
    );
    const drainExitSiteText = joinSelectionValues(
      procedure.drainExitSite || [],
      procedure.drainExitSiteOther || "",
    );
    const fascialClosureText = joinSelectionValues(
      procedure.fascialClosure || [],
      procedure.fascialClosureOther || "",
    );
    const fascialMaterialText = joinSelectionValues(
      procedure.fascialClosureMaterial || [],
      procedure.fascialClosureMaterialOther || "",
    );
    const skinClosureText = joinSelectionValues(
      procedure.skinClosure || [],
      procedure.skinClosureOther || "",
    );
    const skinMaterialText = joinSelectionValues(
      procedure.skinClosureMaterial || [],
      procedure.skinClosureMaterialOther || "",
    );

    drawSectionTitle("HAEMOSTASIS & CLOSURE");
    drawLabelValue("Haemostasis", txt(procedure.haemostasis));
    drawLabelValue("Drain", txt(procedure.drain));
    if (procedure.drain === "Yes") {
      drawLabelValue("Type of Drain", drainTypeText);
      drawLabelValue("Intra-Peritoneal Placement", drainPlacementText);
      drawLabelValue("Exit Site", drainExitSiteText);
      drawLabelValue("Additional Drain Details", txt(procedure.drainDetails));
    }
    drawLabelValue("Fascial Closure", fascialClosureText);
    drawLabelValue("Fascial Closure Material Used", fascialMaterialText);
    drawLabelValue("Skin Closure", skinClosureText);
    drawLabelValue("Skin Closure Material Used", skinMaterialText);

    drawSeparator();

    const specimenText = joinSelectionValues(procedure.specimenSent || [], procedure.specimenOther || "");
    drawSectionTitle("SPECIMEN");
    drawLabelValue("Specimen Sent for Pathology", specimenText);
    drawLabelValue("Specify Laboratory Sent to", txt(procedure.laboratoryName));
    drawLabelValue("Other Specimens Taken", txt(procedure.otherSpecimens));

    drawSeparator();

    const additionalNotes = [
      txt(procedure.additionalNotes),
      hasText(ventralHerniaData?.procedureFindings?.additionalNotes)
        ? `Diagram Notes: ${txt(ventralHerniaData?.procedureFindings?.additionalNotes)}`
        : "",
      txt(ventralHerniaData?.additionalNotes),
    ]
      .filter(Boolean)
      .join(" | ");

    drawSectionTitle("NOTES");
    drawLabelValue("Additional Notes", additionalNotes);

    drawSeparator();

    drawSectionTitle("POST OPERATIVE MANAGEMENT");
    drawLabelValue(
      "Post Operative Management",
      txt(procedure.postOperativeManagement) || txt(ventralHerniaData?.postOperativeManagement),
    );

    drawSeparator();

    const closure = ventralHerniaData?.closure || {};
    ensureSpace(18);
    const signatureY = y + 2;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Surgeon's Signature:", margin, signatureY);

    if (hasText(closure.surgeonSignatureText)) {
      pdf.text(txt(closure.surgeonSignatureText), margin + 42, signatureY);
    } else if (hasText(closure.surgeonSignature)) {
      if (String(closure.surgeonSignature).startsWith("data:image")) {
        try {
          const properties = pdf.getImageProperties(closure.surgeonSignature);
          const aspectRatio = properties.width / properties.height;
          const maxWidth = 50;
          const maxHeight = 15;
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / aspectRatio;

          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * aspectRatio;
          }

          pdf.addImage(
            closure.surgeonSignature,
            "PNG",
            margin + 42,
            signatureY - finalHeight / 2,
            finalWidth,
            finalHeight,
          );
        } catch (error) {
          pdf.text("[Signature Image]", margin + 42, signatureY);
        }
      } else {
        pdf.text(txt(closure.surgeonSignature), margin + 42, signatureY);
      }
    }

    const signatureDateTime = hasText(closure.dateTime)
      ? formatDateTimeDDMMYYYYWithDashes(closure.dateTime)
      : formatDateTimeDDMMYYYYWithDashes(new Date());
    pdf.text("Date & Time:", pageCenter + 2, signatureY);
    pdf.text(signatureDateTime, pageCenter + 32, signatureY);
    y = signatureY + 8;

    const totalPages = pdf.internal.getNumberOfPages();
    for (let pageNum = 2; pageNum <= totalPages; pageNum += 1) {
      pdf.setPage(pageNum);
      addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages);
    }

    return {
      success: true,
      blob: pdf.output("blob"),
    };
  } catch (error: any) {
    console.error("Error generating ventral hernia PDF:", error);
    return {
      success: false,
      error: error?.message || "Failed to generate PDF",
    };
  }
};

export const saveVentralHerniaDraft = (ventralHerniaData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const draftData = {
      ...ventralHerniaData,
      savedAt: timestamp,
      isDraft: true,
    };

    localStorage.setItem(`ventral_hernia_draft_${timestamp}`, JSON.stringify(draftData));

    const drafts = Object.keys(localStorage)
      .filter((key) => key.startsWith("ventral_hernia_draft_"))
      .sort()
      .reverse();

    if (drafts.length > 5) {
      drafts.slice(5).forEach((key) => localStorage.removeItem(key));
    }

    return {
      success: true,
      timestamp,
    };
  } catch (error) {
    console.error("Error saving ventral hernia draft:", error);
    return {
      success: false,
      error: "Failed to save draft",
    };
  }
};
