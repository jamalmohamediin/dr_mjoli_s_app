import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

interface InguinalHerniaRepairReportPreviewProps {
  report: any;
}

export const InguinalHerniaRepairReportPreview = ({
  report,
}: InguinalHerniaRepairReportPreviewProps) => {
  const template = report?.inguinalHernia || {};
  const preoperative = template.preoperative || {};
  const operativeFindings = template.operativeFindings || {};
  const procedure = template.procedure || {};
  const closure = template.closure || {};
  const complications = template.complications || {};
  const additionalInfo = template.additionalInfo || {};
  const isConvertedToOpen = procedure.approach === "Laparoscopic converted to open";
  const showOpenRepairSection = procedure.approach === "Open repair" || isConvertedToOpen;
  const showLaparoscopicRepairSection = procedure.approach === "Laparoscopic repair" || isConvertedToOpen;
  const selectedRepairTechniques = toArray(procedure.repairTechnique);
  const showTissueRepairSection =
    showOpenRepairSection && selectedRepairTechniques.includes("Tissue repair");
  const showMeshRepairSection =
    showOpenRepairSection && selectedRepairTechniques.includes("Mesh repair");
  const peritoneumClosureValue = !showLaparoscopicRepairSection
    ? ""
    : procedure.laparoscopicApproach === "TEP (Totally Extraperitoneal)"
      ? "N/A"
      : procedure.laparoscopicApproach === "TAPP (Transabdominal Preperitoneal)"
        ? procedure.peritoneumClosure
        : "";
  const preperitonealDevelopment = toArray(procedure.preperitonealDevelopment)
    .map((entry) => {
      if (entry.toLowerCase() === "other" && procedure.preperitonealDevelopmentOther) {
        return `Other: ${procedure.preperitonealDevelopmentOther}`;
      }

      return entry;
    })
    .join(", ");

  const sections: StructuredTemplatePreviewSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Indication for Surgery", value: joinSelections(preoperative.indication, preoperative.indicationOther), fullWidth: true },
        { label: "Urgency", value: preoperative.urgency },
      ],
    },
    {
      title: "Operative Findings",
      entries: [
        { label: "Type", value: joinSelections(operativeFindings.type, operativeFindings.typeOther), fullWidth: true },
        { label: "Side", value: operativeFindings.side },
        { label: "Size of defect", value: operativeFindings.sizeOfDefect },
        { label: "Hernia contents", value: joinSelections(operativeFindings.contents, operativeFindings.contentsOther), fullWidth: true },
        { label: "Posterior wall", value: operativeFindings.posteriorWall },
        { label: "Additional pathology", value: operativeFindings.additionalPathology, fullWidth: true },
      ],
    },
    {
      title: "Procedure Details",
      entries: [
        { label: "Description of procedure", value: procedure.description, fullWidth: true },
        { label: "Technique used", value: joinSelections(procedure.technique, procedure.techniqueOther), fullWidth: true },
        { label: "Approach", value: procedure.approach },
        { label: "Reason for conversion", value: joinSelections(procedure.reasonForConversion, procedure.reasonForConversionOther), fullWidth: true },
      ],
    },
    {
      title: "Open Inguinal Hernia Repair",
      entries: [
        { label: "Incision used", value: showOpenRepairSection ? joinSelections(procedure.incisionUsed, procedure.incisionOther) : "", fullWidth: true },
        { label: "Length of incision", value: showOpenRepairSection && procedure.incisionLength ? `${procedure.incisionLength} cm` : "" },
        { label: "External oblique aponeurosis incised", value: showOpenRepairSection ? procedure.externalObliqueAponeurosisIncised : "" },
        { label: "Cord structures", value: showOpenRepairSection ? procedure.cordStructures : [], badges: true },
        { label: "Nerves identified", value: showOpenRepairSection ? procedure.nervesIdentified : [], badges: true },
        { label: "Ilioinguinal preserved", value: showOpenRepairSection ? procedure.ilioinguinalPreserved : "" },
        { label: "Iliohypogastric preserved", value: showOpenRepairSection ? procedure.iliohypogastricPreserved : "" },
        { label: "Genital branch preserved", value: showOpenRepairSection ? procedure.genitalBranchPreserved : "" },
        { label: "Sac management", value: showOpenRepairSection ? procedure.sacManagement : [], badges: true },
        { label: "Deep ring reconstruction", value: showOpenRepairSection ? procedure.deepRingReconstruction : "" },
        { label: "Repair technique", value: showOpenRepairSection ? procedure.repairTechnique : [], badges: true },
        { label: "External oblique aponeurosis", value: showOpenRepairSection ? closure.externalObliqueClosure : "" },
        { label: "Subcutaneous tissue", value: showOpenRepairSection ? closure.subcutaneousTissueClosure : "" },
        { label: "Skin closure", value: showOpenRepairSection ? closure.skinClosureOpen : [], badges: true },
        { label: "Local anaesthetic infiltration", value: showOpenRepairSection ? closure.localAnaestheticOpen : "" },
      ],
    },
    {
      title: "Tissue Reconstruction",
      entries: [
        { label: "Posterior wall tissue reconstruction", value: showTissueRepairSection ? joinSelections(procedure.tissueReconstruction, procedure.tissueReconstructionOther) : "", fullWidth: true },
        { label: "Suture material used", value: showTissueRepairSection ? procedure.sutureMaterial : "" },
        { label: "Suture method", value: showTissueRepairSection ? procedure.sutureMethod : "" },
      ],
    },
    {
      title: "Mesh Repair",
      entries: [
        { label: "Mesh inserted", value: showMeshRepairSection ? procedure.meshInserted : "" },
        { label: "Mesh size length", value: showMeshRepairSection && procedure.meshSizeLength ? `${procedure.meshSizeLength} cm` : "" },
        { label: "Mesh size width", value: showMeshRepairSection && procedure.meshSizeWidth ? `${procedure.meshSizeWidth} cm` : "" },
        { label: "Mesh positioning", value: showMeshRepairSection ? joinSelections(procedure.meshPositioning, procedure.meshPositioningOther) : "", fullWidth: true },
        { label: "Fixation", value: showMeshRepairSection ? procedure.fixation : [], badges: true },
        { label: "Fixation points", value: showMeshRepairSection ? joinSelections(procedure.fixationPoints, procedure.fixationPointsOther) : "", fullWidth: true },
      ],
    },
    {
      title: "Laparoscopic Inguinal Hernia Repair (TEP / TAPP)",
      entries: [
        { label: "Trocar Number", value: showLaparoscopicRepairSection ? procedure.trocarNumber : "" },
        { label: "Laparoscopic approach", value: showLaparoscopicRepairSection ? procedure.laparoscopicApproach : "" },
        { label: "Method of preperitoneal space developed", value: showLaparoscopicRepairSection ? preperitonealDevelopment : "", fullWidth: true },
        { label: "Landmarks and critical zones identified", value: showLaparoscopicRepairSection ? procedure.landmarks : [], badges: true },
        { label: "Laparoscopic sac management", value: showLaparoscopicRepairSection ? procedure.laparoscopicSacManagement : [], badges: true },
        { label: "Laparoscopic mesh used", value: showLaparoscopicRepairSection ? procedure.laparoscopicMeshUsed : "" },
        { label: "Laparoscopic mesh size length", value: showLaparoscopicRepairSection && procedure.laparoscopicMeshSizeLength ? `${procedure.laparoscopicMeshSizeLength} cm` : "" },
        { label: "Laparoscopic mesh size width", value: showLaparoscopicRepairSection && procedure.laparoscopicMeshSizeWidth ? `${procedure.laparoscopicMeshSizeWidth} cm` : "" },
        { label: "Laparoscopic fixation", value: showLaparoscopicRepairSection ? procedure.laparoscopicFixation : [], badges: true },
        { label: "Laparoscopic fixation sites", value: showLaparoscopicRepairSection ? joinSelections(procedure.laparoscopicFixationSites, procedure.laparoscopicFixationSitesOther) : "", fullWidth: true },
        { label: "Peritoneum closure", value: peritoneumClosureValue },
        { label: "Fascial closure (≥10 mm ports)", value: showLaparoscopicRepairSection ? closure.fascialClosurePorts : "" },
        { label: "Skin closure (laparoscopic)", value: showLaparoscopicRepairSection ? closure.skinClosureLaparoscopic : [], badges: true },
        { label: "Local anaesthetic infiltration (laparoscopic)", value: showLaparoscopicRepairSection ? closure.localAnaestheticLaparoscopic : "" },
      ],
    },
    {
      title: "Complications and Additional Information",
      entries: [
        { label: "Complications", value: joinSelections(complications.complications, complications.complicationOther), fullWidth: true },
        { label: "Additional Notes", value: additionalInfo.additionalNotes, fullWidth: true },
        { label: "Post operative management", value: additionalInfo.postOperativeManagement, fullWidth: true },
      ],
    },
  ];

  return (
    <StructuredTemplateReportPreview
      title="INGUINAL HERNIA REPAIR REPORT"
      patientInfo={template.patientInfo}
      sections={sections}
      signature={{
        label: "Surgeon Signature",
        text: additionalInfo.surgeonSignatureText,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage="Start filling out the inguinal hernia repair form to see findings appear here."
    />
  );
};
