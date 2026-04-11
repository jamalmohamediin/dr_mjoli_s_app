import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

interface GastroscopyReportPreviewProps {
  report: any;
}

export const GastroscopyReportPreview = ({ report }: GastroscopyReportPreviewProps) => {
  const template = report?.gastroscopy || {};
  const preoperative = template.preoperative || {};
  const pharynxLarynx = template.pharynxLarynx || {};
  const oesophagus = template.oesophagus || {};
  const stomach = template.stomach || {};
  const duodenum = template.duodenum || {};
  const interventions = template.interventions || {};
  const diagnosis = template.diagnosis || {};
  const additionalInfo = template.additionalInfo || {};
  const diagram = template.diagram || {};

  const sections: StructuredTemplatePreviewSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Endoscopist", value: toArray(preoperative.endoscopists).join(", ") },
        { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", "), fullWidth: true },
        { label: "Indications", value: joinSelections(preoperative.indications, preoperative.indicationOther), fullWidth: true },
        { label: "Signs & symptoms", value: joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther), fullWidth: true },
        { label: "Extent of examination", value: preoperative.extentOfExamination, badges: true },
        { label: "Sedationist", value: preoperative.sedationist === "Other" ? `Other: ${preoperative.sedationistOther || ""}` : preoperative.sedationist },
        { label: "Type of sedation", value: preoperative.sedationTypes, badges: true },
        {
          label: "Medications",
          value: [
            preoperative.medications?.midazolamDose ? `Midazolam ${preoperative.medications.midazolamDose} mg` : "",
            preoperative.medications?.fentanylDose ? `Fentanyl ${preoperative.medications.fentanylDose} mcg` : "",
            preoperative.medications?.propofolDose ? `Propofol ${preoperative.medications.propofolDose} mg` : "",
            preoperative.medications?.otherMedication ? `Other: ${preoperative.medications.otherMedication}` : "",
          ].filter(Boolean),
          fullWidth: true,
        },
        { label: "Monitoring", value: joinSelections(preoperative.monitoring, preoperative.monitoringOther), fullWidth: true },
        { label: "Sedation achieved", value: preoperative.sedationLevel },
      ],
    },
    {
      title: "Procedure Findings",
      entries: [
        { label: "Pharynx", value: pharynxLarynx.pharynxStatus === "Abnormal" ? `Abnormal: ${pharynxLarynx.pharynxAbnormality || ""}` : pharynxLarynx.pharynxStatus },
        { label: "Vocal cords", value: pharynxLarynx.vocalCordsStatus === "Abnormal" ? `Abnormal: ${pharynxLarynx.vocalCordsAbnormality || ""}` : pharynxLarynx.vocalCordsStatus },
        { label: "Oesophagus", value: oesophagus.findings, badges: true },
        { label: "Oesophagus details", value: [oesophagus.barrettType, oesophagus.barrettLength ? `${oesophagus.barrettLength} cm` : "", oesophagus.candidaSeverity, oesophagus.oesophagitisGrade, oesophagus.hiatusHerniaGrade, oesophagus.varicesGrade].filter(Boolean).join(", "), fullWidth: true },
        { label: "Stomach", value: stomach.findings, badges: true },
        { label: "Stomach details", value: [stomach.ulcerCount, stomach.ulcerFeatures, stomach.gastritisSeverity, stomach.varicesNumber, stomach.polypNumber].filter(Boolean).join(", "), fullWidth: true },
        { label: "Duodenum", value: duodenum.findings, badges: true },
        { label: "Duodenum details", value: [duodenum.duodenitisSeverity, duodenum.ulcerCount, duodenum.ulcerFeatures, duodenum.polypCount].filter(Boolean).join(", "), fullWidth: true },
      ],
    },
    {
      title: "Interventions and Diagnosis",
      entries: [
        { label: "Interventions", value: interventions.interventions, badges: true },
        { label: "Dilatation types", value: interventions.dilatationTypes, badges: true },
        { label: "Stent type", value: interventions.stentTypes, badges: true },
        { label: "Other intervention detail", value: interventions.other, fullWidth: true },
        { label: "Final diagnosis", value: diagnosis.diagnoses, badges: true },
        { label: "Other diagnosis", value: diagnosis.diagnosisOther, fullWidth: true },
      ],
    },
    {
      title: "Comments, Conclusion and Management",
      entries: [
        { label: "Comments", value: additionalInfo.comments, fullWidth: true },
        { label: "Conclusion", value: additionalInfo.conclusion, fullWidth: true },
        { label: "Management", value: additionalInfo.management, fullWidth: true },
      ],
    },
  ];

  return (
    <StructuredTemplateReportPreview
      title="GASTROSCOPY REPORT"
      patientInfo={template.patientInfo}
      sections={sections}
      diagram={{
        title: "Gastroscopy Diagram",
        imageData: diagram.canvasImageData,
        alt: "Gastroscopy anatomy diagram",
      }}
      signature={{
        label: "Endoscopist Signature",
        text: additionalInfo.endoscopistName,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage="Start filling out the gastroscopy form to see findings appear here."
    />
  );
};
