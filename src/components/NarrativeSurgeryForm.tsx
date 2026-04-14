import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import { CheckboxGrid, LabeledTextarea, MultiValueTextField, OptionalOtherInput, RadioGrid } from "@/components/TemplateFormHelpers";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
import { createInitialNarrativeSurgeryState } from "@/utils/narrativeSurgery";
import { toArray } from "@/utils/templateDataHelpers";

interface NarrativeSurgeryFormProps {
  currentReport: any;
  reportKey: "openGeneralSurgery" | "openAbdominalSurgery";
  variant: "general" | "abdominal";
  title: string;
  updateTemplate: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  onClearPatientData?: () => void;
  isGeneratingPDF?: boolean;
  diagramElement?: React.ReactNode;
}

const imagingOptions = ["None", "X-ray", "Ultrasound", "CT scan", "Contrast study", "Other"];
const urgencyOptions = ["Elective", "Semi-elective", "Semi-urgent", "Emergency"];
const conversionReasonOptions = [
  "Adhesions",
  "Visceral injury",
  "Vascular injury",
  "Difficult exposure",
  "difficult visualization",
  "bleeding",
  "failure to progress",
  "Contamination",
  "Other",
];
const abdominalSpecimenOptions = [
  "Bowel",
  "Colon",
  "Lymph nodes",
  "Liver",
  "Peritoneum",
  "Omentum",
  "Ascites",
  "Fluid / Pus",
  "Other",
];
const abdominalDifficultyOptions = [
  "None",
  "Adhesions",
  "Fibrosis",
  "Bleeding",
  "Tumour infiltration",
  "Anatomy exposure",
  "Bowel distension",
  "Limited operative space",
  "Equipment problems",
  "Anaesthetic problems",
  "Camera handling",
  "Assistant retraction",
  "Other",
];
const abdominalComplicationOptions = [
  "None",
  "Bowel injury",
  "Vascular injury",
  "Adjacent organ injury",
  "Tumour perforation",
  "Bleeding",
  "Stapler malfunction",
  "Anaesthetic events",
  "Other",
];

export const NarrativeSurgeryForm = ({
  currentReport,
  reportKey,
  variant,
  title,
  updateTemplate,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  onClearPatientData,
  isGeneratingPDF,
  diagramElement,
}: NarrativeSurgeryFormProps) => {
  const template = currentReport[reportKey] || createInitialNarrativeSurgeryState(variant);
  const preoperative = template.preoperative || createInitialNarrativeSurgeryState(variant).preoperative;
  const access = template.access || createInitialNarrativeSurgeryState(variant).access;
  const narrative = template.narrative || createInitialNarrativeSurgeryState(variant).narrative;
  const additionalInfo =
    template.additionalInfo || createInitialNarrativeSurgeryState(variant).additionalInfo;

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

    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }

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
  const showBottomActionRow =
    Boolean(onExportPDF) || Boolean(onSavePatient) || Boolean(onClearPatientData);

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
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
        <CardContent className="space-y-6">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Duration of Procedure (min)</Label>
              <input
                className="glass-input h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={preoperative.duration || ""}
                onChange={(event) => updateTemplate("preoperative", "duration", event.target.value)}
              />
            </div>
          </div>
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
          <RadioGrid
            label="Urgency"
            options={urgencyOptions}
            value={preoperative.urgency || ""}
            onChange={(value) => updateTemplate("preoperative", "urgency", value)}
            columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          />
        </CardContent>
      </Card>

      {variant === "abdominal" ? (
        <Card className="glass-card-light">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">Abdominal Access and Incisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGrid
              label="Approach"
              options={["Laparoscopic", "Laparoscopic converted to open", "Open"]}
              value={access.approach || ""}
              onChange={(value) => updateTemplate("access", "approach", value)}
            />
            {access.approach === "Laparoscopic converted to open" ? (
              <>
                <CheckboxGrid
                  label="Reason for conversion"
                  options={conversionReasonOptions}
                  values={access.reasonForConversion}
                  onChange={(value) => updateTemplate("access", "reasonForConversion", value)}
                />
                <OptionalOtherInput
                  enabled={toArray(access.reasonForConversion).includes("Other")}
                  value={access.reasonForConversionOther || ""}
                  placeholder="Specify other conversion reason"
                  onChange={(value) => updateTemplate("access", "reasonForConversionOther", value)}
                />
              </>
            ) : null}
            {diagramElement}
          </CardContent>
        </Card>
      ) : (
        diagramElement
      )}

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Narrative Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea
            label="Operation Done"
            value={narrative.operationDone || ""}
            onChange={(value) => updateTemplate("narrative", "operationDone", value)}
            rows={3}
          />
          <LabeledTextarea
            label="Operative Findings"
            value={narrative.operativeFindings || ""}
            onChange={(value) => updateTemplate("narrative", "operativeFindings", value)}
            rows={4}
          />
          <LabeledTextarea
            label="Operation Details"
            value={narrative.operationDetails || ""}
            onChange={(value) => updateTemplate("narrative", "operationDetails", value)}
            rows={6}
          />
          {variant === "general" ? (
            <>
              <LabeledTextarea
                label="Specimens taken"
                value={String(narrative.specimensTaken || "")}
                onChange={(value) => updateTemplate("narrative", "specimensTaken", value)}
                rows={2}
              />
              <LabeledTextarea
                label="Points of Difficulty"
                value={String(narrative.pointsOfDifficulty || "")}
                onChange={(value) => updateTemplate("narrative", "pointsOfDifficulty", value)}
                rows={2}
              />
              <LabeledTextarea
                label="Intra-operative complications"
                value={String(narrative.intraoperativeComplications || "")}
                onChange={(value) => updateTemplate("narrative", "intraoperativeComplications", value)}
                rows={2}
              />
            </>
          ) : (
            <>
              <CheckboxGrid
                label="Specimens"
                options={abdominalSpecimenOptions}
                values={narrative.specimensTaken}
                onChange={(value) => updateTemplate("narrative", "specimensTaken", value)}
              />
              <OptionalOtherInput
                enabled={toArray(narrative.specimensTaken).includes("Other")}
                value={narrative.specimensTakenOther || ""}
                placeholder="Specify other specimen"
                onChange={(value) => updateTemplate("narrative", "specimensTakenOther", value)}
              />
              <CheckboxGrid
                label="Points of Difficulty"
                options={abdominalDifficultyOptions}
                values={narrative.pointsOfDifficulty}
                onChange={(value) => updateTemplate("narrative", "pointsOfDifficulty", value)}
              />
              <OptionalOtherInput
                enabled={toArray(narrative.pointsOfDifficulty).includes("Other")}
                value={narrative.pointsOfDifficultyOther || ""}
                placeholder="Specify other difficulty"
                onChange={(value) => updateTemplate("narrative", "pointsOfDifficultyOther", value)}
              />
              <CheckboxGrid
                label="Intra-operative complications"
                options={abdominalComplicationOptions}
                values={narrative.intraoperativeComplications}
                onChange={(value) => updateTemplate("narrative", "intraoperativeComplications", value)}
              />
              <OptionalOtherInput
                enabled={
                  toArray(narrative.intraoperativeComplications).includes("Other") ||
                  toArray(narrative.intraoperativeComplications).includes("Adjacent organ injury") ||
                  toArray(narrative.intraoperativeComplications).includes("Bleeding")
                }
                value={narrative.intraoperativeComplicationsOther || ""}
                placeholder="Specify details"
                onChange={(value) => updateTemplate("narrative", "intraoperativeComplicationsOther", value)}
              />
            </>
          )}
          <LabeledTextarea
            label="Post operative management"
            value={narrative.postOperativeManagement || ""}
            onChange={(value) => updateTemplate("narrative", "postOperativeManagement", value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Doctor Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Doctor</Label>
              <input
                className="glass-input h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={additionalInfo.doctorName || ""}
                onChange={(event) => updateTemplate("additionalInfo", "doctorName", event.target.value)}
                placeholder="Enter doctor name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <DateTimeDDMMYYYY24HourInput
                value={additionalInfo.dateTime || ""}
                onChange={(value) => updateTemplate("additionalInfo", "dateTime", value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateTemplate("additionalInfo", "dateTime", getLocalDateTimeValue())}
            >
              Use Current Date/Time
            </Button>
          </div>
          {showBottomActionRow ? (
            <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
              {onExportPDF ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="glass-button text-xs"
                  onClick={onExportPDF}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? "Generating..." : "Print/Export PDF"}
                </Button>
              ) : null}
              {onSavePatient ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="glass-button text-xs"
                  onClick={onSavePatient}
                >
                  Save Patient
                </Button>
              ) : null}
              {onClearPatientData ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="glass-button text-xs"
                  onClick={onClearPatientData}
                >
                  Clear All Patient Data
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
