import appendectomyImage from "@/assets/appendectomy.jpg";
import { createSurgicalDiagramCanvas } from "@/utils/createSurgicalDiagramCanvas";
import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { joinSelections, toArray } from "@/utils/templateDataHelpers";

const parseMarkings = (value: string) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const generateInguinalHerniaPDF = async (data: any, patientInfo?: any) => {
  const preoperative = data?.preoperative || {};
  const operativeFindings = data?.operativeFindings || {};
  const procedure = data?.procedure || {};
  const closure = data?.closure || {};
  const complications = data?.complications || {};
  const additionalInfo = data?.additionalInfo || {};
  const isConvertedToOpen = procedure.approach === "Laparoscopic converted to open";
  const showOpenRepairSection = procedure.approach === "Open repair" || isConvertedToOpen;
  const showLaparoscopicRepairSection = procedure.approach === "Laparoscopic repair" || isConvertedToOpen;
  const selectedRepairTechniques = toArray(procedure.repairTechnique);
  const showTissueRepairSection =
    showOpenRepairSection && selectedRepairTechniques.includes("Tissue repair");
  const showMeshRepairSection =
    showOpenRepairSection && selectedRepairTechniques.includes("Mesh repair");
  const preperitonealDevelopment = toArray(procedure.preperitonealDevelopment)
    .map((entry) => {
      if (entry.toLowerCase() === "other" && procedure.preperitonealDevelopmentOther) {
        return `Other: ${procedure.preperitonealDevelopmentOther}`;
      }

      return entry;
    })
    .join(", ");
  const diagramImageData = await createSurgicalDiagramCanvas(
    appendectomyImage,
    parseMarkings(data?.procedureFindings?.findings || ""),
    1.5,
  );

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        { label: "Indication for Surgery", value: joinSelections(preoperative.indication, preoperative.indicationOther) },
        { label: "Urgency", value: preoperative.urgency },
      ],
    },
    {
      title: "Operative Findings",
      entries: [
        { label: "Type", value: joinSelections(operativeFindings.type, operativeFindings.typeOther) },
        { label: "Side", value: operativeFindings.side },
        { label: "Size of defect", value: operativeFindings.sizeOfDefect },
        { label: "Hernia contents", value: joinSelections(operativeFindings.contents, operativeFindings.contentsOther) },
        { label: "Posterior wall", value: operativeFindings.posteriorWall },
        { label: "Additional pathology", value: operativeFindings.additionalPathology },
      ],
    },
    {
      title: "Procedure Details",
      entries: [
        { label: "Description of procedure", value: procedure.description },
        { label: "Technique used", value: joinSelections(procedure.technique, procedure.techniqueOther) },
        { label: "Approach", value: procedure.approach },
        { label: "Reason for conversion", value: joinSelections(procedure.reasonForConversion, procedure.reasonForConversionOther) },
      ],
    },
    {
      title: "Open Inguinal Hernia Repair",
      entries: [
        { label: "Incision used", value: showOpenRepairSection ? joinSelections(procedure.incisionUsed, procedure.incisionOther) : "" },
        { label: "Length of incision", value: showOpenRepairSection && procedure.incisionLength ? `${procedure.incisionLength} cm` : "" },
        { label: "External oblique aponeurosis incised", value: showOpenRepairSection ? procedure.externalObliqueAponeurosisIncised : "" },
        { label: "Cord structures", value: showOpenRepairSection ? procedure.cordStructures : [] },
        { label: "Nerves identified", value: showOpenRepairSection ? procedure.nervesIdentified : [] },
        { label: "Ilioinguinal preserved", value: showOpenRepairSection ? procedure.ilioinguinalPreserved : "" },
        { label: "Iliohypogastric preserved", value: showOpenRepairSection ? procedure.iliohypogastricPreserved : "" },
        { label: "Genital branch preserved", value: showOpenRepairSection ? procedure.genitalBranchPreserved : "" },
        { label: "Sac management", value: showOpenRepairSection ? procedure.sacManagement : [] },
        { label: "Deep ring reconstruction", value: showOpenRepairSection ? procedure.deepRingReconstruction : "" },
        { label: "Repair technique", value: showOpenRepairSection ? procedure.repairTechnique : [] },
        { label: "External oblique aponeurosis", value: showOpenRepairSection ? closure.externalObliqueClosure : "" },
        { label: "Subcutaneous tissue", value: showOpenRepairSection ? closure.subcutaneousTissueClosure : "" },
        { label: "Skin closure", value: showOpenRepairSection ? closure.skinClosureOpen : [] },
        { label: "Local anaesthetic infiltration", value: showOpenRepairSection ? closure.localAnaestheticOpen : "" },
      ],
    },
    {
      title: "Tissue Reconstruction",
      entries: [
        { label: "Posterior wall tissue reconstruction", value: showTissueRepairSection ? joinSelections(procedure.tissueReconstruction, procedure.tissueReconstructionOther) : "" },
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
        { label: "Mesh positioning", value: showMeshRepairSection ? joinSelections(procedure.meshPositioning, procedure.meshPositioningOther) : "" },
        { label: "Fixation", value: showMeshRepairSection ? procedure.fixation : [] },
        { label: "Fixation points", value: showMeshRepairSection ? joinSelections(procedure.fixationPoints, procedure.fixationPointsOther) : "" },
      ],
    },
    {
      title: "Laparoscopic Inguinal Hernia Repair (TEP / TAPP)",
      entries: [
        { label: "Trocar Number", value: showLaparoscopicRepairSection ? procedure.trocarNumber : "" },
        { label: "Laparoscopic approach", value: showLaparoscopicRepairSection ? procedure.laparoscopicApproach : "" },
        { label: "Method of preperitoneal space developed", value: showLaparoscopicRepairSection ? preperitonealDevelopment : "" },
        { label: "Landmarks and critical zones identified", value: showLaparoscopicRepairSection ? procedure.landmarks : [] },
        { label: "Laparoscopic sac management", value: showLaparoscopicRepairSection ? procedure.laparoscopicSacManagement : [] },
        { label: "Laparoscopic mesh used", value: showLaparoscopicRepairSection ? procedure.laparoscopicMeshUsed : "" },
        { label: "Laparoscopic mesh size length", value: showLaparoscopicRepairSection && procedure.laparoscopicMeshSizeLength ? `${procedure.laparoscopicMeshSizeLength} cm` : "" },
        { label: "Laparoscopic mesh size width", value: showLaparoscopicRepairSection && procedure.laparoscopicMeshSizeWidth ? `${procedure.laparoscopicMeshSizeWidth} cm` : "" },
        { label: "Laparoscopic fixation", value: showLaparoscopicRepairSection ? procedure.laparoscopicFixation : [] },
        { label: "Laparoscopic fixation sites", value: showLaparoscopicRepairSection ? joinSelections(procedure.laparoscopicFixationSites, procedure.laparoscopicFixationSitesOther) : "" },
        { label: "Peritoneum closure", value: showLaparoscopicRepairSection ? procedure.peritoneumClosure : "" },
        { label: "Fascial closure (≥10 mm ports)", value: showLaparoscopicRepairSection ? closure.fascialClosurePorts : "" },
        { label: "Skin closure (laparoscopic)", value: showLaparoscopicRepairSection ? closure.skinClosureLaparoscopic : [] },
        { label: "Local anaesthetic infiltration (laparoscopic)", value: showLaparoscopicRepairSection ? closure.localAnaestheticLaparoscopic : "" },
      ],
    },
    {
      title: "Complications and Additional Information",
      entries: [
        { label: "Complications", value: joinSelections(complications.complications, complications.complicationOther) },
        { label: "Additional Notes", value: additionalInfo.additionalNotes },
        { label: "Post operative management", value: additionalInfo.postOperativeManagement },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title: "INGUINAL HERNIA REPAIR REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    diagram: diagramImageData
      ? {
          title: "Ports and Incisions Diagram",
          imageData: diagramImageData,
        }
      : undefined,
    signature: {
      text: additionalInfo.surgeonSignatureText,
      dateTime: additionalInfo.dateTime,
    },
  });
};
