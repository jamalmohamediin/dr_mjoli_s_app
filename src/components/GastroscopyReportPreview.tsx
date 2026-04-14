import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

interface GastroscopyReportPreviewProps {
  report: any;
}

const hasSelection = (values: unknown, option: string) => toArray(values).includes(option);

const toCsv = (values: unknown) => toArray(values).join(", ");

const addLine = (list: string[], label: string, value: unknown) => {
  const csv = toCsv(value);
  if (csv) {
    list.push(`${label}: ${csv}`);
  }
};

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

  const oesophagusDetails: string[] = [];
  if (hasSelection(oesophagus.findings, "Barrett’s Oesophagus")) {
    const barrett = joinSelections(oesophagus.barrettType);
    const length = oesophagus.barrettLength ? `Length ${oesophagus.barrettLength} cm` : "";
    const value = [barrett, length].filter(Boolean).join(", ");
    if (value) oesophagusDetails.push(`Barrett’s Oesophagus: ${value}`);
  }
  if (hasSelection(oesophagus.findings, "Candida Oesophagitis")) addLine(oesophagusDetails, "Candida Oesophagitis", oesophagus.candidaSeverity);
  if (hasSelection(oesophagus.findings, "Oesophageal Ulcer")) addLine(oesophagusDetails, "Oesophageal Ulcer", oesophagus.ulcerAppearance);
  if (hasSelection(oesophagus.findings, "Oesophagitis")) addLine(oesophagusDetails, "Oesophagitis", oesophagus.oesophagitisGrade);
  if (hasSelection(oesophagus.findings, "Hiatus Hernia")) {
    const grades = toCsv(oesophagus.hiatusHerniaGrade);
    const length = oesophagus.hiatusHerniaLength ? `Length ${oesophagus.hiatusHerniaLength} cm` : "";
    const value = [grades, length].filter(Boolean).join(", ");
    if (value) oesophagusDetails.push(`Hiatus Hernia: ${value}`);
  }
  if (hasSelection(oesophagus.findings, "Kaposi Sarcoma")) addLine(oesophagusDetails, "Kaposi Sarcoma", oesophagus.kaposiMultiplicity);
  if (hasSelection(oesophagus.findings, "Mallory-Weiss Tear")) addLine(oesophagusDetails, "Mallory-Weiss Tear", oesophagus.malloryWeissBleeding);
  if (hasSelection(oesophagus.findings, "Oesophageal Web")) addLine(oesophagusDetails, "Oesophageal Web", oesophagus.webLocation);
  if (hasSelection(oesophagus.findings, "Stricture")) addLine(oesophagusDetails, "Stricture", oesophagus.strictureType);
  if (hasSelection(oesophagus.findings, "Malignancy")) {
    const location = toCsv(oesophagus.malignancyLocation);
    const length = oesophagus.malignancyLength ? `Length ${oesophagus.malignancyLength} cm` : "";
    const value = [location, length].filter(Boolean).join(", ");
    if (value) oesophagusDetails.push(`Malignancy: ${value}`);
  }
  if (hasSelection(oesophagus.findings, "Diverticulum")) addLine(oesophagusDetails, "Diverticulum", oesophagus.diverticulumLocation);
  if (hasSelection(oesophagus.findings, "Varices")) addLine(oesophagusDetails, "Varices", oesophagus.varicesGrade);
  if (hasSelection(oesophagus.findings, "Other") && String(oesophagus.other || "").trim()) {
    oesophagusDetails.push(`Other: ${oesophagus.other}`);
  }

  const stomachDetails: string[] = [];
  if (hasSelection(stomach.findings, "Ulcer")) {
    addLine(stomachDetails, "Ulcer", stomach.ulcerSelections);
    addLine(stomachDetails, "Forrest Classification", stomach.forrestClassification);
  }
  if (hasSelection(stomach.findings, "Mass / Tumour")) addLine(stomachDetails, "Mass / Tumour", stomach.massMorphology);
  if (hasSelection(stomach.findings, "Erosion(s)")) addLine(stomachDetails, "Erosion(s)", stomach.erosionSelections);
  if (hasSelection(stomach.findings, "Gastritis")) {
    const types = joinSelections(stomach.gastritisType, stomach.gastritisTypeOther);
    if (types) stomachDetails.push(`Gastritis Type: ${types}`);
    addLine(stomachDetails, "Gastritis Severity", stomach.gastritisSeverity);
  }
  if (hasSelection(stomach.findings, "GIST")) addLine(stomachDetails, "GIST", stomach.gistMucosa);
  if (hasSelection(stomach.findings, "Kaposi Sarcoma")) addLine(stomachDetails, "Kaposi Sarcoma", stomach.kaposiPattern);
  if (hasSelection(stomach.findings, "Gastric Antral Vascular Ectasia (GAVE)")) addLine(stomachDetails, "GAVE", stomach.gavePattern);
  if (hasSelection(stomach.findings, "Varices")) {
    addLine(stomachDetails, "Varices Number", stomach.varicesNumber);
    addLine(stomachDetails, "Varices Classification", stomach.varicesClassification);
  }
  if (hasSelection(stomach.findings, "Polyps")) {
    addLine(stomachDetails, "Polyps", stomach.polypNumber);
    addLine(stomachDetails, "Polyp Size", stomach.polypSize);
  }
  if (hasSelection(stomach.findings, "Portal Gastropathy")) {
    addLine(stomachDetails, "Portal Gastropathy Severity", stomach.portalGastropathySeverity);
    addLine(stomachDetails, "Portal Gastropathy Mucosa", stomach.portalGastropathyMucosa);
  }
  if (hasSelection(stomach.findings, "Stricture")) addLine(stomachDetails, "Stricture Overlying Mucosa", stomach.strictureMucosa);
  if (hasSelection(stomach.findings, "Other") && String(stomach.other || "").trim()) stomachDetails.push(`Other: ${stomach.other}`);

  const duodenumDetails: string[] = [];
  if (hasSelection(duodenum.findings, "Duodenitis")) {
    addLine(duodenumDetails, "Duodenitis Severity", duodenum.duodenitisSeverity);
    addLine(duodenumDetails, "Duodenitis Additional Findings", duodenum.duodenitisWithErosions);
  }
  if (hasSelection(duodenum.findings, "Ulcer")) {
    addLine(duodenumDetails, "Ulcer", duodenum.ulcerSelections);
    addLine(duodenumDetails, "Forrest Classification", duodenum.forrestClassification);
  }
  if (hasSelection(duodenum.findings, "Polyp")) {
    addLine(duodenumDetails, "Polyp", duodenum.polypNumber);
    addLine(duodenumDetails, "Polyp Size", duodenum.polypSize);
  }
  if (hasSelection(duodenum.findings, "Tumour")) addLine(duodenumDetails, "Tumour", duodenum.tumourMorphology);
  if (hasSelection(duodenum.findings, "Stricture")) addLine(duodenumDetails, "Stricture Overlying Mucosa", duodenum.strictureMucosa);
  if (hasSelection(duodenum.findings, "Other") && String(duodenum.other || "").trim()) duodenumDetails.push(`Other: ${duodenum.other}`);

  const interventionDetails: string[] = [];
  if (hasSelection(interventions.interventions, "Dilatation")) {
    addLine(interventionDetails, "Dilatation Type", interventions.dilatationTypes);
    if (String(interventions.maxDilatationMm || "").trim()) interventionDetails.push(`Max Dilatation (mm): ${interventions.maxDilatationMm}`);
  }
  if (hasSelection(interventions.interventions, "Banding") && String(interventions.bandingCount || "").trim()) interventionDetails.push(`No Of Bands Applied: ${interventions.bandingCount}`);
  if (hasSelection(interventions.interventions, "Haemoclip") && String(interventions.clipCount || "").trim()) interventionDetails.push(`No Of Clips Applied: ${interventions.clipCount}`);
  if (hasSelection(interventions.interventions, "Stent Insertion")) {
    addLine(interventionDetails, "Stent Type", interventions.stentTypes);
    if (String(interventions.stentLengthCm || "").trim()) interventionDetails.push(`Stent Length (cm): ${interventions.stentLengthCm}`);
    if (String(interventions.stentDiameterMm || "").trim()) interventionDetails.push(`Stent Diameter (mm): ${interventions.stentDiameterMm}`);
  }
  if (hasSelection(interventions.interventions, "Injection Therapy") && String(interventions.injectionAgent || "").trim()) interventionDetails.push(`Injection Agent: ${interventions.injectionAgent}`);
  if (hasSelection(interventions.interventions, "Other") && String(interventions.other || "").trim()) interventionDetails.push(`Other: ${interventions.other}`);

  const sections: StructuredTemplatePreviewSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Endoscopist", value: toArray(preoperative.endoscopists).join(", ") },
        { label: "Surgeon", value: toArray(preoperative.surgeons).join(", ") },
        { label: "Anesthetist", value: toArray(preoperative.anaesthetists).join(", "), fullWidth: true },
        { label: "Procedure Urgency", value: preoperative.procedureUrgency },
        { label: "Preoperative Imaging", value: joinSelections(preoperative.preoperativeImaging, preoperative.preoperativeImagingOther), fullWidth: true },
        { label: "Indications", value: joinSelections(preoperative.indications, preoperative.indicationOther), fullWidth: true },
        { label: "Signs & Symptoms", value: joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther), fullWidth: true },
        { label: "Extent of examination", value: preoperative.extentOfExamination, badges: true },
      ],
    },
    {
      title: "Sedation / Anaesthesia",
      entries: [
        { label: "Sedationist", value: preoperative.sedationist === "Other" ? `Other: ${preoperative.sedationistOther || ""}` : preoperative.sedationist },
        { label: "Type of sedation", value: preoperative.sedationTypes, badges: true },
        { label: "Monitoring", value: joinSelections(preoperative.monitoring, preoperative.monitoringOther), fullWidth: true },
        { label: "Level achieved", value: preoperative.sedationLevel },
        {
          label: "Medications and dose",
          value: [
            preoperative.medications?.midazolamDose ? `Midazolam ${preoperative.medications.midazolamDose} mg` : "",
            preoperative.medications?.fentanylDose ? `Fentanyl ${preoperative.medications.fentanylDose} mcg` : "",
            preoperative.medications?.propofolDose ? `Propofol ${preoperative.medications.propofolDose} mg` : "",
            preoperative.medications?.otherMedication ? `Other: ${preoperative.medications.otherMedication}` : "",
          ].filter(Boolean),
          fullWidth: true,
        },
      ],
    },
    {
      title: "Procedure Findings",
      entries: [
        { label: "Pharynx", value: pharynxLarynx.pharynxStatus === "Abnormal" ? `Abnormal: ${pharynxLarynx.pharynxAbnormality || ""}` : pharynxLarynx.pharynxStatus },
        { label: "Vocal cords", value: pharynxLarynx.vocalCordsStatus === "Abnormal" ? `Abnormal: ${pharynxLarynx.vocalCordsAbnormality || ""}` : pharynxLarynx.vocalCordsStatus },
        { label: "Oesophagus Findings", value: oesophagus.findings, badges: true },
        { label: "Oesophagus Details", value: oesophagusDetails, fullWidth: true },
        { label: "Stomach Findings", value: stomach.findings, badges: true },
        { label: "Stomach Details", value: stomachDetails, fullWidth: true },
        { label: "Duodenum Findings", value: duodenum.findings, badges: true },
        { label: "Duodenum Details", value: duodenumDetails, fullWidth: true },
      ],
    },
    {
      title: "Interventions / Therapy and Diagnosis",
      entries: [
        { label: "Interventions / Therapy", value: interventions.interventions, badges: true },
        { label: "Intervention Details", value: interventionDetails, fullWidth: true },
        { label: "Final Endoscopic Diagnosis", value: diagnosis.diagnoses, badges: true },
        { label: "Other Diagnosis", value: diagnosis.diagnosisOther, fullWidth: true },
      ],
    },
    {
      title: "Specimen, Conclusion and Follow-up",
      entries: [
        { label: "Specimen Sent for Pathology", value: additionalInfo.specimenSentForPathology },
        {
          label: "Specify Laboratory Sent To",
          value:
            additionalInfo.specimenSentForPathology === "Yes"
              ? additionalInfo.laboratorySentTo
              : "",
        },
        { label: "Other Specimens Taken", value: additionalInfo.otherSpecimensTaken === "Yes" ? `Yes - ${additionalInfo.otherSpecimensDetails || ""}` : additionalInfo.otherSpecimensTaken },
        { label: "Conclusion", value: additionalInfo.conclusion, fullWidth: true },
        { label: "Follow-up", value: joinSelections(additionalInfo.followUp, additionalInfo.followUpOther), fullWidth: true },
        { label: "Additional Notes", value: additionalInfo.additionalNotes, fullWidth: true },
        { label: "Post Operative Management", value: additionalInfo.postOperativeManagement, fullWidth: true },
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
        label: "Surgeon's Signature",
        text: additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage="Start filling out the gastroscopy form to see findings appear here."
    />
  );
};
