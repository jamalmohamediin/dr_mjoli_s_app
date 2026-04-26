import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import { FreeDrawDiagram } from "@/components/FreeDrawDiagram";
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
  diagramResetCounter?: number;
  onBulkPatientInfoUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onExportPDF?: () => void;
  onSavePatient?: () => void;
  onClearAllData?: () => void;
  isGeneratingPDF?: boolean;
}

const indicationOptions = [
  "Investigation of signs & symptoms",
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
const procedureUrgencyOptions = ["Emergency", "Semi-Emergency", "Semi-Elective", "Elective"];
const preoperativeImagingOptions = ["None", "Ultrasound", "CT Scan", "MRI", "Other"];
const sedationTypeOptions = ["None", "Topical", "Conscious sedation", "GA"];
const monitoringOptions = ["Pulse oximetry", "BP", "ECG", "Other"];
const sedationLevelOptions = ["None", "Minimal", "Moderate", "Deep", "Anaesthesia"];
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
const depthOptions = ["Terminal Ileum", "Caecum", "Ascending Colon", "Hepatic Flexure", "Transverse Colon", "Splenic Flexure", "Descending Colon", "Sigmoid Colon", "Rectum"];
const caecalLandmarkOptions = ["Not Reached", "Appendiceal Orifice", "Ileocecal Valve", "Caecal Folds (Mercedes Benz Sign)", "Transillumination", "Terminal Ileum Intubation", "Other"];
const caecumNotReachedOptions = ["Poor Bowel Prep", "Poor Patient Tolerance", "Scope Looping", "Obstructing Lesion", "Complications During Procedure", "Difficult Colonoscopy", "Other"];
const difficultyOptions = ["Easy", "Average", "Difficult"];
const findingOptions = ["Normal", "Haemorrhoids", "Inflammation", "Stricture (Benign/Malignant)", "Polyp(s)", "Diverticula", "Tumour", "AV Malformation", "Radiation Proctitis", "Ulcer (s)", "Other"];
const siteOptions = ["Anus", "Rectum", "Sigmoid Colon", "Descending Colon", "Splenic Flexure", "Transverse Colon", "Hepatic Flexure", "Ascending Colon", "Caecum", "Terminal Ileum", "Other"];
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
const bbpsScoreOptions = [
  "0 Unprepared Colon; Mucosa Not Seen.",
  "1 Portion Of Mucosa Seen; Staining/Stool Obscures Other Areas.",
  "2 Minor Staining/Stool; Mucosa Well Seen.",
  "3 Entire Mucosa Seen; No Residual Staining/Stool.",
];
export const ColonoscopyForm = ({
  currentReport,
  updateTemplate,
  diagramResetCounter = 0,
  onBulkPatientInfoUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onExportPDF,
  onSavePatient,
  onClearAllData,
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

  const selectedDepth = toArray(procedureDetails.depthOfExamination);
  const selectedCaecalLandmarks = toArray(procedureDetails.caecalLandmarks);
  const reachedTerminalOrCaecum =
    selectedDepth.includes("Terminal Ileum") || selectedDepth.includes("Caecum");
  const showCaecalLandmarks = reachedTerminalOrCaecum;
  const showCaecumNotReachedReasons =
    selectedCaecalLandmarks.includes("Not Reached") ||
    (selectedDepth.length > 0 && !reachedTerminalOrCaecum);

  const selectedFindings = toArray(findingsSummary.findings);
  const showHaemorrhoids = selectedFindings.includes("Haemorrhoids");
  const showInflammation = selectedFindings.includes("Inflammation");
  const showStricture = selectedFindings.includes("Stricture (Benign/Malignant)");
  const showPolyps = selectedFindings.includes("Polyp(s)");
  const showDiverticula = selectedFindings.includes("Diverticula");
  const showTumour = selectedFindings.includes("Tumour");
  const showAvMalformation = selectedFindings.includes("AV Malformation");
  const showRadiationProctitis = selectedFindings.includes("Radiation Proctitis");
  const showUlcer = selectedFindings.includes("Ulcer (s)");
  const showInflammationUlcerFeatures =
    Boolean(inflammation.ulcerBurden) && inflammation.ulcerBurden !== "None";

  const [collapsedFindingsSections, setCollapsedFindingsSections] = React.useState<Record<string, boolean>>({});
  const [isSedationExpanded, setIsSedationExpanded] = React.useState(true);
  const [isBbpsExpanded, setIsBbpsExpanded] = React.useState(true);

  const isFindingSectionExpanded = (sectionKey: string) => !collapsedFindingsSections[sectionKey];

  const toggleFindingSection = (sectionKey: string) => {
    setCollapsedFindingsSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const toggleFindingSelection = (finding: string, checked: boolean) => {
    const currentSelections = toArray(findingsSummary.findings);
    const nextSelections = checked
      ? Array.from(new Set([...currentSelections, finding]))
      : currentSelections.filter((item) => item !== finding);
    updateTemplate("findingsSummary", "findings", nextSelections);
  };

  const renderCollapsibleFindingSection = (
    sectionKey: string,
    title: string,
    content: React.ReactNode,
  ) => (
    <div className="rounded-md border border-gray-200 bg-gray-50/40 p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => toggleFindingSection(sectionKey)}
      >
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="text-sm font-semibold text-gray-700">
          {isFindingSectionExpanded(sectionKey) ? "−" : "+"}
        </span>
      </button>
      {isFindingSectionExpanded(sectionKey) ? (
        <div className="mt-4 space-y-4">{content}</div>
      ) : null}
    </div>
  );

  const renderFindingOptionDetail = (findingOption: string) => {
    if (findingOption === "Other") {
      return (
        <OptionalOtherInput
          enabled={selectedFindings.includes("Other")}
          value={findingsSummary.findingOther || ""}
          placeholder="Specify other finding"
          onChange={(value) => updateTemplate("findingsSummary", "findingOther", value)}
        />
      );
    }

    if (findingOption === "Haemorrhoids" && showHaemorrhoids) {
      return renderCollapsibleFindingSection(
        "haemorrhoids",
        "Haemorrhoids",
        <>
          <CheckboxGrid label="Haemorrhoid Grade" options={["Grade I", "Grade II", "Grade III", "Grade IV", "Internal And External Haemorrhoids"]} values={haemorrhoids.grades} onChange={(value) => updateTemplate("haemorrhoids", "grades", value)} />
          <CheckboxGrid label="Bleeding Status" options={["No Bleeding", "Stigmata Of Recent Bleeding", "Active Bleeding", "No Recent Stigmata Of Recent Bleed"]} values={haemorrhoids.bleedingStatus} onChange={(value) => updateTemplate("haemorrhoids", "bleedingStatus", value)} />
        </>,
      );
    }

    if (findingOption === "Inflammation" && showInflammation) {
      return renderCollapsibleFindingSection(
        "inflammation",
        "Inflammation",
        <>
          <CheckboxGrid label="Description Of Inflammation" options={["Pancolitis", "Segmental", "Patchy (Skip Lesions)", "Continuous", "Presence Of Pseudopolyps", "Cobblestoning", "Presence Of Exudate / Slough", "Strictures", "Peri-Appendiceal Patch", "Backwash Ileitis", "Other"]} values={inflammation.description} onChange={(value) => updateTemplate("inflammation", "description", value)} />
          <OptionalOtherInput enabled={toArray(inflammation.description).includes("Other")} value={inflammation.descriptionOther || ""} placeholder="Specify other inflammation description" onChange={(value) => updateTemplate("inflammation", "descriptionOther", value)} />
          <RadioGrid label="Severity Of Inflammation" options={["Mild", "Moderate", "Severe"]} value={inflammation.severity || ""} onChange={(value) => updateTemplate("inflammation", "severity", value)} columns="grid-cols-3" />
          <RadioGrid label="Presence Of Ulcers" options={["None", "<10%", "10-30%", ">30%"]} value={inflammation.ulcerBurden || ""} onChange={(value) => updateTemplate("inflammation", "ulcerBurden", value)} columns="grid-cols-2 md:grid-cols-4" />
          {showInflammationUlcerFeatures ? (
            <>
              <CheckboxGrid label="Ulcer Features" options={["Superficial Ulcers", "Deep Ulcers", "Linear Ulcers", "Aphthous Ulcers", "Serpiginous Ulcers", "Confluent Ulceration", "Other"]} values={inflammation.ulcerFeatures} onChange={(value) => updateTemplate("inflammation", "ulcerFeatures", value)} />
              <OptionalOtherInput enabled={toArray(inflammation.ulcerFeatures).includes("Other")} value={inflammation.ulcerFeaturesOther || ""} placeholder="Specify other ulcer feature" onChange={(value) => updateTemplate("inflammation", "ulcerFeaturesOther", value)} />
            </>
          ) : null}
          <CheckboxGrid label="Endoscopic Impression" options={["Features Suggestive Of Ulcerative Colitis", "Features Suggestive Of Crohn's Disease", "Features Suggestive Of Infectious Colitis", "Features Suggestive Of Ischemic Colitis", "Nonspecific Colitis", "Nonspecific Colon Ulcer", "Other"]} values={inflammation.endoscopicImpression} onChange={(value) => updateTemplate("inflammation", "endoscopicImpression", value)} />
          <OptionalOtherInput enabled={toArray(inflammation.endoscopicImpression).includes("Other")} value={inflammation.impressionOther || ""} placeholder="Specify other inflammation impression" onChange={(value) => updateTemplate("inflammation", "impressionOther", value)} />
        </>,
      );
    }

    if (findingOption === "Stricture (Benign/Malignant)" && showStricture) {
      return renderCollapsibleFindingSection(
        "stricture",
        "Stricture (Benign/Malignant)",
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RadioGrid label="Number Of Strictures" options={["Single", "Multiple"]} value={stricture.number || ""} onChange={(value) => updateTemplate("stricture", "number", value)} columns="grid-cols-2" />
            {stricture.number === "Multiple" ? (
              <LabeledInput label="Multiple (Number)" value={stricture.multipleNumber || ""} onChange={(value) => updateTemplate("stricture", "multipleNumber", value)} />
            ) : <div />}
          </div>
          <RadioGrid label="Length Of Stricture" options={["<1 Cm", "Short Segment (1 - 3 Cm)", "Intermediate (3-5 Cm)", "Long Segment (>5 Cm)"]} value={stricture.length || ""} onChange={(value) => updateTemplate("stricture", "length", value)} />
          <CheckboxGrid label="Severity Of Narrowing" options={["Mild (<50%)", "Moderate (50-75%)", "Severe (>75%)", "Easily Traversed", "Traversed With Difficulty", "Not Traversable"]} values={stricture.severityOfNarrowing} onChange={(value) => updateTemplate("stricture", "severityOfNarrowing", value)} columns="grid-cols-2 md:grid-cols-3" />
          <CheckboxGrid label="Morphology Mucosal Appearance" options={["Normal Mucosa", "Smooth / Regular", "Erythema", "Irregular / Nodular", "Shouldered Edges", "Concentric Narrowing", "Eccentric Narrowing", "Ulcerated", "Mass Lesion Suspected", "Other"]} values={stricture.morphology} onChange={(value) => updateTemplate("stricture", "morphology", value)} />
          <OptionalOtherInput enabled={toArray(stricture.morphology).includes("Other")} value={stricture.morphologyOther || ""} placeholder="Specify other morphology" onChange={(value) => updateTemplate("stricture", "morphologyOther", value)} />
          <CheckboxGrid label="Endoscopic Impression" options={["Suspicious For Malignancy", "Benign Stricture", "Inflammatory Stricture (E.G. Crohn's Disease)", "Post-Inflammatory / Fibrosis", "Ischemic Stricture (Ischemic Colitis)", "Post-Surgical / Anastomotic Stricture", "Radiation-Induced", "Indeterminate"]} values={stricture.endoscopicImpression} onChange={(value) => updateTemplate("stricture", "endoscopicImpression", value)} />
        </>,
      );
    }

    if (findingOption === "Polyp(s)" && showPolyps) {
      return renderCollapsibleFindingSection(
        "polyps",
        "Polyp(s)",
        <>
          <RadioGrid label="Polyp Number" options={["1", "1 - 5", "5 - 10", "10 - 20", "20 - 50", "50 - 100", "> 100"]} value={polyps.number || ""} onChange={(value) => updateTemplate("polyps", "number", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Size" options={["Diminutive (<=5 Mm)", "Small (6-9 Mm)", "Large (>=10 Mm)", "Advanced (>=20 Mm)"]} values={polyps.size} onChange={(value) => updateTemplate("polyps", "size", value)} columns="grid-cols-2 md:grid-cols-4" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Largest Polyp Diameter (mm) - Length" value={polyps.largestDiameterLength || ""} onChange={(value) => updateTemplate("polyps", "largestDiameterLength", value)} />
            <LabeledInput label="Largest Polyp Diameter (mm) - Width" value={polyps.largestDiameterWidth || ""} onChange={(value) => updateTemplate("polyps", "largestDiameterWidth", value)} />
            <LabeledInput label="Range (If Multiple) From mm" value={polyps.rangeFrom || ""} onChange={(value) => updateTemplate("polyps", "rangeFrom", value)} />
            <LabeledInput label="Range (If Multiple) To mm" value={polyps.rangeTo || ""} onChange={(value) => updateTemplate("polyps", "rangeTo", value)} />
          </div>
          <CheckboxGrid label="Morphology" options={["Pedunculated", "Sessile", "Slightly Elevated", "Flat", "Depressed", "Excavated", "Pseudopolyps", "Other"]} values={polyps.morphology} onChange={(value) => updateTemplate("polyps", "morphology", value)} />
          <OptionalOtherInput enabled={toArray(polyps.morphology).includes("Other")} value={polyps.morphologyOther || ""} placeholder="Specify other polyp morphology" onChange={(value) => updateTemplate("polyps", "morphologyOther", value)} />
        </>,
      );
    }

    if (findingOption === "Tumour" && showTumour) {
      return renderCollapsibleFindingSection(
        "tumour",
        "Tumour",
        <>
          <LabeledInput label="Estimated Length Of Tumour (cm)" value={tumour.length || ""} onChange={(value) => updateTemplate("tumour", "length", value)} />
          <CheckboxGrid label="Circumferential Involvement" options={["<25%", "25-50%", "50-75%", ">75%", "Circumferential"]} values={tumour.circumferentialInvolvement} onChange={(value) => updateTemplate("tumour", "circumferentialInvolvement", value)} />
          <CheckboxGrid label="Lumen Narrowing" options={["No Narrowing", "Partial Obstruction", "Significant Narrowing", "Complete Obstruction", "Easily Traversed", "Traversed With Difficulty", "Not Traversable"]} values={tumour.lumenNarrowing} onChange={(value) => updateTemplate("tumour", "lumenNarrowing", value)} />
          <CheckboxGrid label="Endoscopic Impression" options={["Highly Suspicious For Malignancy", "Likely Malignant Tumour", "Early Cancer (Superficial)", "Benign Tumour (E.G. Lipoma)", "Indeterminate"]} values={tumour.endoscopicImpression} onChange={(value) => updateTemplate("tumour", "endoscopicImpression", value)} />
        </>,
      );
    }

    if (findingOption === "Diverticula" && showDiverticula) {
      return renderCollapsibleFindingSection(
        "diverticula",
        "Diverticula",
        <>
          <RadioGrid label="Number" options={["Single", "Few", "Multiple", "Extensive"]} value={diverticula.number || ""} onChange={(value) => updateTemplate("diverticula", "number", value)} columns="grid-cols-2 md:grid-cols-4" />
          <RadioGrid label="Size" options={["Small (<5 Mm)", "Medium (5-10 Mm)", "Large (>10 Mm)"]} value={diverticula.size || ""} onChange={(value) => updateTemplate("diverticula", "size", value)} columns="grid-cols-3" />
          <CheckboxGrid label="Distribution Pattern" options={["Focal", "Segmental", "Diffuse", "Pan Colonic"]} values={diverticula.distributionPattern} onChange={(value) => updateTemplate("diverticula", "distributionPattern", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Morphology" options={["Normal Mucosa", "Simple", "Containing Fecolith", "Erythematous", "Inflamed", "Ulcerated", "Associated Colitis", "Other"]} values={diverticula.morphology} onChange={(value) => updateTemplate("diverticula", "morphology", value)} />
          <OptionalOtherInput enabled={toArray(diverticula.morphology).includes("Other")} value={diverticula.morphologyOther || ""} placeholder="Specify other diverticula morphology" onChange={(value) => updateTemplate("diverticula", "morphologyOther", value)} />
        </>,
      );
    }

    if (findingOption === "AV Malformation" && showAvMalformation) {
      return renderCollapsibleFindingSection(
        "avMalformation",
        "AV Malformation",
        <>
          <RadioGrid label="Number" options={["Single", "Multiple (<=5)", "Numerous (>5)"]} value={avMalformation.number || ""} onChange={(value) => updateTemplate("avMalformation", "number", value)} columns="grid-cols-3" />
          <RadioGrid label="Size" options={["Small (<5 Mm)", "Medium (5-10 Mm)", "Large (>10 Mm)"]} value={avMalformation.size || ""} onChange={(value) => updateTemplate("avMalformation", "size", value)} columns="grid-cols-3" />
          <CheckboxGrid label="Morphology" options={["Flat", "Raised", "Clustered", "Solitary"]} values={avMalformation.morphology} onChange={(value) => updateTemplate("avMalformation", "morphology", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Color Appearance" options={["Reddish", "Purple", "Tortuous Vessels", "Erythematous Patch"]} values={avMalformation.colorAppearance} onChange={(value) => updateTemplate("avMalformation", "colorAppearance", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Bleeding Status" options={["No Bleeding", "Stigmata Of Recent Bleeding", "Active Bleeding", "No Recent Stigmata Of Recent Bleed"]} values={avMalformation.bleedingStatus} onChange={(value) => updateTemplate("avMalformation", "bleedingStatus", value)} />
          <CheckboxGrid label="Distribution Pattern" options={["Focal", "Segmental", "Diffuse", "Pancolonic"]} values={avMalformation.distributionPattern} onChange={(value) => updateTemplate("avMalformation", "distributionPattern", value)} />
          <RadioGrid label="AV Malformation Burden" options={["Mild", "Moderate", "Severe"]} value={avMalformation.burden || ""} onChange={(value) => updateTemplate("avMalformation", "burden", value)} columns="grid-cols-3" />
          <RadioGrid label="Risk Of Bleeding" options={["Low", "Moderate", "High"]} value={avMalformation.bleedingRisk || ""} onChange={(value) => updateTemplate("avMalformation", "bleedingRisk", value)} columns="grid-cols-3" />
        </>,
      );
    }

    if (findingOption === "Radiation Proctitis" && showRadiationProctitis) {
      return renderCollapsibleFindingSection(
        "radiationProctitis",
        "Radiation Proctitis",
        <>
          <LabeledInput label="Extent From Anal Verge (cm)" value={radiationProctitis.extentFromAnalVerge || ""} onChange={(value) => updateTemplate("radiationProctitis", "extentFromAnalVerge", value)} />
          <CheckboxGrid label="Distribution" options={["Rectum Only", "Rectosigmoid Involvement", "Segmental", "Diffuse", "Patchy", "Circumferential"]} values={radiationProctitis.distribution} onChange={(value) => updateTemplate("radiationProctitis", "distribution", value)} />
          <RadioGrid label="Severity" options={["Mild", "Moderate", "Severe"]} value={radiationProctitis.severity || ""} onChange={(value) => updateTemplate("radiationProctitis", "severity", value)} columns="grid-cols-3" />
          <CheckboxGrid label="Mucosal Findings" options={["Erythema", "Telangiectasia", "Edema", "Friable / Contact Bleeding", "Spontaneous Bleeding", "Pallor / Atrophy", "Necrosis", "Stricture", "Fistula", "Ulceration", "Ectatic Vessels", "Angiodysplasia-Like Lesions", "Other"]} values={radiationProctitis.mucosalFindings} onChange={(value) => updateTemplate("radiationProctitis", "mucosalFindings", value)} />
          <OptionalOtherInput enabled={toArray(radiationProctitis.mucosalFindings).includes("Other")} value={radiationProctitis.mucosalFindingsOther || ""} placeholder="Specify other mucosal finding" onChange={(value) => updateTemplate("radiationProctitis", "mucosalFindingsOther", value)} />
        </>,
      );
    }

    if (findingOption === "Ulcer (s)" && showUlcer) {
      return renderCollapsibleFindingSection(
        "ulcer",
        "Ulcer (s)",
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RadioGrid label="Number Of Ulcers" options={["Single", "Multiple"]} value={ulcer.number || ""} onChange={(value) => updateTemplate("ulcer", "number", value)} columns="grid-cols-2" />
            {ulcer.number === "Multiple" ? (
              <LabeledInput label="Approximate Number If Multiple" value={ulcer.approximateNumberIfMultiple || ""} onChange={(value) => updateTemplate("ulcer", "approximateNumberIfMultiple", value)} />
            ) : <div />}
          </div>
          <CheckboxGrid label="Distribution" options={["Focal", "Segmental", "Diffuse"]} values={ulcer.distribution} onChange={(value) => updateTemplate("ulcer", "distribution", value)} columns="grid-cols-3" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Largest Ulcer Diameter (mm) - Length" value={ulcer.largestDiameterLength || ""} onChange={(value) => updateTemplate("ulcer", "largestDiameterLength", value)} />
            <LabeledInput label="Largest Ulcer Diameter (mm) - Width" value={ulcer.largestDiameterWidth || ""} onChange={(value) => updateTemplate("ulcer", "largestDiameterWidth", value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Range (If Multiple) From mm" value={ulcer.rangeFrom || ""} onChange={(value) => updateTemplate("ulcer", "rangeFrom", value)} />
            <LabeledInput label="Range (If Multiple) To mm" value={ulcer.rangeTo || ""} onChange={(value) => updateTemplate("ulcer", "rangeTo", value)} />
          </div>
          <CheckboxGrid label="Shape" options={["Round", "Oval", "Linear", "Irregular", "Serpiginous"]} values={ulcer.shape} onChange={(value) => updateTemplate("ulcer", "shape", value)} columns="grid-cols-2 md:grid-cols-5" />
          <CheckboxGrid label="Depth" options={["Superficial", "Deep", "Excavated"]} values={ulcer.depth} onChange={(value) => updateTemplate("ulcer", "depth", value)} columns="grid-cols-3" />
          <CheckboxGrid label="Edges" options={["Regular", "Irregular", "Undermined", "Raised"]} values={ulcer.edges} onChange={(value) => updateTemplate("ulcer", "edges", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Base" options={["Clean", "Fibrinous", "Necrotic", "Granular"]} values={ulcer.base} onChange={(value) => updateTemplate("ulcer", "base", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Orientation" options={["Longitudinal", "Circumferential", "Along folds"]} values={ulcer.orientation} onChange={(value) => updateTemplate("ulcer", "orientation", value)} columns="grid-cols-3" />
          <CheckboxGrid label="Bleeding Stigmata" options={["None", "Contact bleeding", "Active bleeding", "Visible vessel", "Adherent clot"]} values={ulcer.bleedingStigmata} onChange={(value) => updateTemplate("ulcer", "bleedingStigmata", value)} />
          <CheckboxGrid label="Surrounding Mucosa" options={["Normal", "Erythematous", "Oedematous", "Friable", "Nodular", "Inflamed", "Other"]} values={ulcer.surroundingMucosa} onChange={(value) => updateTemplate("ulcer", "surroundingMucosa", value)} />
          <OptionalOtherInput enabled={toArray(ulcer.surroundingMucosa).includes("Other")} value={ulcer.surroundingMucosaOther || ""} placeholder="Specify other surrounding mucosa" onChange={(value) => updateTemplate("ulcer", "surroundingMucosaOther", value)} />
          <CheckboxGrid label="Associated Findings" options={["Inflammation", "Stricture", "Mass lesion", "Fistula opening", "Perianal disease", "Diverticulosis nearby", "Other"]} values={ulcer.associatedFindings} onChange={(value) => updateTemplate("ulcer", "associatedFindings", value)} />
          <OptionalOtherInput enabled={toArray(ulcer.associatedFindings).includes("Other")} value={ulcer.associatedFindingsOther || ""} placeholder="Specify other associated finding" onChange={(value) => updateTemplate("ulcer", "associatedFindingsOther", value)} />
          <CheckboxGrid label="Suspected Etiology (Endoscopic)" options={["Inflammatory Bowel Disease", "Infective", "Ischaemic Colitis", "Drug-Induced (E.G. Nsaids)", "Malignancy-Related", "Radiation Colitis", "Indeterminate"]} values={ulcer.suspectedEtiology} onChange={(value) => updateTemplate("ulcer", "suspectedEtiology", value)} />
          {toArray(ulcer.suspectedEtiology).includes("Inflammatory Bowel Disease") ? (
            <CheckboxGrid label="Inflammatory Bowel Disease" options={["Crohn's Disease", "Ulcerative Colitis"]} values={ulcer.ibdType} onChange={(value) => updateTemplate("ulcer", "ibdType", value)} columns="grid-cols-2" />
          ) : null}
          {toArray(ulcer.suspectedEtiology).includes("Infective") ? (
            <>
              <CheckboxGrid label="Infective" options={["Cytomegalovirus Colitis", "Tuberculosis", "Other"]} values={ulcer.infectiveEtiology} onChange={(value) => updateTemplate("ulcer", "infectiveEtiology", value)} columns="grid-cols-3" />
              <OptionalOtherInput enabled={toArray(ulcer.infectiveEtiology).includes("Other")} value={ulcer.etiologyOther || ""} placeholder="Specify other infective etiology" onChange={(value) => updateTemplate("ulcer", "etiologyOther", value)} />
            </>
          ) : null}
        </>,
      );
    }

    return null;
  };

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

  const parseBbpsScore = (value: string) => {
    const match = String(value || "").trim().match(/^([0-3])/);
    return match ? Number(match[1]) : null;
  };

  const updateBbpsField = (
    field: "bbpsRightColon" | "bbpsTransverseColon" | "bbpsLeftColon",
    value: string,
  ) => {
    updateTemplate("bowelPreparation", field, value);

    const rightScore = parseBbpsScore(
      field === "bbpsRightColon" ? value : bowelPreparation.bbpsRightColon || "",
    );
    const transverseScore = parseBbpsScore(
      field === "bbpsTransverseColon" ? value : bowelPreparation.bbpsTransverseColon || "",
    );
    const leftScore = parseBbpsScore(
      field === "bbpsLeftColon" ? value : bowelPreparation.bbpsLeftColon || "",
    );

    if (rightScore !== null && transverseScore !== null && leftScore !== null) {
      updateTemplate(
        "bowelPreparation",
        "totalBbps",
        String(rightScore + transverseScore + leftScore),
      );
    }
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
          <MultiValueTextField label="Assistant" values={preoperative.assistants || [""]} placeholder="Enter assistant name" onChange={(value) => updateTemplate("preoperative", "assistants", value)} />
          <MultiValueTextField label="Anesthetist" values={preoperative.anaesthetists || [""]} placeholder="Enter anesthetist name" onChange={(value) => updateTemplate("preoperative", "anaesthetists", value)} />
          <CheckboxGrid label="Procedure Urgency" options={procedureUrgencyOptions} values={preoperative.procedureUrgency} onChange={(value) => updateTemplate("preoperative", "procedureUrgency", value)} columns="grid-cols-2 md:grid-cols-4" />
          <CheckboxGrid label="Preoperative Imaging" options={preoperativeImagingOptions} values={preoperative.preoperativeImaging} onChange={(value) => updateTemplate("preoperative", "preoperativeImaging", value)} columns="grid-cols-2 md:grid-cols-5" />
          <OptionalOtherInput enabled={toArray(preoperative.preoperativeImaging).includes("Other")} value={preoperative.preoperativeImagingOther || ""} placeholder="Specify other preoperative imaging" onChange={(value) => updateTemplate("preoperative", "preoperativeImagingOther", value)} />
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
          <div className="space-y-4 border-t pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setIsSedationExpanded((prev) => !prev)}
            >
              <h3 className="text-sm font-semibold text-gray-800">Sedation / Anaesthesia</h3>
              <span className="text-sm font-semibold text-gray-700">
                {isSedationExpanded ? "−" : "+"}
              </span>
            </button>
            {isSedationExpanded ? (
              <div className="space-y-4">
                <RadioGrid label="Sedationist" options={sedationistOptions} value={preoperative.sedationist || ""} onChange={(value) => updateTemplate("preoperative", "sedationist", value)} />
                <OptionalOtherInput enabled={preoperative.sedationist === "Other"} value={preoperative.sedationistOther || ""} placeholder="Specify other sedationist" onChange={(value) => updateTemplate("preoperative", "sedationistOther", value)} />
                <CheckboxGrid label="Type of sedation" options={sedationTypeOptions} values={preoperative.sedationTypes} onChange={(value) => updateTemplate("preoperative", "sedationTypes", value)} columns="grid-cols-2 md:grid-cols-4" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <LabeledInput label="Midazolam: mg" value={preoperative.medications?.midazolamDose || ""} onChange={(value) => updateMedication("midazolamDose", value)} />
                  <LabeledInput label="Fentanyl: mcg" value={preoperative.medications?.fentanylDose || ""} onChange={(value) => updateMedication("fentanylDose", value)} />
                  <LabeledInput label="Propofol: mg" value={preoperative.medications?.propofolDose || ""} onChange={(value) => updateMedication("propofolDose", value)} />
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
          <CardTitle className="text-base font-semibold text-gray-800">Bowel Preparation and Procedure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Type of Prep" options={bowelPrepOptions} values={bowelPreparation.prepType} onChange={(value) => updateTemplate("bowelPreparation", "prepType", value)} />
          <OptionalOtherInput enabled={toArray(bowelPreparation.prepType).includes("Other")} value={bowelPreparation.prepTypeOther || ""} placeholder="Specify other bowel prep" onChange={(value) => updateTemplate("bowelPreparation", "prepTypeOther", value)} />
          <RadioGrid label="Overall Assessment" options={overallBowelOptions} value={bowelPreparation.overallAssessment || ""} onChange={(value) => updateTemplate("bowelPreparation", "overallAssessment", value)} />
          <div className="space-y-4 border-t pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setIsBbpsExpanded((prev) => !prev)}
            >
              <h3 className="text-sm font-semibold text-gray-800">Boston Bowel Preparation Scale</h3>
              <span className="text-sm font-semibold text-gray-700">
                {isBbpsExpanded ? "−" : "+"}
              </span>
            </button>
            {isBbpsExpanded ? (
              <div className="space-y-4">
                <RadioGrid label="Right Colon" options={bbpsScoreOptions} value={bowelPreparation.bbpsRightColon || ""} onChange={(value) => updateBbpsField("bbpsRightColon", value)} />
                <RadioGrid label="Transverse Colon" options={bbpsScoreOptions} value={bowelPreparation.bbpsTransverseColon || ""} onChange={(value) => updateBbpsField("bbpsTransverseColon", value)} />
                <RadioGrid label="Left Colon" options={bbpsScoreOptions} value={bowelPreparation.bbpsLeftColon || ""} onChange={(value) => updateBbpsField("bbpsLeftColon", value)} />
                <LabeledInput label="Total BBPS Score / 9" value={bowelPreparation.totalBbps || ""} onChange={(value) => updateTemplate("bowelPreparation", "totalBbps", value)} />
              </div>
            ) : null}
          </div>
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Procedure Details</h3>
            <CheckboxGrid label="Procedure" options={procedureOptions} values={procedureDetails.procedures} onChange={(value) => updateTemplate("procedureDetails", "procedures", value)} />
            <OptionalOtherInput enabled={toArray(procedureDetails.procedures).includes("Other")} value={procedureDetails.procedureOther || ""} placeholder="Specify other procedure" onChange={(value) => updateTemplate("procedureDetails", "procedureOther", value)} />
            <CheckboxGrid label="Depth of Examination" options={depthOptions} values={procedureDetails.depthOfExamination} onChange={(value) => updateTemplate("procedureDetails", "depthOfExamination", value)} />
            {showCaecalLandmarks ? (
              <>
                <CheckboxGrid label="Caecal Intubation Landmarks Identified" options={caecalLandmarkOptions} values={procedureDetails.caecalLandmarks} onChange={(value) => updateTemplate("procedureDetails", "caecalLandmarks", value)} />
                <OptionalOtherInput enabled={toArray(procedureDetails.caecalLandmarks).includes("Other")} value={procedureDetails.caecalLandmarksOther || ""} placeholder="Specify other landmark" onChange={(value) => updateTemplate("procedureDetails", "caecalLandmarksOther", value)} />
              </>
            ) : null}
            {showCaecumNotReachedReasons ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Reason For Not Reaching Caecum</h4>
                <CheckboxGrid label="Reason For Not Reaching Caecum" options={caecumNotReachedOptions} values={procedureDetails.reasonsCaecumNotReached} onChange={(value) => updateTemplate("procedureDetails", "reasonsCaecumNotReached", value)} />
                <OptionalOtherInput enabled={toArray(procedureDetails.reasonsCaecumNotReached).includes("Other")} value={procedureDetails.reasonsCaecumNotReachedOther || ""} placeholder="Specify other reason" onChange={(value) => updateTemplate("procedureDetails", "reasonsCaecumNotReachedOther", value)} />
              </div>
            ) : null}
            <RadioGrid label="Difficulty" options={difficultyOptions} value={procedureDetails.difficulty || ""} onChange={(value) => updateTemplate("procedureDetails", "difficulty", value)} columns="grid-cols-3" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Findings</Label>
            <div className="space-y-3 rounded-md border border-gray-200 bg-white p-3">
              {findingOptions.map((findingOption) => {
                const checked = selectedFindings.includes(findingOption);
                return (
                  <div key={findingOption} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleFindingSelection(findingOption, value === true)
                        }
                      />
                      <span>{findingOption}</span>
                    </label>
                    {checked ? (
                      <div className="ml-6 space-y-3">
                        {renderFindingOptionDetail(findingOption)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <CheckboxGrid label="Site(s) of abnormality" options={siteOptions} values={findingsSummary.sitesOfAbnormality} onChange={(value) => updateTemplate("findingsSummary", "sitesOfAbnormality", value)} />
          <OptionalOtherInput enabled={toArray(findingsSummary.sitesOfAbnormality).includes("Other")} value={findingsSummary.siteOther || ""} placeholder="Specify other site" onChange={(value) => updateTemplate("findingsSummary", "siteOther", value)} />
          <LabeledTextarea label="Description of findings" value={findingsSummary.descriptionOfFindings || ""} onChange={(value) => updateTemplate("findingsSummary", "descriptionOfFindings", value)} rows={4} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Colonoscopy Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <FreeDrawDiagram
            key={`colonoscopy-diagram-${diagramResetCounter}`}
            backgroundImage={colonoscopyTemplateImage}
            initialCanvasImageData={template.diagram?.canvasImageData || ""}
            maxWidth={300}
            onUpdate={(data) => {
              updateTemplate("diagram", "findings", []);
              updateTemplate("diagram", "canvasImageData", data.canvasImageData || "");
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Interventions and Final Endoscopic Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGrid label="Interventions Performed" options={interventionOptions} values={interventions.interventions} onChange={(value) => updateTemplate("interventions", "interventions", value)} />
          <OptionalOtherInput enabled={toArray(interventions.interventions).includes("Other")} value={interventions.other || ""} placeholder="Specify other intervention" onChange={(value) => updateTemplate("interventions", "other", value)} />
          <CheckboxGrid label="Final Endoscopic Diagnosis" options={diagnosisOptions} values={diagnosis.diagnoses} onChange={(value) => updateTemplate("diagnosis", "diagnoses", value)} />
          <OptionalOtherInput enabled={toArray(diagnosis.diagnoses).includes("Other")} value={diagnosis.diagnosisOther || ""} placeholder="Specify other diagnosis" onChange={(value) => updateTemplate("diagnosis", "diagnosisOther", value)} />
        </CardContent>
      </Card>

      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Specimen, Conclusion and Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGrid label="Specimen Sent for Pathology" options={["Yes", "No"]} value={additionalInfo.specimenSentForPathology || ""} onChange={(value) => updateTemplate("additionalInfo", "specimenSentForPathology", value)} columns="grid-cols-2" />
          <RadioGrid label="Other Specimens Taken" options={["No", "Yes"]} value={additionalInfo.otherSpecimensTaken || ""} onChange={(value) => updateTemplate("additionalInfo", "otherSpecimensTaken", value)} columns="grid-cols-2" />
          <OptionalOtherInput enabled={additionalInfo.otherSpecimensTaken === "Yes"} label="Yes (Specify)" value={additionalInfo.otherSpecimensTakenDetails || ""} placeholder="e.g. Biopsies" onChange={(value) => updateTemplate("additionalInfo", "otherSpecimensTakenDetails", value)} />
          <LabeledInput label="Specify Laboratory Sent to" value={additionalInfo.laboratorySentTo || ""} onChange={(value) => updateTemplate("additionalInfo", "laboratorySentTo", value)} />
          <LabeledTextarea label="Conclusion" value={additionalInfo.conclusion || ""} onChange={(value) => updateTemplate("additionalInfo", "conclusion", value)} />
          <LabeledTextarea label="Additional Notes" value={additionalInfo.additionalNotes || ""} onChange={(value) => updateTemplate("additionalInfo", "additionalNotes", value)} />
          <LabeledTextarea label="Post Operative Management" value={additionalInfo.postOperativeManagement || additionalInfo.management || ""} onChange={(value) => {
            updateTemplate("additionalInfo", "postOperativeManagement", value);
            updateTemplate("additionalInfo", "management", value);
          }} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Surgeon's Signature" value={additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName || ""} onChange={(value) => {
              updateTemplate("additionalInfo", "surgeonSignatureText", value);
              updateTemplate("additionalInfo", "endoscopistName", value);
            }} placeholder="Enter surgeon name" />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date and Time</Label>
              <DateTimeDDMMYYYY24HourInput value={additionalInfo.dateTime || ""} onChange={(value) => updateTemplate("additionalInfo", "dateTime", value)} />
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
