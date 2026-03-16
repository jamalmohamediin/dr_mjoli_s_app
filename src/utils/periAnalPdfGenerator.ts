import jsPDF from "jspdf";
import { formatDateTimeDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import { getFullASAText } from "@/utils/asaDescriptions";
import {
  getPeriAnalAdditionalFindingSection,
  getPeriAnalFindingSections,
  joinSelections,
  parsePeriAnalDiagramState,
} from "@/utils/periAnalHelpers";
import {
  formatPatientGender,
  formatPatientStickerDate,
  normalizePatientInfo,
} from "@/utils/patientSticker";
import {
  PERI_ANAL_DIAGRAM_VARIANTS,
  periAnalDiagramImages,
} from "@/utils/periAnalDiagramConfig";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

const PERI_ANAL_DIAGRAM_MARKING_SCALE = 1.8;

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
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(PERI_ANAL_DIAGRAM_MARKING_SCALE);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      (markings || []).forEach((marking) => {
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

    const info = normalizePatientInfo(patientInfo || periAnalData?.patientInfo || {});
    const preop = periAnalData?.preoperative || {};
    const woundManagement = periAnalData?.woundManagement || {};
    const complications = periAnalData?.complications || {};
    const postOperativePlan = periAnalData?.postOperativePlan || {};
    const specimen = periAnalData?.specimen || {};
    const addInfo = periAnalData?.additionalInfo || {};
    const findingsSummary = getPeriAnalAdditionalFindingSection(periAnalData);
    const findingSections = getPeriAnalFindingSections(periAnalData);
    const diagramState = parsePeriAnalDiagramState(periAnalData?.procedureFindings);
    const diagramCanvasEntries = await Promise.all(
      PERI_ANAL_DIAGRAM_VARIANTS.map(async (variant) => ({
        ...variant,
        canvas: await createSurgicalDiagramCanvas(
          diagramState.markingsByVariant?.[variant.key] || [],
          periAnalDiagramImages[variant.key],
        ),
      })),
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

    const row1 = (value: string) => {
      const lines = pdf.splitTextToSize(value || "", pageWidth - margin * 2);
      const safeLines = lines.length > 0 ? lines : [""];
      ensureSpace(safeLines.length * lineHeight + 1);
      safeLines.forEach((line: string) => {
        if (line) {
          pdf.text(line, margin, y);
        }
        y += lineHeight;
      });
    };

    const startSection = (title: string, options?: { withDivider?: boolean }) => {
      const withDivider = options?.withDivider ?? true;
      if (withDivider) {
        y += 2;
        drawRule();
      } else {
        y += 3;
      }

      ensureSpace(8);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const startTwoColumnSection = (leftTitle: string, rightTitle: string) => {
      y += 2;
      drawRule();
      ensureSpace(8);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(leftTitle, margin, y);
      pdf.text(rightTitle, twoCol2X, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    const writeColumnEntries = (
      entries: { label: string; value: string }[],
      x: number,
      width: number,
      initialY: number
    ) => {
      let currentY = initialY;
      entries.forEach((entry) => {
        const lines = pdf.splitTextToSize(`${entry.label}: ${entry.value}`, width);
        const safeLines = lines.length > 0 ? lines : [""];
        safeLines.forEach((line: string) => {
          if (line) {
            pdf.text(line, x, currentY);
          }
          currentY += lineHeight;
        });
      });
      return currentY;
    };

    const patientNameValue = txt(info.name || patientName);
    const patientIdValue = txt(info.patientId || patientId);
    const patientGender = formatPatientGender(info);
    const asaClassification = info.asaScore ? getFullASAText(info.asaScore) : "";

    startSection("Patient Details", { withDivider: false });
    row3(
      `Patient Name: ${patientNameValue}`,
      `Gender: ${patientGender}`,
      `Age: ${txt(info.age)}`
    );
    row3(
      `Patient ID: ${patientIdValue}`,
      `Date Of Birth: ${formatPatientStickerDate(info.dateOfBirth)}`,
      `Address: ${txt(info.address)}`
    );

    startSection("Medical Aid Details");
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
    row3(
      `Authorization: ${txt(info.authorization)}`,
      `Depend Code: ${txt(info.dependCode)}`,
      ""
    );

    startSection("Hospital Details");
    row1(`Hospital Name: ${txt(info.hospitalName)}`);
    row1(`Hospital Visit Number: ${txt(info.hospitalVisitNumber)}`);
    row1(`Doctor's Name: ${txt(info.doctorName)}`);
    row1(`Doctor's Practice Number: ${txt(info.doctorPracticeNumber)}`);
    row1(`ASA Physical Status Classification: ${asaClassification}`);
    if (txt(info.asaNotes)) {
      row1(`ASA Notes: ${txt(info.asaNotes)}`);
    }
    row3(
      `Weight: ${txt(info.weight)}`,
      `Height: ${txt(info.height)}`,
      `BMI: ${txt(info.bmi)}`
    );
    row3(
      `Date: ${formatPatientStickerDate(info.visitDate)}`,
      `Time: ${txt(info.visitTime)}`,
      ""
    );

    startSection("Preoperative Information");
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
      ""
    );
    row1(`Indication For Surgery: ${txt(preop?.indication)}`);
    row1(`Operation Description: ${txt(preop?.operationDescription)}`);
    if (txt(preop?.positionInTheatre) || txt(preop?.positionOther)) {
      row1(
        `Position In Theatre: ${
          preop?.positionInTheatre === "Other" ? txt(preop?.positionOther) : txt(preop?.positionInTheatre)
        }`
      );
    }

    startSection("Findings Summary");
    writeEntries(
      findingsSummary?.entries?.length
        ? findingsSummary.entries
        : [{ label: "Summary", value: "No findings summary recorded" }],
    );

    startSection("Peri-Anal Diagrams");
    row1("Legend: Ports (With Size Label), Ileostomy (Dashed Yellow Circle), Colostomy (Solid Green Circle), Incisions (Dashed Dark Red Line)");
    const diagramGridHeight = 144;
    ensureSpace(diagramGridHeight + 16);
    const gridStartY = y;
    const cellGap = 8;
    const cellWidth = (pageWidth - margin * 2 - cellGap) / 2;
    const cellHeight = 58;
    const titleOffset = 5;
    const rowGap = 12;

    diagramCanvasEntries.forEach((entry, index) => {
      const row = Math.floor(index / 2);
      const column = index % 2;
      const cellX = margin + column * (cellWidth + cellGap);
      const titleY = gridStartY + row * (cellHeight + rowGap + titleOffset);
      const boxY = titleY + 2;

      pdf.setFont("helvetica", "bold");
      pdf.text(entry.label, cellX, titleY);
      pdf.setFont("helvetica", "normal");
      pdf.rect(cellX, boxY, cellWidth, cellHeight);

      if (entry.canvas) {
        const props = pdf.getImageProperties(entry.canvas);
        const ar = props.width / props.height;
        let w = cellWidth - 4;
        let h = w / ar;
        if (h > cellHeight - 4) {
          h = cellHeight - 4;
          w = h * ar;
        }
        pdf.addImage(entry.canvas, "PNG", cellX + (cellWidth - w) / 2, boxY + (cellHeight - h) / 2, w, h);
      } else {
        pdf.text("Diagram unavailable.", cellX + 4, boxY + 8);
      }
    });

    y = gridStartY + 2 * (cellHeight + rowGap + titleOffset) + 2;

    findingSections.forEach((section) => {
      if (section.entries.length === 0) return;
      startSection(section.title);
      writeEntries(section.entries);
    });

    startSection("Wound Management");
    writeEntries(
      [
        { label: "Irrigation Solution", value: joinSelections(woundManagement?.irrigationSolution, woundManagement?.irrigationSolutionOther) },
      ].filter((entry) => entry.value)
    );

    startSection("Closure");
    writeEntries(
      [
        { label: "Wound Closure", value: txt(woundManagement?.woundClosure) },
        { label: "Dressing Applied", value: joinSelections(woundManagement?.dressingApplied, woundManagement?.dressingAppliedOther) },
        { label: "Anal Pack Inserted", value: txt(woundManagement?.analPackInserted) },
      ].filter((entry) => entry.value)
    );

    startSection("Complications");
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

    startSection("Specimen");
    writeEntries(
      [
        { label: "Sent For Histology", value: txt(specimen?.sentForHistology) },
        {
          label: "Histology Laboratory Sent To",
          value: specimen?.sentForHistology === "Yes" ? txt(specimen?.histologyLaboratorySentTo) : "",
        },
        { label: "Sent For Microbiology", value: txt(specimen?.sentForMicrobiology) },
        {
          label: "Microbiology Laboratory Sent To",
          value: specimen?.sentForMicrobiology === "Yes" ? txt(specimen?.microbiologyLaboratorySentTo) : "",
        },
      ].filter((entry) => entry.value)
    );

    startSection("Additional Information");
    writeEntries([{ label: "Additional Information", value: txt(addInfo?.additionalInformation) }].filter((entry) => entry.value));

    startSection("Post Operative Management");
    row2(`Analgesia: ${txt(postOperativePlan?.analgesia)}`, `Sitz Baths: ${txt(postOperativePlan?.sitzBaths)}`);
    row2(
      `Antibiotics (If Indicated): ${txt(postOperativePlan?.antibiotics)}`,
      `Packing Removal Time: ${txt(postOperativePlan?.packingRemovalTime)}`
    );
    row1(`Plan For Further Surgery: ${txt(postOperativePlan?.planForFurtherSurgery)}`);
    row1(`Post Operative Management: ${txt(addInfo?.postOperativeManagement)}`);

    startSection("Surgeon's Signature");
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
