import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import { formatDateDDMMYYYY, formatDateTimeWithColon } from "@/utils/dateFormatter";
import { getFullASAText } from "@/utils/asaDescriptions";

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
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      markings.forEach((marking) => {
        if (marking.type === "port") {
          ctx.save();
          ctx.font = "bold 10px Arial";
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(marking.size, marking.x, marking.y - 3);
          ctx.beginPath();
          ctx.moveTo(marking.x - 10, marking.y);
          ctx.lineTo(marking.x + 10, marking.y);
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "stoma") {
          ctx.save();
          ctx.beginPath();
          ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);
          ctx.strokeStyle = marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
          ctx.lineWidth = marking.stomaType === "ileostomy" ? 2 : 4;
          ctx.setLineDash(marking.stomaType === "ileostomy" ? [5, 3] : []);
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "incision") {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = "#8B0000";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
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

    const info = patientInfo || cholecystectomyData?.patientInfo || {};
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
      // Extra top padding so section headers don't crowd previous rows
      y += 3;
      ensureSpace(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 6;
      drawRule();
      // Slight breathing room under divider
      y += 1;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const txt = (v: any) => (v === undefined || v === null ? "" : String(v));

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

    sec("PATIENT INFORMATION");
    row3(`Name: ${txt(info?.name || patientName)}`, `Patient ID: ${txt(info?.patientId || patientId)}`, "");
    row3(
      `Date Of Birth: ${info?.dateOfBirth ? formatDateDDMMYYYY(info.dateOfBirth) : ""}`,
      `Age: ${txt(info?.age)}`,
      `Sex: ${info?.sex === "other" && info?.sexOther ? info.sexOther : txt(info?.sex)}`
    );
    row3(`Weight: ${txt(info?.weight)}`, `Height: ${txt(info?.height)}`, `BMI: ${txt(info?.bmi)}`);
    row3(`ASA Score: ${info?.asaScore ? getFullASAText(info.asaScore) : ""}`, `ASA Notes: ${txt(info?.asaNotes)}`, "");
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
      `Indication for Surgery: ${joinSelections(toArray(preop?.indication), preop?.indicationOther)}`
    );
    row3(`Operation Description: ${txt(preop?.operationDescription)}`, "", "");
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
      if (!value || !value.trim()) return;
      const lines = pdf.splitTextToSize(`${label}: ${value}`, leftWCh);
      ensureSpace(lines.length * lineHeight + 1);
      lines.forEach((line: string) => {
        pdf.text(line, leftXCh, lyCh);
        lyCh += lineHeight;
      });
    };

    addLeftCh("Surgical Approach", toArray(proc?.approach).join(", "));
    addLeftCh("Reason for Conversion", joinSelections(toArray(proc?.reasonForConversion), proc?.reasonForConversionOther));
    addLeftCh("Subtotal Cholecystectomy", txt(proc?.subtotalCholecystectomy));
    addLeftCh("Subtotal Reason", joinSelections(toArray(proc?.subtotalReason), proc?.subtotalReasonOther));
    addLeftCh("Gall Bladder Decompression Required", txt(proc?.gallbladderDecompressionRequired));
    addLeftCh("Critical View if Safety - Calot's Triangle Dissected", txt(proc?.calotsTriangleDissected));
    addLeftCh("Critical View if Safety - Cystic Duct Identified", txt(proc?.cysticDuctIdentified));
    addLeftCh("Critical View if Safety - Two Structures Entering Gall Bladder Confirmed", txt(proc?.twoStructuresConfirmed));
    addLeftCh("Gall Bladder Dissected from Liver Bed", joinSelections(toArray(proc?.gallbladderDissectedFromLiverBed), proc?.gallbladderDissectedFromLiverBedOther));
    addLeftCh("Cystic Duct Control", joinSelections(toArray(proc?.cysticDuctControl), proc?.cysticDuctControlOther));
    addLeftCh("Cystic Artery Control", joinSelections(toArray(proc?.cysticArteryControl), proc?.cysticArteryControlOther));
    addLeftCh("Bile Spillage", txt(proc?.bileSpillage));
    addLeftCh("Stones Spillage", txt(proc?.stonesSpillage));
    addLeftCh("Additional Procedures", joinSelections(toArray(proc?.additionalProcedures), proc?.additionalProceduresOther));
    addLeftCh("Cholangiogram", joinSelections(toArray(proc?.cholangiogramFindings), proc?.cholangiogramOther));
    addLeftCh("Gall Bladder Retrieval", joinSelections(toArray(proc?.gallbladderRetrieval), proc?.gallbladderRetrievalOther));
    addLeftCh("Drain Insertion", txt(proc?.drainInsertion));
    addLeftCh("Drain Type", joinSelections(toArray(proc?.drainType), proc?.drainTypeOther));
    addLeftCh("Intra-Peritoneal Placement", joinSelections(toArray(proc?.intraPeritonealPlacement), proc?.intraPeritonealPlacementOther));
    addLeftCh("Drain Exit Site", joinSelections(toArray(proc?.drainExitSite), proc?.drainExitSiteOther));

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("PORTS AND INCISIONS", rightXCh, blockTopCh);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let ryCh = blockTopCh + 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Legend:", rightXCh, ryCh);
    pdf.setFont("helvetica", "normal");
    ryCh += 5;

    // Port symbol
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.6);
    pdf.line(rightXCh, ryCh - 1, rightXCh + 8, ryCh - 1);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Ports (with size)", rightXCh + 11, ryCh);
    ryCh += 5;

    // Ileostomy symbol (dashed yellow circle)
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(0.7);
    pdf.setLineDashPattern([1.2, 1.2], 0);
    pdf.circle(rightXCh + 4, ryCh - 1.5, 2.2);
    pdf.setLineDashPattern([], 0);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Ileostomy (dashed yellow circle)", rightXCh + 11, ryCh);
    ryCh += 5;

    // Colostomy symbol (solid green circle)
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(0.8);
    pdf.circle(rightXCh + 4, ryCh - 1.5, 2.2);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Colostomy (solid green circle)", rightXCh + 11, ryCh);
    ryCh += 5;

    // Incision symbol (dashed dark red)
    pdf.setDrawColor(127, 29, 29);
    pdf.setLineWidth(0.7);
    pdf.setLineDashPattern([1.5, 1.5], 0);
    pdf.line(rightXCh, ryCh - 1, rightXCh + 8, ryCh - 1);
    pdf.setLineDashPattern([], 0);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Incisions (dashed dark red line)", rightXCh + 11, ryCh);
    ryCh += 4;

    const boxXCh = rightXCh;
    const boxYCh = ryCh + 1;
    const boxWCh = rightWCh;
    const boxHCh = 70;
    ensureSpace(boxHCh + 6);
    pdf.rect(boxXCh, boxYCh, boxWCh, boxHCh);

    if (diagramCanvas) {
      const props = pdf.getImageProperties(diagramCanvas);
      const ar = props.width / props.height;
      let w = boxWCh - 4;
      let h = w / ar;
      if (h > boxHCh - 4) {
        h = boxHCh - 4;
        w = h * ar;
      }
      pdf.addImage(diagramCanvas, "PNG", boxXCh + (boxWCh - w) / 2, boxYCh + (boxHCh - h) / 2, w, h);
    } else {
      pdf.text("(No surgical markings)", boxXCh + 20, boxYCh + boxHCh / 2);
    }

    y = Math.max(lyCh, boxYCh + boxHCh) + 4;

    sec("CLOSURE");
    row2(`Fascial Closure: ${txt(closure?.fascialClosure)}`, `Skin Closure: ${txt(closure?.skinClosure)}`);
    row2(`Fascial Closure Sites: ${joinSelections(toArray(closure?.fascialClosureSites))}`, `Fascial Suture Material: ${joinSelections(toArray(closure?.fascialSutureMaterial), closure?.fascialSutureMaterialOther)}`);
    row2(`Skin Closure Method: ${joinSelections(toArray(closure?.skinClosureMethod), closure?.skinClosureOther)}`, "");

    sec("COMPLICATIONS");
    row2(`Intra-op Difficulty: ${joinSelections(toArray(closure?.intraoperativeDifficulty), closure?.intraoperativeDifficultyOther)}`, `Complications: ${joinSelections(toArray(closure?.complications), closure?.complicationsOther)}`);

    sec("SPECIMEN");
    row2(`Histology: ${txt(closure?.gallbladderSentForHistology)}`, `Laboratory: ${txt(closure?.laboratoryName)}`);

    sec("ADDITIONAL NOTES");
    row2(`Additional Information: ${txt(addInfo?.additionalInformation)}`, "");

    sec("POST OPERATIVE MANAGEMENT");
    row2(`Post Operative Management: ${txt(addInfo?.postOperativeManagement)}`, "");

    sec("SURGEON'S SIGNATURE");
    if (addInfo?.surgeonSignature && String(addInfo.surgeonSignature).startsWith("data:image")) {
      ensureSpace(24);
      const sig = await calculateSignatureDimensions(addInfo.surgeonSignature);
      pdf.addImage(addInfo.surgeonSignature, "PNG", margin, y, sig.width, sig.height);
      y += sig.height + 3;
    }
    row2(`Typed Signature: ${txt(addInfo?.surgeonSignatureText)}`, `Date/Time: ${addInfo?.dateTime ? formatDateTimeWithColon(addInfo.dateTime) : ""}`);

    return { success: true, blob: pdf.output("blob") };
  } catch (error) {
    console.error("Error generating cholecystectomy PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
};
