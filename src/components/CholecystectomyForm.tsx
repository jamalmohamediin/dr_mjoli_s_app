import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import {
  DateTimeDDMMYYYY24HourInput,
  Time24HourInput,
} from "@/components/Time24HourInput";
import {
  formatDateTimeDDMMYYYYWithDashes,
  getLocalDateTimeValue,
} from "@/utils/dateFormatter";
import { initialCholecystectomyState } from "@/utils/cholecystectomy";
import {
  Activity,
  ChevronDown,
  ClipboardList,
  Download,
  FileText,
  Redo2,
  RotateCcw,
  Scissors,
  Shield,
  Undo2,
  User,
} from "lucide-react";

interface CholecystectomyFormProps {
  currentReport: any;
  updateCholecystectomy: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onClear?: (section: string) => void;
  onClearAll?: () => void;
  onUndo?: (section: string) => void;
  onRedo?: (section: string) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  isGeneratingPDF?: boolean;
  diagramElement?: React.ReactNode;
}

const indicationOptions = [
  "Symptomatic Gallstones",
  "Acute Cholecystitis",
  "Gallstone Pancreatitis",
  "Biliary Colic",
  "Acalculus Cholecystitis",
  "Other",
];

const urgencyOptions = ["Elective", "Semi-Elective", "Semi-Urgent", "Emergency", "Day Case"];

const imagingOptions = [
  "None",
  "Ultrasound",
  "CT Scan",
  "MRI",
  "X-Ray",
  "Contrast Study",
  "Other",
];

const gallbladderAppearanceOptions = [
  "Normal",
  "Distended",
  "Inflamed",
  "Thickened Wall",
  "Fibrotic",
  "Empyema",
  "Gangrenous",
  "Gall Bladder Hydrops / Mucocele",
  "Perforated",
  "Mucocele",
  "Other",
];

const adhesionOptions = ["None", "Mild", "Moderate", "Severe", "Dense"];

const approachOptions = ["Laparoscopic", "Laparoscopic Converted to Open", "Open"];

const conversionReasonOptions = [
  "Adhesions",
  "Visceral Injury",
  "Vascular Injury",
  "Difficult Exposure",
  "Difficult Visualization",
  "Bleeding",
  "Failure to Progress",
  "Other",
];

const subtotalReasonOptions = [
  "Difficult Exposure",
  "Bleeding",
  "Failure to Progress",
  "Adhesions",
  "Difficult Visualization",
  "Visceral Injury",
  "Vascular Injury",
  "Other",
];

const cysticDuctControlOptions = [
  "Not Applicable",
  "Ligaclip",
  "Hemoloc",
  "Endoloop",
  "Tie",
  "Linear Stapler",
  "Other",
];

const cysticArteryControlOptions = [
  "Not Applicable",
  "Ligaclip",
  "Hemoloc",
  "Diathermy",
  "Energy device",
  "Other",
];

const liverBedDissectionOptions = [
  "Diathermy",
  "Ligasure",
  "Harmonic",
  "Blunt",
  "Sharp",
  "Other",
];

const additionalProcedureOptions = [
  "Intraoperative Cholangiogram",
  "Common Bile Duct Exploration",
  "Drain Insertion",
  "Other",
];

const cholangiogramFindingOptions = [
  "Normal",
  "Filling Defects",
  "Ductal Stricture",
  "Dilatation",
  "Stones",
  "Leaks",
  "Other",
];

const gallbladderRetrievalOptions = [
  "Endobag",
  "Direct Port Extraction",
  "Through Port Wound",
  "Port Site Extension Required",
  "Other",
];

const skinClosureOptions = [
  "Simple suture",
  "Staples",
  "Subcuticular suture",
  "Adhesive strip",
  "Tissue glue",
  "Other",
];

const intraoperativeDifficultyOptions = [
  "None",
  "Peritoneal Access",
  "Adhesions",
  "Dense Inflammation",
  "Dense Fibrosis",
  "Bleeding",
  "Equipment Issues",
  "Other",
];

const complicationOptions = [
  "None",
  "Bile Duct Injury",
  "Bleeding",
  "Liver Tear",
  "Bowel Injury",
  "Other",
];

const stonesPresentOptions = ["No", "Solitary Stones", "Multiple Stones"];

const typeOfStonesOptions = ["Cholesterol", "Pigment", "Mixed", "Other"];

const sizeOfStonesOptions = ["Sludge", "< 5mm", "5 -10mm", "10 – 20mm", "> 20mm"];

const adhesiolysisOptions = ["None", "Limited", "Extensive"];

const extentOfCholecystectomyOptions = [
  "Total Cholecystectomy",
  "Subtotal Cholecystectomy Required",
  "Other",
];

const subtotalCholecystectomyControlOptions = [
  "Tie",
  "Suture",
  "Endoloop",
  "Linear Stapler",
  "Other",
];

const criticalViewSafetyConfirmationOptions = [
  "Not Seen",
  "Calot's Triangle Seen",
  "Cystic Duct Identified",
  "Cystic Artery Identified",
  "Two Structures Entering Gallbladder",
  "Other",
];

const hemostasisOptions = [
  "Haemostasis Achieved",
  "Oozing",
  "Haemstatic Powder Required to Control",
  "Haemostatic Sheets Required",
  "Other",
];

const peritonealLavageOptions = [
  "None Required",
  "Suction Only",
  "Irrigation and Suction",
  "Removal of Spilled Gallstone",
  "Other",
];

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean) as string[];
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
};

export const CholecystectomyForm = ({
  currentReport,
  updateCholecystectomy,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onClear,
  onClearAll,
  onUndo,
  onRedo,
  onExportPDF,
  onSavePatient,
  isGeneratingPDF,
  diagramElement,
}: CholecystectomyFormProps) => {
  const cholecystectomy = currentReport.cholecystectomy || initialCholecystectomyState;

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    Object.entries(updates).forEach(([field, value]) => {
      updateCholecystectomy("patientInfo", field, value);
    });
  };
  const [expanded, setExpanded] = useState({
    patientInfo: true,
    preoperative: true,
    intraoperative: false,
    procedure: false,
    closure: false,
  });

  const toggleExpand = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleArrayValue = (
    section: string,
    field: string,
    option: string,
    currentValue: unknown
  ) => {
    const current = toArray(currentValue);
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    updateCholecystectomy(section, field, updated);
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return "";

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const startTotal = startHour * 60 + startMinute;
    let endTotal = endHour * 60 + endMinute;

    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }

    return String(endTotal - startTotal);
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    updateCholecystectomy("preoperative", field, value);

    const startTime =
      field === "startTime" ? value : cholecystectomy.preoperative?.startTime || "";
    const endTime = field === "endTime" ? value : cholecystectomy.preoperative?.endTime || "";

    if (startTime && endTime) {
      updateCholecystectomy("preoperative", "duration", calculateDuration(startTime, endTime));
    }
  };

  const isConvertedToOpen = () =>
    toArray(cholecystectomy.procedure?.approach).includes("Laparoscopic Converted to Open") ||
    toArray(cholecystectomy.procedure?.approach).includes("Laparoscopic converted to open");

  const isLaparoscopicOrConverted = () =>
    toArray(cholecystectomy.procedure?.approach).includes("Laparoscopic") || isConvertedToOpen();

  const isSubtotalSelected = () =>
    cholecystectomy.procedure?.subtotalCholecystectomy === "Yes";

  const hasAdditionalDrain = () =>
    toArray(cholecystectomy.procedure?.additionalProcedures).includes("Drain Insertion") ||
    toArray(cholecystectomy.procedure?.additionalProcedures).includes("Drain insertion");

  const hasCholangiogram = () =>
    toArray(cholecystectomy.procedure?.additionalProcedures).includes(
      "Intraoperative Cholangiogram"
    ) ||
    toArray(cholecystectomy.procedure?.additionalProcedures).includes(
      "Intraoperative cholangiogram"
    );

  const isSubtotalCholecystectomyRequired = () =>
    cholecystectomy.procedure?.extentOfCholecystectomy === "Subtotal Cholecystectomy Required";

  const renderSectionHeader = (
    title: string,
    sectionKey: keyof typeof expanded,
    icon: React.ReactNode,
    historyKey: string
  ) => (
    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <div
        className="flex items-center gap-2 cursor-pointer flex-1"
        onClick={() => toggleExpand(sectionKey)}
      >
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            expanded[sectionKey] ? "transform rotate-180" : ""
          }`}
        />
      </div>
      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onUndo?.(historyKey)}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onRedo?.(historyKey)}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          onClick={() => onClear?.(historyKey)}
          title="Clear Section"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderTeamField = (
    label: string,
    field: "surgeons" | "assistants" | "anaesthetists",
    placeholder: string
  ) => {
    const values = cholecystectomy.preoperative?.[field] || [""];

    return (
      <div className="grid grid-cols-2 gap-4 items-start">
        <label className="text-gray-800 font-medium">{label}</label>
        <div className="space-y-2">
          {values.map((value: string, index: number) => (
            <div key={`${field}-${index}`} className="flex items-center gap-2">
              <Input
                className="flex-1"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                  const updated = [...values];
                  updated[index] = e.target.value;
                  updateCholecystectomy("preoperative", field, updated);
                }}
              />
              {index === values.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1"
                  onClick={() => updateCholecystectomy("preoperative", field, [...values, ""])}
                >
                  +
                </Button>
              )}
              {values.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                  onClick={() =>
                    updateCholecystectomy(
                      "preoperative",
                      field,
                      values.filter((_: string, itemIndex: number) => itemIndex !== index)
                    )
                  }
                >
                  −
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        {renderSectionHeader(
          "Patient Information",
          "patientInfo",
          <User className="h-5 w-5 text-gray-600" />,
          "patientInfo"
        )}
        {expanded.patientInfo && (
          <CardContent className="px-6 py-4">
            <PatientInfoFields
              patientInfo={cholecystectomy.patientInfo}
              onFieldChange={(field, value) =>
                updateCholecystectomy("patientInfo", field, value)
              }
              onBulkUpdate={onBulkPatientInfoUpdate || updatePatientInfoFields}
              currentExtractedPatientInfo={currentExtractedPatientInfo}
              onCurrentPatientChange={onCurrentPatientChange}
              use24HourTimeInputs
              useDashDateInputs
            />
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader(
          "Preoperative Information",
          "preoperative",
          <Activity className="h-5 w-5 text-gray-600" />,
          "preoperative"
        )}
        {expanded.preoperative && (
          <CardContent className="px-6 py-4">
            <div className="space-y-6">
              <div className="space-y-4">
                {renderTeamField("Surgeon:", "surgeons", "Enter Surgeon Name")}
                {renderTeamField("Assistant:", "assistants", "Enter Assistant Name")}
                {renderTeamField("Anaesthetist:", "anaesthetists", "Enter Anaesthetist Name")}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Procedure Urgency:</p>
                  <div className="flex flex-wrap gap-4 ml-4">
                    {urgencyOptions.map((option) => (
                      <div className="flex items-center" key={`chole-urgency-${option}`}>
                        <Checkbox
                          id={`chole-urgency-${option}`}
                          checked={cholecystectomy.preoperative?.procedureUrgency === option}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateCholecystectomy("preoperative", "procedureUrgency", option);
                            }
                          }}
                        />
                        <label
                          htmlFor={`chole-urgency-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preoperative Imaging:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {imagingOptions.map((option) => (
                      <div className="flex items-center" key={`chole-imaging-${option}`}>
                        <Checkbox
                          id={`chole-imaging-${option}`}
                          checked={toArray(cholecystectomy.preoperative?.imaging).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "preoperative",
                              "imaging",
                              option,
                              cholecystectomy.preoperative?.imaging
                            )
                          }
                        />
                        <label
                          htmlFor={`chole-imaging-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(cholecystectomy.preoperative?.imaging).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify other imaging"
                        value={cholecystectomy.preoperative?.imagingOther || ""}
                        onChange={(e) =>
                          updateCholecystectomy("preoperative", "imagingOther", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Start Time:</label>
                    <Time24HourInput
                      hourAriaLabel="Start hour"
                      minuteAriaLabel="Start minute"
                      value={cholecystectomy.preoperative?.startTime || ""}
                      onChange={(value) => handleTimeChange("startTime", value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">End Time:</label>
                    <Time24HourInput
                      hourAriaLabel="End hour"
                      minuteAriaLabel="End minute"
                      value={cholecystectomy.preoperative?.endTime || ""}
                      onChange={(value) => handleTimeChange("endTime", value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Duration of Operation:</label>
                    <Input
                      type="text"
                      value={cholecystectomy.preoperative?.duration || ""}
                      onChange={(e) =>
                        updateCholecystectomy("preoperative", "duration", e.target.value)
                      }
                      placeholder="Auto-Calculated or Manual Entry"
                    />
                    <div className="text-sm text-gray-600">
                      {cholecystectomy.preoperative?.startTime &&
                      cholecystectomy.preoperative?.endTime
                        ? "Auto-Calculated"
                        : "Manual Entry"}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Indication for Surgery:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {indicationOptions.map((option) => (
                        <div className="flex items-center" key={`chole-indication-${option}`}>
                          <Checkbox
                            id={`chole-indication-${option}`}
                            checked={toArray(cholecystectomy.preoperative?.indication).includes(
                              option
                            )}
                            onCheckedChange={() =>
                              toggleArrayValue(
                                "preoperative",
                                "indication",
                                option,
                                cholecystectomy.preoperative?.indication
                              )
                            }
                          />
                          <label
                            htmlFor={`chole-indication-${option}`}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {toArray(cholecystectomy.preoperative?.indication).includes("Other") && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other indication"
                          value={cholecystectomy.preoperative?.indicationOther || ""}
                          onChange={(e) =>
                            updateCholecystectomy("preoperative", "indicationOther", e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                    <div className="ml-4">
                      <Textarea
                        rows={3}
                        placeholder="Enter Operation Description"
                        value={cholecystectomy.preoperative?.operationDescription || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "preoperative",
                            "operationDescription",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader(
          "Intraoperative Findings",
          "intraoperative",
          <Shield className="h-5 w-5 text-gray-600" />,
          "intraoperative"
        )}
        {expanded.intraoperative && (
          <CardContent className="px-6 py-4">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Gallbladder Appearance:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {gallbladderAppearanceOptions.map((option) => (
                    <div className="flex items-center" key={`chole-appearance-${option}`}>
                      <Checkbox
                        id={`chole-appearance-${option}`}
                        checked={toArray(cholecystectomy.intraoperative?.gallbladderAppearance).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "intraoperative",
                            "gallbladderAppearance",
                            option,
                            cholecystectomy.intraoperative?.gallbladderAppearance
                          )
                        }
                      />
                      <label
                        htmlFor={`chole-appearance-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.intraoperative?.gallbladderAppearance).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify other gallbladder appearance"
                      value={cholecystectomy.intraoperative?.gallbladderAppearanceOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "intraoperative",
                          "gallbladderAppearanceOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Adhesions to Gall Bladder:
                </p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {adhesionOptions.map((option) => (
                    <div className="flex items-center" key={`chole-adhesion-${option}`}>
                      <Checkbox
                        id={`chole-adhesion-${option}`}
                        checked={cholecystectomy.intraoperative?.adhesionsToGallbladder === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy(
                              "intraoperative",
                              "adhesionsToGallbladder",
                              option
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`chole-adhesion-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Stones Present:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {stonesPresentOptions.map((option) => (
                    <div className="flex items-center" key={`stones-present-${option}`}>
                      <Checkbox
                        id={`stones-present-${option}`}
                        checked={cholecystectomy.intraoperative?.stonesPresent === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy("intraoperative", "stonesPresent", option);
                          }
                        }}
                      />
                      <label
                        htmlFor={`stones-present-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Type of Stones:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {typeOfStonesOptions.map((option) => (
                    <div className="flex items-center" key={`type-of-stones-${option}`}>
                      <Checkbox
                        id={`type-of-stones-${option}`}
                        checked={cholecystectomy.intraoperative?.typeOfStones === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy("intraoperative", "typeOfStones", option);
                          }
                        }}
                      />
                      <label
                        htmlFor={`type-of-stones-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {cholecystectomy.intraoperative?.typeOfStones === "Other" && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Type of Stone"
                      value={cholecystectomy.intraoperative?.typeOfStonesOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy("intraoperative", "typeOfStonesOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Size of Stones:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {sizeOfStonesOptions.map((option) => (
                    <div className="flex items-center" key={`size-of-stones-${option}`}>
                      <Checkbox
                        id={`size-of-stones-${option}`}
                        checked={cholecystectomy.intraoperative?.sizeOfStones === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy("intraoperative", "sizeOfStones", option);
                          }
                        }}
                      />
                      <label
                        htmlFor={`size-of-stones-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader(
          "Procedure Details",
          "procedure",
          <Scissors className="h-5 w-5 text-gray-600" />,
          "procedure"
        )}
        {expanded.procedure && (
          <CardContent className="px-6 py-4">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Surgical Approach:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {approachOptions.map((option) => (
                    <div className="flex items-center" key={`chole-approach-${option}`}>
                      <Checkbox
                        id={`chole-approach-${option}`}
                        checked={toArray(cholecystectomy.procedure?.approach).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "approach",
                            option,
                            cholecystectomy.procedure?.approach
                          )
                        }
                      />
                      <label
                        htmlFor={`chole-approach-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {isConvertedToOpen() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Reason for Conversion:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {conversionReasonOptions.map((option) => (
                      <div className="flex items-center" key={`chole-conversion-${option}`}>
                        <Checkbox
                          id={`chole-conversion-${option}`}
                          checked={toArray(cholecystectomy.procedure?.reasonForConversion).includes(
                            option
                          )}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "reasonForConversion",
                              option,
                              cholecystectomy.procedure?.reasonForConversion
                            )
                          }
                        />
                        <label
                          htmlFor={`chole-conversion-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(cholecystectomy.procedure?.reasonForConversion).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify other reason for conversion"
                        value={cholecystectomy.procedure?.reasonForConversionOther || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "reasonForConversionOther",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {isLaparoscopicOrConverted() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Number of Ports Inserted:
                  </p>
                  <Input
                    type="text"
                    className="ml-4 w-full"
                    placeholder="Enter Number of Ports Inserted"
                    value={cholecystectomy.procedure?.numberOfPortsInserted || ""}
                    onChange={(e) =>
                      updateCholecystectomy("procedure", "numberOfPortsInserted", e.target.value)
                    }
                  />
                </div>
              )}

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Access and Ports</h3>
                <div className="mb-4 sm:ml-4">
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="font-medium text-gray-700 text-sm mb-2">Legend:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-black"></div>
                        <span>Ports (with size label)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 border-2 border-amber-500 rounded-full"
                          style={{ borderStyle: "dashed" }}
                        ></div>
                        <span>Ileostomy (dashed yellow circle)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-green-600 rounded-full"></div>
                        <span>Colostomy (solid green circle)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-0.5 bg-red-900"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(90deg, #7f1d1d 0, #7f1d1d 4px, transparent 4px, transparent 8px)",
                          }}
                        ></div>
                        <span>Incisions (dashed dark red line)</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:ml-4">{diagramElement}</div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Subtotal Cholecystectomy:
                </p>
                <div className="flex space-x-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`subtotal-${option}`}>
                      <Checkbox
                        id={`subtotal-${option}`}
                        checked={cholecystectomy.procedure?.subtotalCholecystectomy === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy(
                              "procedure",
                              "subtotalCholecystectomy",
                              option
                            );
                          }
                        }}
                      />
                      <label htmlFor={`subtotal-${option}`} className="ml-2 block text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {isSubtotalSelected() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Reason for Subtotal Cholecystectomy:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {subtotalReasonOptions.map((option) => (
                      <div className="flex items-center" key={`subtotal-reason-${option}`}>
                        <Checkbox
                          id={`subtotal-reason-${option}`}
                          checked={toArray(cholecystectomy.procedure?.subtotalReason).includes(
                            option
                          )}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "subtotalReason",
                              option,
                              cholecystectomy.procedure?.subtotalReason
                            )
                          }
                        />
                        <label
                          htmlFor={`subtotal-reason-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(cholecystectomy.procedure?.subtotalReason).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Other Subtotal Reason"
                        value={cholecystectomy.procedure?.subtotalReasonOther || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "subtotalReasonOther",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Adhesiolysis:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {adhesiolysisOptions.map((option) => (
                    <div className="flex items-center" key={`adhesiolysis-${option}`}>
                      <Checkbox
                        id={`adhesiolysis-${option}`}
                        checked={cholecystectomy.procedure?.adhesiolysis === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy("procedure", "adhesiolysis", option);
                          }
                        }}
                      />
                      <label htmlFor={`adhesiolysis-${option}`} className="ml-2 block text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Extent of Cholecystectomy:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {extentOfCholecystectomyOptions.map((option) => (
                    <div className="flex items-center" key={`extent-of-chole-${option}`}>
                      <Checkbox
                        id={`extent-of-chole-${option}`}
                        checked={cholecystectomy.procedure?.extentOfCholecystectomy === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy("procedure", "extentOfCholecystectomy", option);
                          }
                        }}
                      />
                      <label htmlFor={`extent-of-chole-${option}`} className="ml-2 block text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {cholecystectomy.procedure?.extentOfCholecystectomy === "Other" && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Extent of Cholecystectomy"
                      value={cholecystectomy.procedure?.extentOfCholecystectomyOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "extentOfCholecystectomyOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              {isSubtotalCholecystectomyRequired() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Method of Subtotal Cholecystectomy Control:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {subtotalCholecystectomyControlOptions.map((option) => (
                      <div className="flex items-center" key={`subtotal-control-${option}`}>
                        <Checkbox
                          id={`subtotal-control-${option}`}
                          checked={toArray(cholecystectomy.procedure?.methodOfSubtotalControl).includes(
                            option
                          )}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "methodOfSubtotalControl",
                              option,
                              cholecystectomy.procedure?.methodOfSubtotalControl
                            )
                          }
                        />
                        <label
                          htmlFor={`subtotal-control-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(cholecystectomy.procedure?.methodOfSubtotalControl).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Other Subtotal Cholecystectomy Control"
                        value={cholecystectomy.procedure?.methodOfSubtotalControlOther || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "methodOfSubtotalControlOther",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Gall Bladder Decompression Required:
                </p>
                <div className="flex space-x-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`decompression-${option}`}>
                      <Checkbox
                        id={`decompression-${option}`}
                        checked={
                          cholecystectomy.procedure?.gallbladderDecompressionRequired === option
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy(
                              "procedure",
                              "gallbladderDecompressionRequired",
                              option
                            );
                          }
                        }}
                      />
                      <label htmlFor={`decompression-${option}`} className="ml-2 block text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-800">Critical View of Safety</h3>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Critical View of Safety Confirmation:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {criticalViewSafetyConfirmationOptions.map((option) => (
                      <div className="flex items-center" key={`critical-view-confirmation-${option}`}>
                        <Checkbox
                          id={`critical-view-confirmation-${option}`}
                          checked={toArray(
                            cholecystectomy.procedure?.criticalViewSafetyConfirmation
                          ).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "criticalViewSafetyConfirmation",
                              option,
                              cholecystectomy.procedure?.criticalViewSafetyConfirmation
                            )
                          }
                        />
                        <label
                          htmlFor={`critical-view-confirmation-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(cholecystectomy.procedure?.criticalViewSafetyConfirmation).includes(
                    "Other"
                  ) && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Other Critical View of Safety Confirmation"
                        value={cholecystectomy.procedure?.criticalViewSafetyConfirmationOther || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "criticalViewSafetyConfirmationOther",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
                {[
                  ["Calot's Triangle Dissected:", "calotsTriangleDissected"],
                  ["Cystic Duct Identified:", "cysticDuctIdentified"],
                  ["Cystic Artery Identified:", "cysticArteryIdentified"],
                  [
                    "Two Structures Entering Gall Bladder Confirmed:",
                    "twoStructuresConfirmed",
                  ],
                ].map(([label, field]) => (
                  <div key={field}>
                    <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                    <div className="flex space-x-4 ml-4">
                      {["Yes", "No"].map((option) => (
                        <div className="flex items-center" key={`${field}-${option}`}>
                          <Checkbox
                            id={`${field}-${option}`}
                            checked={cholecystectomy.procedure?.[field] === option}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCholecystectomy("procedure", field, option);
                              }
                            }}
                          />
                          <label htmlFor={`${field}-${option}`} className="ml-2 block text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cystic Duct Control:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {cysticDuctControlOptions.map((option) => (
                    <div className="flex items-center" key={`duct-control-${option}`}>
                      <Checkbox
                        id={`duct-control-${option}`}
                        checked={toArray(cholecystectomy.procedure?.cysticDuctControl).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "cysticDuctControl",
                            option,
                            cholecystectomy.procedure?.cysticDuctControl
                          )
                        }
                      />
                      <label
                        htmlFor={`duct-control-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.procedure?.cysticDuctControl).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Cystic Duct Control"
                      value={cholecystectomy.procedure?.cysticDuctControlOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "cysticDuctControlOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cystic Artery Control:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {cysticArteryControlOptions.map((option) => (
                    <div className="flex items-center" key={`artery-control-${option}`}>
                      <Checkbox
                        id={`artery-control-${option}`}
                        checked={toArray(cholecystectomy.procedure?.cysticArteryControl).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "cysticArteryControl",
                            option,
                            cholecystectomy.procedure?.cysticArteryControl
                          )
                        }
                      />
                      <label
                        htmlFor={`artery-control-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.procedure?.cysticArteryControl).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Cystic Artery Control"
                      value={cholecystectomy.procedure?.cysticArteryControlOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "cysticArteryControlOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Gall Bladder Dissected from Liver Bed:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {liverBedDissectionOptions.map((option) => (
                    <div className="flex items-center" key={`liver-bed-${option}`}>
                      <Checkbox
                        id={`liver-bed-${option}`}
                        checked={toArray(
                          cholecystectomy.procedure?.gallbladderDissectedFromLiverBed
                        ).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "gallbladderDissectedFromLiverBed",
                            option,
                            cholecystectomy.procedure?.gallbladderDissectedFromLiverBed
                          )
                        }
                      />
                      <label
                        htmlFor={`liver-bed-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.procedure?.gallbladderDissectedFromLiverBed).includes(
                  "Other"
                ) && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Liver Bed Dissection Method"
                      value={
                        cholecystectomy.procedure?.gallbladderDissectedFromLiverBedOther || ""
                      }
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "gallbladderDissectedFromLiverBedOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Hemostasis:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {hemostasisOptions.map((option) => (
                    <div className="flex items-center" key={`hemostasis-${option}`}>
                      <Checkbox
                        id={`hemostasis-${option}`}
                        checked={toArray(cholecystectomy.procedure?.hemostasis).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "hemostasis",
                            option,
                            cholecystectomy.procedure?.hemostasis
                          )
                        }
                      />
                      <label
                        htmlFor={`hemostasis-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.procedure?.hemostasis).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Hemostasis Method"
                      value={cholecystectomy.procedure?.hemostasisOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy("procedure", "hemostasisOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Bile Spillage:</p>
                  <div className="flex space-x-4">
                    {["Yes", "No"].map((option) => (
                      <div className="flex items-center" key={`bile-spillage-${option}`}>
                        <Checkbox
                          id={`bile-spillage-${option}`}
                          checked={cholecystectomy.procedure?.bileSpillage === option}
                          onCheckedChange={(checked) => {
                            if (checked) updateCholecystectomy("procedure", "bileSpillage", option);
                          }}
                        />
                        <label htmlFor={`bile-spillage-${option}`} className="ml-2 block text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Stones Spillage:</p>
                  <div className="flex space-x-4">
                    {["Yes", "No"].map((option) => (
                      <div className="flex items-center" key={`stones-spillage-${option}`}>
                        <Checkbox
                          id={`stones-spillage-${option}`}
                          checked={cholecystectomy.procedure?.stonesSpillage === option}
                          onCheckedChange={(checked) => {
                            if (checked) updateCholecystectomy("procedure", "stonesSpillage", option);
                          }}
                        />
                        <label htmlFor={`stones-spillage-${option}`} className="ml-2 block text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Additional Procedures:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {additionalProcedureOptions.map((option) => (
                    <div className="flex items-center" key={`additional-procedure-${option}`}>
                      <Checkbox
                        id={`additional-procedure-${option}`}
                        checked={toArray(cholecystectomy.procedure?.additionalProcedures).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "additionalProcedures",
                            option,
                            cholecystectomy.procedure?.additionalProcedures
                          )
                        }
                      />
                      <label
                        htmlFor={`additional-procedure-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>

                {hasAdditionalDrain() && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Drain insertion site"
                      value={cholecystectomy.procedure?.additionalProcedureDrainSite || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "additionalProcedureDrainSite",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}

                {toArray(cholecystectomy.procedure?.additionalProcedures).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Additional Procedure"
                      value={cholecystectomy.procedure?.additionalProceduresOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "additionalProceduresOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              {hasCholangiogram() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Cholangiogram Findings (if done):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {cholangiogramFindingOptions.map((option) => (
                      <div className="flex items-center" key={`cholangiogram-${option}`}>
                        <Checkbox
                          id={`cholangiogram-${option}`}
                          checked={toArray(cholecystectomy.procedure?.cholangiogramFindings).includes(
                            option
                          )}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "cholangiogramFindings",
                              option,
                              cholecystectomy.procedure?.cholangiogramFindings
                            )
                          }
                        />
                        <label
                          htmlFor={`cholangiogram-${option}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>

                  {toArray(cholecystectomy.procedure?.cholangiogramFindings).includes(
                    "Ductal Stricture"
                  ) && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Ductal Stricture Site"
                        value={cholecystectomy.procedure?.cholangiogramStrictureSite || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "cholangiogramStrictureSite",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  {toArray(cholecystectomy.procedure?.cholangiogramFindings).includes(
                    "Dilatation"
                  ) && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Dilatation"
                        value={cholecystectomy.procedure?.cholangiogramDilatation || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "cholangiogramDilatation",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  {toArray(cholecystectomy.procedure?.cholangiogramFindings).includes("Leaks") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Leak Site"
                        value={cholecystectomy.procedure?.cholangiogramLeakSite || ""}
                        onChange={(e) =>
                          updateCholecystectomy(
                            "procedure",
                            "cholangiogramLeakSite",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  {toArray(cholecystectomy.procedure?.cholangiogramFindings).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify Other Cholangiogram Finding"
                        value={cholecystectomy.procedure?.cholangiogramOther || ""}
                        onChange={(e) =>
                          updateCholecystectomy("procedure", "cholangiogramOther", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Gall Bladder Retrieval:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {gallbladderRetrievalOptions.map((option) => (
                    <div className="flex items-center" key={`retrieval-${option}`}>
                      <Checkbox
                        id={`retrieval-${option}`}
                        checked={toArray(cholecystectomy.procedure?.gallbladderRetrieval).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "gallbladderRetrieval",
                            option,
                            cholecystectomy.procedure?.gallbladderRetrieval
                          )
                        }
                      />
                      <label
                        htmlFor={`retrieval-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.procedure?.gallbladderRetrieval).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Retrieval Method"
                      value={cholecystectomy.procedure?.gallbladderRetrievalOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "procedure",
                          "gallbladderRetrievalOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Use Of Specimen Bag:</p>
                <div className="flex space-x-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`use-specimen-bag-${option}`}>
                      <Checkbox
                        id={`use-specimen-bag-${option}`}
                        checked={cholecystectomy.procedure?.useOfSpecimenBag === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCholecystectomy("procedure", "useOfSpecimenBag", option);
                          }
                        }}
                      />
                      <label htmlFor={`use-specimen-bag-${option}`} className="ml-2 block text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Peritoneal Lavage:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {peritonealLavageOptions.map((option) => (
                    <div className="flex items-center" key={`peritoneal-lavage-${option}`}>
                      <Checkbox
                        id={`peritoneal-lavage-${option}`}
                        checked={toArray(cholecystectomy.procedure?.peritonealLavage).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "peritonealLavage",
                            option,
                            cholecystectomy.procedure?.peritonealLavage
                          )
                        }
                      />
                      <label
                        htmlFor={`peritoneal-lavage-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.procedure?.peritonealLavage).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Peritoneal Lavage"
                      value={cholecystectomy.procedure?.peritonealLavageOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy("procedure", "peritonealLavageOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Drain Insertion:</p>
                <div className="flex space-x-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`drain-insertion-${option}`}>
                      <Checkbox
                        id={`drain-insertion-${option}`}
                        checked={cholecystectomy.procedure?.drainInsertion === option}
                        onCheckedChange={(checked) => {
                          if (checked) updateCholecystectomy("procedure", "drainInsertion", option);
                        }}
                      />
                      <label htmlFor={`drain-insertion-${option}`} className="ml-2 block text-sm">{option}</label>
                    </div>
                  ))}
                </div>
                {cholecystectomy.procedure?.drainInsertion === "Yes" && (
                  <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4 mt-3">
                    <h4 className="font-medium text-gray-800">Drain Details</h4>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Type of Drain:</p>
                      <div className="grid grid-cols-1 gap-2 ml-4">
                        {['Open','Closed Suction Drain','Closed Passive Drain','Other'].map((type) => (
                          <div className="flex items-center" key={`ch-drain-type-${type}`}>
                            <Checkbox
                              id={`ch-drain-type-${type}`}
                              checked={toArray(cholecystectomy.procedure?.drainType).includes(type)}
                              onCheckedChange={() => toggleArrayValue('procedure','drainType',type,cholecystectomy.procedure?.drainType)}
                            />
                            <label htmlFor={`ch-drain-type-${type}`} className="ml-2 text-sm">{type}</label>
                          </div>
                        ))}
                      </div>
                      {toArray(cholecystectomy.procedure?.drainType).includes('Other') && (
                        <div className="mt-3 ml-4">
                          <Input type="text" placeholder="Specify Drain Type" value={cholecystectomy.procedure?.drainTypeOther || ''} onChange={(e)=>updateCholecystectomy('procedure','drainTypeOther',e.target.value)} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Intra-Peritoneal Placement:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {['Right Subhepatic','Left Subhepatic','Pelvis','Adjacent to Site','Other'].map((p)=> (
                          <div className="flex items-center" key={`ch-drain-placement-${p}`}>
                            <Checkbox id={`ch-drain-placement-${p}`} checked={toArray(cholecystectomy.procedure?.intraPeritonealPlacement).includes(p)} onCheckedChange={()=>toggleArrayValue('procedure','intraPeritonealPlacement',p,cholecystectomy.procedure?.intraPeritonealPlacement)} />
                            <label htmlFor={`ch-drain-placement-${p}`} className="ml-2 text-sm">{p}</label>
                          </div>
                        ))}
                      </div>
                      {toArray(cholecystectomy.procedure?.intraPeritonealPlacement).includes('Other') && (
                        <div className="mt-3 ml-4">
                          <Input
                            type="text"
                            placeholder="Specify Intra-Peritoneal Placement"
                            value={cholecystectomy.procedure?.intraPeritonealPlacementOther || ''}
                            onChange={(e) =>
                              updateCholecystectomy(
                                'procedure',
                                'intraPeritonealPlacementOther',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Exit Site:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {['Right Upper Quadrant','Right Lower Quadrant','Left Upper Quadrant','Left Lower Quadrant','Other'].map((site)=> (
                          <div className="flex items-center" key={`ch-drain-exit-${site}`}>
                            <Checkbox id={`ch-drain-exit-${site}`} checked={toArray(cholecystectomy.procedure?.drainExitSite).includes(site)} onCheckedChange={()=>toggleArrayValue('procedure','drainExitSite',site,cholecystectomy.procedure?.drainExitSite)} />
                            <label htmlFor={`ch-drain-exit-${site}`} className="ml-2 text-sm">{site}</label>
                          </div>
                        ))}
                      </div>
                      {toArray(cholecystectomy.procedure?.drainExitSite).includes('Other') && (
                        <div className="mt-3 ml-4">
                          <Input
                            type="text"
                            placeholder="Specify Exit Site"
                            value={cholecystectomy.procedure?.drainExitSiteOther || ''}
                            onChange={(e) =>
                              updateCholecystectomy('procedure', 'drainExitSiteOther', e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader(
          "Closure",
          "closure",
          <Shield className="h-5 w-5 text-gray-600" />,
          "closure"
        )}
        {expanded.closure && (
          <CardContent className="px-6 py-4">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure:</p>
                <div className="flex space-x-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`fascial-closure-${option}`}>
                      <Checkbox id={`fascial-closure-${option}`} checked={cholecystectomy.closure?.fascialClosure === option} onCheckedChange={(checked)=>{ if(checked) updateCholecystectomy('closure','fascialClosure',option); }} />
                      <label htmlFor={`fascial-closure-${option}`} className="ml-2 block text-sm">{option}</label>
                    </div>
                  ))}
                </div>
                {cholecystectomy.closure?.fascialClosure === 'Yes' && (
                  <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4 mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure Sites:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {['5mm Port Sites','10/11mm Port Sites','12mm Port Sites','15mm Port Sites','Access Incision'].map((c)=> (
                        <div className="flex items-center" key={`ch-fascial-site-${c}`}>
                          <Checkbox id={`ch-fascial-site-${c}`} checked={toArray(cholecystectomy.closure?.fascialClosureSites).includes(c)} onCheckedChange={()=>toggleArrayValue('closure','fascialClosureSites',c,cholecystectomy.closure?.fascialClosureSites)} />
                          <label htmlFor={`ch-fascial-site-${c}`} className="ml-2 text-sm">{c}</label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Suture Material:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {['Vicryl','PDS','Prolene','Other'].map((m)=> (
                        <div className="flex items-center" key={`ch-fascial-material-${m}`}>
                          <Checkbox id={`ch-fascial-material-${m}`} checked={toArray(cholecystectomy.closure?.fascialSutureMaterial).includes(m)} onCheckedChange={()=>toggleArrayValue('closure','fascialSutureMaterial',m,cholecystectomy.closure?.fascialSutureMaterial)} />
                          <label htmlFor={`ch-fascial-material-${m}`} className="ml-2 text-sm">{m}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Skin Closure:</p>
                <div className="flex space-x-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`skin-closure-yn-${option}`}>
                      <Checkbox id={`skin-closure-yn-${option}`} checked={cholecystectomy.closure?.skinClosure === option} onCheckedChange={(checked)=>{ if(checked) updateCholecystectomy('closure','skinClosure',option); }} />
                      <label htmlFor={`skin-closure-yn-${option}`} className="ml-2 block text-sm">{option}</label>
                    </div>
                  ))}
                </div>
                {cholecystectomy.closure?.skinClosure === 'Yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4 mt-3">
                  {skinClosureOptions.map((option) => (
                    <div className="flex items-center" key={`skin-closure-${option}`}>
                      <Checkbox
                        id={`skin-closure-${option}`}
                        checked={toArray(cholecystectomy.closure?.skinClosureMethod).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "closure",
                            "skinClosureMethod",
                            option,
                            cholecystectomy.closure?.skinClosureMethod
                          )
                        }
                      />
                      <label
                        htmlFor={`skin-closure-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                )}
                {cholecystectomy.closure?.skinClosure === 'Yes' && toArray(cholecystectomy.closure?.skinClosureMethod).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Skin Closure Method"
                      value={cholecystectomy.closure?.skinClosureOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy("closure", "skinClosureOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Specimen</h3>
                <div className="space-y-4 ml-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Use Of Specimen Bag:</p>
                    <div className="flex space-x-4">
                      {["Yes", "No"].map((option) => (
                        <div className="flex items-center" key={`specimen-histology-bag-${option}`}>
                          <Checkbox
                            id={`specimen-histology-bag-${option}`}
                            checked={cholecystectomy.closure?.useOfSpecimenBag === option}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCholecystectomy("closure", "useOfSpecimenBag", option);
                              }
                            }}
                          />
                          <label
                            htmlFor={`specimen-histology-bag-${option}`}
                            className="ml-2 block text-sm"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Gallbladder Sent For Histology:
                    </p>
                    <div className="flex space-x-4">
                      {["Yes", "No"].map((option) => (
                        <div className="flex items-center" key={`histology-${option}`}>
                          <Checkbox
                            id={`histology-${option}`}
                            checked={
                              cholecystectomy.closure?.gallbladderSentForHistology === option
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCholecystectomy(
                                  "closure",
                                  "gallbladderSentForHistology",
                                  option
                                );
                              }
                            }}
                          />
                          <label htmlFor={`histology-${option}`} className="ml-2 block text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {cholecystectomy.closure?.gallbladderSentForHistology === "Yes" && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Please Specify Laboratory Sent To:
                      </p>
                      <Input
                        type="text"
                        placeholder="Enter laboratory name"
                        value={cholecystectomy.closure?.laboratoryName || ""}
                        onChange={(e) =>
                          updateCholecystectomy("closure", "laboratoryName", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Intra-Operative Difficulty:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {intraoperativeDifficultyOptions.map((option) => (
                    <div className="flex items-center" key={`difficulty-${option}`}>
                      <Checkbox
                        id={`difficulty-${option}`}
                        checked={toArray(cholecystectomy.closure?.intraoperativeDifficulty).includes(
                          option
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "closure",
                            "intraoperativeDifficulty",
                            option,
                            cholecystectomy.closure?.intraoperativeDifficulty
                          )
                        }
                      />
                      <label
                        htmlFor={`difficulty-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.closure?.intraoperativeDifficulty).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Intra-Operative Difficulty"
                      value={cholecystectomy.closure?.intraoperativeDifficultyOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy(
                          "closure",
                          "intraoperativeDifficultyOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Complications:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {complicationOptions.map((option) => (
                    <div className="flex items-center" key={`complication-${option}`}>
                      <Checkbox
                        id={`complication-${option}`}
                        checked={toArray(cholecystectomy.closure?.complications).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "closure",
                            "complications",
                            option,
                            cholecystectomy.closure?.complications
                          )
                        }
                      />
                      <label
                        htmlFor={`complication-${option}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(cholecystectomy.closure?.complications).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify Other Complication"
                      value={cholecystectomy.closure?.complicationsOther || ""}
                      onChange={(e) =>
                        updateCholecystectomy("closure", "complicationsOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-600" />
              Additional Information
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onUndo?.("additionalInfo")}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onRedo?.("additionalInfo")}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={() => onClear?.("additionalInfo")}
                title="Clear Section"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Enter any additional information"
            value={cholecystectomy.additionalInfo?.additionalInformation || ""}
            onChange={(e) =>
              updateCholecystectomy("additionalInfo", "additionalInformation", e.target.value)
            }
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardList className="h-4 w-4 text-gray-600" />
            Post Operative Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Enter post operative management details"
            value={cholecystectomy.additionalInfo?.postOperativeManagement || ""}
            onChange={(e) =>
              updateCholecystectomy("additionalInfo", "postOperativeManagement", e.target.value)
            }
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-gray-600" />
            Surgeon's Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Surgeon's Signature:</p>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Type signature name or leave blank to upload"
                  value={cholecystectomy.additionalInfo?.surgeonSignatureText || ""}
                  onChange={(e) =>
                    updateCholecystectomy("additionalInfo", "surgeonSignatureText", e.target.value)
                  }
                />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateCholecystectomy(
                        "additionalInfo",
                        "surgeonSignature",
                        reader.result as string
                      );
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-xs text-gray-500">Upload signature or stamp (Image/PDF)</p>
                {cholecystectomy.additionalInfo?.surgeonSignature && (
                  <div className="space-y-1">
                    <p className="text-xs text-green-600">✓ Signature uploaded</p>
                    <div className="border rounded p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img
                        src={cholecystectomy.additionalInfo.surgeonSignature}
                        alt="Signature preview"
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Date/Time:</p>
              <div className="space-y-2">
                <DateTimeDDMMYYYY24HourInput
                  value={cholecystectomy.additionalInfo?.dateTime || getLocalDateTimeValue()}
                  onChange={(value) =>
                    updateCholecystectomy("additionalInfo", "dateTime", value)
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1"
                  onClick={() =>
                    updateCholecystectomy("additionalInfo", "dateTime", getLocalDateTimeValue())
                  }
                >
                  Set Current Date/Time
                </Button>
                {cholecystectomy.additionalInfo?.dateTime && (
                  <p className="text-xs text-gray-500">
                    Display format:{" "}
                    {formatDateTimeDDMMYYYYWithDashes(cholecystectomy.additionalInfo.dateTime)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {onExportPDF ? (
              <Button
                variant="outline"
                size="sm"
                className="glass-button text-xs"
                disabled={isGeneratingPDF}
                onClick={onExportPDF}
                type="button"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Print/Export PDF"}
              </Button>
            ) : null}
            {onSavePatient ? (
              <Button
                variant="outline"
                size="sm"
                className="glass-button text-xs"
                onClick={onSavePatient}
                type="button"
              >
                <FileText className="w-4 h-4 mr-2" />
                Save Patient
              </Button>
            ) : null}
            {onClearAll ? (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={onClearAll}
                type="button"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
