import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

interface ColonoscopyReportPreviewProps {
  report: any;
}

export const ColonoscopyReportPreview = ({ report }: ColonoscopyReportPreviewProps) => {
  const template = report?.colonoscopy || {};
  const preoperative = template.preoperative || {};
  const bowelPreparation = template.bowelPreparation || {};
  const procedureDetails = template.procedureDetails || {};
  const findingsSummary = template.findingsSummary || {};
  const haemorrhoids = template.haemorrhoids || {};
  const inflammation = template.inflammation || {};
  const stricture = template.stricture || {};
  const polyps = template.polyps || {};
  const tumour = template.tumour || {};
  const diverticula = template.diverticula || {};
  const avMalformation = template.avMalformation || {};
  const radiationProctitis = template.radiationProctitis || {};
  const ulcer = template.ulcer || {};
  const interventions = template.interventions || {};
  const diagnosis = template.diagnosis || {};
  const additionalInfo = template.additionalInfo || {};
  const diagram = template.diagram || {};

  const sections: StructuredTemplatePreviewSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Endoscopist", value: toArray(preoperative.endoscopists).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", ") },
        { label: "Procedure times", value: [preoperative.startTime ? `Start ${preoperative.startTime}` : "", preoperative.caecalIntubationTime ? `Caecal ${preoperative.caecalIntubationTime}` : "", preoperative.withdrawalStartTime ? `Withdrawal ${preoperative.withdrawalStartTime}` : "", preoperative.endTime ? `End ${preoperative.endTime}` : ""].filter(Boolean).join(", "), fullWidth: true },
        { label: "Indications", value: joinSelections(preoperative.indications, preoperative.indicationOther), fullWidth: true },
        { label: "Signs & symptoms", value: joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther), fullWidth: true },
        { label: "Sedationist", value: preoperative.sedationist === "Other" ? `Other: ${preoperative.sedationistOther || ""}` : preoperative.sedationist },
        { label: "Monitoring", value: joinSelections(preoperative.monitoring, preoperative.monitoringOther), fullWidth: true },
        { label: "Sedation achieved", value: preoperative.sedationLevel },
      ],
    },
    {
      title: "Bowel Preparation and Procedure Details",
      entries: [
        { label: "Type of prep", value: joinSelections(bowelPreparation.prepType, bowelPreparation.prepTypeOther), fullWidth: true },
        { label: "Overall assessment", value: bowelPreparation.overallAssessment },
        { label: "Total BBPS", value: bowelPreparation.totalBbps ? `${bowelPreparation.totalBbps} / 9` : "" },
        { label: "Procedure", value: joinSelections(procedureDetails.procedures, procedureDetails.procedureOther), fullWidth: true },
        { label: "Depth of examination", value: procedureDetails.depthOfExamination, badges: true },
        { label: "Caecal landmarks", value: joinSelections(procedureDetails.caecalLandmarks, procedureDetails.caecalLandmarksOther), fullWidth: true },
        { label: "Reasons caecum not reached", value: joinSelections(procedureDetails.reasonsCaecumNotReached, procedureDetails.reasonsCaecumNotReachedOther), fullWidth: true },
        { label: "Difficulty", value: procedureDetails.difficulty },
      ],
    },
    {
      title: "Findings",
      entries: [
        { label: "Findings", value: joinSelections(findingsSummary.findings, findingsSummary.findingOther), fullWidth: true },
        { label: "Sites", value: joinSelections(findingsSummary.sitesOfAbnormality, findingsSummary.siteOther), fullWidth: true },
        { label: "Description", value: findingsSummary.descriptionOfFindings, fullWidth: true },
        { label: "Haemorrhoids", value: [haemorrhoids.grade, haemorrhoids.bleedingStatus].filter(Boolean).join(", ") },
        { label: "Inflammation", value: [joinSelections(inflammation.description, inflammation.descriptionOther), inflammation.severity].filter(Boolean).join(", "), fullWidth: true },
        { label: "Stricture", value: [stricture.number, stricture.length, stricture.severityOfNarrowing].filter(Boolean).join(", "), fullWidth: true },
        { label: "Polyps", value: [polyps.number, polyps.size].filter(Boolean).join(", ") },
        { label: "Tumour", value: [tumour.length ? `${tumour.length} cm` : "", tumour.circumferentialInvolvement].filter(Boolean).join(", ") },
        { label: "Diverticula", value: [diverticula.number, diverticula.size, diverticula.distributionPattern].filter(Boolean).join(", "), fullWidth: true },
        { label: "AV malformation", value: [avMalformation.number, avMalformation.size, avMalformation.bleedingStatus].filter(Boolean).join(", "), fullWidth: true },
        { label: "Radiation proctitis", value: [radiationProctitis.extentFromAnalVerge ? `${radiationProctitis.extentFromAnalVerge} cm` : "", radiationProctitis.severity].filter(Boolean).join(", ") },
        { label: "Ulcer", value: [ulcer.number, ulcer.distribution].filter(Boolean).join(", ") },
      ],
    },
    {
      title: "Interventions and Diagnosis",
      entries: [
        { label: "Interventions", value: joinSelections(interventions.interventions, interventions.other), fullWidth: true },
        { label: "Diagnosis", value: joinSelections(diagnosis.diagnoses, diagnosis.diagnosisOther), fullWidth: true },
        { label: "Additional Notes", value: additionalInfo.additionalNotes, fullWidth: true },
        { label: "Conclusion", value: additionalInfo.conclusion, fullWidth: true },
        { label: "Management", value: additionalInfo.management, fullWidth: true },
      ],
    },
  ];

  return (
    <StructuredTemplateReportPreview
      title="COLONOSCOPY REPORT"
      patientInfo={template.patientInfo}
      sections={sections}
      diagram={{
        title: "Colonoscopy Diagram",
        imageData: diagram.canvasImageData,
        alt: "Colonoscopy anatomy diagram",
      }}
      signature={{
        label: "Endoscopist Signature",
        text: additionalInfo.endoscopistName,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage="Start filling out the colonoscopy form to see findings appear here."
    />
  );
};
