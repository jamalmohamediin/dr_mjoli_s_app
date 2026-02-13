import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Microscope, Stethoscope, User, Download, Save, Edit, Trash2, ChevronDown, ChevronUp, Scissors, Shield, Activity, ClipboardList, FileSearch, Undo2, Redo2, RotateCcw } from "lucide-react";
import { PatientInfoForm } from "@/components/PatientInfoForm";
import { ProcedureInfoForm } from "@/components/ProcedureInfoForm";
import { ProcedureTypeSelection } from "@/components/ProcedureTypeSelection";
import { ConditionalDiagramDisplay } from "@/components/ConditionalDiagramDisplay";
import { ReportPreview } from "@/components/ReportPreview";
import { VentralHerniaReportPreview } from "@/components/VentralHerniaReportPreview";
import { AppendectomyReportPreview } from "@/components/AppendectomyReportPreview";
import { RectalCancerReportPreview } from "@/components/RectalCancerReportPreview";
import { RectalCancerForm } from "@/components/RectalCancerForm";
import { AppLayout, GlassContainer, GlassHeader } from "@/components/layout/AppLayout";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { captureReportAsPDF, saveDraft, DiagramCapture } from "@/utils/pdfGenerator";
import { generateFinalPDF, FinalDiagramCapture } from "@/utils/finalPdfGenerator";
import { generateAppendectomyPDF } from "@/utils/appendectomyPdfGenerator";
import { generateRectalCancerPDF } from "@/utils/rectalCancerPdfGenerator";
import { generateVentralHerniaPDF } from "@/utils/ventralHerniaPdfGenerator";
import { getLocalDateTimeValue, formatDateOnly, formatDOBForFilename } from "@/utils/dateFormatter";
import { saveToStorage, loadFromStorage, createAutoSave, clearAllStorage } from "@/utils/dataStorage";
import { toast } from "sonner";
import appendectomyImage from "@/assets/appendectomy.jpg";

const Index = () => {
  
  
  const [currentReport, setCurrentReport] = useState({
    patientInfo: {} as any,
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
    appendectomy: {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
    ventralHernia: {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
      operative: {
        herniaType: [],
        herniaTypeOther: '',
        herniaSite: [],
        herniaSiteOther: '',
        herniaDefects: '',
        numberOfDefects: '',
        contents: [],
        contentsOther: '',
        strangulation: '',
        meshInSitu: '',
        approach: [],
        approachOther: '',
        conversionReason: [],
        conversionReasonOther: '',
        trocarNumber: '',
        operationDescription: ''
      },
      procedure: {
        dissection: '',
        sacExcised: '',
        fatDissected: '',
        defectClosed: '',
        closureTechnique: [],
        closureTechniqueOther: '',
        closureMaterial: [],
        closureMaterialOther: '',
        repairType: '',
        meshType: [],
        meshPlacementOther: '',
        meshMaterial: [],
        meshMaterialOther: '',
        meshLength: '',
        meshWidth: '',
        fixation: [],
        fixationOther: '',
        intraOperativeDifficulty: [],
        intraOperativeDifficultyOther: '',
        primaryRepair: [],
        primaryRepairOther: '',
        complications: [],
        complicationOther: '',
        haemostasis: '',
        drain: '',
        drainDetails: '',
        fascialClosure: [],
        fascialClosureOther: '',
        fascialClosureMaterial: [],
        fascialClosureMaterialOther: '',
        skinClosure: [],
        skinClosureOther: '',
        skinClosureMaterial: [],
        skinClosureMaterialOther: '',
        specimenSent: [],
        specimenOther: '',
        laboratoryName: '',
        additionalNotes: '',
        postOperativeManagement: '',
        surgeonSignature: '',
        dateTime: ''
      }
    },
    rectalCancer: {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
    }
  });

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
    patientInfo: [currentReport.appendectomy?.patientInfo || {
      name: '', patientId: '', dateOfBirth: '', age: '', sex: '', sexOther: '', weight: '', height: '', bmi: '', asaScore: '', asaNotes: ''
    }],
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
  const [ventralHerniaHistory, setVentralHerniaHistory] = useState({
    patientInfo: [currentReport.ventralHernia?.patientInfo || {
      name: '', patientId: '', dateOfBirth: '', age: '', sex: '', sexOther: '', weight: '', height: '', bmi: '', asaScore: '', asaNotes: ''
    }],
    preoperative: [currentReport.ventralHernia?.preoperative || {
      surgeons: [''], assistants: [''], anaesthetists: [''], duration: '', startTime: '', endTime: '', indication: [], indicationOther: '', imaging: [], imagingOther: ''
    }],
    operative: [currentReport.ventralHernia?.operative || {
      herniaType: [], herniaTypeOther: '', herniaSite: [], herniaSiteOther: '', herniaDefects: '', numberOfDefects: '', contents: [], contentsOther: '', strangulation: '', meshInSitu: '', approach: [], approachOther: '', conversionReason: [], conversionReasonOther: '', trocarNumber: '', operationDescription: ''
    }],
    procedure: [currentReport.ventralHernia?.procedure || {
      dissection: '', sacExcised: '', fatDissected: '', defectClosed: '', closureTechnique: [], closureTechniqueOther: '', closureMaterial: [], closureMaterialOther: '', repairType: '', meshType: [], meshPlacementOther: '', meshMaterial: [], meshMaterialOther: '', meshLength: '', meshWidth: '', fixation: [], fixationOther: '', intraOperativeDifficulty: [], intraOperativeDifficultyOther: '', primaryRepair: [], primaryRepairOther: '', complications: [], complicationOther: '', haemostasis: '', drain: '', drainDetails: '', fascialClosure: [], fascialClosureOther: '', fascialClosureMaterial: [], fascialClosureMaterialOther: '', skinClosure: [], skinClosureOther: '', skinClosureMaterial: [], skinClosureMaterialOther: '', specimenSent: [], specimenOther: '', laboratoryName: '', additionalNotes: '', postOperativeManagement: ''
    }],
    procedureFindings: [currentReport.ventralHernia?.procedureFindings || {
      findings: '', additionalNotes: ''
    }]
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
    patientInfo: [currentReport.patientInfo || {}],
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
    patientInfo: [currentReport.rectalCancer?.patientInfo || {
      name: '', patientId: '', dateOfBirth: '', age: '', sex: '', sexOther: '', weight: '', height: '', bmi: '', asaScore: '', asaNotes: ''
    }],
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
  const [currentTab, setCurrentTab] = useState("procedure");
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
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentReport(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.success('Undone');
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentReport(JSON.parse(JSON.stringify(history[historyIndex + 1])));
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
          updated.patientInfo = JSON.parse(JSON.stringify(previousState));
        } else if (section === 'procedureInfo') {
          updated.selectedProcedures = previousState.selectedProcedures || [];
          updated.procedure = previousState.procedure || {};
          updated.gastroscopyCanvasData = previousState.gastroscopyCanvasData || '';
          updated.colonoscopyCanvasData = previousState.colonoscopyCanvasData || '';
        } else if (section === 'procedureTypes') {
          updated.gastroscopyFindings = previousState.gastroscopyFindings || { findings: [] };
          updated.colonoscopyFindings = previousState.colonoscopyFindings || { findings: [] };
          updated.procedureFindings = previousState.procedureFindings || { findings: '', additionalNotes: '' };
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
          updated.patientInfo = JSON.parse(JSON.stringify(nextState));
        } else if (section === 'procedureInfo') {
          updated.selectedProcedures = nextState.selectedProcedures || [];
          updated.procedure = nextState.procedure || {};
          updated.gastroscopyCanvasData = nextState.gastroscopyCanvasData || '';
          updated.colonoscopyCanvasData = nextState.colonoscopyCanvasData || '';
        } else if (section === 'procedureTypes') {
          updated.gastroscopyFindings = nextState.gastroscopyFindings || { findings: [] };
          updated.colonoscopyFindings = nextState.colonoscopyFindings || { findings: [] };
          updated.procedureFindings = nextState.procedureFindings || { findings: '', additionalNotes: '' };
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
      initialState = {};
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
        initialState = {};
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

  const clearAllEndoscopyData = () => {
    const initialEndoscopyData = {
      patientInfo: {},
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
      patientInfo: [{}],
      procedureInfo: [{}],
      gastroscopyFindings: [{ findings: [] }],
      colonoscopyFindings: [{ findings: [] }],
      specimen: [{}],
      conclusion: [''],
      followUp: [{}],
      signature: [{}]
    });

    setEndoscopyHistoryIndex({
      patientInfo: 0,
      procedureInfo: 0,
      gastroscopyFindings: 0,
      colonoscopyFindings: 0,
      specimen: 0,
      conclusion: 0,
      followUp: 0,
      signature: 0
    });

    toast.success("All endoscopy data cleared successfully!");
  };
  
  // Auto-save functionality with shorter debouncing for better user experience
  const autoSaveEndoscopy = createAutoSave('endoscopy_report', 3000); // 3 seconds for good responsiveness
  
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
        setCurrentReport(savedData);
        console.log('Restored previous session data for all templates');
      }
    }
  }, [enablePersistence]);
  
  // Helper function to check if saved data has meaningful content (very lenient - save almost everything)
  const hasValidData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    // Check if any section has meaningful data
    const patientInfo = data.patientInfo || {};
    const rectalCancer = data.rectalCancer || {};
    const ventralHernia = data.ventralHernia || {};
    const appendectomy = data.appendectomy || {};
    const gastroscopyFindings = data.gastroscopyFindings || {};
    const colonoscopyFindings = data.colonoscopyFindings || {};
    
    // Check various fields that indicate user input (be very inclusive)
    const hasPatientData = patientInfo.name || patientInfo.patientId || patientInfo.dateOfBirth || patientInfo.age || patientInfo.sex;
    const hasRectalData = rectalCancer.patientInfo?.name || rectalCancer.surgicalTeam?.surgeons?.some(s => s.trim()) || rectalCancer.operationType?.type?.length > 0;
    const hasVentralData = ventralHernia.patientInfo?.name || ventralHernia.preoperative?.surgeons?.some(s => s.trim()) || ventralHernia.operative?.herniaType?.length > 0;
    const hasAppendectomyData = appendectomy.patientInfo?.name || appendectomy.preoperative?.surgeons?.some(s => s.trim()) || appendectomy.procedure?.approach?.length > 0;
    const hasEndoscopyData = gastroscopyFindings.findings?.length > 0 || colonoscopyFindings.findings?.length > 0 || data.selectedProcedures?.length > 0;
    const hasNotes = data.notes?.trim() || data.conclusion?.trim();
    
    return hasPatientData || hasRectalData || hasVentralData || hasAppendectomyData || hasEndoscopyData || hasNotes;
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
    // Auto-save if persistence is enabled - save almost everything to ensure nothing is lost
    if (enablePersistence) {
      autoSaveEndoscopy(currentReport);
    }
  }, [currentReport, autoSaveEndoscopy, enablePersistence]);
  
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
  
  // Helper functions for automatic calculations
  const calculateBMI = (weight: string, height: string): string => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    
    if (isNaN(weightNum) || isNaN(heightNum) || weightNum <= 0 || heightNum <= 0) {
      return '';
    }
    
    // Convert height from cm to meters
    const heightInMeters = heightNum / 100;
    const bmi = weightNum / (heightInMeters * heightInMeters);
    
    return bmi.toFixed(1);
  };

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return '';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      return '';
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const followUpOptions = [
    'Barium Swallow',
    'Barium Enema', 
    'Operation',
    'CT Scan',
    'MRI',
    'Blood Tests',
    'Repeat Endoscopy',
    'Histology Results',
    'Other'
  ];

  const toggleExpand = (section: string) => {
    setExpanded({...expanded, [section]: !expanded[section]});
    if (!expanded[section]) {
      setActiveSection(section);
    }
  };

  const updateReport = (section: keyof typeof currentReport, data: any) => {
    console.log(`[Index updateReport] section: ${section}`, data);
    
    // Handle findings data
    if (section === 'gastroscopyFindings') {
      setCurrentReport(prev => ({
        ...prev,
        gastroscopyFindings: data,
        gastroscopyCanvasData: data.canvasImageData || prev.gastroscopyCanvasData
      }));
    } else if (section === 'colonoscopyFindings') {
      setCurrentReport(prev => ({
        ...prev,
        colonoscopyFindings: data,
        colonoscopyCanvasData: data.canvasImageData || prev.colonoscopyCanvasData
      }));
    } else if (section === 'selectedProcedures') {
      // When procedures change, clear findings data that are no longer relevant
      setCurrentReport(prev => {
        const newSelectedProcedures = data;
        const newState = { ...prev, selectedProcedures: newSelectedProcedures };
        
        // Check if gastroscopy is still selected
        const hasGastroscopyProcedure = newSelectedProcedures.some((proc: string) => 
          proc === "Gastroscopy" || 
          proc === "Gastroscopy + Colonoscopy" ||
          proc.includes("PEG Tube") ||
          proc.includes("ERCP") ||
          proc.includes("EUS") ||
          proc.includes("EMR") ||
          proc.includes("ESD") ||
          proc.includes("POEM") ||
          proc.includes("G-POEM") ||
          proc.includes("Variceal Banding") ||
          proc.includes("Manometry") ||
          proc.includes("pH Monitoring") ||
          proc.includes("Foreign Body Removal")
        );
        
        // Check if colonoscopy is still selected
        const hasColonoscopyProcedure = newSelectedProcedures.some((proc: string) => 
          proc === "Colonoscopy" || 
          proc === "Gastroscopy + Colonoscopy" ||
          proc.includes("Polypectomy") ||
          proc.includes("APC") ||
          proc.includes("EMR (Colon)") ||
          proc.includes("ESD (Colon)") ||
          proc.includes("Stricture Dilation (Colon)") ||
          proc.includes("Stent Placement (Colonic")
        );
        
        // Clear gastroscopy data if no gastroscopy procedures selected
        if (!hasGastroscopyProcedure) {
          newState.gastroscopyFindings = { findings: [] };
          newState.gastroscopyCanvasData = '';
        }
        
        // Clear colonoscopy data if no colonoscopy procedures selected
        if (!hasColonoscopyProcedure) {
          newState.colonoscopyFindings = { findings: [] };
          newState.colonoscopyCanvasData = '';
        }
        
        // Clear procedure findings if no procedures are selected at all, 
        // or if only main procedures (Gastroscopy/Colonoscopy) are selected without add-ons
        const mainProceduresOnly = newSelectedProcedures.every(proc => 
          proc === "Gastroscopy" || proc === "Colonoscopy" || proc === "Gastroscopy + Colonoscopy"
        );
        
        if (newSelectedProcedures.length === 0 || (mainProceduresOnly && newSelectedProcedures.length > 0)) {
          // Only clear if there are no add-on procedures that would require procedure findings
          const hasAddOnProcedures = newSelectedProcedures.some(proc => 
            !["Gastroscopy", "Colonoscopy", "Gastroscopy + Colonoscopy"].includes(proc)
          );
          
          if (!hasAddOnProcedures) {
            newState.procedureFindings = {
              findings: '',
              additionalNotes: ''
            };
          }
        }
        
        return newState;
      });
    } else {
      setCurrentReport(prev => {
        const next = {
          ...prev,
          [section]: section === 'media'
            ? data
            : section === 'conclusion'
              ? data
              : typeof data === 'object' && data !== null
                ? { ...prev[section], ...data }
                : data
        } as typeof prev;
        setTimeout(() => {
          addToHistory(next);
          
          // Also track endoscopy section history for section-specific undo/redo
          if (section === 'patientInfo') {
            setEndoscopyHistory(prevHistory => {
              const newHistory = [...(prevHistory.patientInfo || []), next.patientInfo];
              setEndoscopyHistoryIndex(prev => ({
                ...prev,
                patientInfo: newHistory.length - 1
              }));
              return {
                ...prevHistory,
                patientInfo: newHistory
              };
            });
          } else if (section === 'selectedProcedures' || section === 'gastroscopyCanvasData' || section === 'colonoscopyCanvasData') {
            const procedureData = {
              selectedProcedures: next.selectedProcedures || [],
              procedure: next.procedure || {},
              gastroscopyCanvasData: next.gastroscopyCanvasData || '',
              colonoscopyCanvasData: next.colonoscopyCanvasData || ''
            };
            setEndoscopyHistory(prevHistory => {
              const newHistory = [...(prevHistory.procedureInfo || []), procedureData];
              setEndoscopyHistoryIndex(prev => ({
                ...prev,
                procedureInfo: newHistory.length - 1
              }));
              return {
                ...prevHistory,
                procedureInfo: newHistory
              };
            });
          } else if (section === 'gastroscopyFindings' || section === 'colonoscopyFindings' || section === 'procedureFindings') {
            const findingsData = {
              gastroscopyFindings: next.gastroscopyFindings || { findings: [] },
              colonoscopyFindings: next.colonoscopyFindings || { findings: [] },
              procedureFindings: next.procedureFindings || { findings: '', additionalNotes: '' }
            };
            setEndoscopyHistory(prevHistory => {
              const newHistory = [...(prevHistory.procedureTypes || []), findingsData];
              setEndoscopyHistoryIndex(prev => ({
                ...prev,
                procedureTypes: newHistory.length - 1
              }));
              return {
                ...prevHistory,
                procedureTypes: newHistory
              };
            });
          } else if (section === 'specimen') {
            setEndoscopyHistory(prevHistory => {
              const newHistory = [...(prevHistory.specimen || []), next.specimen];
              setEndoscopyHistoryIndex(prev => ({
                ...prev,
                specimen: newHistory.length - 1
              }));
              return {
                ...prevHistory,
                specimen: newHistory
              };
            });
          }
        }, 0);
        return next;
      });
    }
  };

  // Create auto-save function with longer debouncing to reduce interference
  const autoSaveAppendectomy = createAutoSave('appendectomy_data', 10000); // 10 seconds instead of 2

  // Update appendectomy specific data
  const updateAppendectomy = (section: string, field: string, value: any) => {
    setCurrentReport(prev => {
      const newAppendectomy = {
        ...prev.appendectomy,
        [section]: {
          ...prev.appendectomy[section],
          [field]: value
        }
      };

      // Auto-calculate BMI if weight or height changes
      if (section === 'patientInfo' && (field === 'weight' || field === 'height')) {
        const weight = field === 'weight' ? value : newAppendectomy.patientInfo.weight;
        const height = field === 'height' ? value : newAppendectomy.patientInfo.height;
        const bmi = calculateBMI(weight, height);
        if (bmi) {
          newAppendectomy.patientInfo.bmi = bmi;
        }
      }

      // Auto-calculate age if date of birth changes
      if (section === 'patientInfo' && field === 'dateOfBirth') {
        const age = calculateAge(value);
        if (age) {
          newAppendectomy.patientInfo.age = age;
        }
      }

      const newReport = {
        ...prev,
        appendectomy: newAppendectomy
      };

      // Auto-save the updated data with debouncing (if persistence enabled)
      if (enablePersistence) {
        autoSaveAppendectomy(newReport.appendectomy);
      }

      return newReport;
    });

    // Add to history for undo/redo functionality
    setAppendectomyHistory(prevHistory => {
      const newHistory = { ...prevHistory };
      const currentIndex = appendectomyHistoryIndex[section as keyof typeof appendectomyHistoryIndex];
      
      // Remove any history after current index (when user makes new change after undo)
      newHistory[section as keyof typeof newHistory] = newHistory[section as keyof typeof newHistory]?.slice(0, currentIndex + 1) || [];
      
      // Add new state to history
      const newSectionData = {
        ...currentReport.appendectomy[section as keyof typeof currentReport.appendectomy],
        [field]: value
      };
      newHistory[section as keyof typeof newHistory].push(newSectionData);
      
      // Keep only last 20 history entries per section
      if (newHistory[section as keyof typeof newHistory]?.length > 20) {
        newHistory[section as keyof typeof newHistory] = newHistory[section as keyof typeof newHistory].slice(-20);
      }

      // Update history index with the new history length
      setAppendectomyHistoryIndex(prevIndex => ({
        ...prevIndex,
        [section]: (newHistory[section as keyof typeof newHistory]?.length || 1) - 1
      }));
      
      return newHistory;
    });
  };

  // Appendectomy undo/redo/clear functions
  const undoAppendectomy = (section: keyof typeof appendectomyHistory) => {
    const currentIndex = appendectomyHistoryIndex[section];
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = appendectomyHistory[section][newIndex];
      
      setCurrentReport(prev => ({
        ...prev,
        appendectomy: {
          ...prev.appendectomy,
          [section]: previousState
        }
      }));
      
      setAppendectomyHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} changes undone`);
    } else {
      toast.info(`No more actions to undo for ${section}`);
    }
  };

  const redoAppendectomy = (section: keyof typeof appendectomyHistory) => {
    const currentIndex = appendectomyHistoryIndex[section];
    const maxIndex = (appendectomyHistory[section] || []).length - 1;
    
    if (currentIndex < maxIndex) {
      const newIndex = currentIndex + 1;
      const nextState = appendectomyHistory[section][newIndex];
      
      setCurrentReport(prev => ({
        ...prev,
        appendectomy: {
          ...prev.appendectomy,
          [section]: nextState
        }
      }));
      
      setAppendectomyHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} changes redone`);
    } else {
      toast.info(`No more actions to redo for ${section}`);
    }
  };

  const clearAppendectomy = (section: keyof typeof appendectomyHistory) => {
    const initialState = {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      appendectomy: {
        ...prev.appendectomy,
        [section]: initialState[section]
      }
    }));

    // Add cleared state to history
    setAppendectomyHistory(prevHistory => ({
      ...prevHistory,
      [section]: [...(prevHistory[section] || []), initialState[section]]
    }));

    setAppendectomyHistoryIndex(prev => ({
      ...prev,
      [section]: (appendectomyHistory[section] || []).length
    }));

    toast.success(`${section} section cleared`);
  };

  // Ventral Hernia undo/redo/clear functions
  const undoVentralHernia = (section: keyof typeof ventralHerniaHistory) => {
    const currentIndex = ventralHerniaHistoryIndex[section];
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = ventralHerniaHistory[section][newIndex];
      
      setCurrentReport(prev => ({
        ...prev,
        ventralHernia: {
          ...prev.ventralHernia,
          [section]: previousState
        }
      }));
      
      setVentralHerniaHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} undo successful`);
    }
  };

  const redoVentralHernia = (section: keyof typeof ventralHerniaHistory) => {
    const currentIndex = ventralHerniaHistoryIndex[section];
    const maxIndex = (ventralHerniaHistory[section] || []).length - 1;
    
    if (currentIndex < maxIndex) {
      const newIndex = currentIndex + 1;
      const nextState = ventralHerniaHistory[section][newIndex];
      
      setCurrentReport(prev => ({
        ...prev,
        ventralHernia: {
          ...prev.ventralHernia,
          [section]: nextState
        }
      }));
      
      setVentralHerniaHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} redo successful`);
    }
  };

  const clearVentralHernia = (section: keyof typeof ventralHerniaHistory) => {
    const initialState = {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
      operative: {
        herniaType: [],
        herniaTypeOther: '',
        herniaSite: [],
        herniaSiteOther: '',
        herniaDefects: '',
        numberOfDefects: '',
        contents: [],
        contentsOther: '',
        strangulation: '',
        meshInSitu: '',
        approach: [],
        approachOther: '',
        conversionReason: [],
        conversionReasonOther: '',
        trocarNumber: '',
        operationDescription: ''
      },
      procedure: {
        dissection: '',
        sacExcised: '',
        fatDissected: '',
        defectClosed: '',
        closureTechnique: [],
        closureTechniqueOther: '',
        closureMaterial: [],
        closureMaterialOther: '',
        repairType: '',
        meshType: [],
        meshPlacementOther: '',
        meshMaterial: [],
        meshMaterialOther: '',
        meshLength: '',
        meshWidth: '',
        fixation: [],
        fixationOther: '',
        intraOperativeDifficulty: [],
        intraOperativeDifficultyOther: '',
        primaryRepair: [],
        primaryRepairOther: '',
        complications: [],
        complicationOther: '',
        haemostasis: '',
        drain: '',
        drainDetails: '',
        fascialClosure: [],
        fascialClosureOther: '',
        fascialClosureMaterial: [],
        fascialClosureMaterialOther: '',
        skinClosure: [],
        skinClosureOther: '',
        skinClosureMaterial: [],
        skinClosureMaterialOther: '',
        specimenSent: [],
        specimenOther: '',
        laboratoryName: '',
        additionalNotes: '',
        postOperativeManagement: ''
      },
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      ventralHernia: {
        ...prev.ventralHernia,
        [section]: initialState[section]
      }
    }));

    // Add cleared state to history
    setVentralHerniaHistory(prevHistory => ({
      ...prevHistory,
      [section]: [...(prevHistory[section] || []), initialState[section]]
    }));

    setVentralHerniaHistoryIndex(prev => ({
      ...prev,
      [section]: (ventralHerniaHistory[section] || []).length
    }));

    toast.success(`${section} section cleared`);
  };

  // Rectal Cancer undo/redo/clear functions
  const undoRectalCancer = (section: keyof typeof rectalCancerHistory) => {
    const currentIndex = rectalCancerHistoryIndex[section];
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = rectalCancerHistory[section][newIndex];
      
      setCurrentReport(prev => ({
        ...prev,
        rectalCancer: {
          ...prev.rectalCancer,
          [section]: previousState
        }
      }));
      
      setRectalCancerHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} undo successful`);
    }
  };

  const redoRectalCancer = (section: keyof typeof rectalCancerHistory) => {
    const currentIndex = rectalCancerHistoryIndex[section];
    const maxIndex = (rectalCancerHistory[section] || []).length - 1;
    
    if (currentIndex < maxIndex) {
      const newIndex = currentIndex + 1;
      const nextState = rectalCancerHistory[section][newIndex];
      
      setCurrentReport(prev => ({
        ...prev,
        rectalCancer: {
          ...prev.rectalCancer,
          [section]: nextState
        }
      }));
      
      setRectalCancerHistoryIndex(prev => ({
        ...prev,
        [section]: newIndex
      }));
      
      toast.success(`${section} redo successful`);
    }
  };

  const clearRectalCancer = (section: keyof typeof rectalCancerHistory) => {
    const initialState = {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
      operationType: {
        type: [],
        typeOther: '',
        neoadjuvantTreatment: '',
        neoadjuvantDetails: ''
      },
      surgicalApproach: {
        primaryApproach: [],
        conversionReason: [],
        conversionReasonOther: '',
        trocarNumber: ''
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
      },
      reconstruction: {
        reconstructionType: [],
        anastomosisDetails: {},
        stomaDetails: {},
        reconstructionOther: ''
      },
      operativeEvents: {
        intraoperativeComplications: [],
        intraoperativeComplicationsOther: '',
        drainInsertion: '',
        drainDetails: '',
        specimenExtraction: '',
        extractionSite: '',
        additionalProcedures: []
      },
      closure: {
        fascialClosure: [],
        fascialClosureOther: '',
        fascialClosureMaterial: [],
        fascialClosureMaterialOther: '',
        skinClosure: [],
        skinClosureOther: '',
        skinClosureMaterial: [],
        skinClosureMaterialOther: ''
      },
      procedureDetails: {
        surgeons: [''],
        assistants: [''],
        anaesthetists: [''],
        duration: '',
        startTime: '',
        endTime: '',
        additionalNotes: '',
        postOperativeManagement: ''
      },
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      rectalCancer: {
        ...prev.rectalCancer,
        [section]: initialState[section]
      }
    }));

    // Add cleared state to history
    setRectalCancerHistory(prevHistory => ({
      ...prevHistory,
      [section]: [...(prevHistory[section] || []), initialState[section]]
    }));

    setRectalCancerHistoryIndex(prev => ({
      ...prev,
      [section]: (rectalCancerHistory[section] || []).length
    }));

    toast.success(`${section} section cleared`);
  };

  const clearAllRectalCancerData = () => {
    const initialRectalCancer = {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
      operationType: {
        type: [],
        typeOther: '',
        neoadjuvantTreatment: '',
        neoadjuvantDetails: ''
      },
      surgicalApproach: {
        primaryApproach: [],
        conversionReason: [],
        conversionReasonOther: '',
        trocarNumber: ''
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
      },
      reconstruction: {
        reconstructionType: [],
        anastomosisDetails: {},
        stomaDetails: {},
        reconstructionOther: ''
      },
      operativeEvents: {
        intraoperativeComplications: [],
        intraoperativeComplicationsOther: '',
        drainInsertion: '',
        drainDetails: '',
        specimenExtraction: '',
        extractionSite: '',
        additionalProcedures: []
      },
      closure: {
        fascialClosure: [],
        fascialClosureOther: '',
        fascialClosureMaterial: [],
        fascialClosureMaterialOther: '',
        skinClosure: [],
        skinClosureOther: '',
        skinClosureMaterial: [],
        skinClosureMaterialOther: ''
      },
      procedureDetails: {
        surgeons: [''],
        assistants: [''],
        anaesthetists: [''],
        duration: '',
        startTime: '',
        endTime: '',
        additionalNotes: '',
        postOperativeManagement: ''
      },
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      rectalCancer: initialRectalCancer
    }));

    // Reset all history to initial states
    setRectalCancerHistory({
      patientInfo: [initialRectalCancer.patientInfo],
      operationType: [initialRectalCancer.operationType],
      surgicalApproach: [initialRectalCancer.surgicalApproach],
      mobilizationAndResection: [initialRectalCancer.mobilizationAndResection],
      reconstruction: [initialRectalCancer.reconstruction],
      operativeEvents: [initialRectalCancer.operativeEvents],
      closure: [initialRectalCancer.closure],
      procedureDetails: [initialRectalCancer.procedureDetails],
      procedureFindings: [initialRectalCancer.procedureFindings]
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

    toast.success("All rectal cancer data cleared successfully!");
  };

  const clearAllAppendectomyData = () => {
    const initialAppendectomy = {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
      }
      ,
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      appendectomy: initialAppendectomy
    }));

    // Reset history
    setAppendectomyHistory({
      patientInfo: [initialAppendectomy.patientInfo],
      preoperative: [initialAppendectomy.preoperative],
      intraoperative: [initialAppendectomy.intraoperative],
      procedure: [initialAppendectomy.procedure],
      closure: [initialAppendectomy.closure],
      procedureFindings: [initialAppendectomy.procedureFindings]
    });

    setAppendectomyHistoryIndex({
      patientInfo: 0,
      preoperative: 0,
      intraoperative: 0,
      procedure: 0,
      closure: 0,
      procedureFindings: 0
    });

    toast.success('All appendectomy data cleared');
  };

  const clearAllVentralHerniaData = () => {
    const initialVentralHernia = {
      patientInfo: {
        name: '',
        patientId: '',
        dateOfBirth: '',
        age: '',
        sex: '',
        sexOther: '',
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
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
      operative: {
        approach: [],
        reasonForConversion: '',
        trocarNumber: '',
        herniaType: [],
        herniaTypeOther: '',
        defectLocation: [],
        defectLocationOther: '',
        defectSize: {
          length: '',
          width: '',
          area: ''
        },
        contentsOfHernia: [],
        contentsOfHerniaOther: '',
        complications: [],
        complicationsOther: ''
      },
      procedure: {
        meshUsed: '',
        meshType: '',
        meshSize: '',
        meshPosition: [],
        meshPositionOther: '',
        fixationMethod: [],
        fixationMethodOther: '',
        adhesiolysis: '',
        adhesiolysisNotes: ''
      },
      procedureFindings: {
        findings: '',
        additionalNotes: ''
      }
    };

    setCurrentReport(prev => ({
      ...prev,
      ventralHernia: initialVentralHernia
    }));

    // Reset all history to initial states
    setVentralHerniaHistory({
      patientInfo: [initialVentralHernia.patientInfo],
      preoperative: [initialVentralHernia.preoperative],
      operative: [initialVentralHernia.operative],
      procedure: [initialVentralHernia.procedure],
      procedureFindings: [initialVentralHernia.procedureFindings]
    });

    setVentralHerniaHistoryIndex({
      patientInfo: 0,
      preoperative: 0,
      operative: 0,
      procedure: 0,
      procedureFindings: 0
    });

    toast.success("All ventral hernia data cleared successfully!");
  };

  // Handle clearing endoscopy data (section-specific or all)
  const handleClearData = (section?: string) => {
    if (section) {
      // Clear specific section
      switch (section) {
        case 'patientInfo':
          setCurrentReport(prev => ({
            ...prev,
            patientInfo: {}
          }));
          toast.success('Patient information cleared');
          break;
        
        case 'procedureInfo':
          setCurrentReport(prev => ({
            ...prev,
            procedureFindings: {
              findings: '',
              additionalNotes: ''
            }
          }));
          toast.success('Procedure information cleared');
          break;
        
        case 'procedureTypes':
          setCurrentReport(prev => ({
            ...prev,
            selectedProcedures: []
          }));
          toast.success('Procedure types cleared');
          break;
        
        case 'specimen':
          setCurrentReport(prev => ({
            ...prev,
            specimen: {
              sentForPathology: '',
              laboratoryName: '',
              otherSpecimensTaken: '',
              otherSpecimensDetails: ''
            }
          }));
          toast.success('Specimen information cleared');
          break;
        
        case 'gastroscopyFindings':
          setCurrentReport(prev => ({
            ...prev,
            gastroscopyFindings: { findings: [] },
            gastroscopyCanvasData: ''
          }));
          toast.success('Gastroscopy findings cleared');
          break;
        
        case 'colonoscopyFindings':
          setCurrentReport(prev => ({
            ...prev,
            colonoscopyFindings: { findings: [] },
            colonoscopyCanvasData: ''
          }));
          toast.success('Colonoscopy findings cleared');
          break;
        
        case 'conclusion':
          setCurrentReport(prev => ({
            ...prev,
            conclusion: ''
          }));
          toast.success('Conclusion cleared');
          break;
        
        case 'followUp':
          setCurrentReport(prev => ({
            ...prev,
            followUp: {
              enabled: false,
              options: [],
              other: '',
              notes: '',
              postOperativeManagement: ''
            }
          }));
          toast.success('Follow-up information cleared');
          break;
        
        case 'signature':
          setCurrentReport(prev => ({
            ...prev,
            signature: {
              surgeonSignature: '',
              surgeonSignatureText: '',
              dateTime: ''
            }
          }));
          toast.success('Signature cleared');
          break;
        
        default:
          toast.error('Unknown section');
          break;
      }
    } else {
      // Clear all endoscopy data
      setCurrentReport(prev => ({
        ...prev,
        patientInfo: {},
        gastroscopyFindings: { findings: [] },
        colonoscopyFindings: { findings: [] },
        media: [],
        notes: "",
        selectedProcedures: [],
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
          options: [],
          other: '',
          notes: '',
          postOperativeManagement: ''
        },
        signature: {
          surgeonSignature: '',
          surgeonSignatureText: '',
          dateTime: ''
        }
      }));
      toast.success('All endoscopy data cleared');
    }
  };

  // Update ventral hernia specific data
  const updateVentralHernia = (section: string, field: string, value: any) => {
    setCurrentReport(prev => {
      const newVentralHernia = {
        ...prev.ventralHernia,
        [section]: {
          ...prev.ventralHernia?.[section],
          [field]: value
        }
      };

      // Auto-calculate BMI if weight or height changes
      if (section === 'patientInfo' && (field === 'weight' || field === 'height')) {
        const weight = field === 'weight' ? value : newVentralHernia.patientInfo?.weight;
        const height = field === 'height' ? value : newVentralHernia.patientInfo?.height;
        const bmi = calculateBMI(weight, height);
        if (bmi) {
          newVentralHernia.patientInfo.bmi = bmi;
        }
      }

      // Auto-calculate age if date of birth changes
      if (section === 'patientInfo' && field === 'dateOfBirth') {
        const age = calculateAge(value);
        if (age) {
          newVentralHernia.patientInfo.age = age;
        }
      }

      // Add to history for undo/redo functionality
      setVentralHerniaHistory(prevHistory => ({
        ...prevHistory,
        [section]: [...(prevHistory[section as keyof typeof prevHistory] || []), newVentralHernia[section]]
      }));

      setVentralHerniaHistoryIndex(prev => ({
        ...prev,
        [section]: (ventralHerniaHistory[section as keyof typeof ventralHerniaHistory] || []).length
      }));

      return {
        ...prev,
        ventralHernia: newVentralHernia
      };
    });
  };

  // Update rectal cancer specific data
  const updateRectalCancer = (section: string, field: string, value: any) => {
    setCurrentReport(prev => {
      const newRectalCancer = {
        ...prev.rectalCancer,
        [section]: {
          ...prev.rectalCancer?.[section],
          [field]: value
        }
      };

      // Auto-calculate BMI if weight or height changes (if patient info exists)
      if (section === 'patientInfo' && (field === 'weight' || field === 'height')) {
        const weight = field === 'weight' ? value : newRectalCancer.patientInfo?.weight;
        const height = field === 'height' ? value : newRectalCancer.patientInfo?.height;
        const bmi = calculateBMI(weight, height);
        if (bmi) {
          newRectalCancer.patientInfo.bmi = bmi;
        }
      }

      // Auto-calculate age if date of birth changes (if patient info exists)
      if (section === 'patientInfo' && field === 'dateOfBirth') {
        const age = calculateAge(value);
        if (age) {
          newRectalCancer.patientInfo.age = age;
        }
      }

      // Add to history for undo/redo functionality
      setRectalCancerHistory(prevHistory => ({
        ...prevHistory,
        [section]: [...(prevHistory[section as keyof typeof prevHistory] || []), newRectalCancer[section]]
      }));

      setRectalCancerHistoryIndex(prev => ({
        ...prev,
        [section]: (rectalCancerHistory[section as keyof typeof rectalCancerHistory] || []).length
      }));

      return {
        ...prev,
        rectalCancer: newRectalCancer
      };
    });
  };

  const handleExportPDF = async (section?: string) => {
    console.log("=== EXPORT PDF CLICKED - NETLIFY PRODUCTION VERSION ===");
    console.log("Environment:", window.location.origin);
    console.log("User agent:", navigator.userAgent);
    console.log("PDF generation starting...");
    console.log("Current tab:", currentTab);
    console.log("Requested section:", section);
    
    // Check browser capabilities
    console.log("Browser supports download:", 'download' in document.createElement('a'));
    console.log("Browser supports blob:", typeof Blob !== 'undefined');
    console.log("Browser supports URL.createObjectURL:", typeof URL.createObjectURL === 'function');
    
    setIsGeneratingPDF(true);
    
    try {
      // Show user that PDF generation is starting
      toast.info("Starting PDF generation... Please allow downloads if prompted.");
      
      // Use the specific section if provided, otherwise use current tab
      const exportSection = section || currentTab;
      
      // Check if we're in appendectomy tab - if so, export the live report content
      if (exportSection === "appendectomy") {
        console.log("📋 Exporting appendectomy live report");
        console.log("Appendectomy data:", currentReport.appendectomy);
        
        // Extract surgical markings from procedure findings
        let surgicalMarkings = [];
        try {
          if (currentReport.appendectomy?.procedureFindings?.findings) {
            const markings = JSON.parse(currentReport.appendectomy.procedureFindings.findings);
            if (Array.isArray(markings) && markings.length > 0 && markings[0].type) {
              surgicalMarkings = markings;
            }
          }
        } catch (e) {
          // Not JSON, no surgical markings
        }

        // Use the new appendectomy PDF generator
        const result = await generateAppendectomyPDF(
          currentReport.appendectomy?.patientInfo?.name || 'Unknown Patient',
          currentReport.appendectomy?.patientInfo?.patientId || 'N/A',
          surgicalMarkings, // Pass surgical markings
          currentReport.appendectomy // Pass appendectomy data
        );
        
        if (result.success && result.blob) {
          // Create download link
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          // Create filename in format: PatientName_PatientID_Appendectomy_Report_dd_mm_yyyy
          const now = new Date();
          const day = now.getDate().toString().padStart(2, '0');
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const year = now.getFullYear();
          const dateFormatted = `${day}_${month}_${year}`;
          
          const cleanPatientName = (currentReport.appendectomy?.patientInfo?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
          const cleanPatientId = (currentReport.appendectomy?.patientInfo?.patientId || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
          
          link.download = `${cleanPatientName}_${cleanPatientId}_Appendectomy_Report_${dateFormatted}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Appendectomy report PDF generated successfully!");
        } else {
          throw new Error(result.error || "Failed to generate appendectomy PDF");
        }
        return;
      }
      
      // Check if we're in rectal cancer tab
      if (exportSection === "rectalCancer" || exportSection === "rectal") {
        console.log("📋 Exporting rectal cancer surgery live report");
        console.log("Rectal cancer data:", currentReport.rectalCancer);
        
        // Extract surgical markings from procedure findings
        let surgicalMarkings = [];
        try {
          if (currentReport.rectalCancer?.procedureFindings?.findings) {
            const markings = JSON.parse(currentReport.rectalCancer.procedureFindings.findings);
            if (Array.isArray(markings) && markings.length > 0 && markings[0].type) {
              surgicalMarkings = markings;
            }
          }
        } catch (e) {
          // Not JSON, no surgical markings
        }

        // Use the new rectal cancer PDF generator
        const result = await generateRectalCancerPDF(
          currentReport.rectalCancer?.patientInfo?.name || currentReport.patientInfo?.name || 'Unknown Patient',
          currentReport.rectalCancer?.patientInfo?.patientId || currentReport.patientInfo?.patientId || 'N/A',
          surgicalMarkings, // Pass surgical markings
          currentReport.rectalCancer, // Pass rectal cancer data
          currentReport.rectalCancer?.patientInfo || currentReport.patientInfo // Pass patient info
        );
        
        if (result.success && result.blob) {
          // Create download link
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          const patientName = (currentReport.rectalCancer?.patientInfo?.name || currentReport.patientInfo?.name || 'patient').replace(/\s+/g, '_');
          const dob = formatDOBForFilename(currentReport.rectalCancer?.patientInfo?.dateOfBirth || currentReport.patientInfo?.dateOfBirth);
          link.download = `${patientName}_${dob}_Rectal_Cancer_Surgery_Report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Rectal cancer surgery report PDF generated successfully!");
        } else {
          throw new Error(result.error || "Failed to generate rectal cancer PDF");
        }
        return;
      }
      
      // Check if we're in ventral hernia tab
      if (exportSection === "ventralHernia" || exportSection === "hernia") {
        console.log("📋 Exporting ventral hernia repair live report");
        console.log("Ventral hernia data:", currentReport.ventralHernia);
        
        // Extract surgical markings from procedure findings
        let surgicalMarkings = [];
        try {
          if (currentReport.ventralHernia?.procedureFindings?.findings) {
            const markings = JSON.parse(currentReport.ventralHernia.procedureFindings.findings);
            if (Array.isArray(markings) && markings.length > 0 && markings[0].type) {
              surgicalMarkings = markings;
            }
          }
        } catch (e) {
          // Not JSON, no surgical markings
        }

        // Use the new ventral hernia PDF generator
        const result = await generateVentralHerniaPDF(
          currentReport.ventralHernia?.patientInfo?.name || 'Unknown Patient',
          currentReport.ventralHernia?.patientInfo?.patientId || 'N/A',
          surgicalMarkings, // Pass surgical markings
          currentReport.ventralHernia // Pass ventral hernia data
        );
        
        if (result.success && result.blob) {
          // Create download link
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          // Format filename as: PatientName_PatientID_Ventral_Hernia_Report_DD_MM_YYYY
          const now = new Date();
          const day = now.getDate().toString().padStart(2, '0');
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const year = now.getFullYear();
          const formattedDate = `${day}_${month}_${year}`;
          
          const cleanPatientName = (currentReport.ventralHernia?.patientInfo?.name || 'Unknown_Patient').replace(/[^a-zA-Z0-9]/g, '_');
          const cleanPatientId = (currentReport.ventralHernia?.patientInfo?.patientId || 'Unknown_ID').replace(/[^a-zA-Z0-9]/g, '_');
          
          link.download = `${cleanPatientName}_${cleanPatientId}_Ventral_Hernia_Report_${formattedDate}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Ventral hernia repair report PDF generated successfully!");
        } else {
          throw new Error(result.error || "Failed to generate ventral hernia PDF");
        }
        return;
      }
      
      // Original endoscopy export logic
      console.log("currentReport:", currentReport);
      console.log("gastroscopy findings:", currentReport.gastroscopyFindings);
      console.log("colonoscopy findings:", currentReport.colonoscopyFindings);
      console.log("gastroscopy canvas data exists:", !!currentReport.gastroscopyCanvasData);
      console.log("colonoscopy canvas data exists:", !!currentReport.colonoscopyCanvasData);
      
      // USE FINAL PDF GENERATOR (completely new)  
      const finalDiagrams: FinalDiagramCapture[] = [];
      
      // Add diagrams if canvas data exists
      if (currentReport.gastroscopyCanvasData) {
        console.log("✅ Adding gastroscopy diagram to FINAL PDF");
        finalDiagrams.push({
          canvasImageData: currentReport.gastroscopyCanvasData,
          findings: currentReport.gastroscopyFindings?.findings || [],
          type: 'gastroscopy'
        });
      }
      
      if (currentReport.colonoscopyCanvasData) {
        console.log("✅ Adding colonoscopy diagram to FINAL PDF");
        finalDiagrams.push({
          canvasImageData: currentReport.colonoscopyCanvasData,
          findings: currentReport.colonoscopyFindings?.findings || [],
          type: 'colonoscopy'
        });
      }

      console.log("📊 Total diagrams for FINAL PDF:", finalDiagrams.length);

      const result = await generateFinalPDF(
        currentReport.patientInfo?.name || '',
        currentReport.patientInfo?.patientId || '',
        finalDiagrams.length > 0 ? finalDiagrams : undefined,
        currentReport
      );
      
      console.log("🎉 PDF Generation Result:", result);
      toast.success("PDF generated successfully! Check your downloads folder.");
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      toast.error(`PDF Export Failed: ${error.message}. Check browser console for details.`);
      
      // Show additional help to user
      setTimeout(() => {
        toast.info("Tip: Try allowing popups and downloads for this site, then refresh and try again.");
      }, 2000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    
    try {
      const draftId = saveDraft(currentReport);
      toast.success("Draft saved successfully!");
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle editing a finding from the report preview
  const handleEditFinding = (findingId: string, type: 'gastroscopy' | 'colonoscopy', updatedFinding?: any) => {
    if (updatedFinding) {
      // Update the finding data directly in the report (inline edit save)
      if (type === 'gastroscopy') {
        const currentFindings = currentReport.gastroscopyFindings?.findings || [];
        const updatedFindings = currentFindings.map((finding: any) => 
          finding.id === findingId ? { ...finding, ...updatedFinding } : finding
        );
        updateReport('gastroscopyFindings', { 
          ...currentReport.gastroscopyFindings, 
          findings: updatedFindings 
        });
      } else if (type === 'colonoscopy') {
        const currentFindings = currentReport.colonoscopyFindings?.findings || [];
        const updatedFindings = currentFindings.map((finding: any) => 
          finding.id === findingId ? { ...finding, ...updatedFinding } : finding
        );
        updateReport('colonoscopyFindings', { 
          ...currentReport.colonoscopyFindings, 
          findings: updatedFindings 
        });
      }
      toast.success("Finding updated successfully!");
    } else {
      // This is just to trigger inline editing in the ReportPreview component
      // The actual editing happens inline, no need to navigate anywhere
      toast.info("Edit the finding inline below.");
    }
  };

  // Handle removing a finding from the report preview
  const handleRemoveFinding = (findingId: string, type: 'gastroscopy' | 'colonoscopy') => {
    // Remove from the data first to update both UI and diagrams
    if (type === 'gastroscopy') {
      const currentFindings = currentReport.gastroscopyFindings?.findings || [];
      const updatedFindings = currentFindings.filter((finding: any) => finding.id !== findingId);
      updateReport('gastroscopyFindings', { 
        ...currentReport.gastroscopyFindings, 
        findings: updatedFindings 
      });
    } else if (type === 'colonoscopy') {
      const currentFindings = currentReport.colonoscopyFindings?.findings || [];
      const updatedFindings = currentFindings.filter((finding: any) => finding.id !== findingId);
      updateReport('colonoscopyFindings', { 
        ...currentReport.colonoscopyFindings, 
        findings: updatedFindings 
      });
    }
    
    // Also try to remove from the diagram component if available
    const methods = diagramMethods[type];
    if (methods?.removeFinding) {
      methods.removeFinding(findingId);
    }
    
    toast.success("Finding removed successfully!");
  };

  // Handle editing procedure findings from the report preview
  const handleEditProcedureFindings = (updatedFindings?: string) => {
    if (updatedFindings !== undefined) {
      // Update the findings data (inline edit save)
      updateReport('procedureFindings', {
        ...currentReport.procedureFindings,
        findings: updatedFindings
      });
      toast.success("Procedure findings updated successfully!");
    } else {
      // This is just to trigger inline editing in the ReportPreview component
      toast.info("Edit the findings inline below.");
    }
  };

  // Handle removing procedure findings from the report preview
  const handleRemoveProcedureFindings = () => {
    updateReport('procedureFindings', {
      findings: '',
      additionalNotes: ''
    });
    toast.success("Procedure findings removed successfully!");
  };

  // Handle redo from live report
  const handleRedoFinding = (type: 'gastroscopy' | 'colonoscopy') => {
    const methods = diagramMethods[type];
    if (methods?.redoLastAction) {
      methods.redoLastAction();
      toast.success("Action redone successfully!");
    } else {
      toast.info(`Please use the ${type} diagram to redo actions.`);
    }
  };

  // Handle undo from live report
  const handleUndoFinding = (type: 'gastroscopy' | 'colonoscopy') => {
    const methods = diagramMethods[type];
    if (methods?.undoLastAction) {
      methods.undoLastAction();
      toast.success("Action undone successfully!");
    } else {
      toast.info(`Please use the ${type} diagram to undo actions.`);
    }
  };

  // Handle editing patient info from live report
  const handleEditPatientInfo = (field: string, value: string) => {
    updateReport('patientInfo', {
      ...currentReport.patientInfo,
      [field]: value
    });
    toast.success("Patient information updated successfully!");
  };

  // Handle editing conclusion from live report
  const handleEditConclusion = (updatedConclusion?: string) => {
    if (updatedConclusion !== undefined) {
      updateReport('conclusion', updatedConclusion);
      toast.success("Conclusion updated successfully!");
    }
  };

  // Handle removing conclusion from live report
  const handleRemoveConclusion = () => {
    updateReport('conclusion', '');
    toast.success("Conclusion removed successfully!");
  };

  // Handle editing follow-up from live report
  const handleEditFollowUp = (field: 'options' | 'other' | 'notes', value: any) => {
    updateReport('followUp', {
      ...currentReport.followUp,
      [field]: value,
      enabled: field === 'options' ? (Array.isArray(value) ? value.length > 0 : false) : currentReport.followUp?.enabled || true
    });
    toast.success("Follow-up updated successfully!");
  };

  // Handle removing follow-up from live report
  const handleRemoveFollowUp = () => {
    updateReport('followUp', {
      enabled: false,
      options: [],
      other: '',
      notes: ''
    });
    toast.success("Follow-up removed successfully!");
  };

  // Development helper function to clear persistent data
  const clearPersistentData = () => {
    if (clearAllStorage()) {
      toast.success("All persistent data cleared successfully!");
      // Refresh the page to reset all state
      window.location.reload();
    } else {
      toast.error("Failed to clear persistent data");
    }
  };

  // Development helper function to toggle persistence
  const togglePersistence = () => {
    const newState = !enablePersistence;
    if (newState) {
      localStorage.removeItem('disable_persistence');
      toast.success("Persistence enabled - your data will be saved");
    } else {
      localStorage.setItem('disable_persistence', 'true');
      toast.success("Persistence disabled - perfect for development");
    }
    window.location.reload();
  };

  // Development helpers: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        clearPersistentData();
      } else if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        togglePersistence();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enablePersistence]);

  return (
    <AppLayout>
      <GlassContainer>
        {/* Glass Header */}
        <GlassHeader
          title="Gastroenterology Templates"
          subtitle=""
          icon={<Stethoscope className="h-16 w-16 text-gray-700" />}
        />

        <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
          {/* Main Content with Tabs */}
          <div className="2xl:col-span-3">
            <Card className="shadow-glass-heavy">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Microscope className="h-5 w-5 text-gray-600" />
                      Patient & Procedure Documentation
                    </CardTitle>
                    <CardDescription>
                      Complete patient information and procedure documentation
                    </CardDescription>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleClearData()}
                    title="Clear all endoscopy data"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="procedure" className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Endoscopy
                    </TabsTrigger>
                    <TabsTrigger value="appendectomy" className="flex items-center gap-2">
                      <Scissors className="h-4 w-4" />
                      Appendicectomy
                    </TabsTrigger>
                    <TabsTrigger value="hernia" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Ventral Hernia Repair
                    </TabsTrigger>
                    <TabsTrigger value="rectal" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Rectal Cancer Surgery
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="procedure" className="mt-6 space-y-6">
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
                                <p className="text-sm font-medium text-gray-700 mb-2">Date & Time:</p>
                                <Input 
                                  type="datetime-local" 
                                  className="w-full"
                                  value={currentReport.signature?.dateTime || ''}
                                  onChange={(e) => updateReport('signature', {
                                    ...currentReport.signature,
                                    dateTime: e.target.value
                                  })}
                                />
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
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-600" />
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
                              variant="destructive" 
                              size="sm" 
                              className="text-xs"
                              onClick={clearAllEndoscopyData}
                              title="Clear all endoscopy data"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Clear All Data
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass-button text-xs"
                              onClick={() => handleClearData()}
                            >
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
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-md">
                              <Scissors className="w-6 h-6 text-blue-600" />
                            </div>
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
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Patient Name:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.name}
                                onChange={(e) => updateAppendectomy('patientInfo', 'name', e.target.value)}
                                placeholder="Enter Patient Name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Patient ID:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.patientId}
                                onChange={(e) => updateAppendectomy('patientInfo', 'patientId', e.target.value)}
                                placeholder="Enter Patient ID"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Date Of Birth (dd/mm/yyyy):</label>
                              <div className="w-full">
                                <Input 
                                  className="w-full" 
                                  type="date" 
                                  lang="en-GB"
                                  value={currentReport.appendectomy.patientInfo.dateOfBirth}
                                  onChange={(e) => updateAppendectomy('patientInfo', 'dateOfBirth', e.target.value)}
                                />
                                {currentReport.appendectomy.patientInfo.dateOfBirth && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Display format: {formatDateOnly(currentReport.appendectomy.patientInfo.dateOfBirth)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Age:</label>
                              <Input 
                                className="w-full bg-gray-100" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.age}
                                placeholder="Calculated from the Date Of Birth"
                                readOnly
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Sex:</label>
                              <div className="space-y-2">
                                <select 
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  value={currentReport.appendectomy.patientInfo.sex}
                                  onChange={(e) => updateAppendectomy('patientInfo', 'sex', e.target.value)}
                                >
                                  <option value="">Select Sex</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                </select>
                                {currentReport.appendectomy.patientInfo.sex === 'other' && (
                                  <Input
                                    className="w-full"
                                    type="text"
                                    placeholder="Please Specify"
                                    value={currentReport.appendectomy.patientInfo.sexOther || ''}
                                    onChange={(e) => updateAppendectomy('patientInfo', 'sexOther', e.target.value)}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Weight:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.weight}
                                onChange={(e) => updateAppendectomy('patientInfo', 'weight', e.target.value)}
                                placeholder="Enter Weight (Kg)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Height:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.height}
                                onChange={(e) => updateAppendectomy('patientInfo', 'height', e.target.value)}
                                placeholder="Enter Height (Cm)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">BMI:</label>
                              <Input 
                                className="w-full bg-gray-100" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.bmi}
                                placeholder="Calculated from Height and Weight"
                                readOnly
                              />
                            </div>
                            <ASAClassificationSection
                              selectedASA={currentReport.appendectomy.patientInfo.asaScore}
                              onASAChange={(value) => updateAppendectomy('patientInfo', 'asaScore', value)}
                              notes={currentReport.appendectomy.patientInfo.asaNotes}
                              onNotesChange={(value) => updateAppendectomy('patientInfo', 'asaNotes', value)}
                              showNotes={true}
                            />
                          </div>
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

                            {/* Operation Description - moved here after Preoperative Imaging */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                              <Textarea 
                                className="w-full min-h-[100px]"
                                placeholder="Please describe the surgical approach and key procedural steps"
                                value={currentReport.appendectomy?.procedure?.operationDescription || ''}
                                onChange={(e) => updateAppendectomy('procedure', 'operationDescription', e.target.value)}
                              />
                            </div>

                            {/* Duration of Operation with Start and End Times - moved here after Preoperative Imaging */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Start Time:</label>
                                <Input 
                                  className="w-full" 
                                  type="time" 
                                  placeholder="HH:MM" 
                                  value={currentReport.appendectomy.preoperative.startTime}
                                  onChange={(e) => {
                                    updateAppendectomy('preoperative', 'startTime', e.target.value);
                                    // Auto-calculate duration when both times are available
                                    if (e.target.value && currentReport.appendectomy.preoperative.endTime) {
                                      const duration = calculateDuration(e.target.value, currentReport.appendectomy.preoperative.endTime);
                                      updateAppendectomy('preoperative', 'duration', duration);
                                    }
                                  }}
                                />
                                <div className="text-sm text-gray-600">24-hour format</div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-gray-800 font-medium">End Time:</label>
                                <Input 
                                  className="w-full" 
                                  type="time" 
                                  placeholder="HH:MM" 
                                  value={currentReport.appendectomy.preoperative.endTime}
                                  onChange={(e) => {
                                    updateAppendectomy('preoperative', 'endTime', e.target.value);
                                    // Auto-calculate duration when both times are available
                                    if (currentReport.appendectomy.preoperative.startTime && e.target.value) {
                                      const duration = calculateDuration(currentReport.appendectomy.preoperative.startTime, e.target.value);
                                      updateAppendectomy('preoperative', 'duration', duration);
                                    }
                                  }}
                                />
                                <div className="text-sm text-gray-600">24-hour format</div>
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
                              <div className="ml-4 mb-4">
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
                              
                              <div className="ml-4">
                                <Card className="glass-card-light">
                                  <CardContent>
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
                                      currentProcedureFindings={{ findings: '', additionalNotes: '' }}
                                      customImage={appendectomyImage}
                                    />
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            {/* Intraoperative Findings - moved from Section III */}
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

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Method of Appendiceal Vessel Ligation:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Ligature', 'Energy Device', 'Stapler', 'Other'].map(control => (
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
                                  <Input 
                                    type="datetime-local" 
                                    className="w-full"
                                    value={currentReport.appendectomy?.closure?.dateTime || getLocalDateTimeValue()}
                                    onChange={(e) => updateAppendectomy('closure', 'dateTime', e.target.value)}
                                  />
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

                    {/* Preview & Export Button */}
                    <div className="flex justify-center mt-8 mb-12">
                      <Button 
                        className="px-8 py-4 glass-button text-md"
                        onClick={() => {
                          setCurrentTab('appendectomy');
                          handleExportPDF();
                        }}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Preview & Export PDF
                      </Button>
                    </div>
                    </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-gray-600" />
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
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 p-2 bg-green-100 rounded-md">
                              <Shield className="w-6 h-6 text-green-600" />
                            </div>
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
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Patient Name:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter Patient Name"
                                value={currentReport.ventralHernia?.patientInfo?.name || ''}
                                onChange={(e) => updateReport('ventralHernia', {
                                  ...currentReport.ventralHernia,
                                  patientInfo: {
                                    ...currentReport.ventralHernia?.patientInfo,
                                    name: e.target.value
                                  }
                                })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Patient ID:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter Patient ID"
                                value={currentReport.ventralHernia?.patientInfo?.patientId || ''}
                                onChange={(e) => updateVentralHernia('patientInfo', 'patientId', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Date Of Birth (dd/mm/yyyy):</label>
                              <div className="w-full">
                                <Input 
                                  className="w-full" 
                                  type="date" 
                                  lang="en-GB"
                                  value={currentReport.ventralHernia?.patientInfo?.dateOfBirth || ''}
                                  onChange={(e) => updateVentralHernia('patientInfo', 'dateOfBirth', e.target.value)}
                                />
                                {currentReport.ventralHernia?.patientInfo?.dateOfBirth && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Display format: {formatDateOnly(currentReport.ventralHernia.patientInfo.dateOfBirth)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Age:</label>
                              <Input 
                                className="w-full bg-gray-100" 
                                type="text" 
                                placeholder="Calculated from the Date Of Birth"
                                value={currentReport.ventralHernia?.patientInfo?.age || ''}
                                readOnly
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Sex:</label>
                              <div className="w-full space-y-2">
                                <select 
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  value={currentReport.ventralHernia?.patientInfo?.sex || ''}
                                  onChange={(e) => updateReport('ventralHernia', {
                                    ...currentReport.ventralHernia,
                                    patientInfo: {
                                      ...currentReport.ventralHernia?.patientInfo,
                                      sex: e.target.value
                                    }
                                  })}
                                >
                                  <option value="">Select Sex</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                </select>
                                {currentReport.ventralHernia?.patientInfo?.sex === 'other' && (
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="Please Specify"
                                    value={currentReport.ventralHernia?.patientInfo?.sexOther || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      patientInfo: {
                                        ...currentReport.ventralHernia?.patientInfo,
                                        sexOther: e.target.value
                                      }
                                    })}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Weight:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter Weight (Kg)"
                                value={currentReport.ventralHernia?.patientInfo?.weight || ''}
                                onChange={(e) => updateVentralHernia('patientInfo', 'weight', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Height:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter Height (Cm)"
                                value={currentReport.ventralHernia?.patientInfo?.height || ''}
                                onChange={(e) => updateVentralHernia('patientInfo', 'height', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">BMI:</label>
                              <Input 
                                className="w-full bg-gray-100" 
                                type="text" 
                                placeholder="Calculated from Height and Weight"
                                value={currentReport.ventralHernia?.patientInfo?.bmi || ''}
                                readOnly
                              />
                            </div>
                            <ASAClassificationSection
                              selectedASA={currentReport.ventralHernia?.patientInfo?.asaScore || ''}
                              onASAChange={(value) => updateVentralHernia('patientInfo', 'asaScore', value)}
                              notes={currentReport.ventralHernia?.patientInfo?.asaNotes || ''}
                              onNotesChange={(value) => updateVentralHernia('patientInfo', 'asaNotes', value)}
                              showNotes={true}
                            />
                          </div>
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

                            {/* Operation Description Section - moved here after Preoperative Imaging */}
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

                            {/* Duration of operation with Start/End times - moved here after Preoperative Imaging */}
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Duration of operation (min):</label>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-gray-600">Start Time</label>
                                  <Input
                                    type="time"
                                    value={currentReport.ventralHernia?.preoperative?.startTime || ''}
                                    onChange={(e) => {
                                      const startTime = e.target.value;
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
                                    placeholder="Start Time"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">End Time</label>
                                  <Input
                                    type="time"
                                    value={currentReport.ventralHernia?.preoperative?.endTime || ''}
                                    onChange={(e) => {
                                      const endTime = e.target.value;
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
                                    placeholder="End Time"
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
                              <div className="ml-4 mb-4">
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
                              
                              <div className="ml-4">
                                <Card className="glass-card-light">
                                  <CardContent>
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
                                      currentProcedureFindings={{ findings: '', additionalNotes: '' }}
                                      customImage={appendectomyImage}
                                    />
                                  </CardContent>
                                </Card>
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
                                      <span className="text-sm text-gray-700">Details:</span>
                                      <Input 
                                        type="text" 
                                        className="w-48" 
                                        placeholder="Site and Type"
                                        value={currentReport.ventralHernia?.procedure?.drainDetails || ''}
                                        onChange={(e) => updateVentralHernia('procedure', 'drainDetails', e.target.value)}
                                        disabled={currentReport.ventralHernia?.procedure?.drain !== 'Yes'}
                                      />
                                    </div>
                                  </div>
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
                                    <Input 
                                      type="datetime-local" 
                                      className="w-full"
                                      value={currentReport.ventralHernia?.closure?.dateTime || getLocalDateTimeValue()}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        closure: {
                                          ...currentReport.ventralHernia?.closure,
                                          dateTime: e.target.value
                                        }
                                      })}
                                    />
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

                    {/* Preview & Export Button */}
                    <div className="flex justify-center mt-8 mb-12">
                      <Button 
                        className="px-8 py-4 glass-button text-md"
                        onClick={() => {
                          handleExportPDF('ventralHernia');
                        }}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Preview & Export PDF
                      </Button>
                    </div>
                    </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-gray-600" />
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
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 p-2 bg-red-100 rounded-md">
                                  <Activity className="w-6 h-6 text-red-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                  Rectal Cancer Surgery - Synoptic Operative Report
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
                          onExportPDF={() => handleExportPDF('rectalCancer')}
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
                              customImage={appendectomyImage}
                            />
                          }
                        />
                      </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-600" />
                            Live Report
                            <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of rectal cancer surgery findings</span>
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
                </Tabs>
              </CardContent>
            </Card>
          </div>

        </div>
      </GlassContainer>
    </AppLayout>
  );
};

export default Index;
