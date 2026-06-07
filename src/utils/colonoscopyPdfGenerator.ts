import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { buildColonoscopyReportSections } from "@/utils/colonoscopyReportSections";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
import {
  hasPdfDisplayValue,
  normalizeDiagramLegendItems,
} from "@/utils/templateDataHelpers";

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

const COLONOSCOPY_PROCEDURE_COLUMN_LABEL_WIDTH = 84;
const COLONOSCOPY_PROCEDURE_COLUMN_LABEL_GAP = 2;
const COLONOSCOPY_FINDINGS_GROUP_SPACING = 3;

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
  const fallbackLegendItems = Array.from(
    new Set(
      [
        ...selectedFindings.map((item) => toTitleCaseText(String(item || "").trim())),
        findingOther ? toTitleCaseText(findingOther) : "",
      ].filter(Boolean),
    ),
  ).map((label) => ({ label, color: "#6b7280" }));
  const configuredLegendItems = normalizeDiagramLegendItems(diagram?.legendItems);
  const diagramLegendItems = configuredLegendItems.length
    ? configuredLegendItems
    : fallbackLegendItems;
  const surgeonSignatureText =
    additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName;
  const signatureDateTime = String(additionalInfo.dateTime || "").trim() || getLocalDateTimeValue();

  const baseSections = buildColonoscopyReportSections(data, {
    includeSedationAndBbps: false,
  });

  const procedureDetailsSection = baseSections.find(
    (section) => section.title === "Procedure Details",
  );
  const findingsSummarySection = baseSections.find(
    (section) => section.title === "Findings Summary",
  );
  const interventionsSection = baseSections.find(
    (section) => section.title === "Interventions and Final Endoscopic Diagnosis",
  );
  const renderableEntries = (entries: any[] = []) =>
    entries.filter((entry) => hasPdfDisplayValue(entry?.value));

  const detailedFindingSections = baseSections.filter((section) =>
    FINDINGS_DETAIL_SECTION_TITLES.has(section.title),
  );
  const specimenSection = baseSections.find((section) => section.title === "Specimen");
  const additionalNotesSection = baseSections.find(
    (section) => section.title === "Additional Notes",
  );
  const conclusionSection = baseSections.find((section) => section.title === "Conclusion");
  const managementSection = baseSections.find(
    (section) =>
      section.title === "MANAGEMENT AND RECOMMENDATIONS" ||
      section.title === "Management and Recommendations" ||
      section.title === "Post Operative Management",
  );

  const findingsEntries: any[] = [];
  detailedFindingSections.forEach((section) => {
    const populatedEntries = renderableEntries(section.entries);
    if (populatedEntries.length === 0) {
      return;
    }

    findingsEntries.push({
      label: section.title,
      subheading: true,
    });
    findingsEntries.push(
      ...populatedEntries.map((entry, index) => ({
        ...entry,
        spacerAfter:
          index === populatedEntries.length - 1
            ? COLONOSCOPY_FINDINGS_GROUP_SPACING
            : undefined,
      })),
    );
  });

  if (
    Array.isArray(findingsSummary.findings) &&
    findingsSummary.findings.includes("Other") &&
    String(findingsSummary.findingOther || "").trim()
  ) {
    findingsEntries.push({
      label: "Other",
      subheading: true,
    });
    findingsEntries.push({
      label: "Details",
      value: findingsSummary.findingOther,
      fullWidth: true,
      spacerAfter: COLONOSCOPY_FINDINGS_GROUP_SPACING,
    });
  }

  const siteEntry = findingsSummarySection?.entries.find(
    (entry) => entry.label === "Site(s) of Abnormality",
  );
  if (siteEntry && hasPdfDisplayValue(siteEntry.value)) {
    findingsEntries.push(siteEntry);
  }

  const descriptionEntry = findingsSummarySection?.entries.find(
    (entry) => entry.label === "Description of Findings",
  );
  if (descriptionEntry && hasPdfDisplayValue(descriptionEntry.value)) {
    findingsEntries.push(descriptionEntry);
  }

  const interventionEntry = interventionsSection?.entries.find(
    (entry) => entry.label === "Procedure Interventions",
  );
  const diagnosisEntry = interventionsSection?.entries.find(
    (entry) => entry.label === "Endoscopic Diagnosis" || entry.label === "Diagnosis",
  );

  const normalizedSections = [
    ...baseSections.filter(
      (section) =>
        section.title !== "Findings Summary" &&
        !FINDINGS_DETAIL_SECTION_TITLES.has(section.title) &&
        section.title !== "Interventions and Final Endoscopic Diagnosis" &&
        section.title !== "Specimen" &&
        section.title !== "Additional Notes" &&
        section.title !== "Conclusion" &&
        section.title !== "MANAGEMENT AND RECOMMENDATIONS" &&
        section.title !== "Management and Recommendations" &&
        section.title !== "Post Operative Management",
    ),
    {
      title: "Findings",
      entries: findingsEntries,
      layout: "label-value-table" as const,
    },
    {
      title: "Endoscopic Diagnosis",
      hideTitle: true,
      entries: diagnosisEntry
        ? [
            {
              label: "Endoscopic Diagnosis",
              value: diagnosisEntry.value,
              fullWidth: true,
            },
          ]
        : [],
      layout: "label-value-table" as const,
    },
    {
      title: "Interventions / Therapy",
      entries: interventionEntry
        ? [
            {
              label: "Interventions / Therapy",
              value: interventionEntry.value,
              fullWidth: true,
              valueOnly: true,
            },
          ]
        : [],
      layout: "label-value-table" as const,
    },
    {
      ...(specimenSection || { title: "Specimen", entries: [] }),
      title: "Specimen",
    },
    {
      ...(additionalNotesSection || { title: "Additional Notes", entries: [] }),
      title: "Additional Notes",
    },
    {
      ...(conclusionSection || { title: "Conclusion", entries: [] }),
      title: "Conclusion",
    },
    {
      ...(managementSection || { title: "Management and Recommendations", entries: [] }),
      title: "Management and Recommendations",
    },
  ];

  const sections: StructuredTemplatePdfSection[] = normalizedSections.map((section) => ({
    title:
      section.title === "Bowel Preparation and Procedure Details"
        ? "Bowel Preparation"
        : section.title,
    hideTitle: section.hideTitle,
    layout:
      section.title === "Preoperative Information"
        ? "label-value-table"
        : section.layout || "label-value-table",
    columns:
      section.title === "Preoperative Information"
        ? 1
        : undefined,
    fixedLabelWidth:
      section.title === "Preoperative Information" ||
      section.title === "Bowel Preparation and Procedure Details" ||
      section.title === "Procedure Details" ||
      section.title === "Findings" ||
      section.title === "Endoscopic Diagnosis"
        ? COLONOSCOPY_PROCEDURE_COLUMN_LABEL_WIDTH
        : FINDINGS_DETAIL_SECTION_TITLES.has(section.title)
          ? 78
          : undefined,
    labelGap:
      section.title === "Preoperative Information" ||
      section.title === "Bowel Preparation and Procedure Details" ||
      section.title === "Procedure Details" ||
      section.title === "Findings" ||
      section.title === "Endoscopic Diagnosis"
        ? COLONOSCOPY_PROCEDURE_COLUMN_LABEL_GAP
        : FINDINGS_DETAIL_SECTION_TITLES.has(section.title)
          ? 3
          : undefined,
    entries: section.entries.map((entry) => ({
      label:
        section.title === "Preoperative Information" &&
        entry.label === "Preoperative Imaging"
          ? "Imaging"
          : section.title === "Preoperative Information" &&
              entry.label === "Total Duration (Min)"
            ? "Total Duration"
          : section.title === "Preoperative Information" &&
              entry.label === "Duration of Withdrawal (Min)"
            ? "Withdrawal Duration"
          : entry.label,
      value: formatExportValue(entry.value),
      fullWidth: entry.fullWidth,
      subheading: entry.subheading,
      valueOnly: entry.valueOnly,
      spacerBefore: entry.spacerBefore,
      spacerAfter: entry.spacerAfter,
    })),
  }));

  return generateStructuredTemplatePdf({
    title: "COLONOSCOPY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    patientInfoAsaLabel: "ASA Score",
    showSectionDividers: false,
    sections,
    signatureLayout: "appendectomy",
    prioritizeSignsBeforeIndication: true,
    diagram: diagramImageData
      ? {
          title: "Colonoscopy Diagram",
          imageData: diagramImageData,
          placement: "end",
          style: "plain",
          legendTitle: "Legend",
          legendPosition: "top",
          legendItems:
            diagramLegendItems.length > 0
              ? diagramLegendItems
              : ["Diagram annotations are included directly in the image."],
          boxWidth: 84,
          boxHeight: 126,
          align: "left",
          inlineReserveHeight: 28,
          inlineLayout: "questionAnswerDiagram",
        }
      : undefined,
    signature: {
      text: surgeonSignatureText,
      dateTime: signatureDateTime,
      alwaysShow: true,
    },
  });
};
