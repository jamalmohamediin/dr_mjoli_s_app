import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Stethoscope, User, Download, Save, Trash2, ChevronDown, ChevronUp, ClipboardList, FileSearch, Undo2, Redo2, RotateCcw, Database } from "lucide-react";
import { PatientInfoForm } from "@/components/PatientInfoForm";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { ProcedureInfoForm } from "@/components/ProcedureInfoForm";
import { ProcedureTypeSelection } from "@/components/ProcedureTypeSelection";
import { ConditionalDiagramDisplay } from "@/components/ConditionalDiagramDisplay";
import {
  generateInguinalHerniaMockData,
  generateGastroscopyMockData,
  generateColonoscopyMockData,
  generateCholecystectomyMockData,
  generateTAMISMockData,
  generateOpenAbdominalMockData,
  generateOpenGeneralMockData
} from "@/utils/mockDataGenerator";
import { ReportPreview } from "@/components/ReportPreview";
import { VentralHerniaReportPreview } from "@/components/VentralHerniaReportPreview";
import { AppendectomyReportPreview } from "@/components/AppendectomyReportPreview";
import { RectalCancerReportPreview } from "@/components/RectalCancerReportPreview";
import { RectalCancerForm } from "@/components/RectalCancerForm";
import { SmallBowelSurgeryForm } from "@/components/SmallBowelSurgeryForm";
import { SmallBowelSurgeryReportPreview } from "@/components/SmallBowelSurgeryReportPreview";
import { CholecystectomyForm } from "@/components/CholecystectomyForm";
import { CholecystectomyReportPreview } from "@/components/CholecystectomyReportPreview";
import { PeriAnalForm } from "@/components/PeriAnalForm";
import { PeriAnalReportPreview } from "@/components/PeriAnalReportPreview";
import { GastroscopyForm } from "@/components/GastroscopyForm";
import { GastroscopyReportPreview } from "@/components/GastroscopyReportPreview";
import { ColonoscopyForm } from "@/components/ColonoscopyForm";
import { ColonoscopyReportPreview } from "@/components/ColonoscopyReportPreview";
import { InguinalHerniaRepairForm } from "@/components/InguinalHerniaRepairForm";
import { InguinalHerniaRepairReportPreview } from "@/components/InguinalHerniaRepairReportPreview";
import { TransanalMinimallyInvasiveSurgeryForm } from "@/components/TransanalMinimallyInvasiveSurgeryForm";
import { TransanalMinimallyInvasiveSurgeryReportPreview } from "@/components/TransanalMinimallyInvasiveSurgeryReportPreview";
import { NarrativeSurgeryForm } from "@/components/NarrativeSurgeryForm";
import { NarrativeSurgeryReportPreview } from "@/components/NarrativeSurgeryReportPreview";
import { DateTime24HourInput, DateTimeDDMMYYYY24HourInput, Time24HourInput } from "@/components/Time24HourInput";
import { AppLayout, GlassContainer, GlassHeader } from "@/components/layout/AppLayout";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { PatientsTab } from "@/components/patients/PatientsTab";
import { ReportsTab } from "@/components/reports/ReportsTab";
import { captureReportAsPDF, saveDraft, DiagramCapture } from "@/utils/pdfGenerator";
import { generateFinalPDF, FinalDiagramCapture } from "@/utils/finalPdfGenerator";
import { generateAppendectomyPDF } from "@/utils/appendectomyPdfGenerator";
import { generateRectalCancerPDF } from "@/utils/rectalCancerPdfGenerator";
import { generateSmallBowelSurgeryPDF } from "@/utils/smallBowelSurgeryPdfGenerator";
import { generateCholecystectomyPDF } from "@/utils/cholecystectomyPdfGenerator";
import { generateGastroscopyPDF } from "@/utils/gastroscopyPdfGenerator";
import { generateColonoscopyPDF } from "@/utils/colonoscopyPdfGenerator";
import { generatePeriAnalPDF } from "@/utils/periAnalPdfGenerator";
import { generateInguinalHerniaPDF } from "@/utils/inguinalHerniaPdfGenerator";
import { generateTransanalMinimallyInvasiveSurgeryPDF } from "@/utils/transanalMinimallyInvasiveSurgeryPdfGenerator";
import { generateNarrativeSurgeryPDF } from "@/utils/narrativeSurgeryPdfGenerator";
import { generateVentralHerniaPDF } from "@/utils/ventralHerniaPdfGenerator";
import { getLocalDateTimeValue, formatDateOnly, formatDOBForFilename } from "@/utils/dateFormatter";
import { saveToStorage, loadFromStorage, createAutoSave, clearAllStorage } from "@/utils/dataStorage";
import { isFirebaseConfigured } from "@/lib/firebase";
import { exportSavedRecordPdf } from "@/utils/exportSavedRecord";
import {
  fetchPatientDatabaseSnapshot,
  loadPatientDatabaseCache,
  loadPatientSyncQueue,
  processPatientSyncQueue,
  queuePatientAttachmentsSync,
  queuePermanentPatientDeleteSync,
  queuePatientDeletedStateSync,
  queuePatientRecordDeleteSync,
  queuePatientRecordSync,
  savePatientDatabaseCache,
} from "@/utils/patientDatabaseStore";
import {
  applyPatientDeletedState,
  buildPatientRecord,
  createNewPatientId,
  createNewPatientRecordId,
  findMatchingPatientId,
  getCurrentTabForTemplate,
  getTemplateLabel,
  getTemplatePatientInfo,
  getTemplateTypeFromTab,
  PatientDatabaseCache,
  PatientAttachment,
  PatientRecord,
  removePatientRecordFromCache,
  removePatientsFromCache,
  upsertPatientRecordInCache,
} from "@/utils/patientRecords";
import { deletePatientFile, uploadPatientFiles } from "@/utils/patientMediaStore";
import { createInitialSmallBowelSurgeryState } from "@/utils/smallBowelSurgery";
import { createInitialCholecystectomyState } from "@/utils/cholecystectomy";
import { createInitialPeriAnalState } from "@/utils/periAnal";
import { createInitialGastroscopyState } from "@/utils/gastroscopy";
import { createInitialColonoscopyState } from "@/utils/colonoscopy";
import { createInitialInguinalHerniaState } from "@/utils/inguinalHernia";
import { createInitialTransanalMinimallyInvasiveSurgeryState } from "@/utils/transanalMinimallyInvasiveSurgery";
import { createInitialNarrativeSurgeryState } from "@/utils/narrativeSurgery";
import {
  createInitialPeriAnalDiagramMarkings,
  DEFAULT_PERI_ANAL_DIAGRAM_VARIANT,
  periAnalDiagramImages,
  periAnalDiagramLabels,
} from "@/utils/periAnalDiagramConfig";
import {
  createInitialPatientInfoState,
  createPatientStickerSyncSnapshot,
  getPatientStickerSyncSignature,
  getPatientStickerSyncTimestamp,
  hasExtractedPatientStickerData,
  mergePatientInfoUpdates,
} from "@/utils/patientSticker";
import {
  clearLatestExtractedPatientDraft,
  saveLatestExtractedPatientDraft,
  subscribeToLatestExtractedPatientDraft,
} from "@/utils/patientExtractionDraftStore";
import {
  clearQueuedLiveTemplateDraftSync,
  createLiveTemplateDraftSignature,
  createLiveTemplateDraftSnapshot,
  getLiveTemplateDraftSessionId,
  loadQueuedLiveTemplateDraftSync,
  processQueuedLiveTemplateDraftSync,
  queueLiveTemplateDraftSync,
  subscribeToLiveTemplateDraft,
} from "@/utils/liveTemplateDraftStore";
import { toast } from "sonner";
import appendectomyImage from "@/assets/appendectomy.jpg";
import smallBowelDiagramImage from "@/assets/APPENDECTOMY IMAGE.png";

const hasMeaningfulPatientInfoData = (patientInfo: any): boolean =>
  Object.values(createInitialPatientInfoState(patientInfo)).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return Boolean(value);
  });

const LIVE_TEMPLATE_LOCAL_EDIT_PROTECTION_MS = 8000;

const cloneStringArray = (value: any, fallback: string[] = []) =>
  Array.isArray(value) && value.length > 0 ? [...value] : [...fallback];

const createInitialVentralHerniaPreoperativeState = (source: any = {}) => ({
  surgeons: cloneStringArray(source.surgeons, [""]),
  assistants: cloneStringArray(source.assistants, [""]),
  anaesthetists: cloneStringArray(source.anaesthetists, [""]),
  anaesthetist: source.anaesthetist || "",
  duration: source.duration || "",
  startTime: source.startTime || "",
  endTime: source.endTime || "",
  indication: cloneStringArray(source.indication),
  indicationOther: source.indicationOther || "",
  imaging: cloneStringArray(source.imaging),
  imagingOther: source.imagingOther || "",
  procedureUrgency: cloneStringArray(source.procedureUrgency),
});

const createInitialVentralHerniaOperativeState = (source: any = {}) => ({
  herniaType: cloneStringArray(source.herniaType),
  herniaTypeOther: source.herniaTypeOther || "",
  herniaSite: cloneStringArray(source.herniaSite),
  herniaSiteOther: source.herniaSiteOther || "",
  herniaDefects: source.herniaDefects || "",
  herniaDefectLength: source.herniaDefectLength || "",
  herniaDefectWidth: source.herniaDefectWidth || "",
  numberOfDefects: source.numberOfDefects || "",
  contents: cloneStringArray(source.contents),
  contentsOther: source.contentsOther || "",
  strangulation: source.strangulation || "",
  meshInSitu: source.meshInSitu || "",
  meshDetails: source.meshDetails || "",
  approach: cloneStringArray(source.approach),
  approachOther: source.approachOther || "",
  conversionReason: cloneStringArray(source.conversionReason),
  conversionReasonOther: source.conversionReasonOther || "",
  trocarNumber: source.trocarNumber || "",
  operationDescription: source.operationDescription || "",
});

const createInitialVentralHerniaProcedureState = (source: any = {}) => ({
  dissection: source.dissection || "",
  sacExcised: source.sacExcised || "",
  fatDissected: source.fatDissected || "",
  defectClosed: source.defectClosed || "",
  closureTechnique: cloneStringArray(source.closureTechnique),
  closureTechniqueOther: source.closureTechniqueOther || "",
  closureMaterial: cloneStringArray(source.closureMaterial),
  closureMaterialOther: source.closureMaterialOther || "",
  repairType: source.repairType || "",
  meshType: cloneStringArray(source.meshType),
  meshPlacementOther: source.meshPlacementOther || "",
  meshMaterial: cloneStringArray(source.meshMaterial),
  meshMaterialOther: source.meshMaterialOther || "",
  meshLength: source.meshLength || "",
  meshWidth: source.meshWidth || "",
  fixation: cloneStringArray(source.fixation),
  fixationOther: source.fixationOther || "",
  intraOperativeDifficulty: cloneStringArray(source.intraOperativeDifficulty),
  intraOperativeDifficultyOther: source.intraOperativeDifficultyOther || "",
  primaryRepair: cloneStringArray(source.primaryRepair),
  primaryRepairOther: source.primaryRepairOther || "",
  complications: cloneStringArray(source.complications),
  complicationOther: source.complicationOther || "",
  haemostasis: source.haemostasis || "",
  drain: source.drain || "",
  drainDetails: source.drainDetails || "",
  drainType: cloneStringArray(source.drainType),
  drainTypeOther: source.drainTypeOther || "",
  intraPeritonealPlacement: cloneStringArray(source.intraPeritonealPlacement),
  intraPeritonealPlacementOther: source.intraPeritonealPlacementOther || "",
  drainExitSite: cloneStringArray(source.drainExitSite),
  drainExitSiteOther: source.drainExitSiteOther || "",
  fascialClosure: cloneStringArray(source.fascialClosure),
  fascialClosureOther: source.fascialClosureOther || "",
  fascialClosureMaterial: cloneStringArray(source.fascialClosureMaterial),
  fascialClosureMaterialOther: source.fascialClosureMaterialOther || "",
  skinClosure: cloneStringArray(source.skinClosure),
  skinClosureOther: source.skinClosureOther || "",
  skinClosureMaterial: cloneStringArray(source.skinClosureMaterial),
  skinClosureMaterialOther: source.skinClosureMaterialOther || "",
  specimenSent: cloneStringArray(source.specimenSent),
  specimenOther: source.specimenOther || "",
  laboratoryName: source.laboratoryName || "",
  otherSpecimens: source.otherSpecimens || "",
  additionalNotes: source.additionalNotes || "",
  postOperativeManagement: source.postOperativeManagement || "",
});

const createInitialVentralHerniaClosureState = (source: any = {}) => ({
  surgeonSignature: source.surgeonSignature || "",
  surgeonSignatureText: source.surgeonSignatureText || "",
  dateTime: source.dateTime || "",
});

const createInitialVentralHerniaProcedureFindingsState = (source: any = {}) => ({
  findings: source.findings || "",
  additionalNotes: source.additionalNotes || "",
});

const createInitialVentralHerniaState = (source: any = {}) => ({
  patientInfo: createInitialPatientInfoState(source.patientInfo),
  preoperative: createInitialVentralHerniaPreoperativeState(source.preoperative),
  operative: createInitialVentralHerniaOperativeState(source.operative),
  procedure: createInitialVentralHerniaProcedureState(source.procedure),
  closure: createInitialVentralHerniaClosureState(source.closure),
  procedureFindings: createInitialVentralHerniaProcedureFindingsState(
    source.procedureFindings,
  ),
});

const normalizeReportPatientInfos = (report: any) => ({
  ...report,
  patientInfo: createInitialPatientInfoState(report?.patientInfo),
  gastroscopy: report?.gastroscopy
    ? {
        ...report.gastroscopy,
        patientInfo: createInitialPatientInfoState(report.gastroscopy?.patientInfo),
      }
    : report?.gastroscopy,
  colonoscopy: report?.colonoscopy
    ? {
        ...report.colonoscopy,
        patientInfo: createInitialPatientInfoState(report.colonoscopy?.patientInfo),
      }
    : report?.colonoscopy,
  appendectomy: report?.appendectomy
    ? {
        ...report.appendectomy,
        patientInfo: createInitialPatientInfoState(report.appendectomy?.patientInfo),
      }
    : report?.appendectomy,
  ventralHernia: report?.ventralHernia
    ? createInitialVentralHerniaState(report.ventralHernia)
    : report?.ventralHernia,
  rectalCancer: report?.rectalCancer
    ? {
        ...report.rectalCancer,
        patientInfo: createInitialPatientInfoState(report.rectalCancer?.patientInfo),
      }
    : report?.rectalCancer,
  smallBowel: report?.smallBowel
    ? {
        ...report.smallBowel,
        patientInfo: createInitialPatientInfoState(report.smallBowel?.patientInfo),
      }
    : report?.smallBowel,
  cholecystectomy: report?.cholecystectomy
    ? {
        ...report.cholecystectomy,
        patientInfo: createInitialPatientInfoState(report.cholecystectomy?.patientInfo),
      }
    : report?.cholecystectomy,
  periAnal: report?.periAnal
    ? {
        ...report.periAnal,
        patientInfo: createInitialPatientInfoState(report.periAnal?.patientInfo),
      }
    : report?.periAnal,
  inguinalHernia: report?.inguinalHernia
    ? {
        ...report.inguinalHernia,
        patientInfo: createInitialPatientInfoState(report.inguinalHernia?.patientInfo),
      }
    : report?.inguinalHernia,
  transanalMinimallyInvasiveSurgery: report?.transanalMinimallyInvasiveSurgery
    ? {
        ...report.transanalMinimallyInvasiveSurgery,
        patientInfo: createInitialPatientInfoState(
          report.transanalMinimallyInvasiveSurgery?.patientInfo,
        ),
      }
    : report?.transanalMinimallyInvasiveSurgery,
  openGeneralSurgery: report?.openGeneralSurgery
    ? {
        ...report.openGeneralSurgery,
        patientInfo: createInitialPatientInfoState(report.openGeneralSurgery?.patientInfo),
      }
    : report?.openGeneralSurgery,
  openAbdominalSurgery: report?.openAbdominalSurgery
    ? {
        ...report.openAbdominalSurgery,
        patientInfo: createInitialPatientInfoState(report.openAbdominalSurgery?.patientInfo),
      }
    : report?.openAbdominalSurgery,
});

const DIAGRAM_MARKINGS_RESET_MIGRATION_KEY = "diagram_markings_reset_v1";

const clearStoredProcedureDiagramFindings = (procedureFindings: any = {}) => ({
  ...procedureFindings,
  findings: "",
});

const sanitizeStoredDiagramData = (report: any) => ({
  ...report,
  gastroscopyFindings: report?.gastroscopyFindings
    ? {
        ...report.gastroscopyFindings,
        findings: [],
      }
    : report?.gastroscopyFindings,
  colonoscopyFindings: report?.colonoscopyFindings
    ? {
        ...report.colonoscopyFindings,
        findings: [],
      }
    : report?.colonoscopyFindings,
  gastroscopyCanvasData: "",
  colonoscopyCanvasData: "",
  gastroscopy: report?.gastroscopy
    ? {
        ...report.gastroscopy,
        diagram: {
          ...(report.gastroscopy?.diagram || {}),
          findings: [],
          canvasImageData: "",
        },
      }
    : report?.gastroscopy,
  colonoscopy: report?.colonoscopy
    ? {
        ...report.colonoscopy,
        diagram: {
          ...(report.colonoscopy?.diagram || {}),
          findings: [],
          canvasImageData: "",
        },
      }
    : report?.colonoscopy,
  appendectomy: report?.appendectomy
    ? {
        ...report.appendectomy,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.appendectomy?.procedureFindings,
        ),
      }
    : report?.appendectomy,
  ventralHernia: report?.ventralHernia
    ? {
        ...report.ventralHernia,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.ventralHernia?.procedureFindings,
        ),
      }
    : report?.ventralHernia,
  rectalCancer: report?.rectalCancer
    ? {
        ...report.rectalCancer,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.rectalCancer?.procedureFindings,
        ),
      }
    : report?.rectalCancer,
  smallBowel: report?.smallBowel
    ? {
        ...report.smallBowel,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.smallBowel?.procedureFindings,
        ),
      }
    : report?.smallBowel,
  cholecystectomy: report?.cholecystectomy
    ? {
        ...report.cholecystectomy,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.cholecystectomy?.procedureFindings,
        ),
      }
    : report?.cholecystectomy,
  periAnal: report?.periAnal
    ? {
        ...report.periAnal,
        procedureFindings: {
          ...report.periAnal?.procedureFindings,
          findings: "",
          activeDiagramVariant: DEFAULT_PERI_ANAL_DIAGRAM_VARIANT,
          diagramMarkingsByVariant: createInitialPeriAnalDiagramMarkings(),
        },
      }
    : report?.periAnal,
  inguinalHernia: report?.inguinalHernia
    ? {
        ...report.inguinalHernia,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.inguinalHernia?.procedureFindings,
        ),
      }
    : report?.inguinalHernia,
  transanalMinimallyInvasiveSurgery: report?.transanalMinimallyInvasiveSurgery
    ? {
        ...report.transanalMinimallyInvasiveSurgery,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.transanalMinimallyInvasiveSurgery?.procedureFindings,
        ),
      }
    : report?.transanalMinimallyInvasiveSurgery,
  openGeneralSurgery: report?.openGeneralSurgery
    ? {
        ...report.openGeneralSurgery,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.openGeneralSurgery?.procedureFindings,
        ),
      }
    : report?.openGeneralSurgery,
  openAbdominalSurgery: report?.openAbdominalSurgery
    ? {
        ...report.openAbdominalSurgery,
        procedureFindings: clearStoredProcedureDiagramFindings(
          report.openAbdominalSurgery?.procedureFindings,
        ),
      }
    : report?.openAbdominalSurgery,
});

const getCurrentExtractedPatientInfoFromReport = (report: any) => {
  const candidates = [
    report?.patientInfo,
    report?.gastroscopy?.patientInfo,
    report?.colonoscopy?.patientInfo,
    report?.appendectomy?.patientInfo,
    report?.ventralHernia?.patientInfo,
    report?.rectalCancer?.patientInfo,
    report?.smallBowel?.patientInfo,
    report?.cholecystectomy?.patientInfo,
    report?.periAnal?.patientInfo,
    report?.inguinalHernia?.patientInfo,
    report?.transanalMinimallyInvasiveSurgery?.patientInfo,
    report?.openGeneralSurgery?.patientInfo,
    report?.openAbdominalSurgery?.patientInfo,
  ];

  const match = candidates.find((candidate) => hasExtractedPatientStickerData(candidate));
  return createInitialPatientInfoState(match);
};

const sanitizeLiveTemplateDraftValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLiveTemplateDraftValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sanitizeLiveTemplateDraftValue(nestedValue),
      ]),
    );
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith("data:") && trimmedValue.length > 2000) {
      return "";
    }
  }

  return value;
};

const WORKING_SESSION_STORAGE_KEY = "working_session_state_v1";
const VALID_APP_SECTIONS = new Set(["templates", "patients", "reports"]);
const VALID_TEMPLATE_TABS = new Set([
  "procedure",
  "gastroscopy",
  "colonoscopy",
  "appendectomy",
  "hernia",
  "rectal",
  "smallBowel",
  "cholecystectomy",
  "periAnal",
  "inguinalHernia",
  "transanalMinimallyInvasiveSurgery",
  "openGeneralSurgery",
  "openAbdominalSurgery",
]);

interface WorkingSessionState {
  appSection?: "templates" | "patients" | "reports";
  currentTab?: string;
  forcedPatientsProcedureFilter?: string | null;
  updatedAtIso?: string;
  editingPatientContext?: {
    patientId: string;
    recordId: string;
  } | null;
  currentExtractedPatientInfo?: Record<string, any> | null;
}

const sanitizeWorkingSessionState = (value: any): WorkingSessionState | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const nextState: WorkingSessionState = {};

  if (typeof value.appSection === "string" && VALID_APP_SECTIONS.has(value.appSection)) {
    nextState.appSection = value.appSection;
  }

  if (typeof value.currentTab === "string" && VALID_TEMPLATE_TABS.has(value.currentTab)) {
    nextState.currentTab = value.currentTab;
  }

  if (typeof value.forcedPatientsProcedureFilter === "string") {
    nextState.forcedPatientsProcedureFilter = value.forcedPatientsProcedureFilter;
  } else if (value.forcedPatientsProcedureFilter === null) {
    nextState.forcedPatientsProcedureFilter = null;
  }

  if (typeof value.updatedAtIso === "string") {
    nextState.updatedAtIso = value.updatedAtIso;
  }

  if (
    value.editingPatientContext &&
    typeof value.editingPatientContext === "object" &&
    typeof value.editingPatientContext.patientId === "string" &&
    typeof value.editingPatientContext.recordId === "string"
  ) {
    nextState.editingPatientContext = {
      patientId: value.editingPatientContext.patientId,
      recordId: value.editingPatientContext.recordId,
    };
  } else if (value.editingPatientContext === null) {
    nextState.editingPatientContext = null;
  }

  if (
    value.currentExtractedPatientInfo &&
    typeof value.currentExtractedPatientInfo === "object"
  ) {
    nextState.currentExtractedPatientInfo = createInitialPatientInfoState(
      value.currentExtractedPatientInfo,
    );
  }

  return nextState;
};

const Index = () => {
  
  
  const [currentReport, setCurrentReport] = useState({
    patientInfo: createInitialPatientInfoState() as any,
    gastroscopyFindings: { findings: [] } as any,
    colonoscopyFindings: { findings: [] } as any,
    media: [] as any[],
    notes: "",
    selectedProcedures: [] as string[],
    gastroscopyCanvasData: '',
    colonoscopyCanvasData: '',
    procedureFindings: {
      findings: '',
      additionalNotes: ''
    },
    specimen: {
      sentForPathology: '',
      laboratoryName: '',
      otherSpecimensTaken: '',
      otherSpecimensDetails: ''
    },
    conclusion: '',
    followUp: {
      enabled: false,
      options: [] as string[],
      other: '',
      notes: '',
      postOperativeManagement: ''
    },
    signature: {
      surgeonSignature: '',
      surgeonSignatureText: '',
      dateTime: ''
    },
    gastroscopy: createInitialGastroscopyState(),
    colonoscopy: createInitialColonoscopyState(),
    appendectomy: {
      patientInfo: createInitialPatientInfoState(),
      preoperative: {
        surgeons: [''],
        assistants: [''],
        anaesthetists: [''],
        duration: '',
        startTime: '',
        endTime: '',
        indication: [],
        indicationOther: '',
        imaging: [],
        imagingOther: ''
      },
      intraoperative: {
        appendixAppearance: [],
        abscess: '',
        peritonitis: [],
        otherFindings: ''
      },
      procedure: {
        approach: [],
        reasonForConversion: '',
        operationDescription: '',
        incisionType: [],
        incisionOther: '',
        trocarPlacement: '',
        divisionMethod: [],
        divisionOther: '',
        mesenteryControl: [],
        mesenteryOther: '',
        lavage: '',
        drainPlacement: '',
        drainLocation: ''
      },
      closure: {
        fascialClosure: '',
        skinClosure: [],
        skinOther: '',
        complications: '',
        complicationDetails: '',
        pathology: '',
        otherSpecimens: '',
        specimenDetails: '',
        surgeonSignature: '',
        dateTime: ''
      },
      // Store appendicectomy-specific diagram findings
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    },
    ventralHernia: createInitialVentralHerniaState(),
	    rectalCancer: {
      patientInfo: createInitialPatientInfoState(),
      surgicalTeam: {
        surgeons: [''],
        assistants: [''],
        anaesthetist: ''
      },
      procedureDetails: {
        duration: '',
        procedureUrgency: ''
      },
      operationType: {
        type: [], // 'Colon' or 'Rectum'
        operationFindings: '',
        operationFindingsOptions: [],
        operationFindingsOther: '',
        rectumOperationType: [],
        rectumOperationOther: '',
        neoadjuvantTreatment: '',
        radiationDetails: '',
        chemotherapyRegimen: ''
      },
      findings: {
        description: '',
        tClassification: '',
        nClassification: '',
        mClassification: '',
        location: [], // 'High', 'Middle', 'Low'
        mesorectalCompleteness: '',
        completenessOfTumourResection: ''
      },
      surgicalApproach: {
        primaryApproach: [] as string[],
        conversionReason: [],
        conversionReasonOther: ''
      },
      mobilizationAndResection: {
        extentOfMobilization: [],
        extentOfMobilizationOther: '',
        vesselLigation: [],
        vesselLigationOther: '',
        imvLigation: '',
        hemostasisTechnique: [],
        hemostasisTechniqueOther: '',
        lymphNodeDissection: '',
        lymphNodeDissectionOther: '',
        proximalTransection: '',
        distalTransection: '',
        analCanalTransection: [],
        analCanalTransectionOther: '',
        enBlocResection: [],
        enBlocResectionOther: ''
      },
      reconstruction: {
        reconstructionType: '',
        reconstructionOther: '',
        anastomosisDetails: {
          site: '',
          configuration: '',
          configurationOther: '',
          technique: '',
          sutureMaterial: [],
          sutureMaterialOther: '',
          linearStaplerSize: [],
          linearStaplerSizeOther: '',
          circularStaplerSize: [],
          circularStaplerSizeOther: '',
          anastomoticHeight: '',
          doughnutAssessment: '',
          airLeakTest: ''
        },
        anastomoticTesting: {
          icgTest: ''
        },
        stomaDetails: {
          configuration: '',
          configurationOther: '',
          reasonForStoma: [],
          reasonForStomaOther: ''
        }
      },
      operativeEvents: {
        pointsOfDifficulty: [],
        pointsOfDifficultyOther: '',
        intraoperativeEvents: [],
        intraoperativeEventsOther: '',
        specimenExtraction: '',
        specimenExtractionOther: '',
        woundProtector: '',
        drainInsertion: '',
        drainType: [],
        drainTypeOther: '',
        intraPeritonealPlacement: [],
        intraPeritonealPlacementOther: '',
        drainExitSite: [],
        drainExitSiteOther: ''
      },
      closure: {
        fascialClosure: [],
        fascialSutureMaterial: [],
        fascialSutureMaterialOther: '',
        skinClosure: [],
        skinClosureMaterial: [],
        skinClosureMaterialOther: ''
      },
      additionalInfo: {
        additionalInformation: '',
        postOperativeManagement: '',
        doctorSignature: '',
        dateTime: ''
      },
      // Legacy fields for backward compatibility
      section1: {
        operationType: [],
        rectumOperationType: [],
        rectumOperationOther: '',
        procedureUrgency: '',
        neoadjuvantTreatment: '',
        surgeons: [''],
        assistant1: '',
        assistant2: '',
        anaesthetists: [''],
        duration: '',
        asaScore: '',
        emergencyOperation: '',
        preoperativeChemoRadio: '',
        previousAbdominalSurgery: '',
        indication: '',
        indicationOther: '',
        tClassification: '',
        nClassification: '',
        mClassification: '',
        tumorDistance: '',
        tumorHeight: ''
      },
      section2: {
        approach: [],
        approachOther: '',
        conversionReason: [],
        conversionOther: '',
        complications: [],
        complicationDetails: ''
      },
      section3: {
        vesselLigation: [],
        nervePreservation: [],
        resectionType: [],
        resectionOther: '',
        proximalMargin: '',
        distalMargin: '',
        tmeQuality: '',
        lymphNodeDissection: ''
      },
      section4: {
        reconstructionType: '',
        anastomosisType: [],
        anastomosisTechnique: [],
        leakTestPerformed: '',
        leakTestResult: '',
        protectiveStoma: '',
        stomaType: [],
        stomaReason: [],
        stomaReasonOther: ''
      },
	      section5: {
	        operativeTime: '',
	        bloodLoss: '',
	        transfusionRequired: '',
	        additionalProcedures: [],
	        additionalProceduresOther: '',
	        fascialClosure: [],
	        sutureMaterial: '',
	        surgeonSignature: '',
	        date: ''
	      }
	    },
	      smallBowel: createInitialSmallBowelSurgeryState(),
	      cholecystectomy: createInitialCholecystectomyState(),
	      periAnal: createInitialPeriAnalState(),
        inguinalHernia: createInitialInguinalHerniaState(),
        transanalMinimallyInvasiveSurgery: createInitialTransanalMinimallyInvasiveSurgeryState(),
        openGeneralSurgery: createInitialNarrativeSurgeryState("general"),
        openAbdominalSurgery: createInitialNarrativeSurgeryState("abdominal"),
		  });
  const [currentExtractedPatientInfo, setCurrentExtractedPatientInfo] = useState(
    createInitialPatientInfoState(),
  );
  const extractedPatientSyncSignatureRef = useRef("");
  const extractedPatientSyncTimeoutRef = useRef<number | null>(null);
  const dismissedExtractedPatientSignatureRef = useRef("");
  const hasHydratedExtractedPatientFromReportRef = useRef(false);
  const hasHydratedWorkingSessionRef = useRef(false);
  const workingSessionUpdatedAtRef = useRef("");
  const liveTemplateDraftSignatureRef = useRef("");
  const applyingLiveTemplateDraftRef = useRef(false);
  const hasPendingLocalLiveTemplateChangesRef = useRef(false);
  const latestLocalLiveTemplateEditAtRef = useRef("");
  const liveTemplateDraftSessionId = useMemo(() => getLiveTemplateDraftSessionId(), []);
  const lastLiveTemplateDraftAuthorSessionIdRef = useRef(liveTemplateDraftSessionId);
  const patientListAutosaveSignatureRef = useRef("");
  const pendingPatientAutosaveContextRef = useRef<{
    patientId: string;
    recordId: string;
  } | null>(null);

	  // Helper function to calculate duration between start and end times
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '';
    
    try {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
      
      let diffMs = end.getTime() - start.getTime();
      
      // Handle case where end time is next day (past midnight)
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
      }
      
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return diffMinutes.toString();
    } catch (error) {
      return '';
    }
  };

  // Appendectomy specific state
  const [activeSection, setActiveSection] = useState("section1");
  const [expanded, setExpanded] = useState({
    section1: true,
    section2: true,
    section3: false,
    section4: false,
    section5: false
  });

  // Appendectomy history management for undo/redo
  const [appendectomyHistory, setAppendectomyHistory] = useState({
    patientInfo: [createInitialPatientInfoState(currentReport.appendectomy?.patientInfo)],
    preoperative: [currentReport.appendectomy?.preoperative || {
      surgeons: [''], assistants: [''], anaesthetists: [''], duration: '', startTime: '', endTime: '', indication: [], indicationOther: '', imaging: [], imagingOther: ''
    }],
    intraoperative: [currentReport.appendectomy?.intraoperative || {
      appendixAppearance: [], abscess: '', peritonitis: [], otherFindings: ''
    }],
    procedure: [currentReport.appendectomy?.procedure || {
      approach: [], reasonForConversion: '', operationDescription: '', incisionType: [], incisionOther: '', trocarPlacement: '', divisionMethod: [], divisionOther: '', mesenteryControl: [], mesenteryOther: '', lavage: '', drainPlacement: '', drainLocation: ''
    }],
    closure: [currentReport.appendectomy?.closure || {
      fascialClosure: '', fascialClosureOther: '', fascialMaterial: [], fascialMaterialOther: '', skinClosure: [], skinOther: '', skinMaterial: [], skinMaterialOther: '', operativeDifficulty: [], operativeDifficultyOther: '', complications: '', complicationDetails: '', visceralInjuryDetail: '', complicationOther: '', pathology: '', laboratoryName: '', otherSpecimens: '', specimenDetails: '', additionalNotes: '', postOperativeManagement: '', surgeonSignature: '', surgeonSignatureText: '', dateTime: ''
    }],
    procedureFindings: [currentReport.appendectomy?.procedureFindings || {
      findings: '', additionalNotes: ''
    }]
  });
  const [appendectomyHistoryIndex, setAppendectomyHistoryIndex] = useState({
    patientInfo: 0,
    preoperative: 0,
    intraoperative: 0,
    procedure: 0,
    closure: 0,
    procedureFindings: 0
  });

  // Ventral Hernia history management for undo/redo
  const initialVentralHerniaState = createInitialVentralHerniaState(currentReport.ventralHernia);
  const [ventralHerniaHistory, setVentralHerniaHistory] = useState({
    patientInfo: [initialVentralHerniaState.patientInfo],
    preoperative: [initialVentralHerniaState.preoperative],
    operative: [initialVentralHerniaState.operative],
    procedure: [initialVentralHerniaState.procedure],
    procedureFindings: [initialVentralHerniaState.procedureFindings]
  });
  const [ventralHerniaHistoryIndex, setVentralHerniaHistoryIndex] = useState({
    patientInfo: 0,
    preoperative: 0,
    operative: 0,
    procedure: 0,
    procedureFindings: 0
  });

  // Ventral Hernia specific state
  const [herniaActiveSection, setHerniaActiveSection] = useState("section1");
  const [herniaExpanded, setHerniaExpanded] = useState({
    section1: true,
    section2: true,
    section3: false,
    section4: false,
    section5: false
  });
  
  // Ventral Hernia repair type states
  const [herniaPrimaryClosure, setHerniaPrimaryClosure] = useState(false);
  const [herniaMeshRepair, setHerniaMeshRepair] = useState(false);

  // Endoscopy history management for undo/redo
  const [endoscopyHistory, setEndoscopyHistory] = useState({
    patientInfo: [createInitialPatientInfoState(currentReport.patientInfo)],
    procedureInfo: [{ 
      selectedProcedures: currentReport.selectedProcedures || [],
      procedure: currentReport.procedure || {},
      gastroscopyCanvasData: currentReport.gastroscopyCanvasData || '',
      colonoscopyCanvasData: currentReport.colonoscopyCanvasData || ''
    }],
    procedureTypes: [{ 
      gastroscopyFindings: currentReport.gastroscopyFindings || { findings: [] },
      colonoscopyFindings: currentReport.colonoscopyFindings || { findings: [] },
      procedureFindings: currentReport.procedureFindings || { findings: '', additionalNotes: '' }
    }],
    specimen: [currentReport.specimen || {
      sentForPathology: '', laboratoryName: '', otherSpecimensTaken: '', otherSpecimensDetails: ''
    }]
  });
  const [endoscopyHistoryIndex, setEndoscopyHistoryIndex] = useState({
    patientInfo: 0,
    procedureInfo: 0,
    procedureTypes: 0,
    specimen: 0
  });

  // Rectal Cancer history management for undo/redo
  const [rectalCancerHistory, setRectalCancerHistory] = useState({
    patientInfo: [createInitialPatientInfoState(currentReport.rectalCancer?.patientInfo)],
    operationType: [currentReport.rectalCancer?.operationType || {
      type: [], typeOther: '', neoadjuvantTreatment: '', neoadjuvantDetails: ''
    }],
    surgicalApproach: [currentReport.rectalCancer?.surgicalApproach || {
      primaryApproach: [], conversionReason: [], conversionReasonOther: '', trocarNumber: ''
    }],
    mobilizationAndResection: [currentReport.rectalCancer?.mobilizationAndResection || {
      extentOfMobilization: [],
      extentOfMobilizationOther: '',
      vesselLigation: [],
      vesselLigationOther: '',
      imvLigation: '',
      hemostasisTechnique: [],
      hemostasisTechniqueOther: '',
      lymphNodeDissection: '',
      lymphNodeDissectionOther: '',
      proximalTransection: [],
      proximalTransectionOther: '',
      distalTransection: [],
      distalTransectionOther: '',
      analCanalTransection: [],
      analCanalTransectionOther: '',
      enBlocResection: [],
      enBlocResectionOther: '',
      mobilization: [],
      mobilizationOther: '',
      mesorectalExcision: [],
      mesorectalExcisionOther: '',
      distanceFromAnalVerge: ''
    }],
    reconstruction: [currentReport.rectalCancer?.reconstruction || {
      reconstructionType: [], anastomosisDetails: {}, stomaDetails: {}, reconstructionOther: ''
    }],
    operativeEvents: [currentReport.rectalCancer?.operativeEvents || {
      intraoperativeComplications: [], intraoperativeComplicationsOther: '', drainInsertion: '', drainDetails: '', specimenExtraction: '', extractionSite: '', additionalProcedures: []
    }],
    closure: [currentReport.rectalCancer?.closure || {
      fascialClosure: [], fascialClosureOther: '', fascialClosureMaterial: [], fascialClosureMaterialOther: '', skinClosure: [], skinClosureOther: '', skinClosureMaterial: [], skinClosureMaterialOther: ''
    }],
    procedureDetails: [currentReport.rectalCancer?.procedureDetails || {
      surgeons: [''], assistants: [''], anaesthetists: [''], duration: '', startTime: '', endTime: '', additionalNotes: '', postOperativeManagement: ''
    }],
    procedureFindings: [currentReport.rectalCancer?.procedureFindings || {
      findings: '', additionalNotes: ''
    }]
  });
  const [rectalCancerHistoryIndex, setRectalCancerHistoryIndex] = useState({
    patientInfo: 0,
    operationType: 0,
    surgicalApproach: 0,
    mobilizationAndResection: 0,
    reconstruction: 0,
    operativeEvents: 0,
    closure: 0,
    procedureDetails: 0,
    procedureFindings: 0
  });

  const [smallBowelHistory, setSmallBowelHistory] = useState({
    patientInfo: [createInitialPatientInfoState(currentReport.smallBowel?.patientInfo)],
    preoperative: [currentReport.smallBowel?.preoperative || createInitialSmallBowelSurgeryState().preoperative],
    operativeFindings: [currentReport.smallBowel?.operativeFindings || createInitialSmallBowelSurgeryState().operativeFindings],
    procedure: [currentReport.smallBowel?.procedure || createInitialSmallBowelSurgeryState().procedure],
    reconstruction: [currentReport.smallBowel?.reconstruction || createInitialSmallBowelSurgeryState().reconstruction],
    operativeEvents: [currentReport.smallBowel?.operativeEvents || createInitialSmallBowelSurgeryState().operativeEvents],
    closure: [currentReport.smallBowel?.closure || createInitialSmallBowelSurgeryState().closure],
    additionalInfo: [currentReport.smallBowel?.additionalInfo || createInitialSmallBowelSurgeryState().additionalInfo],
    procedureFindings: [currentReport.smallBowel?.procedureFindings || createInitialSmallBowelSurgeryState().procedureFindings]
  });
  const [smallBowelHistoryIndex, setSmallBowelHistoryIndex] = useState({
    patientInfo: 0,
    preoperative: 0,
    operativeFindings: 0,
    procedure: 0,
    reconstruction: 0,
    operativeEvents: 0,
    closure: 0,
    additionalInfo: 0,
    procedureFindings: 0
  });

  const [cholecystectomyHistory, setCholecystectomyHistory] = useState({
    patientInfo: [
      createInitialPatientInfoState(currentReport.cholecystectomy?.patientInfo),
    ],
    preoperative: [
      currentReport.cholecystectomy?.preoperative ||
        createInitialCholecystectomyState().preoperative,
    ],
    intraoperative: [
      currentReport.cholecystectomy?.intraoperative ||
        createInitialCholecystectomyState().intraoperative,
    ],
    procedure: [
      currentReport.cholecystectomy?.procedure ||
        createInitialCholecystectomyState().procedure,
    ],
    closure: [
      currentReport.cholecystectomy?.closure ||
        createInitialCholecystectomyState().closure,
    ],
    additionalInfo: [
      currentReport.cholecystectomy?.additionalInfo ||
        createInitialCholecystectomyState().additionalInfo,
    ],
    procedureFindings: [
      currentReport.cholecystectomy?.procedureFindings ||
        createInitialCholecystectomyState().procedureFindings,
    ],
  });
  const [cholecystectomyHistoryIndex, setCholecystectomyHistoryIndex] = useState({
    patientInfo: 0,
    preoperative: 0,
    intraoperative: 0,
    procedure: 0,
    closure: 0,
    additionalInfo: 0,
    procedureFindings: 0,
  });

  const [periAnalHistory, setPeriAnalHistory] = useState({
    patientInfo: [
      createInitialPatientInfoState(currentReport.periAnal?.patientInfo),
    ],
    preoperative: [
      currentReport.periAnal?.preoperative ||
        createInitialPeriAnalState().preoperative,
    ],
    findings: [
      currentReport.periAnal?.findings || createInitialPeriAnalState().findings,
    ],
    woundManagement: [
      currentReport.periAnal?.woundManagement ||
        createInitialPeriAnalState().woundManagement,
    ],
    complications: [
      currentReport.periAnal?.complications ||
        createInitialPeriAnalState().complications,
    ],
    postOperativePlan: [
      currentReport.periAnal?.postOperativePlan ||
        createInitialPeriAnalState().postOperativePlan,
    ],
    specimen: [
      currentReport.periAnal?.specimen || createInitialPeriAnalState().specimen,
    ],
    additionalInfo: [
      currentReport.periAnal?.additionalInfo ||
        createInitialPeriAnalState().additionalInfo,
    ],
    procedureFindings: [
      currentReport.periAnal?.procedureFindings ||
        createInitialPeriAnalState().procedureFindings,
    ],
  });
  const [periAnalHistoryIndex, setPeriAnalHistoryIndex] = useState({
    patientInfo: 0,
    preoperative: 0,
    findings: 0,
    woundManagement: 0,
    complications: 0,
    postOperativePlan: 0,
    specimen: 0,
    additionalInfo: 0,
    procedureFindings: 0,
  });

  // Rectal Cancer specific state
  const [rectalActiveSection, setRectalActiveSection] = useState("section1");
  const [rectalExpanded, setRectalExpanded] = useState({
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false
  });

  // Current tab state
  const [appSection, setAppSection] = useState<"templates" | "patients" | "reports">(
    "templates",
  );
  const [currentTab, setCurrentTab] = useState("procedure");
  const [patientDatabaseCache, setPatientDatabaseCache] = useState<PatientDatabaseCache>(
    loadPatientDatabaseCache(),
  );
  const [isPatientDatabaseLoading, setIsPatientDatabaseLoading] = useState(
    isFirebaseConfigured,
  );
  const [isPatientDatabaseSyncing, setIsPatientDatabaseSyncing] = useState(false);
  const [pendingPatientSyncCount, setPendingPatientSyncCount] = useState(
    loadPatientSyncQueue().length,
  );
  const [forcedPatientsProcedureFilter, setForcedPatientsProcedureFilter] = useState<string | null>(
    null,
  );
  const [editingPatientContext, setEditingPatientContext] = useState<{
    patientId: string;
    recordId: string;
  } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [diagramUpdateTrigger, setDiagramUpdateTrigger] = useState(0);
  const [isEditingConclusion, setIsEditingConclusion] = useState(false);
  const [isEditingFollowUp, setIsEditingFollowUp] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [tempConclusion, setTempConclusion] = useState('');
  const [isEditingProcedureFindings, setIsEditingProcedureFindings] = useState(false);
  const [tempFollowUp, setTempFollowUp] = useState({
    enabled: false,
    options: [] as string[],
    other: '',
    notes: ''
  });
  const [tempFollowUpOther, setTempFollowUpOther] = useState('');
  const [tempFollowUpNotes, setTempFollowUpNotes] = useState('');
  const reportPreviewRef = useRef<HTMLDivElement>(null);

  // Sync conclusion when updated from live report
  useEffect(() => {
    if (!isEditingConclusion && !tempConclusion) {
      setTempConclusion(currentReport.conclusion || '');
    }
  }, [currentReport.conclusion, isEditingConclusion, tempConclusion]);

  // Sync follow-up values when updated from live report
  useEffect(() => {
    if (!isEditingFollowUp && !tempFollowUpOther && !tempFollowUpNotes) {
      setTempFollowUpOther(currentReport.followUp?.other || '');
      setTempFollowUpNotes(currentReport.followUp?.notes || '');
    }
  }, [currentReport.followUp, isEditingFollowUp, tempFollowUpOther, tempFollowUpNotes]);

  useEffect(() => {
    if (hasHydratedExtractedPatientFromReportRef.current) {
      return;
    }

    if (hasExtractedPatientStickerData(currentExtractedPatientInfo)) {
      hasHydratedExtractedPatientFromReportRef.current = true;
      return;
    }

    const derivedPatient = getCurrentExtractedPatientInfoFromReport(currentReport);
    if (!hasExtractedPatientStickerData(derivedPatient)) {
      hasHydratedExtractedPatientFromReportRef.current = true;
      return;
    }

    const derivedSignature = getPatientStickerSyncSignature(derivedPatient);
    if (
      derivedSignature &&
      derivedSignature === dismissedExtractedPatientSignatureRef.current
    ) {
      hasHydratedExtractedPatientFromReportRef.current = true;
      return;
    }

    hasHydratedExtractedPatientFromReportRef.current = true;
    setCurrentExtractedPatientInfo(derivedPatient);
  }, [currentExtractedPatientInfo, currentReport]);

  useEffect(() => {
    const unsubscribe = subscribeToLatestExtractedPatientDraft((remotePatientInfo) => {
      if (!remotePatientInfo || !hasExtractedPatientStickerData(remotePatientInfo)) {
        setCurrentExtractedPatientInfo((previousPatientInfo) =>
          hasExtractedPatientStickerData(previousPatientInfo)
            ? createInitialPatientInfoState()
            : previousPatientInfo,
        );
        return;
      }

      const remoteSignature = getPatientStickerSyncSignature(remotePatientInfo);
      if (
        remoteSignature &&
        remoteSignature === dismissedExtractedPatientSignatureRef.current
      ) {
        return;
      }
      extractedPatientSyncSignatureRef.current = remoteSignature;

      setCurrentExtractedPatientInfo((previousPatientInfo) => {
        if (getPatientStickerSyncSignature(previousPatientInfo) === remoteSignature) {
          return previousPatientInfo;
        }

        const previousTimestamp = getPatientStickerSyncTimestamp(previousPatientInfo);
        const remoteTimestamp = getPatientStickerSyncTimestamp(remotePatientInfo);

        if (previousTimestamp > remoteTimestamp) {
          return previousPatientInfo;
        }

        return createInitialPatientInfoState(remotePatientInfo);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasExtractedPatientStickerData(currentExtractedPatientInfo)) {
      if (extractedPatientSyncSignatureRef.current) {
        const previousSignature = extractedPatientSyncSignatureRef.current;
        extractedPatientSyncSignatureRef.current = "";
        void clearLatestExtractedPatientDraft().catch((error) => {
          extractedPatientSyncSignatureRef.current = previousSignature;
          console.error("Failed to clear extracted patient draft", error);
        });
      }
      return;
    }

    const syncSnapshot = createPatientStickerSyncSnapshot(currentExtractedPatientInfo);
    const syncSignature = getPatientStickerSyncSignature(syncSnapshot);

    if (!syncSignature || syncSignature === extractedPatientSyncSignatureRef.current) {
      return;
    }

    if (extractedPatientSyncTimeoutRef.current) {
      window.clearTimeout(extractedPatientSyncTimeoutRef.current);
    }

    extractedPatientSyncTimeoutRef.current = window.setTimeout(() => {
      void saveLatestExtractedPatientDraft(syncSnapshot)
        .then(() => {
          extractedPatientSyncSignatureRef.current = syncSignature;
        })
        .catch((error) => {
          console.error("Failed to sync extracted patient draft", error);
        });
    }, 500);

    return () => {
      if (extractedPatientSyncTimeoutRef.current) {
        window.clearTimeout(extractedPatientSyncTimeoutRef.current);
        extractedPatientSyncTimeoutRef.current = null;
      }
    };
  }, [currentExtractedPatientInfo]);

  

  
  
  const gastroscopyDiagramRef = useRef<HTMLCanvasElement>(null);
  const colonoscopyDiagramRef = useRef<HTMLCanvasElement>(null);
  const gastroscopyContainerRef = useRef<HTMLDivElement>(null);
  const colonoscopyContainerRef = useRef<HTMLDivElement>(null);
  
  // State to track diagram component methods
  const [diagramMethods, setDiagramMethods] = useState<{
    gastroscopy: { removeFinding?: (id: string) => void; editFinding?: (id: string) => void; undoLastAction?: () => void; redoLastAction?: () => void; canRedo?: () => boolean } | null;
    colonoscopy: { removeFinding?: (id: string) => void; editFinding?: (id: string) => void; undoLastAction?: () => void; redoLastAction?: () => void; canRedo?: () => boolean } | null;
  }>({
    gastroscopy: null,
    colonoscopy: null
  });

  // History for Undo/Redo (endoscopy scope)
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const addToHistory = (state: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  const updateCurrentExtractedPatient = (patientInfo: any) => {
    setCurrentExtractedPatientInfo((previousPatientInfo) => {
      const nextPatientInfo = createInitialPatientInfoState(patientInfo);
      const previousHadExtractedData = hasExtractedPatientStickerData(previousPatientInfo);
      const nextHasExtractedData = hasExtractedPatientStickerData(nextPatientInfo);

      if (nextHasExtractedData) {
        dismissedExtractedPatientSignatureRef.current = "";
      } else if (previousHadExtractedData) {
        dismissedExtractedPatientSignatureRef.current =
          getPatientStickerSyncSignature(previousPatientInfo);
      }

      return nextPatientInfo;
    });
  };
  const clearCurrentExtractedPatient = () => {
    setCurrentExtractedPatientInfo(createInitialPatientInfoState());
  };
  const activeTemplateType = getTemplateTypeFromTab(currentTab);
  const activeTemplateLabel = getTemplateLabel(activeTemplateType);
  const activeTemplatePatientInfo = createInitialPatientInfoState(
    getTemplatePatientInfo(currentReport, activeTemplateType),
  );
  const isEditingSavedPatientRecord = Boolean(
    editingPatientContext &&
      patientDatabaseCache.records.some((record) => record.id === editingPatientContext.recordId),
  );
  const canCurrentSessionDrivePatientAutosave = () =>
    !isFirebaseConfigured ||
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    lastLiveTemplateDraftAuthorSessionIdRef.current === liveTemplateDraftSessionId;

  const resolveSilentPatientAutosaveTarget = (patientInfo: Record<string, any>) =>
    editingPatientContext ||
    pendingPatientAutosaveContextRef.current ||
    ({
      patientId:
        findMatchingPatientId(patientDatabaseCache.patients, patientInfo) ||
        createNewPatientId(),
      recordId: createNewPatientRecordId(),
    } as const);

  const buildWorkingSessionState = (
    updatedAtIso = workingSessionUpdatedAtRef.current || new Date().toISOString(),
  ): WorkingSessionState => ({
    appSection,
    currentTab,
    forcedPatientsProcedureFilter,
    updatedAtIso,
    editingPatientContext,
    currentExtractedPatientInfo: hasExtractedPatientStickerData(currentExtractedPatientInfo)
      ? createInitialPatientInfoState(currentExtractedPatientInfo)
      : null,
  });

  const buildLiveTemplateDraftPayload = () => ({
    ...buildWorkingSessionState(workingSessionUpdatedAtRef.current || new Date().toISOString()),
    currentReport: sanitizeLiveTemplateDraftValue(currentReport),
  });

  const hasRecentLocalLiveTemplateEdit = () => {
    if (!latestLocalLiveTemplateEditAtRef.current) {
      return false;
    }

    const lastEditAt = Date.parse(latestLocalLiveTemplateEditAtRef.current);
    if (Number.isNaN(lastEditAt)) {
      return false;
    }

    return Date.now() - lastEditAt < LIVE_TEMPLATE_LOCAL_EDIT_PROTECTION_MS;
  };

  const applyLiveTemplateDraftPayload = (payload: Record<string, any>) => {
    const restoredReport = normalizeReportPatientInfos(payload?.currentReport || currentReport);

    applyingLiveTemplateDraftRef.current = true;
    hasPendingLocalLiveTemplateChangesRef.current = false;

    setCurrentReport(restoredReport);
    setAppSection(
      payload?.appSection && VALID_APP_SECTIONS.has(payload.appSection)
        ? payload.appSection
        : "templates",
    );
    setCurrentTab(
      payload?.currentTab && VALID_TEMPLATE_TABS.has(payload.currentTab)
        ? payload.currentTab
        : "procedure",
    );
    setForcedPatientsProcedureFilter(payload?.forcedPatientsProcedureFilter ?? null);
    setEditingPatientContext(payload?.editingPatientContext ?? null);
    setCurrentExtractedPatientInfo(
      createInitialPatientInfoState(payload?.currentExtractedPatientInfo),
    );

    window.setTimeout(() => {
      applyingLiveTemplateDraftRef.current = false;
    }, 0);
  };

  const persistPatientCache = (nextCache: PatientDatabaseCache) => {
    setPatientDatabaseCache(nextCache);
    savePatientDatabaseCache(nextCache);
  };

  const syncPatientDatabase = async (showSuccessToast = false) => {
    if (!isFirebaseConfigured) {
      setPendingPatientSyncCount(loadPatientSyncQueue().length);
      return;
    }

    setIsPatientDatabaseSyncing(true);

    try {
      await processPatientSyncQueue();
      const remoteSnapshot = await fetchPatientDatabaseSnapshot();
      persistPatientCache(remoteSnapshot);
      setPendingPatientSyncCount(loadPatientSyncQueue().length);

      if (showSuccessToast) {
        toast.success("Patient database synced successfully.");
      }
    } catch (error) {
      console.error("Failed to sync patient database", error);
      setPendingPatientSyncCount(loadPatientSyncQueue().length);
    } finally {
      setIsPatientDatabaseSyncing(false);
    }
  };

  useEffect(() => {
    if (
      !isFirebaseConfigured ||
      isPatientDatabaseSyncing ||
      pendingPatientSyncCount === 0 ||
      (typeof navigator !== "undefined" && !navigator.onLine)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncPatientDatabase(false);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPatientDatabaseSyncing, pendingPatientSyncCount]);

  useEffect(() => {
    let isMounted = true;

    const hydratePatientDatabase = async () => {
      if (!isFirebaseConfigured) {
        setIsPatientDatabaseLoading(false);
        setPendingPatientSyncCount(loadPatientSyncQueue().length);
        return;
      }

      try {
        const remoteSnapshot = await fetchPatientDatabaseSnapshot();
        if (!isMounted) {
          return;
        }

        persistPatientCache(remoteSnapshot);
      } catch (error) {
        console.error("Failed to load remote patient database snapshot", error);
      } finally {
        if (isMounted) {
          setIsPatientDatabaseLoading(false);
          setPendingPatientSyncCount(loadPatientSyncQueue().length);
        }
      }
    };

    hydratePatientDatabase();

    const handleOnline = () => {
      setPendingPatientSyncCount(loadPatientSyncQueue().length);
      syncPatientDatabase();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentReport(normalizeReportPatientInfos(JSON.parse(JSON.stringify(history[historyIndex - 1]))));
      toast.success('Undone');
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentReport(normalizeReportPatientInfos(JSON.parse(JSON.stringify(history[historyIndex + 1]))));
      toast.success('Redone');
    }
  };
  // Section-specific undo/redo functions for endoscopy
  const undoEndoscopy = (section: string) => {
    const currentIndex = endoscopyHistoryIndex[section as keyof typeof endoscopyHistoryIndex];
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = endoscopyHistory[section as keyof typeof endoscopyHistory][newIndex];
      
      // Update current report based on section
      setCurrentReport(prev => {
        const updated = { ...prev };
        
        if (section === 'patientInfo') {
          updated.patientInfo = createInitialPatientInfoState(JSON.parse(JSON.stringify(previousState)));
        } else if (section === 'procedureInfo') {
          updated.selectedProcedures = previousState.selectedProcedures || [];
          updated.procedure = previousState.procedure || {};
          updated.gastroscopyCanvasData = previousState.gastroscopyCanvasData || '';
          updated.colonoscopyCanvasData = previousState.colonoscopyCanvasData || '';
        } else if (section === 'procedureTypes') {
          updated.gastroscopyFindings = previousState.gastroscopyFindings || { findings: [] };
          updated.colonoscopyFindings = previousState.colonoscopyFindings || { findings: [] };
          updated.procedureFindings = previousState.procedureFindings || { findings: '', additionalNotes: '' }
        } else if (section === 'specimen') {
          updated.specimen = JSON.parse(JSON.stringify(previousState));
        }
        
        return updated;
      });
      
      setEndoscopyHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} undone`);
    }
  };

  const redoEndoscopy = (section: string) => {
    const currentIndex = endoscopyHistoryIndex[section as keyof typeof endoscopyHistoryIndex];
    const maxIndex = (endoscopyHistory[section as keyof typeof endoscopyHistory] || []).length - 1;
    
    if (currentIndex < maxIndex) {
      const newIndex = currentIndex + 1;
      const nextState = endoscopyHistory[section as keyof typeof endoscopyHistory][newIndex];
      
      // Update current report based on section
      setCurrentReport(prev => {
        const updated = { ...prev };
        
        if (section === 'patientInfo') {
          updated.patientInfo = createInitialPatientInfoState(JSON.parse(JSON.stringify(nextState)));
        } else if (section === 'procedureInfo') {
          updated.selectedProcedures = nextState.selectedProcedures || [];
          updated.procedure = nextState.procedure || {};
          updated.gastroscopyCanvasData = nextState.gastroscopyCanvasData || '';
          updated.colonoscopyCanvasData = nextState.colonoscopyCanvasData || '';
        } else if (section === 'procedureTypes') {
          updated.gastroscopyFindings = nextState.gastroscopyFindings || { findings: [] };
          updated.colonoscopyFindings = nextState.colonoscopyFindings || { findings: [] };
          updated.procedureFindings = nextState.procedureFindings || { findings: '', additionalNotes: '' }
        } else if (section === 'specimen') {
          updated.specimen = JSON.parse(JSON.stringify(nextState));
        }
        
        return updated;
      });
      
      setEndoscopyHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} redone`);
    }
  };

  const clearEndoscopy = (section: string) => {
    let initialState: any = {};
    
    if (section === 'patientInfo') {
      initialState = createInitialPatientInfoState();
    } else if (section === 'procedureInfo') {
      initialState = {
        selectedProcedures: [],
        procedure: {},
        gastroscopyCanvasData: '',
        colonoscopyCanvasData: ''
      };
    } else if (section === 'procedureTypes') {
      initialState = {
        gastroscopyFindings: { findings: [] },
        colonoscopyFindings: { findings: [] },
        procedureFindings: { findings: '', additionalNotes: '' }
      };
    } else if (section === 'specimen') {
      initialState = {
        sentForPathology: '',
        laboratoryName: '',
        otherSpecimensTaken: '',
        otherSpecimensDetails: ''
      };
    }

    // Update current report
    setCurrentReport(prev => {
      const updated = { ...prev };
      
      if (section === 'patientInfo') {
        updated.patientInfo = initialState;
      } else if (section === 'procedureInfo') {
        updated.selectedProcedures = initialState.selectedProcedures;
        updated.procedure = initialState.procedure;
        updated.gastroscopyCanvasData = initialState.gastroscopyCanvasData;
        updated.colonoscopyCanvasData = initialState.colonoscopyCanvasData;
      } else if (section === 'procedureTypes') {
        updated.gastroscopyFindings = initialState.gastroscopyFindings;
        updated.colonoscopyFindings = initialState.colonoscopyFindings;
        updated.procedureFindings = initialState.procedureFindings;
      } else if (section === 'specimen') {
        updated.specimen = initialState;
      }
      
      return updated;
    });

    // Add cleared state to history
    setEndoscopyHistory(prevHistory => ({
      ...prevHistory,
      [section]: [...(prevHistory[section as keyof typeof prevHistory] || []), initialState]
    }));

    setEndoscopyHistoryIndex(prev => ({
      ...prev,
      [section]: (endoscopyHistory[section as keyof typeof endoscopyHistory] || []).length
    }));

    toast.success(`${section} section cleared`);
  };

  // Clear specific endoscopy section (enhanced to manage section history)
  const clearEndoscopySection = (section: string) => {
    let initialState;
    
    switch (section) {
      case 'patientInfo':
        initialState = createInitialPatientInfoState();
        break;
      case 'procedureInfo':
        initialState = {};
        break;
      case 'gastroscopyFindings':
        initialState = { findings: [] };
        setCurrentReport(prev => ({ ...prev, gastroscopyCanvasData: '' }));
        break;
      case 'colonoscopyFindings':
        initialState = { findings: [] };
        setCurrentReport(prev => ({ ...prev, colonoscopyCanvasData: '' }));
        break;
      case 'specimen':
        initialState = {
          sentForPathology: '',
          laboratoryName: '',
          otherSpecimensTaken: '',
          otherSpecimensDetails: ''
        };
        break;
      case 'conclusion':
        initialState = '';
        break;
      case 'followUp':
        initialState = {
          enabled: false,
          options: [],
          other: '',
          notes: '',
          postOperativeManagement: ''
        };
        break;
      case 'signature':
        initialState = {
          surgeonSignature: '',
          surgeonSignatureText: '',
          dateTime: ''
        };
        break;
      default:
        return;
    }
    
    setCurrentReport(prev => ({
      ...prev,
      [section]: initialState
    }));
    
    // Reset section history
    setEndoscopyHistory(prev => ({
      ...prev,
      [section]: [initialState]
    }));
    
    setEndoscopyHistoryIndex(prev => ({
      ...prev,
      [section]: 0
    }));
    
    toast.success(`${section} cleared`);
  };

  const clearAllEndoscopyData = (showToast = true) => {
    const initialEndoscopyData = {
      patientInfo: createInitialPatientInfoState(),
      procedureInfo: {},
      gastroscopyFindings: { findings: [] },
      colonoscopyFindings: { findings: [] },
      specimen: {
        sentForPathology: '',
        laboratoryName: '',
        otherSpecimensTaken: '',
        otherSpecimensDetails: ''
      },
      conclusion: '',
      followUp: {
        enabled: false,
        options: [],
        other: '',
        notes: '',
        postOperativeManagement: ''
      },
      signature: {
        surgeonSignature: '',
        surgeonSignatureText: '',
        dateTime: ''
      },
      media: [],
      notes: '',
      selectedProcedures: [],
      gastroscopyCanvasData: '',
      colonoscopyCanvasData: '',
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      ...initialEndoscopyData
    }));

    // Reset all history to initial states
    setEndoscopyHistory({
      patientInfo: [createInitialPatientInfoState()],
      procedureInfo: [{
        selectedProcedures: [],
        procedure: {},
        gastroscopyCanvasData: '',
        colonoscopyCanvasData: '',
      }],
      procedureTypes: [{
        gastroscopyFindings: { findings: [] },
        colonoscopyFindings: { findings: [] },
        procedureFindings: { findings: '', additionalNotes: '' }
      }],
      specimen: [{
        sentForPathology: '',
        laboratoryName: '',
        otherSpecimensTaken: '',
        otherSpecimensDetails: '',
      }]
    });

    setEndoscopyHistoryIndex({
      patientInfo: 0,
      procedureInfo: 0,
      procedureTypes: 0,
      specimen: 0
    });

    clearCurrentExtractedPatient();
    if (showToast) {
      toast.success("All endoscopy data cleared successfully!");
    }
  };
  
  // Auto-save functionality with stable debouncing to avoid racing restores and repeated timers.
  const autoSaveEndoscopy = useMemo(
    () => createAutoSave("endoscopy_report", 3000),
    [],
  );
  const autoSaveWorkingSession = useMemo(
    () => createAutoSave(WORKING_SESSION_STORAGE_KEY, 1500),
    [],
  );
  
  // Track if this is initial load to prevent interference during development
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Development mode detection - but persistence should be enabled by default
  const isDevelopmentMode = process.env.NODE_ENV === 'development';
  const enablePersistence = localStorage.getItem('disable_persistence') !== 'true'; // Only disable if explicitly set
  
  // Load saved data on component mount (this handles ALL templates)
  useEffect(() => {
    if (enablePersistence) {
      const savedData = loadFromStorage('endoscopy_report');
      if (savedData) {
        const shouldResetStoredDiagramMarkings =
          localStorage.getItem(DIAGRAM_MARKINGS_RESET_MIGRATION_KEY) !== "true";
        const restoredSavedData = shouldResetStoredDiagramMarkings
          ? sanitizeStoredDiagramData(savedData)
          : savedData;

        if (shouldResetStoredDiagramMarkings) {
          localStorage.setItem(DIAGRAM_MARKINGS_RESET_MIGRATION_KEY, "true");
        }

        const restoredReport = normalizeReportPatientInfos({
          ...currentReport,
          ...restoredSavedData,
          gastroscopy: {
            ...currentReport.gastroscopy,
            ...(restoredSavedData.gastroscopy || {}),
          },
          colonoscopy: {
            ...currentReport.colonoscopy,
            ...(restoredSavedData.colonoscopy || {}),
          },
          appendectomy: {
            ...currentReport.appendectomy,
            ...(restoredSavedData.appendectomy || {}),
          },
          ventralHernia: {
            ...currentReport.ventralHernia,
            ...(restoredSavedData.ventralHernia || {}),
          },
          rectalCancer: {
            ...currentReport.rectalCancer,
            ...(restoredSavedData.rectalCancer || {}),
          },
          smallBowel: {
            ...currentReport.smallBowel,
            ...(restoredSavedData.smallBowel || {}),
          },
          cholecystectomy: {
            ...currentReport.cholecystectomy,
            ...(restoredSavedData.cholecystectomy || {}),
          },
          periAnal: {
            ...currentReport.periAnal,
            ...(restoredSavedData.periAnal || {}),
          },
          inguinalHernia: {
            ...currentReport.inguinalHernia,
            ...(restoredSavedData.inguinalHernia || {}),
          },
          transanalMinimallyInvasiveSurgery: {
            ...currentReport.transanalMinimallyInvasiveSurgery,
            ...(restoredSavedData.transanalMinimallyInvasiveSurgery || {}),
          },
          openGeneralSurgery: {
            ...currentReport.openGeneralSurgery,
            ...(restoredSavedData.openGeneralSurgery || {}),
          },
          openAbdominalSurgery: {
            ...currentReport.openAbdominalSurgery,
            ...(restoredSavedData.openAbdominalSurgery || {}),
          },
        });

        const restoredVentralHernia = createInitialVentralHerniaState(restoredReport.ventralHernia);

        setCurrentReport(restoredReport);
        setHistory([JSON.parse(JSON.stringify(restoredReport))]);
        setHistoryIndex(0);
        setAppendectomyHistory({
          patientInfo: [restoredReport.appendectomy?.patientInfo || createInitialPatientInfoState()],
          preoperative: [restoredReport.appendectomy?.preoperative || {
            surgeons: [''], assistants: [''], anaesthetists: [''], duration: '', startTime: '', endTime: '', indication: [], indicationOther: '', imaging: [], imagingOther: ''
          }],
          intraoperative: [restoredReport.appendectomy?.intraoperative || {
            appendixAppearance: [], abscess: '', peritonitis: [], otherFindings: ''
          }],
          procedure: [restoredReport.appendectomy?.procedure || {
            approach: [], reasonForConversion: '', operationDescription: '', incisionType: [], incisionOther: '', trocarPlacement: '', divisionMethod: [], divisionOther: '', mesenteryControl: [], mesenteryOther: '', lavage: '', drainPlacement: '', drainLocation: ''
          }],
          closure: [restoredReport.appendectomy?.closure || {
            fascialClosure: '', skinClosure: [], skinOther: '', complications: '', complicationDetails: '', pathology: '', otherSpecimens: '', specimenDetails: '', surgeonSignature: '', dateTime: ''
          }],
          procedureFindings: [restoredReport.appendectomy?.procedureFindings || {
            findings: '', additionalNotes: ''
          }]
        });
        setAppendectomyHistoryIndex({
          patientInfo: 0,
          preoperative: 0,
          intraoperative: 0,
          procedure: 0,
          closure: 0,
          procedureFindings: 0
        });
        setVentralHerniaHistory({
          patientInfo: [restoredVentralHernia.patientInfo],
          preoperative: [restoredVentralHernia.preoperative],
          operative: [restoredVentralHernia.operative],
          procedure: [restoredVentralHernia.procedure],
          procedureFindings: [restoredVentralHernia.procedureFindings]
        });
        setVentralHerniaHistoryIndex({
          patientInfo: 0,
          preoperative: 0,
          operative: 0,
          procedure: 0,
          procedureFindings: 0
        });
        setEndoscopyHistory({
          patientInfo: [restoredReport.patientInfo],
          procedureInfo: [{
            selectedProcedures: restoredReport.selectedProcedures || [],
            procedure: restoredReport.procedure || {},
            gastroscopyCanvasData: restoredReport.gastroscopyCanvasData || '',
            colonoscopyCanvasData: restoredReport.colonoscopyCanvasData || ''
          }],
          procedureTypes: [{
            gastroscopyFindings: restoredReport.gastroscopyFindings || { findings: [] },
            colonoscopyFindings: restoredReport.colonoscopyFindings || { findings: [] },
            procedureFindings: restoredReport.procedureFindings || { findings: '', additionalNotes: '' }
          }],
          specimen: [restoredReport.specimen || {
            sentForPathology: '', laboratoryName: '', otherSpecimensTaken: '', otherSpecimensDetails: ''
          }]
        });
        setEndoscopyHistoryIndex({
          patientInfo: 0,
          procedureInfo: 0,
          procedureTypes: 0,
          specimen: 0
        });
        setRectalCancerHistory({
          patientInfo: [restoredReport.rectalCancer?.patientInfo || createInitialPatientInfoState()],
          operationType: [restoredReport.rectalCancer?.operationType || {
            type: [], typeOther: '', neoadjuvantTreatment: '', neoadjuvantDetails: ''
          }],
          surgicalApproach: [restoredReport.rectalCancer?.surgicalApproach || {
            primaryApproach: [], conversionReason: [], conversionReasonOther: '', trocarNumber: ''
          }],
          mobilizationAndResection: [restoredReport.rectalCancer?.mobilizationAndResection || {
            extentOfMobilization: [],
            extentOfMobilizationOther: '',
            vesselLigation: [],
            vesselLigationOther: '',
            imvLigation: '',
            hemostasisTechnique: [],
            hemostasisTechniqueOther: '',
            lymphNodeDissection: '',
            lymphNodeDissectionOther: '',
            proximalTransection: [],
            proximalTransectionOther: '',
            distalTransection: [],
            distalTransectionOther: '',
            analCanalTransection: [],
            analCanalTransectionOther: '',
            enBlocResection: [],
            enBlocResectionOther: '',
            mobilization: [],
            mobilizationOther: '',
            mesorectalExcision: [],
            mesorectalExcisionOther: '',
            distanceFromAnalVerge: ''
          }],
          reconstruction: [restoredReport.rectalCancer?.reconstruction || {
            reconstructionType: [], anastomosisDetails: {}, stomaDetails: {}, reconstructionOther: ''
          }],
          operativeEvents: [restoredReport.rectalCancer?.operativeEvents || {
            intraoperativeComplications: [], intraoperativeComplicationsOther: '', drainInsertion: '', drainDetails: '', specimenExtraction: '', extractionSite: '', additionalProcedures: []
          }],
          closure: [restoredReport.rectalCancer?.closure || {
            fascialClosure: [], fascialClosureOther: '', fascialClosureMaterial: [], fascialClosureMaterialOther: '', skinClosure: [], skinClosureOther: '', skinClosureMaterial: [], skinClosureMaterialOther: ''
          }],
          procedureDetails: [restoredReport.rectalCancer?.procedureDetails || {
            surgeons: [''], assistants: [''], anaesthetists: [''], duration: '', startTime: '', endTime: '', additionalNotes: '', postOperativeManagement: ''
          }],
          procedureFindings: [restoredReport.rectalCancer?.procedureFindings || {
            findings: '', additionalNotes: ''
          }]
        });
        setRectalCancerHistoryIndex({
          patientInfo: 0,
          operationType: 0,
          surgicalApproach: 0,
          mobilizationAndResection: 0,
          reconstruction: 0,
          operativeEvents: 0,
          closure: 0,
          procedureDetails: 0,
          procedureFindings: 0
        });
        setSmallBowelHistory({
          patientInfo: [restoredReport.smallBowel?.patientInfo || createInitialSmallBowelSurgeryState().patientInfo],
          preoperative: [restoredReport.smallBowel?.preoperative || createInitialSmallBowelSurgeryState().preoperative],
          operativeFindings: [restoredReport.smallBowel?.operativeFindings || createInitialSmallBowelSurgeryState().operativeFindings],
          procedure: [restoredReport.smallBowel?.procedure || createInitialSmallBowelSurgeryState().procedure],
          reconstruction: [restoredReport.smallBowel?.reconstruction || createInitialSmallBowelSurgeryState().reconstruction],
          operativeEvents: [restoredReport.smallBowel?.operativeEvents || createInitialSmallBowelSurgeryState().operativeEvents],
          closure: [restoredReport.smallBowel?.closure || createInitialSmallBowelSurgeryState().closure],
          additionalInfo: [restoredReport.smallBowel?.additionalInfo || createInitialSmallBowelSurgeryState().additionalInfo],
          procedureFindings: [restoredReport.smallBowel?.procedureFindings || createInitialSmallBowelSurgeryState().procedureFindings]
        });
        setSmallBowelHistoryIndex({
          patientInfo: 0,
          preoperative: 0,
          operativeFindings: 0,
          procedure: 0,
          reconstruction: 0,
          operativeEvents: 0,
          closure: 0,
          additionalInfo: 0,
          procedureFindings: 0
        });
        setCholecystectomyHistory({
          patientInfo: [restoredReport.cholecystectomy?.patientInfo || createInitialCholecystectomyState().patientInfo],
          preoperative: [restoredReport.cholecystectomy?.preoperative || createInitialCholecystectomyState().preoperative],
          intraoperative: [restoredReport.cholecystectomy?.intraoperative || createInitialCholecystectomyState().intraoperative],
          procedure: [restoredReport.cholecystectomy?.procedure || createInitialCholecystectomyState().procedure],
          closure: [restoredReport.cholecystectomy?.closure || createInitialCholecystectomyState().closure],
          additionalInfo: [restoredReport.cholecystectomy?.additionalInfo || createInitialCholecystectomyState().additionalInfo],
          procedureFindings: [restoredReport.cholecystectomy?.procedureFindings || createInitialCholecystectomyState().procedureFindings]
        });
        setCholecystectomyHistoryIndex({
          patientInfo: 0,
          preoperative: 0,
          intraoperative: 0,
          procedure: 0,
          closure: 0,
          additionalInfo: 0,
          procedureFindings: 0
        });
        setPeriAnalHistory({
          patientInfo: [restoredReport.periAnal?.patientInfo || createInitialPeriAnalState().patientInfo],
          preoperative: [restoredReport.periAnal?.preoperative || createInitialPeriAnalState().preoperative],
          findings: [restoredReport.periAnal?.findings || createInitialPeriAnalState().findings],
          woundManagement: [restoredReport.periAnal?.woundManagement || createInitialPeriAnalState().woundManagement],
          complications: [restoredReport.periAnal?.complications || createInitialPeriAnalState().complications],
          postOperativePlan: [restoredReport.periAnal?.postOperativePlan || createInitialPeriAnalState().postOperativePlan],
          specimen: [restoredReport.periAnal?.specimen || createInitialPeriAnalState().specimen],
          additionalInfo: [restoredReport.periAnal?.additionalInfo || createInitialPeriAnalState().additionalInfo],
          procedureFindings: [restoredReport.periAnal?.procedureFindings || createInitialPeriAnalState().procedureFindings]
        });
        setPeriAnalHistoryIndex({
          patientInfo: 0,
          preoperative: 0,
          findings: 0,
          woundManagement: 0,
          complications: 0,
          postOperativePlan: 0,
          specimen: 0,
          additionalInfo: 0,
          procedureFindings: 0
        });
      }

      const savedWorkingSession = sanitizeWorkingSessionState(
        loadFromStorage(WORKING_SESSION_STORAGE_KEY),
      );

      if (savedWorkingSession?.updatedAtIso) {
        workingSessionUpdatedAtRef.current = savedWorkingSession.updatedAtIso;
      }

      if (savedWorkingSession?.appSection) {
        setAppSection(savedWorkingSession.appSection);
      }

      if (savedWorkingSession?.currentTab) {
        setCurrentTab(savedWorkingSession.currentTab);
      }

      if ("forcedPatientsProcedureFilter" in (savedWorkingSession || {})) {
        setForcedPatientsProcedureFilter(savedWorkingSession?.forcedPatientsProcedureFilter ?? null);
      }

      if ("editingPatientContext" in (savedWorkingSession || {})) {
        setEditingPatientContext(savedWorkingSession?.editingPatientContext ?? null);
      }

      if (
        savedWorkingSession?.currentExtractedPatientInfo &&
        hasExtractedPatientStickerData(savedWorkingSession.currentExtractedPatientInfo)
      ) {
        setCurrentExtractedPatientInfo(
          createInitialPatientInfoState(savedWorkingSession.currentExtractedPatientInfo),
        );
      }
    }
    hasHydratedWorkingSessionRef.current = true;
  }, [enablePersistence]);
  
  // Helper function to check if saved data has meaningful content (very lenient - save almost everything)
  const hasValidData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    // Check if any section has meaningful data
    const patientInfo = data.patientInfo || {};
    const rectalCancer = data.rectalCancer || {};
    const ventralHernia = data.ventralHernia || {};
    const appendectomy = data.appendectomy || {};
    const smallBowel = data.smallBowel || {};
    const cholecystectomy = data.cholecystectomy || {};
    const periAnal = data.periAnal || {};
    const gastroscopyTemplate = data.gastroscopy || {};
    const colonoscopyTemplate = data.colonoscopy || {};
    const inguinalHernia = data.inguinalHernia || {};
    const tmis = data.transanalMinimallyInvasiveSurgery || {};
    const openGeneralSurgery = data.openGeneralSurgery || {};
    const openAbdominalSurgery = data.openAbdominalSurgery || {};
    const gastroscopyFindings = data.gastroscopyFindings || {};
    const colonoscopyFindings = data.colonoscopyFindings || {};
    
    // Check various fields that indicate user input (be very inclusive)
    const hasPatientData = hasMeaningfulPatientInfoData(patientInfo);
    const hasRectalData = hasMeaningfulPatientInfoData(rectalCancer.patientInfo) || rectalCancer.surgicalTeam?.surgeons?.some(s => s.trim()) || rectalCancer.operationType?.type?.length > 0;
    const hasVentralData = hasMeaningfulPatientInfoData(ventralHernia.patientInfo) || ventralHernia.preoperative?.surgeons?.some(s => s.trim()) || ventralHernia.operative?.herniaType?.length > 0;
    const hasAppendectomyData = hasMeaningfulPatientInfoData(appendectomy.patientInfo) || appendectomy.preoperative?.surgeons?.some(s => s.trim()) || appendectomy.procedure?.approach?.length > 0;
    const hasSmallBowelData = hasMeaningfulPatientInfoData(smallBowel.patientInfo) || smallBowel.preoperative?.surgeons?.some((s: string) => s.trim()) || smallBowel.procedure?.approach?.length > 0;
    const hasCholeData = hasMeaningfulPatientInfoData(cholecystectomy.patientInfo) || cholecystectomy.preoperative?.surgeons?.some((s: string) => s.trim()) || cholecystectomy.procedure?.approach?.length > 0;
    const hasPeriAnalData = hasMeaningfulPatientInfoData(periAnal.patientInfo) || periAnal.preoperative?.surgeons?.some((s: string) => s.trim()) || periAnal.findings?.selectedFindings?.length > 0;
    const hasGastroscopyTemplateData = hasMeaningfulPatientInfoData(gastroscopyTemplate.patientInfo) || gastroscopyTemplate.preoperative?.endoscopists?.some((s: string) => s.trim()) || gastroscopyTemplate.diagram?.findings?.length > 0;
    const hasColonoscopyTemplateData = hasMeaningfulPatientInfoData(colonoscopyTemplate.patientInfo) || colonoscopyTemplate.preoperative?.endoscopists?.some((s: string) => s.trim()) || colonoscopyTemplate.diagram?.findings?.length > 0;
    const hasInguinalHerniaData = hasMeaningfulPatientInfoData(inguinalHernia.patientInfo) || inguinalHernia.preoperative?.indication?.length > 0 || inguinalHernia.procedure?.description?.trim?.();
    const hasTmisData = hasMeaningfulPatientInfoData(tmis.patientInfo) || tmis.preoperative?.surgeons?.some((s: string) => s.trim()) || tmis.operativeFindings?.findings?.trim?.();
    const hasOpenGeneralSurgeryData = hasMeaningfulPatientInfoData(openGeneralSurgery.patientInfo) || openGeneralSurgery.preoperative?.surgeons?.some((s: string) => s.trim()) || openGeneralSurgery.narrative?.operationDone?.trim?.();
    const hasOpenAbdominalSurgeryData = hasMeaningfulPatientInfoData(openAbdominalSurgery.patientInfo) || openAbdominalSurgery.preoperative?.surgeons?.some((s: string) => s.trim()) || openAbdominalSurgery.narrative?.operationDone?.trim?.();
    const hasEndoscopyData = gastroscopyFindings.findings?.length > 0 || colonoscopyFindings.findings?.length > 0 || data.selectedProcedures?.length > 0;
    const hasNotes = data.notes?.trim() || data.conclusion?.trim();
    
    return hasPatientData || hasRectalData || hasVentralData || hasAppendectomyData || hasSmallBowelData || hasCholeData || hasPeriAnalData || hasGastroscopyTemplateData || hasColonoscopyTemplateData || hasInguinalHerniaData || hasTmisData || hasOpenGeneralSurgeryData || hasOpenAbdominalSurgeryData || hasEndoscopyData || hasNotes;
  };

  // Appendectomy data is now handled by the main data loading above
  // Helper function to check if appendectomy data has meaningful content
  const hasValidAppendectomyData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    // Check various sections for meaningful data
    const patientInfo = data.patientInfo || {};
    const preoperative = data.preoperative || {};
    const procedure = data.procedure || {};
    
    return !!(patientInfo.name || preoperative.surgeons?.some(s => s.trim()) || procedure.operationDescription?.trim());
  };
  
  // Auto-save whenever currentReport changes (if persistence enabled)
  useEffect(() => {
    if (!enablePersistence || !hasHydratedWorkingSessionRef.current) {
      return;
    }

    // Keep unsaved in-progress template work local and resumable without touching patient records.
    autoSaveEndoscopy(currentReport);
  }, [currentReport, autoSaveEndoscopy, enablePersistence]);

  useEffect(() => {
    if (
      !enablePersistence ||
      !isFirebaseConfigured ||
      appSection !== "templates" ||
      !hasHydratedWorkingSessionRef.current ||
      applyingLiveTemplateDraftRef.current
    ) {
      return;
    }

    const localEditAtIso = new Date().toISOString();
    latestLocalLiveTemplateEditAtRef.current = localEditAtIso;
    workingSessionUpdatedAtRef.current = localEditAtIso;
    hasPendingLocalLiveTemplateChangesRef.current = true;
  }, [
    appSection,
    currentExtractedPatientInfo,
    currentReport,
    currentTab,
    editingPatientContext,
    enablePersistence,
    forcedPatientsProcedureFilter,
  ]);

  useEffect(() => {
    if (!enablePersistence || !hasHydratedWorkingSessionRef.current) {
      return;
    }

    const updatedAtIso = new Date().toISOString();
    workingSessionUpdatedAtRef.current = updatedAtIso;
    autoSaveWorkingSession(buildWorkingSessionState(updatedAtIso));
  }, [
    appSection,
    autoSaveWorkingSession,
    currentExtractedPatientInfo,
    currentTab,
    editingPatientContext,
    enablePersistence,
    forcedPatientsProcedureFilter,
  ]);

  useEffect(() => {
    if (!enablePersistence) {
      return;
    }

    const flushWorkingDraft = () => {
      saveToStorage("endoscopy_report", currentReport);
      saveToStorage(
        WORKING_SESSION_STORAGE_KEY,
        buildWorkingSessionState(workingSessionUpdatedAtRef.current || new Date().toISOString()),
      );
    };

    window.addEventListener("beforeunload", flushWorkingDraft);
    return () => {
      window.removeEventListener("beforeunload", flushWorkingDraft);
    };
  }, [
    appSection,
    currentExtractedPatientInfo,
    currentReport,
    currentTab,
    editingPatientContext,
    enablePersistence,
    forcedPatientsProcedureFilter,
  ]);

  useEffect(() => {
    if (!enablePersistence || !isFirebaseConfigured) {
      return;
    }

    const syncPendingDraft = async () => {
      const pendingDraft = loadQueuedLiveTemplateDraftSync();
      if (!pendingDraft) {
        return;
      }

      try {
        await processQueuedLiveTemplateDraftSync();
        liveTemplateDraftSignatureRef.current = pendingDraft.payloadSignature;
        hasPendingLocalLiveTemplateChangesRef.current = false;
        latestLocalLiveTemplateEditAtRef.current =
          pendingDraft.updatedAtIso || latestLocalLiveTemplateEditAtRef.current;
      } catch (error) {
        console.error("Failed to sync live template draft", error);
      }
    };

    void syncPendingDraft();

    const handleOnline = () => {
      void syncPendingDraft();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [enablePersistence]);

  useEffect(() => {
    if (!enablePersistence || !isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToLiveTemplateDraft((remoteDraft) => {
      if (!remoteDraft?.payload || !remoteDraft.payloadSignature) {
        return;
      }

      if (remoteDraft.updatedBySessionId === liveTemplateDraftSessionId) {
        liveTemplateDraftSignatureRef.current = remoteDraft.payloadSignature;
        workingSessionUpdatedAtRef.current =
          remoteDraft.updatedAtIso || workingSessionUpdatedAtRef.current;
        hasPendingLocalLiveTemplateChangesRef.current = false;
        latestLocalLiveTemplateEditAtRef.current =
          remoteDraft.updatedAtIso || latestLocalLiveTemplateEditAtRef.current;
        return;
      }

      const pendingDraft = loadQueuedLiveTemplateDraftSync();
      if (
        pendingDraft &&
        pendingDraft.payloadSignature !== remoteDraft.payloadSignature &&
        pendingDraft.updatedAtIso >= remoteDraft.updatedAtIso
      ) {
        return;
      }

      if (
        hasRecentLocalLiveTemplateEdit() &&
        typeof document !== "undefined" &&
        document.hasFocus()
      ) {
        return;
      }

      if (
        hasPendingLocalLiveTemplateChangesRef.current &&
        latestLocalLiveTemplateEditAtRef.current &&
        (!remoteDraft.updatedAtIso ||
          latestLocalLiveTemplateEditAtRef.current >= remoteDraft.updatedAtIso)
      ) {
        return;
      }

      if (
        workingSessionUpdatedAtRef.current &&
        remoteDraft.payloadSignature !== liveTemplateDraftSignatureRef.current &&
        workingSessionUpdatedAtRef.current > remoteDraft.updatedAtIso
      ) {
        return;
      }

      if (remoteDraft.payloadSignature === liveTemplateDraftSignatureRef.current) {
        return;
      }

      lastLiveTemplateDraftAuthorSessionIdRef.current =
        remoteDraft.updatedBySessionId || lastLiveTemplateDraftAuthorSessionIdRef.current;
      liveTemplateDraftSignatureRef.current = remoteDraft.payloadSignature;
      workingSessionUpdatedAtRef.current = remoteDraft.updatedAtIso || workingSessionUpdatedAtRef.current;
      applyLiveTemplateDraftPayload(remoteDraft.payload);
    });

    return () => {
      unsubscribe();
    };
  }, [enablePersistence, liveTemplateDraftSessionId]);

  useEffect(() => {
    if (
      !enablePersistence ||
      !isFirebaseConfigured ||
      appSection !== "templates" ||
      !hasHydratedWorkingSessionRef.current ||
      applyingLiveTemplateDraftRef.current
    ) {
      return;
    }

    const liveDraftPayload = buildLiveTemplateDraftPayload();
    const payloadSignature = createLiveTemplateDraftSignature(liveDraftPayload);

    if (!payloadSignature || payloadSignature === liveTemplateDraftSignatureRef.current) {
      return;
    }

    latestLocalLiveTemplateEditAtRef.current =
      latestLocalLiveTemplateEditAtRef.current || new Date().toISOString();
    hasPendingLocalLiveTemplateChangesRef.current = true;

    const timeoutId = window.setTimeout(() => {
      const snapshot = createLiveTemplateDraftSnapshot(liveDraftPayload, payloadSignature);
      lastLiveTemplateDraftAuthorSessionIdRef.current = snapshot.updatedBySessionId;
      queueLiveTemplateDraftSync(snapshot);
      workingSessionUpdatedAtRef.current = snapshot.updatedAtIso;

      if (typeof navigator !== "undefined" && navigator.onLine) {
        void processQueuedLiveTemplateDraftSync()
          .then(() => {
            liveTemplateDraftSignatureRef.current = payloadSignature;
            hasPendingLocalLiveTemplateChangesRef.current = false;
            latestLocalLiveTemplateEditAtRef.current = snapshot.updatedAtIso;
          })
          .catch((error) => {
            console.error("Failed to sync live template draft", error);
          });
      }
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    appSection,
    currentExtractedPatientInfo,
    currentReport,
    currentTab,
    editingPatientContext,
    enablePersistence,
    forcedPatientsProcedureFilter,
  ]);

  useEffect(() => {
    if (!enablePersistence || !hasHydratedWorkingSessionRef.current) {
      return;
    }

    const patientInfo = createInitialPatientInfoState(activeTemplatePatientInfo);
    const trimmedName = String(patientInfo.name || "").trim();
    const trimmedDob = String(patientInfo.dateOfBirth || "").trim();
    const trimmedPatientId = String(patientInfo.patientId || "").trim().toLowerCase();

    if (!trimmedName || !trimmedDob) {
      patientListAutosaveSignatureRef.current = "";
      pendingPatientAutosaveContextRef.current = null;
      return;
    }

    if (!canCurrentSessionDrivePatientAutosave()) {
      return;
    }

    const targetContext = resolveSilentPatientAutosaveTarget(patientInfo);

    if (!editingPatientContext && !pendingPatientAutosaveContextRef.current) {
      pendingPatientAutosaveContextRef.current = targetContext;
    }

    const autosaveSignature = JSON.stringify({
      templateType: activeTemplateType,
      currentTab,
      patientId: targetContext.patientId,
      recordId: targetContext.recordId,
      patientName: trimmedName.toLowerCase(),
      patientDateOfBirth: trimmedDob,
      patientIdValue: trimmedPatientId,
      report: currentReport,
    });

    if (autosaveSignature === patientListAutosaveSignatureRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveCurrentTemplateToPatients(
        editingPatientContext ? "update" : "create",
        {
          silent: true,
          requireNameAndDob: true,
          targetContext,
        },
      )
        .then((result) => {
          if (!result) {
            return;
          }

          pendingPatientAutosaveContextRef.current = result.context;
          patientListAutosaveSignatureRef.current = autosaveSignature;
        })
        .catch((error) => {
          console.error("Failed to autosave current template to Patients", error);
        });
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeTemplatePatientInfo,
    activeTemplateType,
    currentReport,
    currentTab,
    editingPatientContext,
    enablePersistence,
    patientDatabaseCache.patients,
  ]);
  
  // Track user interaction to enable smart saving
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
    };
    
    // Listen for various user interactions
    document.addEventListener('input', handleUserInteraction);
    document.addEventListener('change', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);
    
    return () => {
      document.removeEventListener('input', handleUserInteraction);
      document.removeEventListener('change', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [hasUserInteracted]);
  
  // Handle filling mock data for testing
  const handleFillMockData = () => {
    let mockData: any = null;
    let templateKey = '';

    switch (currentTab) {
      case 'inguinalHernia':
        mockData = generateInguinalHerniaMockData();
        templateKey = 'inguinalHernia';
        break;
      case 'gastroscopy':
        mockData = generateGastroscopyMockData();
        templateKey = 'gastroscopy';
        break;
      case 'colonoscopy':
        mockData = generateColonoscopyMockData();
        templateKey = 'colonoscopy';
        break;
      case 'cholecystectomy':
        mockData = generateCholecystectomyMockData();
        templateKey = 'cholecystectomy';
        break;
      case 'transanalMinimallyInvasiveSurgery':
        mockData = generateTAMISMockData();
        templateKey = 'transanalMinimallyInvasiveSurgery';
        break;
      case 'openAbdominalSurgery':
        mockData = generateOpenAbdominalMockData();
        templateKey = 'openAbdominalSurgery';
        break;
      case 'openGeneralSurgery':
        mockData = generateOpenGeneralMockData();
        templateKey = 'openGeneralSurgery';
        break;
      default:
        toast.info(`Mock data for "${currentTab}" template is not yet available.`);
        return;
    }

    if (mockData && templateKey) {
      setCurrentReport(prev => ({
        ...prev,
        [templateKey]: mockData
      }));
      toast.success(`Mock data populated for ${currentTab}`);
    }
  };

  return (
    <AppLayout>
      <GlassContainer className="pt-2 sm:pt-4">
        {/* Glass Header */}
        <GlassHeader
          title="Gastroenterology Templates"
          subtitle=""
          className="mb-4 sm:mb-6"
        />

        <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
          {/* Main Content with Tabs */}
          <div className="2xl:col-span-3">
            <Card className="shadow-glass-heavy">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Patient & Procedure Documentation</CardTitle>
                    <CardDescription>
                      Complete patient information and procedure documentation
                    </CardDescription>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant={appSection === "templates" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setForcedPatientsProcedureFilter(null);
                          setAppSection("templates");
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Templates
                      </Button>
                      <Button
                        variant={appSection === "patients" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAppSection("patients")}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Patients
                      </Button>
                      <Button
                        variant={appSection === "reports" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAppSection("reports")}
                      >
                        <FileSearch className="mr-2 h-4 w-4" />
                        Reports
                      </Button>
                    </div>
                  </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs sm:w-auto bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      onClick={handleFillMockData}
                      title="Fill with mock data for testing"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Fill Mock Data
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full text-xs sm:w-auto"
                      onClick={handleClearAllTemplatesData}
                      title="Clear all template data"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear All Data
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {appSection === "templates" ? (
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="mobile-form-layout w-full">
	                  <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-lg p-1">
                    <TabsTrigger value="procedure" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                      Endoscopy
                    </TabsTrigger>
                      <TabsTrigger value="gastroscopy" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Gastroscopy
                      </TabsTrigger>
                      <TabsTrigger value="colonoscopy" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Colonoscopy
                      </TabsTrigger>
                    <TabsTrigger value="appendectomy" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                      Appendicectomy
                    </TabsTrigger>
                    <TabsTrigger value="hernia" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                      Ventral Hernia Repair
                    </TabsTrigger>
                    <TabsTrigger value="inguinalHernia" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                      Inguinal Hernia Repair
                    </TabsTrigger>
	                    <TabsTrigger value="rectal" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
	                      Colorectal Resection
	                    </TabsTrigger>
                      <TabsTrigger value="smallBowel" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Small Bowel Surgery
                      </TabsTrigger>
                      <TabsTrigger value="cholecystectomy" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Cholecystectomy
                      </TabsTrigger>
                      <TabsTrigger value="periAnal" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Peri-Anal
                      </TabsTrigger>
                      <TabsTrigger value="transanalMinimallyInvasiveSurgery" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        TAMIS
                      </TabsTrigger>
                      <TabsTrigger value="openGeneralSurgery" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Open General Surgery
                      </TabsTrigger>
                      <TabsTrigger value="openAbdominalSurgery" className="flex min-w-[8.75rem] shrink-0 items-center justify-center whitespace-normal text-center leading-tight sm:min-w-0 sm:whitespace-nowrap">
                        Open Abdominal Surgery
                      </TabsTrigger>
	                  </TabsList>
                  
                  <TabsContent value="procedure" className="mt-6 space-y-6">
                    <Card className="glass-card-light">
                      <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-2xl font-bold text-gray-800">
                              Endoscopy - Synoptic Report
                            </CardTitle>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="glass-button text-xs"
                              onClick={() => {
                                setCurrentTab("procedure");
                                handleExportPDF();
                              }}
                              disabled={isGeneratingPDF}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              {isGeneratingPDF ? "Generating..." : "Print/Export PDF"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="glass-button text-xs"
                              onClick={handleSaveCurrentTemplateRecord}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save Patient
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="glass-button text-xs"
                              onClick={() => handleClearData()}
                              title="Clear all endoscopy data"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Clear All Data
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Patient Information */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="h-5 w-5 text-gray-600" />
                          Patient Information
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoEndoscopy('patientInfo')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoEndoscopy('patientInfo')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearEndoscopy('patientInfo')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
	                        <PatientInfoForm 
	                          onUpdate={(data) => updateReport('patientInfo', data)}
	                          currentData={currentReport.patientInfo}
                            currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
	                        />

                        {/* Preoperative Information */}
                        <div className="space-y-4 pt-6 border-t">
                          <div>
                            <h3 className="text-base font-semibold mb-4">Preoperative Information</h3>
                          </div>
                          <div className="space-y-4">
                            {/* Surgeons */}
                            <div className="space-y-2">
                              <label className="text-gray-800 font-medium">Surgeon:</label>
                              {(currentReport.patientInfo?.surgeons || ['']).map((value: string, index: number) => (
                                <div key={`surgeon-${index}`} className="flex items-center gap-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const list = [...(currentReport.patientInfo?.surgeons || [''])];
                                      list[index] = e.target.value;
                                      updateReport('patientInfo', { surgeons: list });
                                    }}
                                    placeholder="Enter Surgeon Name"
                                    className="flex-1"
                                  />
                                  {index === (currentReport.patientInfo?.surgeons || ['']).length - 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2 py-1 h-8"
                                      onClick={() => {
                                        const list = [...(currentReport.patientInfo?.surgeons || [''])];
                                        list.push('');
                                        updateReport('patientInfo', { surgeons: list });
                                      }}
                                    >
                                      +
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Assistants */}
                            <div className="space-y-2">
                              <label className="text-gray-800 font-medium">Assistant:</label>
                              {(currentReport.patientInfo?.assistants || ['']).map((value: string, index: number) => (
                                <div key={`assistant-${index}`} className="flex items-center gap-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const list = [...(currentReport.patientInfo?.assistants || [''])];
                                      list[index] = e.target.value;
                                      updateReport('patientInfo', { assistants: list });
                                    }}
                                    placeholder="Enter Assistant Name"
                                    className="flex-1"
                                  />
                                  {index === (currentReport.patientInfo?.assistants || ['']).length - 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2 py-1 h-8"
                                      onClick={() => {
                                        const list = [...(currentReport.patientInfo?.assistants || [''])];
                                        list.push('');
                                        updateReport('patientInfo', { assistants: list });
                                      }}
                                    >
                                      +
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Anaesthetists */}
                            <div className="space-y-2">
                              <label className="text-gray-800 font-medium">Anaesthetist:</label>
                              {(currentReport.patientInfo?.anaesthetists || ['']).map((value: string, index: number) => (
                                <div key={`anaesthetist-${index}`} className="flex items-center gap-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const list = [...(currentReport.patientInfo?.anaesthetists || [''])];
                                      list[index] = e.target.value;
                                      updateReport('patientInfo', { anaesthetists: list });
                                    }}
                                    placeholder="Enter Anaesthetist Name"
                                    className="flex-1"
                                  />
                                  {index === (currentReport.patientInfo?.anaesthetists || ['']).length - 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2 py-1 h-8"
                                      onClick={() => {
                                        const list = [...(currentReport.patientInfo?.anaesthetists || [''])];
                                        list.push('');
                                        updateReport('patientInfo', { anaesthetists: list });
                                      }}
                                    >
                                      +
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4 pt-6 border-t">
                          <div>
                            <h3 className="text-base font-semibold mb-4">Procedure Information</h3>
                            <div className="flex gap-2 mb-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => undoEndoscopy('procedureInfo')}
                                title="Undo"
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => redoEndoscopy('procedureInfo')}
                                title="Redo"
                              >
                                <Redo2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => clearEndoscopy('procedureInfo')}
                                title="Clear Section"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <ProcedureInfoForm 
                            onUpdate={(data) => updateReport('patientInfo', data)}
                            initialData={currentReport.patientInfo}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Procedure Type Selection */}
                    <div className="flex items-center justify-between">
                      <h3 className="sr-only">Procedure Type Selection</h3>
                      <div className="flex gap-2 ml-auto mb-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => undoEndoscopy('procedureTypes')}
                          title="Undo"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => redoEndoscopy('procedureTypes')}
                          title="Redo"
                        >
                          <Redo2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => clearEndoscopy('procedureTypes')}
                          title="Clear Section"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <ProcedureTypeSelection
                      onUpdate={(procedures) => updateReport('selectedProcedures', procedures)}
                      initialProcedures={currentReport.selectedProcedures}
                    />
                    
                    {/* Conditional Diagram Display */}
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => handleUndoFinding('gastroscopy')}
                        title="Undo"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => handleRedoFinding('gastroscopy')}
                        title="Redo"
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={handleRemoveProcedureFindings}
                        title="Clear Section"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <ConditionalDiagramDisplay
                      selectedProcedures={currentReport.selectedProcedures}
                      onGastroscopyUpdate={(data) => updateReport('gastroscopyFindings', data)}
                      onColonoscopyUpdate={(data) => updateReport('colonoscopyFindings', data)}
                      onProcedureFindingsUpdate={(data) => updateReport('procedureFindings', data)}
                      currentProcedureFindings={currentReport.procedureFindings}
                      gastroscopyRef={gastroscopyDiagramRef}
                      colonoscopyRef={colonoscopyDiagramRef}
                      gastroscopyContainerRef={gastroscopyContainerRef}
                      colonoscopyContainerRef={colonoscopyContainerRef}
                      onGastroscopyMethodsReady={(methods) => setDiagramMethods(prev => ({ ...prev, gastroscopy: methods }))}
                      onColonoscopyMethodsReady={(methods) => setDiagramMethods(prev => ({ ...prev, colonoscopy: methods }))}
                    />

                    {/* Specimen Section */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-black">Specimen</span>
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => undoEndoscopy('specimen')}
                              title="Undo"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => redoEndoscopy('specimen')}
                              title="Redo"
                            >
                              <Redo2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => clearEndoscopy('specimen')}
                              title="Clear Section"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Sent for Pathology */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Specimen Sent for Pathology:</p>
                          <div className="flex space-x-6">
                            <label className="flex items-center space-x-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name="endo-specimen-path"
                                checked={currentReport.specimen?.sentForPathology === 'Yes'}
                                onChange={() => updateReport('specimen', { sentForPathology: 'Yes' })}
                              />
                              <span>Yes</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name="endo-specimen-path"
                                checked={currentReport.specimen?.sentForPathology === 'No'}
                                onChange={() => updateReport('specimen', { sentForPathology: 'No', laboratoryName: '' })}
                              />
                              <span>No</span>
                            </label>
                          </div>
                          {currentReport.specimen?.sentForPathology === 'Yes' && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Specify Laboratory Sent to:</label>
                              <Input
                                type="text"
                                className="w-full max-w-md"
                                value={currentReport.specimen?.laboratoryName || ''}
                                onChange={(e) => updateReport('specimen', { laboratoryName: e.target.value })}
                                placeholder="Enter laboratory name"
                              />
                            </div>
                          )}
                        </div>

                        {/* Other Specimens Taken */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Other Specimens Taken:</p>
                          <div className="flex items-center">
                            <label className="flex items-center space-x-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name="endo-other-specimens"
                                checked={currentReport.specimen?.otherSpecimensTaken === 'Yes'}
                                onChange={() => updateReport('specimen', { otherSpecimensTaken: 'Yes' })}
                              />
                              <span>Yes (Specify:)</span>
                            </label>
                            <Input
                              type="text"
                              className="ml-2 w-48"
                              value={currentReport.specimen?.otherSpecimensDetails || ''}
                              onChange={(e) => updateReport('specimen', { otherSpecimensDetails: e.target.value })}
                              placeholder="e.g. Biopsies"
                            />
                            <label className="flex items-center space-x-2 text-sm text-gray-700 ml-6">
                              <input
                                type="radio"
                                name="endo-other-specimens"
                                checked={currentReport.specimen?.otherSpecimensTaken === 'No'}
                                onChange={() => updateReport('specimen', { otherSpecimensTaken: 'No', otherSpecimensDetails: '' })}
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Conclusion Section */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-black">Conclusion</span>
                            <span className="text-xs text-gray-500 font-normal ml-2">Document your overall findings and conclusions</span>
                          </span>
                          <div className="flex gap-2">
                            {currentReport.conclusion && !isEditingConclusion && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setTempConclusion(currentReport.conclusion);
                                    setIsEditingConclusion(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateReport('conclusion', '')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditingConclusion ? (
                          <div className="space-y-4">
                            <Textarea
                              value={tempConclusion}
                              onChange={(e) => setTempConclusion(e.target.value)}
                              rows={4}
                              placeholder="Enter your conclusion based on the procedure findings..."
                            />
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsEditingConclusion(false);
                                  setTempConclusion('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => {
                                  updateReport('conclusion', tempConclusion);
                                  setIsEditingConclusion(false);
                                  setTempConclusion('');
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : currentReport.conclusion ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {currentReport.conclusion}
                          </p>
                        ) : (
                          <div className="space-y-4">
                            <Textarea
                              value={tempConclusion}
                              onChange={(e) => setTempConclusion(e.target.value)}
                              rows={4}
                              placeholder="Enter your conclusion based on the procedure findings..."
                            />
                            <div className="flex gap-2 justify-end">
                              {tempConclusion.trim() && (
                                <Button 
                                  variant="outline" 
                                  onClick={() => setTempConclusion('')}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              )}
                              <Button 
                                onClick={() => {
                                  updateReport('conclusion', tempConclusion);
                                  setTempConclusion('');
                                }}
                                disabled={!tempConclusion.trim()}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Follow-up Section */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-black">Follow-up</span>
                            <span className="text-xs text-gray-500 font-normal ml-2">Specify follow-up requirements and recommendations</span>
                          </span>
                          {currentReport.followUp.enabled && !isEditingFollowUp && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setTempFollowUp(currentReport.followUp);
                                  setIsEditingFollowUp(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  updateReport('followUp', {
                                    enabled: false,
                                    options: [],
                                    other: '',
                                    notes: ''
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Follow-up Options</label>
                            <div className="grid grid-cols-2 gap-2">
                              {followUpOptions.map(option => (
                                <label key={option} className="flex items-center space-x-2">
                                  <Checkbox 
                                    checked={currentReport.followUp.options.includes(option)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateReport('followUp', {
                                          ...currentReport.followUp,
                                          enabled: true,
                                          options: [...currentReport.followUp.options, option]
                                        });
                                      } else {
                                        const newOptions = currentReport.followUp.options.filter(o => o !== option);
                                        updateReport('followUp', {
                                          ...currentReport.followUp,
                                          options: newOptions,
                                          enabled: newOptions.length > 0
                                        });
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {currentReport.followUp.options.includes('Other') && (
                            <div>
                              <label className="block text-sm font-medium mb-2">Please specify</label>
                              <div className="flex gap-2">
                                <Input
                                  value={tempFollowUpOther}
                                  onChange={(e) => setTempFollowUpOther(e.target.value)}
                                  placeholder="Specify other follow-up requirements..."
                                  className="flex-1"
                                />
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    updateReport('followUp', { ...currentReport.followUp, other: tempFollowUpOther });
                                    setTempFollowUpOther('');
                                  }}
                                  disabled={!tempFollowUpOther.trim()}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              </div>
                              {currentReport.followUp.other && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                  <strong>Saved:</strong> {currentReport.followUp.other}
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-2 h-6 px-2"
                                    onClick={() => {
                                      setTempFollowUpOther(currentReport.followUp.other);
                                      updateReport('followUp', { ...currentReport.followUp, other: '' });
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium mb-2">Additional Notes</label>
                            <div className="space-y-2">
                              <Textarea
                                value={tempFollowUpNotes}
                                onChange={(e) => setTempFollowUpNotes(e.target.value)}
                                rows={3}
                                placeholder="Any additional follow-up instructions or timeframes..."
                              />
                              <div className="flex justify-end">
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    updateReport('followUp', { ...currentReport.followUp, notes: tempFollowUpNotes });
                                    setTempFollowUpNotes('');
                                  }}
                                  disabled={!tempFollowUpNotes.trim()}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              </div>
                              {currentReport.followUp.notes && (
                                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                  <strong>Saved Notes:</strong>
                                  <p className="mt-1 whitespace-pre-wrap">{currentReport.followUp.notes}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mt-2 h-6 px-2"
                                    onClick={() => {
                                      setTempFollowUpNotes(currentReport.followUp.notes);
                                      updateReport('followUp', { ...currentReport.followUp, notes: '' });
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Post Operative Management */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Post Operative Management</label>
                            <div className="space-y-2">
                              <Textarea
                                value={currentReport.followUp?.postOperativeManagement || ''}
                                onChange={(e) => updateReport('followUp', { ...currentReport.followUp, postOperativeManagement: e.target.value })}
                                rows={3}
                                placeholder="Enter post-operative management plan..."
                              />
                            </div>
                          </div>

                          {/* Surgeon Signature Section - moved under Post Operative Management */}
                          <div className="pt-4 border-t">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Surgeon's Signature:</p>
                                <div className="space-y-2">
                                  <Input 
                                    type="text" 
                                    placeholder="Type signature name or leave blank to upload"
                                    className="w-full"
                                    value={currentReport.signature?.surgeonSignatureText || ''}
                                    onChange={(e) => updateReport('signature', {
                                      ...currentReport.signature,
                                      surgeonSignatureText: e.target.value
                                    })}
                                  />
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          updateReport('signature', {
                                            ...currentReport.signature,
                                            surgeonSignature: reader.result as string
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <p className="text-xs text-gray-500">Upload signature or stamp (Image/PDF)</p>
                                  {currentReport.signature?.surgeonSignature && (
                                    <div className="space-y-1">
                                      <p className="text-xs text-green-600">✓ Signature uploaded</p>
                                      <div className="border rounded p-2 bg-gray-50">
                                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                                        <img 
                                          src={currentReport.signature.surgeonSignature} 
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
                                  <DateTimeDDMMYYYY24HourInput
                                    className="w-full"
                                    value={currentReport.signature?.dateTime || getLocalDateTimeValue()}
                                    onChange={(value) => updateReport('signature', {
                                      ...currentReport.signature,
                                      dateTime: value
                                    })}
                                  />
                                  <p className="text-xs text-gray-500">Display format: DD-MM-YYYY HH:MM</p>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs px-2 py-1"
                                    onClick={() => {
                                      updateReport('signature', {
                                        ...currentReport.signature,
                                        dateTime: getLocalDateTimeValue()
                                      });
                                    }}
                                  >
                                    Set Current Date/Time
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Live Report Preview */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">
                            Live Report
                            <span className="text-xs text-gray-500 font-normal ml-2">
                              Real-time preview of procedure findings
                            </span>
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="glass-button text-xs"
                              onClick={() => {
                                setCurrentTab('procedure');
                                handleExportPDF();
                              }}
                              disabled={isGeneratingPDF}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass-button text-xs"
                              onClick={handleSaveCurrentTemplateRecord}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save Patient
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass-button text-xs"
                              onClick={() => handleClearData()}
                              title="Clear all endoscopy data"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Clear All Data
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div ref={reportPreviewRef}>
                          <ReportPreview 
                            report={currentReport}
                            gastroscopyCanvasData={currentReport.gastroscopyCanvasData}
                            colonoscopyCanvasData={currentReport.colonoscopyCanvasData}
                            onEditField={(field, value) => {
                              updateReport(field, value);
                              toast.success("Field updated successfully!");
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="appendectomy" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                    {/* Left Column - Appendectomy Form */}
                    <div className="2xl:col-span-1 space-y-6">
                    {/* Header with title and actions */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                              Synoptic Operative Report – Appendicectomy
                            </h1>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass-button text-xs"
                              onClick={() => {
                                setCurrentTab('appendectomy');
                                handleExportPDF();
                              }}
                              title="Export appendectomy PDF"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Print/Export PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="glass-button text-xs"
                              onClick={handleSaveCurrentTemplateRecord}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Patient
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="text-xs"
                              onClick={clearAllAppendectomyData}
                              title="Clear all appendectomy data"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Clear All Data
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Section I: Patient Information */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${activeSection === "section1" ? "bg-blue-50" : ""}`}
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => toggleExpand("section1")}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section1 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoAppendectomy('patientInfo')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoAppendectomy('patientInfo')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearAppendectomy('patientInfo')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {expanded.section1 && (
                        <CardContent className="px-6 py-4">
	                          <PatientInfoFields
	                            patientInfo={currentReport.appendectomy.patientInfo}
	                            onFieldChange={(field, value) =>
	                              updateAppendectomy("patientInfo", field, value)
	                            }
	                            onBulkUpdate={updateAppendectomyPatientInfoBulk}
	                            currentExtractedPatientInfo={currentExtractedPatientInfo}
	                            onCurrentPatientChange={updateCurrentExtractedPatient}
                              useDashDateInputs
                              use24HourTimeInputs
	                          />
                        </CardContent>
                      )}
                    </Card>

                    {/* Section II: Preoperative Information */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${activeSection === "section2" ? "bg-blue-50" : ""}`}
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => toggleExpand("section2")}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Preoperative Information</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section2 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoAppendectomy('preoperative')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoAppendectomy('preoperative')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearAppendectomy('preoperative')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {expanded.section2 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Surgeon:</label>
                                <div className="space-y-2">
                                  {currentReport.appendectomy.preoperative.surgeons.map((surgeon, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input 
                                        className="flex-1" 
                                        type="text" 
                                        placeholder="Enter Surgeon Name" 
                                        value={surgeon}
                                        onChange={(e) => {
                                          const newSurgeons = [...currentReport.appendectomy.preoperative.surgeons];
                                          newSurgeons[index] = e.target.value;
                                          updateAppendectomy('preoperative', 'surgeons', newSurgeons);
                                        }}
                                      />
                                      {index === currentReport.appendectomy.preoperative.surgeons.length - 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1"
                                          onClick={() => {
                                            const newSurgeons = [...currentReport.appendectomy.preoperative.surgeons, ''];
                                            updateAppendectomy('preoperative', 'surgeons', newSurgeons);
                                          }}
                                        >
                                          +
                                        </Button>
                                      )}
                                      {currentReport.appendectomy.preoperative.surgeons.length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            const newSurgeons = currentReport.appendectomy.preoperative.surgeons.filter((_, i) => i !== index);
                                            updateAppendectomy('preoperative', 'surgeons', newSurgeons);
                                          }}
                                        >
                                          −
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 items-start">
                                <label className="text-gray-800 font-medium">Assistant:</label>
                                <div className="space-y-2">
                                  {currentReport.appendectomy.preoperative.assistants.map((assistant, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input 
                                        className="flex-1" 
                                        type="text" 
                                        placeholder="Enter Assistant Name" 
                                        value={assistant}
                                        onChange={(e) => {
                                          const newAssistants = [...currentReport.appendectomy.preoperative.assistants];
                                          newAssistants[index] = e.target.value;
                                          updateAppendectomy('preoperative', 'assistants', newAssistants);
                                        }}
                                      />
                                      {index === currentReport.appendectomy.preoperative.assistants.length - 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1"
                                          onClick={() => {
                                            const newAssistants = [...currentReport.appendectomy.preoperative.assistants, ''];
                                            updateAppendectomy('preoperative', 'assistants', newAssistants);
                                          }}
                                        >
                                          +
                                        </Button>
                                      )}
                                      {currentReport.appendectomy.preoperative.assistants.length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            const newAssistants = currentReport.appendectomy.preoperative.assistants.filter((_, i) => i !== index);
                                            updateAppendectomy('preoperative', 'assistants', newAssistants);
                                          }}
                                        >
                                          −
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Anaesthetist:</label>
                                <div className="space-y-2">
                                  {currentReport.appendectomy.preoperative.anaesthetists.map((anaesthetist, index) => (
                                    <div className="flex items-center gap-2" key={`anaesthetist-${index}`}>
                                      <Input 
                                        className="w-full" 
                                        type="text" 
                                        placeholder="Enter Anaesthetist name" 
                                        value={anaesthetist}
                                        onChange={(e) => {
                                          const newAnaesthetists = [...currentReport.appendectomy.preoperative.anaesthetists];
                                          newAnaesthetists[index] = e.target.value;
                                          updateAppendectomy('preoperative', 'anaesthetists', newAnaesthetists);
                                        }}
                                      />
                                      {index === currentReport.appendectomy.preoperative.anaesthetists.length - 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1"
                                          onClick={() => {
                                            const newAnaesthetists = [...currentReport.appendectomy.preoperative.anaesthetists, ''];
                                            updateAppendectomy('preoperative', 'anaesthetists', newAnaesthetists);
                                          }}
                                        >
                                          +
                                        </Button>
                                      )}
                                      {currentReport.appendectomy.preoperative.anaesthetists.length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            const newAnaesthetists = currentReport.appendectomy.preoperative.anaesthetists.filter((_, i) => i !== index);
                                            updateAppendectomy('preoperative', 'anaesthetists', newAnaesthetists);
                                          }}
                                        >
                                          −
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Procedure Urgency:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Emergency', 'Semi-Emergency', 'Semi-Elective', 'Elective'].map((urgency) => (
                                  <div className="flex items-center" key={`urgency-${urgency}`}>
                                    <Checkbox
                                      id={`urgency-${urgency}`}
                                      checked={((currentReport.appendectomy.preoperative as any)?.procedureUrgency || []).includes(urgency)}
                                      onCheckedChange={(checked) => {
                                        const currentUrgency = ((currentReport.appendectomy.preoperative as any)?.procedureUrgency || []);
                                        const newUrgency = checked ? [...currentUrgency, urgency] : currentUrgency.filter((u: string) => u !== urgency);
                                        updateAppendectomy('preoperative', 'procedureUrgency', newUrgency);
                                      }}
                                    />
                                    <label htmlFor={`urgency-${urgency}`} className="ml-2 block text-sm text-gray-700">{urgency}</label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Preoperative Imaging:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['None', 'Ultrasound', 'CT Scan', 'MRI', 'Other'].map(imaging => (
                                  <div className="flex items-center" key={`imaging-${imaging}`}>
                                    <Checkbox 
                                      id={`imaging-${imaging}`} 
                                      checked={currentReport.appendectomy.preoperative.imaging.includes(imaging)}
                                      onCheckedChange={(checked) => {
                                        const currentImaging = currentReport.appendectomy.preoperative.imaging;
                                        const newImaging = checked 
                                          ? [...currentImaging, imaging]
                                          : currentImaging.filter(i => i !== imaging);
                                        updateAppendectomy('preoperative', 'imaging', newImaging);
                                      }}
                                      className="data-[state=checked]:bg-black data-[state=checked]:border-black"
                                    />
                                    <label htmlFor={`imaging-${imaging}`} className="ml-2 block text-sm text-gray-700">{imaging}</label>
                                    {imaging === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32" 
                                        value={currentReport.appendectomy.preoperative.imagingOther}
                                        onChange={(e) => updateAppendectomy('preoperative', 'imagingOther', e.target.value)}
                                        placeholder="Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Duration of Operation with Start and End Times */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Start Time (24-hour):</label>
                                <Time24HourInput
                                  className="w-full"
                                  hourAriaLabel="Start time hour"
                                  minuteAriaLabel="Start time minute"
                                  onChange={(value) => {
                                    updateAppendectomy('preoperative', 'startTime', value);
                                    if (value && currentReport.appendectomy.preoperative.endTime) {
                                      const duration = calculateDuration(value, currentReport.appendectomy.preoperative.endTime);
                                      updateAppendectomy('preoperative', 'duration', duration);
                                    }
                                  }}
                                  value={currentReport.appendectomy.preoperative.startTime}
                                />
                                <div className="text-sm text-gray-600">HH:MM</div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-gray-800 font-medium">End Time (24-hour):</label>
                                <Time24HourInput
                                  className="w-full"
                                  hourAriaLabel="End time hour"
                                  minuteAriaLabel="End time minute"
                                  onChange={(value) => {
                                    updateAppendectomy('preoperative', 'endTime', value);
                                    if (currentReport.appendectomy.preoperative.startTime && value) {
                                      const duration = calculateDuration(currentReport.appendectomy.preoperative.startTime, value);
                                      updateAppendectomy('preoperative', 'duration', duration);
                                    }
                                  }}
                                  value={currentReport.appendectomy.preoperative.endTime}
                                />
                                <div className="text-sm text-gray-600">HH:MM</div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Duration of Operation (in minutes):</label>
                                <Input 
                                  className="w-full" 
                                  type="text" 
                                  placeholder="Auto-calculated or manual entry" 
                                  value={currentReport.appendectomy.preoperative.duration}
                                  onChange={(e) => updateAppendectomy('preoperative', 'duration', e.target.value)}
                                />
                                <div className="text-sm text-gray-600">
                                  {currentReport.appendectomy.preoperative.startTime && currentReport.appendectomy.preoperative.endTime 
                                    ? "Auto-calculated" 
                                    : "Manual entry"}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Indication for Surgery:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Acute Appendicitis', 'Perforated Appendix', 'Abscess', 'Interval Appendicectomy', 'Other'].map(indication => (
                                  <div className="flex items-center" key={`indication-${indication}`}>
                                    <Checkbox 
                                      id={`indication-${indication}`} 
                                      checked={currentReport.appendectomy.preoperative.indication.includes(indication)}
                                      onCheckedChange={(checked) => {
                                        const currentIndications = currentReport.appendectomy.preoperative.indication;
                                        const newIndications = checked 
                                          ? [...currentIndications, indication]
                                          : currentIndications.filter(i => i !== indication);
                                        updateAppendectomy('preoperative', 'indication', newIndications);
                                      }}
                                    />
                                    <label htmlFor={`indication-${indication}`} className="ml-2 block text-sm text-gray-700">{indication}</label>
                                    {indication === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32" 
                                        value={currentReport.appendectomy.preoperative.indicationOther}
                                        onChange={(e) => updateAppendectomy('preoperative', 'indicationOther', e.target.value)}
                                        placeholder="Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                              <Textarea 
                                className="w-full min-h-[100px]"
                                placeholder="Please describe the surgical approach and key procedural steps"
                                value={currentReport.appendectomy?.procedure?.operationDescription || ''}
                                onChange={(e) => updateAppendectomy('procedure', 'operationDescription', e.target.value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>


                    {/* Section IV: Procedure Details */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${activeSection === "section4" ? "bg-blue-50" : ""}`}
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => toggleExpand("section4")}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Procedure Details</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section4 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoAppendectomy('procedure')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoAppendectomy('procedure')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearAppendectomy('procedure')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {expanded.section4 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Surgical Approach:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Open', 'Laparoscopic', 'Converted from Laparoscopic to Open'].map(approach => (
                                  <div className="flex items-center" key={`approach-${approach}`}>
                                    <Checkbox 
                                      id={`approach-${approach}`} 
                                      checked={currentReport.appendectomy?.procedure?.approach?.includes(approach)}
                                      onCheckedChange={(checked) => {
                                        const currentApproach = currentReport.appendectomy?.procedure?.approach || [];
                                        if (checked) {
                                          updateAppendectomy('procedure', 'approach', [...currentApproach, approach]);
                                        } else {
                                          updateAppendectomy('procedure', 'approach', currentApproach.filter(a => a !== approach));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`approach-${approach}`} className="ml-2 block text-sm text-gray-700">{approach}</label>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Reason for Conversion - only show if "Converted from Laparoscopic to Open" is selected */}
                              {currentReport.appendectomy?.procedure?.approach?.includes('Converted from Laparoscopic to Open') && (
                                <div className="mt-3 ml-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Reason for Conversion:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Adhesions', 'Vascular Injury', 'Difficult Visualization', 'Failure to Progress', 'Visceral Injury', 'Difficult Exposure', 'Bleeding', 'Other'].map(reason => (
                                      <div className="flex items-center" key={`conversion-reason-${reason}`}>
                                        <Checkbox 
                                          id={`conversion-reason-${reason}`} 
                                          checked={currentReport.appendectomy?.procedure?.reasonForConversion?.includes && currentReport.appendectomy?.procedure?.reasonForConversion?.includes(reason)}
                                          onCheckedChange={(checked) => {
                                            const currentReasons = Array.isArray(currentReport.appendectomy?.procedure?.reasonForConversion) 
                                              ? currentReport.appendectomy.procedure.reasonForConversion 
                                              : currentReport.appendectomy?.procedure?.reasonForConversion 
                                                ? [currentReport.appendectomy.procedure.reasonForConversion] 
                                                : [];
                                            if (checked) {
                                              updateAppendectomy('procedure', 'reasonForConversion', [...currentReasons, reason]);
                                            } else {
                                              updateAppendectomy('procedure', 'reasonForConversion', currentReasons.filter(r => r !== reason));
                                            }
                                          }}
                                          style={{
                                            accentColor: 'black'
                                          }}
                                        />
                                        <label htmlFor={`conversion-reason-${reason}`} className="ml-2 block text-sm text-gray-700">{reason}</label>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Other text input - only show if "Other" is selected */}
                                  {(Array.isArray(currentReport.appendectomy?.procedure?.reasonForConversion) 
                                    ? currentReport.appendectomy.procedure.reasonForConversion.includes('Other')
                                    : currentReport.appendectomy?.procedure?.reasonForConversion === 'Other') && (
                                    <div className="mt-3 ml-8">
                                      <Input 
                                        type="text" 
                                        className="w-full"
                                        placeholder="Specify Other Conversion Reason"
                                        value={currentReport.appendectomy?.procedure?.reasonForConversionOther || ''}
                                        onChange={(e) => updateAppendectomy('procedure', 'reasonForConversionOther', e.target.value)}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Incision Type - only show if "Open" approach is selected */}
                            {currentReport.appendectomy?.procedure?.approach?.includes('Open') && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Incision Type:</p>
                                <div className="flex flex-wrap gap-4 ml-4">
                                  {['McBurney', 'Lanz', 'Midline', 'Other'].map(incision => (
                                    <div className="flex items-center" key={`incision-${incision}`}>
                                      <Checkbox 
                                        id={`incision-${incision}`} 
                                        checked={currentReport.appendectomy?.procedure?.incisionType?.includes(incision)}
                                        onCheckedChange={(checked) => {
                                          const currentIncisions = currentReport.appendectomy?.procedure?.incisionType || [];
                                          if (checked) {
                                            updateAppendectomy('procedure', 'incisionType', [...currentIncisions, incision]);
                                          } else {
                                            updateAppendectomy('procedure', 'incisionType', currentIncisions.filter(i => i !== incision));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`incision-${incision}`} className="ml-2 block text-sm text-gray-700">{incision}</label>
                                      {incision === 'Other' && (
                                        <Input 
                                          type="text" 
                                          className="ml-2 w-32"
                                          value={currentReport.appendectomy?.procedure?.incisionOther || ''}
                                          onChange={(e) => updateAppendectomy('procedure', 'incisionOther', e.target.value)}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Trocar Number - only show if "Laparoscopic" or "Converted from Laparoscopic to Open" approach is selected */}
                            {(currentReport.appendectomy?.procedure?.approach?.includes('Laparoscopic') || 
                              currentReport.appendectomy?.procedure?.approach?.includes('Converted from Laparoscopic to Open')) && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Trocar Number:</p>
                                <Input 
                                  type="text" 
                                  className="ml-4 w-full"
                                  placeholder="Enter trocar number"
                                  value={currentReport.appendectomy?.procedure?.trocarPlacement || ''}
                                  onChange={(e) => updateAppendectomy('procedure', 'trocarPlacement', e.target.value)}
                                />
                              </div>
                            )}

                            {/* Interactive Body Diagram */}
                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Access and Ports</h3>
                              
                              {/* Legend/Key */}
                              <div className="mb-4 sm:ml-4">
                                <div className="bg-gray-50 p-3 rounded border">
                                  <h4 className="font-medium text-gray-700 text-sm mb-2">Legend:</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-0.5 bg-black"></div>
                                      <span>Ports (with size label)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-amber-500 rounded-full" style={{borderStyle: 'dashed'}}></div>
                                      <span>Ileostomy (dashed yellow circle)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-green-600 rounded-full"></div>
                                      <span>Colostomy (solid green circle)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-0.5 bg-red-900" style={{backgroundImage: 'repeating-linear-gradient(90deg, #7f1d1d 0, #7f1d1d 4px, transparent 4px, transparent 8px)'}}></div>
                                      <span>Incisions (dashed dark red line)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="sm:ml-4">
                                <ConditionalDiagramDisplay
                                  selectedProcedures={['Appendectomy']}
                                  onGastroscopyUpdate={() => {}}
                                  onColonoscopyUpdate={(data) => {
                                    // Handle appendicectomy diagram updates here
                                    console.log('Appendicectomy diagram update:', data);
                                  }}
                                  onProcedureFindingsUpdate={(data) => {
                                    // Store surgical markings in appendectomy procedureFindings
                                    updateAppendectomy('procedureFindings', 'findings', data.findings);
                                    updateAppendectomy('procedureFindings', 'additionalNotes', data.additionalNotes || '');
                                  }}
                                  currentProcedureFindings={currentReport.appendectomy?.procedureFindings || { findings: '', additionalNotes: '' }}
                                  customImage={appendectomyImage}
                                  diagramMarkingScale={1.5}
                                />
                              </div>
                            </div>

                            {/* Intraoperative Findings - moved from Section III */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Operation Findings:</p>
                              <Input 
                                type="text" 
                                className="ml-4 w-full"
                                value={(currentReport.appendectomy?.intraoperative as any)?.operationFindings || ''}
                                onChange={(e) => updateAppendectomy('intraoperative', 'operationFindings', e.target.value)}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Appendix Appearance:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Normal', 'Inflamed', 'Gangrenous', 'Perforated'].map(appearance => (
                                  <div className="flex items-center" key={`appearance-${appearance}`}>
                                    <Checkbox 
                                      id={`appearance-${appearance}`} 
                                      checked={currentReport.appendectomy.intraoperative.appendixAppearance.includes(appearance)}
                                      onCheckedChange={(checked) => {
                                        const currentAppearances = currentReport.appendectomy.intraoperative.appendixAppearance;
                                        const newAppearances = checked 
                                          ? [...currentAppearances, appearance]
                                          : currentAppearances.filter(a => a !== appearance);
                                        updateAppendectomy('intraoperative', 'appendixAppearance', newAppearances);
                                      }}
                                    />
                                    <label htmlFor={`appearance-${appearance}`} className="ml-2 block text-sm text-gray-700">{appearance}</label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Presence of Abscess:</p>
                              <div className="flex space-x-4 ml-4">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="abscess-yes" 
                                    checked={currentReport.appendectomy?.intraoperative?.abscess === 'Yes'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('intraoperative', 'abscess', 'Yes');
                                      }
                                    }}
                                  />
                                  <label htmlFor="abscess-yes" className="ml-2 block text-sm text-gray-700">Yes</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="abscess-no" 
                                    checked={currentReport.appendectomy?.intraoperative?.abscess === 'No'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('intraoperative', 'abscess', 'No');
                                      }
                                    }}
                                  />
                                  <label htmlFor="abscess-no" className="ml-2 block text-sm text-gray-700">No</label>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Presence of Peritonitis:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['None', 'Localized', 'Generalized'].map(peritonitis => (
                                  <div className="flex items-center" key={`peritonitis-${peritonitis}`}>
                                    <Checkbox 
                                      id={`peritonitis-${peritonitis}`} 
                                      checked={currentReport.appendectomy?.intraoperative?.peritonitis?.includes(peritonitis)}
                                      onCheckedChange={(checked) => {
                                        const currentPeritonitis = currentReport.appendectomy?.intraoperative?.peritonitis || [];
                                        if (checked) {
                                          updateAppendectomy('intraoperative', 'peritonitis', [...currentPeritonitis, peritonitis]);
                                        } else {
                                          updateAppendectomy('intraoperative', 'peritonitis', currentPeritonitis.filter(p => p !== peritonitis));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`peritonitis-${peritonitis}`} className="ml-2 block text-sm text-gray-700">{peritonitis}</label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Other Intra-abdominal Findings:</p>
                              <Input 
                                type="text" 
                                className="ml-4 w-full"
                                value={currentReport.appendectomy?.intraoperative?.otherFindings || ''}
                                onChange={(e) => updateAppendectomy('intraoperative', 'otherFindings', e.target.value)}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Direction of Dissection:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Antigrade', 'Retrograde', 'Other'].map(direction => (
                                  <div className="flex items-center" key={`direction-${direction}`}>
                                    <Checkbox
                                      id={`direction-${direction}`}
                                      checked={(currentReport.appendectomy?.procedure as any)?.directionOfDissection?.includes(direction)}
                                      onCheckedChange={(checked) => {
                                        const currentDirections = ((currentReport.appendectomy?.procedure as any)?.directionOfDissection || []);
                                        if (checked) {
                                          updateAppendectomy('procedure', 'directionOfDissection', [...currentDirections, direction]);
                                        } else {
                                          updateAppendectomy('procedure', 'directionOfDissection', currentDirections.filter((d: string) => d !== direction));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`direction-${direction}`} className="ml-2 block text-sm text-gray-700">{direction}</label>
                                    {direction === 'Other' && (currentReport.appendectomy?.procedure as any)?.directionOfDissection?.includes('Other') && (
                                      <Input
                                        type="text"
                                        className="ml-2 w-32"
                                        value={(currentReport.appendectomy?.procedure as any)?.directionOfDissectionOther || ''}
                                        onChange={(e) => updateAppendectomy('procedure', 'directionOfDissectionOther', e.target.value)}
                                        placeholder="Please Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Meso -Appendix Excision:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['None', 'Complete', 'Partial'].map(excision => (
                                  <div className="flex items-center" key={`mesoExcision-${excision}`}>
                                    <Checkbox
                                      id={`mesoExcision-${excision}`}
                                      checked={(currentReport.appendectomy?.procedure as any)?.mesoAppendixExcision?.includes(excision)}
                                      onCheckedChange={(checked) => {
                                        const currentExcision = ((currentReport.appendectomy?.procedure as any)?.mesoAppendixExcision || []);
                                        if (checked) {
                                          updateAppendectomy('procedure', 'mesoAppendixExcision', [...currentExcision, excision]);
                                        } else {
                                          updateAppendectomy('procedure', 'mesoAppendixExcision', currentExcision.filter((m: string) => m !== excision));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`mesoExcision-${excision}`} className="ml-2 block text-sm text-gray-700">{excision}</label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Method of Appendiceal Ligation:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Stapler', 'Hemoloc', 'Endoloop', 'Tie', 'Energy device', 'Diathermy', 'Other'].map(method => (
                                  <div className="flex items-center" key={`division-${method}`}>
                                    <Checkbox 
                                      id={`division-${method}`} 
                                      checked={currentReport.appendectomy?.procedure?.divisionMethod?.includes(method)}
                                      onCheckedChange={(checked) => {
                                        const currentMethods = currentReport.appendectomy?.procedure?.divisionMethod || [];
                                        if (checked) {
                                          updateAppendectomy('procedure', 'divisionMethod', [...currentMethods, method]);
                                        } else {
                                          updateAppendectomy('procedure', 'divisionMethod', currentMethods.filter(m => m !== method));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`division-${method}`} className="ml-2 block text-sm text-gray-700">{method}</label>
                                    {method === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.procedure?.divisionOther || ''}
                                        onChange={(e) => updateAppendectomy('procedure', 'divisionOther', e.target.value)}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Method of Appendiceal Vessel Ligation:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Ligature', 'Energy Device', 'Stapler', 'Diathermy', 'Other'].map(control => (
                                  <div className="flex items-center" key={`mesentery-${control}`}>
                                    <Checkbox 
                                      id={`mesentery-${control}`} 
                                      checked={currentReport.appendectomy?.procedure?.mesenteryControl?.includes(control)}
                                      onCheckedChange={(checked) => {
                                        const currentControls = currentReport.appendectomy?.procedure?.mesenteryControl || [];
                                        if (checked) {
                                          updateAppendectomy('procedure', 'mesenteryControl', [...currentControls, control]);
                                        } else {
                                          updateAppendectomy('procedure', 'mesenteryControl', currentControls.filter(c => c !== control));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`mesentery-${control}`} className="ml-2 block text-sm text-gray-700">{control}</label>
                                    {control === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.procedure?.mesenteryOther || ''}
                                        onChange={(e) => updateAppendectomy('procedure', 'mesenteryOther', e.target.value)}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Removal of Appendix:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Through Port', 'Endo bag', 'Through Wound', 'Other'].map(removal => (
                                  <div className="flex items-center" key={`removal-${removal}`}>
                                    <Checkbox
                                      id={`removal-${removal}`}
                                      checked={(currentReport.appendectomy?.procedure as any)?.removalOfAppendix?.includes(removal)}
                                      onCheckedChange={(checked) => {
                                        const currentRemoval = ((currentReport.appendectomy?.procedure as any)?.removalOfAppendix || []);
                                        if (checked) {
                                          updateAppendectomy('procedure', 'removalOfAppendix', [...currentRemoval, removal]);
                                        } else {
                                          updateAppendectomy('procedure', 'removalOfAppendix', currentRemoval.filter((r: string) => r !== removal));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`removal-${removal}`} className="ml-2 block text-sm text-gray-700">{removal}</label>
                                    {removal === 'Other' && (currentReport.appendectomy?.procedure as any)?.removalOfAppendix?.includes('Other') && (
                                      <Input
                                        type="text"
                                        className="ml-2 w-32"
                                        value={(currentReport.appendectomy?.procedure as any)?.removalOfAppendixOther || ''}
                                        onChange={(e) => updateAppendectomy('procedure', 'removalOfAppendixOther', e.target.value)}
                                        placeholder="Please Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Peritoneal Lavage:</p>
                              <div className="flex space-x-4 ml-4">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="lavage-yes" 
                                    checked={currentReport.appendectomy?.procedure?.lavage === 'Yes'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('procedure', 'lavage', 'Yes');
                                      }
                                    }}
                                  />
                                  <label htmlFor="lavage-yes" className="ml-2 block text-sm text-gray-700">Yes</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="lavage-no" 
                                    checked={currentReport.appendectomy?.procedure?.lavage === 'No'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('procedure', 'lavage', 'No');
                                      }
                                    }}
                                  />
                                  <label htmlFor="lavage-no" className="ml-2 block text-sm text-gray-700">No</label>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Drain Placement:</p>
                              <div className="flex items-center ml-4">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="drain-yes" 
                                    checked={currentReport.appendectomy?.procedure?.drainPlacement === 'Yes'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('procedure', 'drainPlacement', 'Yes');
                                      }
                                    }}
                                  />
                                  <label htmlFor="drain-yes" className="ml-2 block text-sm text-gray-700">Yes (Location:</label>
                                  <Input 
                                    type="text" 
                                    className="ml-2 w-32"
                                    value={currentReport.appendectomy?.procedure?.drainLocation || ''}
                                    onChange={(e) => updateAppendectomy('procedure', 'drainLocation', e.target.value)}
                                  />
                                  <label htmlFor="drain-yes" className="ml-2 block text-sm text-gray-700">)</label>
                                </div>
                                <div className="flex items-center ml-4">
                                  <Checkbox 
                                    id="drain-no" 
                                    checked={currentReport.appendectomy?.procedure?.drainPlacement === 'No'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('procedure', 'drainPlacement', 'No');
                                      }
                                    }}
                                  />
                                  <label htmlFor="drain-no" className="ml-2 block text-sm text-gray-700">No</label>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Intra-Operative Difficulty:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['None', 'Adhesions', 'Bleeding', 'Inflammation', 'Phlegmon', 'Fibrosis', 'Retro-Caecal/Retro-Colic Appendix', 'Other'].map(difficulty => (
                                  <div className="flex items-center" key={`difficulty-${difficulty}`}>
                                    <Checkbox 
                                      id={`difficulty-${difficulty}`} 
                                      checked={currentReport.appendectomy?.closure?.operativeDifficulty?.includes(difficulty)}
                                      onCheckedChange={(checked) => {
                                        const currentDifficulties = currentReport.appendectomy?.closure?.operativeDifficulty || [];
                                        if (checked) {
                                          updateAppendectomy('closure', 'operativeDifficulty', [...currentDifficulties, difficulty]);
                                        } else {
                                          updateAppendectomy('closure', 'operativeDifficulty', currentDifficulties.filter(d => d !== difficulty));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`difficulty-${difficulty}`} className="ml-2 block text-sm text-gray-700">{difficulty}</label>
                                    {difficulty === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.operativeDifficultyOther || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'operativeDifficultyOther', e.target.value)}
                                        placeholder="Please Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Intra-Operative Complications:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['None', 'Bleeding', 'Serosal Tear', 'Bowel Perforation', 'Visceral Injury', 'Other'].map(complication => (
                                  <div className="flex items-center" key={`complication-${complication}`}>
                                    <Checkbox 
                                      id={`complication-${complication}`} 
                                      checked={currentReport.appendectomy?.closure?.complications?.includes(complication)}
                                      onCheckedChange={(checked) => {
                                        const currentComplications = currentReport.appendectomy?.closure?.complications || [];
                                        if (checked) {
                                          updateAppendectomy('closure', 'complications', [...currentComplications, complication]);
                                        } else {
                                          updateAppendectomy('closure', 'complications', currentComplications.filter(c => c !== complication));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`complication-${complication}`} className="ml-2 block text-sm text-gray-700">{complication}</label>
                                    {complication === 'Visceral Injury' && currentReport.appendectomy?.closure?.complications?.includes('Visceral Injury') && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.visceralInjuryDetail || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'visceralInjuryDetail', e.target.value)}
                                        placeholder="Specify Viscera Injured"
                                      />
                                    )}
                                    {complication === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.complicationOther || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'complicationOther', e.target.value)}
                                        placeholder="Please Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>

                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section V: Closure and Complications */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${activeSection === "section5" ? "bg-blue-50" : ""}`}
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => toggleExpand("section5")}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Closure</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section5 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoAppendectomy('closure')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoAppendectomy('closure')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearAppendectomy('closure')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {expanded.section5 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['None', '5mm', '10/11mm', '12mm', '15mm', 'Access Incision', 'Other'].map(closure => (
                                  <div className="flex items-center" key={`fascial-${closure}`}>
                                    <Checkbox 
                                      id={`fascial-${closure}`} 
                                      checked={currentReport.appendectomy?.closure?.fascialClosure?.includes(closure)}
                                      onCheckedChange={(checked) => {
                                        const currentClosures = currentReport.appendectomy?.closure?.fascialClosure || [];
                                        if (checked) {
                                          updateAppendectomy('closure', 'fascialClosure', [...currentClosures, closure]);
                                        } else {
                                          updateAppendectomy('closure', 'fascialClosure', currentClosures.filter(c => c !== closure));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`fascial-${closure}`} className="ml-2 block text-sm text-gray-700">{closure}</label>
                                    {closure === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.fascialClosureOther || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'fascialClosureOther', e.target.value)}
                                        placeholder="Please Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                              {currentReport.appendectomy?.closure?.fascialClosure?.length > 0 && !currentReport.appendectomy?.closure?.fascialClosure?.includes('None') && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2 ml-4">Material Used:</p>
                                  <div className="flex flex-wrap gap-4 ml-8">
                                    {['Nylon', 'Vicryl', 'PDS', 'Maxon', 'Other'].map(material => (
                                      <div className="flex items-center" key={`fascial-material-${material}`}>
                                        <Checkbox 
                                          id={`fascial-material-${material}`} 
                                          checked={currentReport.appendectomy?.closure?.fascialMaterial?.includes(material)}
                                          onCheckedChange={(checked) => {
                                            const currentMaterials = currentReport.appendectomy?.closure?.fascialMaterial || [];
                                            if (checked) {
                                              updateAppendectomy('closure', 'fascialMaterial', [...currentMaterials, material]);
                                            } else {
                                              updateAppendectomy('closure', 'fascialMaterial', currentMaterials.filter(m => m !== material));
                                            }
                                          }}
                                        />
                                        <label htmlFor={`fascial-material-${material}`} className="ml-2 block text-sm text-gray-700">{material}</label>
                                        {material === 'Other' && (
                                          <Input 
                                            type="text" 
                                            className="ml-2 w-32"
                                            value={currentReport.appendectomy?.closure?.fascialMaterialOther || ''}
                                            onChange={(e) => updateAppendectomy('closure', 'fascialMaterialOther', e.target.value)}
                                            placeholder="Please Specify"
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Skin Closure:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Simple Suture', 'Staples', 'Subcuticular Suture', 'Adhesive Strip', 'Tissue Glue', 'Other'].map(closure => (
                                  <div className="flex items-center" key={`skin-${closure}`}>
                                    <Checkbox 
                                      id={`skin-${closure}`} 
                                      checked={currentReport.appendectomy?.closure?.skinClosure?.includes(closure)}
                                      onCheckedChange={(checked) => {
                                        const currentClosures = currentReport.appendectomy?.closure?.skinClosure || [];
                                        if (checked) {
                                          updateAppendectomy('closure', 'skinClosure', [...currentClosures, closure]);
                                        } else {
                                          updateAppendectomy('closure', 'skinClosure', currentClosures.filter(c => c !== closure));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`skin-${closure}`} className="ml-2 block text-sm text-gray-700">{closure}</label>
                                    {closure === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.skinOther || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'skinOther', e.target.value)}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Material Used - only show when suture options are selected */}
                            {(currentReport.appendectomy?.closure?.skinClosure?.includes('Simple Suture') || 
                              currentReport.appendectomy?.closure?.skinClosure?.includes('Subcuticular Suture')) && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Material Used:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Nylon', 'Monocryl', 'Vicryl', 'V-Loc', 'Other'].map(material => (
                                  <div className="flex items-center" key={`skin-material-${material}`}>
                                    <Checkbox 
                                      id={`skin-material-${material}`} 
                                      checked={currentReport.appendectomy?.closure?.skinMaterial?.includes(material)}
                                      onCheckedChange={(checked) => {
                                        const currentMaterials = currentReport.appendectomy?.closure?.skinMaterial || [];
                                        if (checked) {
                                          updateAppendectomy('closure', 'skinMaterial', [...currentMaterials, material]);
                                        } else {
                                          updateAppendectomy('closure', 'skinMaterial', currentMaterials.filter(m => m !== material));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`skin-material-${material}`} className="ml-2 block text-sm text-gray-700">{material}</label>
                                    {material === 'Other' && (
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.skinMaterialOther || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'skinMaterialOther', e.target.value)}
                                        placeholder="Please Specify"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            )}

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Specimen</h3>
                              <div className="space-y-4 ml-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Appendix Sent for Pathology:</p>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="path-yes" 
                                        checked={currentReport.appendectomy?.closure?.pathology === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateAppendectomy('closure', 'pathology', 'Yes');
                                          }
                                        }}
                                      />
                                      <label htmlFor="path-yes" className="ml-2 block text-sm text-gray-700">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="path-no" 
                                        checked={currentReport.appendectomy?.closure?.pathology === 'No'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateAppendectomy('closure', 'pathology', 'No');
                                          }
                                        }}
                                      />
                                      <label htmlFor="path-no" className="ml-2 block text-sm text-gray-700">No</label>
                                    </div>
                                  </div>
                                </div>

                                {currentReport.appendectomy?.closure?.pathology === 'Yes' && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Please Specify Laboratory Sent to:</p>
                                    <Input
                                      type="text"
                                      placeholder="Enter laboratory name"
                                      className="w-full"
                                      value={currentReport.appendectomy?.closure?.laboratoryName || ''}
                                      onChange={(e) => updateAppendectomy('closure', 'laboratoryName', e.target.value)}
                                    />
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Other Specimens Taken:</p>
                                  <div className="flex items-center">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="spec-yes" 
                                        checked={currentReport.appendectomy?.closure?.otherSpecimens === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateAppendectomy('closure', 'otherSpecimens', 'Yes');
                                          }
                                        }}
                                      />
                                      <label htmlFor="spec-yes" className="ml-2 block text-sm text-gray-700">Yes (Specify:</label>
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32"
                                        value={currentReport.appendectomy?.closure?.specimenDetails || ''}
                                        onChange={(e) => updateAppendectomy('closure', 'specimenDetails', e.target.value)}
                                      />
                                      <label htmlFor="spec-yes" className="ml-2 block text-sm text-gray-700">)</label>
                                    </div>
                                    <div className="flex items-center ml-4">
                                      <Checkbox 
                                        id="spec-no" 
                                        checked={currentReport.appendectomy?.closure?.otherSpecimens === 'No'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateAppendectomy('closure', 'otherSpecimens', 'No');
                                          }
                                        }}
                                      />
                                      <label htmlFor="spec-no" className="ml-2 block text-sm text-gray-700">No</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Additional Notes */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5 text-gray-600" />
                          Additional Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Textarea
                              placeholder="Enter any additional notes..."
                              className="w-full"
                              rows={4}
                              value={currentReport.appendectomy?.closure?.additionalNotes || ''}
                              onChange={(e) => updateAppendectomy('closure', 'additionalNotes', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Post Operative Management */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <ClipboardList className="h-5 w-5 text-gray-600" />
                          Post Operative Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Textarea
                              placeholder="Enter post operative management instructions..."
                              className="w-full"
                              rows={4}
                              value={currentReport.appendectomy?.closure?.postOperativeManagement || ''}
                              onChange={(e) => updateAppendectomy('closure', 'postOperativeManagement', e.target.value)}
                            />
                          </div>
                          
                          {/* Surgeon's Signature Section - moved under Post Operative Management */}
                          <div className="border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Surgeon's Signature:</p>
                                <div className="space-y-2">
                                  <Input 
                                    type="text" 
                                    placeholder="Type signature name or leave blank to upload"
                                    className="w-full"
                                    value={currentReport.appendectomy?.closure?.surgeonSignatureText || ''}
                                    onChange={(e) => updateAppendectomy('closure', 'surgeonSignatureText', e.target.value)}
                                  />
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          updateAppendectomy('closure', 'surgeonSignature', reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <p className="text-xs text-gray-500">Upload signature or stamp (Image/PDF)</p>
                                  {currentReport.appendectomy?.closure?.surgeonSignature && (
                                    <div className="space-y-1">
                                      <p className="text-xs text-green-600">✓ Signature uploaded</p>
                                      <div className="border rounded p-2 bg-gray-50">
                                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                                        <img 
                                          src={currentReport.appendectomy.closure.surgeonSignature} 
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
                                  <DateTime24HourInput
                                    className="w-full"
                                    onChange={(value) => updateAppendectomy('closure', 'dateTime', value)}
                                    value={currentReport.appendectomy?.closure?.dateTime || getLocalDateTimeValue()}
                                  />
                                  <p className="text-xs text-gray-500">Display format: DD-MM-YYYY HH:MM</p>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs px-2 py-1"
                                    onClick={() => {
                                      updateAppendectomy('closure', 'dateTime', getLocalDateTimeValue());
                                    }}
                                  >
                                    Set Current Date/Time
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-wrap justify-center gap-3 mt-8 mb-12">
                      <Button 
                        className="px-6 py-3 glass-button text-md"
                        onClick={() => {
                          setCurrentTab('appendectomy');
                          handleExportPDF();
                        }}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Print/Export PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="px-6 py-3 glass-button text-md"
                        onClick={handleSaveCurrentTemplateRecord}
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Save Patient
                      </Button>
                      <Button
                        variant="destructive"
                        className="px-6 py-3 text-md"
                        onClick={clearAllAppendectomyData}
                        title="Clear all appendectomy data"
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Clear All Data
                      </Button>
                    </div>
                    </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of appendectomy findings</span>
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div ref={reportPreviewRef}>
                            <AppendectomyReportPreview 
                              report={currentReport}
                              onEditAppendectomyField={updateAppendectomy}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  </TabsContent>
                  
                  <TabsContent value="hernia" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                    {/* Left Column - Ventral Hernia Form */}
                    <div className="2xl:col-span-1 space-y-6">
                    {/* Header with title and actions */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                              Synoptic Operative Report – Ventral Hernia Repair
                            </h1>
                          </div>
                          <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="glass-button text-xs"
                                  onClick={() => {
                                    handleExportPDF('ventralHernia');
                                  }}
                                  disabled={isGeneratingPDF}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {isGeneratingPDF ? 'Generating...' : 'Print/Export PDF'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={handleSaveCurrentTemplateRecord}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Patient
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="glass-button text-xs"
                                  onClick={clearAllVentralHerniaData}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Clear All Data
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Section I: Patient Information */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${herniaActiveSection === "section1" ? "bg-green-50" : ""}`}
                      >
                        <div 
                          className="flex items-center flex-1"
                          onClick={() => {
                            setHerniaExpanded(prev => ({ ...prev, section1: !prev.section1 }));
                            if (!herniaExpanded.section1) {
                              setHerniaActiveSection("section1");
                            }
                          }}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ml-2 ${herniaExpanded.section1 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoVentralHernia('patientInfo')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoVentralHernia('patientInfo')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearVentralHernia('patientInfo')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {herniaExpanded.section1 && (
                        <CardContent className="px-6 py-4">
	                          <PatientInfoFields
	                            patientInfo={currentReport.ventralHernia?.patientInfo}
	                            onFieldChange={(field, value) =>
	                              updateVentralHernia("patientInfo", field, value)
	                            }
	                            onBulkUpdate={updateVentralHerniaPatientInfoBulk}
	                            currentExtractedPatientInfo={currentExtractedPatientInfo}
	                            onCurrentPatientChange={updateCurrentExtractedPatient}
                              useDashDateInputs
                              use24HourTimeInputs
	                          />
                        </CardContent>
                      )}
                    </Card>

                    {/* Section II: Preoperative Information */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${herniaActiveSection === "section2" ? "bg-green-50" : ""}`}
                      >
                        <div 
                          className="flex items-center flex-1"
                          onClick={() => {
                            setHerniaExpanded(prev => ({ ...prev, section2: !prev.section2 }));
                            if (!herniaExpanded.section2) {
                              setHerniaActiveSection("section2");
                            }
                          }}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Preoperative Information</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ml-2 ${herniaExpanded.section2 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoVentralHernia('preoperative')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoVentralHernia('preoperative')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearVentralHernia('preoperative')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {herniaExpanded.section2 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Surgeon:</label>
                                <div className="space-y-2">
                                  {(currentReport.ventralHernia?.preoperative?.surgeons || ['']).map((surgeon, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input 
                                        className="flex-1" 
                                        type="text" 
                                        placeholder="Enter Surgeon Name"
                                        value={surgeon}
                                        onChange={(e) => {
                                          const newSurgeons = [...(currentReport.ventralHernia?.preoperative?.surgeons || [''])];
                                          newSurgeons[index] = e.target.value;
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            preoperative: {
                                              ...currentReport.ventralHernia?.preoperative,
                                              surgeons: newSurgeons
                                            }
                                          });
                                        }}
                                      />
                                      {index === (currentReport.ventralHernia?.preoperative?.surgeons || ['']).length - 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1"
                                          onClick={() => {
                                            const currentSurgeons = currentReport.ventralHernia?.preoperative?.surgeons || [''];
                                            const newSurgeons = [...currentSurgeons, ''];
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              preoperative: {
                                                ...currentReport.ventralHernia?.preoperative,
                                                surgeons: newSurgeons
                                              }
                                            });
                                          }}
                                        >
                                          +
                                        </Button>
                                      )}
                                      {(currentReport.ventralHernia?.preoperative?.surgeons || ['']).length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            const currentSurgeons = currentReport.ventralHernia?.preoperative?.surgeons || [''];
                                            const newSurgeons = currentSurgeons.filter((_, i) => i !== index);
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              preoperative: {
                                                ...currentReport.ventralHernia?.preoperative,
                                                surgeons: newSurgeons
                                              }
                                            });
                                          }}
                                        >
                                          −
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Assistant:</label>
                                <div className="space-y-2">
                                  {(currentReport.ventralHernia?.preoperative?.assistants || ['']).map((assistant, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input 
                                        className="flex-1" 
                                        type="text" 
                                        placeholder="Enter Assistant Name"
                                        value={assistant}
                                        onChange={(e) => {
                                          const newAssistants = [...(currentReport.ventralHernia?.preoperative?.assistants || [''])];
                                          newAssistants[index] = e.target.value;
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            preoperative: {
                                              ...currentReport.ventralHernia?.preoperative,
                                              assistants: newAssistants
                                            }
                                          });
                                        }}
                                      />
                                      {index === (currentReport.ventralHernia?.preoperative?.assistants || ['']).length - 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1"
                                          onClick={() => {
                                            const currentAssistants = currentReport.ventralHernia?.preoperative?.assistants || [''];
                                            const newAssistants = [...currentAssistants, ''];
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              preoperative: {
                                                ...currentReport.ventralHernia?.preoperative,
                                                assistants: newAssistants
                                              }
                                            });
                                          }}
                                        >
                                          +
                                        </Button>
                                      )}
                                      {(currentReport.ventralHernia?.preoperative?.assistants || ['']).length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            const currentAssistants = currentReport.ventralHernia?.preoperative?.assistants || [''];
                                            const newAssistants = currentAssistants.filter((_, i) => i !== index);
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              preoperative: {
                                                ...currentReport.ventralHernia?.preoperative,
                                                assistants: newAssistants
                                              }
                                            });
                                          }}
                                        >
                                          −
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Anaesthetist:</label>
                                <div className="space-y-2">
                                  {(currentReport.ventralHernia?.preoperative?.anaesthetists || ['']).map((anaesthetist, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                      <Input 
                                        className="flex-1" 
                                        type="text" 
                                        placeholder="Enter Anaesthetist name"
                                        value={anaesthetist}
                                        onChange={(e) => {
                                          const currentAnaesthetists = currentReport.ventralHernia?.preoperative?.anaesthetists || [''];
                                          const newAnaesthetists = [...currentAnaesthetists];
                                          newAnaesthetists[index] = e.target.value;
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            preoperative: {
                                              ...currentReport.ventralHernia?.preoperative,
                                              anaesthetists: newAnaesthetists
                                            }
                                          });
                                        }}
                                      />
                                      {index === (currentReport.ventralHernia?.preoperative?.anaesthetists || ['']).length - 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1"
                                          onClick={() => {
                                            const currentAnaesthetists = currentReport.ventralHernia?.preoperative?.anaesthetists || [''];
                                            const newAnaesthetists = [...currentAnaesthetists, ''];
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              preoperative: {
                                                ...currentReport.ventralHernia?.preoperative,
                                                anaesthetists: newAnaesthetists
                                              }
                                            });
                                          }}
                                        >
                                          +
                                        </Button>
                                      )}
                                      {(currentReport.ventralHernia?.preoperative?.anaesthetists || ['']).length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            const currentAnaesthetists = currentReport.ventralHernia?.preoperative?.anaesthetists || [''];
                                            const newAnaesthetists = currentAnaesthetists.filter((_, i) => i !== index);
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              preoperative: {
                                                ...currentReport.ventralHernia?.preoperative,
                                                anaesthetists: newAnaesthetists
                                              }
                                            });
                                          }}
                                        >
                                          −
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Procedure Urgency:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Emergency', 'Semi-Emergency', 'Semi-Elective', 'Elective'].map((urgency) => (
                                  <div className="flex items-center" key={`ventral-urgency-${urgency}`}>
                                    <Checkbox
                                      id={`ventral-urgency-${urgency}`}
                                      checked={((currentReport.ventralHernia?.preoperative as any)?.procedureUrgency || []).includes(urgency)}
                                      onCheckedChange={(checked) => {
                                        const currentUrgency = ((currentReport.ventralHernia?.preoperative as any)?.procedureUrgency || []);
                                        const updated = checked ? [...currentUrgency, urgency] : currentUrgency.filter((u: string) => u !== urgency);
                                        updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          preoperative: {
                                            ...currentReport.ventralHernia?.preoperative,
                                            procedureUrgency: updated
                                          }
                                        });
                                      }}
                                    />
                                    <label htmlFor={`ventral-urgency-${urgency}`} className="ml-2 block text-sm text-gray-700">{urgency}</label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Preoperative Imaging:</p>
                              <div className="space-y-2 ml-4">
                                {['None', 'Ultrasound', 'CT Scan', 'MRI'].map(imaging => (
                                  <div className="flex items-center" key={`hernia-imaging-${imaging}`}>
                                    <Checkbox 
                                      id={`hernia-imaging-${imaging}`}
                                      checked={currentReport.ventralHernia?.preoperative?.imaging?.includes(imaging) || false}
                                      onCheckedChange={(checked) => {
                                        const currentImaging = currentReport.ventralHernia?.preoperative?.imaging || [];
                                        let newImaging;
                                        if (checked) {
                                          newImaging = [...currentImaging, imaging];
                                        } else {
                                          newImaging = currentImaging.filter(i => i !== imaging);
                                        }
                                        updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          preoperative: {
                                            ...currentReport.ventralHernia?.preoperative,
                                            imaging: newImaging
                                          }
                                        });
                                      }}
                                    />
                                    <label htmlFor={`hernia-imaging-${imaging}`} className="ml-2 block text-sm text-gray-700">{imaging}</label>
                                  </div>
                                ))}
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="hernia-imaging-other"
                                    checked={currentReport.ventralHernia?.preoperative?.imaging?.includes('Other') || false}
                                    onCheckedChange={(checked) => {
                                      const currentImaging = currentReport.ventralHernia?.preoperative?.imaging || [];
                                      let newImaging;
                                      if (checked) {
                                        newImaging = [...currentImaging, 'Other'];
                                      } else {
                                        newImaging = currentImaging.filter(i => i !== 'Other');
                                      }
                                      updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        preoperative: {
                                          ...currentReport.ventralHernia?.preoperative,
                                          imaging: newImaging
                                        }
                                      });
                                    }}
                                  />
                                  <label htmlFor="hernia-imaging-other" className="ml-2 block text-sm text-gray-700">Other:</label>
                                  <Input 
                                    type="text" 
                                    className="ml-2 w-48" 
                                    placeholder="Specify other imaging"
                                    value={currentReport.ventralHernia?.preoperative?.imagingOther || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      preoperative: {
                                        ...currentReport.ventralHernia?.preoperative,
                                        imagingOther: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Duration of operation with Start/End times - moved here after Preoperative Imaging */}
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Duration of operation (min):</label>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-gray-600">Start Time</label>
                                  <Time24HourInput
                                    className="w-full"
                                    hourAriaLabel="Ventral hernia start hour"
                                    minuteAriaLabel="Ventral hernia start minute"
                                    value={currentReport.ventralHernia?.preoperative?.startTime || ''}
                                    onChange={(startTime) => {
                                      const endTime = currentReport.ventralHernia?.preoperative?.endTime || '';
                                      let duration = currentReport.ventralHernia?.preoperative?.duration || '';
                                      
                                      // Auto-calculate duration if both start and end times are set
                                      if (startTime && endTime) {
                                        const [sh, sm] = startTime.split(':').map(Number);
                                        const [eh, em] = endTime.split(':').map(Number);
                                        let minutes = (eh * 60 + em) - (sh * 60 + sm);
                                        if (minutes < 0) minutes += 24 * 60; // Handle cross-midnight
                                        duration = String(minutes);
                                      }
                                      
                                      updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        preoperative: {
                                          ...currentReport.ventralHernia?.preoperative,
                                          startTime: startTime,
                                          duration: duration
                                        }
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">End Time</label>
                                  <Time24HourInput
                                    className="w-full"
                                    hourAriaLabel="Ventral hernia end hour"
                                    minuteAriaLabel="Ventral hernia end minute"
                                    value={currentReport.ventralHernia?.preoperative?.endTime || ''}
                                    onChange={(endTime) => {
                                      const startTime = currentReport.ventralHernia?.preoperative?.startTime || '';
                                      let duration = currentReport.ventralHernia?.preoperative?.duration || '';
                                      
                                      // Auto-calculate duration if both start and end times are set
                                      if (startTime && endTime) {
                                        const [sh, sm] = startTime.split(':').map(Number);
                                        const [eh, em] = endTime.split(':').map(Number);
                                        let minutes = (eh * 60 + em) - (sh * 60 + sm);
                                        if (minutes < 0) minutes += 24 * 60; // Handle cross-midnight
                                        duration = String(minutes);
                                      }
                                      
                                      updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        preoperative: {
                                          ...currentReport.ventralHernia?.preoperative,
                                          endTime: endTime,
                                          duration: duration
                                        }
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">Total Duration (min)</label>
                                  <Input
                                    type="number"
                                    value={currentReport.ventralHernia?.preoperative?.duration || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      preoperative: {
                                        ...currentReport.ventralHernia?.preoperative,
                                        duration: e.target.value
                                      }
                                    })}
                                    placeholder="Total (min)"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Indication for Surgery:</p>
                              <div className="space-y-2 ml-4">
                                {['Symptomatic Primary Ventral Hernia', 'Symptomatic Incisional Hernia', 'Recurrent Hernia', 'Incarceration'].map(indication => (
                                  <div className="flex items-center" key={`hernia-indication-${indication}`}>
                                    <Checkbox 
                                      id={`hernia-indication-${indication}`}
                                      checked={currentReport.ventralHernia?.preoperative?.indication?.includes(indication) || false}
                                      onCheckedChange={(checked) => {
                                        const currentIndications = currentReport.ventralHernia?.preoperative?.indication || [];
                                        let newIndications;
                                        if (checked) {
                                          newIndications = [...currentIndications, indication];
                                        } else {
                                          newIndications = currentIndications.filter(i => i !== indication);
                                        }
                                        updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          preoperative: {
                                            ...currentReport.ventralHernia?.preoperative,
                                            indication: newIndications
                                          }
                                        });
                                      }}
                                    />
                                    <label htmlFor={`hernia-indication-${indication}`} className="ml-2 block text-sm text-gray-700">{indication}</label>
                                  </div>
                                ))}
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="hernia-indication-other"
                                    checked={currentReport.ventralHernia?.preoperative?.indication?.includes('Other') || false}
                                    onCheckedChange={(checked) => {
                                      const currentIndications = currentReport.ventralHernia?.preoperative?.indication || [];
                                      let newIndications;
                                      if (checked) {
                                        newIndications = [...currentIndications, 'Other'];
                                      } else {
                                        newIndications = currentIndications.filter(i => i !== 'Other');
                                      }
                                      updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        preoperative: {
                                          ...currentReport.ventralHernia?.preoperative,
                                          indication: newIndications
                                        }
                                      });
                                    }}
                                  />
                                  <label htmlFor="hernia-indication-other" className="ml-2 block text-sm text-gray-700">Other:</label>
                                  <Input 
                                    type="text" 
                                    className="ml-2 w-48" 
                                    placeholder="Specify other indication"
                                    value={currentReport.ventralHernia?.preoperative?.indicationOther || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      preoperative: {
                                        ...currentReport.ventralHernia?.preoperative,
                                        indicationOther: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                              <Textarea 
                                className="w-full"
                                rows={3}
                                placeholder="Enter operation description"
                                value={currentReport.ventralHernia?.operative?.operationDescription || ''}
                                onChange={(e) => updateReport('ventralHernia', {
                                  ...currentReport.ventralHernia,
                                  operative: {
                                    ...currentReport.ventralHernia?.operative,
                                    operationDescription: e.target.value
                                  }
                                })}
                              />
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Operative Approach</h3>
                              <div className="ml-4 space-y-4">
                                <div className="space-y-2">
                                  {['Open Repair', 'Laparoscopic Repair', 'Robotic Repair', 'Laparoscopic Converted To Open'].map(approach => (
                                    <div className="flex items-center" key={`hernia-op-approach-${approach}`}>
                                      <Checkbox 
                                        id={`hernia-op-approach-${approach}`}
                                        checked={currentReport.ventralHernia?.operative?.approach?.includes(approach) || false}
                                        onCheckedChange={(checked) => {
                                          const current = currentReport.ventralHernia?.operative?.approach || [];
                                          const updated = checked 
                                            ? [...current, approach]
                                            : current.filter(a => a !== approach);
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            operative: {
                                              ...currentReport.ventralHernia?.operative,
                                              approach: updated
                                            }
                                          });
                                        }}
                                      />
                                      <label htmlFor={`hernia-op-approach-${approach}`} className="ml-2 text-sm text-gray-700">{approach}</label>
                                    </div>
                                  ))}
                                  <div className="flex items-center">
                                    <Checkbox 
                                      id="hernia-op-approach-other"
                                      checked={currentReport.ventralHernia?.operative?.approach?.includes('Other') || false}
                                      onCheckedChange={(checked) => {
                                        const current = currentReport.ventralHernia?.operative?.approach || [];
                                        const updated = checked 
                                          ? [...current, 'Other']
                                          : current.filter(a => a !== 'Other');
                                        updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          operative: {
                                            ...currentReport.ventralHernia?.operative,
                                            approach: updated
                                          }
                                        });
                                      }}
                                    />
                                    <label htmlFor="hernia-op-approach-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                    <Input 
                                      type="text" 
                                      className="ml-2 w-32" 
                                      placeholder="Specify"
                                      value={currentReport.ventralHernia?.operative?.approachOther || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        operative: {
                                          ...currentReport.ventralHernia?.operative,
                                          approachOther: e.target.value
                                        }
                                      })}
                                    />
                                  </div>
                                </div>

                                {/* Reason for Conversion - only show if "Laparoscopic Converted To Open" is selected */}
                                {currentReport.ventralHernia?.operative?.approach?.includes('Laparoscopic Converted To Open') && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Reason for Conversion:</p>
                                    <div className="ml-4 flex flex-wrap gap-4">
                                      {['Adhesions', 'Vascular Injury', 'Difficult Visualization', 'Failure to Progress', 'Visceral Injury', 'Difficult Exposure', 'Bleeding'].map(reason => (
                                        <div className="flex items-center" key={`conversion-${reason}`}>
                                          <Checkbox 
                                            id={`conversion-${reason}`} 
                                            checked={currentReport.ventralHernia?.operative?.conversionReason?.includes(reason)}
                                            onCheckedChange={(checked) => {
                                              const currentReasons = currentReport.ventralHernia?.operative?.conversionReason || [];
                                              let newReasons;
                                              if (checked) {
                                                newReasons = [...currentReasons, reason];
                                              } else {
                                                newReasons = currentReasons.filter(r => r !== reason);
                                              }
                                              updateReport('ventralHernia', {
                                                ...currentReport.ventralHernia,
                                                operative: {
                                                  ...currentReport.ventralHernia?.operative,
                                                  conversionReason: newReasons
                                                }
                                              });
                                            }}
                                            style={{accentColor: 'black'}}
                                          />
                                          <label htmlFor={`conversion-${reason}`} className="ml-2 block text-sm text-gray-700">{reason}</label>
                                        </div>
                                      ))}
                                      
                                      {/* Other option with text input */}
                                      <div className="flex items-center">
                                        <Checkbox 
                                          id="conversion-Other" 
                                          checked={currentReport.ventralHernia?.operative?.conversionReason?.includes('Other')}
                                          onCheckedChange={(checked) => {
                                            const currentReasons = currentReport.ventralHernia?.operative?.conversionReason || [];
                                            let newReasons;
                                            if (checked) {
                                              newReasons = [...currentReasons, 'Other'];
                                            } else {
                                              newReasons = currentReasons.filter(r => r !== 'Other');
                                              // Also clear the other text when unchecking
                                              updateReport('ventralHernia', {
                                                ...currentReport.ventralHernia,
                                                operative: {
                                                  ...currentReport.ventralHernia?.operative,
                                                  conversionReason: newReasons,
                                                  conversionReasonOther: ''
                                                }
                                              });
                                              return;
                                            }
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              operative: {
                                                ...currentReport.ventralHernia?.operative,
                                                conversionReason: newReasons
                                              }
                                            });
                                          }}
                                          style={{accentColor: 'black'}}
                                        />
                                        <label htmlFor="conversion-Other" className="ml-2 block text-sm text-gray-700">Other</label>
                                        {currentReport.ventralHernia?.operative?.conversionReason?.includes('Other') && (
                                          <Input 
                                            type="text" 
                                            className="ml-2 w-48"
                                            placeholder="Specify Other Conversion Reason"
                                            value={currentReport.ventralHernia?.operative?.conversionReasonOther || ''}
                                            onChange={(e) => updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              operative: {
                                                ...currentReport.ventralHernia?.operative,
                                                conversionReasonOther: e.target.value
                                              }
                                            })}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Trocar Number - only show if laparoscopic approaches are selected */}
                                {currentReport.ventralHernia?.operative?.approach?.some(approach => 
                                  ['Laparoscopic Repair', 'Robotic Repair', 'Laparoscopic Converted To Open'].includes(approach)
                                ) && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Trocar Number:</p>
                                    <Input 
                                      type="text" 
                                      className="ml-4 w-full"
                                      placeholder="Enter trocar number"
                                      value={currentReport.ventralHernia?.operative?.trocarNumber || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        operative: {
                                          ...currentReport.ventralHernia?.operative,
                                          trocarNumber: e.target.value
                                        }
                                      })}
                                    />
                                  </div>
                                )}

                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Operative Findings</h3>
                              <div className="ml-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Hernia Type:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Umbilical', 'Epigastric', 'Incisional', 'Spigelian'].map(type => (
                                      <div className="flex items-center" key={`hernia-type-${type}`}>
                                        <Checkbox 
                                          id={`hernia-type-${type}`}
                                          checked={currentReport.ventralHernia?.operative?.herniaType?.includes(type) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.ventralHernia?.operative?.herniaType || [];
                                            const updated = checked 
                                              ? [...current, type]
                                              : current.filter(t => t !== type);
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              operative: {
                                                ...currentReport.ventralHernia?.operative,
                                                herniaType: updated
                                              }
                                            });
                                          }}
                                        />
                                        <label htmlFor={`hernia-type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-type-other"
                                        checked={currentReport.ventralHernia?.operative?.herniaType?.includes('Other') || false}
                                        onCheckedChange={(checked) => {
                                          const current = currentReport.ventralHernia?.operative?.herniaType || [];
                                          const updated = checked 
                                            ? [...current, 'Other']
                                            : current.filter(t => t !== 'Other');
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            operative: {
                                              ...currentReport.ventralHernia?.operative,
                                              herniaType: updated
                                            }
                                          });
                                        }}
                                      />
                                      <label htmlFor="hernia-type-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-32" 
                                        placeholder="Specify"
                                        value={currentReport.ventralHernia?.operative?.herniaTypeOther || ''}
                                        onChange={(e) => updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          operative: {
                                            ...currentReport.ventralHernia?.operative,
                                            herniaTypeOther: e.target.value
                                          }
                                        })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Site of Hernia:</p>
                                  <div className="grid grid-cols-2 gap-2 ml-4">
                                    {['Upper Midline', 'Lower Midline', 'Umbilical/Paraumbilical', 'Subcostal', 'Pfannesteil', 'Grid iron / Lanz', 'Parastomal', 'Previous Stoma', 'Spigelion', 'Lumbar Hernia', 'Laparostomy'].map(site => (
                                      <div className="flex items-center" key={`hernia-site-${site}`}>
                                        <Checkbox 
                                          id={`hernia-site-${site}`}
                                          checked={currentReport.ventralHernia?.operative?.herniaSite?.includes(site) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.ventralHernia?.operative?.herniaSite || [];
                                            const updated = checked 
                                              ? [...current, site]
                                              : current.filter(s => s !== site);
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              operative: {
                                                ...currentReport.ventralHernia?.operative,
                                                herniaSite: updated
                                              }
                                            });
                                          }}
                                        />
                                        <label htmlFor={`hernia-site-${site}`} className="ml-2 text-sm text-gray-700">{site}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-site-other"
                                        checked={currentReport.ventralHernia?.operative?.herniaSite?.includes('Other') || false}
                                        onCheckedChange={(checked) => {
                                          const current = currentReport.ventralHernia?.operative?.herniaSite || [];
                                          const updated = checked 
                                            ? [...current, 'Other']
                                            : current.filter(s => s !== 'Other');
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            operative: {
                                              ...currentReport.ventralHernia?.operative,
                                              herniaSite: updated
                                            }
                                          });
                                        }}
                                      />
                                      <label htmlFor="hernia-site-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-24" 
                                        placeholder="Specify"
                                        value={currentReport.ventralHernia?.operative?.herniaSiteOther || ''}
                                        onChange={(e) => updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          operative: {
                                            ...currentReport.ventralHernia?.operative,
                                            herniaSiteOther: e.target.value
                                          }
                                        })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Total Hernia Defect Size:</p>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Input 
                                      type="text" 
                                      className="w-20" 
                                      placeholder="___"
                                      value={currentReport.ventralHernia?.operative?.herniaDefectLength || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        operative: {
                                          ...currentReport.ventralHernia?.operative,
                                          herniaDefectLength: e.target.value
                                        }
                                      })}
                                    />
                                    <span className="text-sm text-gray-700">cm (Length) x</span>
                                    <Input 
                                      type="text" 
                                      className="w-20" 
                                      placeholder="___"
                                      value={currentReport.ventralHernia?.operative?.herniaDefectWidth || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        operative: {
                                          ...currentReport.ventralHernia?.operative,
                                          herniaDefectWidth: e.target.value
                                        }
                                      })}
                                    />
                                    <span className="text-sm text-gray-700">cm (Width)</span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Number of Defects:</p>
                                  <Input 
                                    type="text" 
                                    className="ml-4 w-20" 
                                    placeholder="___"
                                    value={currentReport.ventralHernia?.operative?.numberOfDefects || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      operative: {
                                        ...currentReport.ventralHernia?.operative,
                                        numberOfDefects: e.target.value
                                      }
                                    })}
                                  />
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Contents:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Omentum', 'Small Bowel', 'Colon', 'Stomach', 'Pre-peritoneal Fat'].map(content => (
                                      <div className="flex items-center" key={`hernia-contents-${content}`}>
                                        <Checkbox 
                                          id={`hernia-contents-${content}`}
                                          checked={currentReport.ventralHernia?.operative?.contents?.includes(content) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.ventralHernia?.operative?.contents || [];
                                            const updated = checked 
                                              ? [...current, content]
                                              : current.filter(c => c !== content);
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              operative: {
                                                ...currentReport.ventralHernia?.operative,
                                                contents: updated
                                              }
                                            });
                                          }}
                                        />
                                        <label htmlFor={`hernia-contents-${content}`} className="ml-2 text-sm text-gray-700">{content}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-contents-other"
                                        checked={currentReport.ventralHernia?.operative?.contents?.includes('Other') || false}
                                        onCheckedChange={(checked) => {
                                          const current = currentReport.ventralHernia?.operative?.contents || [];
                                          const updated = checked 
                                            ? [...current, 'Other']
                                            : current.filter(c => c !== 'Other');
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            operative: {
                                              ...currentReport.ventralHernia?.operative,
                                              contents: updated
                                            }
                                          });
                                        }}
                                      />
                                      <label htmlFor="hernia-contents-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-24" 
                                        placeholder="Specify"
                                        value={currentReport.ventralHernia?.operative?.contentsOther || ''}
                                        onChange={(e) => updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          operative: {
                                            ...currentReport.ventralHernia?.operative,
                                            contentsOther: e.target.value
                                          }
                                        })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Strangulation/Ischaemia:</p>
                                  <div className="flex gap-4 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-strangulation-yes"
                                        checked={currentReport.ventralHernia?.operative?.strangulation === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            operative: {
                                              ...currentReport.ventralHernia?.operative,
                                              strangulation: checked ? 'Yes' : ''
                                            }
                                          });
                                        }}
                                      />
                                      <label htmlFor="hernia-strangulation-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-strangulation-no"
                                        checked={currentReport.ventralHernia?.operative?.strangulation === 'No'}
                                        onCheckedChange={(checked) => {
                                          updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            operative: {
                                              ...currentReport.ventralHernia?.operative,
                                              strangulation: checked ? 'No' : ''
                                            }
                                          });
                                        }}
                                      />
                                      <label htmlFor="hernia-strangulation-no" className="ml-2 text-sm text-gray-700">No</label>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">If Recurrent Hernia. Does Patient have a Mesh in Situ?</p>
                                  <div className="flex gap-4 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-mesh-yes" />
                                      <label htmlFor="hernia-mesh-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-mesh-no" />
                                      <label htmlFor="hernia-mesh-no" className="ml-2 text-sm text-gray-700">No</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-mesh-unknown" />
                                      <label htmlFor="hernia-mesh-unknown" className="ml-2 text-sm text-gray-700">Unknown</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>


                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section III: Hernia Details */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${herniaActiveSection === "section3" ? "bg-green-50" : ""}`}
                      >
                        <div 
                          className="flex items-center flex-1"
                          onClick={() => {
                            setHerniaExpanded(prev => ({ ...prev, section3: !prev.section3 }));
                            if (!herniaExpanded.section3) {
                              setHerniaActiveSection("section3");
                            }
                          }}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Access and Ports</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ml-2 ${herniaExpanded.section3 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoVentralHernia('operative')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoVentralHernia('operative')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearVentralHernia('operative')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {herniaExpanded.section3 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Interactive Body Diagram</h3>
                              
                              {/* Legend/Key */}
                              <div className="mb-4 sm:ml-4">
                                <div className="bg-gray-50 p-3 rounded border">
                                  <h4 className="font-medium text-gray-700 text-sm mb-2">Legend:</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-0.5 bg-black"></div>
                                      <span>Ports (with size label)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-amber-500 rounded-full" style={{borderStyle: 'dashed'}}></div>
                                      <span>Ileostomy (dashed yellow circle)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-green-600 rounded-full"></div>
                                      <span>Colostomy (solid green circle)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-0.5 bg-red-900" style={{backgroundImage: 'repeating-linear-gradient(90deg, #7f1d1d 0, #7f1d1d 4px, transparent 4px, transparent 8px)'}}></div>
                                      <span>Incisions (dashed dark red line)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="sm:ml-4">
                                <ConditionalDiagramDisplay
                                  selectedProcedures={['Ventral Hernia Repair']}
                                  onGastroscopyUpdate={() => {}}
                                  onColonoscopyUpdate={(data) => {
                                    // Handle hernia diagram updates here
                                    console.log('Hernia diagram update:', data);
                                  }}
                                  onProcedureFindingsUpdate={(data) => {
                                    // Store surgical markings in ventral hernia procedureFindings
                                    updateVentralHernia('procedureFindings', 'findings', data.findings);
                                    updateVentralHernia('procedureFindings', 'additionalNotes', data.additionalNotes || '');
                                  }}
                                  currentProcedureFindings={currentReport.ventralHernia?.procedureFindings || { findings: '', additionalNotes: '' }}
                                  customImage={appendectomyImage}
                                  diagramMarkingScale={1.5}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section IV: Procedure Details */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${herniaActiveSection === "section4" ? "bg-green-50" : ""}`}
                      >
                        <div 
                          className="flex items-center flex-1"
                          onClick={() => {
                            setHerniaExpanded(prev => ({ ...prev, section4: !prev.section4 }));
                            if (!herniaExpanded.section4) {
                              setHerniaActiveSection("section4");
                            }
                          }}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Procedure Details</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ml-2 ${herniaExpanded.section4 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoVentralHernia('procedure')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoVentralHernia('procedure')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearVentralHernia('procedure')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {herniaExpanded.section4 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Procedure Details</h3>
                              <div className="ml-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Dissection:</p>
                                  <div className="space-y-2 ml-4">
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-700">Sac Excised</span>
                                      <div className="flex gap-4">
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-sac-yes" 
                                            checked={currentReport.ventralHernia?.procedure?.sacExcised === 'Yes'}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateVentralHernia('procedure', 'sacExcised', 'Yes');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-sac-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-sac-no" 
                                            checked={currentReport.ventralHernia?.procedure?.sacExcised === 'No'}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateVentralHernia('procedure', 'sacExcised', 'No');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-sac-no" className="ml-2 text-sm text-gray-700">No</label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-700">Pre-peritoneal Fat Dissected Off Sheath</span>
                                      <div className="flex gap-4">
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-fat-yes" 
                                            checked={currentReport.ventralHernia?.procedure?.fatDissected === 'Yes'}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateVentralHernia('procedure', 'fatDissected', 'Yes');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-fat-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-fat-no" 
                                            checked={currentReport.ventralHernia?.procedure?.fatDissected === 'No'}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateVentralHernia('procedure', 'fatDissected', 'No');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-fat-no" className="ml-2 text-sm text-gray-700">No</label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-700">Hernia Defect Closed</span>
                                      <div className="flex gap-4">
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-defect-yes" 
                                            checked={currentReport.ventralHernia?.procedure?.defectClosed === 'Yes'}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateVentralHernia('procedure', 'defectClosed', 'Yes');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-defect-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-defect-no" 
                                            checked={currentReport.ventralHernia?.procedure?.defectClosed === 'No'}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateVentralHernia('procedure', 'defectClosed', 'No');
                                                // Clear closure technique when No is selected
                                                updateVentralHernia('procedure', 'closureTechnique', []);
                                                updateVentralHernia('procedure', 'closureTechniqueOther', '');
                                                updateVentralHernia('procedure', 'closureMaterial', []);
                                                updateVentralHernia('procedure', 'closureMaterialOther', '');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-defect-no" className="ml-2 text-sm text-gray-700">No</label>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Closure Technique - shown when Hernia Defect Closed is Yes */}
                                    {currentReport.ventralHernia?.procedure?.defectClosed === 'Yes' && (
                                      <div className="ml-8 space-y-4">
                                        <div>
                                          <p className="text-sm font-medium text-gray-700 mb-2">Closure Technique:</p>
                                          <div className="flex flex-wrap gap-4 ml-4">
                                            {['Trans-Fascial Sutures', 'Interrupted Intra-Corporeal Sutures', 'Continuous Intra-Corporeal Sutures', 'Other'].map(technique => (
                                              <div className="flex items-center" key={`closure-technique-${technique}`}>
                                                <Checkbox 
                                                  id={`closure-technique-${technique}`}
                                                  checked={currentReport.ventralHernia?.procedure?.closureTechnique?.includes(technique)}
                                                  onCheckedChange={(checked) => {
                                                    const currentTechniques = currentReport.ventralHernia?.procedure?.closureTechnique || [];
                                                    if (checked) {
                                                      updateVentralHernia('procedure', 'closureTechnique', [...currentTechniques, technique]);
                                                    } else {
                                                      updateVentralHernia('procedure', 'closureTechnique', currentTechniques.filter(t => t !== technique));
                                                      if (technique === 'Other') {
                                                        updateVentralHernia('procedure', 'closureTechniqueOther', '');
                                                      }
                                                    }
                                                  }}
                                                />
                                                <label htmlFor={`closure-technique-${technique}`} className="ml-2 text-sm text-gray-700">{technique}</label>
                                                {technique === 'Other' && currentReport.ventralHernia?.procedure?.closureTechnique?.includes('Other') && (
                                                  <Input 
                                                    type="text" 
                                                    className="ml-2 w-32"
                                                    placeholder="Please Specify"
                                                    value={currentReport.ventralHernia?.procedure?.closureTechniqueOther || ''}
                                                    onChange={(e) => updateVentralHernia('procedure', 'closureTechniqueOther', e.target.value)}
                                                  />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Material Used - shown when any closure technique is selected */}
                                        {currentReport.ventralHernia?.procedure?.closureTechnique?.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Material Used:</p>
                                            <div className="flex flex-wrap gap-4 ml-4">
                                              {['PDS', 'Prolene', 'Ethibond', 'Tycron', 'Nylon', 'V-Loc', 'Other'].map(material => (
                                                <div className="flex items-center" key={`closure-material-${material}`}>
                                                  <Checkbox 
                                                    id={`closure-material-${material}`}
                                                    checked={currentReport.ventralHernia?.procedure?.closureMaterial?.includes(material)}
                                                    onCheckedChange={(checked) => {
                                                      const currentMaterials = currentReport.ventralHernia?.procedure?.closureMaterial || [];
                                                      if (checked) {
                                                        updateVentralHernia('procedure', 'closureMaterial', [...currentMaterials, material]);
                                                      } else {
                                                        updateVentralHernia('procedure', 'closureMaterial', currentMaterials.filter(m => m !== material));
                                                        if (material === 'Other') {
                                                          updateVentralHernia('procedure', 'closureMaterialOther', '');
                                                        }
                                                      }
                                                    }}
                                                  />
                                                  <label htmlFor={`closure-material-${material}`} className="ml-2 text-sm text-gray-700">{material}</label>
                                                  {material === 'Other' && currentReport.ventralHernia?.procedure?.closureMaterial?.includes('Other') && (
                                                    <Input 
                                                      type="text" 
                                                      className="ml-2 w-32"
                                                      placeholder="Please Specify"
                                                      value={currentReport.ventralHernia?.procedure?.closureMaterialOther || ''}
                                                      onChange={(e) => updateVentralHernia('procedure', 'closureMaterialOther', e.target.value)}
                                                    />
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Repair Type:</p>
                                  <div className="space-y-2 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-primary-closure" 
                                        checked={currentReport.ventralHernia?.procedure?.repairType === 'Primary Suture Closure (Non-Mesh)'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              procedure: {
                                                ...currentReport.ventralHernia?.procedure,
                                                repairType: 'Primary Suture Closure (Non-Mesh)'
                                              }
                                            });
                                            setHerniaPrimaryClosure(true);
                                            setHerniaMeshRepair(false);
                                          } else {
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              procedure: {
                                                ...currentReport.ventralHernia?.procedure,
                                                repairType: ''
                                              }
                                            });
                                            setHerniaPrimaryClosure(false);
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-primary-closure" className="ml-2 text-sm text-gray-700">Primary Suture Closure (Non-Mesh)</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-mesh-repair" 
                                        checked={currentReport.ventralHernia?.procedure?.repairType === 'Mesh Repair'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              procedure: {
                                                ...currentReport.ventralHernia?.procedure,
                                                repairType: 'Mesh Repair'
                                              }
                                            });
                                            setHerniaMeshRepair(true);
                                            setHerniaPrimaryClosure(false);
                                          } else {
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              procedure: {
                                                ...currentReport.ventralHernia?.procedure,
                                                repairType: ''
                                              }
                                            });
                                            setHerniaMeshRepair(false);
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-mesh-repair" className="ml-2 text-sm text-gray-700">Mesh Repair</label>
                                    </div>
                                  </div>
                                </div>

                                {herniaMeshRepair && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Mesh Details:</p>
                                    <div className="ml-4 space-y-4">
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Mesh Placement:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Onlay', 'Inlay', 'Sublay (retromuscular)', 'Underlay (IPOM)', 'Other'].map(type => (
                                          <div className="flex items-center" key={`hernia-mesh-type-${type}`}>
                                            <Checkbox 
                                              id={`hernia-mesh-type-${type}`}
                                              checked={currentReport.ventralHernia?.procedure?.meshType?.includes(type)}
                                              onCheckedChange={(checked) => {
                                                const currentTypes = currentReport.ventralHernia?.procedure?.meshType || [];
                                                if (checked) {
                                                  updateVentralHernia('procedure', 'meshType', [...currentTypes, type]);
                                                } else {
                                                  updateVentralHernia('procedure', 'meshType', currentTypes.filter(t => t !== type));
                                                  if (type === 'Other') {
                                                    updateVentralHernia('procedure', 'meshPlacementOther', '');
                                                  }
                                                }
                                              }}
                                            />
                                            <label htmlFor={`hernia-mesh-type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                                            {type === 'Other' && currentReport.ventralHernia?.procedure?.meshType?.includes('Other') && (
                                              <Input 
                                                type="text" 
                                                className="ml-2 w-32"
                                                placeholder="Please Specify"
                                                value={currentReport.ventralHernia?.procedure?.meshPlacementOther || ''}
                                                onChange={(e) => updateVentralHernia('procedure', 'meshPlacementOther', e.target.value)}
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Mesh material:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Synthetic', 'Composite', 'Biologic', 'Other'].map(material => (
                                          <div className="flex items-center" key={`hernia-mesh-material-${material}`}>
                                            <Checkbox 
                                              id={`hernia-mesh-material-${material}`}
                                              checked={currentReport.ventralHernia?.procedure?.meshMaterial?.includes(material)}
                                              onCheckedChange={(checked) => {
                                                const currentMaterials = currentReport.ventralHernia?.procedure?.meshMaterial || [];
                                                if (checked) {
                                                  updateVentralHernia('procedure', 'meshMaterial', [...currentMaterials, material]);
                                                } else {
                                                  updateVentralHernia('procedure', 'meshMaterial', currentMaterials.filter(m => m !== material));
                                                  if (material === 'Other') {
                                                    updateVentralHernia('procedure', 'meshMaterialOther', '');
                                                  }
                                                }
                                              }}
                                            />
                                            <label htmlFor={`hernia-mesh-material-${material}`} className="ml-2 text-sm text-gray-700">{material}</label>
                                            {material === 'Other' && currentReport.ventralHernia?.procedure?.meshMaterial?.includes('Other') && (
                                              <Input 
                                                type="text" 
                                                className="ml-2 w-32"
                                                placeholder="Please Specify"
                                                value={currentReport.ventralHernia?.procedure?.meshMaterialOther || ''}
                                                onChange={(e) => updateVentralHernia('procedure', 'meshMaterialOther', e.target.value)}
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Size:</p>
                                      <div className="flex items-center gap-2 ml-4">
                                        <Input 
                                          type="text" 
                                          className="w-20" 
                                          placeholder="___" 
                                          value={currentReport.ventralHernia?.procedure?.meshLength || ''}
                                          onChange={(e) => updateVentralHernia('procedure', 'meshLength', e.target.value)}
                                        />
                                        <span className="text-sm text-gray-700">x</span>
                                        <Input 
                                          type="text" 
                                          className="w-20" 
                                          placeholder="___" 
                                          value={currentReport.ventralHernia?.procedure?.meshWidth || ''}
                                          onChange={(e) => updateVentralHernia('procedure', 'meshWidth', e.target.value)}
                                        />
                                        <span className="text-sm text-gray-700">cm</span>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Fixation:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Sutures', 'Tackers', 'Trans-Fascial Sutures', 'Glue'].map(fixation => (
                                          <div className="flex items-center" key={`hernia-fixation-${fixation}`}>
                                            <Checkbox 
                                              id={`hernia-fixation-${fixation}`}
                                              checked={currentReport.ventralHernia?.procedure?.fixation?.includes(fixation)}
                                              onCheckedChange={(checked) => {
                                                const currentFixations = currentReport.ventralHernia?.procedure?.fixation || [];
                                                if (checked) {
                                                  updateVentralHernia('procedure', 'fixation', [...currentFixations, fixation]);
                                                } else {
                                                  updateVentralHernia('procedure', 'fixation', currentFixations.filter(f => f !== fixation));
                                                }
                                              }}
                                            />
                                            <label htmlFor={`hernia-fixation-${fixation}`} className="ml-2 text-sm text-gray-700">{fixation}</label>
                                          </div>
                                        ))}
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="hernia-fixation-other"
                                            checked={currentReport.ventralHernia?.procedure?.fixation?.includes('Other')}
                                            onCheckedChange={(checked) => {
                                              const currentFixations = currentReport.ventralHernia?.procedure?.fixation || [];
                                              if (checked) {
                                                updateVentralHernia('procedure', 'fixation', [...currentFixations, 'Other']);
                                              } else {
                                                updateVentralHernia('procedure', 'fixation', currentFixations.filter(f => f !== 'Other'));
                                                updateVentralHernia('procedure', 'fixationOther', '');
                                              }
                                            }}
                                          />
                                          <label htmlFor="hernia-fixation-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                          <Input 
                                            type="text" 
                                            className="ml-2 w-24" 
                                            placeholder="Specify"
                                            value={currentReport.ventralHernia?.procedure?.fixationOther || ''}
                                            onChange={(e) => updateVentralHernia('procedure', 'fixationOther', e.target.value)}
                                            disabled={!currentReport.ventralHernia?.procedure?.fixation?.includes('Other')}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                )}

                                {herniaPrimaryClosure && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Primary Tissue Repair:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Simple Fascial Suture', 'Sheath Overlap', 'Component Separation'].map(repair => (
                                      <div className="flex items-center" key={`hernia-primary-${repair}`}>
                                        <Checkbox 
                                          id={`hernia-primary-${repair}`}
                                          checked={currentReport.ventralHernia?.procedure?.primaryRepair?.includes(repair)}
                                          onCheckedChange={(checked) => {
                                            const currentRepairs = currentReport.ventralHernia?.procedure?.primaryRepair || [];
                                            if (checked) {
                                              updateVentralHernia('procedure', 'primaryRepair', [...currentRepairs, repair]);
                                            } else {
                                              updateVentralHernia('procedure', 'primaryRepair', currentRepairs.filter(r => r !== repair));
                                            }
                                          }}
                                        />
                                        <label htmlFor={`hernia-primary-${repair}`} className="ml-2 text-sm text-gray-700">{repair}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-primary-other"
                                        checked={currentReport.ventralHernia?.procedure?.primaryRepair?.includes('Other')}
                                        onCheckedChange={(checked) => {
                                          const currentRepairs = currentReport.ventralHernia?.procedure?.primaryRepair || [];
                                          if (checked) {
                                            updateVentralHernia('procedure', 'primaryRepair', [...currentRepairs, 'Other']);
                                          } else {
                                            updateVentralHernia('procedure', 'primaryRepair', currentRepairs.filter(r => r !== 'Other'));
                                            updateVentralHernia('procedure', 'primaryRepairOther', '');
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-primary-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input 
                                        type="text" 
                                        className="ml-2 w-24" 
                                        placeholder="Specify"
                                        value={currentReport.ventralHernia?.procedure?.primaryRepairOther || ''}
                                        onChange={(e) => updateVentralHernia('procedure', 'primaryRepairOther', e.target.value)}
                                        disabled={!currentReport.ventralHernia?.procedure?.primaryRepair?.includes('Other')}
                                      />
                                    </div>
                                  </div>
                                </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Intra-Operative Difficulty</h3>
                              <div className="ml-4 space-y-2">
                                <div className="flex flex-wrap gap-4">
                                  {['None', 'Adhesions', 'Viscera Reduction', 'Closure of Defect', 'Hernia Position', 'Other'].map(difficulty => (
                                    <div className="flex items-center" key={`hernia-difficulty-${difficulty}`}>
                                      <Checkbox 
                                        id={`hernia-difficulty-${difficulty}`}
                                        checked={currentReport.ventralHernia?.procedure?.intraOperativeDifficulty?.includes(difficulty)}
                                        onCheckedChange={(checked) => {
                                          const currentDifficulties = currentReport.ventralHernia?.procedure?.intraOperativeDifficulty || [];
                                          if (checked) {
                                            updateVentralHernia('procedure', 'intraOperativeDifficulty', [...currentDifficulties, difficulty]);
                                          } else {
                                            updateVentralHernia('procedure', 'intraOperativeDifficulty', currentDifficulties.filter(d => d !== difficulty));
                                            if (difficulty === 'Other') {
                                              updateVentralHernia('procedure', 'intraOperativeDifficultyOther', '');
                                            }
                                          }
                                        }}
                                      />
                                      <label htmlFor={`hernia-difficulty-${difficulty}`} className="ml-2 text-sm text-gray-700">{difficulty}</label>
                                      {difficulty === 'Other' && currentReport.ventralHernia?.procedure?.intraOperativeDifficulty?.includes('Other') && (
                                        <Input 
                                          type="text" 
                                          className="ml-2 w-32"
                                          placeholder="Please Specify"
                                          value={currentReport.ventralHernia?.procedure?.intraOperativeDifficultyOther || ''}
                                          onChange={(e) => updateVentralHernia('procedure', 'intraOperativeDifficultyOther', e.target.value)}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Intraoperative Complications</h3>
                              <div className="ml-4 space-y-2">
                                {['None', 'Bowel Injury', 'Serosal Tear', 'Bleeding'].map(complication => (
                                  <div className="flex items-center" key={`hernia-complication-${complication}`}>
                                    <Checkbox 
                                      id={`hernia-complication-${complication}`}
                                      checked={currentReport.ventralHernia?.procedure?.complications?.includes(complication)}
                                      onCheckedChange={(checked) => {
                                        const currentComplications = currentReport.ventralHernia?.procedure?.complications || [];
                                        if (checked) {
                                          if (complication === 'None') {
                                            updateVentralHernia('procedure', 'complications', ['None']);
                                            updateVentralHernia('procedure', 'complicationOther', '');
                                          } else {
                                            const filtered = currentComplications.filter(c => c !== 'None');
                                            updateVentralHernia('procedure', 'complications', [...filtered, complication]);
                                          }
                                        } else {
                                          updateVentralHernia('procedure', 'complications', currentComplications.filter(c => c !== complication));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`hernia-complication-${complication}`} className="ml-2 text-sm text-gray-700">{complication}</label>
                                  </div>
                                ))}
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="hernia-complication-other"
                                    checked={currentReport.ventralHernia?.procedure?.complications?.includes('Other')}
                                    onCheckedChange={(checked) => {
                                      const currentComplications = currentReport.ventralHernia?.procedure?.complications || [];
                                      if (checked) {
                                        const filtered = currentComplications.filter(c => c !== 'None');
                                        updateVentralHernia('procedure', 'complications', [...filtered, 'Other']);
                                      } else {
                                        updateVentralHernia('procedure', 'complications', currentComplications.filter(c => c !== 'Other'));
                                        updateVentralHernia('procedure', 'complicationOther', '');
                                      }
                                    }}
                                  />
                                  <label htmlFor="hernia-complication-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                  <Input 
                                    type="text" 
                                    className="ml-2 w-48" 
                                    placeholder="Specify complication"
                                    value={currentReport.ventralHernia?.procedure?.complicationOther || ''}
                                    onChange={(e) => updateVentralHernia('procedure', 'complicationOther', e.target.value)}
                                    disabled={!currentReport.ventralHernia?.procedure?.complications?.includes('Other')}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section 5: Closure */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${herniaActiveSection === "section5" ? "bg-green-50" : ""}`}
                      >
                        <div 
                          className="flex items-center flex-1"
                          onClick={() => {
                            setHerniaExpanded(prev => ({ ...prev, section5: !prev.section5 }));
                            if (!herniaExpanded.section5) {
                              setHerniaActiveSection("section5");
                            }
                          }}
                        >
                          <h2 className="text-lg font-semibold text-gray-800">Closure</h2>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ml-2 ${herniaExpanded.section5 ? "transform rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => undoVentralHernia('procedure')}
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => redoVentralHernia('procedure')}
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => clearVentralHernia('procedure')}
                            title="Clear Section"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {herniaExpanded.section5 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Haemostasis & Closure</h3>
                              <div className="ml-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Haemostasis:</p>
                                  <div className="flex gap-4 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-haemostasis-achieved"
                                        checked={currentReport.ventralHernia?.procedure?.haemostasis === 'Achieved'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateVentralHernia('procedure', 'haemostasis', 'Achieved');
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-haemostasis-achieved" className="ml-2 text-sm text-gray-700">Achieved</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-haemostasis-na"
                                        checked={currentReport.ventralHernia?.procedure?.haemostasis === 'Not Applicable'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateVentralHernia('procedure', 'haemostasis', 'Not Applicable');
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-haemostasis-na" className="ml-2 text-sm text-gray-700">Not Applicable</label>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Drain:</p>
                                  <div className="space-y-2 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-drain-none"
                                        checked={currentReport.ventralHernia?.procedure?.drain === 'None'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateVentralHernia('procedure', 'drain', 'None');
                                            updateVentralHernia('procedure', 'drainDetails', '');
                                            updateVentralHernia('procedure', 'drainType', []);
                                            updateVentralHernia('procedure', 'drainTypeOther', '');
                                            updateVentralHernia('procedure', 'intraPeritonealPlacement', []);
                                            updateVentralHernia('procedure', 'intraPeritonealPlacementOther', '');
                                            updateVentralHernia('procedure', 'drainExitSite', []);
                                            updateVentralHernia('procedure', 'drainExitSiteOther', '');
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-drain-none" className="ml-2 text-sm text-gray-700">None</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox 
                                        id="hernia-drain-yes"
                                        checked={currentReport.ventralHernia?.procedure?.drain === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateVentralHernia('procedure', 'drain', 'Yes');
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-drain-yes" className="ml-2 text-sm text-gray-700">Yes →</label>
                                    </div>
                                  </div>
                                  {currentReport.ventralHernia?.procedure?.drain === 'Yes' && (
                                    <div className="ml-6 mt-4 space-y-4 rounded-md border-l-2 border-gray-300 bg-gray-50 p-4">
                                      <h4 className="font-medium text-gray-800">Drain Details</h4>

                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Type of Drain:</p>
                                        <div className="grid grid-cols-1 gap-2 ml-4">
                                          {['Open', 'Closed Suction Drain', 'Closed Passive Drain', 'Other'].map((type) => (
                                            <div className="flex items-center" key={`ventral-drain-type-${type}`}>
                                              <Checkbox
                                                id={`ventral-drain-type-${type}`}
                                                checked={currentReport.ventralHernia?.procedure?.drainType?.includes(type) || false}
                                                onCheckedChange={(checked) => {
                                                  const currentDrainTypes = currentReport.ventralHernia?.procedure?.drainType || [];
                                                  const updated = checked
                                                    ? [...currentDrainTypes, type]
                                                    : currentDrainTypes.filter((item) => item !== type);
                                                  updateVentralHernia('procedure', 'drainType', updated);
                                                  if (!checked && type === 'Other') {
                                                    updateVentralHernia('procedure', 'drainTypeOther', '');
                                                  }
                                                }}
                                              />
                                              <label htmlFor={`ventral-drain-type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                                            </div>
                                          ))}
                                        </div>
                                        {currentReport.ventralHernia?.procedure?.drainType?.includes('Other') && (
                                          <div className="mt-3 ml-4">
                                            <Input
                                              type="text"
                                              placeholder="Specify other drain type"
                                              value={currentReport.ventralHernia?.procedure?.drainTypeOther || ''}
                                              onChange={(e) => updateVentralHernia('procedure', 'drainTypeOther', e.target.value)}
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Intra-Peritoneal Placement:</p>
                                        <div className="grid grid-cols-1 gap-2 ml-4 md:grid-cols-2">
                                          {[
                                            'Right Subphrenic Space',
                                            'Right Subhepatic',
                                            'Right Paracolic',
                                            'Left Subphrenic',
                                            'Left Subhepatic',
                                            'Left Paracolic',
                                            'Pelvis',
                                            'Adjacent to Anastomosis',
                                            'Other',
                                          ].map((placement) => (
                                            <div className="flex items-center" key={`ventral-drain-placement-${placement}`}>
                                              <Checkbox
                                                id={`ventral-drain-placement-${placement}`}
                                                checked={currentReport.ventralHernia?.procedure?.intraPeritonealPlacement?.includes(placement) || false}
                                                onCheckedChange={(checked) => {
                                                  const currentPlacement = currentReport.ventralHernia?.procedure?.intraPeritonealPlacement || [];
                                                  const updated = checked
                                                    ? [...currentPlacement, placement]
                                                    : currentPlacement.filter((item) => item !== placement);
                                                  updateVentralHernia('procedure', 'intraPeritonealPlacement', updated);
                                                  if (!checked && placement === 'Other') {
                                                    updateVentralHernia('procedure', 'intraPeritonealPlacementOther', '');
                                                  }
                                                }}
                                              />
                                              <label htmlFor={`ventral-drain-placement-${placement}`} className="ml-2 text-sm text-gray-700">{placement}</label>
                                            </div>
                                          ))}
                                        </div>
                                        {currentReport.ventralHernia?.procedure?.intraPeritonealPlacement?.includes('Other') && (
                                          <div className="mt-3 ml-4">
                                            <Input
                                              type="text"
                                              placeholder="Specify other placement"
                                              value={currentReport.ventralHernia?.procedure?.intraPeritonealPlacementOther || ''}
                                              onChange={(e) => updateVentralHernia('procedure', 'intraPeritonealPlacementOther', e.target.value)}
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Exit Site:</p>
                                        <div className="grid grid-cols-1 gap-2 ml-4 md:grid-cols-2">
                                          {[
                                            'Right Upper Quadrant',
                                            'Right Lower Quadrant',
                                            'Left Upper Quadrant',
                                            'Left Lower Quadrant',
                                            'Perineum',
                                            'Other',
                                          ].map((site) => (
                                            <div className="flex items-center" key={`ventral-drain-exit-${site}`}>
                                              <Checkbox
                                                id={`ventral-drain-exit-${site}`}
                                                checked={currentReport.ventralHernia?.procedure?.drainExitSite?.includes(site) || false}
                                                onCheckedChange={(checked) => {
                                                  const currentSites = currentReport.ventralHernia?.procedure?.drainExitSite || [];
                                                  const updated = checked
                                                    ? [...currentSites, site]
                                                    : currentSites.filter((item) => item !== site);
                                                  updateVentralHernia('procedure', 'drainExitSite', updated);
                                                  if (!checked && site === 'Other') {
                                                    updateVentralHernia('procedure', 'drainExitSiteOther', '');
                                                  }
                                                }}
                                              />
                                              <label htmlFor={`ventral-drain-exit-${site}`} className="ml-2 text-sm text-gray-700">{site}</label>
                                            </div>
                                          ))}
                                        </div>
                                        {currentReport.ventralHernia?.procedure?.drainExitSite?.includes('Other') && (
                                          <div className="mt-3 ml-4">
                                            <Input
                                              type="text"
                                              placeholder="Specify other exit site"
                                              value={currentReport.ventralHernia?.procedure?.drainExitSiteOther || ''}
                                              onChange={(e) => updateVentralHernia('procedure', 'drainExitSiteOther', e.target.value)}
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Additional Drain Details:</p>
                                        <Input 
                                          type="text" 
                                          className="ml-4 w-full max-w-md" 
                                          placeholder="Site and type notes"
                                          value={currentReport.ventralHernia?.procedure?.drainDetails || ''}
                                          onChange={(e) => updateVentralHernia('procedure', 'drainDetails', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['None', '5mm', '10/11mm', '12mm', '15mm', 'Access Incision', 'Other'].map(closure => (
                                      <div className="flex items-center" key={`hernia-fascial-${closure}`}>
                                        <Checkbox 
                                          id={`hernia-fascial-${closure}`}
                                          checked={currentReport.ventralHernia?.procedure?.fascialClosure?.includes(closure)}
                                          onCheckedChange={(checked) => {
                                            const currentClosures = currentReport.ventralHernia?.procedure?.fascialClosure || [];
                                            if (checked) {
                                              if (closure === 'None') {
                                                updateVentralHernia('procedure', 'fascialClosure', ['None']);
                                                updateVentralHernia('procedure', 'fascialClosureMaterial', []);
                                                updateVentralHernia('procedure', 'fascialClosureMaterialOther', '');
                                              } else {
                                                const filtered = currentClosures.filter(c => c !== 'None');
                                                updateVentralHernia('procedure', 'fascialClosure', [...filtered, closure]);
                                              }
                                            } else {
                                              updateVentralHernia('procedure', 'fascialClosure', currentClosures.filter(c => c !== closure));
                                            }
                                          }}
                                        />
                                        <label htmlFor={`hernia-fascial-${closure}`} className="ml-2 text-sm text-gray-700">{closure}</label>
                                        {closure === 'Other' && currentReport.ventralHernia?.procedure?.fascialClosure?.includes('Other') && (
                                          <Input 
                                            type="text" 
                                            className="ml-2 w-32"
                                            placeholder="Please Specify"
                                            value={currentReport.ventralHernia?.procedure?.fascialClosureOther || ''}
                                            onChange={(e) => updateVentralHernia('procedure', 'fascialClosureOther', e.target.value)}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Material Used for Fascial Closure - shown when any closure except None is selected */}
                                  {currentReport.ventralHernia?.procedure?.fascialClosure?.length > 0 && 
                                   !currentReport.ventralHernia?.procedure?.fascialClosure?.includes('None') && (
                                    <div className="mt-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Material Used:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Nylon', 'Vicryl', 'PDS', 'Maxon', 'Other'].map(material => (
                                          <div className="flex items-center" key={`fascial-material-${material}`}>
                                            <Checkbox 
                                              id={`fascial-material-${material}`}
                                              checked={currentReport.ventralHernia?.procedure?.fascialClosureMaterial?.includes(material)}
                                              onCheckedChange={(checked) => {
                                                const currentMaterials = currentReport.ventralHernia?.procedure?.fascialClosureMaterial || [];
                                                if (checked) {
                                                  updateVentralHernia('procedure', 'fascialClosureMaterial', [...currentMaterials, material]);
                                                } else {
                                                  updateVentralHernia('procedure', 'fascialClosureMaterial', currentMaterials.filter(m => m !== material));
                                                  if (material === 'Other') {
                                                    updateVentralHernia('procedure', 'fascialClosureMaterialOther', '');
                                                  }
                                                }
                                              }}
                                            />
                                            <label htmlFor={`fascial-material-${material}`} className="ml-2 text-sm text-gray-700">{material}</label>
                                            {material === 'Other' && currentReport.ventralHernia?.procedure?.fascialClosureMaterial?.includes('Other') && (
                                              <Input 
                                                type="text" 
                                                className="ml-2 w-32"
                                                placeholder="Please Specify"
                                                value={currentReport.ventralHernia?.procedure?.fascialClosureMaterialOther || ''}
                                                onChange={(e) => updateVentralHernia('procedure', 'fascialClosureMaterialOther', e.target.value)}
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Skin Closure:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Sutures', 'Staples', 'Glue', 'Other'].map(closure => (
                                      <div className="flex items-center" key={`hernia-skin-${closure}`}>
                                        <Checkbox 
                                          id={`hernia-skin-${closure}`}
                                          checked={currentReport.ventralHernia?.procedure?.skinClosure?.includes(closure)}
                                          onCheckedChange={(checked) => {
                                            const currentClosures = currentReport.ventralHernia?.procedure?.skinClosure || [];
                                            if (checked) {
                                              updateVentralHernia('procedure', 'skinClosure', [...currentClosures, closure]);
                                            } else {
                                              updateVentralHernia('procedure', 'skinClosure', currentClosures.filter(c => c !== closure));
                                              if (closure === 'Other') {
                                                updateVentralHernia('procedure', 'skinClosureOther', '');
                                              }
                                            }
                                          }}
                                        />
                                        <label htmlFor={`hernia-skin-${closure}`} className="ml-2 text-sm text-gray-700">{closure}</label>
                                        {closure === 'Other' && currentReport.ventralHernia?.procedure?.skinClosure?.includes('Other') && (
                                          <Input 
                                            type="text" 
                                            className="ml-2 w-32"
                                            placeholder="Please Specify"
                                            value={currentReport.ventralHernia?.procedure?.skinClosureOther || ''}
                                            onChange={(e) => updateVentralHernia('procedure', 'skinClosureOther', e.target.value)}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Material Used for Skin Closure - only show when Sutures is selected */}
                                  {currentReport.ventralHernia?.procedure?.skinClosure?.includes('Sutures') && (
                                    <div className="mt-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Material Used:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Nylon', 'Monocryl', 'Vicryl', 'V-Loc', 'Other'].map(material => (
                                          <div className="flex items-center" key={`skin-material-${material}`}>
                                            <Checkbox 
                                              id={`skin-material-${material}`}
                                              checked={currentReport.ventralHernia?.procedure?.skinClosureMaterial?.includes(material)}
                                              onCheckedChange={(checked) => {
                                                const currentMaterials = currentReport.ventralHernia?.procedure?.skinClosureMaterial || [];
                                                if (checked) {
                                                  updateVentralHernia('procedure', 'skinClosureMaterial', [...currentMaterials, material]);
                                                } else {
                                                  updateVentralHernia('procedure', 'skinClosureMaterial', currentMaterials.filter(m => m !== material));
                                                  if (material === 'Other') {
                                                    updateVentralHernia('procedure', 'skinClosureMaterialOther', '');
                                                  }
                                                }
                                              }}
                                            />
                                            <label htmlFor={`skin-material-${material}`} className="ml-2 text-sm text-gray-700">{material}</label>
                                            {material === 'Other' && currentReport.ventralHernia?.procedure?.skinClosureMaterial?.includes('Other') && (
                                              <Input 
                                                type="text" 
                                                className="ml-2 w-32"
                                                placeholder="Please Specify"
                                                value={currentReport.ventralHernia?.procedure?.skinClosureMaterialOther || ''}
                                                onChange={(e) => updateVentralHernia('procedure', 'skinClosureMaterialOther', e.target.value)}
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Specimen Sent:</h3>
                              <div className="ml-4 space-y-2">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="hernia-specimen-none"
                                    checked={currentReport.ventralHernia?.procedure?.specimenSent?.includes('None') || false}
                                    onCheckedChange={(checked) => {
                                      const currentSpecimens = currentReport.ventralHernia?.procedure?.specimenSent || [];
                                      let newSpecimens;
                                      if (checked) {
                                        newSpecimens = [...currentSpecimens, 'None'];
                                      } else {
                                        newSpecimens = currentSpecimens.filter(s => s !== 'None');
                                      }
                                      updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        procedure: {
                                          ...currentReport.ventralHernia?.procedure,
                                          specimenSent: newSpecimens
                                        }
                                      });
                                    }}
                                  />
                                  <label htmlFor="hernia-specimen-none" className="ml-2 text-sm text-gray-700">None</label>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Checkbox 
                                      id="hernia-specimen-sac"
                                      checked={currentReport.ventralHernia?.procedure?.specimenSent?.includes('Hernia Sac') || false}
                                      onCheckedChange={(checked) => {
                                        const currentSpecimens = currentReport.ventralHernia?.procedure?.specimenSent || [];
                                        let newSpecimens;
                                        if (checked) {
                                          newSpecimens = [...currentSpecimens, 'Hernia Sac'];
                                        } else {
                                          newSpecimens = currentSpecimens.filter(s => s !== 'Hernia Sac');
                                        }
                                        updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          procedure: {
                                            ...currentReport.ventralHernia?.procedure,
                                            specimenSent: newSpecimens
                                          }
                                        });
                                      }}
                                    />
                                    <label htmlFor="hernia-specimen-sac" className="ml-2 text-sm text-gray-700">Hernia Sac</label>
                                  </div>
                                  {currentReport.ventralHernia?.procedure?.specimenSent?.includes('Hernia Sac') && (
                                    <div className="ml-6 space-y-2">
                                      <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-gray-700">Please Specify Laboratory Sent to:</label>
                                        <Input 
                                          className="w-full" 
                                          type="text" 
                                          placeholder="Enter Laboratory Name"
                                          value={currentReport.ventralHernia?.procedure?.laboratoryName || ''}
                                          onChange={(e) => updateReport('ventralHernia', {
                                            ...currentReport.ventralHernia,
                                            procedure: {
                                              ...currentReport.ventralHernia?.procedure,
                                              laboratoryName: e.target.value
                                            }
                                          })}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="hernia-specimen-other"
                                    checked={currentReport.ventralHernia?.procedure?.specimenSent?.includes('Other') || false}
                                    onCheckedChange={(checked) => {
                                      const currentSpecimens = currentReport.ventralHernia?.procedure?.specimenSent || [];
                                      let newSpecimens;
                                      if (checked) {
                                        newSpecimens = [...currentSpecimens, 'Other'];
                                      } else {
                                        newSpecimens = currentSpecimens.filter(s => s !== 'Other');
                                      }
                                      updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        procedure: {
                                          ...currentReport.ventralHernia?.procedure,
                                          specimenSent: newSpecimens
                                        }
                                      });
                                    }}
                                  />
                                  <label htmlFor="hernia-specimen-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                  <Input 
                                    type="text" 
                                    className="ml-2 w-32" 
                                    placeholder="Specify"
                                    value={currentReport.ventralHernia?.procedure?.specimenOther || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      procedure: {
                                        ...currentReport.ventralHernia?.procedure,
                                        specimenOther: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Additional Notes</h3>
                              <div className="ml-4">
                                <Textarea 
                                  rows={3}
                                  placeholder="Additional operative notes..."
                                  className="w-full"
                                  value={currentReport.ventralHernia?.procedure?.additionalNotes || ''}
                                  onChange={(e) => updateReport('ventralHernia', {
                                    ...currentReport.ventralHernia,
                                    procedure: {
                                      ...currentReport.ventralHernia?.procedure,
                                      additionalNotes: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Post Operative Management</h3>
                              <div className="ml-4">
                                <Textarea 
                                  rows={3}
                                  placeholder="Post operative management plan..."
                                  className="w-full"
                                  value={currentReport.ventralHernia?.procedure?.postOperativeManagement || ''}
                                  onChange={(e) => updateReport('ventralHernia', {
                                    ...currentReport.ventralHernia,
                                    procedure: {
                                      ...currentReport.ventralHernia?.procedure,
                                      postOperativeManagement: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Standalone Signature Section */}
                    <Card className="glass-card-light">
                      <CardContent className="px-6 py-4">
                        <div className="space-y-6">
                          <div className="border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Surgeon's Signature:</p>
                                  <div className="space-y-2">
                                    <Input 
                                      type="text" 
                                      placeholder="Type signature name or leave blank to upload"
                                      className="w-full"
                                      value={currentReport.ventralHernia?.closure?.surgeonSignatureText || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        closure: {
                                          ...currentReport.ventralHernia?.closure,
                                          surgeonSignatureText: e.target.value
                                        }
                                      })}
                                    />
                                    <input 
                                      type="file" 
                                      accept="image/*,.pdf" 
                                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            updateReport('ventralHernia', {
                                              ...currentReport.ventralHernia,
                                              closure: {
                                                ...currentReport.ventralHernia?.closure,
                                                surgeonSignature: reader.result as string
                                              }
                                            });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <p className="text-xs text-gray-500">Upload signature or stamp (Image/PDF)</p>
                                    {currentReport.ventralHernia?.closure?.surgeonSignature && (
                                      <div className="space-y-1">
                                        <p className="text-xs text-green-600">✓ Signature uploaded</p>
                                        <div className="border rounded p-2 bg-gray-50">
                                          <p className="text-xs text-gray-600 mb-1">Preview:</p>
                                          <img 
                                            src={currentReport.ventralHernia.closure.surgeonSignature} 
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
                                    <DateTime24HourInput
                                      className="w-full"
                                      value={currentReport.ventralHernia?.closure?.dateTime || getLocalDateTimeValue()}
                                      onChange={(value) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        closure: {
                                          ...currentReport.ventralHernia?.closure,
                                          dateTime: value
                                        }
                                      })}
                                    />
                                    <p className="text-xs text-gray-500">Display format: DD-MM-YYYY HH:MM</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs px-2 py-1"
                                      onClick={() => {
                                        updateReport('ventralHernia', {
                                          ...currentReport.ventralHernia,
                                          closure: {
                                            ...currentReport.ventralHernia?.closure,
                                            dateTime: getLocalDateTimeValue()
                                          }
                                        });
                                      }}
                                    >
                                      Set Current Date/Time
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-wrap justify-center gap-3 mt-8 mb-12">
                      <Button 
                        className="px-6 py-3 glass-button text-md"
                        onClick={() => {
                          handleExportPDF('ventralHernia');
                        }}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Print/Export PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="px-6 py-3 glass-button text-md"
                        onClick={handleSaveCurrentTemplateRecord}
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Save Patient
                      </Button>
                      <Button
                        variant="outline"
                        className="px-6 py-3 glass-button text-md"
                        onClick={clearAllVentralHerniaData}
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Clear All Data
                      </Button>
                    </div>
                    </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of your ventral hernia repair report</span>
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="max-h-[calc(100vh-8rem)] overflow-y-auto" ref={reportPreviewRef}>
                          <VentralHerniaReportPreview 
                            report={currentReport}
                            onEditVentralHerniaField={(section, field, value) => {
                              updateReport('ventralHernia', {
                                ...currentReport.ventralHernia,
                                [section]: {
                                  ...currentReport.ventralHernia[section],
                                  [field]: value
                                }
                              });
                              toast.success("Field updated successfully!");
                            }}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  </TabsContent>
                  
	                  <TabsContent value="rectal" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      {/* Left Column - Form Sections */}
                      <div className="2xl:col-span-2 space-y-6">
                        {/* Header with title and actions */}
                        <Card className="glass-card-light">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                  Colorectal Resection - Synoptic Operative Report
                                </h1>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="glass-button text-xs"
                                  onClick={() => {
                                    handleExportPDF('rectalCancer');
                                  }}
                                  disabled={isGeneratingPDF}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {isGeneratingPDF ? 'Generating...' : 'Print/Export PDF'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={handleSaveCurrentTemplateRecord}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Patient
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={clearAllRectalCancerData}
                                  title="Clear all rectal cancer data"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Clear All Data
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        {/* Rectal Cancer Form Component */}
		                        <RectalCancerForm 
		                          currentReport={currentReport}
		                          updateRectalCancer={updateRectalCancer}
		                          onBulkPatientInfoUpdate={updateRectalCancerPatientInfoBulk}
	                          currentExtractedPatientInfo={currentExtractedPatientInfo}
	                          onCurrentPatientChange={updateCurrentExtractedPatient}
		                          onExportPDF={() => handleExportPDF('rectalCancer')}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          onUndo={(section) => {
                            undoRectalCancer(section as keyof typeof rectalCancerHistory);
                          }}
                          onRedo={(section) => {
                            redoRectalCancer(section as keyof typeof rectalCancerHistory);
                          }}
                          onClear={(section) => {
                            clearRectalCancer(section as keyof typeof rectalCancerHistory);
                          }}
                          onClearAll={clearAllRectalCancerData}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Rectal Cancer Surgery"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={() => {}}
                              onProcedureFindingsUpdate={(data) => {
                                // Store surgical markings in rectal cancer procedureFindings
                                updateRectalCancer('procedureFindings', 'findings', data.findings);
                                updateRectalCancer('procedureFindings', 'additionalNotes', data.additionalNotes || '');
                              }}
                              currentProcedureFindings={currentReport.rectalCancer?.procedureFindings || { findings: '', additionalNotes: '' }}
                              diagramMarkingScale={1.8}
                              customImage={appendectomyImage}
                            />
                          }
                        />
                      </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Live Report
                            <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of colorectal resection findings</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div ref={reportPreviewRef}>
                            <RectalCancerReportPreview 
                              report={currentReport}
                              onEditRectalCancerField={(section, field, value) => {
                                updateReport('rectalCancer', {
                                  ...currentReport.rectalCancer,
                                  [section]: {
                                    ...currentReport.rectalCancer[section],
                                    [field]: value
                                  }
                                });
                                toast.success("Field updated successfully!");
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
	                    </div>
	                  </TabsContent>
                  
                  <TabsContent value="smallBowel" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <Card className="glass-card-light">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                  Small Bowel Surgery - Synoptic Operative Report
                                </h1>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={() => handleExportPDF('smallBowel')}
                                  disabled={isGeneratingPDF}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {isGeneratingPDF ? 'Generating...' : 'Print/Export PDF'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={handleSaveCurrentTemplateRecord}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Patient
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-xs"
                                  onClick={clearAllSmallBowelData}
                                  title="Clear all small bowel surgery data"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Clear All Data
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

		                        <SmallBowelSurgeryForm
		                          currentReport={currentReport}
		                          updateSmallBowel={updateSmallBowel}
		                          onBulkPatientInfoUpdate={updateSmallBowelPatientInfoBulk}
	                          currentExtractedPatientInfo={currentExtractedPatientInfo}
	                          onCurrentPatientChange={updateCurrentExtractedPatient}
		                          onExportPDF={() => handleExportPDF('smallBowel')}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          onUndo={(section) => {
                            undoSmallBowel(section as keyof typeof smallBowelHistory);
                          }}
                          onRedo={(section) => {
                            redoSmallBowel(section as keyof typeof smallBowelHistory);
                          }}
                          onClear={(section) => {
                            clearSmallBowel(section as keyof typeof smallBowelHistory);
                          }}
                          onClearAll={clearAllSmallBowelData}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Small Bowel Surgery"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={() => {}}
                              onProcedureFindingsUpdate={(data) => {
                                updateSmallBowel('procedureFindings', 'findings', data.findings);
                                updateSmallBowel(
                                  'procedureFindings',
                                  'additionalNotes',
                                  data.additionalNotes || ''
                                );
                              }}
                              currentProcedureFindings={
                                currentReport.smallBowel?.procedureFindings || {
                                  findings: "",
                                  additionalNotes: "",
                                }
                              }
                              diagramMarkingScale={1.8}
                              customImage={smallBowelDiagramImage}
                            />
                          }
                        />
                      </div>

                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">
                                Real-time preview of small bowel surgery findings
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <SmallBowelSurgeryReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cholecystectomy" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <Card className="glass-card-light">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                  Cholecystectomy - Synoptic Operative Report
                                </h1>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={() => handleExportPDF('cholecystectomy')}
                                  disabled={isGeneratingPDF}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {isGeneratingPDF ? 'Generating...' : 'Print/Export PDF'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={handleSaveCurrentTemplateRecord}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Patient
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-xs"
                                  onClick={clearAllCholecystectomyData}
                                  title="Clear all cholecystectomy data"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Clear All Data
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

		                        <CholecystectomyForm
		                          currentReport={currentReport}
		                          updateCholecystectomy={updateCholecystectomy}
		                          onBulkPatientInfoUpdate={updateCholecystectomyPatientInfoBulk}
	                          currentExtractedPatientInfo={currentExtractedPatientInfo}
	                          onCurrentPatientChange={updateCurrentExtractedPatient}
		                          onExportPDF={() => handleExportPDF('cholecystectomy')}
                                  onSavePatient={handleSaveCurrentTemplateRecord}
                                  isGeneratingPDF={isGeneratingPDF}
                          onUndo={(section) => {
                            undoCholecystectomy(section as keyof typeof cholecystectomyHistory);
                          }}
                          onRedo={(section) => {
                            redoCholecystectomy(section as keyof typeof cholecystectomyHistory);
                          }}
                          onClear={(section) => {
                            clearCholecystectomy(section as keyof typeof cholecystectomyHistory);
                          }}
                          onClearAll={clearAllCholecystectomyData}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Cholecystectomy"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={() => {}}
                              onProcedureFindingsUpdate={(data) => {
                                updateCholecystectomy('procedureFindings', 'findings', data.findings);
                                updateCholecystectomy(
                                  'procedureFindings',
                                  'additionalNotes',
                                  data.additionalNotes || ''
                                );
                              }}
                              currentProcedureFindings={
                                currentReport.cholecystectomy?.procedureFindings || {
                                  findings: '',
                                  additionalNotes: '',
                                }
                              }
                              diagramMarkingScale={1.5}
                              customImage={appendectomyImage}
                            />
                          }
                        />
                      </div>

                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">
                                Real-time preview of cholecystectomy findings
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <CholecystectomyReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="periAnal" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <Card className="glass-card-light">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                  Peri-Anal - Synoptic Operative Report
                                </h1>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={() => handleExportPDF('periAnal')}
                                  disabled={isGeneratingPDF}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {isGeneratingPDF ? 'Generating...' : 'Print/Export PDF'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-xs"
                                  onClick={handleSaveCurrentTemplateRecord}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Patient
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-xs"
                                  onClick={clearAllPeriAnalData}
                                  title="Clear all peri-anal data"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Clear All Data
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

		                        <PeriAnalForm
		                          currentReport={currentReport}
		                          updatePeriAnal={updatePeriAnal}
		                          onBulkPatientInfoUpdate={updatePeriAnalPatientInfoBulk}
	                          currentExtractedPatientInfo={currentExtractedPatientInfo}
	                          onCurrentPatientChange={updateCurrentExtractedPatient}
		                          onExportPDF={() => handleExportPDF('periAnal')}
                                  onSavePatient={handleSaveCurrentTemplateRecord}
                                  isGeneratingPDF={isGeneratingPDF}
                          onUndo={(section) => {
                            undoPeriAnal(section as keyof typeof periAnalHistory);
                          }}
                          onRedo={(section) => {
                            redoPeriAnal(section as keyof typeof periAnalHistory);
                          }}
                          onClear={(section) => {
                            clearPeriAnal(section as keyof typeof periAnalHistory);
                          }}
                          onClearAll={clearAllPeriAnalData}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Peri-Anal"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={() => {}}
                              currentProcedureFindings={currentReport.periAnal?.procedureFindings}
                              currentSurgicalDiagramState={{
                                activeVariant: Object.prototype.hasOwnProperty.call(
                                  periAnalDiagramImages,
                                  currentReport.periAnal?.procedureFindings?.activeDiagramVariant,
                                )
                                  ? currentReport.periAnal?.procedureFindings?.activeDiagramVariant
                                  : DEFAULT_PERI_ANAL_DIAGRAM_VARIANT,
                                markingsByVariant:
                                  currentReport.periAnal?.procedureFindings?.diagramMarkingsByVariant ||
                                  createInitialPeriAnalDiagramMarkings(),
                              }}
                              onSurgicalDiagramStateChange={(state) => {
                                updatePeriAnal('procedureFindings', 'activeDiagramVariant', state.activeVariant);
                                updatePeriAnal('procedureFindings', 'diagramMarkingsByVariant', state.markingsByVariant);
                                updatePeriAnal('procedureFindings', 'findings', JSON.stringify(state.markingsByVariant || {}));
                              }}
                              surgicalDiagramVariants={periAnalDiagramImages}
                              surgicalDiagramVariantLabels={periAnalDiagramLabels}
                              diagramMarkingScale={1.8}
                              showAllSurgicalDiagramVariants
                            />
                          }
                        />
                      </div>

                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">
                                Real-time preview of peri-anal findings
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <PeriAnalReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="gastroscopy" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <GastroscopyForm
                          currentReport={currentReport}
                          updateTemplate={(section, field, value) =>
                            updateSimpleTemplateSection("gastroscopy", section, field, value)
                          }
                          onBulkPatientInfoUpdate={(updates) =>
                            updateSimpleTemplatePatientInfoBulk("gastroscopy", updates)
                          }
                          currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
                          onExportPDF={() => handleExportPDF("gastroscopy")}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          isGeneratingPDF={isGeneratingPDF}
                        />
                      </div>
                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">
                                Real-time preview of gastroscopy findings
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <GastroscopyReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="colonoscopy" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <ColonoscopyForm
                          currentReport={currentReport}
                          updateTemplate={(section, field, value) =>
                            updateSimpleTemplateSection("colonoscopy", section, field, value)
                          }
                          onBulkPatientInfoUpdate={(updates) =>
                            updateSimpleTemplatePatientInfoBulk("colonoscopy", updates)
                          }
                          currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
                          onExportPDF={() => handleExportPDF("colonoscopy")}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          isGeneratingPDF={isGeneratingPDF}
                        />
                      </div>
                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">
                                Real-time preview of colonoscopy findings
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <ColonoscopyReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inguinalHernia" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <InguinalHerniaRepairForm
                          currentReport={currentReport}
                          updateTemplate={(section, field, value) =>
                            updateSimpleTemplateSection("inguinalHernia", section, field, value)
                          }
                          onBulkPatientInfoUpdate={(updates) =>
                            updateSimpleTemplatePatientInfoBulk("inguinalHernia", updates)
                          }
                          currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
                          onExportPDF={() => handleExportPDF("inguinalHernia")}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          isGeneratingPDF={isGeneratingPDF}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Inguinal Hernia Repair"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={(data) => {
                                updateSimpleTemplateSection("inguinalHernia", "procedureFindings", "findings", data.findings);
                                updateSimpleTemplateSection("inguinalHernia", "procedureFindings", "additionalNotes", data.additionalNotes || "");
                              }}
                              currentProcedureFindings={currentReport.inguinalHernia?.procedureFindings || { findings: "", additionalNotes: "" }}
                              diagramMarkingScale={1.5}
                              customImage={appendectomyImage}
                            />
                          }
                        />
                      </div>
                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">Live Report</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <InguinalHerniaRepairReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transanalMinimallyInvasiveSurgery" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <TransanalMinimallyInvasiveSurgeryForm
                          currentReport={currentReport}
                          updateTemplate={(section, field, value) =>
                            updateSimpleTemplateSection("transanalMinimallyInvasiveSurgery", section, field, value)
                          }
                          onBulkPatientInfoUpdate={(updates) =>
                            updateSimpleTemplatePatientInfoBulk("transanalMinimallyInvasiveSurgery", updates)
                          }
                          currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
                          onExportPDF={() => handleExportPDF("transanalMinimallyInvasiveSurgery")}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          isGeneratingPDF={isGeneratingPDF}
                        />
                      </div>
                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-sm">Live Report</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <TransanalMinimallyInvasiveSurgeryReportPreview report={currentReport} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="openGeneralSurgery" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <NarrativeSurgeryForm
                          currentReport={currentReport}
                          reportKey="openGeneralSurgery"
                          variant="general"
                          title="Open General Surgery - Narrative Report"
                          updateTemplate={(section, field, value) =>
                            updateSimpleTemplateSection("openGeneralSurgery", section, field, value)
                          }
                          onBulkPatientInfoUpdate={(updates) =>
                            updateSimpleTemplatePatientInfoBulk("openGeneralSurgery", updates)
                          }
                          currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
                          onExportPDF={() => handleExportPDF("openGeneralSurgery")}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          isGeneratingPDF={isGeneratingPDF}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Open General Surgery"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={(data) => {
                                updateSimpleTemplateSection("openGeneralSurgery", "procedureFindings", "findings", data.findings);
                                updateSimpleTemplateSection("openGeneralSurgery", "procedureFindings", "additionalNotes", data.additionalNotes || "");
                              }}
                              currentProcedureFindings={currentReport.openGeneralSurgery?.procedureFindings || { findings: "", additionalNotes: "" }}
                              diagramMarkingScale={1.5}
                              customImage={appendectomyImage}
                            />
                          }
                        />
                      </div>
                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader><CardTitle className="text-sm">Live Report</CardTitle></CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <NarrativeSurgeryReportPreview report={currentReport} reportKey="openGeneralSurgery" variant="general" title="OPEN GENERAL SURGERY NARRATIVE REPORT" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="openAbdominalSurgery" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                      <div className="2xl:col-span-2 space-y-6">
                        <NarrativeSurgeryForm
                          currentReport={currentReport}
                          reportKey="openAbdominalSurgery"
                          variant="abdominal"
                          title="Open Abdominal Surgery - Narrative Report"
                          updateTemplate={(section, field, value) =>
                            updateSimpleTemplateSection("openAbdominalSurgery", section, field, value)
                          }
                          onBulkPatientInfoUpdate={(updates) =>
                            updateSimpleTemplatePatientInfoBulk("openAbdominalSurgery", updates)
                          }
                          currentExtractedPatientInfo={currentExtractedPatientInfo}
                          onCurrentPatientChange={updateCurrentExtractedPatient}
                          onExportPDF={() => handleExportPDF("openAbdominalSurgery")}
                          onSavePatient={handleSaveCurrentTemplateRecord}
                          isGeneratingPDF={isGeneratingPDF}
                          diagramElement={
                            <ConditionalDiagramDisplay
                              selectedProcedures={["Open Abdominal Surgery"]}
                              onGastroscopyUpdate={() => {}}
                              onColonoscopyUpdate={(data) => {
                                updateSimpleTemplateSection("openAbdominalSurgery", "procedureFindings", "findings", data.findings);
                                updateSimpleTemplateSection("openAbdominalSurgery", "procedureFindings", "additionalNotes", data.additionalNotes || "");
                              }}
                              currentProcedureFindings={currentReport.openAbdominalSurgery?.procedureFindings || { findings: "", additionalNotes: "" }}
                              diagramMarkingScale={1.5}
                              customImage={appendectomyImage}
                            />
                          }
                        />
                      </div>
                      <div className="2xl:col-span-1">
                        <Card className="shadow-glass-heavy sticky top-6">
                          <CardHeader><CardTitle className="text-sm">Live Report</CardTitle></CardHeader>
                          <CardContent>
                            <div ref={reportPreviewRef}>
                              <NarrativeSurgeryReportPreview report={currentReport} reportKey="openAbdominalSurgery" variant="abdominal" title="OPEN ABDOMINAL SURGERY NARRATIVE REPORT" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
	                </Tabs>
                  ) : appSection === "patients" ? (
                    <PatientsTab
                      patients={patientDatabaseCache.patients}
                      records={patientDatabaseCache.records}
                      isLoading={isPatientDatabaseLoading}
                      isSyncing={isPatientDatabaseSyncing}
                      pendingQueueCount={pendingPatientSyncCount}
                      forcedProcedureFilter={forcedPatientsProcedureFilter}
                      onOpenRecord={handleOpenSavedRecord}
                      onStartNewEntry={handleStartNewEntry}
                      onExportRecord={handleExportSavedRecord}
                      onDeleteRecord={handleDeleteSavedRecord}
                      onUploadPatientAttachments={handleUploadPatientAttachments}
                      onDeletePatientAttachment={handleDeletePatientAttachment}
                      onDeletePatient={(patientId) =>
                        handleSetPatientDeletedState(patientId, new Date().toISOString())
                      }
                      onRestorePatient={(patientId) => handleSetPatientDeletedState(patientId, null)}
                      onPermanentDeletePatients={handlePermanentlyDeletePatients}
                    />
                  ) : (
                    <ReportsTab
                      patients={patientDatabaseCache.patients}
                      records={patientDatabaseCache.records}
                      onOpenProcedureFilter={handleOpenPatientsProcedureFilter}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </GlassContainer>
    </AppLayout>
  );
};

export default Index;
