import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import {
  CheckboxGrid,
  LabeledInput,
  LabeledTextarea,
  MultiValueTextField,
  OptionalOtherInput,
  RadioGrid,
} from "@/components/TemplateFormHelpers";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
import {
  createInitialTransanalMinimallyInvasiveSurgeryState,
} from "@/utils/transanalMinimallyInvasiveSurgery";
import { toArray } from "@/utils/templateDataHelpers";

interface TransanalMinimallyInvasiveSurgeryFormProps {
  currentReport: any;
  updateTemplate: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  onClearAllData?: () => void;
  isGeneratingPDF?: boolean;
}

const diagnosisOptions = [
  "Rectal adenoma",
  "Early rectal cancer (T1)",
  "Neuroendocrine tumour",
  "Rectal polyp not amenable to endoscopic removal",
  "Residual/recurrent lesion",
  "Other",
];
const imagingOptions = ["None", "MRI", "Endorectal ultrasound", "CT scan", "Other"];
const urgencyOptions = ["Elective", "Semi-elective", "Semi-urgent", "Emergency"];
const locationOptions = ["Anterior", "Posterior", "Right lateral", "Left lateral", "Circumferential"];
const morphologyOptions = ["Flat lesion", "Sessile", "Pedunculated", "Depressed", "Other"];
const equipmentOptions = [
  "TAMIS port",
  "Transanal Endoscopic Operation",
  "Transanal Endoscopic Microsurgery",
  "Other",
];
const depthOfExcisionOptions = ["Submucosal excision", "Intermuscular excision", "Full-thickness excision", "Other"];
const deviceOptions = ["Diathermy", "Ligasure", "Harmonic", "Other"];
const haemostasisOptions = [
  "Haemostasis achieved",
  "Oozing",
  "Haemostatic powder required to control",
  "Haemostatic sheets required",
  "Hemostatic sutures",
  "Other",
];
const defectManagementOptions = ["Closed fully", "Closed partially", "Left open"];
const closureDirectionOptions = ["Longitudinal", "Transverse", "Combination"];
const closureTechniqueOptions = ["Interrupted sutures", "Continuous sutures"];
const sutureMaterialOptions = ["V-loc", "PDS", "Vicryl", "Prolene", "Monocryl", "Other"];
const difficultyOptions = [
  "None",
  "Large lesion",
  "Low/Distal lesion",
  "High/Proximal lesion",
  "Anterior lesion",
  "Poor visibility",
  "Bleeding",
  "Instrument collision",
  "Difficulty maintaining pneumorectum",
  "Maintaining platform in position",
  "Other",
];
const complicationOptions = [
  "None",
  "Bleeding",
  "Peritoneal entry",
  "Rectal perforation",
  "CO2 Embolism",
  "Other",
];

export const TransanalMinimallyInvasiveSurgeryForm = ({
  currentReport,
  updateTemplate,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  onClearAllData,
  isGeneratingPDF,
}: TransanalMinimallyInvasiveSurgeryFormProps) => {
  const template =
    currentReport.transanalMinimallyInvasiveSurgery ||
    createInitialTransanalMinimallyInvasiveSurgeryState();
  const preoperative = template.preoperative;
  const operativeFindings = template.operativeFindings;
  const procedure = template.procedure;
  const operativeEvents = template.operativeEvents;
  const specimen = template.specimen;
  const additionalInfo = template.additionalInfo;

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    if (onBulkPatientInfoUpdate) {
      onBulkPatientInfoUpdate(updates);
      return;
    }

    Object.entries(updates).forEach(([field, value]) => updateTemplate("patientInfo", field, value));
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

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    updateTemplate("preoperative", field, value);
    const startTime = field === "startTime" ? value : preoperative.startTime || "";
    const endTime = field === "endTime" ? value : preoperative.endTime || "";
    if (startTime && endTime) {
      updateTemplate("preoperative", "duration", calculateDuration(startTime, endTime));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Transanal Minimally Invasive Surgery - Synoptic Report
            </CardTitle>
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
          <MultiValueTextField
            label="Surgeon"
            values={preoperative.surgeons || [""]}
            placeholder="Enter surgeon name"
            onChange={(value) => updateTemplate("preoperative", "surgeons", value)}
          />
          <MultiValueTextField
            label="Assistant"
            values={preoperative.assistants || [""]}
            placeholder="Enter assistant name"
            onChange={(value) => updateTemplate("preoperative", "assistants", value)}
          />
          <MultiValueTextField
            label="Anesthetist"
            values={preoperative.anaesthetists || [""]}
            placeholder="Enter anesthetist name"
            onChange={(value) => updateTemplate("preoperative", "anaesthetists", value)}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Start Time</Label>
              <Time24HourInput value={preoperative.startTime || ""} onChange={(value) => handleTimeChange("startTime", value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">End Time</Label>
              <Time24HourInput value={preoperative.endTime || ""} onChange={(value) => handleTimeChange("endTime", value)} />
            </div>
            <LabeledInput
              label="Duration of Procedure (min)"
              value={preoperative.duration || ""}
              onChange={(value) => updateTemplate("preoperative", "duration", value)}
            />
          </div>
          <CheckboxGrid
            label="Pre-operative diagnosis"
            options={diagnosisOptions}
            values={preoperative.diagnosis}
            onChange={(value) => updateTemplate("preoperative", "diagnosis", value)}
          />
          <OptionalOtherInput
            enabled={toArray(preoperative.diagnosis).includes("Other")}
            value={preoperative.diagnosisOther || ""}
            placeholder="Specify other diagnosis"
            onChange={(value) => updateTemplate("preoperative", "diagnosisOther", value)}
          />
          <CheckboxGrid
            label="Pre-operative imaging"
            options={imagingOptions}
            values={preoperative.imaging}
            onChange={(value) => updateTemplate("preoperative", "imaging", value)}
          />
          <OptionalOtherInput
            enabled={toArray(preoperative.imaging).includes("Other")}
            value={preoperative.imagingOther || ""}
            placeholder="Specify other imaging"
            onChange={(value) => updateTemplate("preoperative", "imagingOther", value)}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="cT" value={preoperative.cT || ""} onChange={(value) => updateTemplate("preoperative", "cT", value)} />
            <LabeledInput label="cN" value={preoperative.cN || ""} onChange={(value) => updateTemplate("preoperative", "cN", value)} />
          </div>
          <RadioGrid
            label="Urgency"
            options={urgencyOptions}
            value={preoperative.urgency || ""}
            onChange={(value) => updateTemplate("preoperative", "urgency", value)}
            columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Operative Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea
            label="Operative Findings"
            value={operativeFindings.findings || ""}
            onChange={(value) => updateTemplate("operativeFindings", "findings", value)}
          />
          <CheckboxGrid
            label="Location in rectum"
            options={locationOptions}
            values={operativeFindings.locationInRectum}
            onChange={(value) => updateTemplate("operativeFindings", "locationInRectum", value)}
            columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-5"
          />
          <CheckboxGrid
            label="Morphology"
            options={morphologyOptions}
            values={operativeFindings.morphology}
            onChange={(value) => updateTemplate("operativeFindings", "morphology", value)}
          />
          <OptionalOtherInput
            enabled={toArray(operativeFindings.morphology).includes("Other")}
            value={operativeFindings.morphologyOther || ""}
            placeholder="Specify other morphology"
            onChange={(value) => updateTemplate("operativeFindings", "morphologyOther", value)}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <LabeledInput
              label="Distance from anal verge (cm)"
              value={operativeFindings.distanceFromAnalVerge || ""}
              onChange={(value) => updateTemplate("operativeFindings", "distanceFromAnalVerge", value)}
            />
            <LabeledInput
              label="Lesion size length (cm)"
              value={operativeFindings.lesionSizeLength || ""}
              onChange={(value) => updateTemplate("operativeFindings", "lesionSizeLength", value)}
            />
            <LabeledInput
              label="Lesion size width (cm)"
              value={operativeFindings.lesionSizeWidth || ""}
              onChange={(value) => updateTemplate("operativeFindings", "lesionSizeWidth", value)}
            />
          </div>
          <RadioGrid
            label="Circumferential involvement (%)"
            options={["< 25%", "25 – 50%", "50 – 75%", "75 - 100%"]}
            value={operativeFindings.circumferentialInvolvement || ""}
            onChange={(value) => updateTemplate("operativeFindings", "circumferentialInvolvement", value)}
            columns="grid-cols-1"
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Procedure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid
            label="Equipment Used"
            options={equipmentOptions}
            values={procedure.equipmentUsed}
            onChange={(value) => updateTemplate("procedure", "equipmentUsed", value)}
            columns="grid-cols-1"
          />
          <OptionalOtherInput
            enabled={toArray(procedure.equipmentUsed).includes("Other")}
            value={procedure.equipmentOther || ""}
            placeholder="Specify other equipment"
            onChange={(value) => updateTemplate("procedure", "equipmentOther", value)}
          />
          <LabeledInput
            label="Insufflation pressure (mmHg)"
            value={procedure.insufflationPressure || ""}
            onChange={(value) => updateTemplate("procedure", "insufflationPressure", value)}
          />
          <RadioGrid
            label="Circular rectal purse suture inserted"
            options={["Yes", "No"]}
            value={procedure.purseStringInserted || ""}
            onChange={(value) => updateTemplate("procedure", "purseStringInserted", value)}
            columns="grid-cols-2"
          />
          <RadioGrid
            label="Lesion peripheral margin marked"
            options={["Yes", "No"]}
            value={procedure.lesionPeripheralMarginMarked || ""}
            onChange={(value) => updateTemplate("procedure", "lesionPeripheralMarginMarked", value)}
            columns="grid-cols-2"
          />
          <LabeledInput
            label="Planned margin (mm)"
            value={procedure.plannedMargin || ""}
            onChange={(value) => updateTemplate("procedure", "plannedMargin", value)}
          />
          <CheckboxGrid
            label="Depth of Excision"
            options={depthOfExcisionOptions}
            values={procedure.depthOfExcision}
            onChange={(value) => updateTemplate("procedure", "depthOfExcision", value)}
            columns="grid-cols-1"
          />
          <OptionalOtherInput
            enabled={toArray(procedure.depthOfExcision).includes("Other")}
            value={procedure.depthOfExcisionOther || ""}
            placeholder="Specify other depth of excision"
            onChange={(value) => updateTemplate("procedure", "depthOfExcisionOther", value)}
          />
          <CheckboxGrid
            label="Device used"
            options={deviceOptions}
            values={procedure.deviceUsed}
            onChange={(value) => updateTemplate("procedure", "deviceUsed", value)}
            columns="grid-cols-1"
          />
          <OptionalOtherInput
            enabled={toArray(procedure.deviceUsed).includes("Other")}
            value={procedure.deviceOther || ""}
            placeholder="Specify other device"
            onChange={(value) => updateTemplate("procedure", "deviceOther", value)}
          />
          <CheckboxGrid
            label="Haemostasis"
            options={haemostasisOptions}
            values={procedure.haemostasis}
            onChange={(value) => updateTemplate("procedure", "haemostasis", value)}
            columns="grid-cols-1"
          />
          <OptionalOtherInput
            enabled={toArray(procedure.haemostasis).includes("Other")}
            value={procedure.haemostasisOther || ""}
            placeholder="Specify other haemostasis detail"
            onChange={(value) => updateTemplate("procedure", "haemostasisOther", value)}
          />
          <CheckboxGrid
            label="Management of defect after excision"
            options={defectManagementOptions}
            values={procedure.defectManagement}
            onChange={(value) => updateTemplate("procedure", "defectManagement", value)}
            columns="grid-cols-1"
          />
          <CheckboxGrid
            label="Direction of defect closure"
            options={closureDirectionOptions}
            values={procedure.closureDirection}
            onChange={(value) => updateTemplate("procedure", "closureDirection", value)}
            columns="grid-cols-1"
          />
          <CheckboxGrid
            label="Closure technique"
            options={closureTechniqueOptions}
            values={procedure.closureTechnique}
            onChange={(value) => updateTemplate("procedure", "closureTechnique", value)}
            columns="grid-cols-1"
          />
          <CheckboxGrid
            label="Suture material"
            options={sutureMaterialOptions}
            values={procedure.sutureMaterial}
            onChange={(value) => updateTemplate("procedure", "sutureMaterial", value)}
            columns="grid-cols-1"
          />
          <OptionalOtherInput
            enabled={toArray(procedure.sutureMaterial).includes("Other")}
            value={procedure.sutureMaterialOther || ""}
            placeholder="Specify other suture material"
            onChange={(value) => updateTemplate("procedure", "sutureMaterialOther", value)}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Intra-operative Difficulties and Complications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid
            label="Intra-operative difficulties"
            options={difficultyOptions}
            values={operativeEvents.difficulties}
            onChange={(value) => updateTemplate("operativeEvents", "difficulties", value)}
          />
          <OptionalOtherInput
            enabled={toArray(operativeEvents.difficulties).includes("Other")}
            value={operativeEvents.difficultiesOther || ""}
            placeholder="Specify other difficulty"
            onChange={(value) => updateTemplate("operativeEvents", "difficultiesOther", value)}
          />
          <CheckboxGrid
            label="Intraoperative complications"
            options={complicationOptions}
            values={operativeEvents.complications}
            onChange={(value) => updateTemplate("operativeEvents", "complications", value)}
          />
          <OptionalOtherInput
            enabled={toArray(operativeEvents.complications).includes("Other")}
            value={operativeEvents.complicationsOther || ""}
            placeholder="Specify other complication"
            onChange={(value) => updateTemplate("operativeEvents", "complicationsOther", value)}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Specimen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGrid
            label="Specimen retrieved"
            options={["Yes", "No"]}
            value={specimen.specimenRetrieved || ""}
            onChange={(value) => {
              updateTemplate("specimen", "specimenRetrieved", value);
              if (value !== "Yes") {
                updateTemplate("specimen", "laboratorySentTo", "");
              }
            }}
            columns="grid-cols-2"
          />
          {specimen.specimenRetrieved === "Yes" ? (
            <LabeledInput
              label="Specify Laboratory Sent to"
              value={specimen.laboratorySentTo || ""}
              onChange={(value) => updateTemplate("specimen", "laboratorySentTo", value)}
              placeholder="Enter laboratory name"
            />
          ) : null}
          <RadioGrid
            label="Orientation marked"
            options={["Yes", "No"]}
            value={specimen.orientationMarked || ""}
            onChange={(value) => updateTemplate("specimen", "orientationMarked", value)}
            columns="grid-cols-2"
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea
            label="Additional information"
            value={additionalInfo.additionalInformation || ""}
            onChange={(value) => updateTemplate("additionalInfo", "additionalInformation", value)}
          />
          <LabeledTextarea
            label="Post operative management"
            value={additionalInfo.postOperativeManagement || ""}
            onChange={(value) => updateTemplate("additionalInfo", "postOperativeManagement", value)}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              label="Surgeon's Signature"
              value={additionalInfo.doctorSignature || ""}
              onChange={(value) => updateTemplate("additionalInfo", "doctorSignature", value)}
              placeholder="Enter surgeon name/signature text"
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date and Time</Label>
              <DateTimeDDMMYYYY24HourInput
                value={additionalInfo.dateTime || ""}
                onChange={(value) => updateTemplate("additionalInfo", "dateTime", value)}
              />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => updateTemplate("additionalInfo", "dateTime", getLocalDateTimeValue())}>
            Use Current Date/Time
          </Button>
          <div className="border-t pt-4">
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
              {onClearAllData ? (
                <Button variant="outline" size="sm" className="glass-button text-xs" onClick={onClearAllData}>
                  Clear All Patient Data
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
