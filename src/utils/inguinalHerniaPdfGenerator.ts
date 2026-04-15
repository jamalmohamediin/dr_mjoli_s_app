import appendectomyImage from "@/assets/appendectomy.jpg";
import { createSurgicalDiagramCanvas } from "@/utils/createSurgicalDiagramCanvas";
import {
  StructuredTemplatePdfSection,
  generateStructuredTemplatePdf,
} from "@/utils/structuredTemplatePdf";
import { joinSelections, toArray, toUiTitleCase } from "@/utils/templateDataHelpers";

const parseMarkings = (value: string) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const formatChoice = (value: unknown) => {
  const textValue = String(value || "").trim();
  return textValue ? toUiTitleCase(textValue) : "";
};

const formatChoiceList = (value: unknown) => toArray(value).map((entry) => toUiTitleCase(entry));

const formatSelection = (value: unknown, otherValue?: unknown) => {
  const joined = joinSelections(value, otherValue);
  return joined ? toUiTitleCase(joined) : "";
};

const formatCmValue = (value: unknown) => {
  const textValue = String(value || "").trim();
  return textValue ? `${textValue} cm` : "";
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
  const showLaparoscopicRepairSection =
    procedure.approach === "Laparoscopic repair" || isConvertedToOpen;
  const selectedRepairTechniques = toArray(procedure.repairTechnique);
  const hasTissueRepair = selectedRepairTechniques.includes("Tissue repair");
  const hasMeshRepair = selectedRepairTechniques.includes("Mesh repair");

  const withOpenSectionVisibility = (value: string | string[]) =>
    showOpenRepairSection ? value : "";

  const withLaparoscopicSectionVisibility = (value: string | string[]) =>
    showLaparoscopicRepairSection ? value : "";

  const openTissueValue = (value: string | string[]) => {
    if (!showOpenRepairSection) return "";
    if (hasTissueRepair) return value;
    if (hasMeshRepair) return "N/A";
    return "";
  };

  const openMeshValue = (value: string | string[]) => {
    if (!showOpenRepairSection) return "";
    if (hasMeshRepair) return value;
    if (hasTissueRepair) return "N/A";
    return "";
  };

  const preperitonealDevelopment = toArray(procedure.preperitonealDevelopment)
    .map((entry) => {
      if (entry.toLowerCase() === "other" && procedure.preperitonealDevelopmentOther) {
        return `Other: ${procedure.preperitonealDevelopmentOther}`;
      }

      return entry;
    })
    .map((entry) => toUiTitleCase(entry))
    .join(", ");

  const peritoneumClosureValue = !showLaparoscopicRepairSection
    ? ""
    : procedure.laparoscopicApproach === "TEP (Totally Extraperitoneal)"
      ? "N/A"
      : procedure.laparoscopicApproach === "TAPP (Transabdominal Preperitoneal)"
        ? formatChoice(procedure.peritoneumClosure)
        : "";

  const diagramImageData = await createSurgicalDiagramCanvas(
    appendectomyImage,
    parseMarkings(data?.procedureFindings?.findings || ""),
    1.5,
  );

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      entries: [
        {
          label: "Indication For Surgery",
          value: formatSelection(preoperative.indication, preoperative.indicationOther),
        },
        { label: "Urgency", value: formatChoice(preoperative.urgency) },
      ],
    },
    {
      title: "Operative Findings",
      entries: [
        {
          label: "Type",
          value: formatSelection(operativeFindings.type, operativeFindings.typeOther),
        },
        { label: "Side", value: formatChoice(operativeFindings.side) },
        { label: "Size Of Defect", value: formatChoice(operativeFindings.sizeOfDefect) },
        {
          label: "Hernia Contents",
          value: formatSelection(operativeFindings.contents, operativeFindings.contentsOther),
        },
        { label: "Posterior Wall", value: formatChoice(operativeFindings.posteriorWall) },
        { label: "Additional Pathology", value: operativeFindings.additionalPathology || "" },
      ],
    },
    {
      title: "Procedure Details",
      entries: [
        { label: "Description Of Procedure", value: procedure.description || "" },
        {
          label: "Technique Used",
          value: formatSelection(procedure.technique, procedure.techniqueOther),
        },
        { label: "Approach", value: formatChoice(procedure.approach) },
        {
          label: "Reason For Conversion",
          value: isConvertedToOpen
            ? formatSelection(procedure.reasonForConversion, procedure.reasonForConversionOther)
            : "",
        },
        { label: "Trocar Number", value: procedure.trocarNumber || "" },
      ],
    },
    {
      title: "Open Inguinal Hernia Repair",
      entries: [
        {
          label: "Incision Used",
          value: withOpenSectionVisibility(
            formatSelection(procedure.incisionUsed, procedure.incisionOther),
          ),
        },
        {
          label: "Repair Technique",
          value: withOpenSectionVisibility(formatChoiceList(procedure.repairTechnique)),
        },
        {
          label: "Length Of Incision",
          value: withOpenSectionVisibility(formatCmValue(procedure.incisionLength)),
        },
        {
          label: "Posterior Wall Tissue Reconstruction",
          value: openTissueValue(
            formatSelection(procedure.tissueReconstruction, procedure.tissueReconstructionOther),
          ),
        },
        {
          label: "External Oblique Aponeurosis Incised",
          value: withOpenSectionVisibility(formatChoice(procedure.externalObliqueAponeurosisIncised)),
        },
        { label: "Suture Material Used", value: openTissueValue(procedure.sutureMaterial || "") },
        {
          label: "Cord Structures",
          value: withOpenSectionVisibility(formatChoiceList(procedure.cordStructures)),
        },
        { label: "Suture Method", value: openTissueValue(formatChoice(procedure.sutureMethod)) },
        {
          label: "Nerves Identified",
          value: withOpenSectionVisibility(formatChoiceList(procedure.nervesIdentified)),
        },
        { label: "Mesh Inserted", value: openMeshValue(procedure.meshInserted || "") },
        {
          label: "Ilioinguinal Preserved",
          value: withOpenSectionVisibility(formatChoice(procedure.ilioinguinalPreserved)),
        },
        {
          label: "Mesh Size Length (Cm)",
          value: openMeshValue(formatCmValue(procedure.meshSizeLength)),
        },
        {
          label: "Iliohypogastric Preserved",
          value: withOpenSectionVisibility(formatChoice(procedure.iliohypogastricPreserved)),
        },
        {
          label: "Mesh Size Width (Cm)",
          value: openMeshValue(formatCmValue(procedure.meshSizeWidth)),
        },
        {
          label: "Genital Branch Preserved",
          value: withOpenSectionVisibility(formatChoice(procedure.genitalBranchPreserved)),
        },
        {
          label: "Mesh Positioning",
          value: openMeshValue(
            formatSelection(procedure.meshPositioning, procedure.meshPositioningOther),
          ),
        },
        {
          label: "Sac Management",
          value: withOpenSectionVisibility(formatChoiceList(procedure.sacManagement)),
        },
        { label: "Fixation", value: openMeshValue(formatChoiceList(procedure.fixation)) },
        {
          label: "Deep Ring Reconstruction",
          value: withOpenSectionVisibility(formatChoice(procedure.deepRingReconstruction)),
        },
        {
          label: "Fixation Points",
          value: openMeshValue(
            formatSelection(procedure.fixationPoints, procedure.fixationPointsOther),
          ),
        },
      ],
    },
    {
      title: "Closure",
      entries: [
        {
          label: "External Oblique Aponeurosis",
          value: withOpenSectionVisibility(formatChoice(closure.externalObliqueClosure)),
        },
        {
          label: "Skin Closure",
          value: withOpenSectionVisibility(formatChoiceList(closure.skinClosureOpen)),
        },
        {
          label: "Subcutaneous Tissue",
          value: withOpenSectionVisibility(formatChoice(closure.subcutaneousTissueClosure)),
        },
        {
          label: "Local Anaesthetic Infiltration",
          value: withOpenSectionVisibility(formatChoice(closure.localAnaestheticOpen)),
        },
      ],
    },
    {
      title: "Laparoscopic Inguinal Hernia Repair (TEP / TAPP)",
      entries: [
        {
          label: "Laparoscopic Approach",
          value: withLaparoscopicSectionVisibility(formatChoice(procedure.laparoscopicApproach)),
        },
        {
          label: "Laparoscopic Fixation",
          value: withLaparoscopicSectionVisibility(
            formatChoiceList(procedure.laparoscopicFixation),
          ),
        },
        {
          label: "Method Of Preperitoneal Space Developed",
          value: withLaparoscopicSectionVisibility(preperitonealDevelopment),
        },
        {
          label: "Laparoscopic Fixation Sites",
          value: withLaparoscopicSectionVisibility(
            formatSelection(
              procedure.laparoscopicFixationSites,
              procedure.laparoscopicFixationSitesOther,
            ),
          ),
        },
        {
          label: "Landmarks And Critical Zones Identified",
          value: withLaparoscopicSectionVisibility(formatChoiceList(procedure.landmarks)),
        },
        {
          label: "Fascial Closure (>=10 Mm Ports)",
          value: withLaparoscopicSectionVisibility(formatChoice(closure.fascialClosurePorts)),
        },
        {
          label: "Laparoscopic Sac Management",
          value: withLaparoscopicSectionVisibility(
            formatChoiceList(procedure.laparoscopicSacManagement),
          ),
        },
        {
          label: "Skin Closure (Laparoscopic)",
          value: withLaparoscopicSectionVisibility(
            formatChoiceList(closure.skinClosureLaparoscopic),
          ),
        },
        {
          label: "Laparoscopic Mesh Used",
          value: withLaparoscopicSectionVisibility(procedure.laparoscopicMeshUsed || ""),
        },
        {
          label: "Local Anaesthetic Infiltration (Laparoscopic)",
          value: withLaparoscopicSectionVisibility(
            formatChoice(closure.localAnaestheticLaparoscopic),
          ),
        },
        {
          label: "Laparoscopic Mesh Size Length (Cm)",
          value: withLaparoscopicSectionVisibility(
            formatCmValue(procedure.laparoscopicMeshSizeLength),
          ),
        },
        {
          label: "Peritoneum Closure",
          value: withLaparoscopicSectionVisibility(peritoneumClosureValue),
        },
        {
          label: "Laparoscopic Mesh Size Width (Cm)",
          value: withLaparoscopicSectionVisibility(
            formatCmValue(procedure.laparoscopicMeshSizeWidth),
          ),
        },
      ],
    },
    {
      title: "Complications",
      entries: [
        {
          label: "Complications",
          value: formatSelection(complications.complications, complications.complicationOther),
        },
      ],
    },
    {
      title: "Additional Notes",
      entries: [{ label: "Additional Notes", value: additionalInfo.additionalNotes || "" }],
    },
    {
      title: "Post Operative Management",
      entries: [
        {
          label: "Post Operative Management",
          value: additionalInfo.postOperativeManagement || "",
        },
      ],
    },
  ];

  return generateStructuredTemplatePdf({
    title: "INGUINAL HERNIA REPAIR REPORT",
    patientInfo: patientInfo || data?.patientInfo,
    sections,
    diagram: diagramImageData
      ? {
          title: "Ports And Incisions Diagram",
          imageData: diagramImageData,
          placement: "inlineRight",
          sectionTitle: "Procedure Details",
        }
      : undefined,
    signature: {
      text: additionalInfo.surgeonSignatureText,
      dateTime: additionalInfo.dateTime,
      alwaysShow: true,
    },
  });
};
