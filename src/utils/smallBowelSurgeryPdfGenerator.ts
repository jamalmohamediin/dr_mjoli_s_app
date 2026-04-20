import jsPDF from "jspdf";
import { getFullASAText } from "@/utils/asaDescriptions";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import {
  formatPatientGender,
  getPdfSafePatientInfo,
} from "@/utils/patientSticker";
import smallBowelDiagramImage from "@/assets/APPENDECTOMY IMAGE.png";
import { drawRectalStylePortsAndIncisions } from "@/utils/pdfPortsAndIncisionsLayout";
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

    const info = getPdfSafePatientInfo(patientInfo || smallBowelData?.patientInfo || {});
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
    const cell = (label: string, value: string) => {
      const normalized = value.trim();
      return normalized ? `${label}: ${normalized}` : "";
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

    const patientSubsection = (title: string) => {
      ensureSpace(7);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(title, margin, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const row3 = (a: string, b: string, c: string, bottomPadding = 20) => {
      if (!a && !b && !c) return;
      const l1 = pdf.splitTextToSize(a || "", colWidth);
      const l2 = pdf.splitTextToSize(b || "", colWidth);
      const l3 = pdf.splitTextToSize(c || "", colWidth);
      const lines = Math.max(l1.length, l2.length, l3.length, 1);
      ensureSpace(lines * lineHeight + 1, bottomPadding);

      for (let index = 0; index < lines; index += 1) {
        if (l1[index]) pdf.text(l1[index], margin, y);
        if (l2[index]) pdf.text(l2[index], col2X, y);
        if (l3[index]) pdf.text(l3[index], col3X, y);
        y += lineHeight;
      }
    };

    const row2 = (a: string, b: string, bottomPadding = 20) => {
      if (!a && !b) return;
      const l1 = pdf.splitTextToSize(a || "", twoColWidth);
      const l2 = pdf.splitTextToSize(b || "", twoColWidth);
      const lines = Math.max(l1.length, l2.length, 1);
      ensureSpace(lines * lineHeight + 1, bottomPadding);

      for (let index = 0; index < lines; index += 1) {
        if (l1[index]) pdf.text(l1[index], margin, y);
        if (l2[index]) pdf.text(l2[index], twoCol2X, y);
        y += lineHeight;
      }
    };

    const row1 = (value: string, bottomPadding = 20) => {
      if (!value) return;
      const lines = pdf.splitTextToSize(value, contentWidth);
      ensureSpace(lines.length * lineHeight + 1, bottomPadding);
      lines.forEach((line: string) => {
        pdf.text(line, margin, y);
        y += lineHeight;
      });
    };

    const estimateRow1Height = (value: string) => {
      if (!value) return 0;
      const lines = pdf.splitTextToSize(value, contentWidth);
      return lines.length * lineHeight + 1;
    };

    const gender = formatPatientGender(info);
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

    sec("PATIENT INFORMATION");

    patientSubsection("Patient Details");
    row3(
      cell("Patient Name", txt(info.name || patientName)),
      cell("Gender", gender),
      cell("Age", txt(info.age)),
    );
    row3(
      cell("Patient ID", txt(info.patientId || patientId)),
      cell("Date Of Birth", formatDateDDMMYYYYWithDashes(info.dateOfBirth)),
      cell("Address", txt(info.address)),
    );
    y += 1;

    if (info.asaScore) {
      row1(cell("ASA Physical Status Classification", getFullASAText(info.asaScore)));
    }
    if (txt(info.asaNotes)) {
      row1(cell("ASA Notes", txt(info.asaNotes)));
    }
    if (txt(info.weight) || txt(info.height) || txt(info.bmi)) {
      row3(
        cell("Weight", txt(info.weight)),
        cell("Height", txt(info.height)),
        cell("BMI", txt(info.bmi)),
      );
    }
    if (txt(info.visitDate) || txt(info.visitTime)) {
      row3(
        cell("Date", formatDateDDMMYYYYWithDashes(info.visitDate)),
        cell("Time", txt(info.visitTime)),
        "",
      );
    }
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
      cell("Procedure Urgency", txt(preop?.procedureUrgency)),
      cell("Preoperative Imaging", joinSelections(toArray(preop?.imaging), preop?.imagingOther)),
      "",
    );
    row1(cell("Indication for Surgery", txt(preop?.indication)));
    row1(cell("Operation Description", txt(preop?.operationDescription)));

    sec("OPERATIVE FINDINGS");
    row2(
      cell("Description of Operation Findings", txt(findings?.description)),
      cell("Pathology Found", joinSelections(toArray(findings?.pathology), findings?.pathologyOther)),
    );
    row2(
      cell(
        "Distance from DJ Flexure",
        findings?.distanceFromDjFlexure ? `${findings.distanceFromDjFlexure} cm` : "",
      ),
      cell("Mesenteric Involvement", txt(findings?.mesentericInvolvement)),
    );
    row2(
      cell(
        "Distance from Ileocecal Valve",
        findings?.distanceFromIleocecalValve ? `${findings.distanceFromIleocecalValve} cm` : "",
      ),
      cell("Lymph Nodes", txt(findings?.lymphNodes)),
    );
    row2(
      cell(
        "Length of Diseased Segment",
        findings?.diseasedSegmentLength ? `${findings.diseasedSegmentLength} cm` : "",
      ),
      cell("Degree of Contamination", txt(findings?.contamination)),
    );
    row2(
      cell("Bowel Viability", txt(findings?.bowelViability)),
      cell("Adhesions", txt(findings?.adhesions)),
    );

    ensureSpace(112);
    sec("PROCEDURE DETAILS");
    const blockTop = y;
    const leftWidth = 82;
    const rightX = twoCol2X;
    const rightWidth = twoColWidth;
    const procedureEntries = [
      cell("Operation Done", txt(proc?.operationDone)),
      cell("Surgical Approach", toArray(proc?.approach).join(", ")),
      cell(
        "Reason for Conversion",
        joinSelections(toArray(proc?.reasonForConversion), proc?.reasonForConversionOther),
      ),
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
    ].filter(Boolean);

    let leftY = blockTop;
    procedureEntries.forEach((entry) => {
      const lines = pdf.splitTextToSize(entry, leftWidth);
      lines.forEach((line: string) => {
        pdf.text(line, margin, leftY);
        leftY += lineHeight;
      });
    });

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
    row3(
      cell(
        "Reconstruction Type",
        joinSelections(toArray(recon?.reconstructionType), recon?.reconstructionOther),
      ),
      showStomaFields
        ? cell(
            "Ileostomy Type",
            recon?.stomaDetails?.ileostomyType === "Other"
              ? txt(recon?.stomaDetails?.ileostomyTypeOther)
              : txt(recon?.stomaDetails?.ileostomyType),
          )
        : "",
      cell(
        "Linear Stapler Sizes",
        joinSelections(
          toArray(recon?.anastomosisDetails?.linearStaplerSize),
          recon?.anastomosisDetails?.linearStaplerSizeOther,
        ),
      ),
    );
    row3(
      cell("Site of Anastomosis", txt(recon?.anastomosisDetails?.site)),
      showStomaFields
        ? cell(
            "Stoma Location",
            recon?.stomaDetails?.location === "Other"
              ? txt(recon?.stomaDetails?.locationOther)
              : txt(recon?.stomaDetails?.location),
          )
        : "",
      cell(
        "Circular Stapler Sizes",
        joinSelections(
          toArray(recon?.anastomosisDetails?.circularStaplerSize),
          recon?.anastomosisDetails?.circularStaplerSizeOther,
        ),
      ),
    );
    row3(
      cell(
        "Configuration",
        recon?.anastomosisDetails?.configuration === "Other"
          ? txt(recon?.anastomosisDetails?.configurationOther)
          : txt(recon?.anastomosisDetails?.configuration),
      ),
      showStomaFields ? cell("Stoma Eversion", txt(recon?.stomaDetails?.eversion)) : "",
      "",
    );
    row3(
      cell("Anastomotic Technique", txt(recon?.anastomosisDetails?.technique)),
      showStomaFields ? cell("Site of Maturation", txt(recon?.stomaDetails?.maturationSite)) : "",
      "",
    );
    row3(
      cell(
        "Suture Material",
        joinSelections(
          toArray(recon?.anastomosisDetails?.sutureMaterial),
          recon?.anastomosisDetails?.sutureMaterialOther,
        ),
      ),
      showStomaFields
        ? cell(
            "Material Used",
            joinSelections(
              toArray(recon?.stomaDetails?.materialUsed),
              recon?.stomaDetails?.materialUsedOther,
            ),
          )
        : "",
      "",
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

    sec("COMPLICATIONS");
    row1(
      cell(
        "Points of Difficulty",
        joinSelections(toArray(events?.pointsOfDifficulty), events?.pointsOfDifficultyOther),
      ),
    );
    row1(
      cell(
        "Intraoperative Events/Complications",
        joinSelections(
          toArray(events?.intraoperativeEvents),
          events?.intraoperativeEventsOther,
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
    row1(cell("Additional Notes", txt(addInfo?.additionalInformation)));

    sec("POST OPERATIVE MANAGEMENT");
    row1(cell("Post Operative Management", txt(addInfo?.postOperativeManagement)));

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
      cell("Typed Signature", txt(addInfo?.surgeonSignatureText)),
      cell(
        "Date/Time",
        addInfo?.dateTime ? formatDateTimeDDMMYYYYWithDashes(addInfo.dateTime) : "",
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
