import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

interface NarrativeSurgeryReportPreviewProps {
  report: any;
  reportKey: "openGeneralSurgery" | "openAbdominalSurgery";
  variant: "general" | "abdominal";
  title: string;
}

export const NarrativeSurgeryReportPreview = ({
  report,
  reportKey,
  variant,
  title,
}: NarrativeSurgeryReportPreviewProps) => {
  const template = report?.[reportKey] || {};
  const preoperative = template.preoperative || {};
  const access = template.access || {};
  const narrative = template.narrative || {};
  const additionalInfo = template.additionalInfo || {};

  const sections: StructuredTemplatePreviewSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
        { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", "), fullWidth: true },
        {
          label: "Pre-operative imaging",
          value: joinSelections(preoperative.imaging, preoperative.imagingOther),
          fullWidth: true,
        },
        { label: "Urgency", value: preoperative.urgency },
        { label: "Duration of Procedure", value: preoperative.duration ? `${preoperative.duration} min` : "" },
      ],
    },
    {
      title: variant === "abdominal" ? "Abdominal Access and Incisions" : "Diagram",
      entries:
        variant === "abdominal"
          ? [
              { label: "Approach", value: access.approach },
              {
                label: "Reason for conversion",
                value: joinSelections(access.reasonForConversion, access.reasonForConversionOther),
                fullWidth: true,
              },
            ]
          : [],
    },
    {
      title: "Narrative Report",
      entries: [
        { label: "Operation Done", value: narrative.operationDone, fullWidth: true },
        { label: "Operative Findings", value: narrative.operativeFindings, fullWidth: true },
        { label: "Operation Details", value: narrative.operationDetails, fullWidth: true },
        {
          label: "Specimens",
          value:
            variant === "abdominal"
              ? joinSelections(narrative.specimensTaken, narrative.specimensTakenOther)
              : narrative.specimensTaken,
          fullWidth: true,
        },
        {
          label: "Points of Difficulty",
          value:
            variant === "abdominal"
              ? joinSelections(narrative.pointsOfDifficulty, narrative.pointsOfDifficultyOther)
              : narrative.pointsOfDifficulty,
          fullWidth: true,
        },
        {
          label: "Intra-operative complications",
          value:
            variant === "abdominal"
              ? joinSelections(
                  toArray(narrative.intraoperativeComplications).map((entry) =>
                    entry === "Other" ? `Other: ${narrative.intraoperativeComplicationsOther || ""}` : entry,
                  ),
                )
              : narrative.intraoperativeComplications,
          fullWidth: true,
        },
        {
          label: "Post operative management",
          value: narrative.postOperativeManagement,
          fullWidth: true,
        },
      ],
    },
  ];

  return (
    <StructuredTemplateReportPreview
      title={title}
      patientInfo={template.patientInfo}
      sections={sections}
      diagram={{
        title: "Ports and Incisions Diagram",
        imageData: template?.procedureFindings?.diagramImageData || template?.procedureFindings?.canvasImageData,
        alt: `${title} diagram`,
      }}
      signature={{
        label: "Doctor Signature",
        text: additionalInfo.doctorName,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage={`Start filling out the ${title.toLowerCase()} form to see findings appear here.`}
    />
  );
};
