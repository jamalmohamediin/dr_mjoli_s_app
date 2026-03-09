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
          ctx.strokeStyle =
            marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
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
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 4.5;
    const sectionSpacing = 7;
    let y = margin;

    const info = patientInfo || smallBowelData?.patientInfo || {};
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
    pdf.text("SMALL BOWEL SURGERY REPORT", pageWidth / 2, y, { align: "center" });
    y += sectionSpacing;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    addSectionTitle("PATIENT INFORMATION");
    addField("Name", info?.name || patientName);
    addField("Patient ID", info?.patientId || patientId);
    addField(
      "Date Of Birth",
      info?.dateOfBirth ? formatDateDDMMYYYY(info.dateOfBirth) : ""
    );
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
    y += 2;

    addSectionTitle("PREOPERATIVE INFORMATION");
    addField(
      "Surgeon",
      (smallBowelData?.preoperative?.surgeons || [])
        .filter((item: string) => item.trim())
        .join(", ")
    );
    addField(
      "Assistant",
      (smallBowelData?.preoperative?.assistants || [])
        .filter((item: string) => item.trim())
        .join(", ")
    );
    addField(
      "Anaesthetist",
      (smallBowelData?.preoperative?.anaesthetists || [])
        .filter((item: string) => item.trim())
        .join(", ")
    );
    addField("Indication for Surgery", smallBowelData?.preoperative?.indication);
    addField(
      "Operation Description",
      smallBowelData?.preoperative?.operationDescription
    );
    addField("Procedure Urgency", smallBowelData?.preoperative?.procedureUrgency);
    addField(
      "Preoperative Imaging",
      joinSelections(
        toArray(smallBowelData?.preoperative?.imaging),
        smallBowelData?.preoperative?.imagingOther
      )
    );
    addField("Start Time", smallBowelData?.preoperative?.startTime);
    addField("End Time", smallBowelData?.preoperative?.endTime);
    addField(
      "Total Duration",
      smallBowelData?.preoperative?.duration
        ? `${smallBowelData.preoperative.duration} minutes`
        : ""
    );
    y += 2;

    addSectionTitle("OPERATIVE FINDINGS");
    addField(
      "Pathology Found",
      joinSelections(
        toArray(smallBowelData?.operativeFindings?.pathology),
        smallBowelData?.operativeFindings?.pathologyOther
      )
    );
    addField(
      "Distance from DJ Flexure",
      smallBowelData?.operativeFindings?.distanceFromDjFlexure
        ? `${smallBowelData.operativeFindings.distanceFromDjFlexure} cm`
        : ""
    );
    addField(
      "Distance from Ileocecal Valve",
      smallBowelData?.operativeFindings?.distanceFromIleocecalValve
        ? `${smallBowelData.operativeFindings.distanceFromIleocecalValve} cm`
        : ""
    );
    addField(
      "Length of Diseased Segment",
      smallBowelData?.operativeFindings?.diseasedSegmentLength
        ? `${smallBowelData.operativeFindings.diseasedSegmentLength} cm`
        : ""
    );
    addField("Bowel Viability", smallBowelData?.operativeFindings?.bowelViability);
    addField(
      "Mesenteric Involvement",
      smallBowelData?.operativeFindings?.mesentericInvolvement
    );
    addField("Lymph Nodes", smallBowelData?.operativeFindings?.lymphNodes);
    addField(
      "Degree of Contamination",
      smallBowelData?.operativeFindings?.contamination
    );
    addField("Adhesions", smallBowelData?.operativeFindings?.adhesions);
    addField(
      "Description of Findings",
      smallBowelData?.operativeFindings?.description
    );
    y += 2;

    addSectionTitle("PROCEDURE DETAILS");
    addField(
      "Surgical Approach",
      toArray(smallBowelData?.procedure?.approach).join(", ")
    );
    addField(
      "Reason for Conversion",
      joinSelections(
        toArray(smallBowelData?.procedure?.reasonForConversion),
        smallBowelData?.procedure?.reasonForConversionOther
      )
    );
    addField("Operation Done", smallBowelData?.procedure?.operationDone);
    addField(
      "Procedure Performed",
      joinSelections(
        toArray(smallBowelData?.procedure?.procedurePerformed),
        smallBowelData?.procedure?.procedurePerformedOther
      )
    );
    addField(
      "Length Resected",
      smallBowelData?.procedure?.lengthResected
        ? `${smallBowelData.procedure.lengthResected} cm`
        : ""
    );
    addField("Margins", toArray(smallBowelData?.procedure?.margins).join(", "));
    addField(
      "Method of Vascular Control",
      joinSelections(
        toArray(smallBowelData?.procedure?.vascularControl),
        smallBowelData?.procedure?.vascularControlOther
      )
    );
    addField("Adhesiolysis", smallBowelData?.procedure?.adhesiolysis);
    addField(
      "Peritoneal Lavage",
      smallBowelData?.procedure?.peritonealLavage === "Yes" &&
        smallBowelData?.procedure?.peritonealLavageVolume
        ? `Yes (Volume: ${smallBowelData.procedure.peritonealLavageVolume})`
        : smallBowelData?.procedure?.peritonealLavage
    );
    y += 2;

    addSectionTitle("ACCESS AND PORTS");
    if (diagramCanvas) {
      ensureSpace(90);
      const boxWidth = 110;
      const boxHeight = 78;
      const boxX = margin;

      pdf.setDrawColor(0, 0, 0);
      pdf.rect(boxX, y, boxWidth, boxHeight);

      try {
        const imageProps = pdf.getImageProperties(diagramCanvas);
        const aspectRatio = imageProps.width / imageProps.height;
        let width = boxWidth - 6;
        let height = width / aspectRatio;

        if (height > boxHeight - 6) {
          height = boxHeight - 6;
          width = height * aspectRatio;
        }

        const imageX = boxX + (boxWidth - width) / 2;
        const imageY = y + (boxHeight - height) / 2;
        pdf.addImage(diagramCanvas, "PNG", imageX, imageY, width, height);
      } catch (error) {
        addWrappedText("Unable to render surgical diagram.");
      }

      y += boxHeight + 4;
    } else {
      addWrappedText("No access and ports markings were recorded.");
    }

    addSectionTitle("RECONSTRUCTION");
    addField(
      "Reconstruction Type",
      joinSelections(
        toArray(smallBowelData?.reconstruction?.reconstructionType),
        smallBowelData?.reconstruction?.reconstructionOther
      )
    );
    addField(
      "Site of Anastomosis",
      smallBowelData?.reconstruction?.anastomosisDetails?.site
    );
    addField(
      "Configuration",
      smallBowelData?.reconstruction?.anastomosisDetails?.configuration === "Other" &&
        smallBowelData?.reconstruction?.anastomosisDetails?.configurationOther
        ? `Other: ${smallBowelData.reconstruction.anastomosisDetails.configurationOther}`
        : smallBowelData?.reconstruction?.anastomosisDetails?.configuration
    );
    addField(
      "Anastomotic Technique",
      smallBowelData?.reconstruction?.anastomosisDetails?.technique
    );
    addField(
      "Suture Material",
      joinSelections(
        toArray(smallBowelData?.reconstruction?.anastomosisDetails?.sutureMaterial),
        smallBowelData?.reconstruction?.anastomosisDetails?.sutureMaterialOther
      )
    );
    addField(
      "Linear Stapler Sizes",
      joinSelections(
        toArray(smallBowelData?.reconstruction?.anastomosisDetails?.linearStaplerSize),
        smallBowelData?.reconstruction?.anastomosisDetails?.linearStaplerSizeOther
      )
    );
    addField(
      "Circular Stapler Sizes",
      joinSelections(
        toArray(smallBowelData?.reconstruction?.anastomosisDetails?.circularStaplerSize),
        smallBowelData?.reconstruction?.anastomosisDetails?.circularStaplerSizeOther
      )
    );
    addField(
      "Type of Ileostomy",
      smallBowelData?.reconstruction?.stomaDetails?.ileostomyType === "Other" &&
        smallBowelData?.reconstruction?.stomaDetails?.ileostomyTypeOther
        ? `Other: ${smallBowelData.reconstruction.stomaDetails.ileostomyTypeOther}`
        : smallBowelData?.reconstruction?.stomaDetails?.ileostomyType
    );
    addField(
      "Location",
      smallBowelData?.reconstruction?.stomaDetails?.location === "Other" &&
        smallBowelData?.reconstruction?.stomaDetails?.locationOther
        ? `Other: ${smallBowelData.reconstruction.stomaDetails.locationOther}`
        : smallBowelData?.reconstruction?.stomaDetails?.location
    );
    addField(
      "Stoma Eversion",
      smallBowelData?.reconstruction?.stomaDetails?.eversion
    );
    addField(
      "Site of Maturation",
      smallBowelData?.reconstruction?.stomaDetails?.maturationSite
    );
    addField(
      "Stoma Material Used",
      joinSelections(
        toArray(smallBowelData?.reconstruction?.stomaDetails?.materialUsed),
        smallBowelData?.reconstruction?.stomaDetails?.materialUsedOther
      )
    );
    y += 2;

    addSectionTitle("OPERATIVE EVENTS & CLOSURE");
    addField(
      "Specimen",
      joinSelections(
        toArray(smallBowelData?.operativeEvents?.specimen),
        smallBowelData?.operativeEvents?.specimenOther
      )
    );
    addField(
      "Points of Difficulty",
      joinSelections(
        toArray(smallBowelData?.operativeEvents?.pointsOfDifficulty),
        smallBowelData?.operativeEvents?.pointsOfDifficultyOther
      )
    );
    addField(
      "Intraoperative Events / Complications",
      joinSelections(
        toArray(smallBowelData?.operativeEvents?.intraoperativeEvents),
        smallBowelData?.operativeEvents?.intraoperativeEventsOther
      )
    );
    addField(
      "Wound Protector Used",
      smallBowelData?.operativeEvents?.woundProtector
    );
    addField(
      "Peritoneal Drainage",
      smallBowelData?.operativeEvents?.drainInsertion
    );
    addField(
      "Type of Drain",
      joinSelections(
        toArray(smallBowelData?.operativeEvents?.drainType),
        smallBowelData?.operativeEvents?.drainTypeOther
      )
    );
    addField(
      "Intra-Peritoneal Drain Placement",
      joinSelections(
        toArray(smallBowelData?.operativeEvents?.intraPeritonealPlacement),
        smallBowelData?.operativeEvents?.intraPeritonealPlacementOther
      )
    );
    addField(
      "Exit Site of Drain",
      joinSelections(
        toArray(smallBowelData?.operativeEvents?.drainExitSite),
        smallBowelData?.operativeEvents?.drainExitSiteOther
      )
    );
    addField(
      "Fascial Closure",
      joinSelections(
        toArray(smallBowelData?.closure?.fascialClosure),
        smallBowelData?.closure?.fascialClosureOther
      )
    );
    addField(
      "Fascial Suture Material",
      joinSelections(
        toArray(smallBowelData?.closure?.fascialSutureMaterial),
        smallBowelData?.closure?.fascialSutureMaterialOther
      )
    );
    addField(
      "Skin Closure",
      joinSelections(
        toArray(smallBowelData?.closure?.skinClosure),
        smallBowelData?.closure?.skinClosureOther
      )
    );
    addField(
      "Skin Closure Material",
      joinSelections(
        toArray(smallBowelData?.closure?.skinClosureMaterial),
        smallBowelData?.closure?.skinClosureMaterialOther
      )
    );
    y += 2;

    addSectionTitle("ADDITIONAL INFORMATION");
    addField(
      "Additional Information",
      smallBowelData?.additionalInfo?.additionalInformation
    );
    addField(
      "Post Operative Management",
      smallBowelData?.additionalInfo?.postOperativeManagement
    );

    addSectionTitle("SURGEON'S SIGNATURE");
    if (smallBowelData?.additionalInfo?.surgeonSignature) {
      if (
        typeof smallBowelData.additionalInfo.surgeonSignature === "string" &&
        smallBowelData.additionalInfo.surgeonSignature.startsWith("data:image")
      ) {
        ensureSpace(24);
        const dimensions = await calculateSignatureDimensions(
          smallBowelData.additionalInfo.surgeonSignature
        );
        pdf.addImage(
          smallBowelData.additionalInfo.surgeonSignature,
          "PNG",
          margin,
          y,
          dimensions.width,
          dimensions.height
        );
        y += dimensions.height + 3;
      } else {
        addField("Signature", smallBowelData.additionalInfo.surgeonSignature);
      }
    }

    addField(
      "Typed Signature",
      smallBowelData?.additionalInfo?.surgeonSignatureText
    );
    addField(
      "Date/Time",
      smallBowelData?.additionalInfo?.dateTime
        ? formatDateTimeWithColon(smallBowelData.additionalInfo.dateTime)
        : ""
    );

    return {
      success: true,
      blob: pdf.output("blob"),
    };
  } catch (error) {
    console.error("Error generating small bowel surgery PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
