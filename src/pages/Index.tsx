import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Microscope, Stethoscope, User, Download, Save, Edit, Trash2, ChevronDown, ChevronUp, Scissors, Shield, Activity } from "lucide-react";
import { PatientInfoForm } from "@/components/PatientInfoForm";
import { ProcedureInfoForm } from "@/components/ProcedureInfoForm";
import { ProcedureTypeSelection } from "@/components/ProcedureTypeSelection";
import { ConditionalDiagramDisplay } from "@/components/ConditionalDiagramDisplay";
import { ReportPreview } from "@/components/ReportPreview";
import { VentralHerniaReportPreview } from "@/components/VentralHerniaReportPreview";
import { AppendectomyReportPreview } from "@/components/AppendectomyReportPreview";
import { RectalCancerReportPreview } from "@/components/RectalCancerReportPreview";
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
        assistant1: '',
        assistant2: '',
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
        assistant1: '',
        assistant2: '',
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
        repairType: '',
        meshType: [],
        meshMaterial: [],
        meshLength: '',
        meshWidth: '',
        fixation: [],
        fixationOther: '',
        primaryRepair: [],
        primaryRepairOther: '',
        complications: [],
        complicationOther: '',
        haemostasis: '',
        drain: '',
        drainDetails: '',
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

  const handleExportPDF = async () => {
    console.log("=== EXPORT PDF CLICKED - NETLIFY PRODUCTION VERSION ===");
    console.log("Environment:", window.location.origin);
    console.log("User agent:", navigator.userAgent);
    console.log("PDF generation starting...");
    console.log("Current tab:", currentTab);
    
    // Check browser capabilities
    console.log("Browser supports download:", 'download' in document.createElement('a'));
    console.log("Browser supports blob:", typeof Blob !== 'undefined');
    console.log("Browser supports URL.createObjectURL:", typeof URL.createObjectURL === 'function');
    
    setIsGeneratingPDF(true);
    
    try {
      // Show user that PDF generation is starting
      toast.info("Starting PDF generation... Please allow downloads if prompted.");
      
      // Check if we're in appendectomy tab - if so, export the live report content
      if (currentTab === "appendectomy") {
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
      if (currentTab === "rectal") {
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
      if (currentTab === "hernia") {
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
                              variant="outline" 
                              size="sm" 
                              className="glass-button text-xs" 
                              onClick={handleSaveDraft}
                              disabled={isSavingDraft}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              {isSavingDraft ? 'Saving...' : 'Save Draft'}
                            </Button>
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
                              Synoptic Operative Report – Appendectomy
                            </h1>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="glass-button text-xs">
                              <Save className="w-4 h-4 mr-2" />
                              Save Draft
                            </Button>
                            <Button variant="secondary" size="sm" className="glass-button text-xs">
                              <Scissors className="w-4 h-4 mr-2" />
                              Finalize
                            </Button>
                            <Button variant="outline" size="sm" className="glass-button text-xs">
                              <Download className="w-4 h-4 mr-2" />
                              Print
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
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="1. Enter Assistant Name" 
                                    value={currentReport.appendectomy.preoperative.assistant1}
                                    onChange={(e) => updateAppendectomy('preoperative', 'assistant1', e.target.value)}
                                  />
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="2. Enter Assistant Name" 
                                    value={currentReport.appendectomy.preoperative.assistant2}
                                    onChange={(e) => updateAppendectomy('preoperative', 'assistant2', e.target.value)}
                                  />
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
                              <p className="text-sm font-medium text-gray-700 mb-2">Method of Appendiceal Division:</p>
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
                              <p className="text-sm font-medium text-gray-700 mb-2">Mesentery Control:</p>
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
                        <h2 className="text-lg font-semibold text-gray-800">Closure and Complications</h2>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.section5 ? "transform rotate-180" : ""}`} />
                      </div>

                      {expanded.section5 && (
                        <CardContent className="px-6 py-4">
                          <div className="space-y-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Fascial closure:</p>
                              <div className="flex space-x-4 ml-4">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="fascial-yes" 
                                    checked={currentReport.appendectomy?.closure?.fascialClosure === 'Yes'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('closure', 'fascialClosure', 'Yes');
                                      }
                                    }}
                                  />
                                  <label htmlFor="fascial-yes" className="ml-2 block text-sm text-gray-700">Yes</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="fascial-no" 
                                    checked={currentReport.appendectomy?.closure?.fascialClosure === 'No'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('closure', 'fascialClosure', 'No');
                                      }
                                    }}
                                  />
                                  <label htmlFor="fascial-no" className="ml-2 block text-sm text-gray-700">No</label>
                                </div>
                              </div>
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
                              <p className="text-sm font-medium text-gray-700 mb-2">Intraoperative Complications:</p>
                              <div className="flex items-center ml-4">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="comp-none" 
                                    checked={currentReport.appendectomy?.closure?.complications === 'None'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('closure', 'complications', 'None');
                                      }
                                    }}
                                  />
                                  <label htmlFor="comp-none" className="ml-2 block text-sm text-gray-700">None</label>
                                </div>
                                <div className="flex items-center ml-4">
                                  <Checkbox 
                                    id="comp-yes" 
                                    checked={currentReport.appendectomy?.closure?.complications === 'Yes'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateAppendectomy('closure', 'complications', 'Yes');
                                      }
                                    }}
                                  />
                                  <label htmlFor="comp-yes" className="ml-2 block text-sm text-gray-700">Yes (Specify:</label>
                                  <Input 
                                    type="text" 
                                    className="ml-2 w-32"
                                    value={currentReport.appendectomy?.closure?.complicationDetails || ''}
                                    onChange={(e) => updateAppendectomy('closure', 'complicationDetails', e.target.value)}
                                  />
                                  <label htmlFor="comp-yes" className="ml-2 block text-sm text-gray-700">)</label>
                                </div>
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
                                variant="outline" 
                                size="sm" 
                                className="glass-button text-xs" 
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {isSavingDraft ? 'Saving...' : 'Save Draft'}
                              </Button>
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
                            <Button variant="outline" size="sm" className="glass-button text-xs">
                              <Save className="w-4 h-4 mr-2" />
                              Save Draft
                            </Button>
                            <Button variant="secondary" size="sm" className="glass-button text-xs">
                              <Shield className="w-4 h-4 mr-2" />
                              Finalize
                            </Button>
                            <Button variant="outline" size="sm" className="glass-button text-xs">
                              <Download className="w-4 h-4 mr-2" />
                              Print
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
                              <div className="grid grid-cols-2 gap-4 items-start">
                                <label className="text-gray-800 font-medium">Assistant:</label>
                                <div className="space-y-2">
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="1. Enter Assistant Name"
                                    value={currentReport.ventralHernia?.preoperative?.assistant1 || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      preoperative: {
                                        ...currentReport.ventralHernia?.preoperative,
                                        assistant1: e.target.value
                                      }
                                    })}
                                  />
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="2. Enter Assistant Name"
                                    value={currentReport.ventralHernia?.preoperative?.assistant2 || ''}
                                    onChange={(e) => updateReport('ventralHernia', {
                                      ...currentReport.ventralHernia,
                                      preoperative: {
                                        ...currentReport.ventralHernia?.preoperative,
                                        assistant2: e.target.value
                                      }
                                    })}
                                  />
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
                              <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="text-gray-800 font-medium">Duration of operation (min):</label>
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
                                      <Checkbox id={`hernia-op-approach-${approach}`} />
                                      <label htmlFor={`hernia-op-approach-${approach}`} className="ml-2 text-sm text-gray-700">{approach}</label>
                                    </div>
                                  ))}
                                  <div className="flex items-center">
                                    <Checkbox id="hernia-op-approach-other" />
                                    <label htmlFor="hernia-op-approach-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                    <Input type="text" className="ml-2 w-32" placeholder="Specify" />
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Diagram (Access ports and incisions)</p>
                                  <p className="text-xs text-gray-600 mb-2 ml-4">Must be able to mark the following on the diagram:</p>
                                  <ul className="text-xs text-gray-600 ml-8 space-y-1">
                                    <li>• Ports and size - 5mm, 10/11mm, 12mm, 15mm</li>
                                    <li>• Stoma site ileostomy, Colostomy</li>
                                    <li>• Access incision</li>
                                  </ul>
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
                                          <Checkbox id="hernia-sac-yes" />
                                          <label htmlFor="hernia-sac-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox id="hernia-sac-no" />
                                          <label htmlFor="hernia-sac-no" className="ml-2 text-sm text-gray-700">No</label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-700">Pre-Peritoneal Fat Dissected Off Sheath</span>
                                      <div className="flex gap-4">
                                        <div className="flex items-center">
                                          <Checkbox id="hernia-fat-yes" />
                                          <label htmlFor="hernia-fat-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox id="hernia-fat-no" />
                                          <label htmlFor="hernia-fat-no" className="ml-2 text-sm text-gray-700">No</label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-700">Hernia Defect Closed</span>
                                      <div className="flex gap-4">
                                        <div className="flex items-center">
                                          <Checkbox id="hernia-defect-yes" />
                                          <label htmlFor="hernia-defect-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox id="hernia-defect-no" />
                                          <label htmlFor="hernia-defect-no" className="ml-2 text-sm text-gray-700">No</label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Repair Type:</p>
                                  <div className="space-y-2 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-primary-closure" />
                                      <label htmlFor="hernia-primary-closure" className="ml-2 text-sm text-gray-700">Primary Suture Closure (Non-Mesh)</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-mesh-repair" />
                                      <label htmlFor="hernia-mesh-repair" className="ml-2 text-sm text-gray-700">Mesh Repair</label>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Mesh Details (if applicable):</p>
                                  <div className="ml-4 space-y-4">
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Type:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Onlay', 'Inlay', 'Sublay (retromuscular)', 'Underlay (IPOM)'].map(type => (
                                          <div className="flex items-center" key={`hernia-mesh-type-${type}`}>
                                            <Checkbox id={`hernia-mesh-type-${type}`} />
                                            <label htmlFor={`hernia-mesh-type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Mesh material:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Synthetic', 'Composite', 'Biologic'].map(material => (
                                          <div className="flex items-center" key={`hernia-mesh-material-${material}`}>
                                            <Checkbox id={`hernia-mesh-material-${material}`} />
                                            <label htmlFor={`hernia-mesh-material-${material}`} className="ml-2 text-sm text-gray-700">{material}</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Size:</p>
                                      <div className="flex items-center gap-2 ml-4">
                                        <Input type="text" className="w-20" placeholder="___" />
                                        <span className="text-sm text-gray-700">x</span>
                                        <Input type="text" className="w-20" placeholder="___" />
                                        <span className="text-sm text-gray-700">cm</span>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Fixation:</p>
                                      <div className="flex flex-wrap gap-4 ml-4">
                                        {['Sutures', 'Tackers', 'Trans-Fascial Sutures', 'Glue'].map(fixation => (
                                          <div className="flex items-center" key={`hernia-fixation-${fixation}`}>
                                            <Checkbox id={`hernia-fixation-${fixation}`} />
                                            <label htmlFor={`hernia-fixation-${fixation}`} className="ml-2 text-sm text-gray-700">{fixation}</label>
                                          </div>
                                        ))}
                                        <div className="flex items-center">
                                          <Checkbox id="hernia-fixation-other" />
                                          <label htmlFor="hernia-fixation-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                          <Input type="text" className="ml-2 w-24" placeholder="Specify" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Primary Tissue repair (if applicable):</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Simple Fascial Suture', 'Sheath Overlap', 'Component Separation'].map(repair => (
                                      <div className="flex items-center" key={`hernia-primary-${repair}`}>
                                        <Checkbox id={`hernia-primary-${repair}`} />
                                        <label htmlFor={`hernia-primary-${repair}`} className="ml-2 text-sm text-gray-700">{repair}</label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-primary-other" />
                                      <label htmlFor="hernia-primary-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                      <Input type="text" className="ml-2 w-24" placeholder="Specify" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-md font-medium text-gray-800 mb-3">Intraoperative Complications</h3>
                              <div className="ml-4 space-y-2">
                                {['None', 'Bowel Injury', 'Serosal Tear', 'Bleeding'].map(complication => (
                                  <div className="flex items-center" key={`hernia-complication-${complication}`}>
                                    <Checkbox id={`hernia-complication-${complication}`} />
                                    <label htmlFor={`hernia-complication-${complication}`} className="ml-2 text-sm text-gray-700">{complication}</label>
                                  </div>
                                ))}
                                <div className="flex items-center">
                                  <Checkbox id="hernia-complication-other" />
                                  <label htmlFor="hernia-complication-other" className="ml-2 text-sm text-gray-700">Other:</label>
                                  <Input type="text" className="ml-2 w-48" placeholder="Specify complication" />
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
                                      <Checkbox id="hernia-haemostasis-achieved" />
                                      <label htmlFor="hernia-haemostasis-achieved" className="ml-2 text-sm text-gray-700">Achieved</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-haemostasis-na" />
                                      <label htmlFor="hernia-haemostasis-na" className="ml-2 text-sm text-gray-700">Not applicable</label>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Drain:</p>
                                  <div className="space-y-2 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-drain-none" />
                                      <label htmlFor="hernia-drain-none" className="ml-2 text-sm text-gray-700">None</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox id="hernia-drain-yes" />
                                      <label htmlFor="hernia-drain-yes" className="ml-2 text-sm text-gray-700">Yes →</label>
                                      <span className="text-sm text-gray-700">Site:</span>
                                      <Input type="text" className="w-24" placeholder="Site" />
                                      <span className="text-sm text-gray-700">Type:</span>
                                      <Input type="text" className="w-24" placeholder="Type" />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Fascial closure:</p>
                                  <div className="flex gap-4 ml-4">
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-fascial-yes" />
                                      <label htmlFor="hernia-fascial-yes" className="ml-2 text-sm text-gray-700">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="hernia-fascial-no" />
                                      <label htmlFor="hernia-fascial-no" className="ml-2 text-sm text-gray-700">No</label>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Skin closure:</p>
                                  <div className="flex flex-wrap gap-4 ml-4">
                                    {['Sutures', 'Staples', 'Glue', 'Other'].map(closure => (
                                      <div className="flex items-center" key={`hernia-skin-${closure}`}>
                                        <Checkbox id={`hernia-skin-${closure}`} />
                                        <label htmlFor={`hernia-skin-${closure}`} className="ml-2 text-sm text-gray-700">{closure}</label>
                                      </div>
                                    ))}
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

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Closure:</p>
                              <div className="ml-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure:</p>
                                  <div className="flex flex-wrap gap-4">
                                    {['Running Suture', 'Interrupted Suture', 'PDS', 'Vicryl', 'Prolene', 'Other'].map(closure => (
                                      <div className="flex items-center" key={`hernia-fascial-${closure}`}>
                                        <Checkbox id={`hernia-fascial-${closure}`} />
                                        <label htmlFor={`hernia-fascial-${closure}`} className="ml-2 block text-sm text-gray-700">{closure}</label>
                                        {closure === 'Other' && (
                                          <Input type="text" className="ml-2 w-32" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Skin Closure:</p>
                                  <div className="flex flex-wrap gap-4">
                                    {['Staples', 'Sutures', 'Adhesive Strips', 'Skin Glue', 'Other'].map(skin => (
                                      <div className="flex items-center" key={`hernia-skin-${skin}`}>
                                        <Checkbox id={`hernia-skin-${skin}`} />
                                        <label htmlFor={`hernia-skin-${skin}`} className="ml-2 block text-sm text-gray-700">{skin}</label>
                                        {skin === 'Other' && (
                                          <Input type="text" className="ml-2 w-32" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Drains:</p>
                              <div className="ml-4">
                                <div className="flex items-center space-x-6">
                                  <div className="flex items-center">
                                    <Checkbox id="hernia-drain-no" />
                                    <label htmlFor="hernia-drain-no" className="ml-2 text-sm text-gray-700">No</label>
                                  </div>
                                  <div className="flex items-center">
                                    <Checkbox id="hernia-drain-yes" />
                                    <label htmlFor="hernia-drain-yes" className="ml-2 text-sm text-gray-700">Yes (Number and Location:</label>
                                    <Input type="text" className="ml-2 w-48" placeholder="e.g., 2 Jackson-Pratt drains, bilateral" />
                                    <span className="ml-1 text-sm text-gray-700">)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Intraoperative Complications:</p>
                              <div className="ml-4">
                                <div className="flex items-center space-x-6">
                                  <div className="flex items-center">
                                    <Checkbox id="hernia-comp-none" />
                                    <label htmlFor="hernia-comp-none" className="ml-2 text-sm text-gray-700">None</label>
                                  </div>
                                  <div className="flex items-center">
                                    <Checkbox id="hernia-comp-yes" />
                                    <label htmlFor="hernia-comp-yes" className="ml-2 text-sm text-gray-700">Yes (Specify:</label>
                                    <Input type="text" className="ml-2 w-48" placeholder="Describe complications" />
                                    <span className="ml-1 text-sm text-gray-700">)</span>
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
                          setCurrentTab('ventralHernia');
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
                              <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of your ventral hernia repair report</span>
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="glass-button text-xs" 
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {isSavingDraft ? 'Saving...' : 'Save Draft'}
                              </Button>
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
                    {/* Header with title and actions */}
                    <Card className="glass-card-light">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 p-2 bg-red-100 rounded-md">
                              <Activity className="w-6 h-6 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">
                              Colorectal Cancer Surgery - Operative Report
                            </h1>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="glass-button text-xs">
                              <Save className="w-4 h-4 mr-2" />
                              Save Draft
                            </Button>
                            <Button variant="secondary" size="sm" className="glass-button text-xs">
                              <Activity className="w-4 h-4 mr-2" />
                              Finalize
                            </Button>
                            <Button variant="outline" size="sm" className="glass-button text-xs">
                              <Download className="w-4 h-4 mr-2" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Section I: Basic Data & Preoperative Assessment */}
                    <Collapsible
                      open={rectalExpanded.section1}
                      onOpenChange={(open) => setRectalExpanded(prev => ({ ...prev, section1: open }))}
                    >
                      <Card className={`glass-card-light transition-all duration-300 ${rectalActiveSection === "section1" ? "ring-2 ring-blue-200 bg-blue-50/30" : ""}`}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-red-600" />
                                Section I: Basic Data & Preoperative Assessment
                              </div>
                              {rectalExpanded.section1 ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-6">
                            {/* Patient Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Patient Information</h3>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Patient Name:</label>
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="Enter patient name"
                                    value={currentReport.rectalCancer?.patientInfo?.name || ''}
                                    onChange={(e) => updateRectalCancer('patientInfo', 'name', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Patient ID:</label>
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="Enter patient ID"
                                    value={currentReport.rectalCancer?.patientInfo?.patientId || ''}
                                    onChange={(e) => updateRectalCancer('patientInfo', 'patientId', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Date Of Birth:</label>
                                  <div className="w-full">
                                    <Input 
                                      className="w-full" 
                                      type="date" 
                                      value={currentReport.rectalCancer?.patientInfo?.dateOfBirth || ''}
                                      onChange={(e) => updateRectalCancer('patientInfo', 'dateOfBirth', e.target.value)}
                                    />
                                    {currentReport.rectalCancer?.patientInfo?.dateOfBirth && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        {formatDateOnly(currentReport.rectalCancer.patientInfo.dateOfBirth)}
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
                                    value={currentReport.rectalCancer?.patientInfo?.age || ''}
                                    readOnly
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Sex:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.patientInfo?.sex || ''}
                                    onChange={(e) => updateRectalCancer('patientInfo', 'sex', e.target.value)}
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
                                    value={currentReport.rectalCancer?.patientInfo?.weight || ''}
                                    onChange={(e) => updateRectalCancer('patientInfo', 'weight', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Height:</label>
                                  <Input 
                                    className="w-full" 
                                    type="text" 
                                    placeholder="Enter height (cm)"
                                    value={currentReport.rectalCancer?.patientInfo?.height || ''}
                                    onChange={(e) => updateRectalCancer('patientInfo', 'height', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">BMI:</label>
                                  <Input 
                                    className="w-full bg-gray-100" 
                                    type="text" 
                                    placeholder="Calculated from height and weight"
                                    value={currentReport.rectalCancer?.patientInfo?.bmi || ''}
                                    readOnly
                                  />
                                </div>
                                <ASAClassificationSection
                                  selectedASA={currentReport.rectalCancer?.patientInfo?.asaScore || ''}
                                  onASAChange={(value) => updateRectalCancer('patientInfo', 'asaScore', value)}
                                  notes={currentReport.rectalCancer?.patientInfo?.asaNotes || ''}
                                  onNotesChange={(value) => updateRectalCancer('patientInfo', 'asaNotes', value)}
                                  showNotes={true}
                                />
                              </div>
                            </div>

                            {/* Operation Type Selection - Primary Branching Point */}
                            <div className="bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-400">
                              <h3 className="font-semibold text-gray-800 mb-4">Operation Type</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Type of operation:</label>
                                  <div className="flex flex-wrap gap-6">
                                    {['Colon', 'Rectum'].map(operation => (
                                      <div className="flex items-center" key={`operation-${operation}`}>
                                        <Checkbox 
                                          id={`operation-${operation}`}
                                          checked={currentReport.rectalCancer?.section1?.operationType?.includes(operation) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.rectalCancer?.section1?.operationType || [];
                                            const updated = checked 
                                              ? [...current.filter(item => item !== operation), operation]
                                              : current.filter(item => item !== operation);
                                            updateRectalCancer('section1', 'operationType', updated);
                                          }}
                                        />
                                        <label htmlFor={`operation-${operation}`} className="ml-2 text-sm font-medium">{operation}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Conditional Rectum Operation Types - Shows only if Rectum is selected */}
                                {currentReport.rectalCancer?.section1?.operationType?.includes('Rectum') && (
                                  <div className="ml-6 p-4 bg-white/70 rounded-md border-l-2 border-blue-300">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Rectum operation type:</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {[
                                        'High anterior resection',
                                        'Low anterior resection', 
                                        'Intersphincteric resection',
                                        'Abdominoperineal resection',
                                        'Local excision',
                                        'Other'
                                      ].map(rectumOp => (
                                        <div className="flex items-center" key={`rectum-${rectumOp}`}>
                                          <Checkbox 
                                            id={`rectum-${rectumOp}`}
                                            checked={currentReport.rectalCancer?.section1?.rectumOperationType?.includes(rectumOp) || false}
                                            onCheckedChange={(checked) => {
                                              const current = currentReport.rectalCancer?.section1?.rectumOperationType || [];
                                              const updated = checked 
                                                ? [...current.filter(item => item !== rectumOp), rectumOp]
                                                : current.filter(item => item !== rectumOp);
                                              updateRectalCancer('section1', 'rectumOperationType', updated);
                                            }}
                                          />
                                          <label htmlFor={`rectum-${rectumOp}`} className="ml-2 text-sm">{rectumOp}</label>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Other specification - Shows only if Other is selected */}
                                    {currentReport.rectalCancer?.section1?.rectumOperationType?.includes('Other') && (
                                      <div className="mt-3">
                                        <Input 
                                          type="text" 
                                          placeholder="Specify other rectum operation type" 
                                          className="w-full"
                                          value={currentReport.rectalCancer?.section1?.rectumOperationOther || ''}
                                          onChange={(e) => updateRectalCancer('section1', 'rectumOperationOther', e.target.value)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Procedure Urgency */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure urgency:</label>
                                  <div className="flex flex-wrap gap-4">
                                    {['Emergency', 'Semi-Emergency', 'Semi-Elective', 'Elective'].map(urgency => (
                                      <div className="flex items-center" key={`urgency-${urgency}`}>
                                        <Checkbox 
                                          id={`urgency-${urgency}`}
                                          checked={currentReport.rectalCancer?.section1?.procedureUrgency === urgency}
                                          onCheckedChange={(checked) => {
                                            updateRectalCancer('section1', 'procedureUrgency', checked ? urgency : '');
                                          }}
                                        />
                                        <label htmlFor={`urgency-${urgency}`} className="ml-2 text-sm">{urgency}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Neoadjuvant Treatment */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Neoadjuvant treatment:</label>
                                  <div className="flex gap-6">
                                    {['Yes', 'No'].map(treatment => (
                                      <div className="flex items-center" key={`neoadjuvant-${treatment}`}>
                                        <Checkbox 
                                          id={`neoadjuvant-${treatment}`}
                                          checked={currentReport.rectalCancer?.section1?.neoadjuvantTreatment === treatment}
                                          onCheckedChange={(checked) => {
                                            updateRectalCancer('section1', 'neoadjuvantTreatment', checked ? treatment : '');
                                          }}
                                        />
                                        <label htmlFor={`neoadjuvant-${treatment}`} className="ml-2 text-sm">{treatment}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Preoperative Information - Reordered with Surgeon details first */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Preoperative Information</h3>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Surgeon:</label>
                                  <div className="space-y-2">
                                    {(currentReport.rectalCancer?.section1?.surgeons || ['']).map((surgeon, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <Input 
                                          type="text" 
                                          placeholder="Enter Surgeon Name" 
                                          className="flex-1" 
                                          value={surgeon}
                                          onChange={(e) => {
                                            const newSurgeons = [...(currentReport.rectalCancer?.section1?.surgeons || [''])];
                                            newSurgeons[index] = e.target.value;
                                            updateRectalCancer('section1', 'surgeons', newSurgeons);
                                          }}
                                        />
                                        {index === (currentReport.rectalCancer?.section1?.surgeons || ['']).length - 1 && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-xs px-2 py-1"
                                            onClick={() => {
                                              const currentSurgeons = currentReport.rectalCancer?.section1?.surgeons || [''];
                                              const newSurgeons = [...currentSurgeons, ''];
                                              updateRectalCancer('section1', 'surgeons', newSurgeons);
                                            }}
                                          >
                                            +
                                          </Button>
                                        )}
                                        {(currentReport.rectalCancer?.section1?.surgeons || ['']).length > 1 && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                            onClick={() => {
                                              const currentSurgeons = currentReport.rectalCancer?.section1?.surgeons || [''];
                                              const newSurgeons = currentSurgeons.filter((_, i) => i !== index);
                                              updateRectalCancer('section1', 'surgeons', newSurgeons);
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
                                    <Input 
                                      type="text" 
                                      placeholder="1. Enter Assistant Name" 
                                      className="w-full" 
                                      value={currentReport.rectalCancer?.section1?.assistant1 || ''}
                                      onChange={(e) => updateRectalCancer('section1', 'assistant1', e.target.value)}
                                    />
                                    <Input 
                                      type="text" 
                                      placeholder="2. Enter Assistant Name" 
                                      className="w-full" 
                                      value={currentReport.rectalCancer?.section1?.assistant2 || ''}
                                      onChange={(e) => updateRectalCancer('section1', 'assistant2', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Anaesthetist:</label>
                                  <Input 
                                    type="text" 
                                    placeholder="Enter Anaesthetist name" 
                                    className="w-full" 
                                    value={currentReport.rectalCancer?.section1?.anaesthetist || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'anaesthetist', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Duration of operation (min):</label>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter time in minutes" 
                                    className="w-full" 
                                    value={currentReport.rectalCancer?.section1?.duration || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'duration', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">ASA Score:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.section1?.asaScore || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'asaScore', e.target.value)}
                                  >
                                    <option value="">Select ASA</option>
                                    <option value="1">ASA 1 - Normal healthy patient</option>
                                    <option value="2">ASA 2 - Mild systemic disease</option>
                                    <option value="3">ASA 3 - Severe systemic disease</option>
                                    <option value="4">ASA 4 - Severe systemic disease that is constant threat to life</option>
                                    <option value="5">ASA 5 - Moribund patient not expected to survive</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Indication for Surgery:</label>
                                  <Input 
                                    type="text" 
                                    placeholder="Primary rectal cancer, recurrent tumor, etc." 
                                    className="w-full"
                                    value={currentReport.rectalCancer?.section1?.indication || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'indication', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Emergency Operation:</label>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="emergency-yes"
                                        checked={currentReport.rectalCancer?.section1?.emergencyOperation === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section1', 'emergencyOperation', checked ? 'Yes' : '');
                                        }}
                                      />
                                      <label htmlFor="emergency-yes" className="ml-2 text-sm">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="emergency-no"
                                        checked={currentReport.rectalCancer?.section1?.emergencyOperation === 'No'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section1', 'emergencyOperation', checked ? 'No' : '');
                                        }}
                                      />
                                      <label htmlFor="emergency-no" className="ml-2 text-sm">No</label>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Pre-operative chemo/radiotherapy:</label>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="neoadjuvant-yes"
                                        checked={currentReport.rectalCancer?.section1?.preoperativeChemoRadio === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section1', 'preoperativeChemoRadio', checked ? 'Yes' : '');
                                        }}
                                      />
                                      <label htmlFor="neoadjuvant-yes" className="ml-2 text-sm">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="neoadjuvant-no"
                                        checked={currentReport.rectalCancer?.section1?.preoperativeChemoRadio === 'No'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section1', 'preoperativeChemoRadio', checked ? 'No' : '');
                                        }}
                                      />
                                      <label htmlFor="neoadjuvant-no" className="ml-2 text-sm">No</label>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <label className="text-gray-800 font-medium">Previous abdominal surgery:</label>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="previous-surgery-yes"
                                        checked={currentReport.rectalCancer?.section1?.previousAbdominalSurgery === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section1', 'previousAbdominalSurgery', checked ? 'Yes' : '');
                                        }}
                                      />
                                      <label htmlFor="previous-surgery-yes" className="ml-2 text-sm">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="previous-surgery-no"
                                        checked={currentReport.rectalCancer?.section1?.previousAbdominalSurgery === 'No'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section1', 'previousAbdominalSurgery', checked ? 'No' : '');
                                        }}
                                      />
                                      <label htmlFor="previous-surgery-no" className="ml-2 text-sm">No</label>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-start">
                                  <label className="text-gray-800 font-medium">Indication for Surgery:</label>
                                  <div className="space-y-2">
                                    {['Primary rectal cancer', 'Recurrent rectal cancer', 'Metastatic disease', 'Local excision failure', 'Benign condition', 'Emergency presentation', 'Other'].map(indication => (
                                      <div className="flex items-center" key={`rectal-indication-${indication}`}>
                                        <Checkbox 
                                          id={`rectal-indication-${indication}`}
                                          checked={currentReport.rectalCancer?.section1?.indication?.includes(indication) || false}
                                          onCheckedChange={(checked) => {
                                            const currentIndications = currentReport.rectalCancer?.section1?.indication || [];
                                            const newIndications = checked 
                                              ? [...currentIndications, indication]
                                              : currentIndications.filter(i => i !== indication);
                                            updateRectalCancer('section1', 'indication', newIndications);
                                          }}
                                        />
                                        <label htmlFor={`rectal-indication-${indication}`} className="ml-2 text-sm">{indication}</label>
                                        {indication === 'Other' && (
                                          <Input 
                                            type="text" 
                                            className="ml-2 w-48" 
                                            placeholder="Specify other indication"
                                            value={currentReport.rectalCancer?.section1?.indicationOther || ''}
                                            onChange={(e) => updateRectalCancer('section1', 'indicationOther', e.target.value)}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Pre-operative tumor classification */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Pre-operative tumor classification</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">T classification:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.section1?.tClassification || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'tClassification', e.target.value)}
                                  >
                                    <option value="">Select T stage</option>
                                    <option value="T1">T1</option>
                                    <option value="T2">T2</option>
                                    <option value="T3">T3</option>
                                    <option value="T4a">T4a</option>
                                    <option value="T4b">T4b</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">N classification:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.section1?.nClassification || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'nClassification', e.target.value)}
                                  >
                                    <option value="">Select N stage</option>
                                    <option value="N0">N0</option>
                                    <option value="N1a">N1a</option>
                                    <option value="N1b">N1b</option>
                                    <option value="N1c">N1c</option>
                                    <option value="N2a">N2a</option>
                                    <option value="N2b">N2b</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">M classification:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.section1?.mClassification || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'mClassification', e.target.value)}
                                  >
                                    <option value="">Select M stage</option>
                                    <option value="M0">M0</option>
                                    <option value="M1a">M1a</option>
                                    <option value="M1b">M1b</option>
                                    <option value="M1c">M1c</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Pre-operative staging and assessment */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Pre-operative staging and assessment</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Location of tumor - distance from anal verge (cm):</label>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter distance in cm" 
                                    className="w-48" 
                                    value={currentReport.rectalCancer?.section1?.tumorDistance || ''}
                                    onChange={(e) => updateRectalCancer('section1', 'tumorDistance', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Tumor height:</label>
                                  <div className="flex flex-wrap gap-4">
                                    {['Low (≤5cm)', 'Mid (5-10cm)', 'High (>10cm)'].map(height => (
                                      <div className="flex items-center" key={`height-${height}`}>
                                        <Checkbox id={`height-${height}`} />
                                        <label htmlFor={`height-${height}`} className="ml-2 text-sm">{height}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

                    {/* Section II: Surgical Approach */}
                    <Collapsible
                      open={rectalExpanded.section2}
                      onOpenChange={(open) => setRectalExpanded(prev => ({ ...prev, section2: open }))}
                    >
                      <Card className={`glass-card-light transition-all duration-300 ${rectalActiveSection === "section2" ? "ring-2 ring-blue-200 bg-blue-50/30" : ""}`}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Scissors className="h-5 w-5 text-red-600" />
                                Section II: Surgical Approach
                              </div>
                              {rectalExpanded.section2 ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-6">
                            {/* Surgical Approach - Main Selection */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Surgical Approach</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                  'Open',
                                  'Laparoscopic',
                                  'Laparoscopic hand-assisted',
                                  'Robotic',
                                  'TAMIS (Transanal Minimally Invasive Surgery)',
                                  'TEO (Transanal Endoscopic Operation)',
                                  'TEM (Transanal Endoscopic Microsurgery)',
                                  'Converted to open from laparoscopic',
                                  'Converted to open from robotic',
                                  'Other'
                                ].map(approach => (
                                  <div className="flex items-center" key={`approach-${approach}`}>
                                    <Checkbox 
                                      id={`approach-${approach}`}
                                      checked={currentReport.rectalCancer?.section2?.approach?.includes(approach) || false}
                                      onCheckedChange={(checked) => {
                                        const current = currentReport.rectalCancer?.section2?.approach || [];
                                        const updated = checked 
                                          ? [...current.filter(item => item !== approach), approach]
                                          : current.filter(item => item !== approach);
                                        updateRectalCancer('section2', 'approach', updated);
                                      }}
                                    />
                                    <label htmlFor={`approach-${approach}`} className="ml-2 text-sm">{approach}</label>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Other approach specification - Shows only if Other is selected */}
                              {currentReport.rectalCancer?.section2?.approach?.includes('Other') && (
                                <div className="mt-4 p-3 bg-white/70 rounded-md border-l-2 border-gray-300">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Specify other approach:</label>
                                  <Input 
                                    type="text" 
                                    placeholder="Specify surgical approach" 
                                    className="w-full"
                                    value={currentReport.rectalCancer?.section2?.approachOther || ''}
                                    onChange={(e) => updateRectalCancer('section2', 'approachOther', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Reason for conversion - Shows only if conversion approaches are selected */}
                            {(currentReport.rectalCancer?.section2?.approach?.some(approach => 
                              approach.includes('Converted to open')) || false) && (
                              <div className="bg-yellow-50/50 p-4 rounded-lg border-l-4 border-yellow-400">
                                <h3 className="font-semibold text-gray-800 mb-4">Reason for Conversion to Open</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[
                                    'Adhesions',
                                    'Visceral injury',
                                    'Vascular injury',
                                    'Difficult exposure',
                                    'Difficult visualization',
                                    'Bleeding',
                                    'Failure to progress',
                                    'Equipment failure',
                                    'Oncologic concerns',
                                    'Other'
                                  ].map(reason => (
                                    <div className="flex items-center" key={`conversion-${reason}`}>
                                      <Checkbox 
                                        id={`conversion-${reason}`}
                                        checked={currentReport.rectalCancer?.section2?.conversionReason?.includes(reason) || false}
                                        onCheckedChange={(checked) => {
                                          const current = currentReport.rectalCancer?.section2?.conversionReason || [];
                                          const updated = checked 
                                            ? [...current.filter(item => item !== reason), reason]
                                            : current.filter(item => item !== reason);
                                          updateRectalCancer('section2', 'conversionReason', updated);
                                        }}
                                      />
                                      <label htmlFor={`conversion-${reason}`} className="ml-2 text-sm">{reason}</label>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Other conversion reason specification */}
                                {currentReport.rectalCancer?.section2?.conversionReason?.includes('Other') && (
                                  <div className="mt-4 p-3 bg-white/70 rounded-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify other reason for conversion:</label>
                                    <Input 
                                      type="text" 
                                      placeholder="Specify conversion reason" 
                                      className="w-full"
                                      value={currentReport.rectalCancer?.section2?.conversionOther || ''}
                                      onChange={(e) => updateRectalCancer('section2', 'conversionOther', e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Operative findings - Anatomical Diagram */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Operative Findings & Anatomical Reference</h3>
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
                            </div>

                            {/* Intraoperative complications */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Intraoperative complications</h3>
                              <div className="space-y-4">
                                <div className="flex items-center">
                                  <Checkbox id="complications-none" />
                                  <label htmlFor="complications-none" className="ml-2 text-sm">None</label>
                                </div>
                                <div className="space-y-3">
                                  {['Bowel Injury', 'Vascular Injury', 'Ureteric Injury', 'Bladder Injury', 'Other Visceral Injury', 'Bleeding Requiring Transfusion', 'Other'].map(complication => (
                                    <div className="flex items-center" key={`complication-${complication}`}>
                                      <Checkbox id={`complication-${complication}`} />
                                      <label htmlFor={`complication-${complication}`} className="ml-2 text-sm">{complication}</label>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">If other complications, specify:</label>
                                  <Textarea placeholder="Describe complications" rows={3} className="w-full" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

                    {/* Section III: Mobilization and Resection */}
                    <Collapsible
                      open={rectalExpanded.section3}
                      onOpenChange={(open) => setRectalExpanded(prev => ({ ...prev, section3: open }))}
                    >
                      <Card className={`glass-card-light transition-all duration-300 ${rectalActiveSection === "section3" ? "ring-2 ring-blue-200 bg-blue-50/30" : ""}`}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-red-600" />
                                Section III: Mobilization and Resection
                              </div>
                              {rectalExpanded.section3 ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-6">
                            {/* Mobilization Approach */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Mobilization Approach</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Vessel ligation sequence:</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                      'IMA divided at origin',
                                      'IMA divided below LCA origin',
                                      'IMV divided separately',
                                      'IMV divided with IMA',
                                      'High tie IMA',
                                      'Selective vessel ligation'
                                    ].map(vessel => (
                                      <div className="flex items-center" key={`vessel-${vessel}`}>
                                        <Checkbox 
                                          id={`vessel-${vessel}`}
                                          checked={currentReport.rectalCancer?.section3?.vesselLigation?.includes(vessel) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.rectalCancer?.section3?.vesselLigation || [];
                                            const updated = checked 
                                              ? [...current.filter(item => item !== vessel), vessel]
                                              : current.filter(item => item !== vessel);
                                            updateRectalCancer('section3', 'vesselLigation', updated);
                                          }}
                                        />
                                        <label htmlFor={`vessel-${vessel}`} className="ml-2 text-sm">{vessel}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Autonomic nerve preservation:</label>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                      'Hypogastric nerves preserved',
                                      'Pelvic splanchnic nerves preserved',
                                      'Both preserved',
                                      'Nerve injury occurred',
                                      'Not applicable'
                                    ].map(nerve => (
                                      <div className="flex items-center" key={`nerve-${nerve}`}>
                                        <Checkbox 
                                          id={`nerve-${nerve}`}
                                          checked={currentReport.rectalCancer?.section3?.nervePreservation?.includes(nerve) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.rectalCancer?.section3?.nervePreservation || [];
                                            const updated = checked 
                                              ? [...current.filter(item => item !== nerve), nerve]
                                              : current.filter(item => item !== nerve);
                                            updateRectalCancer('section3', 'nervePreservation', updated);
                                          }}
                                        />
                                        <label htmlFor={`nerve-${nerve}`} className="ml-2 text-sm">{nerve}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Type of Resection */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Type of Resection</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                  'Right hemicolectomy',
                                  'Extended right hemicolectomy', 
                                  'Left hemicolectomy',
                                  'Sigmoid colectomy',
                                  'High anterior resection',
                                  'Low anterior resection',
                                  'Ultra-low anterior resection',
                                  'Abdominoperineal resection',
                                  'Hartmann procedure',
                                  'Total colectomy',
                                  'Proctocolectomy',
                                  'Subtotal colectomy',
                                  'Pan-proctocolectomy',
                                  'Local excision',
                                  'Other'
                                ].map(resection => (
                                  <div className="flex items-center" key={`resection-${resection}`}>
                                    <Checkbox 
                                      id={`resection-${resection}`}
                                      checked={currentReport.rectalCancer?.section3?.resectionType?.includes(resection) || false}
                                      onCheckedChange={(checked) => {
                                        const current = currentReport.rectalCancer?.section3?.resectionType || [];
                                        const updated = checked 
                                          ? [...current.filter(item => item !== resection), resection]
                                          : current.filter(item => item !== resection);
                                        updateRectalCancer('section3', 'resectionType', updated);
                                      }}
                                    />
                                    <label htmlFor={`resection-${resection}`} className="ml-2 text-sm">{resection}</label>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Other resection specification */}
                              {currentReport.rectalCancer?.section3?.resectionType?.includes('Other') && (
                                <div className="mt-4 p-3 bg-white/70 rounded-md border-l-2 border-gray-300">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Specify other resection type:</label>
                                  <Input 
                                    type="text" 
                                    placeholder="Specify resection type" 
                                    className="w-full"
                                    value={currentReport.rectalCancer?.section3?.resectionOther || ''}
                                    onChange={(e) => updateRectalCancer('section3', 'resectionOther', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Extent of Resection - Shows for specific resection types */}
                            {(currentReport.rectalCancer?.section3?.resectionType?.some(type => 
                              ['High anterior resection', 'Low anterior resection', 'Ultra-low anterior resection'].includes(type)) || false) && (
                              <div className="bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-400">
                                <h3 className="font-semibold text-gray-800 mb-4">Resection Margins</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Proximal resection margin (cm):</label>
                                    <Input 
                                      type="number" 
                                      placeholder="Enter distance" 
                                      className="w-full"
                                      value={currentReport.rectalCancer?.section3?.proximalMargin || ''}
                                      onChange={(e) => updateRectalCancer('section3', 'proximalMargin', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Distal resection margin (cm):</label>
                                    <Input 
                                      type="number" 
                                      placeholder="Enter distance" 
                                      className="w-full"
                                      value={currentReport.rectalCancer?.section3?.distalMargin || ''}
                                      onChange={(e) => updateRectalCancer('section3', 'distalMargin', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TME Quality - Shows only for rectal resections */}
                            {(currentReport.rectalCancer?.section3?.resectionType?.some(type => 
                              type.toLowerCase().includes('anterior resection') || 
                              type.includes('Abdominoperineal') ||
                              type.includes('Intersphincteric')) || false) && (
                              <div className="bg-green-50/50 p-4 rounded-lg border-l-4 border-green-400">
                                <h3 className="font-semibold text-gray-800 mb-4">TME Quality (Total Mesorectal Excision)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {[
                                    'Complete TME',
                                    'Nearly complete TME',
                                    'Incomplete TME',
                                    'TME not attempted',
                                    'Not applicable'
                                  ].map(quality => (
                                    <div className="flex items-center" key={`tme-${quality}`}>
                                      <Checkbox 
                                        id={`tme-${quality}`}
                                        checked={currentReport.rectalCancer?.section3?.tmeQuality === quality}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section3', 'tmeQuality', checked ? quality : '');
                                        }}
                                      />
                                      <label htmlFor={`tme-${quality}`} className="ml-2 text-sm">{quality}</label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lymph Node Dissection */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Lymph Node Dissection</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                  'Standard lymphadenectomy',
                                  'Extended lymphadenectomy', 
                                  'Limited lymphadenectomy',
                                  'No lymphadenectomy',
                                  'D1 dissection',
                                  'D2 dissection',
                                  'D3 dissection'
                                ].map(dissection => (
                                  <div className="flex items-center" key={`lymph-${dissection}`}>
                                    <Checkbox 
                                      id={`lymph-${dissection}`}
                                      checked={currentReport.rectalCancer?.section3?.lymphNodeDissection === dissection}
                                      onCheckedChange={(checked) => {
                                        updateRectalCancer('section3', 'lymphNodeDissection', checked ? dissection : '');
                                      }}
                                    />
                                    <label htmlFor={`lymph-${dissection}`} className="ml-2 text-sm">{dissection}</label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

                    {/* Section IV: Reconstruction */}
                    <Collapsible
                      open={rectalExpanded.section4}
                      onOpenChange={(open) => setRectalExpanded(prev => ({ ...prev, section4: open }))}
                    >
                      <Card className={`glass-card-light transition-all duration-300 ${rectalActiveSection === "section4" ? "ring-2 ring-blue-200 bg-blue-50/30" : ""}`}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-red-600" />
                                Section IV: Reconstruction
                              </div>
                              {rectalExpanded.section4 ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-6">
                            {/* Reconstruction Decision Point */}
                            <div className="bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-400">
                              <h3 className="font-semibold text-gray-800 mb-4">Reconstruction Decision</h3>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="primary-anastomosis"
                                    checked={currentReport.rectalCancer?.section4?.reconstructionType === 'Primary anastomosis'}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('section4', 'reconstructionType', checked ? 'Primary anastomosis' : '');
                                    }}
                                  />
                                  <label htmlFor="primary-anastomosis" className="ml-2 text-sm font-medium">Primary anastomosis</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="no-anastomosis"
                                    checked={currentReport.rectalCancer?.section4?.reconstructionType === 'No anastomosis'}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('section4', 'reconstructionType', checked ? 'No anastomosis' : '');
                                    }}
                                  />
                                  <label htmlFor="no-anastomosis" className="ml-2 text-sm font-medium">No anastomosis (end stoma)</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="delayed-anastomosis"
                                    checked={currentReport.rectalCancer?.section4?.reconstructionType === 'Delayed anastomosis'}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('section4', 'reconstructionType', checked ? 'Delayed anastomosis' : '');
                                    }}
                                  />
                                  <label htmlFor="delayed-anastomosis" className="ml-2 text-sm font-medium">Delayed anastomosis planned</label>
                                </div>
                              </div>
                            </div>

                            {/* Anastomosis Details - Shows only if Primary or Delayed anastomosis selected */}
                            {(currentReport.rectalCancer?.section4?.reconstructionType === 'Primary anastomosis' || 
                              currentReport.rectalCancer?.section4?.reconstructionType === 'Delayed anastomosis') && (
                              <div className="space-y-6">
                                {/* Type of anastomosis */}
                                <div className="bg-gray-50/50 p-4 rounded-lg">
                                  <h3 className="font-semibold text-gray-800 mb-4">Type of Anastomosis</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                      'Colorectal anastomosis',
                                      'Coloanal anastomosis',
                                      'Ileocolic anastomosis', 
                                      'Ileorectal anastomosis',
                                      'End-to-end',
                                      'End-to-side',
                                      'Side-to-side',
                                      'Side-to-end'
                                    ].map(type => (
                                      <div className="flex items-center" key={`anastomosis-type-${type}`}>
                                        <Checkbox 
                                          id={`anastomosis-type-${type}`}
                                          checked={currentReport.rectalCancer?.section4?.anastomosisType?.includes(type) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.rectalCancer?.section4?.anastomosisType || [];
                                            const updated = checked 
                                              ? [...current.filter(item => item !== type), type]
                                              : current.filter(item => item !== type);
                                            updateRectalCancer('section4', 'anastomosisType', updated);
                                          }}
                                        />
                                        <label htmlFor={`anastomosis-type-${type}`} className="ml-2 text-sm">{type}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Anastomosis Technique */}
                                <div className="bg-gray-50/50 p-4 rounded-lg">
                                  <h3 className="font-semibold text-gray-800 mb-4">Anastomosis Technique</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                      'Hand-sewn (single layer)',
                                      'Hand-sewn (double layer)', 
                                      'Stapled (circular stapler)',
                                      'Stapled (linear stapler)',
                                      'Hybrid (stapled + hand-sewn)',
                                      'Intracorporeal anastomosis',
                                      'Extracorporeal anastomosis'
                                    ].map(technique => (
                                      <div className="flex items-center" key={`technique-${technique}`}>
                                        <Checkbox 
                                          id={`technique-${technique}`}
                                          checked={currentReport.rectalCancer?.section4?.anastomosisTechnique?.includes(technique) || false}
                                          onCheckedChange={(checked) => {
                                            const current = currentReport.rectalCancer?.section4?.anastomosisTechnique || [];
                                            const updated = checked 
                                              ? [...current.filter(item => item !== technique), technique]
                                              : current.filter(item => item !== technique);
                                            updateRectalCancer('section4', 'anastomosisTechnique', updated);
                                          }}
                                        />
                                        <label htmlFor={`technique-${technique}`} className="ml-2 text-sm">{technique}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Anastomotic Testing */}
                                <div className="bg-gray-50/50 p-4 rounded-lg">
                                  <h3 className="font-semibold text-gray-800 mb-4">Anastomotic Integrity Testing</h3>
                                  <div className="space-y-3">
                                    <div className="flex items-center">
                                      <Checkbox 
                                        id="leak-test-performed"
                                        checked={currentReport.rectalCancer?.section4?.leakTestPerformed === 'Yes'}
                                        onCheckedChange={(checked) => {
                                          updateRectalCancer('section4', 'leakTestPerformed', checked ? 'Yes' : 'No');
                                        }}
                                      />
                                      <label htmlFor="leak-test-performed" className="ml-2 text-sm">Leak test performed</label>
                                    </div>
                                    
                                    {currentReport.rectalCancer?.section4?.leakTestPerformed === 'Yes' && (
                                      <div className="ml-6 space-y-2">
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="leak-test-negative"
                                            checked={currentReport.rectalCancer?.section4?.leakTestResult === 'Negative'}
                                            onCheckedChange={(checked) => {
                                              updateRectalCancer('section4', 'leakTestResult', checked ? 'Negative' : '');
                                            }}
                                          />
                                          <label htmlFor="leak-test-negative" className="ml-2 text-sm">Negative (no leak)</label>
                                        </div>
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id="leak-test-positive"
                                            checked={currentReport.rectalCancer?.section4?.leakTestResult === 'Positive'}
                                            onCheckedChange={(checked) => {
                                              updateRectalCancer('section4', 'leakTestResult', checked ? 'Positive' : '');
                                            }}
                                          />
                                          <label htmlFor="leak-test-positive" className="ml-2 text-sm">Positive (leak detected)</label>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Protective Stoma Decision */}
                            <div className="bg-yellow-50/50 p-4 rounded-lg border-l-4 border-yellow-400">
                              <h3 className="font-semibold text-gray-800 mb-4">Protective/Diverting Stoma</h3>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="protective-stoma-yes"
                                    checked={currentReport.rectalCancer?.section4?.protectiveStoma === 'Yes'}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('section4', 'protectiveStoma', checked ? 'Yes' : '');
                                    }}
                                  />
                                  <label htmlFor="protective-stoma-yes" className="ml-2 text-sm font-medium">Protective stoma created</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id="protective-stoma-no"
                                    checked={currentReport.rectalCancer?.section4?.protectiveStoma === 'No'}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('section4', 'protectiveStoma', checked ? 'No' : '');
                                    }}
                                  />
                                  <label htmlFor="protective-stoma-no" className="ml-2 text-sm font-medium">No protective stoma</label>
                                </div>
                              </div>

                              {/* Stoma Details - Shows only if protective stoma created */}
                              {currentReport.rectalCancer?.section4?.protectiveStoma === 'Yes' && (
                                <div className="mt-6 space-y-4">
                                  <div className="bg-white/70 p-4 rounded-md">
                                    <h4 className="font-semibold text-gray-800 mb-3">Type of Stoma</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {[
                                        'Loop ileostomy',
                                        'End ileostomy',
                                        'Loop colostomy',
                                        'End colostomy',
                                        'Mucus fistula',
                                        'Other'
                                      ].map(stoma => (
                                        <div className="flex items-center" key={`stoma-type-${stoma}`}>
                                          <Checkbox 
                                            id={`stoma-type-${stoma}`}
                                            checked={currentReport.rectalCancer?.section4?.stomaType?.includes(stoma) || false}
                                            onCheckedChange={(checked) => {
                                              const current = currentReport.rectalCancer?.section4?.stomaType || [];
                                              const updated = checked 
                                                ? [...current.filter(item => item !== stoma), stoma]
                                                : current.filter(item => item !== stoma);
                                              updateRectalCancer('section4', 'stomaType', updated);
                                            }}
                                          />
                                          <label htmlFor={`stoma-type-${stoma}`} className="ml-2 text-sm">{stoma}</label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="bg-white/70 p-4 rounded-md">
                                    <h4 className="font-semibold text-gray-800 mb-3">Reason for Protective Stoma</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {[
                                        'Low anastomosis protection',
                                        'Anastomotic tension',
                                        'Poor tissue quality',
                                        'Positive leak test',
                                        'High-risk patient',
                                        'Surgeon preference',
                                        'Fecal contamination',
                                        'Hemodynamic instability',
                                        'Other'
                                      ].map(reason => (
                                        <div className="flex items-center" key={`stoma-reason-${reason}`}>
                                          <Checkbox 
                                            id={`stoma-reason-${reason}`}
                                            checked={currentReport.rectalCancer?.section4?.stomaReason?.includes(reason) || false}
                                            onCheckedChange={(checked) => {
                                              const current = currentReport.rectalCancer?.section4?.stomaReason || [];
                                              const updated = checked 
                                                ? [...current.filter(item => item !== reason), reason]
                                                : current.filter(item => item !== reason);
                                              updateRectalCancer('section4', 'stomaReason', updated);
                                            }}
                                          />
                                          <label htmlFor={`stoma-reason-${reason}`} className="ml-2 text-sm">{reason}</label>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Other reason specification */}
                                    {currentReport.rectalCancer?.section4?.stomaReason?.includes('Other') && (
                                      <div className="mt-3">
                                        <Input 
                                          type="text" 
                                          placeholder="Specify other reason for stoma" 
                                          className="w-full"
                                          value={currentReport.rectalCancer?.section4?.stomaReasonOther || ''}
                                          onChange={(e) => updateRectalCancer('section4', 'stomaReasonOther', e.target.value)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

                    {/* Section V: Operative Events & Closure */}
                    <Collapsible
                      open={rectalExpanded.section5}
                      onOpenChange={(open) => setRectalExpanded(prev => ({ ...prev, section5: open }))}
                    >
                      <Card className={`glass-card-light transition-all duration-300 ${rectalActiveSection === "section5" ? "ring-2 ring-blue-200 bg-blue-50/30" : ""}`}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-red-600" />
                                Section V: Operative Events & Closure
                              </div>
                              {rectalExpanded.section5 ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-6">
                            {/* Operative times and blood loss */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Operative times and blood loss</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Total operative time (minutes):</label>
                                  <Input type="number" placeholder="Enter time" className="w-full" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated blood loss (mL):</label>
                                  <Input type="number" placeholder="Enter volume" className="w-full" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfusion required:</label>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center">
                                      <Checkbox id="transfusion-yes" />
                                      <label htmlFor="transfusion-yes" className="ml-2 text-sm">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                      <Checkbox id="transfusion-no" />
                                      <label htmlFor="transfusion-no" className="ml-2 text-sm">No</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional procedures */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Additional procedures</h3>
                              <div className="flex flex-wrap gap-6">
                                {['None', 'Omentectomy', 'Liver metastasectomy', 'Peritonectomy', 'Hysterectomy/bilateral salpingo-oophorectomy', 'Bladder resection', 'Other organ resection'].map(procedure => (
                                  <div className="flex items-center" key={`additional-${procedure}`}>
                                    <Checkbox id={`additional-${procedure}`} />
                                    <label htmlFor={`additional-${procedure}`} className="ml-2 text-sm">{procedure}</label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">If other procedures, specify:</label>
                                <Textarea placeholder="Describe additional procedures" rows={3} className="w-full" />
                              </div>
                            </div>

                            {/* Closure details */}
                            <div className="bg-gray-50/50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-4">Closure details</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Fascia closure:</label>
                                  <div className="flex flex-wrap gap-6">
                                    {['Running suture', 'Interrupted sutures', 'Mass closure', 'Layered closure'].map(closure => (
                                      <div className="flex items-center" key={`fascia-${closure}`}>
                                        <Checkbox id={`fascia-${closure}`} />
                                        <label htmlFor={`fascia-${closure}`} className="ml-2 text-sm">{closure}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Suture material for fascia:</label>
                                  <Input type="text" placeholder="Specify suture material and size" className="w-full" />
                                </div>
                              </div>
                            </div>

                            {/* Surgeons signature and date */}
                            <div className="border-t pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Surgeon's Signature</label>
                                  <Input type="file" accept="image/*" className="w-full" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                  <Input type="date" className="w-full" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

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
                                variant="outline" 
                                size="sm" 
                                className="glass-button text-xs" 
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {isSavingDraft ? 'Saving...' : 'Save Draft'}
                              </Button>
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

                    {/* Export Button */}
                    <div className="flex justify-center mt-8 mb-12">
                      <Button 
                        className="px-8 py-4 bg-red-600 hover:bg-red-700 shadow-md text-md font-medium text-white"
                        onClick={() => {
                          setCurrentTab('rectal');
                          handleExportPDF();
                        }}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Generate Colorectal Cancer Surgery Report
                      </Button>
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