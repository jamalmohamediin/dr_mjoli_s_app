import { hasText, joinSelections, toArray } from "@/utils/templateDataHelpers";

export interface ColonoscopyReportSectionEntry {
  label: string;
  value?: string | string[];
  fullWidth?: boolean;
  badges?: boolean;
}

export interface ColonoscopyReportSection {
  title: string;
  entries: ColonoscopyReportSectionEntry[];
  layout?: "default" | "colonoscopy-preoperative";
}

interface BuildColonoscopyReportSectionsOptions {
  includeSedationAndBbps?: boolean;
}

const hasSelection = (values: unknown, option: string) => toArray(values).includes(option);

const toCsv = (values: unknown) => toArray(values).join(", ");

const appendCsvLine = (lines: string[], label: string, values: unknown) => {
  const csv = toCsv(values);
  if (csv) {
    lines.push(`${label}: ${csv}`);
  }
};

const appendTextLine = (
  lines: string[],
  label: string,
  value: unknown,
  suffix = "",
) => {
  const text = String(value || "").trim();
  if (text) {
    lines.push(`${label}: ${text}${suffix}`);
  }
};

export const buildColonoscopyReportSections = (
  template: any,
  options: BuildColonoscopyReportSectionsOptions = {},
): ColonoscopyReportSection[] => {
  const includeSedationAndBbps = options.includeSedationAndBbps ?? true;

  const preoperative = template?.preoperative || {};
  const bowelPreparation = template?.bowelPreparation || {};
  const procedureDetails = template?.procedureDetails || {};
  const findingsSummary = template?.findingsSummary || {};
  const haemorrhoids = template?.haemorrhoids || {};
  const inflammation = template?.inflammation || {};
  const stricture = template?.stricture || {};
  const polyps = template?.polyps || {};
  const tumour = template?.tumour || {};
  const diverticula = template?.diverticula || {};
  const avMalformation = template?.avMalformation || {};
  const radiationProctitis = template?.radiationProctitis || {};
  const ulcer = template?.ulcer || {};
  const interventions = template?.interventions || {};
  const diagnosis = template?.diagnosis || {};
  const additionalInfo = template?.additionalInfo || {};

  const selectedFindings = toArray(findingsSummary.findings);
  const selectedDepth = toArray(procedureDetails.depthOfExamination);
  const selectedCaecalLandmarks = toArray(procedureDetails.caecalLandmarks);
  const reachedTerminalOrCaecum =
    selectedDepth.includes("Terminal Ileum") || selectedDepth.includes("Caecum");
  const showCaecalLandmarks = reachedTerminalOrCaecum;
  const showCaecumNotReachedReasons =
    selectedCaecalLandmarks.includes("Not Reached") ||
    (selectedDepth.length > 0 && !reachedTerminalOrCaecum);

  const medicationLines = [
    preoperative.medications?.midazolamDose
      ? `Midazolam ${preoperative.medications.midazolamDose} mg`
      : "",
    preoperative.medications?.fentanylDose
      ? `Fentanyl ${preoperative.medications.fentanylDose} mcg`
      : "",
    preoperative.medications?.propofolDose
      ? `Propofol ${preoperative.medications.propofolDose} mg`
      : "",
    preoperative.medications?.otherMedication
      ? `Other: ${preoperative.medications.otherMedication}`
      : "",
  ].filter(Boolean);

  const preoperativeEntries: ColonoscopyReportSectionEntry[] = [
    { label: "Endoscopist", value: toArray(preoperative.endoscopists).join(", ") },
    { label: "Assistant", value: toArray(preoperative.assistants).join(", ") },
    { label: "Anaesthetist", value: toArray(preoperative.anaesthetists).join(", ") },
    { label: "Start Time", value: preoperative.startTime },
    { label: "End Time", value: preoperative.endTime },
    { label: "Total Duration (Min)", value: preoperative.duration },
    { label: "Caecal Intubation Time", value: preoperative.caecalIntubationTime },
    { label: "Start of Withdrawal Time", value: preoperative.withdrawalStartTime },
    { label: "Duration of Withdrawal (Min)", value: preoperative.withdrawalDuration },
    { label: "Urgency", value: preoperative.procedureUrgency, badges: true },
    {
      label: "Signs & Symptoms",
      value: joinSelections(preoperative.signsSymptoms, preoperative.signsSymptomsOther),
      fullWidth: true,
    },
    {
      label: "Indication for Colonoscopy",
      value: joinSelections(preoperative.indications, preoperative.indicationOther),
      fullWidth: true,
    },
    {
      label: "Preoperative Imaging",
      value: joinSelections(preoperative.preoperativeImaging, preoperative.preoperativeImagingOther),
    },
  ];

  const bowelPreparationEntries: ColonoscopyReportSectionEntry[] = [
    {
      label: "Type of Prep",
      value: joinSelections(bowelPreparation.prepType, bowelPreparation.prepTypeOther),
      fullWidth: true,
    },
    { label: "Overall Assessment", value: bowelPreparation.overallAssessment },
  ];

  if (includeSedationAndBbps) {
    bowelPreparationEntries.push(
      { label: "Right Colon BBPS", value: bowelPreparation.bbpsRightColon, fullWidth: true },
      {
        label: "Transverse Colon BBPS",
        value: bowelPreparation.bbpsTransverseColon,
        fullWidth: true,
      },
      { label: "Left Colon BBPS", value: bowelPreparation.bbpsLeftColon, fullWidth: true },
      {
        label: "Total BBPS Score",
        value: bowelPreparation.totalBbps ? `${bowelPreparation.totalBbps} / 9` : "",
      },
    );
  }

  const procedureDetailsEntries: ColonoscopyReportSectionEntry[] = [
    {
      label: "Procedure",
      value: joinSelections(procedureDetails.procedures, procedureDetails.procedureOther),
      fullWidth: true,
    },
    {
      label: "Depth of Examination",
      value: procedureDetails.depthOfExamination,
      badges: true,
      fullWidth: true,
    },
    {
      label: "Caecal Intubation Landmarks Identified",
      value: showCaecalLandmarks
        ? joinSelections(
            procedureDetails.caecalLandmarks,
            procedureDetails.caecalLandmarksOther,
          )
        : "",
      fullWidth: true,
    },
    {
      label: "Reason For Not Reaching Caecum",
      value: showCaecumNotReachedReasons
        ? joinSelections(
            procedureDetails.reasonsCaecumNotReached,
            procedureDetails.reasonsCaecumNotReachedOther,
          )
        : "",
      fullWidth: true,
    },
    { label: "Difficulty", value: procedureDetails.difficulty },
  ];

  const findingsSummaryEntries: ColonoscopyReportSectionEntry[] = [
    {
      label: "Findings",
      value: joinSelections(findingsSummary.findings, findingsSummary.findingOther),
      fullWidth: true,
    },
    {
      label: "Site(s) of Abnormality",
      value: joinSelections(findingsSummary.sitesOfAbnormality, findingsSummary.siteOther),
      fullWidth: true,
    },
    {
      label: "Description of Findings",
      value: findingsSummary.descriptionOfFindings,
      fullWidth: true,
    },
  ];

  const detailedFindingSections: ColonoscopyReportSection[] = [];

  const showHaemorrhoids = hasSelection(selectedFindings, "Haemorrhoids");
  if (showHaemorrhoids) {
    detailedFindingSections.push({
      title: "Haemorrhoids",
      entries: [
        { label: "Haemorrhoid Grade", value: haemorrhoids.grades, badges: true, fullWidth: true },
        {
          label: "Haemorrhoids Bleeding Status",
          value: haemorrhoids.bleedingStatus,
          badges: true,
          fullWidth: true,
        },
      ],
    });
  }

  const showInflammation = hasSelection(selectedFindings, "Inflammation");
  if (showInflammation) {
    detailedFindingSections.push({
      title: "Inflammation",
      entries: [
        {
          label: "Description of Inflammation",
          value: joinSelections(inflammation.description, inflammation.descriptionOther),
          fullWidth: true,
        },
        { label: "Severity of Inflammation", value: inflammation.severity },
        { label: "Presence of Ulcers", value: inflammation.ulcerBurden },
        {
          label: "Ulcer Features",
          value:
            hasText(inflammation.ulcerBurden) && inflammation.ulcerBurden !== "None"
              ? joinSelections(inflammation.ulcerFeatures, inflammation.ulcerFeaturesOther)
              : "",
          fullWidth: true,
        },
        {
          label: "Inflammation Endoscopic Impression",
          value: joinSelections(inflammation.endoscopicImpression, inflammation.impressionOther),
          fullWidth: true,
        },
      ],
    });
  }

  const showStricture = hasSelection(selectedFindings, "Stricture (Benign/Malignant)");
  if (showStricture) {
    const strictureNumber =
      stricture.number === "Multiple" && hasText(stricture.multipleNumber)
        ? `Multiple (Number: ${stricture.multipleNumber})`
        : stricture.number;

    detailedFindingSections.push({
      title: "Stricture (Benign/Malignant)",
      entries: [
        { label: "Number of Strictures", value: strictureNumber },
        { label: "Length of Stricture", value: stricture.length },
        {
          label: "Severity of Narrowing",
          value: stricture.severityOfNarrowing,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Stricture Morphology Mucosal Appearance",
          value: joinSelections(stricture.morphology, stricture.morphologyOther),
          fullWidth: true,
        },
        {
          label: "Stricture Endoscopic Impression",
          value: stricture.endoscopicImpression,
          badges: true,
          fullWidth: true,
        },
      ],
    });
  }

  const showPolyps = hasSelection(selectedFindings, "Polyp(s)");
  if (showPolyps) {
    const largestDiameter =
      hasText(polyps.largestDiameterLength) || hasText(polyps.largestDiameterWidth)
        ? `${polyps.largestDiameterLength || ""} x ${polyps.largestDiameterWidth || ""} mm`
            .replace(/^ x /, "")
            .replace(/ x $/, "")
            .trim()
        : "";
    const range =
      hasText(polyps.rangeFrom) || hasText(polyps.rangeTo)
        ? `${polyps.rangeFrom || ""} - ${polyps.rangeTo || ""} mm`
            .replace(/^ - /, "")
            .replace(/ - $/, "")
            .trim()
        : "";

    detailedFindingSections.push({
      title: "Polyp(s)",
      entries: [
        { label: "Polyp Number", value: polyps.number },
        { label: "Polyp Size", value: polyps.size, badges: true, fullWidth: true },
        { label: "Largest Polyp Diameter", value: largestDiameter },
        { label: "Polyp Range (If Multiple)", value: range },
        {
          label: "Polyp Morphology",
          value: joinSelections(polyps.morphology, polyps.morphologyOther),
          fullWidth: true,
        },
      ],
    });
  }

  const showTumour = hasSelection(selectedFindings, "Tumour");
  if (showTumour) {
    detailedFindingSections.push({
      title: "Tumour",
      entries: [
        { label: "Estimated Length of Tumour (cm)", value: tumour.length },
        {
          label: "Circumferential Involvement",
          value: tumour.circumferentialInvolvement,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Lumen Narrowing",
          value: tumour.lumenNarrowing,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Tumour Endoscopic Impression",
          value: tumour.endoscopicImpression,
          badges: true,
          fullWidth: true,
        },
      ],
    });
  }

  const showDiverticula = hasSelection(selectedFindings, "Diverticula");
  if (showDiverticula) {
    detailedFindingSections.push({
      title: "Diverticula",
      entries: [
        { label: "Diverticula Number", value: diverticula.number },
        { label: "Diverticula Size", value: diverticula.size },
        {
          label: "Diverticula Distribution Pattern",
          value: diverticula.distributionPattern,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Diverticula Morphology",
          value: joinSelections(diverticula.morphology, diverticula.morphologyOther),
          fullWidth: true,
        },
      ],
    });
  }

  const showAvMalformation = hasSelection(selectedFindings, "AV Malformation");
  if (showAvMalformation) {
    detailedFindingSections.push({
      title: "AV Malformation",
      entries: [
        { label: "AV Malformation Number", value: avMalformation.number },
        { label: "AV Malformation Size", value: avMalformation.size },
        {
          label: "AV Malformation Morphology",
          value: avMalformation.morphology,
          badges: true,
          fullWidth: true,
        },
        {
          label: "AV Malformation Color Appearance",
          value: avMalformation.colorAppearance,
          badges: true,
          fullWidth: true,
        },
        {
          label: "AV Malformation Bleeding Status",
          value: avMalformation.bleedingStatus,
          badges: true,
          fullWidth: true,
        },
        {
          label: "AV Malformation Distribution Pattern",
          value: avMalformation.distributionPattern,
          badges: true,
          fullWidth: true,
        },
        { label: "AV Malformation Burden", value: avMalformation.burden },
        { label: "Risk of Bleeding", value: avMalformation.bleedingRisk },
      ],
    });
  }

  const showRadiationProctitis = hasSelection(selectedFindings, "Radiation Proctitis");
  if (showRadiationProctitis) {
    detailedFindingSections.push({
      title: "Radiation Proctitis",
      entries: [
        {
          label: "Extent From Anal Verge (cm)",
          value: radiationProctitis.extentFromAnalVerge,
        },
        {
          label: "Radiation Proctitis Distribution",
          value: radiationProctitis.distribution,
          badges: true,
          fullWidth: true,
        },
        { label: "Radiation Proctitis Severity", value: radiationProctitis.severity },
        {
          label: "Radiation Proctitis Mucosal Findings",
          value: joinSelections(
            radiationProctitis.mucosalFindings,
            radiationProctitis.mucosalFindingsOther,
          ),
          fullWidth: true,
        },
      ],
    });
  }

  const showUlcer = hasSelection(selectedFindings, "Ulcer (s)");
  if (showUlcer) {
    const ulcerLargestDiameter =
      hasText(ulcer.largestDiameterLength) || hasText(ulcer.largestDiameterWidth)
        ? `${ulcer.largestDiameterLength || ""} x ${ulcer.largestDiameterWidth || ""} mm`
            .replace(/^ x /, "")
            .replace(/ x $/, "")
            .trim()
        : "";
    const ulcerRange =
      hasText(ulcer.rangeFrom) || hasText(ulcer.rangeTo)
        ? `${ulcer.rangeFrom || ""} - ${ulcer.rangeTo || ""} mm`
            .replace(/^ - /, "")
            .replace(/ - $/, "")
            .trim()
        : "";

    detailedFindingSections.push({
      title: "Ulcer (s)",
      entries: [
        { label: "Number of Ulcers", value: ulcer.number },
        {
          label: "Approximate Number (If Multiple)",
          value: ulcer.number === "Multiple" ? ulcer.approximateNumberIfMultiple : "",
        },
        {
          label: "Ulcer Distribution",
          value: ulcer.distribution,
          badges: true,
          fullWidth: true,
        },
        { label: "Largest Ulcer Diameter", value: ulcerLargestDiameter },
        { label: "Ulcer Range (If Multiple)", value: ulcerRange },
        { label: "Ulcer Shape", value: ulcer.shape, badges: true, fullWidth: true },
        { label: "Ulcer Depth", value: ulcer.depth, badges: true, fullWidth: true },
        { label: "Ulcer Edges", value: ulcer.edges, badges: true, fullWidth: true },
        { label: "Ulcer Base", value: ulcer.base, badges: true, fullWidth: true },
        {
          label: "Ulcer Orientation",
          value: ulcer.orientation,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Bleeding Stigmata",
          value: ulcer.bleedingStigmata,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Surrounding Mucosa",
          value: joinSelections(ulcer.surroundingMucosa, ulcer.surroundingMucosaOther),
          fullWidth: true,
        },
        {
          label: "Associated Findings",
          value: joinSelections(ulcer.associatedFindings, ulcer.associatedFindingsOther),
          fullWidth: true,
        },
        {
          label: "Suspected Etiology (Endoscopic)",
          value: ulcer.suspectedEtiology,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Inflammatory Bowel Disease Type",
          value: hasSelection(ulcer.suspectedEtiology, "Inflammatory Bowel Disease")
            ? ulcer.ibdType
            : [],
          badges: true,
          fullWidth: true,
        },
        {
          label: "Infective Etiology",
          value: hasSelection(ulcer.suspectedEtiology, "Infective")
            ? joinSelections(ulcer.infectiveEtiology, ulcer.etiologyOther)
            : "",
          fullWidth: true,
        },
      ],
    });
  }

  const sections: ColonoscopyReportSection[] = [
    {
      title: "Preoperative Information",
      entries: preoperativeEntries,
      layout: "colonoscopy-preoperative",
    },
    {
      title: "Bowel Preparation and Procedure Details",
      entries: bowelPreparationEntries,
    },
    {
      title: "Procedure Details",
      entries: procedureDetailsEntries,
    },
    {
      title: "Findings Summary",
      entries: findingsSummaryEntries,
    },
  ];

  if (includeSedationAndBbps) {
    sections.splice(1, 0, {
      title: "Sedation / Anaesthesia",
      entries: [
        {
          label: "Sedationist",
          value:
            preoperative.sedationist === "Other"
              ? `Other: ${preoperative.sedationistOther || ""}`
              : preoperative.sedationist,
        },
        {
          label: "Type of Sedation",
          value: preoperative.sedationTypes,
          badges: true,
          fullWidth: true,
        },
        {
          label: "Medications and Dose Used",
          value: medicationLines,
          fullWidth: true,
        },
        {
          label: "Monitoring",
          value: joinSelections(preoperative.monitoring, preoperative.monitoringOther),
          fullWidth: true,
        },
        { label: "Level of Sedation Achieved", value: preoperative.sedationLevel },
      ],
    });
  }

  if (detailedFindingSections.length > 0) {
    sections.push(...detailedFindingSections);
  }

  const interventionDetails: string[] = [];
  appendCsvLine(interventionDetails, "Interventions", interventions.interventions);
  appendTextLine(interventionDetails, "Other Intervention", interventions.other);

  const diagnosisDetails: string[] = [];
  appendCsvLine(diagnosisDetails, "Final Endoscopic Diagnosis", diagnosis.diagnoses);
  appendTextLine(diagnosisDetails, "Other Diagnosis", diagnosis.diagnosisOther);

  sections.push(
    {
      title: "Interventions and Final Endoscopic Diagnosis",
      entries: [
        {
          label: "Procedure Interventions",
          value: interventionDetails,
          fullWidth: true,
        },
        {
          label: "Diagnosis",
          value: diagnosisDetails,
          fullWidth: true,
        },
      ],
    },
    {
      title: "Specimen",
      entries: [
        {
          label: "Specimen Sent for Pathology",
          value: additionalInfo.specimenSentForPathology,
        },
        {
          label: "Other Specimens Taken",
          value:
            additionalInfo.otherSpecimensTaken === "Yes"
              ? `Yes: ${additionalInfo.otherSpecimensTakenDetails || ""}`
              : additionalInfo.otherSpecimensTaken,
        },
        {
          label: "Specify Laboratory Sent to",
          value: additionalInfo.laboratorySentTo,
          fullWidth: true,
        },
      ],
    },
    {
      title: "Conclusion",
      entries: [{ label: "Conclusion", value: additionalInfo.conclusion, fullWidth: true }],
    },
    {
      title: "Additional Notes",
      entries: [{ label: "Additional Notes", value: additionalInfo.additionalNotes, fullWidth: true }],
    },
    {
      title: "Post Operative Management",
      entries: [
        {
          label: "Post Operative Management",
          value: additionalInfo.postOperativeManagement || additionalInfo.management,
          fullWidth: true,
        },
      ],
    },
  );

  return sections;
};
