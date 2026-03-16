import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import { formatDateTimeDDMMYYYYWithDashes, getLocalDateTimeValue } from "@/utils/dateFormatter";
import { initialPeriAnalState } from "@/utils/periAnal";
import {
  Activity,
  ChevronDown,
  ClipboardList,
  Download,
  FileSearch,
  FileText,
  Redo2,
  RotateCcw,
  Scissors,
  Shield,
  Undo2,
  User,
} from "lucide-react";

interface PeriAnalFormProps {
  currentReport: any;
  updatePeriAnal: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onClear?: (section: string) => void;
  onClearAll?: () => void;
  onUndo?: (section: string) => void;
  onRedo?: (section: string) => void;
  onExportPDF?: () => void;
  isGeneratingPDF?: boolean;
  diagramElement?: React.ReactNode;
}

const urgencyOptions = ["Elective", "Semi-Elective", "Semi-Urgent", "Emergency"];
const imagingOptions = ["None", "Ultrasound", "CT Scan", "MRI", "X-Ray", "Contrast Study", "Other"];
const positionInTheatreOptions = [
  "Lithotomy",
  "Prone Jackknife",
  "Lloyd-Davis Position",
  "Left Lateral",
  "Prone",
  "Other",
];
const findingOptions = [
  "Perianal Abscess",
  "Perianal Fistula",
  "Fissure-In-Ano",
  "Haemorrhoids",
  "Warts",
  "Hidradenitis Suppurativa",
  "Necrotising Fasciitis",
  "Mass / Lesion",
  "Other",
];
const abscessLocationOptions = [
  "Perianal / Subcutaneous",
  "Ischiorectal",
  "Intersphincteric",
  "Supralevator",
  "Post Anal Space",
];
const abscessSiteOptions = ["Left", "Right", "Anterior", "Posterior", "Other"];
const abscessSkinOptions = ["Normal", "Indurated", "Cellulitis", "Necrotic", "Draining Sinus", "Other"];
const abscessProcedureOptions = ["Incision And Drainage", "Cruciate Incision", "Deroofing", "Other"];
const abscessWoundControlOptions = [
  "Left Open",
  "Packed",
  "Closed Primarily",
  "Absorbent Dressing",
  "Other",
];
const fistulaClassificationOptions = [
  "Intersphincteric",
  "Transsphincteric",
  "Suprasphincteric",
  "Extrasphincteric",
];
const fistulaInternalPositionOptions = [
  "Below Dentate Line",
  "At Dentate Line",
  "Above Dentate Line",
  "Above Anorectal Ring",
  "Other",
];
const fistulaProcedureOptions = [
  "Fistulotomy",
  "Seton Insertion",
  "LIFT",
  "Advancement Flap",
  "Plug / Glue",
  "Fistulectomy",
  "Other",
];
const fistulaMethodOptions = ["Probing", "Hydrogen Peroxide Instillation", "Methylene Blue", "Other"];
const setonMaterialOptions = ["Vessel Loop", "Silicone Catheter", "Nylon", "Silk", "Other"];
const liftDissectionOptions = ["Sharp", "Blunt", "Diathermy", "Combined"];
const tractManagementOptions = ["None", "Curettage", "Excision", "Other"];
const plugTypeOptions = ["Biologic Plug (Porcine SIS)", "Synthetic Plug", "Other"];
const glueTypeOptions = ["Fibrin Sealant", "Synthetic Sealant"];
const plugIrrigationOptions = ["Saline", "Hydrogen Peroxide", "Antiseptic Solution", "None", "Other"];
const plugInsertionOptions = [
  "Internal Opening To External Opening",
  "External To Internal",
  "From Both Ends",
];
const fissureLocationOptions = ["Posterior", "Anterior", "Left Lateral", "Right Lateral", "Other"];
const fissureHeightOptions = ["Below Dentate Line", "Up To Dentate Line", "Above Dentate", "Other"];
const fissureProcedureOptions = [
  "Botox",
  "Lateral Internal Sphincterotomy",
  "Fissurectomy",
  "Advancement Flap",
  "Suture Of Fissure",
  "Curettage",
  "Other",
];
const botoxDoseOptions = ["25", "50", "100", "200", "Other"];
const botoxMuscleOptions = [
  "Internal Sphincter Muscle",
  "Intersphincteric Plane",
  "External Sphincter Muscle",
  "Other",
];
const haemorrhoidTypeOptions = ["Internal", "External", "Internal And External"];
const haemorrhoidGradeOptions = ["I", "II", "III", "IV"];
const haemorrhoidColumnOptions = [
  "Left Lateral",
  "Right Anterior",
  "Right Posterior",
  "Circumferential",
  "Other",
];
const haemorrhoidComplicationOptions = [
  "None",
  "Thrombosis",
  "Ulceration",
  "Strangulated",
  "Necrotic / Gangrenous",
  "Other",
];
const haemorrhoidProcedureOptions = [
  "Open Haemorrhoidectomy (Milligan-Morgan)",
  "Closed Haemorrhoidectomy (Ferguson)",
  "Stapled Haemorrhoidectomy",
  "Circumferential Excisional Haemorrhoidectomy",
  "Haemorrhoidal Banding",
  "Doppler Guided Haemorrhoidal Artery Ligation And Rectoanal Repair (THD / HALRAR)",
  "Laser Haemorrhoidoplasty",
  "Radiofrequency Ablation",
  "Sclerotherapy",
  "Other",
];
const wartDistributionOptions = [
  "Perianal Skin",
  "Perineum",
  "Anal Verge",
  "Anal Canal",
  "Scrotum / Vulva",
  "Buttocks",
  "Inguinal Region",
  "Other",
];
const wartMorphologyOptions = ["Sessile", "Pedunculated", "Cauliflower Type", "Confluent Plaques"];
const wartExcisionMethodOptions = [
  "Sharp Surgical Excision",
  "Electrocautery Ablation",
  "Energy Device Excision",
  "Laser Ablation",
  "Curettage",
  "Other",
];
const wartDepthOptions = ["Epidermal", "Dermal", "Subcutaneous"];
const hidradenitisSiteOptions = ["Perianal", "Perineal", "Gluteal", "Scrotal / Labial", "Inguinal", "Sacral"];
const hidradenitisSkinOptions = ["Normal", "Indurated", "Fibrotic", "Scarred", "Macerated"];
const hidradenitisDepthOptions = [
  "Skin Involvement",
  "Subcutaneous Extension",
  "Anal Sphincter",
  "Ischiorectal Fossa",
  "Perineal Body",
  "Genital Structures",
  "Fascia",
  "Urethra",
  "Other",
];
const hidradenitisProcedureOptions = [
  "Curettage",
  "Incision And Drainage",
  "Deroofing Of Sinus Tracts",
  "Excision",
  "Staged Excision",
  "Other",
];
const necrotisingInvolvedAreaOptions = [
  "Perianal Region",
  "Perineum",
  "Scrotum",
  "Penis",
  "Vulva",
  "Groin",
  "Abdominal Wall",
  "Buttocks",
];
const necrotisingDepthOptions = [
  "Skin Involvement",
  "Subcutaneous Extension",
  "Anal Sphincter",
  "Ischiorectal Fossa",
  "Perineal Body",
  "Genital Structures",
  "Superficial Fascia",
  "Deep Fascia",
  "Muscle Involvement",
  "Urethra",
  "Other",
];
const necrotisingEtiologyOptions = [
  "Perianal Abscess",
  "Fistula In Ano",
  "Urogenital Source",
  "Skin Infection",
  "Unknown",
];
const massLocationOptions = ["Perianal", "Anal Verge", "Anal Canal", "Ischiorectal Region", "Gluteal Region"];
const massSurfaceOptions = [
  "Normal Skin",
  "Hyperpigmentation",
  "Hypopigmentation",
  "Erythema",
  "Induration",
  "Raised",
  "Flat",
  "Ulcerated",
  "Mass",
  "Necrotic",
  "Other",
];
const massConsistencyOptions = ["Soft", "Firm", "Fluctuant", "Hard", "Warty Appearance", "Other"];
const massDiagnosisOptions = [
  "Perianal Abscess",
  "Fistula-Related Mass",
  "Condyloma",
  "Epidermoid Cyst",
  "Lipoma",
  "Suspicious Malignancy",
  "Hidradenitis",
  "Other",
];
const massProcedureOptions = [
  "Inspection Only",
  "Palpation And Mapping Of Lesion",
  "Biopsy",
  "Excisional Biopsy",
  "Core Needle Biopsy",
  "Probing",
  "Curettage",
  "Incision And Drainage",
  "Other",
];
const woundIrrigationOptions = ["Sterile Water", "Saline", "Hydrogen Peroxide", "Antiseptic Solution", "Other"];
const woundClosureOptions = ["Not Applicable", "Left Open", "Primary Closure", "Partial Closure"];
const dressingOptions = [
  "Standard Dressing",
  "Paraffin Gauze",
  "Packing Gauze",
  "Antimicrobial Dressing",
  "Negative Pressure Wound Therapy (VAC)",
  "Other",
];
const intraoperativeComplicationOptions = [
  "None",
  "Bleeding",
  "Anaesthetic Complication",
  "Injury To Sphincter",
  "Urethral Injury",
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

const FieldRow = ({
  label,
  children,
  multiline = false,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
}) => (
  <div className={`space-y-2 ${multiline ? "" : ""}`}>
    <label className="block text-gray-800 font-medium">{label}</label>
    <div>{children}</div>
  </div>
);

export const PeriAnalForm = ({
  currentReport,
  updatePeriAnal,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onClear,
  onUndo,
  onRedo,
  onExportPDF,
  isGeneratingPDF = false,
  diagramElement,
}: PeriAnalFormProps) => {
  const periAnal = currentReport.periAnal || initialPeriAnalState;

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    Object.entries(updates).forEach(([field, value]) => {
      updatePeriAnal("patientInfo", field, value);
    });
  };
  const [expanded, setExpanded] = useState({
    patientInfo: true,
    preoperative: true,
    findings: true,
    woundManagement: true,
    complications: true,
    postOperativePlan: true,
    specimen: true,
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
    updatePeriAnal(section, field, updated);
  };

  const updateFindingSection = (findingKey: string, field: string, value: any) => {
    updatePeriAnal("findings", findingKey, {
      ...periAnal.findings?.[findingKey],
      [field]: value,
    });
  };

  const updateFindingNestedSection = (
    findingKey: string,
    nestedKey: string,
    field: string,
    value: any
  ) => {
    updatePeriAnal("findings", findingKey, {
      ...periAnal.findings?.[findingKey],
      [nestedKey]: {
        ...periAnal.findings?.[findingKey]?.[nestedKey],
        [field]: value,
      },
    });
  };

  const toggleFindingArray = (
    findingKey: string,
    field: string,
    option: string,
    currentValue: unknown
  ) => {
    const current = toArray(currentValue);
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    updateFindingSection(findingKey, field, updated);
  };

  const toggleFindingNestedArray = (
    findingKey: string,
    nestedKey: string,
    field: string,
    option: string,
    currentValue: unknown
  ) => {
    const current = toArray(currentValue);
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    updateFindingNestedSection(findingKey, nestedKey, field, updated);
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
    updatePeriAnal("preoperative", field, value);

    const startTime = field === "startTime" ? value : periAnal.preoperative?.startTime || "";
    const endTime = field === "endTime" ? value : periAnal.preoperative?.endTime || "";

    if (startTime && endTime) {
      updatePeriAnal("preoperative", "duration", calculateDuration(startTime, endTime));
    }
  };

  const renderSectionHeader = (
    title: string,
    sectionKey: keyof typeof expanded,
    icon: React.ReactNode,
    historyKey: string
  ) => (
    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleExpand(sectionKey)}>
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            expanded[sectionKey] ? "transform rotate-180" : ""
          }`}
        />
      </div>
      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onUndo?.(historyKey)} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRedo?.(historyKey)} title="Redo">
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

  const renderChoiceRow = (
    label: string,
    value: string,
    options: string[],
    onChange: (next: string) => void
  ) => (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-4 ml-4">
        {options.map((option) => (
          <div className="flex items-center" key={`${label}-${option}`}>
            <Checkbox
              id={`${label}-${option}`}
              checked={value === option}
              onCheckedChange={(checked) => {
                if (checked) onChange(option);
              }}
            />
            <label htmlFor={`${label}-${option}`} className="ml-2 block text-sm text-gray-700">
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCheckboxGroup = (
    options: string[],
    selectedValues: unknown,
    onToggle: (option: string) => void,
    columns = "grid grid-cols-1 md:grid-cols-2 gap-3"
  ) => (
    <div className={`${columns} ml-4`}>
      {options.map((option) => (
        <div className="flex items-center" key={option}>
          <Checkbox id={option} checked={toArray(selectedValues).includes(option)} onCheckedChange={() => onToggle(option)} />
          <label htmlFor={option} className="ml-2 block text-sm text-gray-700">
            {option}
          </label>
        </div>
      ))}
    </div>
  );

  const renderTeamField = (
    label: string,
    field: "surgeons" | "assistants" | "anaesthetists",
    placeholder: string
  ) => {
    const values = periAnal.preoperative?.[field] || [""];

    return (
      <FieldRow label={label} multiline>
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
                  updatePeriAnal("preoperative", field, updated);
                }}
              />
              {index === values.length - 1 && (
                <Button variant="outline" size="sm" className="text-xs px-2 py-1" onClick={() => updatePeriAnal("preoperative", field, [...values, ""])}>
                  +
                </Button>
              )}
              {values.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                  onClick={() =>
                    updatePeriAnal(
                      "preoperative",
                      field,
                      values.filter((_: string, itemIndex: number) => itemIndex !== index)
                    )
                  }
                >
                  -
                </Button>
              )}
            </div>
          ))}
        </div>
      </FieldRow>
    );
  };

  const isFindingSelected = (finding: string) =>
    toArray(periAnal.findings?.selectedFindings).includes(finding);

  const isFistulaProcedureSelected = (procedure: string) =>
    toArray(periAnal.findings?.perianalFistula?.procedurePerformed).includes(procedure);

  const isFissureProcedureSelected = (procedure: string) =>
    toArray(periAnal.findings?.fissureInAno?.procedurePerformed).includes(procedure);

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        {renderSectionHeader("Patient Information", "patientInfo", <User className="h-5 w-5 text-gray-600" />, "patientInfo")}
        {expanded.patientInfo && (
          <CardContent className="px-6 py-4">
            <PatientInfoFields
              patientInfo={periAnal.patientInfo}
              onFieldChange={(field, value) => updatePeriAnal("patientInfo", field, value)}
              onBulkUpdate={onBulkPatientInfoUpdate || updatePatientInfoFields}
              currentExtractedPatientInfo={currentExtractedPatientInfo}
              onCurrentPatientChange={onCurrentPatientChange}
              use24HourTimeInputs
              useDashDateInputs
              stackFieldRows
            />
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader("Preoperative Information", "preoperative", <Activity className="h-5 w-5 text-gray-600" />, "preoperative")}
        {expanded.preoperative && (
          <CardContent className="px-6 py-4">
            <div className="space-y-6">
              <div className="space-y-4">
                {renderTeamField("Surgeon:", "surgeons", "Enter Surgeon Name")}
                {renderTeamField("Assistant:", "assistants", "Enter Assistant Name")}
                {renderTeamField("Anaesthetist:", "anaesthetists", "Enter Anaesthetist Name")}
                {renderChoiceRow("Procedure Urgency:", periAnal.preoperative?.procedureUrgency || "", urgencyOptions, (value) => updatePeriAnal("preoperative", "procedureUrgency", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preoperative Imaging:</p>
                  {renderCheckboxGroup(imagingOptions, periAnal.preoperative?.imaging, (option) => toggleArrayValue("preoperative", "imaging", option, periAnal.preoperative?.imaging))}
                  {toArray(periAnal.preoperative?.imaging).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input type="text" placeholder="Specify Other Imaging" value={periAnal.preoperative?.imagingOther || ""} onChange={(e) => updatePeriAnal("preoperative", "imagingOther", e.target.value)} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldRow label="Start Time:">
                    <Time24HourInput
                      className="w-full"
                      hourAriaLabel="Start hour"
                      minuteAriaLabel="Start minute"
                      onChange={(value) => handleTimeChange("startTime", value)}
                      value={periAnal.preoperative?.startTime || ""}
                    />
                  </FieldRow>
                  <FieldRow label="End Time:">
                    <Time24HourInput
                      className="w-full"
                      hourAriaLabel="End hour"
                      minuteAriaLabel="End minute"
                      onChange={(value) => handleTimeChange("endTime", value)}
                      value={periAnal.preoperative?.endTime || ""}
                    />
                  </FieldRow>
                  <FieldRow label="Duration of Operation (Mins):">
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={periAnal.preoperative?.duration || ""}
                        onChange={(e) => updatePeriAnal("preoperative", "duration", e.target.value)}
                        placeholder="Auto-Calculated Or Manual Entry"
                      />
                      <p className="text-sm text-gray-600">
                        {periAnal.preoperative?.startTime && periAnal.preoperative?.endTime ? "Auto-Calculated" : "Manual Entry"}
                      </p>
                    </div>
                  </FieldRow>
                </div>
                <FieldRow label="Indication for Surgery:" multiline>
                  <Textarea rows={3} placeholder="Enter Indication For Surgery" value={periAnal.preoperative?.indication || ""} onChange={(e) => updatePeriAnal("preoperative", "indication", e.target.value)} />
                </FieldRow>
                <FieldRow label="Operation Description:" multiline>
                  <Textarea rows={3} placeholder="Enter Operation Description" value={periAnal.preoperative?.operationDescription || ""} onChange={(e) => updatePeriAnal("preoperative", "operationDescription", e.target.value)} />
                </FieldRow>
                <div className="space-y-4">
                  <div>
                    {renderChoiceRow("Position in Theatre:", periAnal.preoperative?.positionInTheatre || "", positionInTheatreOptions, (value) => updatePeriAnal("preoperative", "positionInTheatre", value))}
                  </div>
                </div>
                {periAnal.preoperative?.positionInTheatre === "Other" && (
                  <div className="ml-4">
                    <Input type="text" placeholder="Specify Other Position In Theatre" value={periAnal.preoperative?.positionOther || ""} onChange={(e) => updatePeriAnal("preoperative", "positionOther", e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader("Findings", "findings", <Scissors className="h-5 w-5 text-gray-600" />, "findings")}
        {expanded.findings && (
          <CardContent className="px-6 py-4 space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Findings:</p>
              {renderCheckboxGroup(findingOptions, periAnal.findings?.selectedFindings, (option) => toggleArrayValue("findings", "selectedFindings", option, periAnal.findings?.selectedFindings))}
              {isFindingSelected("Other") && (
                <div className="mt-3 ml-4">
                  <Input type="text" placeholder="Specify Other Finding" value={periAnal.findings?.otherFindingText || ""} onChange={(e) => updatePeriAnal("findings", "otherFindingText", e.target.value)} />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Diagrams</h3>
              <div className="mb-4 sm:ml-4">
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-medium text-gray-700 text-sm mb-2">Legend:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-black"></div>
                      <span>Ports (With Size Label)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-amber-500 rounded-full" style={{ borderStyle: "dashed" }}></div>
                      <span>Ileostomy (Dashed Yellow Circle)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-green-600 rounded-full"></div>
                      <span>Colostomy (Solid Green Circle)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-red-900" style={{ backgroundImage: "repeating-linear-gradient(90deg, #7f1d1d 0, #7f1d1d 4px, transparent 4px, transparent 8px)" }}></div>
                      <span>Incisions (Dashed Dark Red Line)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:ml-4">{diagramElement}</div>
            </div>

            {isFindingSelected("Perianal Abscess") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Perianal Abscess</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.perianalAbscess?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("perianalAbscess", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
                  {renderCheckboxGroup(abscessLocationOptions, periAnal.findings?.perianalAbscess?.location, (option) => toggleFindingArray("perianalAbscess", "location", option, periAnal.findings?.perianalAbscess?.location))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Size Length (Cm):</p>
                    <Input value={periAnal.findings?.perianalAbscess?.sizeLength || ""} onChange={(e) => updateFindingSection("perianalAbscess", "sizeLength", e.target.value)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Size Width (Cm):</p>
                    <Input value={periAnal.findings?.perianalAbscess?.sizeWidth || ""} onChange={(e) => updateFindingSection("perianalAbscess", "sizeWidth", e.target.value)} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Site of Abscess:</p>
                  {renderCheckboxGroup(abscessSiteOptions, periAnal.findings?.perianalAbscess?.siteOfAbscess, (option) => toggleFindingArray("perianalAbscess", "siteOfAbscess", option, periAnal.findings?.perianalAbscess?.siteOfAbscess))}
                  {toArray(periAnal.findings?.perianalAbscess?.siteOfAbscess).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalAbscess?.siteOfAbscessOther || ""} onChange={(e) => updateFindingSection("perianalAbscess", "siteOfAbscessOther", e.target.value)} placeholder="Specify Other Site" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Fluctance:", periAnal.findings?.perianalAbscess?.fluctance || "", ["Yes", "No"], (value) => updateFindingSection("perianalAbscess", "fluctance", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Overlying Skin:</p>
                  {renderCheckboxGroup(abscessSkinOptions, periAnal.findings?.perianalAbscess?.overlyingSkin, (option) => toggleFindingArray("perianalAbscess", "overlyingSkin", option, periAnal.findings?.perianalAbscess?.overlyingSkin))}
                  {toArray(periAnal.findings?.perianalAbscess?.overlyingSkin).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalAbscess?.overlyingSkinOther || ""} onChange={(e) => updateFindingSection("perianalAbscess", "overlyingSkinOther", e.target.value)} placeholder="Specify Other Overlying Skin" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Associated Internal Opening:", periAnal.findings?.perianalAbscess?.associatedInternalOpening || "", ["Yes", "No"], (value) => updateFindingSection("perianalAbscess", "associatedInternalOpening", value))}
                <FieldRow label="Position of Internal Opening (Clock):">
                  <Input value={periAnal.findings?.perianalAbscess?.positionOfInternalOpening || ""} onChange={(e) => updateFindingSection("perianalAbscess", "positionOfInternalOpening", e.target.value)} />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Procedure Performed:</p>
                  {renderCheckboxGroup(abscessProcedureOptions, periAnal.findings?.perianalAbscess?.procedurePerformed, (option) => toggleFindingArray("perianalAbscess", "procedurePerformed", option, periAnal.findings?.perianalAbscess?.procedurePerformed))}
                  {toArray(periAnal.findings?.perianalAbscess?.procedurePerformed).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalAbscess?.procedurePerformedOther || ""} onChange={(e) => updateFindingSection("perianalAbscess", "procedurePerformedOther", e.target.value)} placeholder="Specify Other Procedure" />
                    </div>
                  )}
                </div>
                <FieldRow label="Pus Drained (Approx. Volume):">
                  <Input value={periAnal.findings?.perianalAbscess?.pusDrainedVolume || ""} onChange={(e) => updateFindingSection("perianalAbscess", "pusDrainedVolume", e.target.value)} />
                </FieldRow>
                {renderChoiceRow("Irrigation Performed:", periAnal.findings?.perianalAbscess?.irrigationPerformed || "", ["Yes", "No"], (value) => updateFindingSection("perianalAbscess", "irrigationPerformed", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Wound Control:</p>
                  {renderCheckboxGroup(abscessWoundControlOptions, periAnal.findings?.perianalAbscess?.woundControl, (option) => toggleFindingArray("perianalAbscess", "woundControl", option, periAnal.findings?.perianalAbscess?.woundControl))}
                  {toArray(periAnal.findings?.perianalAbscess?.woundControl).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalAbscess?.woundControlOther || ""} onChange={(e) => updateFindingSection("perianalAbscess", "woundControlOther", e.target.value)} placeholder="Specify Other Wound Control" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {isFindingSelected("Perianal Fistula") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Perianal Fistula</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.perianalFistula?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("perianalFistula", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Classification:</p>
                  {renderCheckboxGroup(fistulaClassificationOptions, periAnal.findings?.perianalFistula?.classification, (option) => toggleFindingArray("perianalFistula", "classification", option, periAnal.findings?.perianalFistula?.classification))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">No Of External Opening(s):</p>
                    <Input value={periAnal.findings?.perianalFistula?.numberOfExternalOpenings || ""} onChange={(e) => updateFindingSection("perianalFistula", "numberOfExternalOpenings", e.target.value)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">External Opening (Clock Position):</p>
                    <Input value={periAnal.findings?.perianalFistula?.externalOpeningClockPosition || ""} onChange={(e) => updateFindingSection("perianalFistula", "externalOpeningClockPosition", e.target.value)} />
                  </div>
                </div>
                <FieldRow label="Distance From Anal Verge (Cm):">
                  <Input value={periAnal.findings?.perianalFistula?.externalOpeningDistanceFromAnalVerge || ""} onChange={(e) => updateFindingSection("perianalFistula", "externalOpeningDistanceFromAnalVerge", e.target.value)} />
                </FieldRow>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">No Of Internal Opening(s):</p>
                    <Input value={periAnal.findings?.perianalFistula?.numberOfInternalOpenings || ""} onChange={(e) => updateFindingSection("perianalFistula", "numberOfInternalOpenings", e.target.value)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Internal Opening (Clock Position):</p>
                    <Input value={periAnal.findings?.perianalFistula?.internalOpeningClockPosition || ""} onChange={(e) => updateFindingSection("perianalFistula", "internalOpeningClockPosition", e.target.value)} />
                  </div>
                </div>
                {renderChoiceRow("None Found:", periAnal.findings?.perianalFistula?.internalOpeningNoneFound || "", ["Yes", "No"], (value) => updateFindingSection("perianalFistula", "internalOpeningNoneFound", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Position Of Internal Opening(s):</p>
                  {renderCheckboxGroup(fistulaInternalPositionOptions, periAnal.findings?.perianalFistula?.positionOfInternalOpenings, (option) => toggleFindingArray("perianalFistula", "positionOfInternalOpenings", option, periAnal.findings?.perianalFistula?.positionOfInternalOpenings))}
                  {toArray(periAnal.findings?.perianalFistula?.positionOfInternalOpenings).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalFistula?.positionOfInternalOpeningsOther || ""} onChange={(e) => updateFindingSection("perianalFistula", "positionOfInternalOpeningsOther", e.target.value)} placeholder="Specify Other Position" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Associated Abscess Cavity:", periAnal.findings?.perianalFistula?.associatedAbscessCavity || "", ["Yes", "No"], (value) => updateFindingSection("perianalFistula", "associatedAbscessCavity", value))}
                {renderChoiceRow("Sphincter Involvement:", periAnal.findings?.perianalFistula?.sphincterInvolvement || "", ["None", "<30%", "30-50%", ">50%"], (value) => updateFindingSection("perianalFistula", "sphincterInvolvement", value))}
                {renderChoiceRow("Horseshoe Extension:", periAnal.findings?.perianalFistula?.horseshoeExtension || "", ["Yes", "No"], (value) => updateFindingSection("perianalFistula", "horseshoeExtension", value))}
                {renderChoiceRow("Secondary Tracts:", periAnal.findings?.perianalFistula?.secondaryTracts || "", ["Yes", "No"], (value) => updateFindingSection("perianalFistula", "secondaryTracts", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Procedure Performed:</p>
                  {renderCheckboxGroup(fistulaProcedureOptions, periAnal.findings?.perianalFistula?.procedurePerformed, (option) => toggleFindingArray("perianalFistula", "procedurePerformed", option, periAnal.findings?.perianalFistula?.procedurePerformed))}
                  {isFistulaProcedureSelected("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalFistula?.procedurePerformedOther || ""} onChange={(e) => updateFindingSection("perianalFistula", "procedurePerformedOther", e.target.value)} placeholder="Specify Other Procedure" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Method Of Identifying Internal Opening:</p>
                  {renderCheckboxGroup(fistulaMethodOptions, periAnal.findings?.perianalFistula?.methodOfIdentifyingInternalOpening, (option) => toggleFindingArray("perianalFistula", "methodOfIdentifyingInternalOpening", option, periAnal.findings?.perianalFistula?.methodOfIdentifyingInternalOpening))}
                  {toArray(periAnal.findings?.perianalFistula?.methodOfIdentifyingInternalOpening).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.perianalFistula?.methodOfIdentifyingInternalOpeningOther || ""} onChange={(e) => updateFindingSection("perianalFistula", "methodOfIdentifyingInternalOpeningOther", e.target.value)} placeholder="Specify Other Method" />
                    </div>
                  )}
                </div>

                {isFistulaProcedureSelected("Fistulotomy") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Fistulotomy Details</h4>
                    {renderChoiceRow("Tract Laid Open:", periAnal.findings?.perianalFistula?.fistulotomyDetails?.tractLaidOpen || "", ["Completely", "Partially", "Other"], (value) => updateFindingNestedSection("perianalFistula", "fistulotomyDetails", "tractLaidOpen", value))}
                    {renderChoiceRow("Percentage Of Sphincter Divided:", periAnal.findings?.perianalFistula?.fistulotomyDetails?.percentageOfSphincterDivided || "", ["None", "<30%", "30-50%", ">50%"], (value) => updateFindingNestedSection("perianalFistula", "fistulotomyDetails", "percentageOfSphincterDivided", value))}
                    {renderChoiceRow("Curettage Of Tract:", periAnal.findings?.perianalFistula?.fistulotomyDetails?.curettageOfTract || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "fistulotomyDetails", "curettageOfTract", value))}
                    {renderChoiceRow("Marsupialisation Performed:", periAnal.findings?.perianalFistula?.fistulotomyDetails?.marsupialisationPerformed || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "fistulotomyDetails", "marsupialisationPerformed", value))}
                    <FieldRow label="Length Of Tract (Cm):">
                      <Input value={periAnal.findings?.perianalFistula?.fistulotomyDetails?.lengthOfTract || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "fistulotomyDetails", "lengthOfTract", e.target.value)} />
                    </FieldRow>
                  </div>
                )}

                {isFistulaProcedureSelected("Seton Insertion") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Seton Procedure Details</h4>
                    {renderChoiceRow("Type Of Seton:", periAnal.findings?.perianalFistula?.setonProcedureDetails?.typeOfSeton || "", ["Loose (Drainage)", "Cutting"], (value) => updateFindingNestedSection("perianalFistula", "setonProcedureDetails", "typeOfSeton", value))}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Material Used:</p>
                      {renderCheckboxGroup(setonMaterialOptions, periAnal.findings?.perianalFistula?.setonProcedureDetails?.materialUsed, (option) => toggleFindingNestedArray("perianalFistula", "setonProcedureDetails", "materialUsed", option, periAnal.findings?.perianalFistula?.setonProcedureDetails?.materialUsed))}
                      {toArray(periAnal.findings?.perianalFistula?.setonProcedureDetails?.materialUsed).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input value={periAnal.findings?.perianalFistula?.setonProcedureDetails?.materialUsedOther || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "setonProcedureDetails", "materialUsedOther", e.target.value)} placeholder="Specify Other Material" />
                        </div>
                      )}
                    </div>
                    <FieldRow label="Number Of Setons Placed:">
                      <Input value={periAnal.findings?.perianalFistula?.setonProcedureDetails?.numberOfSetonsPlaced || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "setonProcedureDetails", "numberOfSetonsPlaced", e.target.value)} />
                    </FieldRow>
                    {renderChoiceRow("Planned Duration:", periAnal.findings?.perianalFistula?.setonProcedureDetails?.plannedDuration || "", ["Definitive", "Bridging To Staged Surgery"], (value) => updateFindingNestedSection("perianalFistula", "setonProcedureDetails", "plannedDuration", value))}
                  </div>
                )}

                {isFistulaProcedureSelected("LIFT") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">LIFT Procedure Details</h4>
                    {renderChoiceRow("Intersphincteric Plane Identified:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.intersphinctericPlaneIdentified || "", ["Yes", "No", "Difficult"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "intersphinctericPlaneIdentified", value))}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dissection Method:</p>
                      {renderCheckboxGroup(liftDissectionOptions, periAnal.findings?.perianalFistula?.liftProcedureDetails?.dissectionMethod, (option) => toggleFindingNestedArray("perianalFistula", "liftProcedureDetails", "dissectionMethod", option, periAnal.findings?.perianalFistula?.liftProcedureDetails?.dissectionMethod))}
                    </div>
                    {renderChoiceRow("Surrounding Fibrosis:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.surroundingFibrosis || "", ["Minimal", "Moderate", "Severe"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "surroundingFibrosis", value))}
                    {renderChoiceRow("Tract Divided:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.tractDivided || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "tractDivided", value))}
                    {renderChoiceRow("Closure Of Internal Opening:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.closureOfInternalOpening || "", ["None", "Ligation", "Excised And Suture"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "closureOfInternalOpening", value))}
                    {renderChoiceRow("Closure Of External Tract:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.closureOfExternalTract || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "closureOfExternalTract", value))}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">External Tract Management:</p>
                      {renderCheckboxGroup(tractManagementOptions, periAnal.findings?.perianalFistula?.liftProcedureDetails?.externalTractManagement, (option) => toggleFindingNestedArray("perianalFistula", "liftProcedureDetails", "externalTractManagement", option, periAnal.findings?.perianalFistula?.liftProcedureDetails?.externalTractManagement))}
                      {toArray(periAnal.findings?.perianalFistula?.liftProcedureDetails?.externalTractManagement).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input value={periAnal.findings?.perianalFistula?.liftProcedureDetails?.externalTractManagementOther || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "externalTractManagementOther", e.target.value)} placeholder="Specify Other External Tract Management" />
                        </div>
                      )}
                    </div>
                    {renderChoiceRow("Advancement Flap Added:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.advancementFlapAdded || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "advancementFlapAdded", value))}
                    {renderChoiceRow("Biologic Adjunct Used:", periAnal.findings?.perianalFistula?.liftProcedureDetails?.biologicAdjunctUsed || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "liftProcedureDetails", "biologicAdjunctUsed", value))}
                  </div>
                )}

                {isFistulaProcedureSelected("Advancement Flap") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Advancement Flap Details</h4>
                    {renderChoiceRow("Flap Type:", periAnal.findings?.perianalFistula?.advancementFlapDetails?.flapType || "", ["Endorectal", "Anocutaneous"], (value) => updateFindingNestedSection("perianalFistula", "advancementFlapDetails", "flapType", value))}
                    <FieldRow label="Length Of Flap (Cm):">
                      <Input value={periAnal.findings?.perianalFistula?.advancementFlapDetails?.lengthOfFlap || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "advancementFlapDetails", "lengthOfFlap", e.target.value)} />
                    </FieldRow>
                    {renderChoiceRow("Internal Opening Excised:", periAnal.findings?.perianalFistula?.advancementFlapDetails?.internalOpeningExcised || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "advancementFlapDetails", "internalOpeningExcised", value))}
                    {renderChoiceRow("Flap Vascularity Adequate:", periAnal.findings?.perianalFistula?.advancementFlapDetails?.flapVascularityAdequate || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "advancementFlapDetails", "flapVascularityAdequate", value))}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">External Tract Management:</p>
                      {renderCheckboxGroup(["None", "Suture", "Curettage", "Excision", "Other"], periAnal.findings?.perianalFistula?.advancementFlapDetails?.externalTractManagement, (option) => toggleFindingNestedArray("perianalFistula", "advancementFlapDetails", "externalTractManagement", option, periAnal.findings?.perianalFistula?.advancementFlapDetails?.externalTractManagement))}
                      {toArray(periAnal.findings?.perianalFistula?.advancementFlapDetails?.externalTractManagement).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input value={periAnal.findings?.perianalFistula?.advancementFlapDetails?.externalTractManagementOther || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "advancementFlapDetails", "externalTractManagementOther", e.target.value)} placeholder="Specify Other External Tract Management" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isFistulaProcedureSelected("Plug / Glue") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Plug / Glue Insertion Details</h4>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Which Was Used:</p>
                      {renderCheckboxGroup(["Plug", "Glue"], periAnal.findings?.perianalFistula?.plugGlueDetails?.whichWasUsed, (option) => toggleFindingNestedArray("perianalFistula", "plugGlueDetails", "whichWasUsed", option, periAnal.findings?.perianalFistula?.plugGlueDetails?.whichWasUsed), "grid grid-cols-1 gap-3")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Plug Type:</p>
                      {renderCheckboxGroup(plugTypeOptions, periAnal.findings?.perianalFistula?.plugGlueDetails?.plugType, (option) => toggleFindingNestedArray("perianalFistula", "plugGlueDetails", "plugType", option, periAnal.findings?.perianalFistula?.plugGlueDetails?.plugType))}
                      {toArray(periAnal.findings?.perianalFistula?.plugGlueDetails?.plugType).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input value={periAnal.findings?.perianalFistula?.plugGlueDetails?.plugTypeOther || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "plugGlueDetails", "plugTypeOther", e.target.value)} placeholder="Specify Other Plug Type" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Glue Type:</p>
                      {renderCheckboxGroup(glueTypeOptions, periAnal.findings?.perianalFistula?.plugGlueDetails?.glueType, (option) => toggleFindingNestedArray("perianalFistula", "plugGlueDetails", "glueType", option, periAnal.findings?.perianalFistula?.plugGlueDetails?.glueType), "grid grid-cols-1 gap-3")}
                    </div>
                    {renderChoiceRow("Tract Curettage Performed:", periAnal.findings?.perianalFistula?.plugGlueDetails?.tractCurettagePerformed || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "plugGlueDetails", "tractCurettagePerformed", value))}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Irrigation:</p>
                      {renderCheckboxGroup(plugIrrigationOptions, periAnal.findings?.perianalFistula?.plugGlueDetails?.irrigation, (option) => toggleFindingNestedArray("perianalFistula", "plugGlueDetails", "irrigation", option, periAnal.findings?.perianalFistula?.plugGlueDetails?.irrigation))}
                      {toArray(periAnal.findings?.perianalFistula?.plugGlueDetails?.irrigation).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input value={periAnal.findings?.perianalFistula?.plugGlueDetails?.irrigationOther || ""} onChange={(e) => updateFindingNestedSection("perianalFistula", "plugGlueDetails", "irrigationOther", e.target.value)} placeholder="Specify Other Irrigation" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Plug Or Glue Insertion:</p>
                      {renderCheckboxGroup(plugInsertionOptions, periAnal.findings?.perianalFistula?.plugGlueDetails?.insertionDirection, (option) => toggleFindingNestedArray("perianalFistula", "plugGlueDetails", "insertionDirection", option, periAnal.findings?.perianalFistula?.plugGlueDetails?.insertionDirection))}
                    </div>
                    {renderChoiceRow("Internal Opening Closure:", periAnal.findings?.perianalFistula?.plugGlueDetails?.internalOpeningClosure || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "plugGlueDetails", "internalOpeningClosure", value))}
                  </div>
                )}

                {isFistulaProcedureSelected("Fistulectomy") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Fistulectomy Details</h4>
                    {renderChoiceRow("Extent Of Tract Excision:", periAnal.findings?.perianalFistula?.fistulectomyDetails?.extentOfTractExcision || "", ["Complete", "Partially", "Other"], (value) => updateFindingNestedSection("perianalFistula", "fistulectomyDetails", "extentOfTractExcision", value))}
                    {renderChoiceRow("Closure Of Internal Opening:", periAnal.findings?.perianalFistula?.fistulectomyDetails?.closureOfInternalOpening || "", ["Yes", "No"], (value) => updateFindingNestedSection("perianalFistula", "fistulectomyDetails", "closureOfInternalOpening", value))}
                  </div>
                )}
              </div>
            )}

            {isFindingSelected("Fissure-In-Ano") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Fissure-In-Ano</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.fissureInAno?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("fissureInAno", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
                  {renderCheckboxGroup(fissureLocationOptions, periAnal.findings?.fissureInAno?.location, (option) => toggleFindingArray("fissureInAno", "location", option, periAnal.findings?.fissureInAno?.location))}
                  {toArray(periAnal.findings?.fissureInAno?.location).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.fissureInAno?.locationOther || ""} onChange={(e) => updateFindingSection("fissureInAno", "locationOther", e.target.value)} placeholder="Specify Other Location" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Height From Anal Verge:", periAnal.findings?.fissureInAno?.heightFromAnalVerge || "", fissureHeightOptions, (value) => updateFindingSection("fissureInAno", "heightFromAnalVerge", value))}
                {renderChoiceRow("Sentinel Pile:", periAnal.findings?.fissureInAno?.sentinelPile || "", ["Yes", "No"], (value) => updateFindingSection("fissureInAno", "sentinelPile", value))}
                {renderChoiceRow("Hypertrophied Papilla:", periAnal.findings?.fissureInAno?.hypertrophiedPapilla || "", ["Yes", "No"], (value) => updateFindingSection("fissureInAno", "hypertrophiedPapilla", value))}
                {renderChoiceRow("Sphincter Hypertonicity:", periAnal.findings?.fissureInAno?.sphincterHypertonicity || "", ["Yes", "No"], (value) => updateFindingSection("fissureInAno", "sphincterHypertonicity", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Procedure Performed:</p>
                  {renderCheckboxGroup(fissureProcedureOptions, periAnal.findings?.fissureInAno?.procedurePerformed, (option) => toggleFindingArray("fissureInAno", "procedurePerformed", option, periAnal.findings?.fissureInAno?.procedurePerformed))}
                  {isFissureProcedureSelected("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.fissureInAno?.procedurePerformedOther || ""} onChange={(e) => updateFindingSection("fissureInAno", "procedurePerformedOther", e.target.value)} placeholder="Specify Other Procedure" />
                    </div>
                  )}
                </div>

                {isFissureProcedureSelected("Lateral Internal Sphincterotomy") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Lateral Internal Sphincterotomy Details</h4>
                    {renderChoiceRow("Side Of Lateral Internal Sphincterotomy:", periAnal.findings?.fissureInAno?.lateralInternalSphincterotomyDetails?.sideOfLateralInternalSphincterotomy || "", ["Left", "Right"], (value) => updateFindingNestedSection("fissureInAno", "lateralInternalSphincterotomyDetails", "sideOfLateralInternalSphincterotomy", value))}
                    {renderChoiceRow("Extent Of Sphincter Divided:", periAnal.findings?.fissureInAno?.lateralInternalSphincterotomyDetails?.extentOfSphincterDivided || "", ["None", "<30%", "30-50%", ">50%"], (value) => updateFindingNestedSection("fissureInAno", "lateralInternalSphincterotomyDetails", "extentOfSphincterDivided", value))}
                    {renderChoiceRow("Skin Tag Excision:", periAnal.findings?.fissureInAno?.lateralInternalSphincterotomyDetails?.skinTagExcision || "", ["Yes", "No"], (value) => updateFindingNestedSection("fissureInAno", "lateralInternalSphincterotomyDetails", "skinTagExcision", value))}
                  </div>
                )}

                {isFissureProcedureSelected("Botox") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Botox Injection Details</h4>
                    {renderChoiceRow("Botox Dose Injection (IU):", periAnal.findings?.fissureInAno?.botoxInjectionDetails?.botoxDoseInjection || "", botoxDoseOptions, (value) => updateFindingNestedSection("fissureInAno", "botoxInjectionDetails", "botoxDoseInjection", value))}
                    {periAnal.findings?.fissureInAno?.botoxInjectionDetails?.botoxDoseInjection === "Other" && (
                      <FieldRow label="Other Botox Dose:">
                        <Input value={periAnal.findings?.fissureInAno?.botoxInjectionDetails?.botoxDoseOther || ""} onChange={(e) => updateFindingNestedSection("fissureInAno", "botoxInjectionDetails", "botoxDoseOther", e.target.value)} />
                      </FieldRow>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Muscle Of Injection:</p>
                      {renderCheckboxGroup(botoxMuscleOptions, periAnal.findings?.fissureInAno?.botoxInjectionDetails?.muscleOfInjection, (option) => toggleFindingNestedArray("fissureInAno", "botoxInjectionDetails", "muscleOfInjection", option, periAnal.findings?.fissureInAno?.botoxInjectionDetails?.muscleOfInjection))}
                      {toArray(periAnal.findings?.fissureInAno?.botoxInjectionDetails?.muscleOfInjection).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input value={periAnal.findings?.fissureInAno?.botoxInjectionDetails?.muscleOfInjectionOther || ""} onChange={(e) => updateFindingNestedSection("fissureInAno", "botoxInjectionDetails", "muscleOfInjectionOther", e.target.value)} placeholder="Specify Other Muscle" />
                        </div>
                      )}
                    </div>
                    <FieldRow label="No Of Sites Of Injection:">
                      <Input value={periAnal.findings?.fissureInAno?.botoxInjectionDetails?.numberOfSitesOfInjection || ""} onChange={(e) => updateFindingNestedSection("fissureInAno", "botoxInjectionDetails", "numberOfSitesOfInjection", e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Sites Of Injection (O'Clock):">
                      <Input value={toArray(periAnal.findings?.fissureInAno?.botoxInjectionDetails?.sitesOfInjection).join(", ")} onChange={(e) => updateFindingNestedSection("fissureInAno", "botoxInjectionDetails", "sitesOfInjection", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="E.g. 3, 6, 9, 12" />
                    </FieldRow>
                    <FieldRow label="Other Site Details:">
                      <Input value={periAnal.findings?.fissureInAno?.botoxInjectionDetails?.sitesOfInjectionOther || ""} onChange={(e) => updateFindingNestedSection("fissureInAno", "botoxInjectionDetails", "sitesOfInjectionOther", e.target.value)} />
                    </FieldRow>
                  </div>
                )}

                {isFissureProcedureSelected("Advancement Flap") && (
                  <div className="rounded-md border bg-white p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Advancement Flap Details</h4>
                    {renderChoiceRow("Flap Type:", periAnal.findings?.fissureInAno?.advancementFlapDetails?.flapType || "", ["Endorectal", "Anocutaneous"], (value) => updateFindingNestedSection("fissureInAno", "advancementFlapDetails", "flapType", value))}
                    <FieldRow label="Length Of Flap (Cm):">
                      <Input value={periAnal.findings?.fissureInAno?.advancementFlapDetails?.lengthOfFlap || ""} onChange={(e) => updateFindingNestedSection("fissureInAno", "advancementFlapDetails", "lengthOfFlap", e.target.value)} />
                    </FieldRow>
                    {renderChoiceRow("Flap Vascularity Adequate:", periAnal.findings?.fissureInAno?.advancementFlapDetails?.flapVascularityAdequate || "", ["Yes", "No"], (value) => updateFindingNestedSection("fissureInAno", "advancementFlapDetails", "flapVascularityAdequate", value))}
                  </div>
                )}
              </div>
            )}

            {isFindingSelected("Haemorrhoids") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Haemorrhoids</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.haemorrhoids?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("haemorrhoids", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Type:</p>
                  {renderCheckboxGroup(haemorrhoidTypeOptions, periAnal.findings?.haemorrhoids?.type, (option) => toggleFindingArray("haemorrhoids", "type", option, periAnal.findings?.haemorrhoids?.type))}
                </div>
                {renderChoiceRow("Internal Haemorrhoid Grade:", periAnal.findings?.haemorrhoids?.internalHaemorrhoidGrade || "", haemorrhoidGradeOptions, (value) => updateFindingSection("haemorrhoids", "internalHaemorrhoidGrade", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Columns Involved:</p>
                  {renderCheckboxGroup(haemorrhoidColumnOptions, periAnal.findings?.haemorrhoids?.columnsInvolved, (option) => toggleFindingArray("haemorrhoids", "columnsInvolved", option, periAnal.findings?.haemorrhoids?.columnsInvolved))}
                  {toArray(periAnal.findings?.haemorrhoids?.columnsInvolved).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.haemorrhoids?.columnsInvolvedOther || ""} onChange={(e) => updateFindingSection("haemorrhoids", "columnsInvolvedOther", e.target.value)} placeholder="Specify Other Column" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Complications:</p>
                  {renderCheckboxGroup(haemorrhoidComplicationOptions, periAnal.findings?.haemorrhoids?.complications, (option) => toggleFindingArray("haemorrhoids", "complications", option, periAnal.findings?.haemorrhoids?.complications))}
                  {toArray(periAnal.findings?.haemorrhoids?.complications).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.haemorrhoids?.complicationsOther || ""} onChange={(e) => updateFindingSection("haemorrhoids", "complicationsOther", e.target.value)} placeholder="Specify Other Complication" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Procedure Performed:</p>
                  {renderCheckboxGroup(haemorrhoidProcedureOptions, periAnal.findings?.haemorrhoids?.procedurePerformed, (option) => toggleFindingArray("haemorrhoids", "procedurePerformed", option, periAnal.findings?.haemorrhoids?.procedurePerformed))}
                  {toArray(periAnal.findings?.haemorrhoids?.procedurePerformed).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.haemorrhoids?.procedurePerformedOther || ""} onChange={(e) => updateFindingSection("haemorrhoids", "procedurePerformedOther", e.target.value)} placeholder="Specify Other Procedure" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Number Of Columns Treated:", periAnal.findings?.haemorrhoids?.numberOfColumnsTreated || "", ["1", "2", "3"], (value) => updateFindingSection("haemorrhoids", "numberOfColumnsTreated", value))}
                {renderChoiceRow("Energy Device Used For Haemorrhoidectomy:", periAnal.findings?.haemorrhoids?.energyDeviceUsedForHaemorrhoidectomy || "", ["Yes", "No"], (value) => updateFindingSection("haemorrhoids", "energyDeviceUsedForHaemorrhoidectomy", value))}
                {renderChoiceRow("Mucosal Bridges Preserved:", periAnal.findings?.haemorrhoids?.mucosalBridgesPreserved || "", ["Yes", "No", "Partially"], (value) => updateFindingSection("haemorrhoids", "mucosalBridgesPreserved", value))}
                {renderChoiceRow("Haemostasis Achieved:", periAnal.findings?.haemorrhoids?.haemostasisAchieved || "", ["Yes", "No"], (value) => updateFindingSection("haemorrhoids", "haemostasisAchieved", value))}
                {renderChoiceRow("Anal Pack Inserted:", periAnal.findings?.haemorrhoids?.analPackInserted || "", ["Yes", "No"], (value) => updateFindingSection("haemorrhoids", "analPackInserted", value))}
              </div>
            )}

            {isFindingSelected("Warts") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Warts</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.warts?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("warts", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Distribution Of Warts:</p>
                  {renderCheckboxGroup(wartDistributionOptions, periAnal.findings?.warts?.distributionOfWarts, (option) => toggleFindingArray("warts", "distributionOfWarts", option, periAnal.findings?.warts?.distributionOfWarts))}
                  {toArray(periAnal.findings?.warts?.distributionOfWarts).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.warts?.distributionOfWartsOther || ""} onChange={(e) => updateFindingSection("warts", "distributionOfWartsOther", e.target.value)} placeholder="Specify Other Distribution" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Size Of Lesions:", periAnal.findings?.warts?.sizeOfLesions || "", ["< 5 Cm", "5 - 10 Cm", "> 10 Cm"], (value) => updateFindingSection("warts", "sizeOfLesions", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Morphology:</p>
                  {renderCheckboxGroup(wartMorphologyOptions, periAnal.findings?.warts?.morphology, (option) => toggleFindingArray("warts", "morphology", option, periAnal.findings?.warts?.morphology))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Excision Method:</p>
                  {renderCheckboxGroup(wartExcisionMethodOptions, periAnal.findings?.warts?.excisionMethod, (option) => toggleFindingArray("warts", "excisionMethod", option, periAnal.findings?.warts?.excisionMethod))}
                  {toArray(periAnal.findings?.warts?.excisionMethod).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.warts?.excisionMethodOther || ""} onChange={(e) => updateFindingSection("warts", "excisionMethodOther", e.target.value)} placeholder="Specify Other Excision Method" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Depth Of Excision:</p>
                  {renderCheckboxGroup(wartDepthOptions, periAnal.findings?.warts?.depthOfExcision, (option) => toggleFindingArray("warts", "depthOfExcision", option, periAnal.findings?.warts?.depthOfExcision))}
                </div>
                {renderChoiceRow("Haemostasis Achieved:", periAnal.findings?.warts?.haemostasisAchieved || "", ["Yes", "No"], (value) => updateFindingSection("warts", "haemostasisAchieved", value))}
              </div>
            )}

            {isFindingSelected("Hidradenitis Suppurativa") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Hidradenitis Suppurativa</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.hidradenitisSuppurativa?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("hidradenitisSuppurativa", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Sites Involved:</p>
                  {renderCheckboxGroup(hidradenitisSiteOptions, periAnal.findings?.hidradenitisSuppurativa?.sitesInvolved, (option) => toggleFindingArray("hidradenitisSuppurativa", "sitesInvolved", option, periAnal.findings?.hidradenitisSuppurativa?.sitesInvolved))}
                </div>
                {renderChoiceRow("Laterality:", periAnal.findings?.hidradenitisSuppurativa?.laterality || "", ["Unilateral", "Bilateral", "Midline"], (value) => updateFindingSection("hidradenitisSuppurativa", "laterality", value))}
                {renderChoiceRow("Nodules Present:", periAnal.findings?.hidradenitisSuppurativa?.nodulesPresent || "", ["None", "Single", "Multiple"], (value) => updateFindingSection("hidradenitisSuppurativa", "nodulesPresent", value))}
                {renderChoiceRow("Abscesses Present:", periAnal.findings?.hidradenitisSuppurativa?.abscessesPresent || "", ["None", "Single", "Multiple"], (value) => updateFindingSection("hidradenitisSuppurativa", "abscessesPresent", value))}
                {renderChoiceRow("Sinus Tracts Present:", periAnal.findings?.hidradenitisSuppurativa?.sinusTractsPresent || "", ["None", "Single", "Multiple", "Interconnected"], (value) => updateFindingSection("hidradenitisSuppurativa", "sinusTractsPresent", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Active Discharge:</p>
                  {renderCheckboxGroup(["Purulent", "Serous", "Bloody", "None"], periAnal.findings?.hidradenitisSuppurativa?.activeDischarge, (option) => toggleFindingArray("hidradenitisSuppurativa", "activeDischarge", option, periAnal.findings?.hidradenitisSuppurativa?.activeDischarge), "grid grid-cols-1 md:grid-cols-2 gap-3")}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Surrounding Skin Condition:</p>
                  {renderCheckboxGroup(hidradenitisSkinOptions, periAnal.findings?.hidradenitisSuppurativa?.surroundingSkinCondition, (option) => toggleFindingArray("hidradenitisSuppurativa", "surroundingSkinCondition", option, periAnal.findings?.hidradenitisSuppurativa?.surroundingSkinCondition))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Depth Of Disease:</p>
                  {renderCheckboxGroup(hidradenitisDepthOptions, periAnal.findings?.hidradenitisSuppurativa?.depthOfDisease, (option) => toggleFindingArray("hidradenitisSuppurativa", "depthOfDisease", option, periAnal.findings?.hidradenitisSuppurativa?.depthOfDisease))}
                  {toArray(periAnal.findings?.hidradenitisSuppurativa?.depthOfDisease).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.hidradenitisSuppurativa?.depthOfDiseaseOther || ""} onChange={(e) => updateFindingSection("hidradenitisSuppurativa", "depthOfDiseaseOther", e.target.value)} placeholder="Specify Other Depth Of Disease" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Operative Procedure Performed:</p>
                  {renderCheckboxGroup(hidradenitisProcedureOptions, periAnal.findings?.hidradenitisSuppurativa?.operativeProcedurePerformed, (option) => toggleFindingArray("hidradenitisSuppurativa", "operativeProcedurePerformed", option, periAnal.findings?.hidradenitisSuppurativa?.operativeProcedurePerformed))}
                  {toArray(periAnal.findings?.hidradenitisSuppurativa?.operativeProcedurePerformed).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.hidradenitisSuppurativa?.operativeProcedurePerformedOther || ""} onChange={(e) => updateFindingSection("hidradenitisSuppurativa", "operativeProcedurePerformedOther", e.target.value)} placeholder="Specify Other Procedure" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Extent Of Excision:", periAnal.findings?.hidradenitisSuppurativa?.extentOfExcision || "", ["Limited", "Local Excision (< 5 Cm Area)", "Extensive (5 - 10 Cm Area)", "Radical (> 10 Cm Area)"], (value) => updateFindingSection("hidradenitisSuppurativa", "extentOfExcision", value))}
                {renderChoiceRow("Haemostasis Achieved:", periAnal.findings?.hidradenitisSuppurativa?.haemostasisAchieved || "", ["Yes", "No"], (value) => updateFindingSection("hidradenitisSuppurativa", "haemostasisAchieved", value))}
              </div>
            )}

            {isFindingSelected("Necrotising Fasciitis") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Necrotising Fasciitis</h3>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Involved Areas:</p>
                  {renderCheckboxGroup(necrotisingInvolvedAreaOptions, periAnal.findings?.necrotisingFasciitis?.involvedAreas, (option) => toggleFindingArray("necrotisingFasciitis", "involvedAreas", option, periAnal.findings?.necrotisingFasciitis?.involvedAreas))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Depth Of Disease:</p>
                  {renderCheckboxGroup(necrotisingDepthOptions, periAnal.findings?.necrotisingFasciitis?.depthOfDisease, (option) => toggleFindingArray("necrotisingFasciitis", "depthOfDisease", option, periAnal.findings?.necrotisingFasciitis?.depthOfDisease))}
                  {toArray(periAnal.findings?.necrotisingFasciitis?.depthOfDisease).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.necrotisingFasciitis?.depthOfDiseaseOther || ""} onChange={(e) => updateFindingSection("necrotisingFasciitis", "depthOfDiseaseOther", e.target.value)} placeholder="Specify Other Depth Of Disease" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Foul Odour:", periAnal.findings?.necrotisingFasciitis?.foulOdour || "", ["Yes", "No"], (value) => updateFindingSection("necrotisingFasciitis", "foulOdour", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Etiology Identified:</p>
                  {renderCheckboxGroup(necrotisingEtiologyOptions, periAnal.findings?.necrotisingFasciitis?.etiologyIdentified, (option) => toggleFindingArray("necrotisingFasciitis", "etiologyIdentified", option, periAnal.findings?.necrotisingFasciitis?.etiologyIdentified))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Areas Debrided:</p>
                  {renderCheckboxGroup([...necrotisingInvolvedAreaOptions, "Other"], periAnal.findings?.necrotisingFasciitis?.areasDebrided, (option) => toggleFindingArray("necrotisingFasciitis", "areasDebrided", option, periAnal.findings?.necrotisingFasciitis?.areasDebrided))}
                  {toArray(periAnal.findings?.necrotisingFasciitis?.areasDebrided).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.necrotisingFasciitis?.areasDebridedOther || ""} onChange={(e) => updateFindingSection("necrotisingFasciitis", "areasDebridedOther", e.target.value)} placeholder="Specify Other Area Debrided" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Depth Of Debridement:</p>
                  {renderCheckboxGroup(["Skin", "Fat", "Fascia", "Muscles", "Other"], periAnal.findings?.necrotisingFasciitis?.depthOfDebridement, (option) => toggleFindingArray("necrotisingFasciitis", "depthOfDebridement", option, periAnal.findings?.necrotisingFasciitis?.depthOfDebridement))}
                  {toArray(periAnal.findings?.necrotisingFasciitis?.depthOfDebridement).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.necrotisingFasciitis?.depthOfDebridementOther || ""} onChange={(e) => updateFindingSection("necrotisingFasciitis", "depthOfDebridementOther", e.target.value)} placeholder="Specify Other Depth Of Debridement" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Testicular Involvement:", periAnal.findings?.necrotisingFasciitis?.testicularInvolvement || "", ["Not Involved", "Exposed But Viable", "Orchidectomy Performed"], (value) => updateFindingSection("necrotisingFasciitis", "testicularInvolvement", value))}
                {periAnal.findings?.necrotisingFasciitis?.testicularInvolvement === "Orchidectomy Performed" && (
                  <FieldRow label="Orchidectomy Side:">
                    <Input value={periAnal.findings?.necrotisingFasciitis?.orchidectomySide || ""} onChange={(e) => updateFindingSection("necrotisingFasciitis", "orchidectomySide", e.target.value)} />
                  </FieldRow>
                )}
                {renderChoiceRow("Diversion Stoma Required:", periAnal.findings?.necrotisingFasciitis?.diversionStomaRequired || "", ["Yes", "No"], (value) => updateFindingSection("necrotisingFasciitis", "diversionStomaRequired", value))}
                {renderChoiceRow("Planned Re-Debridement:", periAnal.findings?.necrotisingFasciitis?.plannedRedeBridement || "", ["Yes", "No"], (value) => updateFindingSection("necrotisingFasciitis", "plannedRedeBridement", value))}
              </div>
            )}

            {isFindingSelected("Mass / Lesion") && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Mass / Lesion</h3>
                <FieldRow label="Description of Findings:" multiline>
                  <Textarea rows={3} value={periAnal.findings?.massLesion?.descriptionOfFindings || ""} onChange={(e) => updateFindingSection("massLesion", "descriptionOfFindings", e.target.value)} placeholder="Describe The Findings" />
                </FieldRow>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Location Of Mass:</p>
                  {renderCheckboxGroup(massLocationOptions, periAnal.findings?.massLesion?.locationOfMass, (option) => toggleFindingArray("massLesion", "locationOfMass", option, periAnal.findings?.massLesion?.locationOfMass))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Size Length (Cm):</p>
                    <Input value={periAnal.findings?.massLesion?.sizeLength || ""} onChange={(e) => updateFindingSection("massLesion", "sizeLength", e.target.value)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Size Width (Cm):</p>
                    <Input value={periAnal.findings?.massLesion?.sizeWidth || ""} onChange={(e) => updateFindingSection("massLesion", "sizeWidth", e.target.value)} />
                  </div>
                </div>
                {renderChoiceRow("Number Of Lesions:", periAnal.findings?.massLesion?.numberOfLesions || "", ["Solitary", "Multiple"], (value) => updateFindingSection("massLesion", "numberOfLesions", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Surface Changes:</p>
                  {renderCheckboxGroup(massSurfaceOptions, periAnal.findings?.massLesion?.surfaceChanges, (option) => toggleFindingArray("massLesion", "surfaceChanges", option, periAnal.findings?.massLesion?.surfaceChanges))}
                  {toArray(periAnal.findings?.massLesion?.surfaceChanges).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.massLesion?.surfaceChangesOther || ""} onChange={(e) => updateFindingSection("massLesion", "surfaceChangesOther", e.target.value)} placeholder="Specify Other Surface Change" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Consistency:</p>
                  {renderCheckboxGroup(massConsistencyOptions, periAnal.findings?.massLesion?.consistency, (option) => toggleFindingArray("massLesion", "consistency", option, periAnal.findings?.massLesion?.consistency))}
                  {toArray(periAnal.findings?.massLesion?.consistency).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.massLesion?.consistencyOther || ""} onChange={(e) => updateFindingSection("massLesion", "consistencyOther", e.target.value)} placeholder="Specify Other Consistency" />
                    </div>
                  )}
                </div>
                {renderChoiceRow("Fixation To Deeper Structures:", periAnal.findings?.massLesion?.fixationToDeeperStructures || "", ["Mobile", "Fixed"], (value) => updateFindingSection("massLesion", "fixationToDeeperStructures", value))}
                {renderChoiceRow("Sphincter Tone:", periAnal.findings?.massLesion?.sphincterTone || "", ["Normal", "Reduced", "Increased"], (value) => updateFindingSection("massLesion", "sphincterTone", value))}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Most Likely Diagnosis (Intraoperative Impression):</p>
                  {renderCheckboxGroup(massDiagnosisOptions, periAnal.findings?.massLesion?.mostLikelyDiagnosis, (option) => toggleFindingArray("massLesion", "mostLikelyDiagnosis", option, periAnal.findings?.massLesion?.mostLikelyDiagnosis))}
                  {toArray(periAnal.findings?.massLesion?.mostLikelyDiagnosis).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.massLesion?.mostLikelyDiagnosisOther || ""} onChange={(e) => updateFindingSection("massLesion", "mostLikelyDiagnosisOther", e.target.value)} placeholder="Specify Other Diagnosis" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Diagnostic Procedure Performed:</p>
                  {renderCheckboxGroup(massProcedureOptions, periAnal.findings?.massLesion?.diagnosticProcedurePerformed, (option) => toggleFindingArray("massLesion", "diagnosticProcedurePerformed", option, periAnal.findings?.massLesion?.diagnosticProcedurePerformed))}
                  {toArray(periAnal.findings?.massLesion?.diagnosticProcedurePerformed).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input value={periAnal.findings?.massLesion?.diagnosticProcedurePerformedOther || ""} onChange={(e) => updateFindingSection("massLesion", "diagnosticProcedurePerformedOther", e.target.value)} placeholder="Specify Other Diagnostic Procedure" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader("Wound Management", "woundManagement", <Shield className="h-5 w-5 text-gray-600" />, "woundManagement")}
        {expanded.woundManagement && (
          <CardContent className="px-6 py-4 space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Irrigation Solution:</p>
              {renderCheckboxGroup(woundIrrigationOptions, periAnal.woundManagement?.irrigationSolution, (option) => toggleArrayValue("woundManagement", "irrigationSolution", option, periAnal.woundManagement?.irrigationSolution))}
              {toArray(periAnal.woundManagement?.irrigationSolution).includes("Other") && (
                <div className="mt-3 ml-4">
                  <Input value={periAnal.woundManagement?.irrigationSolutionOther || ""} onChange={(e) => updatePeriAnal("woundManagement", "irrigationSolutionOther", e.target.value)} placeholder="Specify Other Irrigation Solution" />
                </div>
              )}
            </div>
            {renderChoiceRow("Wound Closure:", periAnal.woundManagement?.woundClosure || "", woundClosureOptions, (value) => updatePeriAnal("woundManagement", "woundClosure", value))}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Dressing Applied:</p>
              {renderCheckboxGroup(dressingOptions, periAnal.woundManagement?.dressingApplied, (option) => toggleArrayValue("woundManagement", "dressingApplied", option, periAnal.woundManagement?.dressingApplied))}
              {toArray(periAnal.woundManagement?.dressingApplied).includes("Other") && (
                <div className="mt-3 ml-4">
                  <Input value={periAnal.woundManagement?.dressingAppliedOther || ""} onChange={(e) => updatePeriAnal("woundManagement", "dressingAppliedOther", e.target.value)} placeholder="Specify Other Dressing" />
                </div>
              )}
            </div>
            {renderChoiceRow("Anal Pack Inserted:", periAnal.woundManagement?.analPackInserted || "", ["Yes", "No"], (value) => updatePeriAnal("woundManagement", "analPackInserted", value))}
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader("Intraoperative Complications", "complications", <FileSearch className="h-5 w-5 text-gray-600" />, "complications")}
        {expanded.complications && (
          <CardContent className="px-6 py-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Intraoperative Complications:</p>
              {renderCheckboxGroup(intraoperativeComplicationOptions, periAnal.complications?.intraoperativeComplications, (option) => toggleArrayValue("complications", "intraoperativeComplications", option, periAnal.complications?.intraoperativeComplications))}
              {toArray(periAnal.complications?.intraoperativeComplications).includes("Other") && (
                <div className="mt-3 ml-4">
                  <Input value={periAnal.complications?.intraoperativeComplicationsOther || ""} onChange={(e) => updatePeriAnal("complications", "intraoperativeComplicationsOther", e.target.value)} placeholder="Specify Other Intraoperative Complication" />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader("Specimen", "specimen", <FileText className="h-5 w-5 text-gray-600" />, "specimen")}
        {expanded.specimen && (
          <CardContent className="px-6 py-4 space-y-4">
            {renderChoiceRow("Sent for Histology:", periAnal.specimen?.sentForHistology || "", ["Yes", "No"], (value) => updatePeriAnal("specimen", "sentForHistology", value))}
            {periAnal.specimen?.sentForHistology === "Yes" && (
              <FieldRow label="Specify Laboratory Sent To:">
                <Input
                  placeholder="Enter Histology Laboratory"
                  value={periAnal.specimen?.histologyLaboratorySentTo || ""}
                  onChange={(e) => updatePeriAnal("specimen", "histologyLaboratorySentTo", e.target.value)}
                />
              </FieldRow>
            )}
            {renderChoiceRow("Sent for Microbiology:", periAnal.specimen?.sentForMicrobiology || "", ["Yes", "No"], (value) => updatePeriAnal("specimen", "sentForMicrobiology", value))}
            {periAnal.specimen?.sentForMicrobiology === "Yes" && (
              <FieldRow label="Specify Laboratory Sent To:">
                <Input
                  placeholder="Enter Microbiology Laboratory"
                  value={periAnal.specimen?.microbiologyLaboratorySentTo || ""}
                  onChange={(e) => updatePeriAnal("specimen", "microbiologyLaboratorySentTo", e.target.value)}
                />
              </FieldRow>
            )}
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
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onUndo?.("additionalInfo")} title="Undo">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRedo?.("additionalInfo")} title="Redo">
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => onClear?.("additionalInfo")} title="Clear Section">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} placeholder="Enter Any Additional Information" value={periAnal.additionalInfo?.additionalInformation || ""} onChange={(e) => updatePeriAnal("additionalInfo", "additionalInformation", e.target.value)} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        {renderSectionHeader("Post-Operative Plan", "postOperativePlan", <ClipboardList className="h-5 w-5 text-gray-600" />, "postOperativePlan")}
        {expanded.postOperativePlan && (
          <CardContent className="px-6 py-4 space-y-4">
            {renderChoiceRow("Analgesia:", periAnal.postOperativePlan?.analgesia || "", ["Yes", "No"], (value) => updatePeriAnal("postOperativePlan", "analgesia", value))}
            {renderChoiceRow("Antibiotics (If Indicated):", periAnal.postOperativePlan?.antibiotics || "", ["Yes", "No"], (value) => updatePeriAnal("postOperativePlan", "antibiotics", value))}
            {renderChoiceRow("Sitz Baths:", periAnal.postOperativePlan?.sitzBaths || "", ["Yes", "No"], (value) => updatePeriAnal("postOperativePlan", "sitzBaths", value))}
            {renderChoiceRow("Packing Removal Time:", periAnal.postOperativePlan?.packingRemovalTime || "", ["Yes", "No"], (value) => updatePeriAnal("postOperativePlan", "packingRemovalTime", value))}
            {renderChoiceRow("Plan for Further Surgery:", periAnal.postOperativePlan?.planForFurtherSurgery || "", ["Yes", "No"], (value) => updatePeriAnal("postOperativePlan", "planForFurtherSurgery", value))}
          </CardContent>
        )}
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardList className="h-4 w-4 text-gray-600" />
            Post Operative Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} placeholder="Enter Post Operative Management Details" value={periAnal.additionalInfo?.postOperativeManagement || ""} onChange={(e) => updatePeriAnal("additionalInfo", "postOperativeManagement", e.target.value)} />
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
                <Input type="text" placeholder="Type Signature Name Or Leave Blank To Upload" value={periAnal.additionalInfo?.surgeonSignatureText || ""} onChange={(e) => updatePeriAnal("additionalInfo", "surgeonSignatureText", e.target.value)} />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updatePeriAnal("additionalInfo", "surgeonSignature", reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-xs text-gray-500">Upload Signature Or Stamp (Image/PDF)</p>
                {periAnal.additionalInfo?.surgeonSignature && (
                  <div className="space-y-1">
                    <p className="text-xs text-green-600">Signature Uploaded</p>
                    <div className="border rounded p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img src={periAnal.additionalInfo.surgeonSignature} alt="Signature preview" className="max-h-12 max-w-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Date/Time:</p>
              <div className="space-y-2">
                <DateTimeDDMMYYYY24HourInput
                  value={periAnal.additionalInfo?.dateTime || getLocalDateTimeValue()}
                  onChange={(value) => updatePeriAnal("additionalInfo", "dateTime", value)}
                />
                <Button variant="outline" size="sm" className="text-xs px-2 py-1" onClick={() => updatePeriAnal("additionalInfo", "dateTime", getLocalDateTimeValue())}>
                  Set Current Date/Time
                </Button>
                {periAnal.additionalInfo?.dateTime && (
                  <p className="text-xs text-gray-500">Display Format: {formatDateTimeDDMMYYYYWithDashes(periAnal.additionalInfo.dateTime)}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              className="glass-button text-xs"
              disabled={isGeneratingPDF || !onExportPDF}
              onClick={onExportPDF}
              type="button"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "Print/Export PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
