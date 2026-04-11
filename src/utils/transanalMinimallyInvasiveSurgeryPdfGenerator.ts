import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

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

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
        { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", ") },
        { label: "Diagnosis", value: joinSelections(preoperative.diagnosis, preoperative.diagnosisOther) },
        { label: "Imaging", value: joinSelections(preoperative.imaging, preoperative.imagingOther) },
        { label: "Tumour staging", value: [preoperative.cT ? `cT ${preoperative.cT}` : "", preoperative.cN ? `cN ${preoperative.cN}` : ""].filter(Boolean).join(", ") },
        { label: "Urgency", value: preoperative.urgency },
        { label: "Duration", value: preoperative.duration ? `${preoperative.duration} min` : "" },
      ],
    },
    {
      title: "Operative Findings",
      entries: [
        { label: "Operative Findings", value: operativeFindings.findings },
        { label: "Location", value: operativeFindings.locationInRectum },
        { label: "Morphology", value: joinSelections(operativeFindings.morphology, operativeFindings.morphologyOther) },
        { label: "Distance from anal verge", value: operativeFindings.distanceFromAnalVerge ? `${operativeFindings.distanceFromAnalVerge} cm` : "" },
        { label: "Lesion size", value: operativeFindings.lesionSizeLength || operativeFindings.lesionSizeWidth ? `${operativeFindings.lesionSizeLength || ""} x ${operativeFindings.lesionSizeWidth || ""} cm` : "" },
        { label: "Circumferential involvement", value: operativeFindings.circumferentialInvolvement },
      ],
    },
    {
      title: "Procedure Details",
      entries: [
        { label: "Equipment used", value: joinSelections(procedure.equipmentUsed, procedure.equipmentOther) },
        { label: "Insufflation pressure", value: procedure.insufflationPressure ? `${procedure.insufflationPressure} mmHg` : "" },
        { label: "Purse suture inserted", value: procedure.purseStringInserted },
        { label: "Lesion peripheral margin marked", value: procedure.lesionPeripheralMarginMarked },
        { label: "Planned margin", value: procedure.plannedMargin ? `${procedure.plannedMargin} mm` : "" },
        { label: "Depth of excision", value: joinSelections(procedure.depthOfExcision, procedure.depthOfExcisionOther) },
        { label: "Device used", value: joinSelections(procedure.deviceUsed, procedure.deviceOther) },
        { label: "Haemostasis", value: joinSelections(procedure.haemostasis, procedure.haemostasisOther) },
        { label: "Defect management", value: procedure.defectManagement },
        { label: "Closure direction", value: procedure.closureDirection },
        { label: "Closure technique", value: procedure.closureTechnique },
        { label: "Suture material", value: joinSelections(procedure.sutureMaterial, procedure.sutureMaterialOther) },
      ],
    },
    {
      title: "Operative Events",
      entries: [
        { label: "Difficulties", value: joinSelections(operativeEvents.difficulties, operativeEvents.difficultiesOther) },
        { label: "Complications", value: joinSelections(operativeEvents.complications, operativeEvents.complicationsOther) },
      ],
    },
    {
      title: "Specimen and Additional Information",
      entries: [
        { label: "Specimen retrieved", value: specimen.specimenRetrieved },
        { label: "Orientation marked", value: specimen.orientationMarked },
        { label: "Additional information", value: additionalInfo.additionalInformation },
        { label: "Post operative management", value: additionalInfo.postOperativeManagement },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title: "TRANSANAL MINIMALLY INVASIVE SURGERY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    signature: {
      text: additionalInfo.doctorSignature,
      dateTime: additionalInfo.dateTime,
    },
  });
};
