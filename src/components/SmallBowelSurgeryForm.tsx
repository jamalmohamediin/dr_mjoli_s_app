import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  User,
  Stethoscope,
  Activity,
  Scissors,
  Shield,
  ClipboardList,
  FileSearch,
  FileText,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  Trash2,
} from "lucide-react";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import {
  formatDateDDMMYYYY,
  formatDateOnly,
  getLocalDateTimeValue,
} from "@/utils/dateFormatter";
import { initialSmallBowelSurgeryState } from "@/utils/smallBowelSurgery";

interface SmallBowelSurgeryFormProps {
  currentReport: any;
  updateSmallBowel: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onClear?: (section: string) => void;
  onClearAll?: () => void;
  onUndo?: (section: string) => void;
  onRedo?: (section: string) => void;
  onExportPDF?: () => void;
  diagramElement?: React.ReactNode;
}

const pathologyOptions = [
  "Obstruction",
  "Ischemia / Gangrene",
  "Perforation",
  "Tumour",
  "Crohn's Disease",
  "Inflammatory Mass",
  "Suspected / Confirmed TB",
  "Trauma",
  "Bleeding Lesion",
  "Other",
];

const procedurePerformedOptions = [
  "Small Bowel Resection",
  "Repair of Perforation",
  "Adhesiolysis",
  "Stricturoplasty",
  "Enterotomy",
  "Stoma Formation",
  "Other",
];

const specimenOptions = [
  "Bowel",
  "Colon",
  "Lymph Nodes",
  "Liver",
  "Peritoneum",
  "Omentum",
  "Ascites",
  "Fluid / Pus",
  "Other",
];

const pointsOfDifficultyOptions = [
  "None",
  "Adhesions",
  "Fibrosis",
  "Bleeding",
  "Tumour Infiltration",
  "Anatomy Exposure",
  "Bowel Distension",
  "Limited Operative Space",
  "Equipment Problems",
  "Anaesthetic Problems",
  "Camera Handling",
  "Assistant Retraction",
  "Other",
];

const complicationOptions = [
  "None",
  "Bowel Injury",
  "Vascular Injury",
  "Adjacent Organ Injury",
  "Tumour Perforation",
  "Bleeding",
  "Stapler Malfunction",
  "Anaesthetic Events",
  "Other",
];

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

export const SmallBowelSurgeryForm = ({
  currentReport,
  updateSmallBowel,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onClear,
  onClearAll,
  onUndo,
  onRedo,
  onExportPDF,
  diagramElement,
}: SmallBowelSurgeryFormProps) => {
  const smallBowel = currentReport.smallBowel || initialSmallBowelSurgeryState;

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    Object.entries(updates).forEach(([field, value]) => {
      updateSmallBowel("patientInfo", field, value);
    });
  };
  const [expanded, setExpanded] = useState({
    basicData: true,
    operativeFindings: true,
    procedureDetails: true,
    accessPorts: true,
    reconstruction: true,
    operativeEvents: true,
  });

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
    updateSmallBowel(section, field, updated);
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
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
    updateSmallBowel("preoperative", field, value);

    const startTime = field === "startTime" ? value : smallBowel.preoperative?.startTime || "";
    const endTime = field === "endTime" ? value : smallBowel.preoperative?.endTime || "";

    if (startTime && endTime) {
      updateSmallBowel("preoperative", "duration", calculateDuration(startTime, endTime));
    }
  };

  const isConvertedToOpen = () =>
    toArray(smallBowel.procedure?.approach).includes("Laparoscopic Converted To Open");

  const isAnastomosisSelected = () =>
    toArray(smallBowel.reconstruction?.reconstructionType).includes("Anastomosis");

  const isStomaSelected = () =>
    toArray(smallBowel.reconstruction?.reconstructionType).includes("Stoma");

  const isOtherReconstructionSelected = () =>
    toArray(smallBowel.reconstruction?.reconstructionType).includes("Other");

  const isSutureSelected = () =>
    smallBowel.reconstruction?.anastomosisDetails?.technique === "Suture";

  const isStapledSelected = () =>
    smallBowel.reconstruction?.anastomosisDetails?.technique === "Stapled";

  const isDrainInserted = () => smallBowel.operativeEvents?.drainInsertion === "Yes";

  const isFascialClosureSelected = () =>
    toArray(smallBowel.closure?.fascialClosure).length > 0;

  const shouldShowSkinMaterial = () => {
    const skinClosures = toArray(smallBowel.closure?.skinClosure);
    const excludedClosures = [
      "Staples",
      "Tissue Glue",
      "Adhesive Strips",
      "Skin Left Open",
    ];
    return skinClosures.some((closure) => !excludedClosures.includes(closure));
  };

  const renderTeamField = (
    label: string,
    field: "surgeons" | "assistants" | "anaesthetists",
    placeholder: string
  ) => {
    const values = smallBowel.preoperative?.[field] || [""];

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
                  updateSmallBowel("preoperative", field, updated);
                }}
              />
              {index === values.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1"
                  onClick={() => updateSmallBowel("preoperative", field, [...values, ""])}
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
                    updateSmallBowel(
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
      <Collapsible
        open={expanded.basicData}
        onOpenChange={(open) => setExpanded((prev) => ({ ...prev, basicData: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-red-600" />
                    SECTION I: Basic Data & Preoperative Assessment
                  </div>
                  {expanded.basicData ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo("patientInfo")}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo("patientInfo")}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear("patientInfo")}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Patient Information</h3>
                <PatientInfoFields
                  patientInfo={smallBowel.patientInfo}
                  onFieldChange={(field, value) => updateSmallBowel("patientInfo", field, value)}
                  onBulkUpdate={onBulkPatientInfoUpdate || updatePatientInfoFields}
                  currentExtractedPatientInfo={currentExtractedPatientInfo}
                  onCurrentPatientChange={onCurrentPatientChange}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">
                  ASA Physical Status Classification
                </h3>
                <ASAClassificationSection
                  selectedASA={smallBowel.patientInfo?.asaScore || ""}
                  onASAChange={(value) => updateSmallBowel("patientInfo", "asaScore", value)}
                  notes={smallBowel.patientInfo?.asaNotes || ""}
                  onNotesChange={(value) => updateSmallBowel("patientInfo", "asaNotes", value)}
                  showNotes={true}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Preoperative Information</h3>
                <div className="space-y-4">
                  {renderTeamField("Surgeon:", "surgeons", "Enter Surgeon Name")}
                  {renderTeamField("Assistant:", "assistants", "Enter Assistant Name")}
                  {renderTeamField("Anaesthetist:", "anaesthetists", "Enter Anaesthetist Name")}

                  <div>
                    <label className="text-gray-800 font-medium mb-2 block">Indication for Surgery:</label>
                    <Textarea
                      placeholder="Enter indication for surgery"
                      value={smallBowel.preoperative?.indication || ""}
                      onChange={(e) => updateSmallBowel("preoperative", "indication", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-gray-800 font-medium mb-2 block">Operation Description:</label>
                    <Textarea
                      placeholder="Enter operation description"
                      value={smallBowel.preoperative?.operationDescription || ""}
                      onChange={(e) =>
                        updateSmallBowel("preoperative", "operationDescription", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Procedure Urgency:</p>
                    <div className="flex flex-wrap gap-4 ml-4">
                      {["Emergency", "Semi-Emergency", "Semi-Elective", "Elective"].map(
                        (urgency) => (
                          <div className="flex items-center" key={`sb-urgency-${urgency}`}>
                            <Checkbox
                              id={`sb-urgency-${urgency}`}
                              checked={smallBowel.preoperative?.procedureUrgency === urgency}
                              onCheckedChange={(checked) =>
                                updateSmallBowel(
                                  "preoperative",
                                  "procedureUrgency",
                                  checked ? urgency : ""
                                )
                              }
                            />
                            <label htmlFor={`sb-urgency-${urgency}`} className="ml-2 text-sm">
                              {urgency}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Preoperative Imaging:</p>
                    <div className="flex flex-wrap gap-4 ml-4">
                      {["None", "X-Ray", "Ultrasound", "CT Scan", "Contrast Study", "Other"].map(
                        (imaging) => (
                          <div className="flex items-center" key={`sb-imaging-${imaging}`}>
                            <Checkbox
                              id={`sb-imaging-${imaging}`}
                              checked={toArray(smallBowel.preoperative?.imaging).includes(imaging)}
                              onCheckedChange={() =>
                                toggleArrayValue(
                                  "preoperative",
                                  "imaging",
                                  imaging,
                                  smallBowel.preoperative?.imaging
                                )
                              }
                            />
                            <label htmlFor={`sb-imaging-${imaging}`} className="ml-2 text-sm">
                              {imaging}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                    {toArray(smallBowel.preoperative?.imaging).includes("Other") && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other imaging"
                          value={smallBowel.preoperative?.imagingOther || ""}
                          onChange={(e) => updateSmallBowel("preoperative", "imagingOther", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-gray-800 font-medium mb-3">Duration of Operation:</h4>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="text-gray-700 text-sm mb-1 block">Start Time:</label>
                        <Input
                          type="time"
                          value={smallBowel.preoperative?.startTime || ""}
                          onChange={(e) => handleTimeChange("startTime", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm mb-1 block">End Time:</label>
                        <Input
                          type="time"
                          value={smallBowel.preoperative?.endTime || ""}
                          onChange={(e) => handleTimeChange("endTime", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm mb-1 block">
                          Total Duration (Mins):
                        </label>
                        <Input
                          type="number"
                          value={smallBowel.preoperative?.duration || ""}
                          onChange={(e) => updateSmallBowel("preoperative", "duration", e.target.value)}
                          placeholder="Auto-calculated or enter manually"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={expanded.operativeFindings}
        onOpenChange={(open) =>
          setExpanded((prev) => ({ ...prev, operativeFindings: open }))
        }
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <FileSearch className="h-5 w-5 text-red-600" />
                    SECTION II: Operative Findings
                  </div>
                  {expanded.operativeFindings ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo("operativeFindings")}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo("operativeFindings")}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear("operativeFindings")}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Pathology Found:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {pathologyOptions.map((option) => (
                    <div className="flex items-center" key={`sb-pathology-${option}`}>
                      <Checkbox
                        id={`sb-pathology-${option}`}
                        checked={toArray(smallBowel.operativeFindings?.pathology).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "operativeFindings",
                            "pathology",
                            option,
                            smallBowel.operativeFindings?.pathology
                          )
                        }
                      />
                      <label htmlFor={`sb-pathology-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(smallBowel.operativeFindings?.pathology).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify other pathology"
                      value={smallBowel.operativeFindings?.pathologyOther || ""}
                      onChange={(e) =>
                        updateSmallBowel("operativeFindings", "pathologyOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Distance from DJ Flexure (cm):
                  </label>
                  <Input
                    type="text"
                    value={smallBowel.operativeFindings?.distanceFromDjFlexure || ""}
                    onChange={(e) =>
                      updateSmallBowel("operativeFindings", "distanceFromDjFlexure", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Distance from Ileocecal Valve (cm):
                  </label>
                  <Input
                    type="text"
                    value={smallBowel.operativeFindings?.distanceFromIleocecalValve || ""}
                    onChange={(e) =>
                      updateSmallBowel(
                        "operativeFindings",
                        "distanceFromIleocecalValve",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Length of Diseased Segment (cm):
                  </label>
                  <Input
                    type="text"
                    value={smallBowel.operativeFindings?.diseasedSegmentLength || ""}
                    onChange={(e) =>
                      updateSmallBowel(
                        "operativeFindings",
                        "diseasedSegmentLength",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Bowel Viability:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {["Viable", "Ischemic", "Gangrenous"].map((option) => (
                    <div className="flex items-center" key={`sb-viability-${option}`}>
                      <Checkbox
                        id={`sb-viability-${option}`}
                        checked={smallBowel.operativeFindings?.bowelViability === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "operativeFindings",
                            "bowelViability",
                            checked ? option : ""
                          )
                        }
                      />
                      <label htmlFor={`sb-viability-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Mesenteric Involvement:</p>
                  <div className="flex gap-4 ml-4">
                    {["Yes", "No"].map((option) => (
                      <div className="flex items-center" key={`sb-mesentery-${option}`}>
                        <Checkbox
                          id={`sb-mesentery-${option}`}
                          checked={smallBowel.operativeFindings?.mesentericInvolvement === option}
                          onCheckedChange={(checked) =>
                            updateSmallBowel(
                              "operativeFindings",
                              "mesentericInvolvement",
                              checked ? option : ""
                            )
                          }
                        />
                        <label htmlFor={`sb-mesentery-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Lymph Nodes:</p>
                  <div className="flex gap-4 ml-4">
                    {["Yes", "No"].map((option) => (
                      <div className="flex items-center" key={`sb-lymph-${option}`}>
                        <Checkbox
                          id={`sb-lymph-${option}`}
                          checked={smallBowel.operativeFindings?.lymphNodes === option}
                          onCheckedChange={(checked) =>
                            updateSmallBowel(
                              "operativeFindings",
                              "lymphNodes",
                              checked ? option : ""
                            )
                          }
                        />
                        <label htmlFor={`sb-lymph-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Degree of Contamination:
                </p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {["None", "Serous", "Purulent", "Feculent"].map((option) => (
                    <div className="flex items-center" key={`sb-contamination-${option}`}>
                      <Checkbox
                        id={`sb-contamination-${option}`}
                        checked={smallBowel.operativeFindings?.contamination === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "operativeFindings",
                            "contamination",
                            checked ? option : ""
                          )
                        }
                      />
                      <label htmlFor={`sb-contamination-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Adhesions:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {["None", "Limited", "Extensive"].map((option) => (
                    <div className="flex items-center" key={`sb-adhesions-${option}`}>
                      <Checkbox
                        id={`sb-adhesions-${option}`}
                        checked={smallBowel.operativeFindings?.adhesions === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "operativeFindings",
                            "adhesions",
                            checked ? option : ""
                          )
                        }
                      />
                      <label htmlFor={`sb-adhesions-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description of Findings:
                </label>
                <Textarea
                  placeholder="Enter operative findings"
                  value={smallBowel.operativeFindings?.description || ""}
                  onChange={(e) =>
                    updateSmallBowel("operativeFindings", "description", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={expanded.procedureDetails}
        onOpenChange={(open) =>
          setExpanded((prev) => ({ ...prev, procedureDetails: open }))
        }
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-red-600" />
                    SECTION III: Procedure Details
                  </div>
                  {expanded.procedureDetails ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo("procedure")}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo("procedure")}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear("procedure")}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Surgical Approach:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {["Open", "Laparoscopic", "Laparoscopic Converted To Open"].map((option) => (
                    <div className="flex items-center" key={`sb-approach-${option}`}>
                      <Checkbox
                        id={`sb-approach-${option}`}
                        checked={toArray(smallBowel.procedure?.approach).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "approach",
                            option,
                            smallBowel.procedure?.approach
                          )
                        }
                      />
                      <label htmlFor={`sb-approach-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {isConvertedToOpen() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                  <p className="text-sm font-medium text-gray-700 mb-3">Reason for Conversion:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Adhesions",
                      "Visceral Injury",
                      "Vascular Injury",
                      "Difficult Exposure",
                      "Difficult Visualization",
                      "Bleeding",
                      "Failure to Progress",
                      "Contamination",
                      "Other",
                    ].map((option) => (
                      <div className="flex items-center" key={`sb-conversion-${option}`}>
                        <Checkbox
                          id={`sb-conversion-${option}`}
                          checked={toArray(smallBowel.procedure?.reasonForConversion).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "reasonForConversion",
                              option,
                              smallBowel.procedure?.reasonForConversion
                            )
                          }
                        />
                        <label htmlFor={`sb-conversion-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(smallBowel.procedure?.reasonForConversion).includes("Other") && (
                    <div className="mt-3">
                      <Input
                        type="text"
                        placeholder="Specify other conversion reason"
                        value={smallBowel.procedure?.reasonForConversionOther || ""}
                        onChange={(e) =>
                          updateSmallBowel("procedure", "reasonForConversionOther", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Operation Done:
                </label>
                <Textarea
                  placeholder="Describe the procedure performed"
                  value={smallBowel.procedure?.operationDone || ""}
                  onChange={(e) => updateSmallBowel("procedure", "operationDone", e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Procedure Performed:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {procedurePerformedOptions.map((option) => (
                    <div className="flex items-center" key={`sb-procedure-performed-${option}`}>
                      <Checkbox
                        id={`sb-procedure-performed-${option}`}
                        checked={toArray(smallBowel.procedure?.procedurePerformed).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "procedure",
                            "procedurePerformed",
                            option,
                            smallBowel.procedure?.procedurePerformed
                          )
                        }
                      />
                      <label
                        htmlFor={`sb-procedure-performed-${option}`}
                        className="ml-2 text-sm"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(smallBowel.procedure?.procedurePerformed).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify other procedure performed"
                      value={smallBowel.procedure?.procedurePerformedOther || ""}
                      onChange={(e) =>
                        updateSmallBowel("procedure", "procedurePerformedOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              {toArray(smallBowel.procedure?.procedurePerformed).includes("Small Bowel Resection") && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800">Resection</h4>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Length Resected (cm):
                  </label>
                  <Input
                    type="text"
                    value={smallBowel.procedure?.lengthResected || ""}
                    onChange={(e) => updateSmallBowel("procedure", "lengthResected", e.target.value)}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Margins:</p>
                  <div className="flex flex-wrap gap-4 ml-4">
                    {["Grossly Healthy", "Frozen Section Taken"].map((option) => (
                      <div className="flex items-center" key={`sb-margins-${option}`}>
                        <Checkbox
                          id={`sb-margins-${option}`}
                          checked={toArray(smallBowel.procedure?.margins).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "margins",
                              option,
                              smallBowel.procedure?.margins
                            )
                          }
                        />
                        <label htmlFor={`sb-margins-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Method of Vascular Control:
                  </p>
                  <div className="flex flex-wrap gap-4 ml-4">
                    {["Ties", "Electrocautery", "Harmonic", "Ligasure", "Other"].map((option) => (
                      <div className="flex items-center" key={`sb-vascular-${option}`}>
                        <Checkbox
                          id={`sb-vascular-${option}`}
                          checked={toArray(smallBowel.procedure?.vascularControl).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "procedure",
                              "vascularControl",
                              option,
                              smallBowel.procedure?.vascularControl
                            )
                          }
                        />
                        <label htmlFor={`sb-vascular-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(smallBowel.procedure?.vascularControl).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify other vascular control method"
                        value={smallBowel.procedure?.vascularControlOther || ""}
                        onChange={(e) =>
                          updateSmallBowel("procedure", "vascularControlOther", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Adhesiolysis:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {["None", "Limited", "Extensive"].map((option) => (
                    <div className="flex items-center" key={`sb-procedure-adhesiolysis-${option}`}>
                      <Checkbox
                        id={`sb-procedure-adhesiolysis-${option}`}
                        checked={smallBowel.procedure?.adhesiolysis === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "procedure",
                            "adhesiolysis",
                            checked ? option : ""
                          )
                        }
                      />
                      <label
                        htmlFor={`sb-procedure-adhesiolysis-${option}`}
                        className="ml-2 text-sm"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Peritoneal Lavage:</p>
                <div className="flex gap-4 ml-4">
                  {["Yes", "None"].map((option) => (
                    <div className="flex items-center" key={`sb-lavage-${option}`}>
                      <Checkbox
                        id={`sb-lavage-${option}`}
                        checked={smallBowel.procedure?.peritonealLavage === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "procedure",
                            "peritonealLavage",
                            checked ? option : ""
                          )
                        }
                      />
                      <label htmlFor={`sb-lavage-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {smallBowel.procedure?.peritonealLavage === "Yes" && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Volume"
                      value={smallBowel.procedure?.peritonealLavageVolume || ""}
                      onChange={(e) =>
                        updateSmallBowel("procedure", "peritonealLavageVolume", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={expanded.accessPorts}
        onOpenChange={(open) => setExpanded((prev) => ({ ...prev, accessPorts: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-red-600" />
                    SECTION IV: Access and Ports
                  </div>
                  {expanded.accessPorts ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo("procedureFindings")}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo("procedureFindings")}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear("procedureFindings")}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {diagramElement && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Access and Ports</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Mark ports, stomas, and incisions on the diagram below.
                  </p>
                  {diagramElement}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={expanded.reconstruction}
        onOpenChange={(open) => setExpanded((prev) => ({ ...prev, reconstruction: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    SECTION V: Reconstruction
                  </div>
                  {expanded.reconstruction ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo("reconstruction")}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo("reconstruction")}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear("reconstruction")}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Reconstruction Type:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {["Anastomosis", "Stoma", "Other"].map((type) => (
                    <div className="flex items-center" key={`sb-reconstruction-${type}`}>
                      <Checkbox
                        id={`sb-reconstruction-${type}`}
                        checked={toArray(smallBowel.reconstruction?.reconstructionType).includes(type)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "reconstruction",
                            "reconstructionType",
                            type,
                            smallBowel.reconstruction?.reconstructionType
                          )
                        }
                      />
                      <label htmlFor={`sb-reconstruction-${type}`} className="ml-2 text-sm">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
                {isOtherReconstructionSelected() && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify other reconstruction type"
                      value={smallBowel.reconstruction?.reconstructionOther || ""}
                      onChange={(e) =>
                        updateSmallBowel("reconstruction", "reconstructionOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              {isAnastomosisSelected() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4">
                  <h4 className="font-medium text-gray-800">Anastomosis Details</h4>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Site of Anastomosis:</p>
                    <div className="flex gap-4 ml-4">
                      {["Intracorporeal", "Extracorporeal"].map((option) => (
                        <div className="flex items-center" key={`sb-site-${option}`}>
                          <Checkbox
                            id={`sb-site-${option}`}
                            checked={smallBowel.reconstruction?.anastomosisDetails?.site === option}
                            onCheckedChange={(checked) =>
                              updateSmallBowel("reconstruction", "anastomosisDetails", {
                                ...smallBowel.reconstruction?.anastomosisDetails,
                                site: checked ? option : "",
                              })
                            }
                          />
                          <label htmlFor={`sb-site-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Configuration:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        "End-End",
                        "End-Side",
                        "Side-End",
                        "Side-Side: Reverse Peristalsis",
                        "Side-Side: Isoperistaltic",
                        "Other",
                      ].map((option) => (
                        <div className="flex items-center" key={`sb-config-${option}`}>
                          <Checkbox
                            id={`sb-config-${option}`}
                            checked={
                              smallBowel.reconstruction?.anastomosisDetails?.configuration === option
                            }
                            onCheckedChange={(checked) =>
                              updateSmallBowel("reconstruction", "anastomosisDetails", {
                                ...smallBowel.reconstruction?.anastomosisDetails,
                                configuration: checked ? option : "",
                              })
                            }
                          />
                          <label htmlFor={`sb-config-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {smallBowel.reconstruction?.anastomosisDetails?.configuration === "Other" && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other configuration"
                          value={
                            smallBowel.reconstruction?.anastomosisDetails?.configurationOther || ""
                          }
                          onChange={(e) =>
                            updateSmallBowel("reconstruction", "anastomosisDetails", {
                              ...smallBowel.reconstruction?.anastomosisDetails,
                              configurationOther: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Anastomotic Technique:
                    </p>
                    <div className="flex gap-4 ml-4">
                      {["Suture", "Stapled"].map((option) => (
                        <div className="flex items-center" key={`sb-technique-${option}`}>
                          <Checkbox
                            id={`sb-technique-${option}`}
                            checked={smallBowel.reconstruction?.anastomosisDetails?.technique === option}
                            onCheckedChange={(checked) =>
                              updateSmallBowel("reconstruction", "anastomosisDetails", {
                                ...smallBowel.reconstruction?.anastomosisDetails,
                                technique: checked ? option : "",
                              })
                            }
                          />
                          <label htmlFor={`sb-technique-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isSutureSelected() && (
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Suture Material:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {["PDS", "Vicryl", "Prolene", "V-Loc", "Monocryl", "Other"].map(
                          (option) => (
                            <div className="flex items-center" key={`sb-suture-${option}`}>
                              <Checkbox
                                id={`sb-suture-${option}`}
                                checked={toArray(
                                  smallBowel.reconstruction?.anastomosisDetails?.sutureMaterial
                                ).includes(option)}
                                onCheckedChange={() => {
                                  const current = toArray(
                                    smallBowel.reconstruction?.anastomosisDetails?.sutureMaterial
                                  );
                                  const updated = current.includes(option)
                                    ? current.filter((item) => item !== option)
                                    : [...current, option];

                                  updateSmallBowel("reconstruction", "anastomosisDetails", {
                                    ...smallBowel.reconstruction?.anastomosisDetails,
                                    sutureMaterial: updated,
                                  });
                                }}
                              />
                              <label htmlFor={`sb-suture-${option}`} className="ml-2 text-sm">
                                {option}
                              </label>
                            </div>
                          )
                        )}
                      </div>
                      {toArray(
                        smallBowel.reconstruction?.anastomosisDetails?.sutureMaterial
                      ).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input
                            type="text"
                            placeholder="Specify other suture material"
                            value={
                              smallBowel.reconstruction?.anastomosisDetails?.sutureMaterialOther || ""
                            }
                            onChange={(e) =>
                              updateSmallBowel("reconstruction", "anastomosisDetails", {
                                ...smallBowel.reconstruction?.anastomosisDetails,
                                sutureMaterialOther: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {isStapledSelected() && (
                    <>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Linear Stapler Sizes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-4">
                          {["45", "60", "75", "80", "100", "Other"].map((option) => (
                            <div className="flex items-center" key={`sb-linear-${option}`}>
                              <Checkbox
                                id={`sb-linear-${option}`}
                                checked={toArray(
                                  smallBowel.reconstruction?.anastomosisDetails?.linearStaplerSize
                                ).includes(option)}
                                onCheckedChange={() => {
                                  const current = toArray(
                                    smallBowel.reconstruction?.anastomosisDetails?.linearStaplerSize
                                  );
                                  const updated = current.includes(option)
                                    ? current.filter((item) => item !== option)
                                    : [...current, option];

                                  updateSmallBowel("reconstruction", "anastomosisDetails", {
                                    ...smallBowel.reconstruction?.anastomosisDetails,
                                    linearStaplerSize: updated,
                                  });
                                }}
                              />
                              <label htmlFor={`sb-linear-${option}`} className="ml-2 text-sm">
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                        {toArray(
                          smallBowel.reconstruction?.anastomosisDetails?.linearStaplerSize
                        ).includes("Other") && (
                          <div className="mt-3 ml-4">
                            <Input
                              type="text"
                              placeholder="Specify other linear stapler size"
                              value={
                                smallBowel.reconstruction?.anastomosisDetails?.linearStaplerSizeOther ||
                                ""
                              }
                              onChange={(e) =>
                                updateSmallBowel("reconstruction", "anastomosisDetails", {
                                  ...smallBowel.reconstruction?.anastomosisDetails,
                                  linearStaplerSizeOther: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Circular Stapler Sizes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 ml-4">
                          {["27", "28", "29", "30", "31", "32", "33", "Other"].map(
                            (option) => (
                              <div className="flex items-center" key={`sb-circular-${option}`}>
                                <Checkbox
                                  id={`sb-circular-${option}`}
                                  checked={toArray(
                                    smallBowel.reconstruction?.anastomosisDetails?.circularStaplerSize
                                  ).includes(option)}
                                  onCheckedChange={() => {
                                    const current = toArray(
                                      smallBowel.reconstruction?.anastomosisDetails?.circularStaplerSize
                                    );
                                    const updated = current.includes(option)
                                      ? current.filter((item) => item !== option)
                                      : [...current, option];

                                    updateSmallBowel("reconstruction", "anastomosisDetails", {
                                      ...smallBowel.reconstruction?.anastomosisDetails,
                                      circularStaplerSize: updated,
                                    });
                                  }}
                                />
                                <label htmlFor={`sb-circular-${option}`} className="ml-2 text-sm">
                                  {option}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                        {toArray(
                          smallBowel.reconstruction?.anastomosisDetails?.circularStaplerSize
                        ).includes("Other") && (
                          <div className="mt-3 ml-4">
                            <Input
                              type="text"
                              placeholder="Specify other circular stapler size"
                              value={
                                smallBowel.reconstruction?.anastomosisDetails?.circularStaplerSizeOther ||
                                ""
                              }
                              onChange={(e) =>
                                updateSmallBowel("reconstruction", "anastomosisDetails", {
                                  ...smallBowel.reconstruction?.anastomosisDetails,
                                  circularStaplerSizeOther: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {isStomaSelected() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4">
                  <h4 className="font-medium text-gray-800">Stoma Details</h4>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Type of Ileostomy:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {["Double Barrel", "End", "Loop", "Mucous Fistula", "Other"].map(
                        (option) => (
                          <div className="flex items-center" key={`sb-ileostomy-${option}`}>
                            <Checkbox
                              id={`sb-ileostomy-${option}`}
                              checked={smallBowel.reconstruction?.stomaDetails?.ileostomyType === option}
                              onCheckedChange={(checked) =>
                                updateSmallBowel("reconstruction", "stomaDetails", {
                                  ...smallBowel.reconstruction?.stomaDetails,
                                  ileostomyType: checked ? option : "",
                                })
                              }
                            />
                            <label htmlFor={`sb-ileostomy-${option}`} className="ml-2 text-sm">
                              {option}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                    {smallBowel.reconstruction?.stomaDetails?.ileostomyType === "Other" && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other ileostomy type"
                          value={smallBowel.reconstruction?.stomaDetails?.ileostomyTypeOther || ""}
                          onChange={(e) =>
                            updateSmallBowel("reconstruction", "stomaDetails", {
                              ...smallBowel.reconstruction?.stomaDetails,
                              ileostomyTypeOther: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        "Right Lower Quadrant",
                        "Left Lower Quadrant",
                        "Right Upper Quadrant",
                        "Left Upper Quadrant",
                        "Other",
                      ].map((option) => (
                        <div className="flex items-center" key={`sb-stoma-location-${option}`}>
                          <Checkbox
                            id={`sb-stoma-location-${option}`}
                            checked={smallBowel.reconstruction?.stomaDetails?.location === option}
                            onCheckedChange={(checked) =>
                              updateSmallBowel("reconstruction", "stomaDetails", {
                                ...smallBowel.reconstruction?.stomaDetails,
                                location: checked ? option : "",
                              })
                            }
                          />
                          <label
                            htmlFor={`sb-stoma-location-${option}`}
                            className="ml-2 text-sm"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {smallBowel.reconstruction?.stomaDetails?.location === "Other" && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other stoma location"
                          value={smallBowel.reconstruction?.stomaDetails?.locationOther || ""}
                          onChange={(e) =>
                            updateSmallBowel("reconstruction", "stomaDetails", {
                              ...smallBowel.reconstruction?.stomaDetails,
                              locationOther: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Stoma Eversion:</p>
                    <div className="flex gap-4 ml-4">
                      {["Yes", "No"].map((option) => (
                        <div className="flex items-center" key={`sb-eversion-${option}`}>
                          <Checkbox
                            id={`sb-eversion-${option}`}
                            checked={smallBowel.reconstruction?.stomaDetails?.eversion === option}
                            onCheckedChange={(checked) =>
                              updateSmallBowel("reconstruction", "stomaDetails", {
                                ...smallBowel.reconstruction?.stomaDetails,
                                eversion: checked ? option : "",
                              })
                            }
                          />
                          <label htmlFor={`sb-eversion-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Site of Maturation:</p>
                    <div className="flex gap-4 ml-4">
                      {["Fascia", "Skin"].map((option) => (
                        <div className="flex items-center" key={`sb-maturation-${option}`}>
                          <Checkbox
                            id={`sb-maturation-${option}`}
                            checked={smallBowel.reconstruction?.stomaDetails?.maturationSite === option}
                            onCheckedChange={(checked) =>
                              updateSmallBowel("reconstruction", "stomaDetails", {
                                ...smallBowel.reconstruction?.stomaDetails,
                                maturationSite: checked ? option : "",
                              })
                            }
                          />
                          <label htmlFor={`sb-maturation-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Material Used:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {["Vicryl", "Monocryl", "PDS", "Prolene", "Other"].map((option) => (
                        <div className="flex items-center" key={`sb-stoma-material-${option}`}>
                          <Checkbox
                            id={`sb-stoma-material-${option}`}
                            checked={toArray(
                              smallBowel.reconstruction?.stomaDetails?.materialUsed
                            ).includes(option)}
                            onCheckedChange={() => {
                              const current = toArray(
                                smallBowel.reconstruction?.stomaDetails?.materialUsed
                              );
                              const updated = current.includes(option)
                                ? current.filter((item) => item !== option)
                                : [...current, option];

                              updateSmallBowel("reconstruction", "stomaDetails", {
                                ...smallBowel.reconstruction?.stomaDetails,
                                materialUsed: updated,
                              });
                            }}
                          />
                          <label htmlFor={`sb-stoma-material-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {toArray(smallBowel.reconstruction?.stomaDetails?.materialUsed).includes(
                      "Other"
                    ) && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other stoma material"
                          value={smallBowel.reconstruction?.stomaDetails?.materialUsedOther || ""}
                          onChange={(e) =>
                            updateSmallBowel("reconstruction", "stomaDetails", {
                              ...smallBowel.reconstruction?.stomaDetails,
                              materialUsedOther: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={expanded.operativeEvents}
        onOpenChange={(open) => setExpanded((prev) => ({ ...prev, operativeEvents: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-red-600" />
                    SECTION VI: Operative Events & Closure
                  </div>
                  {expanded.operativeEvents ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo("operativeEvents")}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo("operativeEvents")}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear("operativeEvents")}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Points of Difficulty:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {pointsOfDifficultyOptions.map((option) => (
                    <div className="flex items-center" key={`sb-difficulty-${option}`}>
                      <Checkbox
                        id={`sb-difficulty-${option}`}
                        checked={toArray(smallBowel.operativeEvents?.pointsOfDifficulty).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "operativeEvents",
                            "pointsOfDifficulty",
                            option,
                            smallBowel.operativeEvents?.pointsOfDifficulty
                          )
                        }
                      />
                      <label htmlFor={`sb-difficulty-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(smallBowel.operativeEvents?.pointsOfDifficulty).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify other difficulty"
                      value={smallBowel.operativeEvents?.pointsOfDifficultyOther || ""}
                      onChange={(e) =>
                        updateSmallBowel("operativeEvents", "pointsOfDifficultyOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Intraoperative Events / Complications:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {complicationOptions.map((option) => (
                    <div className="flex items-center" key={`sb-event-${option}`}>
                      <Checkbox
                        id={`sb-event-${option}`}
                        checked={toArray(smallBowel.operativeEvents?.intraoperativeEvents).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "operativeEvents",
                            "intraoperativeEvents",
                            option,
                            smallBowel.operativeEvents?.intraoperativeEvents
                          )
                        }
                      />
                      <label htmlFor={`sb-event-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {(toArray(smallBowel.operativeEvents?.intraoperativeEvents).includes(
                  "Adjacent Organ Injury"
                ) ||
                  toArray(smallBowel.operativeEvents?.intraoperativeEvents).includes("Bleeding") ||
                  toArray(smallBowel.operativeEvents?.intraoperativeEvents).includes(
                    "Anaesthetic Events"
                  ) ||
                  toArray(smallBowel.operativeEvents?.intraoperativeEvents).includes("Other")) && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify details"
                      value={smallBowel.operativeEvents?.intraoperativeEventsOther || ""}
                      onChange={(e) =>
                        updateSmallBowel(
                          "operativeEvents",
                          "intraoperativeEventsOther",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Specimen:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {specimenOptions.map((option) => (
                    <div className="flex items-center" key={`sb-specimen-${option}`}>
                      <Checkbox
                        id={`sb-specimen-${option}`}
                        checked={toArray(smallBowel.operativeEvents?.specimen).includes(option)}
                        onCheckedChange={() =>
                          toggleArrayValue(
                            "operativeEvents",
                            "specimen",
                            option,
                            smallBowel.operativeEvents?.specimen
                          )
                        }
                      />
                      <label htmlFor={`sb-specimen-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {toArray(smallBowel.operativeEvents?.specimen).includes("Other") && (
                  <div className="mt-3 ml-4">
                    <Input
                      type="text"
                      placeholder="Specify other specimen"
                      value={smallBowel.operativeEvents?.specimenOther || ""}
                      onChange={(e) =>
                        updateSmallBowel("operativeEvents", "specimenOther", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Wound Protector Used:</p>
                <div className="flex gap-4 ml-4">
                  {["Yes", "No"].map((option) => (
                    <div className="flex items-center" key={`sb-wound-protector-${option}`}>
                      <Checkbox
                        id={`sb-wound-protector-${option}`}
                        checked={smallBowel.operativeEvents?.woundProtector === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "operativeEvents",
                            "woundProtector",
                            checked ? option : ""
                          )
                        }
                      />
                      <label htmlFor={`sb-wound-protector-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Peritoneal Drainage:</p>
                <div className="flex gap-4 ml-4">
                  {["No", "Yes"].map((option) => (
                    <div className="flex items-center" key={`sb-drain-${option}`}>
                      <Checkbox
                        id={`sb-drain-${option}`}
                        checked={smallBowel.operativeEvents?.drainInsertion === option}
                        onCheckedChange={(checked) =>
                          updateSmallBowel(
                            "operativeEvents",
                            "drainInsertion",
                            checked ? option : ""
                          )
                        }
                      />
                      <label htmlFor={`sb-drain-${option}`} className="ml-2 text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {isDrainInserted() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4">
                  <h4 className="font-medium text-gray-800">Drain Details</h4>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Type of Drain:</p>
                    <div className="grid grid-cols-1 gap-2 ml-4">
                      {[
                        "Open Drainage",
                        "Closed Suction Drain",
                        "Closed Passive Drain",
                        "Other",
                      ].map((option) => (
                        <div className="flex items-center" key={`sb-drain-type-${option}`}>
                          <Checkbox
                            id={`sb-drain-type-${option}`}
                            checked={toArray(smallBowel.operativeEvents?.drainType).includes(option)}
                            onCheckedChange={() =>
                              toggleArrayValue(
                                "operativeEvents",
                                "drainType",
                                option,
                                smallBowel.operativeEvents?.drainType
                              )
                            }
                          />
                          <label htmlFor={`sb-drain-type-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {(toArray(smallBowel.operativeEvents?.drainType).includes(
                      "Closed Suction Drain"
                    ) ||
                      toArray(smallBowel.operativeEvents?.drainType).includes(
                        "Closed Passive Drain"
                      ) ||
                      toArray(smallBowel.operativeEvents?.drainType).includes("Other")) && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify drain type or location"
                          value={smallBowel.operativeEvents?.drainTypeOther || ""}
                          onChange={(e) =>
                            updateSmallBowel("operativeEvents", "drainTypeOther", e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Intra-Peritoneal Drain Placement:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        "Right Subphrenic Space",
                        "Right Subhepatic Space",
                        "Right Paracolic Gutter",
                        "Left Subphrenic Space",
                        "Left Subhepatic Space",
                        "Left Paracolic Gutter",
                        "Pelvis",
                        "Adjacent to Anastomosis",
                        "Other",
                      ].map((option) => (
                        <div className="flex items-center" key={`sb-placement-${option}`}>
                          <Checkbox
                            id={`sb-placement-${option}`}
                            checked={toArray(
                              smallBowel.operativeEvents?.intraPeritonealPlacement
                            ).includes(option)}
                            onCheckedChange={() =>
                              toggleArrayValue(
                                "operativeEvents",
                                "intraPeritonealPlacement",
                                option,
                                smallBowel.operativeEvents?.intraPeritonealPlacement
                              )
                            }
                          />
                          <label htmlFor={`sb-placement-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {toArray(smallBowel.operativeEvents?.intraPeritonealPlacement).includes(
                      "Other"
                    ) && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other placement"
                          value={smallBowel.operativeEvents?.intraPeritonealPlacementOther || ""}
                          onChange={(e) =>
                            updateSmallBowel(
                              "operativeEvents",
                              "intraPeritonealPlacementOther",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Exit Site of Drain:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        "Right Upper Quadrant",
                        "Right Lower Quadrant",
                        "Left Upper Quadrant",
                        "Left Lower Quadrant",
                        "Perineum",
                        "Other",
                      ].map((option) => (
                        <div className="flex items-center" key={`sb-exit-site-${option}`}>
                          <Checkbox
                            id={`sb-exit-site-${option}`}
                            checked={toArray(smallBowel.operativeEvents?.drainExitSite).includes(option)}
                            onCheckedChange={() =>
                              toggleArrayValue(
                                "operativeEvents",
                                "drainExitSite",
                                option,
                                smallBowel.operativeEvents?.drainExitSite
                              )
                            }
                          />
                          <label htmlFor={`sb-exit-site-${option}`} className="ml-2 text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {toArray(smallBowel.operativeEvents?.drainExitSite).includes("Other") && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other exit site"
                          value={smallBowel.operativeEvents?.drainExitSiteOther || ""}
                          onChange={(e) =>
                            updateSmallBowel(
                              "operativeEvents",
                              "drainExitSiteOther",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Closure Details</h3>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {[
                      "5mm Port Site",
                      "10/11mm Port Site",
                      "12mm Port Site",
                      "15mm Port Site",
                      "Access Incision",
                      "Laparotomy",
                      "Other",
                    ].map((option) => (
                      <div className="flex items-center" key={`sb-fascial-${option}`}>
                        <Checkbox
                          id={`sb-fascial-${option}`}
                          checked={toArray(smallBowel.closure?.fascialClosure).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "closure",
                              "fascialClosure",
                              option,
                              smallBowel.closure?.fascialClosure
                            )
                          }
                        />
                        <label htmlFor={`sb-fascial-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(smallBowel.closure?.fascialClosure).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify other fascial closure"
                        value={smallBowel.closure?.fascialClosureOther || ""}
                        onChange={(e) =>
                          updateSmallBowel("closure", "fascialClosureOther", e.target.value)
                        }
                      />
                    </div>
                  )}

                  {isFascialClosureSelected() && (
                    <div className="mt-3 ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Suture Material:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {["Nylon", "PDS", "Vicryl", "Ethibond", "Other"].map((option) => (
                          <div className="flex items-center" key={`sb-fascial-suture-${option}`}>
                            <Checkbox
                              id={`sb-fascial-suture-${option}`}
                              checked={toArray(smallBowel.closure?.fascialSutureMaterial).includes(
                                option
                              )}
                              onCheckedChange={() =>
                                toggleArrayValue(
                                  "closure",
                                  "fascialSutureMaterial",
                                  option,
                                  smallBowel.closure?.fascialSutureMaterial
                                )
                              }
                            />
                            <label
                              htmlFor={`sb-fascial-suture-${option}`}
                              className="ml-2 text-sm"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                      {toArray(smallBowel.closure?.fascialSutureMaterial).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input
                            type="text"
                            placeholder="Specify other fascial suture material"
                            value={smallBowel.closure?.fascialSutureMaterialOther || ""}
                            onChange={(e) =>
                              updateSmallBowel(
                                "closure",
                                "fascialSutureMaterialOther",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Skin Closure:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {[
                      "Subcuticular Interrupted",
                      "Subcuticular Continuous",
                      "Interrupted Sutures",
                      "Continuous Suture",
                      "Staples",
                      "Tissue Glue",
                      "Adhesive Strips",
                      "Skin Left Open",
                      "Other",
                    ].map((option) => (
                      <div className="flex items-center" key={`sb-skin-${option}`}>
                        <Checkbox
                          id={`sb-skin-${option}`}
                          checked={toArray(smallBowel.closure?.skinClosure).includes(option)}
                          onCheckedChange={() =>
                            toggleArrayValue(
                              "closure",
                              "skinClosure",
                              option,
                              smallBowel.closure?.skinClosure
                            )
                          }
                        />
                        <label htmlFor={`sb-skin-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {toArray(smallBowel.closure?.skinClosure).includes("Other") && (
                    <div className="mt-3 ml-4">
                      <Input
                        type="text"
                        placeholder="Specify other skin closure"
                        value={smallBowel.closure?.skinClosureOther || ""}
                        onChange={(e) =>
                          updateSmallBowel("closure", "skinClosureOther", e.target.value)
                        }
                      />
                    </div>
                  )}

                  {shouldShowSkinMaterial() && (
                    <div className="mt-3 ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Material / Method:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {["Monocryl", "V-Loc", "Nylon", "Staples", "Other"].map((option) => (
                          <div className="flex items-center" key={`sb-skin-material-${option}`}>
                            <Checkbox
                              id={`sb-skin-material-${option}`}
                              checked={toArray(smallBowel.closure?.skinClosureMaterial).includes(
                                option
                              )}
                              onCheckedChange={() =>
                                toggleArrayValue(
                                  "closure",
                                  "skinClosureMaterial",
                                  option,
                                  smallBowel.closure?.skinClosureMaterial
                                )
                              }
                            />
                            <label
                              htmlFor={`sb-skin-material-${option}`}
                              className="ml-2 text-sm"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                      {toArray(smallBowel.closure?.skinClosureMaterial).includes("Other") && (
                        <div className="mt-3 ml-4">
                          <Input
                            type="text"
                            placeholder="Specify other skin closure material"
                            value={smallBowel.closure?.skinClosureMaterialOther || ""}
                            onChange={(e) =>
                              updateSmallBowel(
                                "closure",
                                "skinClosureMaterialOther",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Additional Information:</label>
                <Textarea
                  className="mt-2"
                  placeholder="Enter any additional information"
                  value={smallBowel.additionalInfo?.additionalInformation || ""}
                  onChange={(e) =>
                    updateSmallBowel("additionalInfo", "additionalInformation", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Post Operative Management:
                </label>
                <Textarea
                  className="mt-2"
                  placeholder="Enter post operative management details"
                  value={smallBowel.additionalInfo?.postOperativeManagement || ""}
                  onChange={(e) =>
                    updateSmallBowel("additionalInfo", "postOperativeManagement", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
                  value={smallBowel.additionalInfo?.surgeonSignatureText || ""}
                  onChange={(e) =>
                    updateSmallBowel("additionalInfo", "surgeonSignatureText", e.target.value)
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
                      updateSmallBowel("additionalInfo", "surgeonSignature", reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-xs text-gray-500">Upload signature or stamp (Image/PDF)</p>
                {smallBowel.additionalInfo?.surgeonSignature && (
                  <div className="space-y-1">
                    <p className="text-xs text-green-600">✓ Signature uploaded</p>
                    <div className="border rounded p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img
                        src={smallBowel.additionalInfo.surgeonSignature}
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
                <Input
                  type="datetime-local"
                  value={smallBowel.additionalInfo?.dateTime || getLocalDateTimeValue()}
                  onChange={(e) => updateSmallBowel("additionalInfo", "dateTime", e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1"
                  onClick={() =>
                    updateSmallBowel("additionalInfo", "dateTime", getLocalDateTimeValue())
                  }
                >
                  Set Current Date/Time
                </Button>
                {smallBowel.additionalInfo?.dateTime && (
                  <p className="text-xs text-gray-500">
                    Display format: {formatDateOnly(smallBowel.additionalInfo.dateTime)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(onExportPDF || onClearAll) && (
        <div className="flex flex-wrap justify-end gap-3">
          {onClearAll && (
            <Button variant="destructive" onClick={onClearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          )}
          {onExportPDF && (
            <Button onClick={onExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Preview & Export PDF
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
