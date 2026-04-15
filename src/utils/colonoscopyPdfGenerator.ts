import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { buildColonoscopyReportSections } from "@/utils/colonoscopyReportSections";

const PRESERVE_UPPERCASE_TOKENS = new Set([
  "ASA",
  "BBPS",
  "BP",
  "CT",
  "ECG",
  "GA",
  "IBD",
  "MRI",
]);

const titleCaseWordPart = (part: string) => {
  if (!part) return part;
  if (PRESERVE_UPPERCASE_TOKENS.has(part.toUpperCase())) {
    return part.toUpperCase();
  }
  if (/^[A-Z0-9]{2,6}$/.test(part)) {
    return part;
  }
  const lower = part.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
};

const toTitleCaseText = (value: string) =>
  value
    .split(/\s+/)
    .map((token) =>
      token
        .split(/([/-])/)
        .map((part) => (part === "/" || part === "-" ? part : titleCaseWordPart(part)))
        .join(""),
    )
    .join(" ")
    .trim();

const formatExportValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value.map((item) => toTitleCaseText(String(item || ""))).filter(Boolean);
  }
  if (typeof value === "string") {
    return toTitleCaseText(value);
  }
  return value;
};

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
    layout:
      section.title === "Preoperative Information"
        ? "colonoscopy-preoperative"
        : "default",
    entries: section.entries.map((entry) => ({
      label: entry.label,
      value: formatExportValue(entry.value),
      fullWidth: entry.fullWidth,
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
