import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import {
  CheckboxGrid,
  LabeledInput,
  LabeledTextarea,
  OptionalOtherInput,
  RadioGrid,
} from "@/components/TemplateFormHelpers";
import { DateTimeDDMMYYYY24HourInput } from "@/components/Time24HourInput";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
import { createInitialInguinalHerniaState } from "@/utils/inguinalHernia";
import { toArray } from "@/utils/templateDataHelpers";

interface InguinalHerniaRepairFormProps {
  currentReport: any;
  updateTemplate: (section: string, field: string, value: any) => void;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  isGeneratingPDF?: boolean;
  diagramElement?: React.ReactNode;
}

const indicationOptions = [
  "Primary inguinal hernia",
  "Recurrent inguinal hernia",
  "Incarcerated hernia",
  "Strangulated hernia",
  "Obstructed hernia",
  "Irreducible hernia",
  "Other",
];
const urgencyOptions = ["Elective", "Semi-elective", "Semi-urgent", "Emergency"];
const typeOptions = ["Indirect", "Direct", "Pantaloon", "Femoral", "Sliding", "Obturator", "Other"];
const sideOptions = ["Right", "Left", "Bilateral"];
const defectSizeOptions = ["<1.5 cm", "1.5–3 cm", ">3 cm"];
const contentOptions = ["Omentum", "Small bowel", "Large bowel", "Bladder", "Appendix", "Empty sac", "Cord Lipoma", "Other"];
const posteriorWallOptions = ["Intact", "Attenuated", "Deficient"];
const techniqueOptions = [
  "Lichtenstein tension-free mesh repair",
  "Shouldice repair",
  "Bassini repair",
  "McVay repair",
  "Laparoscopic inguinal hernia repair",
  "Other",
];
const approachOptions = ["Open repair", "Laparoscopic repair", "Laparoscopic converted to open", "Other"];
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
const incisionUsedOptions = ["Transverse", "Oblique", "Other"];
const cordStructureOptions = ["Mobilized and preserved", "Mobilized and divided", "Cord lipoma excision"];
const nerveOptions = ["None", "Ilioinguinal nerve", "Iliohypogastric nerve", "Genital branch of genitofemoral nerve"];
const sacManagementOptions = ["Not Identified", "Reduced", "Ligated and excised", "Divided", "Invaginated", "Plicated"];
const deepRingOptions = ["Not required", "Narrowed"];
const repairTechniqueOptions = ["Tissue repair", "Mesh repair"];
const tissueReconstructionOptions = ["Bassini", "Shouldice", "McVay", "Desarda", "Other"];
const sutureMethodOptions = ["Continuous", "Interrupted"];
const meshPositionOptions = ["On posterior wall around cord", "Preperitoneal space", "Other"];
const fixationOptions = ["Not fixed", "Sutured", "Glue", "Self-gripping"];
const fixationPointOptions = ["Pubic tubercle", "Inguinal ligament", "Conjoint tendon", "Cooper’s ligament", "Other"];
const lapApproachOptions = ["TEP (Totally Extraperitoneal)", "TAPP (Transabdominal Preperitoneal)"];
const preperitonealOptions = ["Balloon dissection", "Instrument dissection", "telescope dissection", "other"];
const landmarkOptions = [
  "Inferior epigastric vessels",
  "Pubic symphysis",
  "Cooper’s ligament",
  "Vas deferens",
  "Testicular vessels",
  "Triangle of Doom",
  "Triangle of Pain",
];
const lapSacOptions = ["Reduced", "Transacted"];
const lapFixationOptions = ["None", "Self-gripping", "Tacks", "Sutures", "Glue"];
const lapFixationSiteOptions = ["Symphysis pubis", "Cooper’s ligament", "Anterior abdominal wall", "Other"];
const peritoneumClosureOptions = ["Not applicable", "Not closed", "Continuous suture", "Tacks"];
const openSkinClosureOptions = ["Sutures", "Staples", "Subcuticular"];
const lapSkinClosureOptions = ["Sutures", "Staples", "Glue"];
const complicationOptions = [
  "None",
  "Bleeding",
  "Peritoneal tear",
  "Bowel injury",
  "Bladder injury",
  "Vascular injury",
  "Nerve injury",
  "Other",
];

export const InguinalHerniaRepairForm = ({
  currentReport,
  updateTemplate,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  isGeneratingPDF,
  diagramElement,
}: InguinalHerniaRepairFormProps) => {
  const template = currentReport.inguinalHernia || createInitialInguinalHerniaState();
  const preoperative = template.preoperative;
  const operativeFindings = template.operativeFindings;
  const procedure = template.procedure;
  const closure = template.closure;
  const complications = template.complications;
  const additionalInfo = template.additionalInfo;
  const isConvertedToOpen = procedure.approach === "Laparoscopic converted to open";
  const showOpenRepairSection = procedure.approach === "Open repair" || isConvertedToOpen;
  const showLaparoscopicRepairSection = procedure.approach === "Laparoscopic repair" || isConvertedToOpen;
  const selectedRepairTechniques = toArray(procedure.repairTechnique);
  const showTissueRepairSection = selectedRepairTechniques.includes("Tissue repair");
  const showMeshRepairSection = selectedRepairTechniques.includes("Mesh repair");

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    if (onBulkPatientInfoUpdate) {
      onBulkPatientInfoUpdate(updates);
      return;
    }

    Object.entries(updates).forEach(([field, value]) => updateTemplate("patientInfo", field, value));
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card-light">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Inguinal Hernia Repair - Synoptic Report</CardTitle>
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
          <CheckboxGrid
            label="Indication for Surgery"
            options={indicationOptions}
            values={preoperative.indication}
            onChange={(value) => updateTemplate("preoperative", "indication", value)}
          />
          <OptionalOtherInput
            enabled={toArray(preoperative.indication).includes("Other")}
            value={preoperative.indicationOther || ""}
            placeholder="Specify other indication"
            onChange={(value) => updateTemplate("preoperative", "indicationOther", value)}
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

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Operative Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Type" options={typeOptions} values={operativeFindings.type} onChange={(value) => updateTemplate("operativeFindings", "type", value)} />
          <OptionalOtherInput
            enabled={toArray(operativeFindings.type).includes("Other")}
            value={operativeFindings.typeOther || ""}
            placeholder="Specify other hernia type"
            onChange={(value) => updateTemplate("operativeFindings", "typeOther", value)}
          />
          <RadioGrid label="Side" options={sideOptions} value={operativeFindings.side || ""} onChange={(value) => updateTemplate("operativeFindings", "side", value)} columns="grid-cols-3" />
          <RadioGrid label="Size of defect" options={defectSizeOptions} value={operativeFindings.sizeOfDefect || ""} onChange={(value) => updateTemplate("operativeFindings", "sizeOfDefect", value)} columns="grid-cols-3" />
          <CheckboxGrid label="Hernia contents" options={contentOptions} values={operativeFindings.contents} onChange={(value) => updateTemplate("operativeFindings", "contents", value)} />
          <OptionalOtherInput
            enabled={toArray(operativeFindings.contents).includes("Other")}
            value={operativeFindings.contentsOther || ""}
            placeholder="Specify other hernia content"
            onChange={(value) => updateTemplate("operativeFindings", "contentsOther", value)}
          />
          <RadioGrid label="Posterior wall" options={posteriorWallOptions} value={operativeFindings.posteriorWall || ""} onChange={(value) => updateTemplate("operativeFindings", "posteriorWall", value)} columns="grid-cols-3" />
          <LabeledTextarea label="Additional pathology" value={operativeFindings.additionalPathology || ""} onChange={(value) => updateTemplate("operativeFindings", "additionalPathology", value)} rows={3} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Procedure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea label="Description of procedure" value={procedure.description || ""} onChange={(value) => updateTemplate("procedure", "description", value)} rows={4} />
          <CheckboxGrid label="Technique used" options={techniqueOptions} values={procedure.technique} onChange={(value) => updateTemplate("procedure", "technique", value)} />
          <OptionalOtherInput
            enabled={toArray(procedure.technique).includes("Other")}
            value={procedure.techniqueOther || ""}
            placeholder="Specify other technique"
            onChange={(value) => updateTemplate("procedure", "techniqueOther", value)}
          />
          <RadioGrid label="Approach" options={approachOptions} value={procedure.approach || ""} onChange={(value) => updateTemplate("procedure", "approach", value)} />
          <OptionalOtherInput
            enabled={procedure.approach === "Other"}
            value={procedure.approachOther || ""}
            placeholder="Specify other approach"
            onChange={(value) => updateTemplate("procedure", "approachOther", value)}
          />
          {procedure.approach === "Laparoscopic converted to open" ? (
            <>
              <CheckboxGrid label="Reason for conversion" options={conversionReasonOptions} values={procedure.reasonForConversion} onChange={(value) => updateTemplate("procedure", "reasonForConversion", value)} />
              <OptionalOtherInput
                enabled={toArray(procedure.reasonForConversion).includes("Other")}
                value={procedure.reasonForConversionOther || ""}
                placeholder="Specify other conversion reason"
                onChange={(value) => updateTemplate("procedure", "reasonForConversionOther", value)}
              />
              <LabeledInput label="Trocar Number" value={procedure.trocarNumber || ""} onChange={(value) => updateTemplate("procedure", "trocarNumber", value)} />
            </>
          ) : null}

          {diagramElement}
          {showOpenRepairSection ? (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800">Open Inguinal Hernia Repair</h3>
              <CheckboxGrid label="Incision used" options={incisionUsedOptions} values={procedure.incisionUsed} onChange={(value) => updateTemplate("procedure", "incisionUsed", value)} />
              <OptionalOtherInput
                enabled={toArray(procedure.incisionUsed).includes("Other")}
                value={procedure.incisionOther || ""}
                placeholder="Specify other incision"
                onChange={(value) => updateTemplate("procedure", "incisionOther", value)}
              />
              <LabeledInput label="Length of incision (cm)" value={procedure.incisionLength || ""} onChange={(value) => updateTemplate("procedure", "incisionLength", value)} />
              <RadioGrid label="External oblique aponeurosis incised" options={["Yes", "No"]} value={procedure.externalObliqueAponeurosisIncised || ""} onChange={(value) => updateTemplate("procedure", "externalObliqueAponeurosisIncised", value)} columns="grid-cols-2" />
              <CheckboxGrid label="Cord structures" options={cordStructureOptions} values={procedure.cordStructures} onChange={(value) => updateTemplate("procedure", "cordStructures", value)} />
              <CheckboxGrid label="Nerves identified" options={nerveOptions} values={procedure.nervesIdentified} onChange={(value) => updateTemplate("procedure", "nervesIdentified", value)} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <RadioGrid label="Ilioinguinal preserved" options={["Yes", "No"]} value={procedure.ilioinguinalPreserved || ""} onChange={(value) => updateTemplate("procedure", "ilioinguinalPreserved", value)} columns="grid-cols-2" />
                <RadioGrid label="Iliohypogastric preserved" options={["Yes", "No"]} value={procedure.iliohypogastricPreserved || ""} onChange={(value) => updateTemplate("procedure", "iliohypogastricPreserved", value)} columns="grid-cols-2" />
                <RadioGrid label="Genital branch preserved" options={["Yes", "No"]} value={procedure.genitalBranchPreserved || ""} onChange={(value) => updateTemplate("procedure", "genitalBranchPreserved", value)} columns="grid-cols-2" />
              </div>
              <CheckboxGrid label="Sac Management" options={sacManagementOptions} values={procedure.sacManagement} onChange={(value) => updateTemplate("procedure", "sacManagement", value)} />
              <RadioGrid label="Deep Ring reconstruction" options={deepRingOptions} value={procedure.deepRingReconstruction || ""} onChange={(value) => updateTemplate("procedure", "deepRingReconstruction", value)} columns="grid-cols-2" />
              <CheckboxGrid label="Repair technique" options={repairTechniqueOptions} values={procedure.repairTechnique} onChange={(value) => updateTemplate("procedure", "repairTechnique", value)} columns="grid-cols-2" />

              {showTissueRepairSection ? (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-800">Tissue reconstruction</h4>
                  <CheckboxGrid label="Posterior wall tissue reconstruction" options={tissueReconstructionOptions} values={procedure.tissueReconstruction} onChange={(value) => updateTemplate("procedure", "tissueReconstruction", value)} />
                  <OptionalOtherInput
                    enabled={toArray(procedure.tissueReconstruction).includes("Other")}
                    value={procedure.tissueReconstructionOther || ""}
                    placeholder="Specify other tissue reconstruction"
                    onChange={(value) => updateTemplate("procedure", "tissueReconstructionOther", value)}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <LabeledInput label="Suture material used" value={procedure.sutureMaterial || ""} onChange={(value) => updateTemplate("procedure", "sutureMaterial", value)} />
                    <RadioGrid label="Suture method" options={sutureMethodOptions} value={procedure.sutureMethod || ""} onChange={(value) => updateTemplate("procedure", "sutureMethod", value)} columns="grid-cols-2" />
                  </div>
                </div>
              ) : null}

              {showMeshRepairSection ? (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-800">Mesh Repair</h4>
                  <LabeledInput label="Mesh inserted" value={procedure.meshInserted || ""} onChange={(value) => updateTemplate("procedure", "meshInserted", value)} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <LabeledInput label="Mesh size length (cm)" value={procedure.meshSizeLength || ""} onChange={(value) => updateTemplate("procedure", "meshSizeLength", value)} />
                    <LabeledInput label="Mesh size width (cm)" value={procedure.meshSizeWidth || ""} onChange={(value) => updateTemplate("procedure", "meshSizeWidth", value)} />
                  </div>
                  <CheckboxGrid label="Mesh positioning" options={meshPositionOptions} values={procedure.meshPositioning} onChange={(value) => updateTemplate("procedure", "meshPositioning", value)} />
                  <OptionalOtherInput
                    enabled={toArray(procedure.meshPositioning).includes("Other")}
                    value={procedure.meshPositioningOther || ""}
                    placeholder="Specify other mesh positioning"
                    onChange={(value) => updateTemplate("procedure", "meshPositioningOther", value)}
                  />
                  <CheckboxGrid label="Fixation" options={fixationOptions} values={procedure.fixation} onChange={(value) => updateTemplate("procedure", "fixation", value)} />
                  <CheckboxGrid label="Fixation points" options={fixationPointOptions} values={procedure.fixationPoints} onChange={(value) => updateTemplate("procedure", "fixationPoints", value)} />
                  <OptionalOtherInput
                    enabled={toArray(procedure.fixationPoints).includes("Other")}
                    value={procedure.fixationPointsOther || ""}
                    placeholder="Specify other fixation point"
                    onChange={(value) => updateTemplate("procedure", "fixationPointsOther", value)}
                  />
                </div>
              ) : null}

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800">Closure</h4>
                <RadioGrid label="External oblique aponeurosis" options={["Closed", "Left open"]} value={closure.externalObliqueClosure || ""} onChange={(value) => updateTemplate("closure", "externalObliqueClosure", value)} columns="grid-cols-2" />
                <RadioGrid label="Subcutaneous tissue" options={["Closed", "Not closed"]} value={closure.subcutaneousTissueClosure || ""} onChange={(value) => updateTemplate("closure", "subcutaneousTissueClosure", value)} columns="grid-cols-2" />
                <CheckboxGrid label="Skin closure" options={openSkinClosureOptions} values={closure.skinClosureOpen} onChange={(value) => updateTemplate("closure", "skinClosureOpen", value)} />
                <RadioGrid label="Local anaesthetic infiltration" options={["Yes", "No"]} value={closure.localAnaestheticOpen || ""} onChange={(value) => updateTemplate("closure", "localAnaestheticOpen", value)} columns="grid-cols-2" />
              </div>
            </div>
          ) : null}

          {showLaparoscopicRepairSection ? (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800">Laparoscopic Inguinal Hernia Repair (TEP / TAPP)</h3>
              <RadioGrid label="Laparoscopic approach" options={lapApproachOptions} value={procedure.laparoscopicApproach || ""} onChange={(value) => updateTemplate("procedure", "laparoscopicApproach", value)} columns="grid-cols-2" />
              <CheckboxGrid label="Method of preperitoneal space developed" options={preperitonealOptions} values={procedure.preperitonealDevelopment} onChange={(value) => updateTemplate("procedure", "preperitonealDevelopment", value)} />
              <OptionalOtherInput
                enabled={toArray(procedure.preperitonealDevelopment).includes("other")}
                value={procedure.preperitonealDevelopmentOther || ""}
                placeholder="Specify other method"
                onChange={(value) => updateTemplate("procedure", "preperitonealDevelopmentOther", value)}
              />
              <CheckboxGrid label="Landmarks and critical zones identified" options={landmarkOptions} values={procedure.landmarks} onChange={(value) => updateTemplate("procedure", "landmarks", value)} />
              <CheckboxGrid label="Laparoscopic sac management" options={lapSacOptions} values={procedure.laparoscopicSacManagement} onChange={(value) => updateTemplate("procedure", "laparoscopicSacManagement", value)} columns="grid-cols-2" />
              <LabeledInput label="Laparoscopic mesh used" value={procedure.laparoscopicMeshUsed || ""} onChange={(value) => updateTemplate("procedure", "laparoscopicMeshUsed", value)} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <LabeledInput label="Laparoscopic mesh size length (cm)" value={procedure.laparoscopicMeshSizeLength || ""} onChange={(value) => updateTemplate("procedure", "laparoscopicMeshSizeLength", value)} />
                <LabeledInput label="Laparoscopic mesh size width (cm)" value={procedure.laparoscopicMeshSizeWidth || ""} onChange={(value) => updateTemplate("procedure", "laparoscopicMeshSizeWidth", value)} />
              </div>
              <CheckboxGrid label="Laparoscopic fixation" options={lapFixationOptions} values={procedure.laparoscopicFixation} onChange={(value) => updateTemplate("procedure", "laparoscopicFixation", value)} />
              <CheckboxGrid label="Laparoscopic fixation sites" options={lapFixationSiteOptions} values={procedure.laparoscopicFixationSites} onChange={(value) => updateTemplate("procedure", "laparoscopicFixationSites", value)} />
              <OptionalOtherInput
                enabled={toArray(procedure.laparoscopicFixationSites).includes("Other")}
                value={procedure.laparoscopicFixationSitesOther || ""}
                placeholder="Specify other laparoscopic fixation site"
                onChange={(value) => updateTemplate("procedure", "laparoscopicFixationSitesOther", value)}
              />
              <RadioGrid label="Peritoneum closure (TAPP only)" options={peritoneumClosureOptions} value={procedure.peritoneumClosure || ""} onChange={(value) => updateTemplate("procedure", "peritoneumClosure", value)} />
              <RadioGrid label="Fascial closure (≥10 mm ports)" options={["Yes", "No"]} value={closure.fascialClosurePorts || ""} onChange={(value) => updateTemplate("closure", "fascialClosurePorts", value)} columns="grid-cols-2" />
              <CheckboxGrid label="Skin closure (laparoscopic)" options={lapSkinClosureOptions} values={closure.skinClosureLaparoscopic} onChange={(value) => updateTemplate("closure", "skinClosureLaparoscopic", value)} />
              <RadioGrid label="Local anaesthetic infiltration (laparoscopic)" options={["Yes", "No"]} value={closure.localAnaestheticLaparoscopic || ""} onChange={(value) => updateTemplate("closure", "localAnaestheticLaparoscopic", value)} columns="grid-cols-2" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Complications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Complications" options={complicationOptions} values={complications.complications} onChange={(value) => updateTemplate("complications", "complications", value)} />
          <OptionalOtherInput
            enabled={toArray(complications.complications).includes("Other")}
            value={complications.complicationOther || ""}
            placeholder="Specify other complication"
            onChange={(value) => updateTemplate("complications", "complicationOther", value)}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledTextarea label="Additional Notes" value={additionalInfo.additionalNotes || ""} onChange={(value) => updateTemplate("additionalInfo", "additionalNotes", value)} />
          <LabeledTextarea label="Post operative management" value={additionalInfo.postOperativeManagement || ""} onChange={(value) => updateTemplate("additionalInfo", "postOperativeManagement", value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Surgeon" value={additionalInfo.surgeonSignatureText || ""} onChange={(value) => updateTemplate("additionalInfo", "surgeonSignatureText", value)} placeholder="Enter surgeon name" />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
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
