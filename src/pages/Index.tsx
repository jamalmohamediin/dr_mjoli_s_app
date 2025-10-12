import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Microscope, Stethoscope, User, Download, Save, Edit, Trash2, ChevronDown, ChevronUp, Scissors, Shield, Activity, ClipboardList, FileSearch } from "lucide-react";
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
import { getLocalDateTimeValue, formatDateOnly } from "@/utils/dateFormatter";
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
    conclusion: '',
    followUp: {
      enabled: false,
      options: [] as string[],
      other: '',
      notes: ''
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
        weight: '',
        height: '',
        bmi: '',
        asaScore: '',
        asaNotes: ''
      },
      preoperative: {
        surgeons: [''],
        assistants: [''],
        anaesthetist: '',
        duration: '',
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
    },
    ventralHernia: {
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
      preoperative: {
        surgeons: [''],
        assistants: [''],
        anaesthetist: '',
        duration: '',
        indication: [],
        indicationOther: ''
      },
      operative: {
        herniaType: [],
        herniaTypeOther: '',
        herniaSite: [],
        herniaSiteOther: '',
        herniaDefects: '',
        strangulation: '',
        meshInSitu: '',
        approach: [],
        approachOther: ''
      },
      procedure: {
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
        primaryApproach: '',
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
        anaesthetist: '',
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

  // Appendectomy specific state
  const [activeSection, setActiveSection] = useState("section1");
  const [expanded, setExpanded] = useState({
    section1: true,
    section2: true,
    section3: false,
    section4: false,
    section5: false
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
      setCurrentReport(prev => ({
        ...prev,
        [section]: section === 'media' 
          ? data 
          : section === 'conclusion' 
            ? data 
            : typeof data === 'object' && data !== null
              ? { ...prev[section], ...data }
              : data
      }));
    }
  };

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

      return {
        ...prev,
        appendectomy: newAppendectomy
      };
    });
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
          link.download = `appendectomy_report_${currentReport.appendectomy?.patientInfo?.name?.replace(/\s+/g, '_') || 'patient'}_${new Date().getTime()}.pdf`;
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
          currentReport.patientInfo?.name || 'Unknown Patient',
          currentReport.patientInfo?.patientId || 'N/A',
          surgicalMarkings, // Pass surgical markings
          currentReport.rectalCancer, // Pass rectal cancer data
          currentReport.patientInfo // Pass patient info
        );
        
        if (result.success && result.blob) {
          // Create download link
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rectal_cancer_report_${currentReport.patientInfo?.name?.replace(/\s+/g, '_') || 'patient'}_${new Date().getTime()}.pdf`;
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
          currentReport.patientInfo?.name || 'Unknown Patient',
          currentReport.patientInfo?.patientId || 'N/A',
          surgicalMarkings, // Pass surgical markings
          currentReport.ventralHernia // Pass ventral hernia data
        );
        
        if (result.success && result.blob) {
          // Create download link
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ventral_hernia_report_${currentReport.patientInfo?.name?.replace(/\s+/g, '_') || 'patient'}_${new Date().getTime()}.pdf`;
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
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-gray-600" />
                  Patient & Procedure Documentation
                </CardTitle>
                <CardDescription>
                  Complete patient information and procedure documentation
                </CardDescription>
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
                      Appendectomy
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
                          Patient Details
                        </CardTitle>
                        <CardDescription>
                          Enter the patient's personal and medical information
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <PatientInfoForm 
                          onUpdate={(data) => updateReport('patientInfo', data)}
                          currentData={currentReport.patientInfo}
                        />
                        
                        <div className="space-y-4 pt-6 border-t">
                          <div>
                            <h3 className="text-base font-semibold mb-4">Procedure Information</h3>
                            <p className="text-sm text-gray-500 mb-4">Enter procedure-specific details</p>
                          </div>
                          <ProcedureInfoForm 
                            onUpdate={(data) => updateReport('patientInfo', data)}
                            initialData={currentReport.patientInfo}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Procedure Type Selection */}
                    <ProcedureTypeSelection
                      onUpdate={(procedures) => updateReport('selectedProcedures', procedures)}
                      initialProcedures={currentReport.selectedProcedures}
                    />
                    
                    {/* Conditional Diagram Display */}
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
                        </div>
                      </CardContent>
                    </Card>

                    {/* Surgeon Signature Section */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-black">Surgeon's Signature</span>
                            <span className="text-xs text-gray-500 font-normal ml-2">Document with signature and date/time</span>
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                              disabled={isGeneratingPDF}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Section I: Patient Information */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${activeSection === "section1" ? "bg-blue-50" : ""}`}
                        onClick={() => toggleExpand("section1")}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section1 ? "transform rotate-180" : ""}`} />
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
                                placeholder="Enter patient name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Patient ID:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.patientId}
                                onChange={(e) => updateAppendectomy('patientInfo', 'patientId', e.target.value)}
                                placeholder="Enter patient ID"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Date Of Birth:</label>
                              <div className="w-full">
                                <Input 
                                  className="w-full" 
                                  type="date" 
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
                                placeholder="Calculated from date of birth"
                                readOnly
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Sex:</label>
                              <select 
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={currentReport.appendectomy.patientInfo.sex}
                                onChange={(e) => updateAppendectomy('patientInfo', 'sex', e.target.value)}
                              >
                                <option value="">Select sex</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Weight:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.weight}
                                onChange={(e) => updateAppendectomy('patientInfo', 'weight', e.target.value)}
                                placeholder="Enter weight (kg)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Height:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.height}
                                onChange={(e) => updateAppendectomy('patientInfo', 'height', e.target.value)}
                                placeholder="Enter height (cm)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">BMI:</label>
                              <Input 
                                className="w-full bg-gray-100" 
                                type="text" 
                                value={currentReport.appendectomy.patientInfo.bmi}
                                placeholder="Calculated from height and weight"
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
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${activeSection === "section2" ? "bg-blue-50" : ""}`}
                        onClick={() => toggleExpand("section2")}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Preoperative Information</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section2 ? "transform rotate-180" : ""}`} />
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
                                <Input 
                                  className="w-full" 
                                  type="text" 
                                  placeholder="Enter Anaesthetist name" 
                                  value={currentReport.appendectomy.preoperative.anaesthetist}
                                  onChange={(e) => updateAppendectomy('preoperative', 'anaesthetist', e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Indication for Surgery:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Acute Appendicitis', 'Perforated Appendix', 'Abscess', 'Interval Appendectomy', 'Other'].map(indication => (
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
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section III: Intraoperative Findings */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${activeSection === "section3" ? "bg-blue-50" : ""}`}
                        onClick={() => toggleExpand("section3")}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Intraoperative Findings</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section3 ? "transform rotate-180" : ""}`} />
                      </div>

                      {expanded.section3 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-4">
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
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section IV: Procedure Details */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${activeSection === "section4" ? "bg-blue-50" : ""}`}
                        onClick={() => toggleExpand("section4")}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Procedure Details</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section4 ? "transform rotate-180" : ""}`} />
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
                                  <Input 
                                    type="text" 
                                    className="w-full"
                                    placeholder="Please specify reason for conversion"
                                    value={currentReport.appendectomy?.procedure?.reasonForConversion || ''}
                                    onChange={(e) => updateAppendectomy('procedure', 'reasonForConversion', e.target.value)}
                                  />
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

                            {/* Trocar Placement - only show if "Laparoscopic" approach is selected */}
                            {currentReport.appendectomy?.procedure?.approach?.includes('Laparoscopic') && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Trocar Placement:</p>
                                <Input 
                                  type="text" 
                                  className="ml-4 w-full"
                                  value={currentReport.appendectomy?.procedure?.trocarPlacement || ''}
                                  onChange={(e) => updateAppendectomy('procedure', 'trocarPlacement', e.target.value)}
                                />
                              </div>
                            )}

                            {/* Operation Description Section */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                              <Textarea 
                                className="w-full min-h-[100px]"
                                placeholder="Please describe the surgical approach and key procedural steps"
                                value={currentReport.appendectomy?.procedure?.operationDescription || ''}
                                onChange={(e) => updateAppendectomy('procedure', 'operationDescription', e.target.value)}
                              />
                            </div>

                            {/* Duration of Operation */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Duration of operation (min):</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter time in minutes" 
                                value={currentReport.appendectomy.preoperative.duration}
                                onChange={(e) => updateAppendectomy('preoperative', 'duration', e.target.value)}
                              />
                            </div>

                            {/* Interactive Body Diagram */}
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
                                      selectedProcedures={['Appendectomy']}
                                      onGastroscopyUpdate={() => {}}
                                      onColonoscopyUpdate={(data) => {
                                        // Handle appendectomy diagram updates here
                                        console.log('Appendectomy diagram update:', data);
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

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Method of Appendiceal Ligation:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Stapler', 'Hemoloc', 'Endoloop', 'Tie', 'Energy device', 'Other'].map(method => (
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
                              <p className="text-sm font-medium text-gray-700 mb-2">Peritoneal lavage:</p>
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
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Section V: Closure and Complications */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${activeSection === "section5" ? "bg-blue-50" : ""}`}
                        onClick={() => toggleExpand("section5")}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Closure</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section5 ? "transform rotate-180" : ""}`} />
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
                              <p className="text-sm font-medium text-gray-700 mb-2">Skin closure:</p>
                              <div className="flex flex-wrap gap-4 ml-4">
                                {['Simple suture', 'Staples', 'Subcuticular suture', 'Adhesive strip', 'Tissue glue', 'Other'].map(closure => (
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
                      )}
                    </Card>

                    {/* Preview & Export Button */}
                    <div className="flex justify-center mt-8 mb-12">
                      <Button 
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 shadow-md text-md font-medium text-white"
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
                            <div className="flex gap-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="glass-button text-xs"
                                onClick={handleExportPDF}
                                disabled={isGeneratingPDF}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                              </Button>
                            </div>
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
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Section I: Patient Information */}
                    <Card className="glass-card-light">
                      <div 
                        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer ${herniaActiveSection === "section1" ? "bg-green-50" : ""}`}
                        onClick={() => {
                          setHerniaExpanded(prev => ({ ...prev, section1: !prev.section1 }));
                          if (!herniaExpanded.section1) {
                            setHerniaActiveSection("section1");
                          }
                        }}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${herniaExpanded.section1 ? "transform rotate-180" : ""}`} />
                      </div>

                      {herniaExpanded.section1 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Patient Name:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter patient name"
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
                                placeholder="Enter patient ID"
                                value={currentReport.ventralHernia?.patientInfo?.patientId || ''}
                                onChange={(e) => updateVentralHernia('patientInfo', 'patientId', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Date Of Birth:</label>
                              <div className="w-full">
                                <Input 
                                  className="w-full" 
                                  type="date" 
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
                                placeholder="Calculated from date of birth"
                                value={currentReport.ventralHernia?.patientInfo?.age || ''}
                                readOnly
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Sex:</label>
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
                                <option value="">Select sex</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Weight:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter weight (kg)"
                                value={currentReport.ventralHernia?.patientInfo?.weight || ''}
                                onChange={(e) => updateVentralHernia('patientInfo', 'weight', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">Height:</label>
                              <Input 
                                className="w-full" 
                                type="text" 
                                placeholder="Enter height (cm)"
                                value={currentReport.ventralHernia?.patientInfo?.height || ''}
                                onChange={(e) => updateVentralHernia('patientInfo', 'height', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <label className="text-gray-800 font-medium">BMI:</label>
                              <Input 
                                className="w-full bg-gray-100" 
                                type="text" 
                                placeholder="Calculated from height and weight"
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
                        onClick={() => {
                          setHerniaExpanded(prev => ({ ...prev, section2: !prev.section2 }));
                          if (!herniaExpanded.section2) {
                            setHerniaActiveSection("section2");
                          }
                        }}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Preoperative Information</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${herniaExpanded.section2 ? "transform rotate-180" : ""}`} />
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
                                <Input 
                                  className="w-full" 
                                  type="text" 
                                  placeholder="Enter Anaesthetist name"
                                  value={currentReport.ventralHernia?.preoperative?.anaesthetist || ''}
                                  onChange={(e) => updateReport('ventralHernia', {
                                    ...currentReport.ventralHernia,
                                    preoperative: {
                                      ...currentReport.ventralHernia?.preoperative,
                                      anaesthetist: e.target.value
                                    }
                                  })}
                                />
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
                              <h3 className="text-md font-medium text-gray-800 mb-3">Operative Findings</h3>
                              <div className="ml-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Hernia type:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Umbilical', 'Epigastric', 'Incisional', 'Spigelian'].map(type => (
                                      <div className="flex items-center" key={`hernia-type-${type}`}>
                                        <Checkbox id={`hernia-type-${type}`} />
                                        <label htmlFor={`hernia-type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-type-other" />
                                      <label htmlFor="hernia-type-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input type="text" className="ml-2 w-32" placeholder="Specify" />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Site of hernia:</p>
                                  <div className="grid grid-cols-2 gap-2 ml-4">
                                    {['Upper midline', 'Lower midline', 'Umbilical/paraumbilical', 'Subcostal', 'Pfannesteil', 'Grid iron / Lanz', 'Parastomal', 'Previous stoma', 'Spigelion', 'Lumbar hernia', 'Laparostomy'].map(site => (
                                      <div className="flex items-center" key={`hernia-site-${site}`}>
                                        <Checkbox id={`hernia-site-${site}`} />
                                        <label htmlFor={`hernia-site-${site}`} className="ml-2 text-sm text-gray-700">{site}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-site-other" />
                                      <label htmlFor="hernia-site-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input type="text" className="ml-2 w-24" placeholder="Specify" />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Total hernia defect size:</p>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Input type="text" className="w-20" placeholder="___" />
                                    <span className="text-sm text-gray-700">cm (length) x</span>
                                    <Input type="text" className="w-20" placeholder="___" />
                                    <span className="text-sm text-gray-700">cm (width)</span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Number of defects:</p>
                                  <Input type="text" className="ml-4 w-20" placeholder="___" />
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Contents:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Omentum', 'Small Bowel', 'Colon', 'Stomach', 'Pre-peritoneal fat'].map(content => (
                                      <div className="flex items-center" key={`hernia-contents-${content}`}>
                                        <Checkbox id={`hernia-contents-${content}`} />
                                        <label htmlFor={`hernia-contents-${content}`} className="ml-2 text-sm text-gray-700">{content}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-contents-other" />
                                      <label htmlFor="hernia-contents-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input type="text" className="ml-2 w-24" placeholder="Specify" />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Strangulation/Ischaemia:</p>
                                  <div className="flex gap-4 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-strangulation-yes" />
                                      <label htmlFor="hernia-strangulation-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-strangulation-no" />
                                      <label htmlFor="hernia-strangulation-no" className="ml-2 text-sm text-gray-700">No</label>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">If recurrent hernia. Does patient have a mesh in situ?</p>
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
                                    <Input 
                                      type="text" 
                                      className="ml-4 w-full"
                                      placeholder="Enter reason for conversion"
                                      value={currentReport.ventralHernia?.operative?.conversionReason || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        operative: {
                                          ...currentReport.ventralHernia?.operative,
                                          conversionReason: e.target.value
                                        }
                                      })}
                                    />
                                  </div>
                                )}

                                {/* Operation Description Section */}
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                                  <Textarea 
                                    className="ml-4 w-full"
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

                                {/* Duration of operation - moved here */}
                                <div className="mt-4">
                                  <div className="grid grid-cols-2 gap-4 items-center">
                                    <label className="text-sm font-medium text-gray-700">Duration of operation (min):</label>
                                    <Input 
                                      className="w-full" 
                                      type="text" 
                                      placeholder="Enter time in minutes"
                                      value={currentReport.ventralHernia?.preoperative?.duration || ''}
                                      onChange={(e) => updateReport('ventralHernia', {
                                        ...currentReport.ventralHernia,
                                        preoperative: {
                                          ...currentReport.ventralHernia?.preoperative,
                                          duration: e.target.value
                                        }
                                      })}
                                    />
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
                        onClick={() => {
                          setHerniaExpanded(prev => ({ ...prev, section3: !prev.section3 }));
                          if (!herniaExpanded.section3) {
                            setHerniaActiveSection("section3");
                          }
                        }}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Hernia Details & Findings</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${herniaExpanded.section3 ? "transform rotate-180" : ""}`} />
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
                        onClick={() => {
                          setHerniaExpanded(prev => ({ ...prev, section4: !prev.section4 }));
                          if (!herniaExpanded.section4) {
                            setHerniaActiveSection("section4");
                          }
                        }}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">Procedure Details</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${herniaExpanded.section4 ? "transform rotate-180" : ""}`} />
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
                                      <span className="text-sm text-gray-700">Pre-Peritoneal Fat Dissected Off Sheath</span>
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
                                        checked={herniaPrimaryClosure}
                                        onCheckedChange={(checked) => setHerniaPrimaryClosure(checked as boolean)}
                                      />
                                      <label htmlFor="hernia-primary-closure" className="ml-2 text-sm text-gray-700">Primary Suture Closure (Non-Mesh)</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="hernia-mesh-repair" 
                                        checked={herniaMeshRepair}
                                        onCheckedChange={(checked) => setHerniaMeshRepair(checked as boolean)}
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
                                    <p className="text-sm font-medium text-gray-700 mb-2">Primary Tissue repair:</p>
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
                                        checked={currentReport.ventralHernia?.procedure?.haemostasis === 'Not applicable'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateVentralHernia('procedure', 'haemostasis', 'Not applicable');
                                          }
                                        }}
                                      />
                                      <label htmlFor="hernia-haemostasis-na" className="ml-2 text-sm text-gray-700">Not applicable</label>
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
                                  <p className="text-sm font-medium text-gray-700 mb-2">Fascial closure:</p>
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
                                  <p className="text-sm font-medium text-gray-700 mb-2">Skin closure:</p>
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
                                  
                                  {/* Material Used for Skin Closure */}
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
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Specimen Sent:</h3>
                              <div className="ml-4 space-y-2">
                                <div className="flex items-center">
                                  <Checkbox id="hernia-specimen-none" />
                                  <label htmlFor="hernia-specimen-none" className="ml-2 text-sm text-gray-700">None</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="hernia-specimen-sac" />
                                  <label htmlFor="hernia-specimen-sac" className="ml-2 text-sm text-gray-700">Hernia sac</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="hernia-specimen-other" />
                                  <label htmlFor="hernia-specimen-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                  <Input type="text" className="ml-2 w-32" placeholder="Specify" />
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
                                />
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Post operative Management</h3>
                              <div className="ml-4">
                                <Textarea 
                                  rows={3}
                                  placeholder="Post operative management plan..."
                                  className="w-full"
                                />
                              </div>
                            </div>

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
                      )}
                    </Card>

                    {/* Preview & Export Button */}
                    <div className="flex justify-center mt-8 mb-12">
                      <Button 
                        className="px-8 py-4 bg-green-600 hover:bg-green-700 shadow-md text-md font-medium text-white"
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
                            <div className="flex gap-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="glass-button text-xs"
                                onClick={() => {
                                  handleExportPDF('ventralHernia');
                                }}
                                disabled={isGeneratingPDF}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                              </Button>
                            </div>
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
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        {/* Rectal Cancer Form Component */}
                        <RectalCancerForm 
                          currentReport={currentReport}
                          updateRectalCancer={updateRectalCancer}
                        />
                        
                        {/* Operative findings - Anatomical Diagram */}
                        <Card className="glass-card-light">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileSearch className="h-5 w-5 text-red-600" />
                              Operative Findings & Anatomical Reference
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
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
                          </CardContent>
                        </Card>
                      </div>

                    {/* Right Column - Live Report Preview */}
                    <div className="2xl:col-span-1">
                      <Card className="shadow-glass-heavy sticky top-6">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-gray-600" />
                              Live Report
                              <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of rectal cancer surgery findings</span>
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="glass-button text-xs"
                                onClick={handleExportPDF}
                                disabled={isGeneratingPDF}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                              </Button>
                            </div>
                          </div>
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