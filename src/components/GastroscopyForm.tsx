import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import { GastroscopyDiagramCanvas } from "@/components/GastroscopyDiagramCanvas";
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
  diagramResetCounter?: number;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  onClearPatientData?: () => void;
  isGeneratingPDF?: boolean;
}

const indicationOptions = [
  "Investigation of signs & symptoms",
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
const procedureUrgencyOptions = ["Emergency", "Semi-Emergency", "Semi-Elective", "Elective"];
const preoperativeImagingOptions = ["None", "Ultrasound", "CT Scan", "MRI", "Other"];

const sedationistOptions = [
  "Anaesthetist / Physician",
  "Physician",
  "Endoscopist",
  "Nurse",
  "Other",
];
const sedationTypeOptions = ["None", "Topical", "Conscious sedation", "GA"];
const monitoringOptions = ["Pulse oximetry", "BP", "ECG", "Other"];
const sedationLevelOptions = ["None", "minimal", "moderate", "deep", "Anaesthesia"];

const oesophagusFindingOptions = [
  "Normal",
  "Barrett’s Oesophagus",
  "Candida Oesophagitis",
  "Oesophageal Ulcer",
  "Oesophagitis",
  "Hiatus Hernia",
  "Kaposi Sarcoma",
  "Mallory-Weiss Tear",
  "Oesophageal Web",
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
  "Gastric Antral Vascular Ectasia (GAVE)",
  "Varices",
  "Polyps",
  "Portal Gastropathy",
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
  "Ia (Spurting)",
  "Ib (Oozing)",
  "IIa (Visible Vessel)",
  "IIb (Adherent Clot)",
  "IIc (Haematin)",
  "III (Clean Base)",
];

const interventionOptions = [
  "Biopsy",
  "H. Pylori Test",
  "Polypectomy",
  "Dilatation",
  "Banding",
  "Adrenaline Injection",
  "Haemoclip",
  "Heater Probe",
  "Argon Plasma Coagulation",
  "Stent Insertion",
  "Injection Therapy",
  "Tattoo",
  "Other",
];

const dilatationOptions = [
  "Bougie Dilatation",
  "Balloon Dilatation",
  "Achalasia Balloon Dilatation",
];

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

type FindingSectionKey = "pharynxLarynx" | "oesophagus" | "stomach" | "duodenum";

export const GastroscopyForm = ({
  currentReport,
  updateTemplate,
  diagramResetCounter = 0,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  onClearPatientData,
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

  const [expandedSections, setExpandedSections] = React.useState<Record<FindingSectionKey, boolean>>({
    pharynxLarynx: true,
    oesophagus: true,
    stomach: true,
    duodenum: true,
  });
  const [isSedationExpanded, setIsSedationExpanded] = React.useState(true);

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

  const calculateDuration = React.useCallback((startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      return "";
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return "";
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    return durationMinutes >= 0 ? String(durationMinutes) : "";
  }, []);

  const handlePreoperativeTimeChange = React.useCallback(
    (field: "startTime" | "endTime", value: string) => {
      updateTemplate("preoperative", field, value);

      const startTime = field === "startTime" ? value : preoperative.startTime || "";
      const endTime = field === "endTime" ? value : preoperative.endTime || "";

      if (startTime && endTime) {
        updateTemplate("preoperative", "duration", calculateDuration(startTime, endTime));
      }
    },
    [calculateDuration, preoperative.endTime, preoperative.startTime, updateTemplate],
  );

  const toggleFindingSection = (section: FindingSectionKey) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const toggleFindingValue = (values: unknown, option: string) => {
    const currentValues = toArray(values);
    return currentValues.includes(option)
      ? currentValues.filter((entry) => entry !== option)
      : [...currentValues, option];
  };

  const renderFindingOptionList = (
    label: string,
    options: string[],
    values: unknown,
    onChange: (nextValues: string[]) => void,
    renderSubsection?: (option: string) => React.ReactNode,
  ) => {
    const selectedValues = toArray(values);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            const subsection = isSelected && renderSubsection ? renderSubsection(option) : null;

            return (
              <div key={option} className="rounded border border-gray-200">
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onChange(toggleFindingValue(selectedValues, option))}
                  />
                  <span>{option}</span>
                </label>
                {subsection ? (
                  <div className="space-y-3 border-t border-gray-200 px-3 pb-3 pt-3">
                    {subsection}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFindingSegment = (
    section: FindingSectionKey,
    title: string,
    content: React.ReactNode,
  ) => (
    <div className="rounded-md border border-gray-200">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => toggleFindingSection(section)}
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {expandedSections[section] ? (
          <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600" />
        )}
      </button>
      {expandedSections[section] ? <div className="space-y-4 border-t px-4 pb-4 pt-4">{content}</div> : null}
    </div>
  );

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
            forceSectionedLayout
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Preoperative Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 rounded-md border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800">Clinical Team</h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <MultiValueTextField label="Endoscopist" values={preoperative.endoscopists || [""]} placeholder="Enter endoscopist name" onChange={(value) => updateTemplate("preoperative", "endoscopists", value)} />
              <MultiValueTextField label="Surgeon Name" values={preoperative.surgeons || [""]} placeholder="Enter surgeon name" onChange={(value) => updateTemplate("preoperative", "surgeons", value)} />
              <MultiValueTextField label="Anesthetist" values={preoperative.anaesthetists || [""]} placeholder="Enter anesthetist name" onChange={(value) => updateTemplate("preoperative", "anaesthetists", value)} />
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800">Procedure Planning</h3>
            <RadioGrid label="Procedure Urgency" options={procedureUrgencyOptions} value={preoperative.procedureUrgency || ""} onChange={(value) => updateTemplate("preoperative", "procedureUrgency", value)} columns="grid-cols-2 md:grid-cols-4" />
            <CheckboxGrid label="Preoperative Imaging" options={preoperativeImagingOptions} values={preoperative.preoperativeImaging} onChange={(value) => updateTemplate("preoperative", "preoperativeImaging", value)} columns="grid-cols-2 md:grid-cols-5" />
            <OptionalOtherInput enabled={toArray(preoperative.preoperativeImaging).includes("Other")} value={preoperative.preoperativeImagingOther || ""} placeholder="Specify other imaging" onChange={(value) => updateTemplate("preoperative", "preoperativeImagingOther", value)} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Time</Label>
                <Time24HourInput value={preoperative.startTime || ""} onChange={(value) => handlePreoperativeTimeChange("startTime", value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">End Time</Label>
                <Time24HourInput value={preoperative.endTime || ""} onChange={(value) => handlePreoperativeTimeChange("endTime", value)} />
              </div>
              <LabeledInput label="Total Duration (Min)" value={preoperative.duration || ""} onChange={(value) => updateTemplate("preoperative", "duration", value)} placeholder="Auto-calculated or enter manually" />
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800">Presentation</h3>
            <CheckboxGrid label="Indications for Gastroscopy" options={indicationOptions} values={preoperative.indications} onChange={(value) => updateTemplate("preoperative", "indications", value)} />
            <OptionalOtherInput enabled={toArray(preoperative.indications).includes("Other")} value={preoperative.indicationOther || ""} placeholder="Specify other indication" onChange={(value) => updateTemplate("preoperative", "indicationOther", value)} />
            <CheckboxGrid label="Signs & Symptoms" options={symptomOptions} values={preoperative.signsSymptoms} onChange={(value) => updateTemplate("preoperative", "signsSymptoms", value)} />
            <OptionalOtherInput enabled={toArray(preoperative.signsSymptoms).includes("Other")} value={preoperative.signsSymptomsOther || ""} placeholder="Specify other sign/symptom" onChange={(value) => updateTemplate("preoperative", "signsSymptomsOther", value)} />
            <CheckboxGrid label="Extent of Examination" options={extentOptions} values={preoperative.extentOfExamination} onChange={(value) => updateTemplate("preoperative", "extentOfExamination", value)} columns="grid-cols-2 md:grid-cols-4" />
          </div>

          <div className="rounded-md border border-gray-200">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() => setIsSedationExpanded((previous) => !previous)}
            >
              <span className="text-sm font-semibold text-gray-800">Sedation / Anaesthesia</span>
              {isSedationExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
            {isSedationExpanded ? (
              <div className="space-y-4 border-t px-4 pb-4 pt-4">
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
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Procedure Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderFindingSegment(
            "pharynxLarynx",
            "Pharynx / Larynx",
            <>
              <RadioGrid label="Pharynx" options={["Normal", "Abnormal"]} value={pharynxLarynx.pharynxStatus || ""} onChange={(value) => updateTemplate("pharynxLarynx", "pharynxStatus", value)} columns="grid-cols-2" />
              <OptionalOtherInput enabled={pharynxLarynx.pharynxStatus === "Abnormal"} value={pharynxLarynx.pharynxAbnormality || ""} placeholder="Specify pharynx abnormality" onChange={(value) => updateTemplate("pharynxLarynx", "pharynxAbnormality", value)} />
              <RadioGrid label="Vocal cords" options={["Normal", "Abnormal"]} value={pharynxLarynx.vocalCordsStatus || ""} onChange={(value) => updateTemplate("pharynxLarynx", "vocalCordsStatus", value)} columns="grid-cols-2" />
              <OptionalOtherInput enabled={pharynxLarynx.vocalCordsStatus === "Abnormal"} value={pharynxLarynx.vocalCordsAbnormality || ""} placeholder="Specify vocal cord abnormality" onChange={(value) => updateTemplate("pharynxLarynx", "vocalCordsAbnormality", value)} />
            </>,
          )}

          {renderFindingSegment(
            "oesophagus",
            "Oesophagus",
            <>
              {renderFindingOptionList(
                "Oesophagus Findings",
                oesophagusFindingOptions,
                oesophagus.findings,
                (value) => updateTemplate("oesophagus", "findings", value),
                (option) => {
                  switch (option) {
                    case "Barrett’s Oesophagus":
                      return (
                        <>
                          <CheckboxGrid label="Barrett’s Oesophagus" options={["Suspected", "Confirmed"]} values={oesophagus.barrettType} onChange={(value) => updateTemplate("oesophagus", "barrettType", value)} columns="grid-cols-2" />
                          <LabeledInput label="Length (cm)" value={oesophagus.barrettLength || ""} onChange={(value) => updateTemplate("oesophagus", "barrettLength", value)} />
                        </>
                      );
                    case "Candida Oesophagitis":
                      return <CheckboxGrid label="Candida Oesophagitis" options={["Mild", "Moderate", "Severe"]} values={oesophagus.candidaSeverity} onChange={(value) => updateTemplate("oesophagus", "candidaSeverity", value)} columns="grid-cols-3" />;
                    case "Oesophageal Ulcer":
                      return <CheckboxGrid label="Oesophageal Ulcer" options={["Benign Appearing", "Malignant Appearing"]} values={oesophagus.ulcerAppearance} onChange={(value) => updateTemplate("oesophagus", "ulcerAppearance", value)} columns="grid-cols-2" />;
                    case "Oesophagitis":
                      return <CheckboxGrid label="Oesophagitis" options={["Grade A", "Grade B", "Grade C", "Grade D"]} values={oesophagus.oesophagitisGrade} onChange={(value) => updateTemplate("oesophagus", "oesophagitisGrade", value)} columns="grid-cols-2 md:grid-cols-4" />;
                    case "Hiatus Hernia":
                      return (
                        <>
                          <CheckboxGrid label="Hiatus Hernia" options={["Grade I", "Grade II", "Grade III", "Grade IV"]} values={oesophagus.hiatusHerniaGrade} onChange={(value) => updateTemplate("oesophagus", "hiatusHerniaGrade", value)} columns="grid-cols-2 md:grid-cols-4" />
                          <LabeledInput label="Length (cm)" value={oesophagus.hiatusHerniaLength || ""} onChange={(value) => updateTemplate("oesophagus", "hiatusHerniaLength", value)} />
                        </>
                      );
                    case "Kaposi Sarcoma":
                      return <CheckboxGrid label="Kaposi Sarcoma" options={["Single", "Multiple"]} values={oesophagus.kaposiMultiplicity} onChange={(value) => updateTemplate("oesophagus", "kaposiMultiplicity", value)} columns="grid-cols-2" />;
                    case "Mallory-Weiss Tear":
                      return <CheckboxGrid label="Mallory-Weiss Tear" options={["Actively Bleeding", "Not Bleeding"]} values={oesophagus.malloryWeissBleeding} onChange={(value) => updateTemplate("oesophagus", "malloryWeissBleeding", value)} columns="grid-cols-2" />;
                    case "Oesophageal Web":
                      return <CheckboxGrid label="Oesophageal Web" options={["Proximal esophagus", "Mid esophagus", "Distal esophagus"]} values={oesophagus.webLocation} onChange={(value) => updateTemplate("oesophagus", "webLocation", value)} columns="grid-cols-3" />;
                    case "Stricture":
                      return <CheckboxGrid label="Stricture" options={["Benign", "Malignant"]} values={oesophagus.strictureType} onChange={(value) => updateTemplate("oesophagus", "strictureType", value)} columns="grid-cols-2" />;
                    case "Malignancy":
                      return (
                        <>
                          <CheckboxGrid label="Malignancy location" options={["Proximal Oesophagus", "Mid Oesophagus", "Distal Oesophagus"]} values={oesophagus.malignancyLocation} onChange={(value) => updateTemplate("oesophagus", "malignancyLocation", value)} columns="grid-cols-3" />
                          <LabeledInput label="Length (cm)" value={oesophagus.malignancyLength || ""} onChange={(value) => updateTemplate("oesophagus", "malignancyLength", value)} />
                        </>
                      );
                    case "Diverticulum":
                      return <CheckboxGrid label="Diverticulum location" options={["Proximal Oesophagus", "Mid Oesophagus", "Distal Oesophagus"]} values={oesophagus.diverticulumLocation} onChange={(value) => updateTemplate("oesophagus", "diverticulumLocation", value)} columns="grid-cols-3" />;
                    case "Varices":
                      return <CheckboxGrid label="Varices" options={["Grade I", "Grade II", "Grade III"]} values={oesophagus.varicesGrade} onChange={(value) => updateTemplate("oesophagus", "varicesGrade", value)} columns="grid-cols-3" />;
                    case "Other":
                      return <LabeledInput label="Specify Other Oesophagus Finding" value={oesophagus.other || ""} onChange={(value) => updateTemplate("oesophagus", "other", value)} />;
                    default:
                      return null;
                  }
                },
              )}
            </>,
          )}

          {renderFindingSegment(
            "stomach",
            "Stomach",
            <>
              {renderFindingOptionList(
                "Stomach Findings",
                stomachFindingOptions,
                stomach.findings,
                (value) => updateTemplate("stomach", "findings", value),
                (option) => {
                  switch (option) {
                    case "Ulcer":
                      return (
                        <>
                          <CheckboxGrid label="Ulcer" options={["Single", "Multiple", "Malignant Features", "No Malignant Features"]} values={stomach.ulcerSelections} onChange={(value) => updateTemplate("stomach", "ulcerSelections", value)} columns="grid-cols-2 md:grid-cols-4" />
                          <CheckboxGrid label="Forrest Classification" options={forrestOptions} values={stomach.forrestClassification} onChange={(value) => updateTemplate("stomach", "forrestClassification", value)} columns="grid-cols-2 md:grid-cols-3" />
                        </>
                      );
                    case "Mass / Tumour":
                      return <CheckboxGrid label="Mass / Tumour" options={["Polypoid", "Ulcerating", "Fungating", "Infiltrating"]} values={stomach.massMorphology} onChange={(value) => updateTemplate("stomach", "massMorphology", value)} columns="grid-cols-2 md:grid-cols-4" />;
                    case "Erosion(s)":
                      return <CheckboxGrid label="Erosion(s)" options={["Single", "Multiple", "Associated with Gastritis"]} values={stomach.erosionSelections} onChange={(value) => updateTemplate("stomach", "erosionSelections", value)} columns="grid-cols-3" />;
                    case "Gastritis":
                      return (
                        <>
                          <CheckboxGrid label="Gastritis Type" options={["Erosive Gastritis", "Atrophic Gastritis", "Haemorrhagic Gastritis", "Nodular Gastritis", "Bile Reflux Gastritis", "Other"]} values={stomach.gastritisType} onChange={(value) => updateTemplate("stomach", "gastritisType", value)} />
                          <OptionalOtherInput enabled={toArray(stomach.gastritisType).includes("Other")} value={stomach.gastritisTypeOther || ""} placeholder="Specify other gastritis type" onChange={(value) => updateTemplate("stomach", "gastritisTypeOther", value)} />
                          <CheckboxGrid label="Severity" options={["Mild", "Moderate", "Severe"]} values={stomach.gastritisSeverity} onChange={(value) => updateTemplate("stomach", "gastritisSeverity", value)} columns="grid-cols-3" />
                        </>
                      );
                    case "GIST":
                      return <CheckboxGrid label="GIST" options={["Normal Overlying Mucosa", "Ulcerated Overlying Mucosa"]} values={stomach.gistMucosa} onChange={(value) => updateTemplate("stomach", "gistMucosa", value)} columns="grid-cols-2" />;
                    case "Kaposi Sarcoma":
                      return <CheckboxGrid label="Kaposi Sarcoma" options={["Single", "Multiple", "Diffuse"]} values={stomach.kaposiPattern} onChange={(value) => updateTemplate("stomach", "kaposiPattern", value)} columns="grid-cols-3" />;
                    case "Gastric Antral Vascular Ectasia (GAVE)":
                      return <CheckboxGrid label="Gastric Antral Vascular Ectasia (GAVE)" options={["Focal", "Patchy", "Diffuse"]} values={stomach.gavePattern} onChange={(value) => updateTemplate("stomach", "gavePattern", value)} columns="grid-cols-3" />;
                    case "Varices":
                      return (
                        <>
                          <CheckboxGrid label="Varices Number" options={["Single", "Multiple", "Diffuse"]} values={stomach.varicesNumber} onChange={(value) => updateTemplate("stomach", "varicesNumber", value)} columns="grid-cols-3" />
                          <CheckboxGrid label="Varices Classification" options={["Continuous With Oesophageal Varices", "Isolated Gastric Varices"]} values={stomach.varicesClassification} onChange={(value) => updateTemplate("stomach", "varicesClassification", value)} columns="grid-cols-2" />
                        </>
                      );
                    case "Polyps":
                      return (
                        <>
                          <CheckboxGrid label="Polyps" options={["Single", "Multiple", "Diffuse"]} values={stomach.polypNumber} onChange={(value) => updateTemplate("stomach", "polypNumber", value)} columns="grid-cols-3" />
                          <CheckboxGrid label="Polyp Size" options={["< 5mm", "5 – 10mm", "10 – 20mm", "> 20mm"]} values={stomach.polypSize} onChange={(value) => updateTemplate("stomach", "polypSize", value)} columns="grid-cols-2 md:grid-cols-4" />
                        </>
                      );
                    case "Portal Gastropathy":
                      return (
                        <>
                          <CheckboxGrid label="Portal Gastropathy Severity" options={["Mild", "Moderate", "Severe"]} values={stomach.portalGastropathySeverity} onChange={(value) => updateTemplate("stomach", "portalGastropathySeverity", value)} columns="grid-cols-3" />
                          <CheckboxGrid label="Portal Gastropathy Mucosa" options={["Erythematous", "Edematous", "Petechial", "Erosions"]} values={stomach.portalGastropathyMucosa} onChange={(value) => updateTemplate("stomach", "portalGastropathyMucosa", value)} columns="grid-cols-2 md:grid-cols-4" />
                        </>
                      );
                    case "Stricture":
                      return <CheckboxGrid label="Stricture Overlying Mucosa" options={["Normal", "Inflamed", "Ulcerated", "Scarred / Fibrotic"]} values={stomach.strictureMucosa} onChange={(value) => updateTemplate("stomach", "strictureMucosa", value)} columns="grid-cols-2 md:grid-cols-4" />;
                    case "Other":
                      return <LabeledInput label="Specify Other Stomach Finding" value={stomach.other || ""} onChange={(value) => updateTemplate("stomach", "other", value)} />;
                    default:
                      return null;
                  }
                },
              )}
            </>,
          )}

          {renderFindingSegment(
            "duodenum",
            "Duodenum",
            <>
              {renderFindingOptionList(
                "Duodenum Findings",
                duodenumFindingOptions,
                duodenum.findings,
                (value) => updateTemplate("duodenum", "findings", value),
                (option) => {
                  switch (option) {
                    case "Duodenitis":
                      return (
                        <>
                          <CheckboxGrid label="Duodenitis Severity" options={["Mild", "Moderate", "Severe"]} values={duodenum.duodenitisSeverity} onChange={(value) => updateTemplate("duodenum", "duodenitisSeverity", value)} columns="grid-cols-3" />
                          <CheckboxGrid label="Duodenitis Additional Findings" options={["With Presence Of Erosions"]} values={duodenum.duodenitisWithErosions} onChange={(value) => updateTemplate("duodenum", "duodenitisWithErosions", value)} columns="grid-cols-1" />
                        </>
                      );
                    case "Ulcer":
                      return (
                        <>
                          <CheckboxGrid label="Ulcer" options={["Single", "Multiple", "Malignant Features", "No Malignant Features"]} values={duodenum.ulcerSelections} onChange={(value) => updateTemplate("duodenum", "ulcerSelections", value)} columns="grid-cols-2 md:grid-cols-4" />
                          <CheckboxGrid label="Forrest Classification" options={forrestOptions} values={duodenum.forrestClassification} onChange={(value) => updateTemplate("duodenum", "forrestClassification", value)} columns="grid-cols-2 md:grid-cols-3" />
                        </>
                      );
                    case "Polyp":
                      return (
                        <>
                          <CheckboxGrid label="Polyp" options={["Single", "Multiple", "Diffuse"]} values={duodenum.polypNumber} onChange={(value) => updateTemplate("duodenum", "polypNumber", value)} columns="grid-cols-3" />
                          <CheckboxGrid label="Polyp Size" options={["< 5mm", "5 – 10mm", "10 – 20mm", "> 20mm"]} values={duodenum.polypSize} onChange={(value) => updateTemplate("duodenum", "polypSize", value)} columns="grid-cols-2 md:grid-cols-4" />
                        </>
                      );
                    case "Tumour":
                      return <CheckboxGrid label="Tumour" options={["Polypoid", "Ulcerating", "Fungating", "Infiltrating"]} values={duodenum.tumourMorphology} onChange={(value) => updateTemplate("duodenum", "tumourMorphology", value)} columns="grid-cols-2 md:grid-cols-4" />;
                    case "Stricture":
                      return <CheckboxGrid label="Stricture Overlying Mucosa" options={["Normal", "Inflamed", "Ulcerated", "Scarred / Fibrotic", "Malignant"]} values={duodenum.strictureMucosa} onChange={(value) => updateTemplate("duodenum", "strictureMucosa", value)} columns="grid-cols-2 md:grid-cols-5" />;
                    case "Other":
                      return <LabeledInput label="Specify Other Duodenum Finding" value={duodenum.other || ""} onChange={(value) => updateTemplate("duodenum", "other", value)} />;
                    default:
                      return null;
                  }
                },
              )}
            </>,
          )}
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Gastroscopy Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <GastroscopyDiagramCanvas
            key={`gastroscopy-diagram-${diagramResetCounter}`}
            imageSrc={gastroscopyTemplateImage}
            initialCanvasImageData={template.diagram?.canvasImageData || ""}
            initialDrawingImageData={template.diagram?.drawingImageData || ""}
            initialTextAnnotations={template.diagram?.textAnnotations || []}
            onUpdate={(data) => {
              updateTemplate("diagram", "findings", data.findings || []);
              updateTemplate("diagram", "drawingImageData", data.drawingImageData || "");
              updateTemplate("diagram", "textAnnotations", data.textAnnotations || []);
              updateTemplate("diagram", "canvasImageData", data.canvasImageData || "");
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Interventions / Therapy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderFindingOptionList(
            "Interventions / Therapy",
            interventionOptions,
            interventions.interventions,
            (value) => updateTemplate("interventions", "interventions", value),
            (option) => {
              switch (option) {
                case "Dilatation":
                  return (
                    <>
                      <CheckboxGrid label="Dilatation Type" options={dilatationOptions} values={interventions.dilatationTypes} onChange={(value) => updateTemplate("interventions", "dilatationTypes", value)} columns="grid-cols-3" />
                      <LabeledInput label="Max Dilatation (mm)" value={interventions.maxDilatationMm || ""} onChange={(value) => updateTemplate("interventions", "maxDilatationMm", value)} />
                    </>
                  );
                case "Banding":
                  return <LabeledInput label="No Of Bands Applied" value={interventions.bandingCount || ""} onChange={(value) => updateTemplate("interventions", "bandingCount", value)} />;
                case "Haemoclip":
                  return <LabeledInput label="No Of Clips Applied" value={interventions.clipCount || ""} onChange={(value) => updateTemplate("interventions", "clipCount", value)} />;
                case "Stent Insertion":
                  return (
                    <>
                      <CheckboxGrid label="Stent Type" options={["Fully Covered Stent", "Partially Covered Stent", "Uncovered Stent"]} values={interventions.stentTypes} onChange={(value) => updateTemplate("interventions", "stentTypes", value)} columns="grid-cols-3" />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <LabeledInput label="Length (cm)" value={interventions.stentLengthCm || ""} onChange={(value) => updateTemplate("interventions", "stentLengthCm", value)} />
                        <LabeledInput label="Diameter (mm)" value={interventions.stentDiameterMm || ""} onChange={(value) => updateTemplate("interventions", "stentDiameterMm", value)} />
                      </div>
                    </>
                  );
                case "Injection Therapy":
                  return <LabeledInput label="Agent" value={interventions.injectionAgent || ""} onChange={(value) => updateTemplate("interventions", "injectionAgent", value)} placeholder="Specify injection agent" />;
                case "Other":
                  return <LabeledInput label="Specify Other Intervention" value={interventions.other || ""} onChange={(value) => updateTemplate("interventions", "other", value)} placeholder="Specify other intervention" />;
                default:
                  return null;
              }
            },
          )}
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
          <CardTitle className="text-base font-semibold text-gray-800">Specimen, Conclusion and Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Specimen</h3>
            <RadioGrid label="Specimen Sent for Pathology" options={["Yes", "No"]} value={additionalInfo.specimenSentForPathology || ""} onChange={(value) => updateTemplate("additionalInfo", "specimenSentForPathology", value)} columns="grid-cols-2" />
            {additionalInfo.specimenSentForPathology === "Yes" ? (
              <LabeledInput
                label="Specify Laboratory Sent To"
                value={additionalInfo.laboratorySentTo || ""}
                onChange={(value) => updateTemplate("additionalInfo", "laboratorySentTo", value)}
                placeholder="Enter laboratory name"
              />
            ) : null}
            <RadioGrid label="Other Specimens Taken" options={["No", "Yes"]} value={additionalInfo.otherSpecimensTaken || ""} onChange={(value) => updateTemplate("additionalInfo", "otherSpecimensTaken", value)} columns="grid-cols-2" />
            <OptionalOtherInput enabled={additionalInfo.otherSpecimensTaken === "Yes"} value={additionalInfo.otherSpecimensDetails || ""} placeholder="Specify e.g. Biopsies" onChange={(value) => updateTemplate("additionalInfo", "otherSpecimensDetails", value)} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Conclusion</h3>
            <LabeledTextarea label="Conclusion" value={additionalInfo.conclusion || ""} onChange={(value) => updateTemplate("additionalInfo", "conclusion", value)} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <LabeledTextarea label="Additional Notes" value={additionalInfo.additionalNotes || ""} onChange={(value) => updateTemplate("additionalInfo", "additionalNotes", value)} />
            <LabeledTextarea label="Post Operative Management" value={additionalInfo.postOperativeManagement || ""} onChange={(value) => updateTemplate("additionalInfo", "postOperativeManagement", value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
            <LabeledInput label="Surgeon's Signature" value={additionalInfo.surgeonSignatureText || ""} onChange={(value) => updateTemplate("additionalInfo", "surgeonSignatureText", value)} placeholder="Enter surgeon name/signature text" />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date and Time</Label>
              <DateTimeDDMMYYYY24HourInput value={additionalInfo.dateTime || ""} onChange={(value) => updateTemplate("additionalInfo", "dateTime", value)} />
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => updateTemplate("additionalInfo", "dateTime", getLocalDateTimeValue())}>
            Use Current Date/Time
          </Button>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {onExportPDF ? (
              <Button variant="outline" size="sm" className="glass-button text-xs" onClick={onExportPDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? "Generating..." : "Export PDF"}
              </Button>
            ) : null}
            {onSavePatient ? (
              <Button variant="outline" size="sm" className="glass-button text-xs" onClick={onSavePatient}>
                Save Patient
              </Button>
            ) : null}
            {onClearPatientData ? (
              <Button variant="outline" size="sm" className="glass-button text-xs" onClick={onClearPatientData}>
                Clear All Patient Data
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
