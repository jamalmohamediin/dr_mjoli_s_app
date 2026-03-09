import jsPDF from "jspdf";
import appendectomyImage from "@/assets/appendectomy.jpg";
import {
  formatDateDDMMYYYY,
  formatDateTimeWithColon,
} from "@/utils/dateFormatter";
import { getFullASAText } from "@/utils/asaDescriptions";

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

const joinSelections = (values: string[], otherValue?: string) =>
  values
    .map((value) => {
      if (value === "Other" && otherValue?.trim()) {
        return `Other: ${otherValue}`;
      }
      return value;
    })
    .filter(Boolean)
    .join(", ");

const calculateSignatureDimensions = (
  imageDataUrl: string
): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();

    img.onload = function handleLoad() {
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

    if (!ctx) {
      resolve(null);
      return;
    }

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
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 4.5;
    const sectionSpacing = 7;
    let y = margin;

    const info = patientInfo || cholecystectomyData?.patientInfo || {};
    const preoperative = cholecystectomyData?.preoperative || {};
    const intraoperative = cholecystectomyData?.intraoperative || {};
    const procedure = cholecystectomyData?.procedure || {};
    const closure = cholecystectomyData?.closure || {};
    const additionalInfo = cholecystectomyData?.additionalInfo || {};
    const diagramCanvas = await createSurgicalDiagramCanvas(diagrams);

    const ensureSpace = (requiredHeight = 10) => {
      if (y + requiredHeight > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }
    };

    const addWrappedText = (text: string, indent = 0) => {
      if (!text.trim()) return;

      const availableWidth = contentWidth - indent;
      const lines = pdf.splitTextToSize(text, availableWidth);
      ensureSpace(lines.length * lineHeight + 2);

      lines.forEach((line: string) => {
        pdf.text(line, margin + indent, y);
        y += lineHeight;
      });
    };

    const addField = (label: string, value: string | number | undefined | null) => {
      if (value === undefined || value === null) return;
      const text = String(value).trim();
      if (!text) return;
      addWrappedText(`${label}: ${text}`);
    };

    const addSectionTitle = (title: string) => {
      ensureSpace(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin, y);
      y += 5;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    };

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Dr. Monde Mjoli", margin, y);
    pdf.text("St. Dominic's Medical Suites B", pageWidth - margin, y, {
      align: "right",
    });
    y += lineHeight;

    pdf.text("Specialist Surgeon", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text("56 St James Road, Southernwood", pageWidth - margin, y, {
      align: "right",
    });
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
    y += sectionSpacing;

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("CHOLECYSTECTOMY REPORT", pageWidth / 2, y, { align: "center" });
    y += sectionSpacing;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    addSectionTitle("Patient Information");
    addField("Patient Name", info?.name || patientName);
    addField("Patient ID", info?.patientId || patientId);
    addField("Date of Birth", formatDateDDMMYYYY(info?.dateOfBirth));
    addField("Age", info?.age);
    addField(
      "Sex",
      info?.sex === "other" && info?.sexOther
        ? info.sexOther
        : info?.sex
        ? `${info.sex.charAt(0).toUpperCase()}${info.sex.slice(1).toLowerCase()}`
        : ""
    );
    addField("Weight", info?.weight ? `${info.weight} kg` : "");
    addField("Height", info?.height ? `${info.height} cm` : "");
    addField("BMI", info?.bmi);
    addField("ASA Score", info?.asaScore ? getFullASAText(info.asaScore) : "");
    addField("Additional Notes", info?.asaNotes);

    addSectionTitle("Preoperative Information");
    addField(
      "Surgeon",
      (preoperative?.surgeons || []).filter((item: string) => item.trim()).join(", ")
    );
    addField(
      "Assistant",
      (preoperative?.assistants || []).filter((item: string) => item.trim()).join(", ")
    );
    addField(
      "Anaesthetist",
      (preoperative?.anaesthetists || []).filter((item: string) => item.trim()).join(", ")
    );
    addField(
      "Indication for Surgery",
      joinSelections(toArray(preoperative?.indication), preoperative?.indicationOther)
    );
    addField("Operation Description", preoperative?.operationDescription);
    addField("Procedure Urgency", preoperative?.procedureUrgency);
    addField(
      "Preoperative Imaging",
      joinSelections(toArray(preoperative?.imaging), preoperative?.imagingOther)
    );
    addField("Start Time", preoperative?.startTime);
    addField("End Time", preoperative?.endTime);
    addField("Total Duration", preoperative?.duration ? `${preoperative.duration} minutes` : "");

    addSectionTitle("Intraoperative Findings");
    addField(
      "Gallbladder appearance",
      joinSelections(
        toArray(intraoperative?.gallbladderAppearance),
        intraoperative?.gallbladderAppearanceOther
      )
    );
    addField("Adhesions to gall bladder", intraoperative?.adhesionsToGallbladder);

    addSectionTitle("Procedure Details");
    addField("Surgical Approach", toArray(procedure?.approach).join(", "));
    addField(
      "Reason for Conversion",
      joinSelections(toArray(procedure?.reasonForConversion), procedure?.reasonForConversionOther)
    );

    if (diagramCanvas) {
      ensureSpace(70);
      pdf.setFont("helvetica", "bold");
      pdf.text("Access and Ports", margin, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.addImage(diagramCanvas, "PNG", margin, y, 65, 65);
      y += 70;
    }

    addField("Subtotal cholecystectomy", procedure?.subtotalCholecystectomy);
    addField(
      "Reason for subtotal cholecystectomy",
      joinSelections(toArray(procedure?.subtotalReason), procedure?.subtotalReasonOther)
    );
    addField(
      "Gall bladder decompression required",
      procedure?.gallbladderDecompressionRequired
    );
    addField("Calot's triangle dissected", procedure?.calotsTriangleDissected);
    addField("Cystic duct identified", procedure?.cysticDuctIdentified);
    addField("Cystic artery identified", procedure?.cysticArteryIdentified);
    addField(
      "Two structures entering gallbladder confirmed",
      procedure?.twoStructuresConfirmed
    );
    addField(
      "Cystic duct control",
      joinSelections(toArray(procedure?.cysticDuctControl), procedure?.cysticDuctControlOther)
    );
    addField(
      "Cystic artery control",
      joinSelections(
        toArray(procedure?.cysticArteryControl),
        procedure?.cysticArteryControlOther
      )
    );
    addField(
      "Gallbladder dissected from liver bed",
      joinSelections(
        toArray(procedure?.gallbladderDissectedFromLiverBed),
        procedure?.gallbladderDissectedFromLiverBedOther
      )
    );
    addField("Bile spillage", procedure?.bileSpillage);
    addField("Stones spillage", procedure?.stonesSpillage);
    addField(
      "Additional Procedures",
      joinSelections(toArray(procedure?.additionalProcedures), procedure?.additionalProceduresOther)
    );
    addField("Additional procedure drain site", procedure?.additionalProcedureDrainSite);
    addField(
      "Cholangiogram findings",
      joinSelections(toArray(procedure?.cholangiogramFindings), procedure?.cholangiogramOther)
    );
    addField("Cholangiogram stricture site", procedure?.cholangiogramStrictureSite);
    addField("Cholangiogram dilatation", procedure?.cholangiogramDilatation);
    addField("Cholangiogram leak site", procedure?.cholangiogramLeakSite);
    addField(
      "Gallbladder retrieval",
      joinSelections(toArray(procedure?.gallbladderRetrieval), procedure?.gallbladderRetrievalOther)
    );
    addField("Drain insertion", procedure?.drainInsertion);

    addSectionTitle("Closure and Specimen");
    addField("Fascial closure", closure?.fascialClosure);
    addField(
      "Skin closure method",
      joinSelections(toArray(closure?.skinClosureMethod), closure?.skinClosureOther)
    );
    addField("Gallbladder sent for histology", closure?.gallbladderSentForHistology);
    addField("Laboratory", closure?.laboratoryName);
    addField(
      "Intra-operative difficulty",
      joinSelections(
        toArray(closure?.intraoperativeDifficulty),
        closure?.intraoperativeDifficultyOther
      )
    );
    addField(
      "Complications",
      joinSelections(toArray(closure?.complications), closure?.complicationsOther)
    );

    addSectionTitle("Additional Information");
    addField("Additional Information", additionalInfo?.additionalInformation);
    addField("Post Operative Management", additionalInfo?.postOperativeManagement);
    addField("Signature Text", additionalInfo?.surgeonSignatureText);
    addField(
      "Date/Time",
      additionalInfo?.dateTime ? formatDateTimeWithColon(additionalInfo.dateTime) : ""
    );

    if (additionalInfo?.surgeonSignature) {
      ensureSpace(25);
      const signatureSize = await calculateSignatureDimensions(additionalInfo.surgeonSignature);
      pdf.setFont("helvetica", "bold");
      pdf.text("Surgeon's Signature", margin, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.addImage(
        additionalInfo.surgeonSignature,
        "PNG",
        margin,
        y,
        signatureSize.width,
        signatureSize.height
      );
      y += signatureSize.height + 4;
    }

    return { success: true, blob: pdf.output("blob") };
  } catch (error) {
    console.error("Error generating cholecystectomy PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
};
