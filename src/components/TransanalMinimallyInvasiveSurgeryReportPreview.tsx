import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

interface TransanalMinimallyInvasiveSurgeryReportPreviewProps {
  report: any;
}

export const TransanalMinimallyInvasiveSurgeryReportPreview = ({
  report,
}: TransanalMinimallyInvasiveSurgeryReportPreviewProps) => {
  const template = report?.transanalMinimallyInvasiveSurgery || {};
  const preoperative = template.preoperative || {};
  const operativeFindings = template.operativeFindings || {};
  const procedure = template.procedure || {};
  const operativeEvents = template.operativeEvents || {};
  const specimen = template.specimen || {};
  const additionalInfo = template.additionalInfo || {};

  const sections: StructuredTemplatePreviewSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
        { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", "), fullWidth: true },
        {
          label: "Pre-operative diagnosis",
          value: joinSelections(preoperative.diagnosis, preoperative.diagnosisOther),
          fullWidth: true,
        },
        {
          label: "Pre-operative imaging",
          value: joinSelections(preoperative.imaging, preoperative.imagingOther),
          fullWidth: true,
        },
        { label: "Tumour staging", value: [preoperative.cT ? `cT ${preoperative.cT}` : "", preoperative.cN ? `cN ${preoperative.cN}` : ""].filter(Boolean).join(", ") },
        { label: "Urgency", value: preoperative.urgency },
      ],
    },
    {
      title: "Operative Findings",
      entries: [
        { label: "Operative Findings", value: operativeFindings.findings, fullWidth: true },
        { label: "Location in rectum", value: operativeFindings.locationInRectum, badges: true },
        { label: "Morphology", value: joinSelections(operativeFindings.morphology, operativeFindings.morphologyOther), fullWidth: true },
        { label: "Distance from anal verge", value: operativeFindings.distanceFromAnalVerge ? `${operativeFindings.distanceFromAnalVerge} cm` : "" },
        {
          label: "Lesion size",
          value:
            operativeFindings.lesionSizeLength || operativeFindings.lesionSizeWidth
              ? `${operativeFindings.lesionSizeLength || ""} x ${operativeFindings.lesionSizeWidth || ""} cm`
              : "",
        },
        { label: "Circumferential involvement", value: operativeFindings.circumferentialInvolvement },
      ],
    },
    {
      title: "Procedure Details",
      entries: [
        { label: "Equipment Used", value: joinSelections(procedure.equipmentUsed, procedure.equipmentOther), fullWidth: true },
        { label: "Insufflation pressure", value: procedure.insufflationPressure ? `${procedure.insufflationPressure} mmHg` : "" },
        { label: "Purse suture inserted", value: procedure.purseStringInserted },
        { label: "Lesion peripheral margin marked", value: procedure.lesionPeripheralMarginMarked },
        { label: "Planned margin", value: procedure.plannedMargin ? `${procedure.plannedMargin} mm` : "" },
        { label: "Depth of excision", value: joinSelections(procedure.depthOfExcision, procedure.depthOfExcisionOther), fullWidth: true },
        { label: "Device used", value: joinSelections(procedure.deviceUsed, procedure.deviceOther), fullWidth: true },
        { label: "Haemostasis", value: joinSelections(procedure.haemostasis, procedure.haemostasisOther), fullWidth: true },
        { label: "Management of defect", value: procedure.defectManagement, badges: true },
        { label: "Direction of defect closure", value: procedure.closureDirection, badges: true },
        { label: "Closure technique", value: procedure.closureTechnique, badges: true },
        { label: "Suture material", value: joinSelections(procedure.sutureMaterial, procedure.sutureMaterialOther), fullWidth: true },
      ],
    },
    {
      title: "Intra-operative Difficulties and Complications",
      entries: [
        { label: "Difficulties", value: joinSelections(operativeEvents.difficulties, operativeEvents.difficultiesOther), fullWidth: true },
        { label: "Complications", value: joinSelections(operativeEvents.complications, operativeEvents.complicationsOther), fullWidth: true },
      ],
    },
    {
      title: "Specimen and Additional Information",
      entries: [
        { label: "Specimen retrieved", value: specimen.specimenRetrieved },
        {
          label: "Laboratory sent to",
          value: specimen.specimenRetrieved === "Yes" ? specimen.laboratorySentTo : "",
        },
        { label: "Orientation marked", value: specimen.orientationMarked },
        { label: "Additional information", value: additionalInfo.additionalInformation, fullWidth: true },
        { label: "Post operative management", value: additionalInfo.postOperativeManagement, fullWidth: true },
      ],
    },
  ];

  return (
    <StructuredTemplateReportPreview
      title="TRANSANAL MINIMALLY INVASIVE SURGERY REPORT"
      patientInfo={template.patientInfo}
      sections={sections}
      signature={{
        label: "Doctor Signature",
        text: additionalInfo.doctorSignature,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage="Start filling out the transanal minimally invasive surgery form to see findings appear here."
    />
  );
};
