import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Microscope, Stethoscope, User, Download, Save, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { PatientInfoForm } from "@/components/PatientInfoForm";
import { ProcedureInfoForm } from "@/components/ProcedureInfoForm";
import { ProcedureTypeSelection } from "@/components/ProcedureTypeSelection";
import { ConditionalDiagramDisplay } from "@/components/ConditionalDiagramDisplay";
import { ReportPreview } from "@/components/ReportPreview";
import { AppLayout, GlassContainer, GlassHeader } from "@/components/layout/AppLayout";
import { captureReportAsPDF, saveDraft, DiagramCapture } from "@/utils/pdfGenerator";
// USING FINAL PDF GENERATOR ONLY
import { generateFinalPDF, FinalDiagramCapture } from "@/utils/finalPdfGenerator";
import { toast } from "sonner";

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
    }
  });
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
  const [isPatientSectionOpen, setIsPatientSectionOpen] = useState(true);
  const reportPreviewRef = useRef<HTMLDivElement>(null);

  // Sync conclusion when updated from live report
  useEffect(() => {
    if (!isEditingConclusion && !tempConclusion) {
      // Only update if we're not currently editing to avoid conflicts
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

  const handleExportPDF = async () => {
    console.log("=== EXPORT FINAL PDF CLICKED - VERSION 2 ===");
    console.log("currentReport:", currentReport);
    console.log("gastroscopy findings:", currentReport.gastroscopyFindings);
    console.log("colonoscopy findings:", currentReport.colonoscopyFindings);
    console.log("gastroscopy canvas data exists:", !!currentReport.gastroscopyCanvasData);
    console.log("colonoscopy canvas data exists:", !!currentReport.colonoscopyCanvasData);
    
    setIsGeneratingPDF(true);
    
    try {
      // USE FINAL PDF GENERATOR (completely new)  
      const finalDiagrams: FinalDiagramCapture[] = [];
      
      // Add diagrams if canvas data exists
      if (currentReport.gastroscopyCanvasData) {
        console.log("Adding gastroscopy diagram to FINAL PDF");
        finalDiagrams.push({
          canvasImageData: currentReport.gastroscopyCanvasData,
          findings: currentReport.gastroscopyFindings?.findings || [],
          type: 'gastroscopy'
        });
      }
      
      if (currentReport.colonoscopyCanvasData) {
        console.log("Adding colonoscopy diagram to FINAL PDF");
        finalDiagrams.push({
          canvasImageData: currentReport.colonoscopyCanvasData,
          findings: currentReport.colonoscopyFindings?.findings || [],
          type: 'colonoscopy'
        });
      }

      console.log("Total diagrams for FINAL PDF:", finalDiagrams.length);

      await generateFinalPDF(
        currentReport.patientInfo?.name || '',
        currentReport.patientInfo?.patientId || '',
        finalDiagrams.length > 0 ? finalDiagrams : undefined,
        currentReport
      );
      
      toast.success("FINAL PDF exported successfully! Should show all changes now.");
    } catch (error) {
      console.error('Error exporting FINAL PDF:', error);
      toast.error("Failed to export FINAL PDF. Please try again.");
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
          title="Endoscopy Documentation System"
          subtitle="Comprehensive endoscopic procedure documentation for South African medical facilities"
          icon={<Stethoscope className="h-16 w-16 text-gray-700" />}
        />

        <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="2xl:col-span-3">
            <Card className="shadow-glass-heavy">
              <div className="w-full space-y-3 p-6">
                {/* Patient Information Section - Collapsible */}
                <Collapsible 
                  open={isPatientSectionOpen} 
                  onOpenChange={setIsPatientSectionOpen}
                >
                  <Card className="glass-card-light p-3 mb-3">
                    <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:bg-gray-50/50 transition-colors rounded p-2 -m-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-black">Patient Information</span>
                        <span className="text-xs text-gray-500 font-normal ml-2">Enter patient details</span>
                      </div>
                      {isPatientSectionOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-3">
                      <PatientInfoForm 
                        onUpdate={(data) => updateReport('patientInfo', data)}
                        currentData={currentReport.patientInfo}
                      />
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Procedure Information */}
                <ProcedureInfoForm 
                  onUpdate={(data) => updateReport('patientInfo', data)}
                  initialData={currentReport.patientInfo}
                />
                
                <ProcedureTypeSelection
                  onUpdate={(procedures) => updateReport('selectedProcedures', procedures)}
                  initialProcedures={currentReport.selectedProcedures}
                />
                
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
              </div>
            </Card>
          </div>

          {/* Report Preview */}
          <div className="2xl:col-span-1">
            <Card className="shadow-glass-heavy sticky top-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Live Report
                    <span className="text-xs text-gray-500 font-normal ml-2">Real-time preview of your documentation</span>
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
                  <ReportPreview 
                    report={currentReport} 
                    onEditFinding={handleEditFinding}
                    onRemoveFinding={handleRemoveFinding}
                    onRedoFinding={handleRedoFinding}
                    onUndoFinding={handleUndoFinding}
                    onEditProcedureFindings={handleEditProcedureFindings}
                    onRemoveProcedureFindings={handleRemoveProcedureFindings}
                    onEditPatientInfo={handleEditPatientInfo}
                    onEditConclusion={handleEditConclusion}
                    onRemoveConclusion={handleRemoveConclusion}
                    onEditFollowUp={handleEditFollowUp}
                    onRemoveFollowUp={handleRemoveFollowUp}
                    canRedo={{
                      gastroscopy: diagramMethods.gastroscopy?.canRedo?.() || false,
                      colonoscopy: diagramMethods.colonoscopy?.canRedo?.() || false
                    }}
                  />
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