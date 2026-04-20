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
  getPdfSafePatientInfo,
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
        } else if (marking.type === "drawStroke") {
          const points = Array.isArray(marking.points) ? marking.points : [];
          if (points.length === 0) return;
          ctx.save();
          ctx.strokeStyle = marking.color || "#111111";
          ctx.lineWidth = Number(marking.width) > 0 ? Number(marking.width) : 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let index = 1; index < points.length; index += 1) {
            ctx.lineTo(points[index].x, points[index].y);
          }
          if (points.length === 1) {
            ctx.lineTo(points[0].x + 0.01, points[0].y + 0.01);
          }
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "textBox") {
          if (!marking?.text?.trim()) return;
          const textSize = Number(marking.size) > 0 ? Number(marking.size) : 20;
          ctx.save();
          ctx.fillStyle = marking.color || "#111111";
          ctx.font = `${textSize}px Arial`;
          ctx.textBaseline = "top";
          ctx.fillText(marking.text, marking.x, marking.y);
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

    const info = getPdfSafePatientInfo(patientInfo || periAnalData?.patientInfo || {});
    const preop = periAnalData?.preoperative || {};
    const woundManagement = periAnalData?.woundManagement || {};
    const complications = periAnalData?.complications || {};
    const postOperativePlan = periAnalData?.postOperativePlan || {};
    const specimen = periAnalData?.specimen || {};
    const addInfo = periAnalData?.additionalInfo || {};
    const findingsSummary = getPeriAnalAdditionalFindingSection(periAnalData);
    const findingSections = getPeriAnalFindingSections(periAnalData);
    const diagramState = parsePeriAnalDiagramState(periAnalData?.procedureFindings);
    const selectedDiagramVariants = PERI_ANAL_DIAGRAM_VARIANTS.filter((variant) => {
      const hasMarkings =
        Array.isArray(diagramState.markingsByVariant?.[variant.key]) &&
        diagramState.markingsByVariant[variant.key].length > 0;
      return hasMarkings;
    });
    const diagramCanvasEntries = await Promise.all(
      selectedDiagramVariants.map(async (variant) => ({
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

    const row3 = (a: string, b: string, c: string) => {
      const cell1 = buildCellLayout(a, 58);
      const cell2 = buildCellLayout(b, 58);
      const cell3 = buildCellLayout(c, 58);
      const lines = Math.max(cell1.lineCount, cell2.lineCount, cell3.lineCount, 1);
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
      const cell1 = buildCellLayout(a, 88);
      const cell2 = buildCellLayout(b, 88);
      const lines = Math.max(cell1.lineCount, cell2.lineCount, 1);
      ensureSpace(lines * lineHeight + 1);
      for (let i = 0; i < lines; i++) {
        drawLayoutLine(cell1, i, col1X);
        drawLayoutLine(cell2, i, twoCol2X);
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
    };

    const writeEntries = (entries: { label: string; value: string }[]) => {
      const labelColumnWidth = 64;
      const valueColumnWidth = pageWidth - margin * 2 - labelColumnWidth - 2;
      entries.forEach((entry) => {
        const labelLines = pdf.splitTextToSize(`${entry.label}:`, labelColumnWidth);
        const valueLines = pdf.splitTextToSize(entry.value || "", valueColumnWidth);
        const lines = Math.max(labelLines.length, valueLines.length, 1);
        ensureSpace(lines * lineHeight + 1);

        for (let index = 0; index < lines; index += 1) {
          if (labelLines[index]) {
            pdf.setFont("helvetica", "bold");
            pdf.text(labelLines[index], margin, y);
          }
          if (valueLines[index]) {
            pdf.setFont("helvetica", "normal");
            pdf.text(valueLines[index], margin + labelColumnWidth + 2, y);
          }
          y += lineHeight;
        }
      });
      pdf.setFont("helvetica", "normal");
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
      const layout = buildCellLayout(value, pageWidth - margin * 2);
      ensureSpace(layout.lineCount * lineHeight + 1);
      for (let lineIndex = 0; lineIndex < layout.lineCount; lineIndex += 1) {
        drawLayoutLine(layout, lineIndex, margin);
        y += lineHeight;
      }
      pdf.setFont("helvetica", "normal");
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

    if (txt(asaClassification)) {
      row1(`ASA Physical Status Classification: ${asaClassification}`);
    }
    if (txt(info.asaNotes)) {
      row1(`ASA Notes: ${txt(info.asaNotes)}`);
    }
    if (txt(info.weight) || txt(info.height) || txt(info.bmi)) {
      row3(
        `Weight: ${txt(info.weight)}`,
        `Height: ${txt(info.height)}`,
        `BMI: ${txt(info.bmi)}`
      );
    }
    if (txt(info.visitDate) || txt(info.visitTime)) {
      row3(
        `Date: ${formatPatientStickerDate(info.visitDate)}`,
        `Time: ${txt(info.visitTime)}`,
        ""
      );
    }
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

    if (diagramCanvasEntries.length > 0) {
      const cellGap = 8;
      const cellWidth = (pageWidth - margin * 2 - cellGap) / 2;
      const cellHeight = 58;
      const titleOffset = 5;
      const rowGap = 12;
      const rowCount = Math.ceil(diagramCanvasEntries.length / 2);
      const diagramGridHeight = rowCount * (cellHeight + rowGap + titleOffset);
      const diagramSectionRequiredHeight = Math.max(60, diagramGridHeight + 24);
      ensureSpace(diagramSectionRequiredHeight);

      startSection("Peri-Anal Diagrams");
      row1("Legend: Freehand Drawings And Textbox Notes Are Rendered Exactly As Marked On The Diagram.");
      ensureSpace(diagramGridHeight + 8);
      const gridStartY = y;

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

      y = gridStartY + rowCount * (cellHeight + rowGap + titleOffset) + 2;
    }

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
      `Date/Time: ${
        formatDateTimeDDMMYYYYWithDashes(addInfo?.dateTime || "") ||
        formatDateTimeDDMMYYYYWithDashes(new Date())
      }`
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
