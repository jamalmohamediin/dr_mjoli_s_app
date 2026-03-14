import jsPDF from "jspdf";
import { formatDateDDMMYYYY, formatDateTimeWithColon } from "@/utils/dateFormatter";
import {
  getPeriAnalAdditionalFindingSection,
  getPeriAnalFindingSections,
  joinSelections,
  parsePeriAnalDiagramState,
} from "@/utils/periAnalHelpers";
import { getPatientInfoPdfSections } from "@/utils/patientSticker";
import neutralDiagram from "@/assets/peri-anal-neutral.svg";
import femaleDiagram from "@/assets/peri-anal-female.svg";

const diagramImages: Record<string, string> = {
  neutral: neutralDiagram,
  female: femaleDiagram,
};

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

const createSurgicalDiagramCanvas = async (
  markings: any[],
  diagramImage: string
): Promise<string | null> => {
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

      (markings || []).forEach((marking) => {
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
    image.src = diagramImage;
  });
};

export const generatePeriAnalPDF = async (
  patientName: string,
  patientId: string,
  periAnalData: any,
  patientInfo?: any
) => {
  try {
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const lineHeight = 4.5;
    let y = margin;

    const info = patientInfo || periAnalData?.patientInfo || {};
    const preop = periAnalData?.preoperative || {};
    const woundManagement = periAnalData?.woundManagement || {};
    const complications = periAnalData?.complications || {};
    const postOperativePlan = periAnalData?.postOperativePlan || {};
    const specimen = periAnalData?.specimen || {};
    const addInfo = periAnalData?.additionalInfo || {};
    const findingsSummary = getPeriAnalAdditionalFindingSection(periAnalData);
    const findingSections = getPeriAnalFindingSections(periAnalData);
    const diagramState = parsePeriAnalDiagramState(periAnalData?.procedureFindings);
    const activeVariant = diagramState.activeVariant || "neutral";
    const activeMarkings = diagramState.markingsByVariant?.[activeVariant] || [];
    const diagramCanvas = await createSurgicalDiagramCanvas(
      activeMarkings,
      diagramImages[activeVariant] || neutralDiagram
    );

    const col1X = margin;
    const col2X = margin + 63;
    const col3X = margin + 126;
    const twoCol2X = margin + 95;

    const txt = (value: any) => (value === undefined || value === null ? "" : String(value));

    const ensureSpace = (height = 10) => {
      if (y + height > pageHeight - 20) {
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
      y += 3;
      ensureSpace(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 6;
      drawRule();
      y += 1;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
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

    const writeEntries = (entries: { label: string; value: string }[]) => {
      entries.forEach((entry) => {
        const lines = pdf.splitTextToSize(`${entry.label}: ${entry.value}`, pageWidth - margin * 2);
        ensureSpace(lines.length * lineHeight + 1);
        lines.forEach((line: string) => {
          pdf.text(line, margin, y);
          y += lineHeight;
        });
      });
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
    pdf.setFontSize(11);
    pdf.text("Peri-Anal Report", pageWidth / 2, y, { align: "center" });
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

    sec("Patient Information");
    getPatientInfoPdfSections(info, patientName, patientId).forEach((section, sectionIndex, sections) => {
      if (section.title) {
        patientSubsection(section.title);
      }
      section.rows.forEach((row) => row3(row[0], row[1], row[2]));
      if (sectionIndex < sections.length - 1) {
        y += 1;
      }
    });

    sec("Preoperative Information");
    row3(
      `Surgeon: ${(preop?.surgeons || []).filter((x: string) => x?.trim()).join(", ")}`,
      `Assistant: ${(preop?.assistants || []).filter((x: string) => x?.trim()).join(", ")}`,
      `Anaesthetist: ${(preop?.anaesthetists || []).filter((x: string) => x?.trim()).join(", ")}`
    );
    row3(
      `Start Time: ${txt(preop?.startTime)}`,
      `End Time: ${txt(preop?.endTime)}`,
      `Total Duration: ${preop?.duration ? `${preop.duration} minutes` : ""}`
    );
    row3(
      `Procedure Urgency: ${txt(preop?.procedureUrgency)}`,
      `Preoperative Imaging: ${joinSelections(preop?.imaging, preop?.imagingOther)}`,
      `Position In Theatre: ${preop?.positionInTheatre === "Other" ? txt(preop?.positionOther) : txt(preop?.positionInTheatre)}`
    );
    row2(`Indication For Surgery: ${txt(preop?.indication)}`, "");
    row2(`Operation Description: ${txt(preop?.operationDescription)}`, "");

    if (findingsSummary) {
      sec(findingsSummary.title);
      writeEntries(findingsSummary.entries);
    }

    if (diagramCanvas) {
      sec("Peri-Anal Diagram");
      const blockTop = y;
      const rightX = twoCol2X;
      const rightW = 80;
      let legendY = blockTop;

      pdf.setFont("helvetica", "bold");
      pdf.text("Legend:", rightX, legendY);
      pdf.setFont("helvetica", "normal");
      legendY += 5;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.6);
      pdf.line(rightX, legendY - 1, rightX + 8, legendY - 1);
      pdf.text("Ports (With Size Label)", rightX + 11, legendY);
      legendY += 5;

      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(0.7);
      pdf.setLineDashPattern([1.2, 1.2], 0);
      pdf.circle(rightX + 4, legendY - 1.5, 2.2);
      pdf.setLineDashPattern([], 0);
      pdf.text("Ileostomy (Dashed Yellow Circle)", rightX + 11, legendY);
      legendY += 5;

      pdf.setDrawColor(22, 163, 74);
      pdf.setLineWidth(0.8);
      pdf.circle(rightX + 4, legendY - 1.5, 2.2);
      pdf.text("Colostomy (Solid Green Circle)", rightX + 11, legendY);
      legendY += 5;

      pdf.setDrawColor(127, 29, 29);
      pdf.setLineWidth(0.7);
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.line(rightX, legendY - 1, rightX + 8, legendY - 1);
      pdf.setLineDashPattern([], 0);
      pdf.text("Incisions (Dashed Dark Red Line)", rightX + 11, legendY);
      legendY += 4;

      const boxX = rightX;
      const boxY = legendY + 1;
      const boxW = rightW;
      const boxH = 70;
      ensureSpace(boxH + 6);
      pdf.rect(boxX, boxY, boxW, boxH);
      const props = pdf.getImageProperties(diagramCanvas);
      const ar = props.width / props.height;
      let w = boxW - 4;
      let h = w / ar;
      if (h > boxH - 4) {
        h = boxH - 4;
        w = h * ar;
      }
      pdf.addImage(diagramCanvas, "PNG", boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h);

      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Diagram View: ${activeVariant === "female" ? "Female Perineal Anatomy" : "Neutral Peri-Anal"}`,
        margin,
        blockTop + 4
      );
      y = boxY + boxH + 4;
    }

    findingSections.forEach((section) => {
      if (section.entries.length === 0) return;
      sec(section.title);
      writeEntries(section.entries);
    });

    sec("Wound Management");
    writeEntries(
      [
        { label: "Irrigation Solution", value: joinSelections(woundManagement?.irrigationSolution, woundManagement?.irrigationSolutionOther) },
      ].filter((entry) => entry.value)
    );

    sec("Closure");
    writeEntries(
      [
        { label: "Wound Closure", value: txt(woundManagement?.woundClosure) },
        { label: "Dressing Applied", value: joinSelections(woundManagement?.dressingApplied, woundManagement?.dressingAppliedOther) },
        { label: "Anal Pack Inserted", value: txt(woundManagement?.analPackInserted) },
      ].filter((entry) => entry.value)
    );

    sec("Complications");
    writeEntries(
      [
        {
          label: "Intraoperative Complications",
          value: joinSelections(
            complications?.intraoperativeComplications,
            complications?.intraoperativeComplicationsOther
          ),
        },
      ].filter((entry) => entry.value)
    );

    sec("Specimen");
    writeEntries(
      [
        { label: "Sent For Histology", value: txt(specimen?.sentForHistology) },
        { label: "Sent For Microbiology", value: txt(specimen?.sentForMicrobiology) },
      ].filter((entry) => entry.value)
    );

    sec("Additional Notes");
    writeEntries([{ label: "Additional Notes", value: txt(addInfo?.additionalInformation) }].filter((entry) => entry.value));

    sec("Post Operative Management");
    writeEntries(
      [
        { label: "Analgesia", value: txt(postOperativePlan?.analgesia) },
        { label: "Antibiotics (If Indicated)", value: txt(postOperativePlan?.antibiotics) },
        { label: "Sitz Baths", value: txt(postOperativePlan?.sitzBaths) },
        { label: "Packing Removal Time", value: txt(postOperativePlan?.packingRemovalTime) },
        { label: "Plan For Further Surgery", value: txt(postOperativePlan?.planForFurtherSurgery) },
        { label: "Post Operative Management", value: txt(addInfo?.postOperativeManagement) },
      ].filter((entry) => entry.value)
    );

    sec("Surgeon's Signature");
    if (addInfo?.surgeonSignature && String(addInfo.surgeonSignature).startsWith("data:image")) {
      ensureSpace(24);
      const sig = await calculateSignatureDimensions(addInfo.surgeonSignature);
      pdf.addImage(addInfo.surgeonSignature, "PNG", margin, y, sig.width, sig.height);
      y += sig.height + 3;
    }
    row2(
      `Typed Signature: ${txt(addInfo?.surgeonSignatureText)}`,
      `Date/Time: ${addInfo?.dateTime ? formatDateTimeWithColon(addInfo.dateTime) : ""}`
    );

    return {
      success: true,
      blob: pdf.output("blob"),
    };
  } catch (error) {
    console.error("Error generating peri-anal PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed To Generate PDF",
    };
  }
};
