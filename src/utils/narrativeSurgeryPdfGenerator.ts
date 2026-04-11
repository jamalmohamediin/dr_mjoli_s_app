import appendectomyImage from "@/assets/appendectomy.jpg";
import { createSurgicalDiagramCanvas } from "@/utils/createSurgicalDiagramCanvas";
import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

const parseMarkings = (value: string) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const generateNarrativeSurgeryPDF = async (
  title: string,
  narrativeData: any,
  patientInfo: any,
  variant: "general" | "abdominal",
) => {
  const preoperative = narrativeData?.preoperative || {};
  const access = narrativeData?.access || {};
  const narrative = narrativeData?.narrative || {};
  const additionalInfo = narrativeData?.additionalInfo || {};
  const diagramImageData = await createSurgicalDiagramCanvas(
    appendectomyImage,
    parseMarkings(narrativeData?.procedureFindings?.findings || ""),
    1.5,
  );

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
        { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", ") },
        { label: "Start Time", value: preoperative.startTime },
        { label: "End Time", value: preoperative.endTime },
        { label: "Duration", value: preoperative.duration ? `${preoperative.duration} min` : "" },
        {
          label: "Pre-operative imaging",
          value: joinSelections(preoperative.imaging, preoperative.imagingOther),
        },
        { label: "Urgency", value: preoperative.urgency },
      ],
    },
    ...(variant === "abdominal"
      ? [
          {
            title: "Abdominal Access and Incisions",
            entries: [
              { label: "Approach", value: access.approach },
              {
                label: "Reason for conversion",
                value: joinSelections(access.reasonForConversion, access.reasonForConversionOther),
              },
            ],
          } satisfies StructuredTemplatePdfSection,
        ]
      : []),
    {
      title: "Narrative Report",
      entries: [
        { label: "Operation Done", value: narrative.operationDone },
        { label: "Operative Findings", value: narrative.operativeFindings },
        { label: "Operation Details", value: narrative.operationDetails },
        {
          label: "Specimens",
          value:
            variant === "abdominal"
              ? joinSelections(narrative.specimensTaken, narrative.specimensTakenOther)
              : narrative.specimensTaken,
        },
        {
          label: "Points of Difficulty",
          value:
            variant === "abdominal"
              ? joinSelections(narrative.pointsOfDifficulty, narrative.pointsOfDifficultyOther)
              : narrative.pointsOfDifficulty,
        },
        {
          label: "Intra-operative complications",
          value:
            variant === "abdominal"
              ? [
                  ...toArray(narrative.intraoperativeComplications).filter((entry) => entry !== "Other"),
                  ...(narrative.intraoperativeComplicationsOther
                    ? [narrative.intraoperativeComplicationsOther]
                    : []),
                ]
              : narrative.intraoperativeComplications,
        },
        {
          label: "Post operative management",
          value: narrative.postOperativeManagement,
        },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title,
    patientInfo: patientInfo || narrativeData?.patientInfo,
    sections,
    diagram: diagramImageData
      ? {
          title: "Ports and Incisions Diagram",
          imageData: diagramImageData,
        }
      : undefined,
    signature: {
      text: additionalInfo.doctorName,
      dateTime: additionalInfo.dateTime,
    },
  });
};
