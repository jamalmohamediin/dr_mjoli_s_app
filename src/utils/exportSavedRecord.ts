import { generateAppendectomyPDF } from "@/utils/appendectomyPdfGenerator";
import { generateCholecystectomyPDF } from "@/utils/cholecystectomyPdfGenerator";
import { generateColonoscopyPDF } from "@/utils/colonoscopyPdfGenerator";
import { formatDOBForFilename } from "@/utils/dateFormatter";
import { FinalDiagramCapture, generateFinalPDF } from "@/utils/finalPdfGenerator";
import { generateGastroscopyPDF } from "@/utils/gastroscopyPdfGenerator";
import { generateInguinalHerniaPDF } from "@/utils/inguinalHerniaPdfGenerator";
import { generateNarrativeSurgeryPDF } from "@/utils/narrativeSurgeryPdfGenerator";
import { generatePeriAnalPDF } from "@/utils/periAnalPdfGenerator";
import { generateRectalCancerPDF } from "@/utils/rectalCancerPdfGenerator";
import { generateSmallBowelSurgeryPDF } from "@/utils/smallBowelSurgeryPdfGenerator";
import { generateTransanalMinimallyInvasiveSurgeryPDF } from "@/utils/transanalMinimallyInvasiveSurgeryPdfGenerator";
import { generateVentralHerniaPDF } from "@/utils/ventralHerniaPdfGenerator";
import { PatientRecord, TemplateType } from "@/utils/patientRecords";

const sanitizeFilenamePart = (value: string, fallback: string) =>
  String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;

const currentFileDate = () => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear();
  return `${day}_${month}_${year}`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const parseSurgicalMarkings = (value: string) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const buildFinalDiagrams = (reportSnapshot: any): FinalDiagramCapture[] => {
  const diagrams: FinalDiagramCapture[] = [];

  if (reportSnapshot?.gastroscopyCanvasData) {
    diagrams.push({
      canvasImageData: reportSnapshot.gastroscopyCanvasData,
      findings: reportSnapshot?.gastroscopyFindings?.findings || [],
      type: "gastroscopy",
    });
  }

  if (reportSnapshot?.colonoscopyCanvasData) {
    diagrams.push({
      canvasImageData: reportSnapshot.colonoscopyCanvasData,
      findings: reportSnapshot?.colonoscopyFindings?.findings || [],
      type: "colonoscopy",
    });
  }

  return diagrams;
};

export const generateSavedRecordPdfBlob = async (record: PatientRecord) => {
  const reportSnapshot = record.reportSnapshot || {};
  const patientInfo = record.patientInfo || {};
  const patientName = patientInfo.name || "patient";
  const patientId = patientInfo.patientId || "unknown";
  const cleanPatientName = sanitizeFilenamePart(patientName, "patient");
  const cleanPatientId = sanitizeFilenamePart(patientId, "unknown");
  const formattedDate = currentFileDate();

  if (record.templateType === "procedure") {
    const blob = await generateFinalPDF(
      patientName,
      patientId,
      buildFinalDiagrams(reportSnapshot),
      reportSnapshot,
      undefined,
      { returnBlob: true },
    );

    if (blob instanceof Blob) {
      return {
        blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Endoscopy_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate endoscopy PDF");
  }

  if (record.templateType === "appendectomy") {
    const result = await generateAppendectomyPDF(
      patientName,
      patientId,
      parseSurgicalMarkings(reportSnapshot?.appendectomy?.procedureFindings?.findings || ""),
      reportSnapshot?.appendectomy,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Appendectomy_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error(result.error || "Failed to generate appendectomy PDF");
  }

  if (record.templateType === "gastroscopy") {
    const result = await generateGastroscopyPDF(
      reportSnapshot?.gastroscopy,
      reportSnapshot?.gastroscopy?.patientInfo || patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Gastroscopy_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate gastroscopy PDF");
  }

  if (record.templateType === "colonoscopy") {
    const colonoscopyTemplateData = {
      ...(reportSnapshot?.colonoscopy || {}),
      colonoscopyCanvasData:
        reportSnapshot?.colonoscopyCanvasData ||
        reportSnapshot?.colonoscopy?.colonoscopyCanvasData ||
        "",
      colonoscopyFindings:
        reportSnapshot?.colonoscopyFindings ||
        reportSnapshot?.colonoscopy?.colonoscopyFindings ||
        {},
      diagram: {
        ...(reportSnapshot?.colonoscopy?.diagram || {}),
        canvasImageData:
          reportSnapshot?.colonoscopy?.diagram?.canvasImageData ||
          reportSnapshot?.colonoscopyCanvasData ||
          reportSnapshot?.colonoscopy?.colonoscopyCanvasData ||
          reportSnapshot?.colonoscopyFindings?.canvasImageData ||
          "",
      },
    };

    const result = await generateColonoscopyPDF(
      colonoscopyTemplateData,
      reportSnapshot?.colonoscopy?.patientInfo || patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Colonoscopy_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate colonoscopy PDF");
  }

  if (record.templateType === "ventralHernia") {
    const result = await generateVentralHerniaPDF(
      patientName,
      patientId,
      parseSurgicalMarkings(reportSnapshot?.ventralHernia?.procedureFindings?.findings || ""),
      reportSnapshot?.ventralHernia,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Ventral_Hernia_Repair_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error(result.error || "Failed to generate ventral hernia PDF");
  }

  if (record.templateType === "rectalCancer") {
    const result = await generateRectalCancerPDF(
      patientName,
      patientId,
      parseSurgicalMarkings(reportSnapshot?.rectalCancer?.procedureFindings?.findings || ""),
      reportSnapshot?.rectalCancer,
      patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${formatDOBForFilename(patientInfo.dateOfBirth)}_Colorectal_Resection_Report.pdf`,
      };
    }

    throw new Error(result.error || "Failed to generate colorectal resection PDF");
  }

  if (record.templateType === "smallBowel") {
    const result = await generateSmallBowelSurgeryPDF(
      patientName,
      patientId,
      parseSurgicalMarkings(reportSnapshot?.smallBowel?.procedureFindings?.findings || ""),
      reportSnapshot?.smallBowel,
      patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Small_Bowel_Surgery_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error(result.error || "Failed to generate small bowel surgery PDF");
  }

  if (record.templateType === "cholecystectomy") {
    const result = await generateCholecystectomyPDF(
      patientName,
      patientId,
      parseSurgicalMarkings(reportSnapshot?.cholecystectomy?.procedureFindings?.findings || ""),
      reportSnapshot?.cholecystectomy,
      patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Cholecystectomy_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error(result.error || "Failed to generate cholecystectomy PDF");
  }

  if (record.templateType === "periAnal") {
    const result = await generatePeriAnalPDF(patientName, patientId, reportSnapshot?.periAnal, patientInfo);

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Peri_Anal_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error(result.error || "Failed to generate peri-anal PDF");
  }

  if (record.templateType === "inguinalHernia") {
    const result = await generateInguinalHerniaPDF(
      reportSnapshot?.inguinalHernia,
      reportSnapshot?.inguinalHernia?.patientInfo || patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Inguinal_Hernia_Repair_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate inguinal hernia PDF");
  }

  if (record.templateType === "transanalMinimallyInvasiveSurgery") {
    const result = await generateTransanalMinimallyInvasiveSurgeryPDF(
      reportSnapshot?.transanalMinimallyInvasiveSurgery,
      reportSnapshot?.transanalMinimallyInvasiveSurgery?.patientInfo || patientInfo,
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_TMIS_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate TMIS PDF");
  }

  if (record.templateType === "openGeneralSurgery") {
    const result = await generateNarrativeSurgeryPDF(
      "OPEN GENERAL SURGERY NARRATIVE REPORT",
      reportSnapshot?.openGeneralSurgery,
      reportSnapshot?.openGeneralSurgery?.patientInfo || patientInfo,
      "general",
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Open_General_Surgery_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate open general surgery PDF");
  }

  if (record.templateType === "openAbdominalSurgery") {
    const result = await generateNarrativeSurgeryPDF(
      "OPEN ABDOMINAL SURGERY NARRATIVE REPORT",
      reportSnapshot?.openAbdominalSurgery,
      reportSnapshot?.openAbdominalSurgery?.patientInfo || patientInfo,
      "abdominal",
    );

    if (result.success && result.blob) {
      return {
        blob: result.blob,
        filename: `${cleanPatientName}_${cleanPatientId}_Open_Abdominal_Surgery_Report_${formattedDate}.pdf`,
      };
    }

    throw new Error("Failed to generate open abdominal surgery PDF");
  }

  throw new Error(`Unsupported template export: ${record.templateType as TemplateType}`);
};

export const exportSavedRecordPdf = async (record: PatientRecord) => {
  const { blob, filename } = await generateSavedRecordPdfBlob(record);
  downloadBlob(blob, filename);
};
