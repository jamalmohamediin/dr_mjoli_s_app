import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import {
  formatDateTimeDDMMYYYYWithDashes,
  getLocalDateTimeValue,
} from "@/utils/dateFormatter";
import { joinSelections, toArray, toUiTitleCase } from "@/utils/templateDataHelpers";

const titleCase = (value: unknown) =>
  toUiTitleCase(value === undefined || value === null ? "" : String(value));

const formatSelectionList = (value: unknown) =>
  toArray(value)
    .map((entry) => titleCase(entry))
    .join(", ");

const formatSelectionListWithOther = (value: unknown, otherValue?: unknown) =>
  titleCase(joinSelections(value, otherValue));

const formatMeasurement = (value: unknown, unit: string) => {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) {
    return "";
  }

  return `${normalizedValue} ${unit}`;
};

const asSingleLineEntry = (value: string): string[] => (value ? [value] : []);

export const generateTransanalMinimallyInvasiveSurgeryPDF = async (
  data: any,
  patientInfo?: any,
) => {
  const preoperative = data?.preoperative || {};
  const operativeFindings = data?.operativeFindings || {};
  const procedure = data?.procedure || {};
  const operativeEvents = data?.operativeEvents || {};
  const specimen = data?.specimen || {};
  const additionalInfo = data?.additionalInfo || {};
  const surgeonSignatureValue = titleCase(
    additionalInfo.doctorSignature ||
      additionalInfo.surgeonSignature ||
      additionalInfo.surgeonSignatureText,
  );
  const signatureDateTimeRaw = String(
    additionalInfo.dateTime || additionalInfo.date || "",
  ).trim();
  const signatureDateTimeValue =
    formatDateTimeDDMMYYYYWithDashes(signatureDateTimeRaw || getLocalDateTimeValue()) ||
    signatureDateTimeRaw ||
    getLocalDateTimeValue();
  const lesionSize =
    operativeFindings.lesionSizeLength || operativeFindings.lesionSizeWidth
      ? `${operativeFindings.lesionSizeLength || ""} x ${operativeFindings.lesionSizeWidth || ""} Cm`
      : "";
  const tumourStaging = [
    preoperative.cT ? `cT ${preoperative.cT}` : "",
    preoperative.cN ? `cN ${preoperative.cN}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      layout: "label-value-table",
      entries: [
        { label: "Surgeon", value: formatSelectionList(preoperative.surgeons) },
        { label: "Assistant", value: formatSelectionList(preoperative.assistants) },
        { label: "Anesthetist", value: formatSelectionList(preoperative.anaesthetists) },
        {
          label: "Pre-Operative Diagnosis",
          value: formatSelectionListWithOther(preoperative.diagnosis, preoperative.diagnosisOther),
        },
        {
          label: "Pre-Operative Imaging",
          value: formatSelectionListWithOther(preoperative.imaging, preoperative.imagingOther),
        },
        { label: "Tumour Staging", value: tumourStaging },
        { label: "Urgency", value: titleCase(preoperative.urgency) },
        { label: "Duration Of Procedure", value: formatMeasurement(preoperative.duration, "Min") },
      ],
    },
    {
      title: "Operative Findings",
      layout: "label-value-table",
      entries: [
        { label: "Operative Findings", value: titleCase(operativeFindings.findings) },
        {
          label: "Distance From Anal Verge (Cm)",
          value: formatMeasurement(operativeFindings.distanceFromAnalVerge, "Cm"),
        },
        { label: "Location In Rectum", value: formatSelectionList(operativeFindings.locationInRectum) },
        { label: "Lesion Size", value: lesionSize },
        {
          label: "Morphology",
          value: formatSelectionListWithOther(
            operativeFindings.morphology,
            operativeFindings.morphologyOther,
          ),
        },
        {
          label: "Circumferential Involvement",
          value: titleCase(operativeFindings.circumferentialInvolvement),
        },
      ],
    },
    {
      title: "Procedure Details",
      layout: "label-value-table",
      entries: [
        {
          label: "Equipment Used",
          value: formatSelectionListWithOther(procedure.equipmentUsed, procedure.equipmentOther),
        },
        {
          label: "Insufflation Pressure",
          value: formatMeasurement(procedure.insufflationPressure, "MmHg"),
        },
        { label: "Circular Rectal Purse Suture Inserted", value: titleCase(procedure.purseStringInserted) },
        {
          label: "Lesion Peripheral Margin Marked",
          value: titleCase(procedure.lesionPeripheralMarginMarked),
        },
        { label: "Planned Margin", value: formatMeasurement(procedure.plannedMargin, "Mm") },
        {
          label: "Depth Of Excision",
          value: formatSelectionListWithOther(
            procedure.depthOfExcision,
            procedure.depthOfExcisionOther,
          ),
        },
        { label: "Device Used", value: formatSelectionListWithOther(procedure.deviceUsed, procedure.deviceOther) },
        { label: "Haemostasis", value: formatSelectionListWithOther(procedure.haemostasis, procedure.haemostasisOther) },
        { label: "Management Of Defect After Excision", value: formatSelectionList(procedure.defectManagement) },
        { label: "Direction Of Defect Closure", value: formatSelectionList(procedure.closureDirection) },
        { label: "Closure Technique", value: formatSelectionList(procedure.closureTechnique) },
        {
          label: "Suture Material",
          value: formatSelectionListWithOther(procedure.sutureMaterial, procedure.sutureMaterialOther),
        },
        {
          label: "Intra-Operative Difficulties",
          value: formatSelectionListWithOther(
            operativeEvents.difficulties,
            operativeEvents.difficultiesOther,
          ),
        },
        {
          label: "Intra-Operative Complications",
          value: formatSelectionListWithOther(
            operativeEvents.complications,
            operativeEvents.complicationsOther,
          ),
        },
      ],
    },
    {
      title: "SPECIMEN",
      layout: "label-value-table",
      entries: [
        {
          label: "Specimen Retrieved",
          value: asSingleLineEntry(titleCase(specimen.specimenRetrieved)),
        },
        {
          label: "Orientation Marked",
          value: asSingleLineEntry(titleCase(specimen.orientationMarked)),
        },
        {
          label: "Specify Laboratory Sent To",
          value: asSingleLineEntry(
            specimen.specimenRetrieved === "Yes"
              ? titleCase(specimen.laboratorySentTo) || "________________"
              : "",
          ),
        },
      ],
    },
    {
      title: "ADDITIONAL NOTES",
      layout: "label-value-table",
      entries: [
        {
          label: "Additional Notes",
          value: asSingleLineEntry(titleCase(additionalInfo.additionalInformation)),
        },
      ],
    },
    {
      title: "POST OPERATIVE MANAGEMENT",
      layout: "label-value-table",
      entries: [
        {
          label: "Post Operative Management",
          value: asSingleLineEntry(titleCase(additionalInfo.postOperativeManagement)),
        },
      ],
    },
    {
      title: "SURGEON'S SIGNATURE",
      layout: "label-value-table",
      columns: 2,
      entries: [
        {
          label: "Surgeon's Signature",
          value: asSingleLineEntry(surgeonSignatureValue || "________________"),
        },
        {
          label: "Date And Time",
          value: asSingleLineEntry(signatureDateTimeValue || "________________"),
        },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title: "TRANSANAL MINIMALLY INVASIVE SURGERY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
  });
};
