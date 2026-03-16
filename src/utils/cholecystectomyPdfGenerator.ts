import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { getFullASAText } from "@/utils/asaDescriptions";
import { formatPatientGender, normalizePatientInfo } from "@/utils/patientSticker";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

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

    const info = normalizePatientInfo(patientInfo || cholecystectomyData?.patientInfo || {});
    const preop = cholecystectomyData?.preoperative || {};
    const intra = cholecystectomyData?.intraoperative || {};
    const proc = cholecystectomyData?.procedure || {};
    const closure = cholecystectomyData?.closure || {};
    const addInfo = cholecystectomyData?.additionalInfo || {};
    const diagramCanvas = await createSurgicalDiagramCanvas(diagrams);
    const gender = formatPatientGender(info);
    const asaClassification = info.asaScore ? getFullASAText(info.asaScore) : "";

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
      ensureSpace(20);
      drawRule();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 5;
      drawRule();
      y += 1;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const txt = (v: any) => (v === undefined || v === null ? "" : String(v));

    const rowFull = (text: string) => {
      const lines = pdf.splitTextToSize(text || "", pageWidth - margin * 2);
      ensureSpace(lines.length * lineHeight + 1);
      lines.forEach((line: string) => {
        pdf.text(line, col1X, y);
        y += lineHeight;
      });
    };

    const row3 = (a: string, b: string, c: string) => {
      const l1 = pdf.splitTextToSize(a || "", 58);
      const l2 = pdf.splitTextToSize(b || "", 58);
      const l3 = pdf.splitTextToSize(c || "", 58);
      const lines = Math.max(l1.length, l2.length, l3.length, 1);
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i++) {
        if (l1[i]) pdf.text(l1[i], col1X, y);
        if (l2[i]) pdf.text(l2[i], col2X, y);
        if (l3[i]) pdf.text(l3[i], col3X, y);
        y += lineHeight;
      }
    };

    const row2 = (a: string, b: string) => {
      const l1 = pdf.splitTextToSize(a || "", 88);
      const l2 = pdf.splitTextToSize(b || "", 88);
      const lines = Math.max(l1.length, l2.length, 1);
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i++) {
        if (l1[i]) pdf.text(l1[i], col1X, y);
        if (l2[i]) pdf.text(l2[i], twoCol2X, y);
        y += lineHeight;
      }
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

    const patientSubsection = (title: string) => {
      ensureSpace(7);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(title, margin, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

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

    sec("PATIENT INFORMATION");
    patientSubsection("Patient Details");
    row3(
      `Patient Name: ${txt(info.name || patientName)}`,
      `Gender: ${gender}`,
      `Age: ${txt(info.age)}`
    );
    row3(
      `Patient ID: ${txt(info.patientId || patientId)}`,
      `Date Of Birth: ${formatDateDDMMYYYYWithDashes(info.dateOfBirth)}`,
      `Address: ${txt(info.address)}`
    );
    y += 1;
    patientSubsection("Medical Aid Details");
    row3(
      `Medical Aid Name: ${txt(info.medicalAidName)}`,
      `Medical Aid Number: ${txt(info.medicalAidNumber)}`,
      `Main Member: ${txt(info.mainMember)}`
    );
    row3(
      `Main Member ID: ${txt(info.mainMemberId)}`,
      `Work Number: ${txt(info.workNumber)}`,
      `Home Number: ${txt(info.homeNumber)}`
    );
    row3(`Authorization: ${txt(info.authorization)}`, `Depend Code: ${txt(info.dependCode)}`, "");
    y += 1;
    patientSubsection("Hospital Details");
    rowFull(`Hospital Name: ${txt(info.hospitalName)}`);
    rowFull(`Hospital Visit Number: ${txt(info.hospitalVisitNumber)}`);
    rowFull(`Doctor's Name: ${txt(info.doctorName)}`);
    rowFull(`Doctor's Practice Number: ${txt(info.doctorPracticeNumber)}`);
    rowFull(`ASA Physical Status Classification: ${asaClassification}`);
    if (txt(info.asaNotes)) {
      rowFull(`ASA Notes: ${txt(info.asaNotes)}`);
    }
    row3(`Weight: ${txt(info.weight)}`, `Height: ${txt(info.height)}`, `BMI: ${txt(info.bmi)}`);
    row3(
      `Date: ${formatDateDDMMYYYYWithDashes(info.visitDate)}`,
      `Time: ${txt(info.visitTime)}`,
      ""
    );
    y += 2;

    sec("PREOPERATIVE INFORMATION");
    row3(
      `Surgeon: ${(preop?.surgeons || []).filter((x: string) => x?.trim()).join(", ")}`,
      `Assistant: ${(preop?.assistants || []).filter((x: string) => x?.trim()).join(", ")}`,
      `Anaesthetist: ${(preop?.anaesthetists || []).filter((x: string) => x?.trim()).join(", ")}`
    );
    row3(`Start Time: ${txt(preop?.startTime)}`, `End Time: ${txt(preop?.endTime)}`, `Total Duration: ${preop?.duration ? `${preop.duration} minutes` : ""}`);
    row3(
      `Procedure Urgency: ${txt(preop?.procedureUrgency)}`,
      `Preoperative Imaging: ${joinSelections(toArray(preop?.imaging), preop?.imagingOther)}`,
      ""
    );
    rowFull(`Indication for Surgery: ${joinSelections(toArray(preop?.indication), preop?.indicationOther)}`);
    rowFull(`Operation Description: ${txt(preop?.operationDescription)}`);
    y += 2;

    sec("INTRAOPERATIVE FINDINGS");
    row2(
      `Gallbladder Appearance: ${joinSelections(toArray(intra?.gallbladderAppearance), intra?.gallbladderAppearanceOther)}`,
      `Adhesions to Gallbladder: ${txt(intra?.adhesionsToGallbladder)}`
    );
    y += 2;

    sec("PROCEDURE DETAILS");
    const blockTopCh = y;
    const leftXCh = col1X;
    const rightXCh = twoCol2X;
    const leftWCh = 82;
    const rightWCh = 80;
    let lyCh = blockTopCh;

    const addLeftCh = (label: string, value: string) => {
      const lines = pdf.splitTextToSize(`${label}: ${value}`, leftWCh);
      lines.forEach((line: string) => {
        pdf.text(line, leftXCh, lyCh);
        lyCh += lineHeight;
      });
    };

    addLeftCh("Surgical Approach", toArray(proc?.approach).join(", "));
    addLeftCh("Reason for Conversion", joinSelections(toArray(proc?.reasonForConversion), proc?.reasonForConversionOther));
    addLeftCh("Subtotal Cholecystectomy", txt(proc?.subtotalCholecystectomy));
    addLeftCh("Reason for Subtotal Cholecystectomy", joinSelections(toArray(proc?.subtotalReason), proc?.subtotalReasonOther));
    addLeftCh("Gall Bladder Decompression Required", txt(proc?.gallbladderDecompressionRequired));
    addLeftCh("Critical View of Safety - Calot's Triangle Dissected", txt(proc?.calotsTriangleDissected));
    addLeftCh("Critical View of Safety - Cystic Duct Identified", txt(proc?.cysticDuctIdentified));
    addLeftCh("Critical View of Safety - Cystic Artery Identified", txt(proc?.cysticArteryIdentified));
    addLeftCh("Critical View of Safety - Two Structures Entering Gall Bladder Confirmed", txt(proc?.twoStructuresConfirmed));

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("PORTS AND INCISIONS", rightXCh, blockTopCh);
    let ryCh = blockTopCh + 5;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text("Legend:", rightXCh, ryCh);
    pdf.setFont("helvetica", "normal");
    ryCh += 4;

    const legendCol1X = rightXCh;
    const legendCol2X = rightXCh + 40;

    pdf.text("Ports (with size label)", legendCol1X + 6, ryCh);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.line(legendCol1X, ryCh - 1, legendCol1X + 4, ryCh - 1);
    pdf.setFontSize(4);
    pdf.text("5mm", legendCol1X + 0.5, ryCh - 2);
    pdf.setFontSize(7.5);

    pdf.text("Ileostomy (dashed yellow circle)", legendCol2X + 6, ryCh);
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(0.8);
    pdf.setLineDashPattern([1.5, 1], 0);
    pdf.circle(legendCol2X + 2, ryCh - 1, 1.5);
    pdf.setLineDashPattern([], 0);

    ryCh += 4.5;

    pdf.text("Incisions (dashed dark red line)", legendCol1X + 6, ryCh);
    pdf.setDrawColor(139, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.setLineDashPattern([2, 1.5], 0);
    pdf.line(legendCol1X, ryCh - 1, legendCol1X + 4, ryCh - 1);
    pdf.setLineDashPattern([], 0);

    pdf.text("Colostomy (solid green circle)", legendCol2X + 6, ryCh);
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(1.2);
    pdf.circle(legendCol2X + 2, ryCh - 1, 1.5);

    ryCh += 5;
    pdf.setDrawColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const availableDiagramHeight = pageHeight - margin - ryCh - 2;
    const boxXCh = rightXCh;
    const boxYCh = ryCh;
    const boxWCh = rightWCh;
    const boxHCh = Math.min(46, Math.max(18, availableDiagramHeight));
    pdf.setLineWidth(0.5);
    pdf.rect(boxXCh, boxYCh, boxWCh, boxHCh);

    if (diagramCanvas) {
      const props = pdf.getImageProperties(diagramCanvas);
      const ar = props.width / props.height;
      const diagramPadding = 2;
      const availableWidth = boxWCh - diagramPadding * 2;
      const availableHeight = boxHCh - diagramPadding * 2;
      let w = availableWidth;
      let h = w / ar;
      if (h > availableHeight) {
        h = availableHeight;
        w = h * ar;
      }
      pdf.addImage(
        diagramCanvas,
        "PNG",
        boxXCh + (boxWCh - w) / 2,
        boxYCh + (boxHCh - h) / 2,
        w,
        h
      );
    } else {
      pdf.setFontSize(8);
      pdf.text("CHOLECYSTECTOMY DIAGRAM", boxXCh + boxWCh / 2, boxYCh + boxHCh / 2, {
        align: "center",
      });
      pdf.setFontSize(9);
    }

    y = Math.max(lyCh, boxYCh + boxHCh) + 5;

    pdf.addPage();
    y = margin;

    sec("PROCEDURE DETAILS");
    rowFull(`Cystic Duct Control: ${joinSelections(toArray(proc?.cysticDuctControl), proc?.cysticDuctControlOther)}`);
    rowFull(`Cystic Artery Control: ${joinSelections(toArray(proc?.cysticArteryControl), proc?.cysticArteryControlOther)}`);
    rowFull(
      `Gall Bladder Dissected from Liver Bed: ${joinSelections(
        toArray(proc?.gallbladderDissectedFromLiverBed),
        proc?.gallbladderDissectedFromLiverBedOther
      )}`
    );
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

    sec("COMPLICATIONS");
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

    sec("SPECIMEN");
    rowFull("Specimen: Gall Bladder");
    rowFull(`Specimen Sent to Laboratory: ${txt(closure?.gallbladderSentForHistology)}`);
    rowFull(`Specify Laboratory Sent to: ${txt(closure?.laboratoryName)}`);

    sec("ADDITIONAL NOTES");
    rowFull(`Additional Notes: ${txt(addInfo?.additionalInformation)}`);

    sec("POST OPERATIVE MANAGEMENT");
    rowFull(`Post Operative Management: ${txt(addInfo?.postOperativeManagement)}`);

    sec("SURGEON'S SIGNATURE");
    if (addInfo?.surgeonSignature && String(addInfo.surgeonSignature).startsWith("data:image")) {
      ensureSpace(24);
      const sig = await calculateSignatureDimensions(addInfo.surgeonSignature);
      pdf.addImage(addInfo.surgeonSignature, "PNG", margin, y, sig.width, sig.height);
      y += sig.height + 3;
    }
    row2(
      `Typed Signature: ${txt(addInfo?.surgeonSignatureText)}`,
      `Date/Time: ${addInfo?.dateTime ? formatDateTimeDDMMYYYYWithDashes(addInfo.dateTime) : ""}`
    );

    return { success: true, blob: pdf.output("blob") };
  } catch (error) {
    console.error("Error generating cholecystectomy PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
};
