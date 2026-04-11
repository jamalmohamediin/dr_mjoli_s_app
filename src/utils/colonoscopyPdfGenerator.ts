import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

export const generateColonoscopyPDF = async (data: any, patientInfo?: any) => {
  const preoperative = data?.preoperative || {};
  const bowelPreparation = data?.bowelPreparation || {};
  const procedureDetails = data?.procedureDetails || {};
  const findingsSummary = data?.findingsSummary || {};
  const haemorrhoids = data?.haemorrhoids || {};
  const inflammation = data?.inflammation || {};
  const stricture = data?.stricture || {};
  const polyps = data?.polyps || {};
  const tumour = data?.tumour || {};
  const diverticula = data?.diverticula || {};
  const avMalformation = data?.avMalformation || {};
  const radiationProctitis = data?.radiationProctitis || {};
  const ulcer = data?.ulcer || {};
  const interventions = data?.interventions || {};
  const diagnosis = data?.diagnosis || {};
  const additionalInfo = data?.additionalInfo || {};
  const diagram = data?.diagram || {};

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Endoscopist", value: preoperative.endoscopists },
        { label: "Anesthetist", value: preoperative.anaesthetists },
        { label: "Procedure times", value: [preoperative.startTime ? `Start ${preoperative.startTime}` : "", preoperative.caecalIntubationTime ? `Caecal ${preoperative.caecalIntubationTime}` : "", preoperative.withdrawalStartTime ? `Withdrawal ${preoperative.withdrawalStartTime}` : "", preoperative.endTime ? `End ${preoperative.endTime}` : ""].filter(Boolean) },
        { label: "Indications", value: joinSelections(preoperative.indications, preoperative.indicationOther) },
        { label: "Signs & symptoms", value: joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther) },
        { label: "Sedationist", value: preoperative.sedationist === "Other" ? `Other: ${preoperative.sedationistOther || ""}` : preoperative.sedationist },
        { label: "Monitoring", value: joinSelections(preoperative.monitoring, preoperative.monitoringOther) },
        { label: "Sedation achieved", value: preoperative.sedationLevel },
      ],
    },
    {
      title: "Bowel Preparation and Procedure Details",
      entries: [
        { label: "Type of prep", value: joinSelections(bowelPreparation.prepType, bowelPreparation.prepTypeOther) },
        { label: "Overall assessment", value: bowelPreparation.overallAssessment },
        { label: "Right colon BBPS", value: bowelPreparation.bbpsRightColon },
        { label: "Transverse colon BBPS", value: bowelPreparation.bbpsTransverseColon },
        { label: "Left colon BBPS", value: bowelPreparation.bbpsLeftColon },
        { label: "Total BBPS", value: bowelPreparation.totalBbps ? `${bowelPreparation.totalBbps} / 9` : "" },
        { label: "Procedure", value: joinSelections(procedureDetails.procedures, procedureDetails.procedureOther) },
        { label: "Depth of examination", value: procedureDetails.depthOfExamination },
        { label: "Caecal landmarks", value: joinSelections(procedureDetails.caecalLandmarks, procedureDetails.caecalLandmarksOther) },
        { label: "Reasons caecum not reached", value: joinSelections(procedureDetails.reasonsCaecumNotReached, procedureDetails.reasonsCaecumNotReachedOther) },
        { label: "Difficulty", value: procedureDetails.difficulty },
      ],
    },
    {
      title: "Findings",
      entries: [
        { label: "Findings", value: joinSelections(findingsSummary.findings, findingsSummary.findingOther) },
        { label: "Sites", value: joinSelections(findingsSummary.sitesOfAbnormality, findingsSummary.siteOther) },
        { label: "Description", value: findingsSummary.descriptionOfFindings },
        { label: "Haemorrhoids", value: [haemorrhoids.grade, haemorrhoids.bleedingStatus].filter(Boolean).join(", ") },
        { label: "Inflammation", value: [joinSelections(inflammation.description, inflammation.descriptionOther), inflammation.severity].filter(Boolean).join(", ") },
        { label: "Stricture", value: [stricture.number, stricture.length, stricture.severityOfNarrowing].filter(Boolean).join(", ") },
        { label: "Polyps", value: [polyps.number, polyps.size, joinSelections(polyps.morphology, polyps.morphologyOther)].filter(Boolean).join(", ") },
        { label: "Tumour", value: [tumour.length ? `${tumour.length} cm` : "", tumour.circumferentialInvolvement, toArray(tumour.lumenNarrowing).join(", ")].filter(Boolean).join(", ") },
        { label: "Diverticula", value: [diverticula.number, diverticula.size, diverticula.distributionPattern].filter(Boolean).join(", ") },
        { label: "AV malformation", value: [avMalformation.number, avMalformation.size, avMalformation.bleedingStatus].filter(Boolean).join(", ") },
        { label: "Radiation proctitis", value: [radiationProctitis.extentFromAnalVerge ? `${radiationProctitis.extentFromAnalVerge} cm` : "", radiationProctitis.severity, toArray(radiationProctitis.distribution).join(", ")].filter(Boolean).join(", ") },
        { label: "Ulcer", value: [ulcer.number, ulcer.distribution, toArray(ulcer.shape).join(", ")].filter(Boolean).join(", ") },
      ],
    },
    {
      title: "Interventions and Diagnosis",
      entries: [
        { label: "Interventions", value: joinSelections(interventions.interventions, interventions.other) },
        { label: "Diagnosis", value: joinSelections(diagnosis.diagnoses, diagnosis.diagnosisOther) },
        { label: "Additional Notes", value: additionalInfo.additionalNotes },
        { label: "Conclusion", value: additionalInfo.conclusion },
        { label: "Management", value: additionalInfo.management },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title: "COLONOSCOPY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    diagram: diagram?.canvasImageData
      ? {
          title: "Colonoscopy Diagram",
          imageData: diagram.canvasImageData,
        }
      : undefined,
    signature: {
      text: additionalInfo.endoscopistName,
      dateTime: additionalInfo.dateTime,
    },
  });
};
