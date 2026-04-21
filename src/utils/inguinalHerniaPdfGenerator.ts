import appendectomyImage from "@/assets/appendectomy.jpg";
import { createSurgicalDiagramCanvas } from "@/utils/createSurgicalDiagramCanvas";
import { getLocalDateTimeValue } from "@/utils/dateFormatter";
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
  const complicationsValue = formatSelection(
    complications.complications,
    complications.complicationOther,
  );

  const procedureDetailEntries: StructuredTemplatePdfSection["entries"] = [
    { label: "General Procedure", subheading: true },
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
    { label: "Trocar Number", value: isConvertedToOpen ? procedure.trocarNumber || "" : "" },
    ...(showOpenRepairSection
      ? [
          { label: "Open Inguinal Hernia Repair", subheading: true },
          {
            label: "Incision Used",
            value: formatSelection(procedure.incisionUsed, procedure.incisionOther),
          },
          {
            label: "Length Of Incision",
            value: formatCmValue(procedure.incisionLength),
          },
          {
            label: "External Oblique Aponeurosis Incised",
            value: formatChoice(procedure.externalObliqueAponeurosisIncised),
          },
          {
            label: "Cord Structures",
            value: formatChoiceList(procedure.cordStructures),
          },
          {
            label: "Nerves Identified",
            value: formatChoiceList(procedure.nervesIdentified),
          },
          {
            label: "Ilioinguinal Preserved",
            value: formatChoice(procedure.ilioinguinalPreserved),
          },
          {
            label: "Iliohypogastric Preserved",
            value: formatChoice(procedure.iliohypogastricPreserved),
          },
          {
            label: "Genital Branch Preserved",
            value: formatChoice(procedure.genitalBranchPreserved),
          },
          {
            label: "Sac Management",
            value: formatChoiceList(procedure.sacManagement),
          },
          {
            label: "Deep Ring Reconstruction",
            value: formatChoice(procedure.deepRingReconstruction),
          },
          {
            label: "Repair Technique",
            value: formatChoiceList(procedure.repairTechnique),
          },
          ...(hasTissueRepair
            ? [
                { label: "Tissue Reconstruction", subheading: true },
                {
                  label: "Posterior Wall Tissue Reconstruction",
                  value: formatSelection(
                    procedure.tissueReconstruction,
                    procedure.tissueReconstructionOther,
                  ),
                },
                { label: "Suture Material Used", value: procedure.sutureMaterial || "" },
                {
                  label: "Suture Method",
                  value: formatChoice(procedure.sutureMethod),
                },
              ]
            : []),
          ...(hasMeshRepair
            ? [
                { label: "Mesh Repair", subheading: true },
                { label: "Mesh Inserted", value: procedure.meshInserted || "" },
                {
                  label: "Mesh Size Length (Cm)",
                  value: formatCmValue(procedure.meshSizeLength),
                },
                {
                  label: "Mesh Size Width (Cm)",
                  value: formatCmValue(procedure.meshSizeWidth),
                },
                {
                  label: "Mesh Positioning",
                  value: formatSelection(
                    procedure.meshPositioning,
                    procedure.meshPositioningOther,
                  ),
                },
                { label: "Fixation", value: formatChoiceList(procedure.fixation) },
                {
                  label: "Fixation Points",
                  value: formatSelection(
                    procedure.fixationPoints,
                    procedure.fixationPointsOther,
                  ),
                },
              ]
            : []),
          { label: "Closure", subheading: true },
          {
            label: "External Oblique Aponeurosis",
            value: formatChoice(closure.externalObliqueClosure),
          },
          {
            label: "Subcutaneous Tissue",
            value: formatChoice(closure.subcutaneousTissueClosure),
          },
          {
            label: "Skin Closure",
            value: formatChoiceList(closure.skinClosureOpen),
          },
          {
            label: "Local Anaesthetic Infiltration",
            value: formatChoice(closure.localAnaestheticOpen),
          },
        ]
      : []),
    ...(showLaparoscopicRepairSection
      ? [
          { label: "Laparoscopic Inguinal Hernia Repair (TEP / TAPP)", subheading: true },
          {
            label: "Laparoscopic Approach",
            value: formatChoice(procedure.laparoscopicApproach),
          },
          {
            label: "Method Of Preperitoneal Space Developed",
            value: preperitonealDevelopment,
          },
          {
            label: "Landmarks And Critical Zones Identified",
            value: formatChoiceList(procedure.landmarks),
          },
          {
            label: "Laparoscopic Sac Management",
            value: formatChoiceList(procedure.laparoscopicSacManagement),
          },
          { label: "Laparoscopic Mesh Used", value: procedure.laparoscopicMeshUsed || "" },
          {
            label: "Laparoscopic Mesh Size Length (Cm)",
            value: formatCmValue(procedure.laparoscopicMeshSizeLength),
          },
          {
            label: "Laparoscopic Mesh Size Width (Cm)",
            value: formatCmValue(procedure.laparoscopicMeshSizeWidth),
          },
          {
            label: "Laparoscopic Fixation",
            value: formatChoiceList(procedure.laparoscopicFixation),
          },
          {
            label: "Laparoscopic Fixation Sites",
            value: formatSelection(
              procedure.laparoscopicFixationSites,
              procedure.laparoscopicFixationSitesOther,
            ),
          },
          { label: "Peritoneum Closure", value: peritoneumClosureValue },
          {
            label: "Fascial Closure (>=10 Mm Ports)",
            value: formatChoice(closure.fascialClosurePorts),
          },
          {
            label: "Skin Closure (Laparoscopic)",
            value: formatChoiceList(closure.skinClosureLaparoscopic),
          },
          {
            label: "Local Anaesthetic Infiltration (Laparoscopic)",
            value: formatChoice(closure.localAnaestheticLaparoscopic),
          },
        ]
      : []),
    ...(complicationsValue
      ? [
          { label: "Complications", subheading: true },
          { label: "Complications", value: complicationsValue },
        ]
      : []),
  ];

  const sections: StructuredTemplatePdfSection[] = [
    {
      title: "Preoperative Information",
      layout: "aligned-preoperative-grid",
      entries: [
        { label: "Surgeon", value: preoperative.surgeon || "" },
        { label: "Assistant", value: preoperative.assistant || "" },
        { label: "Anaesthetist", value: preoperative.anaesthetist || "" },
        {
          label: "Preoperative Imaging",
          value: joinSelections(
            preoperative.preoperativeImaging,
            preoperative.preoperativeImagingOther,
          ),
        },
        { label: "Start Time (24-hour)", value: preoperative.startTime || "" },
        { label: "End Time (24-hour)", value: preoperative.endTime || "" },
        {
          label: "Duration Of Operation (In Minutes)",
          value: preoperative.duration || "",
        },
        { label: "Operation Description", value: preoperative.operationDescription || "" },
        {
          label: "Indication For Surgery",
          value: formatSelection(preoperative.indication, preoperative.indicationOther),
        },
        { label: "Urgency", value: formatChoice(preoperative.urgency) },
      ],
    },
    {
      title: "Operative Findings",
      layout: "label-value-table",
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
      layout: "label-value-three-column",
      entries: procedureDetailEntries,
    },
    {
      title: "Additional Notes",
      layout: "label-value-table",
      entries: [{ label: "Additional Notes", value: additionalInfo.additionalNotes || "" }],
    },
    {
      title: "Post Operative Management",
      layout: "label-value-table",
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
      dateTime: additionalInfo.dateTime || getLocalDateTimeValue(),
      alwaysShow: true,
    },
  });
};
