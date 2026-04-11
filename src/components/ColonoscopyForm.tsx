import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import { AnatomyDiagram } from "@/components/AnatomyDiagram";
import {
  CheckboxGrid,
  LabeledInput,
  LabeledTextarea,
  MultiValueTextField,
  OptionalOtherInput,
  RadioGrid,
} from "@/components/TemplateFormHelpers";
import { createInitialColonoscopyState } from "@/utils/colonoscopy";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
import { toArray } from "@/utils/templateDataHelpers";
import colonoscopyTemplateImage from "@/assets/colonoscopy-template-replacement.png";

interface ColonoscopyFormProps {
  currentReport: any;
  updateTemplate: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  isGeneratingPDF?: boolean;
}

const indicationOptions = [
  "Investigation of signs & symptom",
  "Surveillance (Cancer / IBD / Polyps)",
  "Screening (Asymptomatic)",
  "Planned intervention",
  "Assessment for reversal of stoma",
  "Other",
];
const symptomOptions = [
  "Asymptomatic",
  "Constipation",
  "Diarrhoea",
  "Change in bowel habit",
  "Anaemia",
  "Rectal bleeding",
  "Malaena",
  "Positive occult faecal blood test",
  "Loss of weight",
  "Abdominal pain",
  "abdominal distension",
  "Bloating",
  "Abdominal mass",
  "Abnormal CT scan",
  "Abnormal Ba enema",
  "Rectal mass",
  "Bowel obstruction",
  "Search for primary metastatic disease",
  "Suspected colorectal cancer",
  "Other",
];
const sedationistOptions = ["Anaesthetist / Physician", "Physician", "Endoscopist", "Nurse", "Other"];
const monitoringOptions = ["Pulse oximetry", "BP", "ECG", "Other"];
const sedationLevelOptions = ["None", "minimal", "moderate", "deep", "Anaesthesia"];
const bowelPrepOptions = [
  "Low volume split dose bowel prep",
  "Low volume previous day bowel prep",
  "High volume split dose bowel prep",
  "High volume previous day",
  "Morning only bowel prep",
  "Other",
];
const overallBowelOptions = ["Excellent", "Good", "Fair", "Poor", "Inadequate", "Poor bowel prep – procedure abandoned"];
const procedureOptions = ["Colonoscopy", "Flexible sigmoidoscopy", "Rigid sigmoidoscopy", "Proctoscopy", "Stoma colonoscopy", "Stoma ileoscopy", "Other"];
const depthOptions = ["Terminal ileum", "Caecum", "Ascending colon", "hepatic flexure", "Transverse colon", "Splenic flexure", "Descending colon", "Sigmoid colon", "Rectum"];
const caecalLandmarkOptions = ["Not reached", "Appendiceal orifice", "Ileocecal valve", "Caecal folds (Mercedes Benz sign)", "Transillumination", "Terminal ileum intubation", "Other"];
const caecumNotReachedOptions = ["Poor bowel prep", "Poor patient tolerance", "Scope looping", "Obstructing lesion", "Complications during procedure", "Difficult colonoscopy", "Other"];
const difficultyOptions = ["Easy", "Average", "Difficult"];
const findingOptions = ["Normal", "Haemorrhoids", "Inflammation", "Stricture (Benign/Malignant)", "Polyp(s)", "Diverticula", "Tumour", "AV malformation", "Radiation proctitis", "Ulcer (s)", "Other"];
const siteOptions = ["Anus", "rectum", "Sigmoid colon", "Descending colon", "Splenic flexure", "Transverse colon", "Hepatic flexure", "Ascending colon", "Caecum", "Terminal ileum", "Other"];
const diagnosisOptions = [
  "Normal",
  "Anal Fissure",
  "Anal Fistula",
  "Haemorrhoids",
  "AV malformation",
  "Crohn's disease",
  "Ulcerative Colitis",
  "Colitis nonspecific",
  "Diverticular disease",
  "Polyp single",
  "Polyps multiple",
  "Inflammatory ulcer",
  "Malignant ulcer",
  "Benign stricture",
  "Malignant stricture",
  "Anal cancer",
  "Colon cancer",
  "Rectal cancer",
  "Radiation Proctitis",
  "Other",
];
const interventionOptions = [
  "No intervention",
  "Biopsy",
  "Biopsied off",
  "polypectomy cold snare",
  "Polypectomy hot snare",
  "Tattooing",
  "Formalin painting",
  "Injection for haemostasis",
  "Clip application",
  "OVESCO Clip application",
  "Argon plasma coagulation",
  "Dilatation",
  "Stent insertion",
  "Endoscopic mucosal resection",
  "Endoscopic mucosal dissection",
  "Other",
];

export const ColonoscopyForm = ({
  currentReport,
  updateTemplate,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  isGeneratingPDF,
}: ColonoscopyFormProps) => {
  const template = currentReport.colonoscopy || createInitialColonoscopyState();
  const preoperative = template.preoperative;
  const bowelPreparation = template.bowelPreparation;
  const procedureDetails = template.procedureDetails;
  const findingsSummary = template.findingsSummary;
  const haemorrhoids = template.haemorrhoids;
  const inflammation = template.inflammation;
  const stricture = template.stricture;
  const polyps = template.polyps;
  const tumour = template.tumour;
  const diverticula = template.diverticula;
  const avMalformation = template.avMalformation;
  const radiationProctitis = template.radiationProctitis;
  const ulcer = template.ulcer;
  const interventions = template.interventions;
  const diagnosis = template.diagnosis;
  const additionalInfo = template.additionalInfo;

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    if (onBulkPatientInfoUpdate) {
      onBulkPatientInfoUpdate(updates);
      return;
    }
    Object.entries(updates).forEach(([field, value]) => updateTemplate("patientInfo", field, value));
  };

  const updateMedication = (field: string, value: string) => {
    updateTemplate("preoperative", "medications", {
      ...(preoperative.medications || {}),
      [field]: value,
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    let startTotal = startHour * 60 + startMinute;
    let endTotal = endHour * 60 + endMinute;
    if (endTotal < startTotal) endTotal += 24 * 60;
    return String(endTotal - startTotal);
  };

  const handleTimeChange = (field: string, value: string) => {
    updateTemplate("preoperative", field, value);
    if (field === "startTime" || field === "endTime") {
      const startTime = field === "startTime" ? value : preoperative.startTime || "";
      const endTime = field === "endTime" ? value : preoperative.endTime || "";
      if (startTime && endTime) {
        updateTemplate("preoperative", "duration", calculateDuration(startTime, endTime));
      }
    }
    if (field === "withdrawalStartTime" || field === "endTime") {
      const withdrawalStart = field === "withdrawalStartTime" ? value : preoperative.withdrawalStartTime || "";
      const endTime = field === "endTime" ? value : preoperative.endTime || "";
      if (withdrawalStart && endTime) {
        updateTemplate("preoperative", "withdrawalDuration", calculateDuration(withdrawalStart, endTime));
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Colonoscopy - Synoptic Report</CardTitle>
            <div className="flex flex-wrap gap-2">
              {onExportPDF ? (
                <Button variant="outline" size="sm" className="glass-button text-xs" onClick={onExportPDF} disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? "Generating..." : "Print/Export PDF"}
                </Button>
              ) : null}
              {onSavePatient ? (
                <Button variant="outline" size="sm" className="glass-button text-xs" onClick={onSavePatient}>
                  Save Patient
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientInfoFields
            patientInfo={template.patientInfo}
            onFieldChange={(field, value) => updateTemplate("patientInfo", field, value)}
            onBulkUpdate={updatePatientInfoFields}
            currentExtractedPatientInfo={currentExtractedPatientInfo}
            onCurrentPatientChange={onCurrentPatientChange}
            use24HourTimeInputs
            useDashDateInputs
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Preoperative Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultiValueTextField label="Endoscopist" values={preoperative.endoscopists || [""]} placeholder="Enter endoscopist name" onChange={(value) => updateTemplate("preoperative", "endoscopists", value)} />
          <MultiValueTextField label="Anesthetist" values={preoperative.anaesthetists || [""]} placeholder="Enter anesthetist name" onChange={(value) => updateTemplate("preoperative", "anaesthetists", value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Start Time</Label>
              <Time24HourInput value={preoperative.startTime || ""} onChange={(value) => handleTimeChange("startTime", value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Caecal Intubation Time</Label>
              <Time24HourInput value={preoperative.caecalIntubationTime || ""} onChange={(value) => handleTimeChange("caecalIntubationTime", value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Start of Withdrawal Time</Label>
              <Time24HourInput value={preoperative.withdrawalStartTime || ""} onChange={(value) => handleTimeChange("withdrawalStartTime", value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">End Time</Label>
              <Time24HourInput value={preoperative.endTime || ""} onChange={(value) => handleTimeChange("endTime", value)} />
            </div>
            <LabeledInput label="Duration of Procedure (min)" value={preoperative.duration || ""} onChange={(value) => updateTemplate("preoperative", "duration", value)} />
            <LabeledInput label="Duration of withdrawal (min)" value={preoperative.withdrawalDuration || ""} onChange={(value) => updateTemplate("preoperative", "withdrawalDuration", value)} />
          </div>
          <CheckboxGrid label="Indications for Colonoscopy" options={indicationOptions} values={preoperative.indications} onChange={(value) => updateTemplate("preoperative", "indications", value)} />
          <OptionalOtherInput enabled={toArray(preoperative.indications).includes("Other")} value={preoperative.indicationOther || ""} placeholder="Specify other indication" onChange={(value) => updateTemplate("preoperative", "indicationOther", value)} />
          <CheckboxGrid label="Signs & Symptoms" options={symptomOptions} values={preoperative.signsSymptoms} onChange={(value) => updateTemplate("preoperative", "signsSymptoms", value)} />
          <OptionalOtherInput enabled={toArray(preoperative.signsSymptoms).includes("Other")} value={preoperative.signsSymptomsOther || ""} placeholder="Specify other sign/symptom" onChange={(value) => updateTemplate("preoperative", "signsSymptomsOther", value)} />
          <RadioGrid label="Sedationist" options={sedationistOptions} value={preoperative.sedationist || ""} onChange={(value) => updateTemplate("preoperative", "sedationist", value)} />
          <OptionalOtherInput enabled={preoperative.sedationist === "Other"} value={preoperative.sedationistOther || ""} placeholder="Specify other sedationist" onChange={(value) => updateTemplate("preoperative", "sedationistOther", value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Midazolam dose (mg)" value={preoperative.medications?.midazolamDose || ""} onChange={(value) => updateMedication("midazolamDose", value)} />
            <LabeledInput label="Fentanyl dose (mcg)" value={preoperative.medications?.fentanylDose || ""} onChange={(value) => updateMedication("fentanylDose", value)} />
            <LabeledInput label="Propofol dose (mg)" value={preoperative.medications?.propofolDose || ""} onChange={(value) => updateMedication("propofolDose", value)} />
            <LabeledInput label="Other medication" value={preoperative.medications?.otherMedication || ""} onChange={(value) => updateMedication("otherMedication", value)} />
          </div>
          <CheckboxGrid label="Monitoring" options={monitoringOptions} values={preoperative.monitoring} onChange={(value) => updateTemplate("preoperative", "monitoring", value)} columns="grid-cols-2 md:grid-cols-4" />
          <OptionalOtherInput enabled={toArray(preoperative.monitoring).includes("Other")} value={preoperative.monitoringOther || ""} placeholder="Specify other monitoring" onChange={(value) => updateTemplate("preoperative", "monitoringOther", value)} />
          <RadioGrid label="Level of sedation achieved" options={sedationLevelOptions} value={preoperative.sedationLevel || ""} onChange={(value) => updateTemplate("preoperative", "sedationLevel", value)} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Bowel Preparation and Procedure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Type of Prep" options={bowelPrepOptions} values={bowelPreparation.prepType} onChange={(value) => updateTemplate("bowelPreparation", "prepType", value)} />
          <OptionalOtherInput enabled={toArray(bowelPreparation.prepType).includes("Other")} value={bowelPreparation.prepTypeOther || ""} placeholder="Specify other bowel prep" onChange={(value) => updateTemplate("bowelPreparation", "prepTypeOther", value)} />
          <RadioGrid label="Overall Assessment" options={overallBowelOptions} value={bowelPreparation.overallAssessment || ""} onChange={(value) => updateTemplate("bowelPreparation", "overallAssessment", value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <LabeledInput label="Right colon BBPS" value={bowelPreparation.bbpsRightColon || ""} onChange={(value) => updateTemplate("bowelPreparation", "bbpsRightColon", value)} placeholder="0-3" />
            <LabeledInput label="Transverse colon BBPS" value={bowelPreparation.bbpsTransverseColon || ""} onChange={(value) => updateTemplate("bowelPreparation", "bbpsTransverseColon", value)} placeholder="0-3" />
            <LabeledInput label="Left colon BBPS" value={bowelPreparation.bbpsLeftColon || ""} onChange={(value) => updateTemplate("bowelPreparation", "bbpsLeftColon", value)} placeholder="0-3" />
            <LabeledInput label="Total BBPS / 9" value={bowelPreparation.totalBbps || ""} onChange={(value) => updateTemplate("bowelPreparation", "totalBbps", value)} />
          </div>
          <CheckboxGrid label="Procedure" options={procedureOptions} values={procedureDetails.procedures} onChange={(value) => updateTemplate("procedureDetails", "procedures", value)} />
          <OptionalOtherInput enabled={toArray(procedureDetails.procedures).includes("Other")} value={procedureDetails.procedureOther || ""} placeholder="Specify other procedure" onChange={(value) => updateTemplate("procedureDetails", "procedureOther", value)} />
          <CheckboxGrid label="Depth of Examination" options={depthOptions} values={procedureDetails.depthOfExamination} onChange={(value) => updateTemplate("procedureDetails", "depthOfExamination", value)} />
          <CheckboxGrid label="Caecal intubation landmarks identified" options={caecalLandmarkOptions} values={procedureDetails.caecalLandmarks} onChange={(value) => updateTemplate("procedureDetails", "caecalLandmarks", value)} />
          <OptionalOtherInput enabled={toArray(procedureDetails.caecalLandmarks).includes("Other")} value={procedureDetails.caecalLandmarksOther || ""} placeholder="Specify other landmark" onChange={(value) => updateTemplate("procedureDetails", "caecalLandmarksOther", value)} />
          <CheckboxGrid label="Reason for not reaching Caecum" options={caecumNotReachedOptions} values={procedureDetails.reasonsCaecumNotReached} onChange={(value) => updateTemplate("procedureDetails", "reasonsCaecumNotReached", value)} />
          <OptionalOtherInput enabled={toArray(procedureDetails.reasonsCaecumNotReached).includes("Other")} value={procedureDetails.reasonsCaecumNotReachedOther || ""} placeholder="Specify other reason" onChange={(value) => updateTemplate("procedureDetails", "reasonsCaecumNotReachedOther", value)} />
          <RadioGrid label="Difficulty" options={difficultyOptions} value={procedureDetails.difficulty || ""} onChange={(value) => updateTemplate("procedureDetails", "difficulty", value)} columns="grid-cols-3" />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CheckboxGrid label="Findings" options={findingOptions} values={findingsSummary.findings} onChange={(value) => updateTemplate("findingsSummary", "findings", value)} />
          <OptionalOtherInput enabled={toArray(findingsSummary.findings).includes("Other")} value={findingsSummary.findingOther || ""} placeholder="Specify other finding" onChange={(value) => updateTemplate("findingsSummary", "findingOther", value)} />
          <CheckboxGrid label="Site(s) of abnormality" options={siteOptions} values={findingsSummary.sitesOfAbnormality} onChange={(value) => updateTemplate("findingsSummary", "sitesOfAbnormality", value)} />
          <OptionalOtherInput enabled={toArray(findingsSummary.sitesOfAbnormality).includes("Other")} value={findingsSummary.siteOther || ""} placeholder="Specify other site" onChange={(value) => updateTemplate("findingsSummary", "siteOther", value)} />
          <LabeledTextarea label="Description of findings" value={findingsSummary.descriptionOfFindings || ""} onChange={(value) => updateTemplate("findingsSummary", "descriptionOfFindings", value)} rows={4} />

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Haemorrhoids</h3>
            <LabeledInput label="Haemorrhoid Grade" value={haemorrhoids.grade || ""} onChange={(value) => updateTemplate("haemorrhoids", "grade", value)} placeholder="Grade I-IV / Internal and external" />
            <LabeledInput label="Bleeding Status" value={haemorrhoids.bleedingStatus || ""} onChange={(value) => updateTemplate("haemorrhoids", "bleedingStatus", value)} placeholder="No bleeding / Active bleeding / etc." />
            <LabeledInput label="Internal and external haemorrhoids" value={haemorrhoids.internalExternal || ""} onChange={(value) => updateTemplate("haemorrhoids", "internalExternal", value)} placeholder="Optional note" />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Inflammation</h3>
            <CheckboxGrid label="Description of inflammation" options={["Pancolitis", "Segmental", "Patchy (skip lesions)", "Continuous", "Presence of pseudopolyps", "Cobblestoning", "Presence of exudate / slough", "Strictures", "peri-appendiceal patch", "Backwash ileitis", "Other"]} values={inflammation.description} onChange={(value) => updateTemplate("inflammation", "description", value)} />
            <OptionalOtherInput enabled={toArray(inflammation.description).includes("Other")} value={inflammation.descriptionOther || ""} placeholder="Specify other inflammation description" onChange={(value) => updateTemplate("inflammation", "descriptionOther", value)} />
            <LabeledInput label="Severity of Inflammation" value={inflammation.severity || ""} onChange={(value) => updateTemplate("inflammation", "severity", value)} placeholder="Mild / Moderate / Severe" />
            <LabeledInput label="Presence of ulcers" value={inflammation.ulcerBurden || ""} onChange={(value) => updateTemplate("inflammation", "ulcerBurden", value)} placeholder="None / <10% / 10–30% / >30%" />
            <CheckboxGrid label="Ulcer features" options={["Superficial ulcers", "Deep ulcers", "Linear ulcers", "Aphthous ulcers", "Serpiginous ulcers", "Confluent ulceration", "Other"]} values={inflammation.ulcerFeatures} onChange={(value) => updateTemplate("inflammation", "ulcerFeatures", value)} />
            <OptionalOtherInput enabled={toArray(inflammation.ulcerFeatures).includes("Other")} value={inflammation.ulcerFeaturesOther || ""} placeholder="Specify other ulcer feature" onChange={(value) => updateTemplate("inflammation", "ulcerFeaturesOther", value)} />
            <CheckboxGrid label="Endoscopic impression" options={["Features suggestive of Ulcerative Colitis", "Features suggestive of Crohn's Disease", "Features suggestive of Infectious Colitis", "Features suggestive of Ischemic Colitis", "Nonspecific colitis", "Nonspecific colon ulcer", "Other"]} values={inflammation.endoscopicImpression} onChange={(value) => updateTemplate("inflammation", "endoscopicImpression", value)} />
            <OptionalOtherInput enabled={toArray(inflammation.endoscopicImpression).includes("Other")} value={inflammation.impressionOther || ""} placeholder="Specify other inflammation impression" onChange={(value) => updateTemplate("inflammation", "impressionOther", value)} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Stricture / Polyps / Tumour</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput label="Number of strictures" value={stricture.number || ""} onChange={(value) => updateTemplate("stricture", "number", value)} />
              <LabeledInput label="Multiple strictures count" value={stricture.multipleNumber || ""} onChange={(value) => updateTemplate("stricture", "multipleNumber", value)} />
              <LabeledInput label="Length of stricture" value={stricture.length || ""} onChange={(value) => updateTemplate("stricture", "length", value)} placeholder="<1 cm / 1-3 cm / etc." />
              <LabeledInput label="Severity of narrowing" value={stricture.severityOfNarrowing || ""} onChange={(value) => updateTemplate("stricture", "severityOfNarrowing", value)} placeholder="Mild / Moderate / Severe" />
              <LabeledInput label="Traversability" value={stricture.traversability || ""} onChange={(value) => updateTemplate("stricture", "traversability", value)} placeholder="Easily traversed / etc." />
              <LabeledInput label="Stricture impression" value={stricture.impressionOther || ""} onChange={(value) => updateTemplate("stricture", "impressionOther", value)} placeholder="Extra notes" />
              <LabeledInput label="Polyp number" value={polyps.number || ""} onChange={(value) => updateTemplate("polyps", "number", value)} />
              <LabeledInput label="Polyp size" value={polyps.size || ""} onChange={(value) => updateTemplate("polyps", "size", value)} />
              <LabeledInput label="Largest polyp diameter length (mm)" value={polyps.largestDiameterLength || ""} onChange={(value) => updateTemplate("polyps", "largestDiameterLength", value)} />
              <LabeledInput label="Largest polyp diameter width (mm)" value={polyps.largestDiameterWidth || ""} onChange={(value) => updateTemplate("polyps", "largestDiameterWidth", value)} />
              <LabeledInput label="Tumour length (cm)" value={tumour.length || ""} onChange={(value) => updateTemplate("tumour", "length", value)} />
              <LabeledInput label="Circumferential involvement" value={tumour.circumferentialInvolvement || ""} onChange={(value) => updateTemplate("tumour", "circumferentialInvolvement", value)} />
            </div>
            <CheckboxGrid label="Stricture morphology" options={["Normal mucosa", "Smooth / regular", "Erythema", "Irregular / nodular", "Shouldered edges", "Concentric narrowing", "Eccentric narrowing", "Ulcerated", "Mass lesion suspected", "Other"]} values={stricture.morphology} onChange={(value) => updateTemplate("stricture", "morphology", value)} />
            <OptionalOtherInput enabled={toArray(stricture.morphology).includes("Other")} value={stricture.morphologyOther || ""} placeholder="Specify other morphology" onChange={(value) => updateTemplate("stricture", "morphologyOther", value)} />
            <CheckboxGrid label="Stricture endoscopic impression" options={["Suspicious for malignancy", "Benign stricture", "Inflammatory stricture (e.g. Crohn's Disease)", "Post-inflammatory / fibrosis", "Ischemic stricture (Ischemic Colitis)", "Post-surgical / anastomotic stricture", "Radiation-induced", "Indeterminate"]} values={stricture.endoscopicImpression} onChange={(value) => updateTemplate("stricture", "endoscopicImpression", value)} />
            <CheckboxGrid label="Polyp morphology" options={["Pedunculated", "Sessile", "Slightly elevated", "Flat", "Depressed", "Excavated", "Pseudopolyps", "other"]} values={polyps.morphology} onChange={(value) => updateTemplate("polyps", "morphology", value)} />
            <OptionalOtherInput enabled={toArray(polyps.morphology).includes("other")} value={polyps.morphologyOther || ""} placeholder="Specify other polyp morphology" onChange={(value) => updateTemplate("polyps", "morphologyOther", value)} />
            <CheckboxGrid label="Tumour lumen narrowing" options={["No narrowing", "Partial obstruction", "Significant narrowing", "Complete obstruction", "Easily traversed", "Traversed with difficulty", "Not traversable"]} values={tumour.lumenNarrowing} onChange={(value) => updateTemplate("tumour", "lumenNarrowing", value)} />
            <CheckboxGrid label="Tumour endoscopic Impression" options={["Highly suspicious for malignancy", "Likely malignant tumour", "Early cancer (superficial)", "Benign tumour (e.g. lipoma)", "Indeterminate"]} values={tumour.endoscopicImpression} onChange={(value) => updateTemplate("tumour", "endoscopicImpression", value)} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Diverticula / AV Malformation / Radiation Proctitis / Ulcer</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput label="Diverticula number" value={diverticula.number || ""} onChange={(value) => updateTemplate("diverticula", "number", value)} />
              <LabeledInput label="Diverticula size" value={diverticula.size || ""} onChange={(value) => updateTemplate("diverticula", "size", value)} />
              <LabeledInput label="Diverticula distribution pattern" value={diverticula.distributionPattern || ""} onChange={(value) => updateTemplate("diverticula", "distributionPattern", value)} />
              <LabeledInput label="AV malformation number" value={avMalformation.number || ""} onChange={(value) => updateTemplate("avMalformation", "number", value)} />
              <LabeledInput label="AV malformation size" value={avMalformation.size || ""} onChange={(value) => updateTemplate("avMalformation", "size", value)} />
              <LabeledInput label="AV malformation bleeding status" value={avMalformation.bleedingStatus || ""} onChange={(value) => updateTemplate("avMalformation", "bleedingStatus", value)} />
              <LabeledInput label="AV malformation distribution" value={avMalformation.distributionPattern || ""} onChange={(value) => updateTemplate("avMalformation", "distributionPattern", value)} />
              <LabeledInput label="AV malformation burden" value={avMalformation.burden || ""} onChange={(value) => updateTemplate("avMalformation", "burden", value)} />
              <LabeledInput label="Risk of bleeding" value={avMalformation.bleedingRisk || ""} onChange={(value) => updateTemplate("avMalformation", "bleedingRisk", value)} />
              <LabeledInput label="Extent from anal verge (cm)" value={radiationProctitis.extentFromAnalVerge || ""} onChange={(value) => updateTemplate("radiationProctitis", "extentFromAnalVerge", value)} />
              <LabeledInput label="Radiation proctitis severity" value={radiationProctitis.severity || ""} onChange={(value) => updateTemplate("radiationProctitis", "severity", value)} />
              <LabeledInput label="Ulcer number" value={ulcer.number || ""} onChange={(value) => updateTemplate("ulcer", "number", value)} />
              <LabeledInput label="Approximate ulcer count if multiple" value={ulcer.approximateNumberIfMultiple || ""} onChange={(value) => updateTemplate("ulcer", "approximateNumberIfMultiple", value)} />
              <LabeledInput label="Ulcer distribution" value={ulcer.distribution || ""} onChange={(value) => updateTemplate("ulcer", "distribution", value)} />
            </div>
            <CheckboxGrid label="Diverticula morphology" options={["Normal mucosa", "Simple", "Containing fecolith", "Erythematous", "Inflamed", "Ulcerated", "Associated colitis", "other"]} values={diverticula.morphology} onChange={(value) => updateTemplate("diverticula", "morphology", value)} />
            <OptionalOtherInput enabled={toArray(diverticula.morphology).includes("other")} value={diverticula.morphologyOther || ""} placeholder="Specify other diverticula morphology" onChange={(value) => updateTemplate("diverticula", "morphologyOther", value)} />
            <CheckboxGrid label="AV malformation morphology" options={["Flat", "Raised", "Clustered", "Solitary"]} values={avMalformation.morphology} onChange={(value) => updateTemplate("avMalformation", "morphology", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="AV malformation color appearance" options={["Reddish", "Purple", "Tortuous vessels", "Erythematous patch"]} values={avMalformation.colorAppearance} onChange={(value) => updateTemplate("avMalformation", "colorAppearance", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Radiation proctitis distribution" options={["Rectum only", "Rectosigmoid involvement", "Segmental", "Diffuse", "Patchy", "Circumferential"]} values={radiationProctitis.distribution} onChange={(value) => updateTemplate("radiationProctitis", "distribution", value)} />
            <CheckboxGrid label="Radiation proctitis mucosal findings" options={["Erythema", "Telangiectasia", "Edema", "Friable / contact bleeding", "Spontaneous bleeding", "Pallor / atrophy", "Necrosis", "Stricture", "Fistula", "Ulceration", "Ectatic vessels", "Angiodysplasia-like lesions", "Other"]} values={radiationProctitis.mucosalFindings} onChange={(value) => updateTemplate("radiationProctitis", "mucosalFindings", value)} />
            <OptionalOtherInput enabled={toArray(radiationProctitis.mucosalFindings).includes("Other")} value={radiationProctitis.mucosalFindingsOther || ""} placeholder="Specify other mucosal finding" onChange={(value) => updateTemplate("radiationProctitis", "mucosalFindingsOther", value)} />
            <CheckboxGrid label="Ulcer shape" options={["Round", "Oval", "Linear", "Irregular", "Serpiginous"]} values={ulcer.shape} onChange={(value) => updateTemplate("ulcer", "shape", value)} columns="grid-cols-2 md:grid-cols-5" />
            <CheckboxGrid label="Ulcer depth" options={["Superficial", "Deep", "Excavated"]} values={ulcer.depth} onChange={(value) => updateTemplate("ulcer", "depth", value)} columns="grid-cols-3" />
            <CheckboxGrid label="Ulcer edges" options={["Regular", "Irregular", "Undermined", "Raised"]} values={ulcer.edges} onChange={(value) => updateTemplate("ulcer", "edges", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Ulcer base" options={["Clean", "Fibrinous", "Necrotic", "Granular"]} values={ulcer.base} onChange={(value) => updateTemplate("ulcer", "base", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Ulcer orientation" options={["Longitudinal", "Circumferential", "Along folds"]} values={ulcer.orientation} onChange={(value) => updateTemplate("ulcer", "orientation", value)} columns="grid-cols-3" />
            <CheckboxGrid label="Bleeding Stigmata" options={["None", "Contact bleeding", "Active bleeding", "Visible vessel", "Adherent clot"]} values={ulcer.bleedingStigmata} onChange={(value) => updateTemplate("ulcer", "bleedingStigmata", value)} />
            <CheckboxGrid label="Surrounding mucosa" options={["Normal", "Erythematous", "Oedematous", "Friable", "Nodular", "Inflamed", "Other"]} values={ulcer.surroundingMucosa} onChange={(value) => updateTemplate("ulcer", "surroundingMucosa", value)} />
            <OptionalOtherInput enabled={toArray(ulcer.surroundingMucosa).includes("Other")} value={ulcer.surroundingMucosaOther || ""} placeholder="Specify other surrounding mucosa" onChange={(value) => updateTemplate("ulcer", "surroundingMucosaOther", value)} />
            <CheckboxGrid label="Associated Findings" options={["Inflammation", "Stricture", "Mass lesion", "Fistula opening", "Perianal disease", "Diverticulosis nearby", "Other"]} values={ulcer.associatedFindings} onChange={(value) => updateTemplate("ulcer", "associatedFindings", value)} />
            <OptionalOtherInput enabled={toArray(ulcer.associatedFindings).includes("Other")} value={ulcer.associatedFindingsOther || ""} placeholder="Specify other associated finding" onChange={(value) => updateTemplate("ulcer", "associatedFindingsOther", value)} />
            <CheckboxGrid label="Suspected Etiology (Endoscopic)" options={["Inflammatory bowel disease", "Infective", "Ischaemic colitis", "Drug-induced (e.g. NSAIDs)", "Malignancy-related", "Radiation colitis", "Indeterminate", "Other"]} values={ulcer.suspectedEtiology} onChange={(value) => updateTemplate("ulcer", "suspectedEtiology", value)} />
            <CheckboxGrid label="IBD Type" options={["Crohn’s disease", "Ulcerative colitis"]} values={ulcer.ibdType} onChange={(value) => updateTemplate("ulcer", "ibdType", value)} columns="grid-cols-2" />
            <CheckboxGrid label="Infective etiology" options={["Cytomegalovirus colitis", "Tuberculosis", "Other"]} values={ulcer.infectiveEtiology} onChange={(value) => updateTemplate("ulcer", "infectiveEtiology", value)} columns="grid-cols-3" />
            <OptionalOtherInput enabled={toArray(ulcer.infectiveEtiology).includes("Other") || toArray(ulcer.suspectedEtiology).includes("Other")} value={ulcer.etiologyOther || ""} placeholder="Specify other etiology" onChange={(value) => updateTemplate("ulcer", "etiologyOther", value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Colonoscopy Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <AnatomyDiagram
            type="colonoscopy"
            customImage={colonoscopyTemplateImage}
            onUpdate={(data) => {
              updateTemplate("diagram", "findings", data.findings || []);
              if (data.canvasImageData !== undefined) {
                updateTemplate("diagram", "canvasImageData", data.canvasImageData || "");
              }
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Interventions and Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Interventions Performed" options={interventionOptions} values={interventions.interventions} onChange={(value) => updateTemplate("interventions", "interventions", value)} />
          <OptionalOtherInput enabled={toArray(interventions.interventions).includes("Other")} value={interventions.other || ""} placeholder="Specify other intervention" onChange={(value) => updateTemplate("interventions", "other", value)} />
          <CheckboxGrid label="Colonoscopy Diagnosis" options={diagnosisOptions} values={diagnosis.diagnoses} onChange={(value) => updateTemplate("diagnosis", "diagnoses", value)} />
          <OptionalOtherInput enabled={toArray(diagnosis.diagnoses).includes("Other")} value={diagnosis.diagnosisOther || ""} placeholder="Specify other diagnosis" onChange={(value) => updateTemplate("diagnosis", "diagnosisOther", value)} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Additional Notes, Conclusion and Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea label="Additional Notes" value={additionalInfo.additionalNotes || ""} onChange={(value) => updateTemplate("additionalInfo", "additionalNotes", value)} />
          <LabeledTextarea label="Conclusion" value={additionalInfo.conclusion || ""} onChange={(value) => updateTemplate("additionalInfo", "conclusion", value)} />
          <LabeledTextarea label="Management" value={additionalInfo.management || ""} onChange={(value) => updateTemplate("additionalInfo", "management", value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Endoscopist Name" value={additionalInfo.endoscopistName || ""} onChange={(value) => updateTemplate("additionalInfo", "endoscopistName", value)} placeholder="Enter endoscopist name" />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <DateTimeDDMMYYYY24HourInput value={additionalInfo.dateTime || ""} onChange={(value) => updateTemplate("additionalInfo", "dateTime", value)} />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => updateTemplate("additionalInfo", "dateTime", getLocalDateTimeValue())}>
            Use Current Date/Time
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
