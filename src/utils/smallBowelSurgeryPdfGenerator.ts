import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import { formatDateDDMMYYYY, formatDateTimeWithColon } from "@/utils/dateFormatter";
import { getPatientInfoPdfSections } from "@/utils/patientSticker";

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

export const generateSmallBowelSurgeryPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  smallBowelData: any,
  patientInfo?: any
) => {
  try {
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const lineHeight = 4.5;
    let y = margin;

    const info = patientInfo || smallBowelData?.patientInfo || {};
    const preop = smallBowelData?.preoperative || {};
    const findings = smallBowelData?.operativeFindings || {};
    const proc = smallBowelData?.procedure || {};
    const recon = smallBowelData?.reconstruction || {};
    const events = smallBowelData?.operativeEvents || {};
    const closure = smallBowelData?.closure || {};
    const addInfo = smallBowelData?.additionalInfo || {};
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
    pdf.text("SMALL BOWEL SURGERY REPORT", pageWidth / 2, y, { align: "center" });
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

    sec("PATIENT INFORMATION");
    getPatientInfoPdfSections(info, patientName, patientId).forEach((section, sectionIndex, sections) => {
      if (section.title) {
        patientSubsection(section.title);
      }
      section.rows.forEach((row) => row3(row[0], row[1], row[2]));
      if (sectionIndex < sections.length - 1) {
        y += 1;
      }
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
      `Procedure Urgency: ${txt(preop?.procedureUrgency)}`,
      `Preoperative Imaging: ${joinSelections(toArray(preop?.imaging), preop?.imagingOther)}`,
      `Indication for Surgery: ${txt(preop?.indication)}`
    );
    row3(`Operation Description: ${txt(preop?.operationDescription)}`, "", "");
    y += 2;

    sec("OPERATIVE FINDINGS");
    row2(`Description of Operation Findings: ${txt(findings?.description)}`, `Pathology Found: ${joinSelections(toArray(findings?.pathology), findings?.pathologyOther)}`);
    row2(`Distance from DJ Flexure: ${findings?.distanceFromDjFlexure ? `${findings.distanceFromDjFlexure} cm` : ""}`, `Mesenteric Involvement: ${txt(findings?.mesentericInvolvement)}`);
    row2(`Distance from Ileocecal Valve: ${findings?.distanceFromIleocecalValve ? `${findings.distanceFromIleocecalValve} cm` : ""}`, `Lymph Nodes: ${txt(findings?.lymphNodes)}`);
    row2(`Length of Diseased Segment: ${findings?.diseasedSegmentLength ? `${findings.diseasedSegmentLength} cm` : ""}`, `Adhesions: ${txt(findings?.adhesions)}`);
    row2(`Degree of Contamination: ${txt(findings?.contamination)}`, `Bowel Viability: ${txt(findings?.bowelViability)}`);

    sec("PROCEDURE DETAILS");
    const blockTopSb = y;
    const leftXSb = col1X;
    const rightXSb = twoCol2X;
    const leftWSb = 82;
    const rightWSb = 80;
    let lySb = blockTopSb;

    const addLeftSb = (label: string, value: string) => {
      if (!value || !value.trim()) return;
      const lines = pdf.splitTextToSize(`${label}: ${value}`, leftWSb);
      ensureSpace(lines.length * lineHeight + 1);
      lines.forEach((line: string) => {
        pdf.text(line, leftXSb, lySb);
        lySb += lineHeight;
      });
    };

    addLeftSb("Operation Done", txt(proc?.operationDone));
    addLeftSb("Surgical Approach", toArray(proc?.approach).join(", "));
    addLeftSb("Reason for Conversion", joinSelections(toArray(proc?.reasonForConversion), proc?.reasonForConversionOther));
    addLeftSb("Procedure Performed", joinSelections(toArray(proc?.procedurePerformed), proc?.procedurePerformedOther));
    addLeftSb("Length Resected", proc?.lengthResected ? `${proc.lengthResected} cm` : "");
    addLeftSb("Margins", toArray(proc?.margins).join(", "));
    addLeftSb("Vascular Control", joinSelections(toArray(proc?.vascularControl), proc?.vascularControlOther));
    addLeftSb("Adhesiolysis", txt(proc?.adhesiolysis));
    addLeftSb(
      "Peritoneal Lavage",
      proc?.peritonealLavage === "Yes" && proc?.peritonealLavageVolume
        ? `Yes (${proc.peritonealLavageVolume})`
        : txt(proc?.peritonealLavage)
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("PORTS AND INCISIONS", rightXSb, blockTopSb);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let rySb = blockTopSb + 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Legend:", rightXSb, rySb);
    pdf.setFont("helvetica", "normal");
    rySb += 4;
    pdf.setTextColor(0, 0, 0);
    pdf.text("—  Ports (with size)", rightXSb, rySb);
    rySb += 4;
    pdf.setTextColor(139, 0, 0);
    pdf.text("- -  Incisions", rightXSb, rySb);
    pdf.setTextColor(0, 0, 0);
    rySb += 4;

    const boxXSb = rightXSb;
    const boxYSb = rySb + 1;
    const boxWSb = rightWSb;
    const boxHSb = 70;
    ensureSpace(boxHSb + 6);
    pdf.rect(boxXSb, boxYSb, boxWSb, boxHSb);

    if (diagramCanvas) {
      const props = pdf.getImageProperties(diagramCanvas);
      const ar = props.width / props.height;
      let w = boxWSb - 4;
      let h = w / ar;
      if (h > boxHSb - 4) {
        h = boxHSb - 4;
        w = h * ar;
      }
      pdf.addImage(diagramCanvas, "PNG", boxXSb + (boxWSb - w) / 2, boxYSb + (boxHSb - h) / 2, w, h);
    } else {
      pdf.text("(No surgical markings)", boxXSb + 20, boxYSb + boxHSb / 2);
    }

    y = Math.max(lySb, boxYSb + boxHSb) + 4;

    sec("RECONSTRUCTION");
    row2(`Reconstruction Type: ${joinSelections(toArray(recon?.reconstructionType), recon?.reconstructionOther)}`, `Site of Anastomosis: ${txt(recon?.anastomosisDetails?.site)}`);
    row2(`Configuration: ${recon?.anastomosisDetails?.configuration === "Other" ? `Other: ${txt(recon?.anastomosisDetails?.configurationOther)}` : txt(recon?.anastomosisDetails?.configuration)}`, `Technique: ${txt(recon?.anastomosisDetails?.technique)}`);
    row2(`Suture Material: ${joinSelections(toArray(recon?.anastomosisDetails?.sutureMaterial), recon?.anastomosisDetails?.sutureMaterialOther)}`, `Linear Stapler: ${joinSelections(toArray(recon?.anastomosisDetails?.linearStaplerSize), recon?.anastomosisDetails?.linearStaplerSizeOther)}`);
    row2(`Circular Stapler: ${joinSelections(toArray(recon?.anastomosisDetails?.circularStaplerSize), recon?.anastomosisDetails?.circularStaplerSizeOther)}`, `Ileostomy Type: ${recon?.stomaDetails?.ileostomyType === "Other" ? `Other: ${txt(recon?.stomaDetails?.ileostomyTypeOther)}` : txt(recon?.stomaDetails?.ileostomyType)}`);
    row2(`Stoma Location: ${recon?.stomaDetails?.location === "Other" ? `Other: ${txt(recon?.stomaDetails?.locationOther)}` : txt(recon?.stomaDetails?.location)}`, `Stoma Eversion: ${txt(recon?.stomaDetails?.eversion)}`);

    sec("CLOSURE");
    row2(`Fascial Closure: ${joinSelections(toArray(closure?.fascialClosure), closure?.fascialClosureOther)}`, `Fascial Material: ${joinSelections(toArray(closure?.fascialSutureMaterial), closure?.fascialSutureMaterialOther)}`);
    row2(`Skin Closure: ${joinSelections(toArray(closure?.skinClosure), closure?.skinClosureOther)}`, `Skin Material: ${joinSelections(toArray(closure?.skinClosureMaterial), closure?.skinClosureMaterialOther)}`);

    sec("COMPLICATIONS");
    row2(`Points of Difficulty: ${joinSelections(toArray(events?.pointsOfDifficulty), events?.pointsOfDifficultyOther)}`, `Intra-op Events: ${joinSelections(toArray(events?.intraoperativeEvents), events?.intraoperativeEventsOther)}`);

    sec("SPECIMEN");
    row2(`Specimen: ${joinSelections(toArray(events?.specimen), events?.specimenOther)}`, `Wound Protector: ${txt(events?.woundProtector)}`);
    row2(`Peritoneal Drainage: ${txt(events?.drainInsertion)}`, `Drain Type: ${joinSelections(toArray(events?.drainType), events?.drainTypeOther)}`);
    row2(`Drain Placement: ${joinSelections(toArray(events?.intraPeritonealPlacement), events?.intraPeritonealPlacementOther)}`, `Drain Exit Site: ${joinSelections(toArray(events?.drainExitSite), events?.drainExitSiteOther)}`);

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
    console.error("Error generating small bowel surgery PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
