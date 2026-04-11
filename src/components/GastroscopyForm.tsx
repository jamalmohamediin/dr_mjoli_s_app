import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput } from "@/components/Time24HourInput";
import { AnatomyDiagram } from "@/components/AnatomyDiagram";
import {
  CheckboxGrid,
  LabeledInput,
  LabeledTextarea,
  MultiValueTextField,
  OptionalOtherInput,
  RadioGrid,
} from "@/components/TemplateFormHelpers";
import { createInitialGastroscopyState } from "@/utils/gastroscopy";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
import { toArray } from "@/utils/templateDataHelpers";
import gastroscopyTemplateImage from "@/assets/gastroscopy-template-replacement.png";

interface GastroscopyFormProps {
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
  "Surveillance (Barrett’s / Varices / Malignancy)",
  "Planned intervention",
  "Pre-operative planning",
  "Other",
];
const symptomOptions = [
  "Epigastric pain",
  "Haematemesis",
  "Coffee ground vomitus",
  "Dysphagia",
  "Heartburn",
  "Persistent Vomiting",
  "Regurgitation",
  "Odynophagia",
  "Dyspepsia",
  "Corrosive ingestion",
  "Weight loss",
  "PR bleeding",
  "Maelena stools",
  "Anaemia",
  "Unexplained coughing",
  "Atypical chest pains",
  "Other",
];
const extentOptions = ["Oesophagus", "Stomach", "D1", "D2"];
const sedationistOptions = ["Anaesthetist / Physician", "Physician", "Endoscopist", "Nurse", "Other"];
const sedationTypeOptions = ["None", "Topical", "Conscious sedation", "GA"];
const monitoringOptions = ["Pulse oximetry", "BP", "ECG", "Other"];
const sedationLevelOptions = ["None", "minimal", "moderate", "deep", "Anaesthesia"];
const oesophagusFindingOptions = [
  "Normal",
  "Barrett’s oesophagus",
  "Candida oesophagitis",
  "Oesophageal ulcer",
  "Oesophagitis",
  "Hiatus hernia",
  "Kaposi sarcoma",
  "Mallory-Weiss tear",
  "Oesophageal web",
  "Stricture",
  "Malignancy",
  "Diverticulum",
  "Varices",
  "Other",
];
const stomachFindingOptions = [
  "Normal",
  "Ulcer",
  "Mass / Tumour",
  "Erosion(s)",
  "Gastritis",
  "GIST",
  "Kaposi Sarcoma",
  "Gastric antral vascular ectasia (GAVE)",
  "Varices",
  "Polyps",
  "Portal gastropathy",
  "Stricture",
  "Malignant",
  "Other",
];
const duodenumFindingOptions = [
  "Normal",
  "Duodenitis",
  "Ulcer",
  "Polyp",
  "Tumour",
  "Stricture",
  "Other",
];
const forrestOptions = [
  "Ia (spurting)",
  "Ib (oozing)",
  "IIa (visible vessel)",
  "IIb (adherent clot)",
  "IIc (haematin)",
  "III (clean base)",
];
const interventionOptions = [
  "None",
  "Biopsy",
  "H. pylori test",
  "Polypectomy",
  "Dilatation",
  "Banding",
  "Adrenaline injection",
  "Haemoclip",
  "Heater probe",
  "Argon plasma coagulation",
  "Stent insertion",
  "Injection therapy",
  "Tatoo",
  "Other",
];
const dilatationOptions = ["bougie dilatation", "balloon dilatation", "Achalasia balloon dilatation"];
const diagnosisOptions = [
  "Normal",
  "Candidiasis of the oesophagus",
  "Reflux oesophagitis",
  "Oesophagitis nonspecific",
  "Hiatus hernia",
  "Barrett’s oesophagus",
  "Oesophageal varices",
  "Oesophageal cancer",
  "Mallory-Weiss tear",
  "Benign oesophageal stricture",
  "Acute gastritis",
  "Chronic gastritis",
  "Gastric varices (K31.9)",
  "Gastric ulcer",
  "Gastric polyp",
  "Gastric cancer",
  "Duodenitis",
  "Duodenal ulcer",
  "Duodenal cancer",
  "GIST",
  "Kaposi",
  "Other",
];

export const GastroscopyForm = ({
  currentReport,
  updateTemplate,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  isGeneratingPDF,
}: GastroscopyFormProps) => {
  const template = currentReport.gastroscopy || createInitialGastroscopyState();
  const preoperative = template.preoperative;
  const pharynxLarynx = template.pharynxLarynx;
  const oesophagus = template.oesophagus;
  const stomach = template.stomach;
  const duodenum = template.duodenum;
  const interventions = template.interventions;
  const diagnosis = template.diagnosis;
  const additionalInfo = template.additionalInfo;
  const diagram = template.diagram;

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

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Gastroscopy - Synoptic Report</CardTitle>
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
          <MultiValueTextField label="Surgeon Name" values={preoperative.surgeons || [""]} placeholder="Enter surgeon name" onChange={(value) => updateTemplate("preoperative", "surgeons", value)} />
          <MultiValueTextField label="Anesthetist" values={preoperative.anaesthetists || [""]} placeholder="Enter anesthetist name" onChange={(value) => updateTemplate("preoperative", "anaesthetists", value)} />
          <CheckboxGrid label="Indications for Gastroscopy" options={indicationOptions} values={preoperative.indications} onChange={(value) => updateTemplate("preoperative", "indications", value)} />
          <OptionalOtherInput enabled={toArray(preoperative.indications).includes("Other")} value={preoperative.indicationOther || ""} placeholder="Specify other indication" onChange={(value) => updateTemplate("preoperative", "indicationOther", value)} />
          <CheckboxGrid label="Signs & symptoms" options={symptomOptions} values={preoperative.signsSymptoms} onChange={(value) => updateTemplate("preoperative", "signsSymptoms", value)} />
          <OptionalOtherInput enabled={toArray(preoperative.signsSymptoms).includes("Other")} value={preoperative.signsSymptomsOther || ""} placeholder="Specify other sign/symptom" onChange={(value) => updateTemplate("preoperative", "signsSymptomsOther", value)} />
          <CheckboxGrid label="Extent of examination" options={extentOptions} values={preoperative.extentOfExamination} onChange={(value) => updateTemplate("preoperative", "extentOfExamination", value)} columns="grid-cols-2 md:grid-cols-4" />
          <RadioGrid label="Sedationist" options={sedationistOptions} value={preoperative.sedationist || ""} onChange={(value) => updateTemplate("preoperative", "sedationist", value)} />
          <OptionalOtherInput enabled={preoperative.sedationist === "Other"} value={preoperative.sedationistOther || ""} placeholder="Specify other sedationist" onChange={(value) => updateTemplate("preoperative", "sedationistOther", value)} />
          <CheckboxGrid label="Type of sedation" options={sedationTypeOptions} values={preoperative.sedationTypes} onChange={(value) => updateTemplate("preoperative", "sedationTypes", value)} columns="grid-cols-2 md:grid-cols-4" />
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
          <CardTitle className="text-base font-semibold text-gray-800">Procedure Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Pharynx / Larynx</h3>
            <RadioGrid label="Pharynx" options={["Normal", "Abnormal"]} value={pharynxLarynx.pharynxStatus || ""} onChange={(value) => updateTemplate("pharynxLarynx", "pharynxStatus", value)} columns="grid-cols-2" />
            <OptionalOtherInput enabled={pharynxLarynx.pharynxStatus === "Abnormal"} value={pharynxLarynx.pharynxAbnormality || ""} placeholder="Specify pharynx abnormality" onChange={(value) => updateTemplate("pharynxLarynx", "pharynxAbnormality", value)} />
            <RadioGrid label="Vocal cords" options={["Normal", "Abnormal"]} value={pharynxLarynx.vocalCordsStatus || ""} onChange={(value) => updateTemplate("pharynxLarynx", "vocalCordsStatus", value)} columns="grid-cols-2" />
            <OptionalOtherInput enabled={pharynxLarynx.vocalCordsStatus === "Abnormal"} value={pharynxLarynx.vocalCordsAbnormality || ""} placeholder="Specify vocal cord abnormality" onChange={(value) => updateTemplate("pharynxLarynx", "vocalCordsAbnormality", value)} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Oesophagus</h3>
            <CheckboxGrid label="Oesophagus findings" options={oesophagusFindingOptions} values={oesophagus.findings} onChange={(value) => updateTemplate("oesophagus", "findings", value)} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput label="Barrett's type" value={oesophagus.barrettType || ""} onChange={(value) => updateTemplate("oesophagus", "barrettType", value)} placeholder="suspected / confirmed" />
              <LabeledInput label="Barrett's length (cm)" value={oesophagus.barrettLength || ""} onChange={(value) => updateTemplate("oesophagus", "barrettLength", value)} />
              <LabeledInput label="Candida severity" value={oesophagus.candidaSeverity || ""} onChange={(value) => updateTemplate("oesophagus", "candidaSeverity", value)} placeholder="Mild / Moderate / Severe" />
              <LabeledInput label="Ulcer appearance" value={oesophagus.ulcerAppearance || ""} onChange={(value) => updateTemplate("oesophagus", "ulcerAppearance", value)} placeholder="Benign / Malignant" />
              <LabeledInput label="Oesophagitis grade" value={oesophagus.oesophagitisGrade || ""} onChange={(value) => updateTemplate("oesophagus", "oesophagitisGrade", value)} placeholder="Grade A-D" />
              <LabeledInput label="Hiatus hernia grade" value={oesophagus.hiatusHerniaGrade || ""} onChange={(value) => updateTemplate("oesophagus", "hiatusHerniaGrade", value)} placeholder="Grade I-IV" />
              <LabeledInput label="Hiatus hernia length (cm)" value={oesophagus.hiatusHerniaLength || ""} onChange={(value) => updateTemplate("oesophagus", "hiatusHerniaLength", value)} />
              <LabeledInput label="Kaposi multiplicity" value={oesophagus.kaposiMultiplicity || ""} onChange={(value) => updateTemplate("oesophagus", "kaposiMultiplicity", value)} placeholder="Single / Multiple" />
              <LabeledInput label="Mallory-Weiss tear" value={oesophagus.malloryWeissBleeding || ""} onChange={(value) => updateTemplate("oesophagus", "malloryWeissBleeding", value)} placeholder="Actively bleeding / Not bleeding" />
              <LabeledInput label="Stricture type" value={oesophagus.strictureType || ""} onChange={(value) => updateTemplate("oesophagus", "strictureType", value)} placeholder="Benign / Malignant" />
              <LabeledInput label="Malignancy length (cm)" value={oesophagus.malignancyLength || ""} onChange={(value) => updateTemplate("oesophagus", "malignancyLength", value)} />
              <LabeledInput label="Varices grade" value={oesophagus.varicesGrade || ""} onChange={(value) => updateTemplate("oesophagus", "varicesGrade", value)} />
            </div>
            <CheckboxGrid label="Web location" options={["Proximal esophagus", "Mid esophagus", "Distal esophagus"]} values={oesophagus.webLocation} onChange={(value) => updateTemplate("oesophagus", "webLocation", value)} columns="grid-cols-3" />
            <CheckboxGrid label="Malignancy location" options={["Proximal esophagus", "Mid esophagus", "Distal esophagus"]} values={oesophagus.malignancyLocation} onChange={(value) => updateTemplate("oesophagus", "malignancyLocation", value)} columns="grid-cols-3" />
            <CheckboxGrid label="Diverticulum location" options={["Proximal esophagus", "Mid esophagus", "Distal esophagus"]} values={oesophagus.diverticulumLocation} onChange={(value) => updateTemplate("oesophagus", "diverticulumLocation", value)} columns="grid-cols-3" />
            <LabeledTextarea label="Other oesophagus details" value={oesophagus.other || ""} onChange={(value) => updateTemplate("oesophagus", "other", value)} rows={3} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Stomach</h3>
            <CheckboxGrid label="Stomach findings" options={stomachFindingOptions} values={stomach.findings} onChange={(value) => updateTemplate("stomach", "findings", value)} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput label="Ulcer count" value={stomach.ulcerCount || ""} onChange={(value) => updateTemplate("stomach", "ulcerCount", value)} placeholder="Single / Multiple" />
              <LabeledInput label="Ulcer features" value={stomach.ulcerFeatures || ""} onChange={(value) => updateTemplate("stomach", "ulcerFeatures", value)} placeholder="Malignant / No malignant features" />
              <LabeledInput label="Erosion count" value={stomach.erosionCount || ""} onChange={(value) => updateTemplate("stomach", "erosionCount", value)} placeholder="Single / Multiple" />
              <LabeledInput label="Erosion associated with gastritis" value={stomach.erosionAssociatedWithGastritis || ""} onChange={(value) => updateTemplate("stomach", "erosionAssociatedWithGastritis", value)} placeholder="Yes / No" />
              <LabeledInput label="Gastritis severity" value={stomach.gastritisSeverity || ""} onChange={(value) => updateTemplate("stomach", "gastritisSeverity", value)} placeholder="Mild / Moderate / Severe" />
              <LabeledInput label="GIST overlying mucosa" value={stomach.gistMucosa || ""} onChange={(value) => updateTemplate("stomach", "gistMucosa", value)} placeholder="Normal / Ulcerated" />
              <LabeledInput label="Varices number" value={stomach.varicesNumber || ""} onChange={(value) => updateTemplate("stomach", "varicesNumber", value)} placeholder="Single / Multiple / Diffuse" />
              <LabeledInput label="Polyp number" value={stomach.polypNumber || ""} onChange={(value) => updateTemplate("stomach", "polypNumber", value)} placeholder="Single / Multiple / Diffuse" />
              <LabeledInput label="Portal gastropathy severity" value={stomach.portalGastropathySeverity || ""} onChange={(value) => updateTemplate("stomach", "portalGastropathySeverity", value)} placeholder="Mild / Moderate / Severe" />
            </div>
            <CheckboxGrid label="Forrest classification" options={forrestOptions} values={stomach.forrestClassification} onChange={(value) => updateTemplate("stomach", "forrestClassification", value)} />
            <CheckboxGrid label="Mass / Tumour morphology" options={["Polypoid", "ulcerating", "fungating", "Infiltrating"]} values={stomach.massMorphology} onChange={(value) => updateTemplate("stomach", "massMorphology", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Gastritis type" options={["Erosive gastritis", "Atrophic gastritis", "Haemorrhagic gastritis", "Nodular gastritis", "Bile reflux gastritis", "Other"]} values={stomach.gastritisType} onChange={(value) => updateTemplate("stomach", "gastritisType", value)} />
            <CheckboxGrid label="Kaposi pattern" options={["Single", "Multiple", "Diffuse"]} values={stomach.kaposiPattern} onChange={(value) => updateTemplate("stomach", "kaposiPattern", value)} columns="grid-cols-3" />
            <CheckboxGrid label="GAVE pattern" options={["Focal", "Patchy", "Diffuse"]} values={stomach.gavePattern} onChange={(value) => updateTemplate("stomach", "gavePattern", value)} columns="grid-cols-3" />
            <CheckboxGrid label="Varices classification" options={["Continuous with oesophageal varices", "Isolated gastric varices"]} values={stomach.varicesClassification} onChange={(value) => updateTemplate("stomach", "varicesClassification", value)} columns="grid-cols-2" />
            <CheckboxGrid label="Polyp size" options={["< 5mm", "5 – 10mm", "10 – 20mm", "> 20mm"]} values={stomach.polypSize} onChange={(value) => updateTemplate("stomach", "polypSize", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Portal gastropathy mucosa" options={["Erythematous", "Edematous", "Petechial", "Erosions"]} values={stomach.portalGastropathyMucosa} onChange={(value) => updateTemplate("stomach", "portalGastropathyMucosa", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Stricture overlying mucosa" options={["Normal", "Inflamed", "Ulcerated", "Scarred / Fibrotic"]} values={stomach.strictureMucosa} onChange={(value) => updateTemplate("stomach", "strictureMucosa", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Site(s) of lesion" options={["Cardia", "Fundus", "Body", "Antrum", "Pre-pylorus", "Pylorus", "Incisura", "Lesser curvature", "Greater curve", "In hiatus hernia"]} values={stomach.siteOfLesion} onChange={(value) => updateTemplate("stomach", "siteOfLesion", value)} />
            <LabeledTextarea label="Other stomach details" value={stomach.other || ""} onChange={(value) => updateTemplate("stomach", "other", value)} rows={3} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Duodenum</h3>
            <CheckboxGrid label="Duodenum findings" options={duodenumFindingOptions} values={duodenum.findings} onChange={(value) => updateTemplate("duodenum", "findings", value)} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput label="Duodenitis severity" value={duodenum.duodenitisSeverity || ""} onChange={(value) => updateTemplate("duodenum", "duodenitisSeverity", value)} placeholder="Mild / Moderate / Severe" />
              <LabeledInput label="Erosions present" value={duodenum.erosionsPresent || ""} onChange={(value) => updateTemplate("duodenum", "erosionsPresent", value)} placeholder="Yes / No" />
              <LabeledInput label="Ulcer count" value={duodenum.ulcerCount || ""} onChange={(value) => updateTemplate("duodenum", "ulcerCount", value)} placeholder="Single / Multiple" />
              <LabeledInput label="Ulcer features" value={duodenum.ulcerFeatures || ""} onChange={(value) => updateTemplate("duodenum", "ulcerFeatures", value)} placeholder="Malignant / No malignant features" />
              <LabeledInput label="Polyp count" value={duodenum.polypCount || ""} onChange={(value) => updateTemplate("duodenum", "polypCount", value)} placeholder="Single / Multiple / Diffuse" />
            </div>
            <CheckboxGrid label="Forrest classification" options={forrestOptions} values={duodenum.forrestClassification} onChange={(value) => updateTemplate("duodenum", "forrestClassification", value)} />
            <CheckboxGrid label="Polyp size" options={["< 5mm", "5 – 10mm", "10 – 20mm", "> 20mm"]} values={duodenum.polypSize} onChange={(value) => updateTemplate("duodenum", "polypSize", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Tumour morphology" options={["Polypoid", "ulcerating", "fungating", "Infiltrating"]} values={duodenum.tumourMorphology} onChange={(value) => updateTemplate("duodenum", "tumourMorphology", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Stricture overlying mucosa" options={["Normal", "Inflamed", "Ulcerated", "Scarred / Fibrotic", "Malignant"]} values={duodenum.strictureMucosa} onChange={(value) => updateTemplate("duodenum", "strictureMucosa", value)} />
            <CheckboxGrid label="Site of lesion" options={["D1", "D2"]} values={duodenum.siteOfLesion} onChange={(value) => updateTemplate("duodenum", "siteOfLesion", value)} columns="grid-cols-2" />
            <LabeledTextarea label="Other duodenum details" value={duodenum.other || ""} onChange={(value) => updateTemplate("duodenum", "other", value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Gastroscopy Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <AnatomyDiagram
            type="gastroscopy"
            customImage={gastroscopyTemplateImage}
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
          <CardTitle className="text-base font-semibold text-gray-800">Interventions / Therapy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Interventions" options={interventionOptions} values={interventions.interventions} onChange={(value) => updateTemplate("interventions", "interventions", value)} />
          <CheckboxGrid label="Dilatation type" options={dilatationOptions} values={interventions.dilatationTypes} onChange={(value) => updateTemplate("interventions", "dilatationTypes", value)} columns="grid-cols-3" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Max dilatation (mm)" value={interventions.maxDilatationMm || ""} onChange={(value) => updateTemplate("interventions", "maxDilatationMm", value)} />
            <LabeledInput label="Number of bands applied" value={interventions.bandingCount || ""} onChange={(value) => updateTemplate("interventions", "bandingCount", value)} />
            <LabeledInput label="Number of clips applied" value={interventions.clipCount || ""} onChange={(value) => updateTemplate("interventions", "clipCount", value)} />
            <LabeledInput label="Injection agent" value={interventions.injectionAgent || ""} onChange={(value) => updateTemplate("interventions", "injectionAgent", value)} />
            <LabeledInput label="Stent length (cm)" value={interventions.stentLengthCm || ""} onChange={(value) => updateTemplate("interventions", "stentLengthCm", value)} />
            <LabeledInput label="Stent diameter (mm)" value={interventions.stentDiameterMm || ""} onChange={(value) => updateTemplate("interventions", "stentDiameterMm", value)} />
          </div>
          <CheckboxGrid label="Stent type" options={["Fully covered stent", "Partially covered stent", "Uncovered stent"]} values={interventions.stentTypes} onChange={(value) => updateTemplate("interventions", "stentTypes", value)} columns="grid-cols-3" />
          <OptionalOtherInput enabled={toArray(interventions.interventions).includes("Other")} value={interventions.other || ""} placeholder="Specify other intervention" onChange={(value) => updateTemplate("interventions", "other", value)} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Final Endoscopic Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Diagnosis" options={diagnosisOptions} values={diagnosis.diagnoses} onChange={(value) => updateTemplate("diagnosis", "diagnoses", value)} />
          <OptionalOtherInput enabled={toArray(diagnosis.diagnoses).includes("Other")} value={diagnosis.diagnosisOther || ""} placeholder="Specify other diagnosis" onChange={(value) => updateTemplate("diagnosis", "diagnosisOther", value)} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Comments, Conclusion and Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea label="Comments" value={additionalInfo.comments || ""} onChange={(value) => updateTemplate("additionalInfo", "comments", value)} />
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
