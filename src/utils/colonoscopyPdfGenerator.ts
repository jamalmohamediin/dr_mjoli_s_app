import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { buildColonoscopyReportSections } from "@/utils/colonoscopyReportSections";

export const generateColonoscopyPDF = async (data: any, patientInfo?: any) => {
  const additionalInfo = data?.additionalInfo || {};
  const diagram = data?.diagram || {};
  const diagramImageData =
    diagram?.canvasImageData ||
    data?.colonoscopyCanvasData ||
    data?.colonoscopyFindings?.canvasImageData ||
    data?.canvasImageData ||
    "";
  const surgeonSignatureText =
    additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName;
  const signatureDateTime = additionalInfo.dateTime || "";

  const sections: StructuredTemplatePdfSection[] = buildColonoscopyReportSections(data, {
    includeSedationAndBbps: false,
  }).map((section) => ({
    title: section.title,
    entries: section.entries.map((entry) => ({
      label: entry.label,
      value: entry.value,
    })),
  }));

  if (surgeonSignatureText || signatureDateTime) {
    sections.push({
      title: "Signature",
      entries: [
        { label: "Surgeon's Signature", value: surgeonSignatureText },
        { label: "Date", value: signatureDateTime },
      ],
    });
  }

  return generateStructuredTemplatePdf({
    title: "COLONOSCOPY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    diagram: diagramImageData
      ? {
          title: "Colonoscopy Diagram",
          imageData: diagramImageData,
          placement: "inlineRight",
          sectionTitle: "Procedure Details",
        }
      : undefined,
  });
};
