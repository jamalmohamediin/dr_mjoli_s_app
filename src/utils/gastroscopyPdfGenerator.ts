import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { joinSelections } from "@/utils/templateDataHelpers";

export const generateGastroscopyPDF = async (data: any, patientInfo?: any) => {
  const preoperative = data?.preoperative || {};
  const pharynxLarynx = data?.pharynxLarynx || {};
  const oesophagus = data?.oesophagus || {};
  const stomach = data?.stomach || {};
  const duodenum = data?.duodenum || {};
  const interventions = data?.interventions || {};
  const diagnosis = data?.diagnosis || {};
  const additionalInfo = data?.additionalInfo || {};
  const diagram = data?.diagram || {};

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Endoscopist", value: preoperative.endoscopists },
        { label: "Surgeon", value: preoperative.surgeons },
        { label: "Anesthetist", value: preoperative.anaesthetists },
        { label: "Indications", value: joinSelections(preoperative.indications, preoperative.indicationOther) },
        { label: "Signs & symptoms", value: joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther) },
        { label: "Extent of examination", value: preoperative.extentOfExamination },
        { label: "Sedationist", value: preoperative.sedationist === "Other" ? `Other: ${preoperative.sedationistOther || ""}` : preoperative.sedationist },
        { label: "Type of sedation", value: preoperative.sedationTypes },
        {
          label: "Medications",
          value: [
            preoperative.medications?.midazolamDose ? `Midazolam ${preoperative.medications.midazolamDose} mg` : "",
            preoperative.medications?.fentanylDose ? `Fentanyl ${preoperative.medications.fentanylDose} mcg` : "",
            preoperative.medications?.propofolDose ? `Propofol ${preoperative.medications.propofolDose} mg` : "",
            preoperative.medications?.otherMedication ? `Other: ${preoperative.medications.otherMedication}` : "",
          ].filter(Boolean),
        },
        { label: "Monitoring", value: joinSelections(preoperative.monitoring, preoperative.monitoringOther) },
        { label: "Sedation achieved", value: preoperative.sedationLevel },
      ],
    },
    {
      title: "Procedure Findings",
      entries: [
        { label: "Pharynx", value: pharynxLarynx.pharynxStatus === "Abnormal" ? `Abnormal: ${pharynxLarynx.pharynxAbnormality || ""}` : pharynxLarynx.pharynxStatus },
        { label: "Vocal cords", value: pharynxLarynx.vocalCordsStatus === "Abnormal" ? `Abnormal: ${pharynxLarynx.vocalCordsAbnormality || ""}` : pharynxLarynx.vocalCordsStatus },
        { label: "Oesophagus", value: oesophagus.findings },
        { label: "Oesophagus details", value: [oesophagus.barrettType, oesophagus.barrettLength ? `${oesophagus.barrettLength} cm` : "", oesophagus.candidaSeverity, oesophagus.oesophagitisGrade, oesophagus.hiatusHerniaGrade, oesophagus.varicesGrade, oesophagus.other].filter(Boolean).join(", ") },
        { label: "Stomach", value: stomach.findings },
        { label: "Stomach details", value: [stomach.ulcerCount, stomach.ulcerFeatures, stomach.gastritisSeverity, stomach.varicesNumber, stomach.polypNumber, stomach.other].filter(Boolean).join(", ") },
        { label: "Duodenum", value: duodenum.findings },
        { label: "Duodenum details", value: [duodenum.duodenitisSeverity, duodenum.ulcerCount, duodenum.ulcerFeatures, duodenum.polypCount, duodenum.other].filter(Boolean).join(", ") },
      ],
    },
    {
      title: "Interventions and Diagnosis",
      entries: [
        { label: "Interventions", value: interventions.interventions },
        { label: "Dilatation types", value: interventions.dilatationTypes },
        { label: "Stent type", value: interventions.stentTypes },
        { label: "Other intervention detail", value: interventions.other },
        { label: "Final diagnosis", value: diagnosis.diagnoses },
        { label: "Other diagnosis", value: diagnosis.diagnosisOther },
      ],
    },
    {
      title: "Comments, Conclusion and Management",
      entries: [
        { label: "Comments", value: additionalInfo.comments },
        { label: "Conclusion", value: additionalInfo.conclusion },
        { label: "Management", value: additionalInfo.management },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title: "GASTROSCOPY REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    diagram: diagram?.canvasImageData
      ? {
          title: "Gastroscopy Diagram",
          imageData: diagram.canvasImageData,
        }
      : undefined,
    signature: {
      text: additionalInfo.endoscopistName,
      dateTime: additionalInfo.dateTime,
    },
  });
};
