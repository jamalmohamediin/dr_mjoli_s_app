import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { buildColonoscopyReportSections } from "@/utils/colonoscopyReportSections";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";

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

const FINDINGS_DETAIL_SECTION_TITLES = new Set([
  "Haemorrhoids",
  "Inflammation",
  "Stricture (Benign/Malignant)",
  "Polyp(s)",
  "Diverticula",
  "Tumour",
  "AV Malformation",
  "Radiation Proctitis",
  "Ulcer (s)",
]);

export const generateColonoscopyPDF = async (data: any, patientInfo?: any) => {
  const additionalInfo = data?.additionalInfo || {};
  const diagram = data?.diagram || {};
  const findingsSummary = data?.findingsSummary || {};
  const diagramImageData =
    diagram?.canvasImageData ||
    data?.colonoscopyCanvasData ||
    data?.colonoscopyFindings?.canvasImageData ||
    data?.canvasImageData ||
    "";
  const selectedFindings = Array.isArray(findingsSummary.findings)
    ? findingsSummary.findings
    : [];
  const findingOther = String(findingsSummary.findingOther || "").trim();
  const diagramLegendItems = Array.from(
    new Set(
      [
        ...selectedFindings.map((item) => toTitleCaseText(String(item || "").trim())),
        findingOther ? toTitleCaseText(findingOther) : "",
      ].filter(Boolean),
    ),
  );
  const surgeonSignatureText =
    additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName;
  const signatureDateTime = String(additionalInfo.dateTime || "").trim() || getLocalDateTimeValue();

  const baseSections = buildColonoscopyReportSections(data, {
    includeSedationAndBbps: false,
  });

  const procedureDetailsSection = baseSections.find((section) => section.title === "Procedure Details");
  const findingsSummarySection = baseSections.find((section) => section.title === "Findings Summary");
  const interventionsSection = baseSections.find(
    (section) => section.title === "Interventions and Final Endoscopic Diagnosis",
  );

  const mergedProcedureDetailsEntries = [
    ...(procedureDetailsSection?.entries || []),
    ...(findingsSummarySection?.entries || []),
    ...(interventionsSection?.entries || []),
  ];

  const normalizedSections = baseSections
    .filter(
      (section) =>
        section.title !== "Findings Summary" &&
        section.title !== "Interventions and Final Endoscopic Diagnosis",
    )
    .map((section) => {
      if (section.title !== "Procedure Details") {
        return section;
      }

      return {
        ...section,
        entries: mergedProcedureDetailsEntries,
      };
    });

  const sections: StructuredTemplatePdfSection[] = normalizedSections.map((section) => ({
    title: section.title,
    layout:
      section.layout ||
      (section.title === "Preoperative Information"
        ? "aligned-preoperative-grid"
        : "label-value-table"),
    fixedLabelWidth:
      section.title === "Bowel Preparation and Procedure Details"
        ? 44
        : FINDINGS_DETAIL_SECTION_TITLES.has(section.title)
          ? 78
          : undefined,
    labelGap: FINDINGS_DETAIL_SECTION_TITLES.has(section.title) ? 3 : undefined,
    entries: section.entries.map((entry) => ({
      label: entry.label,
      value: formatExportValue(entry.value),
      fullWidth: entry.fullWidth,
    })),
  }));

  return generateStructuredTemplatePdf({
    title: "COLONOSCOPY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    patientInfoLayout: "appendectomy",
    signatureLayout: "appendectomy",
    prioritizeSignsBeforeIndication: true,
    diagram: diagramImageData
      ? {
          title: "Colonoscopy Diagram",
          imageData: diagramImageData,
          placement: "inlineRight",
          sectionTitle: "Procedure Details",
          style: "plain",
          legendTitle: "Legend",
          legendPosition: "top",
          legendItems:
            diagramLegendItems.length > 0
              ? diagramLegendItems
              : ["Diagram annotations are included directly in the image."],
          boxHeight: 78,
        }
      : undefined,
    signature: {
      text: surgeonSignatureText,
      dateTime: signatureDateTime,
      alwaysShow: true,
    },
  });
};
