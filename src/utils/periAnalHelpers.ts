import {
  createInitialPeriAnalDiagramMarkings,
  DEFAULT_PERI_ANAL_DIAGRAM_VARIANT,
} from "@/utils/periAnalDiagramConfig";

export interface PeriAnalEntry {
  label: string;
  value: string;
}

export interface PeriAnalSection {
  title: string;
  entries: PeriAnalEntry[];
}

export interface PeriAnalDiagramState {
  activeVariant: string;
  markingsByVariant: Record<string, any[]>;
}

export const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean) as string[];
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
};

export const joinSelections = (values: unknown, otherValue?: string) =>
  toArray(values)
    .map((value) => (value === "Other" && otherValue?.trim() ? `Other: ${otherValue}` : value))
    .filter(Boolean)
    .join(", ");

const pushEntry = (entries: PeriAnalEntry[], label: string, value: unknown) => {
  const text = typeof value === "string" ? value.trim() : String(value || "").trim();
  if (!text) return;
  entries.push({ label, value: text });
};

const selectedFindings = (data: any) => {
  const findings = toArray(data?.findings?.selectedFindings);
  return findings.map((finding) =>
    finding === "Other" && data?.findings?.otherFindingText
      ? `Other: ${data.findings.otherFindingText}`
      : finding
  );
};

export const parsePeriAnalDiagramState = (procedureFindings: any): PeriAnalDiagramState => {
  const state = procedureFindings || {};
  const defaultMarkings = createInitialPeriAnalDiagramMarkings();
  const defaultVariantKeys = Object.keys(defaultMarkings);
  const rawMarkings = state.diagramMarkingsByVariant || {};
  const legacyNeutralMarkings = Array.isArray(rawMarkings.neutral) ? rawMarkings.neutral : [];
  const legacyFemaleMarkings = Array.isArray(rawMarkings.female) ? rawMarkings.female : [];
  const markingsByVariant = {
    ...defaultMarkings,
    ...rawMarkings,
  };

  if (!Array.isArray(rawMarkings.externalPerianalSkin) && legacyNeutralMarkings.length > 0) {
    markingsByVariant.externalPerianalSkin = legacyNeutralMarkings;
  }

  if (!Array.isArray(rawMarkings.lithotomyPosition) && legacyFemaleMarkings.length > 0) {
    markingsByVariant.lithotomyPosition = legacyFemaleMarkings;
  }

  return {
    activeVariant: defaultVariantKeys.includes(state.activeDiagramVariant)
      ? state.activeDiagramVariant
      : DEFAULT_PERI_ANAL_DIAGRAM_VARIANT,
    markingsByVariant,
  };
};

export const getPeriAnalFindingSections = (data: any): PeriAnalSection[] => {
  const sections: PeriAnalSection[] = [];
  const selected = toArray(data?.findings?.selectedFindings);

  if (selected.includes("Perianal Abscess")) {
    const abscess = data?.findings?.perianalAbscess || {};
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", abscess.descriptionOfFindings);
    pushEntry(entries, "Location", joinSelections(abscess.location, abscess.locationOther));
    pushEntry(entries, "Size", [abscess.sizeLength, abscess.sizeWidth].filter(Boolean).join(" x "));
    pushEntry(entries, "Site Of Abscess", joinSelections(abscess.siteOfAbscess, abscess.siteOfAbscessOther));
    pushEntry(entries, "Fluctance", abscess.fluctance);
    pushEntry(entries, "Overlying Skin", joinSelections(abscess.overlyingSkin, abscess.overlyingSkinOther));
    pushEntry(entries, "Associated Internal Opening", abscess.associatedInternalOpening);
    pushEntry(entries, "Position Of Internal Opening", abscess.positionOfInternalOpening);
    pushEntry(entries, "Procedure Performed", joinSelections(abscess.procedurePerformed, abscess.procedurePerformedOther));
    pushEntry(entries, "Pus Drained", abscess.pusDrainedVolume);
    pushEntry(entries, "Irrigation Performed", abscess.irrigationPerformed);
    pushEntry(entries, "Wound Control", joinSelections(abscess.woundControl, abscess.woundControlOther));
    sections.push({ title: "Perianal Abscess", entries });
  }

  if (selected.includes("Perianal Fistula")) {
    const fistula = data?.findings?.perianalFistula || {};
    const fistulaProcedures = toArray(fistula.procedurePerformed);
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", fistula.descriptionOfFindings);
    pushEntry(entries, "Classification", joinSelections(fistula.classification));
    pushEntry(entries, "No Of External Openings", fistula.numberOfExternalOpenings);
    pushEntry(entries, "External Opening (Clock Position)", fistula.externalOpeningClockPosition);
    pushEntry(entries, "Distance From Anal Verge", fistula.externalOpeningDistanceFromAnalVerge);
    pushEntry(entries, "No Of Internal Openings", fistula.numberOfInternalOpenings);
    pushEntry(entries, "Internal Opening (Clock Position)", fistula.internalOpeningClockPosition);
    pushEntry(entries, "None Found", fistula.internalOpeningNoneFound);
    pushEntry(entries, "Position Of Internal Openings", joinSelections(fistula.positionOfInternalOpenings, fistula.positionOfInternalOpeningsOther));
    pushEntry(entries, "Associated Abscess Cavity", fistula.associatedAbscessCavity);
    pushEntry(entries, "Sphincter Involvement", fistula.sphincterInvolvement);
    pushEntry(entries, "Horseshoe Extension", fistula.horseshoeExtension);
    pushEntry(entries, "Secondary Tracts", fistula.secondaryTracts);
    pushEntry(entries, "Procedure Performed", joinSelections(fistula.procedurePerformed, fistula.procedurePerformedOther));
    pushEntry(entries, "Method Of Identifying Internal Opening", joinSelections(fistula.methodOfIdentifyingInternalOpening, fistula.methodOfIdentifyingInternalOpeningOther));

    if (fistulaProcedures.includes("Fistulotomy")) {
      const fistulotomy = fistula.fistulotomyDetails || {};
      pushEntry(entries, "Fistulotomy - Tract Laid Open", fistulotomy.tractLaidOpen);
      pushEntry(entries, "Fistulotomy - Percentage Of Sphincter Divided", fistulotomy.percentageOfSphincterDivided);
      pushEntry(entries, "Fistulotomy - Curettage Of Tract", fistulotomy.curettageOfTract);
      pushEntry(entries, "Fistulotomy - Marsupialisation Performed", fistulotomy.marsupialisationPerformed);
      pushEntry(entries, "Fistulotomy - Length Of Tract", fistulotomy.lengthOfTract);
    }

    if (fistulaProcedures.includes("Seton Insertion")) {
      const seton = fistula.setonProcedureDetails || {};
      pushEntry(entries, "Seton - Type", seton.typeOfSeton);
      pushEntry(entries, "Seton - Material Used", joinSelections(seton.materialUsed, seton.materialUsedOther));
      pushEntry(entries, "Seton - Number Of Setons Placed", seton.numberOfSetonsPlaced);
      pushEntry(entries, "Seton - Planned Duration", seton.plannedDuration);
    }

    if (fistulaProcedures.includes("LIFT")) {
      const lift = fistula.liftProcedureDetails || {};
      pushEntry(entries, "LIFT - Intersphincteric Plane Identified", lift.intersphinctericPlaneIdentified);
      pushEntry(entries, "LIFT - Dissection Method", joinSelections(lift.dissectionMethod));
      pushEntry(entries, "LIFT - Surrounding Fibrosis", lift.surroundingFibrosis);
      pushEntry(entries, "LIFT - Tract Divided", lift.tractDivided);
      pushEntry(entries, "LIFT - Closure Of Internal Opening", lift.closureOfInternalOpening);
      pushEntry(entries, "LIFT - Closure Of External Tract", lift.closureOfExternalTract);
      pushEntry(entries, "LIFT - External Tract Management", joinSelections(lift.externalTractManagement, lift.externalTractManagementOther));
      pushEntry(entries, "LIFT - Advancement Flap Added", lift.advancementFlapAdded);
      pushEntry(entries, "LIFT - Biologic Adjunct Used", lift.biologicAdjunctUsed);
    }

    if (fistulaProcedures.includes("Advancement Flap")) {
      const advancement = fistula.advancementFlapDetails || {};
      pushEntry(entries, "Advancement Flap - Flap Type", advancement.flapType);
      pushEntry(entries, "Advancement Flap - Length Of Flap", advancement.lengthOfFlap);
      pushEntry(entries, "Advancement Flap - Internal Opening Excised", advancement.internalOpeningExcised);
      pushEntry(entries, "Advancement Flap - Flap Vascularity Adequate", advancement.flapVascularityAdequate);
      pushEntry(entries, "Advancement Flap - External Tract Management", joinSelections(advancement.externalTractManagement, advancement.externalTractManagementOther));
    }

    if (fistulaProcedures.includes("Plug / Glue")) {
      const plug = fistula.plugGlueDetails || {};
      pushEntry(entries, "Plug / Glue - Which Was Used", joinSelections(plug.whichWasUsed));
      pushEntry(entries, "Plug / Glue - Plug Type", joinSelections(plug.plugType, plug.plugTypeOther));
      pushEntry(entries, "Plug / Glue - Glue Type", joinSelections(plug.glueType));
      pushEntry(entries, "Plug / Glue - Tract Curettage Performed", plug.tractCurettagePerformed);
      pushEntry(entries, "Plug / Glue - Irrigation", joinSelections(plug.irrigation, plug.irrigationOther));
      pushEntry(entries, "Plug / Glue - Insertion Direction", joinSelections(plug.insertionDirection));
      pushEntry(entries, "Plug / Glue - Internal Opening Closure", plug.internalOpeningClosure);
    }

    if (fistulaProcedures.includes("Fistulectomy")) {
      const fistulectomy = fistula.fistulectomyDetails || {};
      pushEntry(entries, "Fistulectomy - Extent Of Tract Excision", fistulectomy.extentOfTractExcision);
      pushEntry(entries, "Fistulectomy - Closure Of Internal Opening", fistulectomy.closureOfInternalOpening);
    }

    sections.push({ title: "Perianal Fistula", entries });
  }

  if (selected.includes("Fissure-In-Ano")) {
    const fissure = data?.findings?.fissureInAno || {};
    const fissureProcedures = toArray(fissure.procedurePerformed);
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", fissure.descriptionOfFindings);
    pushEntry(entries, "Location", joinSelections(fissure.location, fissure.locationOther));
    pushEntry(entries, "Height From Anal Verge", fissure.heightFromAnalVerge);
    pushEntry(entries, "Sentinel Pile", fissure.sentinelPile);
    pushEntry(entries, "Hypertrophied Papilla", fissure.hypertrophiedPapilla);
    pushEntry(entries, "Sphincter Hypertonicity", fissure.sphincterHypertonicity);
    pushEntry(entries, "Procedure Performed", joinSelections(fissure.procedurePerformed, fissure.procedurePerformedOther));

    if (fissureProcedures.includes("Lateral Internal Sphincterotomy")) {
      const lis = fissure.lateralInternalSphincterotomyDetails || {};
      pushEntry(entries, "Lateral Internal Sphincterotomy - Side", lis.sideOfLateralInternalSphincterotomy);
      pushEntry(entries, "Lateral Internal Sphincterotomy - Extent Of Sphincter Divided", lis.extentOfSphincterDivided);
      pushEntry(entries, "Lateral Internal Sphincterotomy - Skin Tag Excision", lis.skinTagExcision);
    }

    if (fissureProcedures.includes("Botox")) {
      const botox = fissure.botoxInjectionDetails || {};
      pushEntry(entries, "Botox - Dose", botox.botoxDoseInjection === "Other" ? botox.botoxDoseOther : botox.botoxDoseInjection);
      pushEntry(entries, "Botox - Muscle Of Injection", joinSelections(botox.muscleOfInjection, botox.muscleOfInjectionOther));
      pushEntry(entries, "Botox - No Of Sites", botox.numberOfSitesOfInjection);
      pushEntry(entries, "Botox - Sites Of Injection", joinSelections(botox.sitesOfInjection, botox.sitesOfInjectionOther));
    }

    if (fissureProcedures.includes("Advancement Flap")) {
      const advancement = fissure.advancementFlapDetails || {};
      pushEntry(entries, "Advancement Flap - Flap Type", advancement.flapType);
      pushEntry(entries, "Advancement Flap - Length Of Flap", advancement.lengthOfFlap);
      pushEntry(entries, "Advancement Flap - Flap Vascularity Adequate", advancement.flapVascularityAdequate);
    }

    sections.push({ title: "Fissure-In-Ano", entries });
  }

  if (selected.includes("Haemorrhoids")) {
    const haemorrhoids = data?.findings?.haemorrhoids || {};
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", haemorrhoids.descriptionOfFindings);
    pushEntry(entries, "Type", joinSelections(haemorrhoids.type));
    pushEntry(entries, "Internal Haemorrhoid Grade", haemorrhoids.internalHaemorrhoidGrade);
    pushEntry(entries, "Columns Involved", joinSelections(haemorrhoids.columnsInvolved, haemorrhoids.columnsInvolvedOther));
    pushEntry(entries, "Complications", joinSelections(haemorrhoids.complications, haemorrhoids.complicationsOther));
    pushEntry(entries, "Procedure Performed", joinSelections(haemorrhoids.procedurePerformed, haemorrhoids.procedurePerformedOther));
    pushEntry(entries, "Number Of Columns Treated", haemorrhoids.numberOfColumnsTreated);
    pushEntry(entries, "Energy Device Used For Haemorrhoidectomy", haemorrhoids.energyDeviceUsedForHaemorrhoidectomy);
    pushEntry(entries, "Mucosal Bridges Preserved", haemorrhoids.mucosalBridgesPreserved);
    pushEntry(entries, "Haemostasis Achieved", haemorrhoids.haemostasisAchieved);
    pushEntry(entries, "Anal Pack Inserted", haemorrhoids.analPackInserted);
    sections.push({ title: "Haemorrhoids", entries });
  }

  if (selected.includes("Warts")) {
    const warts = data?.findings?.warts || {};
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", warts.descriptionOfFindings);
    pushEntry(entries, "Distribution Of Warts", joinSelections(warts.distributionOfWarts, warts.distributionOfWartsOther));
    pushEntry(entries, "Size Of Lesions", warts.sizeOfLesions);
    pushEntry(entries, "Morphology", joinSelections(warts.morphology));
    pushEntry(entries, "Excision Method", joinSelections(warts.excisionMethod, warts.excisionMethodOther));
    pushEntry(entries, "Depth Of Excision", joinSelections(warts.depthOfExcision));
    pushEntry(entries, "Haemostasis Achieved", warts.haemostasisAchieved);
    sections.push({ title: "Warts", entries });
  }

  if (selected.includes("Hidradenitis Suppurativa")) {
    const hidradenitis = data?.findings?.hidradenitisSuppurativa || {};
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", hidradenitis.descriptionOfFindings);
    pushEntry(entries, "Sites Involved", joinSelections(hidradenitis.sitesInvolved));
    pushEntry(entries, "Laterality", hidradenitis.laterality);
    pushEntry(entries, "Nodules Present", hidradenitis.nodulesPresent);
    pushEntry(entries, "Abscesses Present", hidradenitis.abscessesPresent);
    pushEntry(entries, "Sinus Tracts Present", hidradenitis.sinusTractsPresent);
    pushEntry(entries, "Active Discharge", joinSelections(hidradenitis.activeDischarge));
    pushEntry(entries, "Surrounding Skin Condition", joinSelections(hidradenitis.surroundingSkinCondition));
    pushEntry(entries, "Depth Of Disease", joinSelections(hidradenitis.depthOfDisease, hidradenitis.depthOfDiseaseOther));
    pushEntry(entries, "Operative Procedure Performed", joinSelections(hidradenitis.operativeProcedurePerformed, hidradenitis.operativeProcedurePerformedOther));
    pushEntry(entries, "Extent Of Excision", hidradenitis.extentOfExcision);
    pushEntry(entries, "Haemostasis Achieved", hidradenitis.haemostasisAchieved);
    sections.push({ title: "Hidradenitis Suppurativa", entries });
  }

  if (selected.includes("Necrotising Fasciitis")) {
    const necrotising = data?.findings?.necrotisingFasciitis || {};
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Involved Areas", joinSelections(necrotising.involvedAreas));
    pushEntry(entries, "Depth Of Disease", joinSelections(necrotising.depthOfDisease, necrotising.depthOfDiseaseOther));
    pushEntry(entries, "Foul Odour", necrotising.foulOdour);
    pushEntry(entries, "Etiology Identified", joinSelections(necrotising.etiologyIdentified));
    pushEntry(entries, "Areas Debrided", joinSelections(necrotising.areasDebrided, necrotising.areasDebridedOther));
    pushEntry(entries, "Depth Of Debridement", joinSelections(necrotising.depthOfDebridement, necrotising.depthOfDebridementOther));
    pushEntry(entries, "Testicular Involvement", necrotising.testicularInvolvement);
    pushEntry(entries, "Orchidectomy Side", necrotising.orchidectomySide);
    pushEntry(entries, "Diversion Stoma Required", necrotising.diversionStomaRequired);
    pushEntry(entries, "Planned Re-Debridement", necrotising.plannedRedeBridement);
    sections.push({ title: "Necrotising Fasciitis", entries });
  }

  if (selected.includes("Mass / Lesion")) {
    const mass = data?.findings?.massLesion || {};
    const entries: PeriAnalEntry[] = [];
    pushEntry(entries, "Description Of Findings", mass.descriptionOfFindings);
    pushEntry(entries, "Location Of Mass", joinSelections(mass.locationOfMass));
    pushEntry(entries, "Size", [mass.sizeLength, mass.sizeWidth].filter(Boolean).join(" x "));
    pushEntry(entries, "Number Of Lesions", mass.numberOfLesions);
    pushEntry(entries, "Surface Changes", joinSelections(mass.surfaceChanges, mass.surfaceChangesOther));
    pushEntry(entries, "Consistency", joinSelections(mass.consistency, mass.consistencyOther));
    pushEntry(entries, "Fixation To Deeper Structures", mass.fixationToDeeperStructures);
    pushEntry(entries, "Sphincter Tone", mass.sphincterTone);
    pushEntry(entries, "Most Likely Diagnosis", joinSelections(mass.mostLikelyDiagnosis, mass.mostLikelyDiagnosisOther));
    pushEntry(entries, "Diagnostic Procedure Performed", joinSelections(mass.diagnosticProcedurePerformed, mass.diagnosticProcedurePerformedOther));
    sections.push({ title: "Mass / Lesion", entries });
  }

  return sections;
};

export const getPeriAnalAdditionalFindingSection = (data: any): PeriAnalSection | null => {
  const selected = selectedFindings(data);
  if (selected.length === 0) return null;

  return {
    title: "Findings Summary",
    entries: [{ label: "Selected Findings", value: selected.join(", ") }],
  };
};
