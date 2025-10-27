import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Redo2, X, Save } from "lucide-react";
import { getFullASAText } from '@/utils/asaDescriptions';
import { formatDateDDMMYYYY } from '@/utils/dateFormatter';
import appendectomyImage from '@/assets/appendectomy.jpg';

interface ReportPreviewProps {
  report: {
    patientInfo: any;
    gastroscopyFindings: any;
    colonoscopyFindings: any;
    media: any[];
    notes: string;
    selectedProcedures?: string[];
    gastroscopyCanvasData?: string;
    colonoscopyCanvasData?: string;
    procedureFindings?: {
      findings: string;
      additionalNotes: string;
    };
    conclusion?: string;
    followUp?: {
      enabled: boolean;
      options: string[];
      other: string;
      notes: string;
    };
    signature?: {
      surgeonSignature: string;
      surgeonSignatureText: string;
      dateTime: string;
    };
    rectalCancer?: {
      section1: any;
      section2: any;
      section3: any;
      section4: any;
      section5: any;
    };
  };
  gastroscopyCanvas?: HTMLCanvasElement | null;
  colonoscopyCanvas?: HTMLCanvasElement | null;
  diagramUpdateTrigger?: number;
  onEditFinding?: (findingId: string, type: 'gastroscopy' | 'colonoscopy', updatedFinding?: any) => void;
  onRemoveFinding?: (findingId: string, type: 'gastroscopy' | 'colonoscopy') => void;
  onRedoFinding?: (type: 'gastroscopy' | 'colonoscopy') => void;
  onUndoFinding?: (type: 'gastroscopy' | 'colonoscopy') => void;
  onEditProcedureFindings?: (updatedFindings?: string) => void;
  onRemoveProcedureFindings?: () => void;
  onEditPatientInfo?: (field: string, value: string) => void;
  onEditConclusion?: (updatedConclusion?: string) => void;
  onRemoveConclusion?: () => void;
  onEditFollowUp?: (field: 'options' | 'other' | 'notes', value: any) => void;
  onRemoveFollowUp?: () => void;
  canRedo?: { gastroscopy: boolean; colonoscopy: boolean };
  currentTab?: string;
}

// Component to render surgical diagram with markings
const SurgicalDiagramDisplay = ({ markings }: { markings: any[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !markings.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawDiagram = () => {
      // Clear and draw base image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      // Draw all markings
      markings.forEach((marking) => {
        if (marking.type === 'port') {
          // Draw port marking: black line with size label
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(marking.size, marking.x, marking.y - 5);

          ctx.beginPath();
          ctx.moveTo(marking.x - 15, marking.y);
          ctx.lineTo(marking.x + 15, marking.y);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === 'stoma') {
          // Draw stoma marking
          ctx.save();
          if (marking.stomaType === 'ileostomy') {
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f59e0b'; // Gold/Yellow
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Dashed line
            ctx.stroke();
          } else { // colostomy
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, 25, 0, 2 * Math.PI);
            ctx.strokeStyle = '#16a34a'; // Green
            ctx.lineWidth = 4;
            ctx.setLineDash([]); // Continuous line
            ctx.stroke();
          }
          ctx.restore();
        } else if (marking.type === 'incision') {
          // Draw incision marking: dashed brownish red line
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = '#8B0000'; // Dark red
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]); // Dashed line
          ctx.stroke();
          ctx.restore();
        }
      });
    };

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawDiagram();
    };

    if (image.complete && image.naturalHeight !== 0) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawDiagram();
    } else {
      image.src = appendectomyImage;
    }
  }, [markings]);

  return (
    <div className="mt-3 border rounded-lg overflow-hidden bg-white" style={{ maxWidth: 'fit-content' }}>
      <img ref={imageRef} src={appendectomyImage} alt="Surgical diagram" className="hidden" />
      <canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxHeight: '300px' }} />
    </div>
  );
};

export const ReportPreview = ({ report, onEditFinding, onRemoveFinding, onRedoFinding, onUndoFinding, onEditProcedureFindings, onRemoveProcedureFindings, onEditPatientInfo, onEditConclusion, onRemoveConclusion, onEditFollowUp, onRemoveFollowUp, canRedo, currentTab }: ReportPreviewProps) => {
  // Use canvas data directly from the report
  const gastroscopyImageData = report.gastroscopyCanvasData || '';
  const colonoscopyImageData = report.colonoscopyCanvasData || '';
  
  // State for inline editing
  const [editingFinding, setEditingFinding] = useState<{id: string; type: 'gastroscopy' | 'colonoscopy'} | null>(null);
  const [editForm, setEditForm] = useState({
    type: '',
    location: '',
    description: ''
  });
  
  // State for editing procedure findings
  const [editingProcedureFindings, setEditingProcedureFindings] = useState(false);
  const [procedureFindingsText, setProcedureFindingsText] = useState('');
  
  // State for editing patient info
  const [editingPatientField, setEditingPatientField] = useState<string | null>(null);
  const [patientFieldValue, setPatientFieldValue] = useState('');
  
  // State for editing conclusion
  const [editingConclusion, setEditingConclusion] = useState(false);
  const [conclusionText, setConclusionText] = useState('');
  
  // State for editing follow-up
  const [editingFollowUp, setEditingFollowUp] = useState<'options' | 'other' | 'notes' | null>(null);
  const [followUpValue, setFollowUpValue] = useState<any>('');
  
  // Available finding types
  const findingTypes = [
    "Normal mucosa", "Erythema", "Gastritis", "Esophagitis", "Duodenitis", "Colitis",
    "Polyp", "Adenoma", "Lipoma", "Ulceration", "Mass", "Bleeding", "Carcinoid",
    "Stricture", "Hiatal hernia", "Diverticulum", "Barrett's esophagus", "H. pylori",
    "Hemorrhoid", "Varices", "Melanosis coli", "Angiodysplasia", "Other"
  ];
  
  // Location options based on procedure type
  const getLocationOptions = (procedureType: string) => {
    if (procedureType === 'gastroscopy') {
      return [
        "Esophagus - Upper third", "Esophagus - Middle third", "Esophagus - Lower third",
        "GE Junction", "Stomach - Cardia", "Stomach - Fundus", "Stomach - Body", 
        "Stomach - Antrum", "Stomach - Pylorus", "Duodenum - Bulb", "Duodenum - D2"
      ];
    } else {
      return [
        "Cecum", "Ascending colon", "Hepatic flexure", "Transverse colon", 
        "Splenic flexure", "Descending colon", "Sigmoid colon", "Rectum", "Anus"
      ];
    }
  };
  
  const startEditing = (finding: any, type: 'gastroscopy' | 'colonoscopy') => {
    setEditingFinding({ id: finding.id, type });
    setEditForm({
      type: finding.type || '',
      location: finding.location || '',
      description: finding.description || ''
    });
  };
  
  const saveEdit = () => {
    if (editingFinding && onEditFinding) {
      const updatedFinding = {
        id: editingFinding.id,
        type: editForm.type,
        location: editForm.location,
        description: editForm.description
      };
      onEditFinding(editingFinding.id, editingFinding.type, updatedFinding);
      setEditingFinding(null);
      setEditForm({ type: '', location: '', description: '' });
    }
  };
  
  const cancelEdit = () => {
    setEditingFinding(null);
    setEditForm({ type: '', location: '', description: '' });
  };
  
  const startEditingProcedureFindings = () => {
    setEditingProcedureFindings(true);
    setProcedureFindingsText(report.procedureFindings?.findings || '');
  };
  
  const saveProcedureFindings = () => {
    if (onEditProcedureFindings) {
      onEditProcedureFindings(procedureFindingsText);
      setEditingProcedureFindings(false);
      setProcedureFindingsText('');
    }
  };
  
  const cancelProcedureFindings = () => {
    setEditingProcedureFindings(false);
    setProcedureFindingsText('');
  };
  
  // Patient info editing functions
  const startEditingPatientField = (field: string, currentValue: string) => {
    setEditingPatientField(field);
    setPatientFieldValue(currentValue || '');
  };
  
  const savePatientField = () => {
    if (editingPatientField && onEditPatientInfo) {
      onEditPatientInfo(editingPatientField, patientFieldValue);
      setEditingPatientField(null);
      setPatientFieldValue('');
    }
  };
  
  const cancelPatientEdit = () => {
    setEditingPatientField(null);
    setPatientFieldValue('');
  };
  
  // Conclusion editing functions
  const startEditingConclusion = () => {
    setEditingConclusion(true);
    setConclusionText(report.conclusion || '');
  };
  
  const saveConclusion = () => {
    if (onEditConclusion) {
      onEditConclusion(conclusionText);
      setEditingConclusion(false);
      setConclusionText('');
    }
  };
  
  const cancelConclusion = () => {
    setEditingConclusion(false);
    setConclusionText('');
  };
  
  // Follow-up editing functions
  const startEditingFollowUp = (field: 'options' | 'other' | 'notes') => {
    setEditingFollowUp(field);
    if (field === 'options') {
      setFollowUpValue(report.followUp?.options || []);
    } else if (field === 'other') {
      setFollowUpValue(report.followUp?.other || '');
    } else if (field === 'notes') {
      setFollowUpValue(report.followUp?.notes || '');
    }
  };
  
  const saveFollowUp = () => {
    if (editingFollowUp && onEditFollowUp) {
      onEditFollowUp(editingFollowUp, followUpValue);
      setEditingFollowUp(null);
      setFollowUpValue('');
    }
  };
  
  const cancelFollowUp = () => {
    setEditingFollowUp(null);
    setFollowUpValue('');
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    
    // Get ordinal suffix for day
    const getOrdinalSuffix = (day: number) => {
      if (day >= 11 && day <= 13) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) {
      // Use current date and time if no date provided
      const now = new Date();
      const day = now.getDate();
      const month = now.toLocaleDateString('en-US', { month: 'long' });
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      
      const getOrdinalSuffix = (day: number) => {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      
      return `${day}${getOrdinalSuffix(day)} - ${month} - ${year} at ${hours}:${minutes}`;
    }
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const getOrdinalSuffix = (day: number) => {
      if (day >= 11 && day <= 13) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} - ${month} - ${year} at ${hours}:${minutes}`;
  };

  const formatAnesthesiaType = (anesthesia: string) => {
    if (!anesthesia) return 'Not specified';
    
    // Map the values to properly formatted strings
    const anesthesiaTypeMap: Record<string, string> = {
      'conscious': 'Conscious Sedation',
      'deep': 'Deep Sedation',
      'general': 'General Anesthesia',
      'none': 'No Sedation'
    };
    
    return anesthesiaTypeMap[anesthesia] || anesthesia;
  };

  // Medical terminology corrections and professional formatting
  const formatMedicalText = (text: string) => {
    if (!text || typeof text !== 'string') {
      return 'Not specified';
    }
    
    // Extensive medical term corrections and standardizations
    const medicalTermCorrections: Record<string, string> = {
      // Gastroenterology terms - MAIN FOCUS ON USER'S ISSUE
      'gastriris': 'gastritis',
      'gastrtis': 'gastritis', 
      'gastrits': 'gastritis',
      'gastirits': 'gastritis',
      'gastirris': 'gastritis',
      'gastritiss': 'gastritis',
      'gastritus': 'gastritis',
      'gasteitis': 'gastritis',
      'gastirosis': 'gastritis',
      
      // More esophagitis variants
      'esophagits': 'esophagitis',
      'esofagitis': 'esophagitis',
      'esophegitis': 'esophagitis',
      'esofagits': 'esophagitis',
      'oesofagitis': 'esophagitis',
      
      // Duodenitis variants
      'duodenits': 'duodenitis',
      'duodentis': 'duodenitis',
      'duodenitus': 'duodenitis',
      
      // Colitis variants
      'colits': 'colitis',
      'colitus': 'colitis',
      'collitis': 'colitis',
      
      // Ulceration variants  
      'ulceratoin': 'ulceration',
      'ulceraton': 'ulceration',
      'ulceraion': 'ulceration',
      'ulseration': 'ulceration',
      'ulcertation': 'ulceration',
      
      // Inflammation variants
      'inflamation': 'inflammation',
      'inflamatory': 'inflammatory',
      'inflammatry': 'inflammatory',
      'inflammatory': 'inflammatory',
      
      // British vs American spellings
      'haemorrhage': 'hemorrhage',
      'haemorrhoid': 'hemorrhoid',
      'oesophagus': 'esophagus',
      'oesophagitis': 'esophagitis', 
      'diarrhoea': 'diarrhea',
      'anaemia': 'anemia',
      'oedema': 'edema',
      'haematoma': 'hematoma',
      
      // Anatomy term variants
      'stomache': 'stomach',
      'stomack': 'stomach',
      'stumach': 'stomach',
      'stommach': 'stomach',
      
      // Symptom variants
      'abdomenal': 'abdominal',
      'abdomonal': 'abdominal',
      'abdominel': 'abdominal',
      'vomitting': 'vomiting',
      'vomiting': 'vomiting',
      'vommiting': 'vomiting',
      'vom​iting': 'vomiting',
      
      // Standard medical terms (to ensure consistency)
      'nausea': 'nausea',
      'diarrhea': 'diarrhea',
      'constipation': 'constipation',
      'bloating': 'bloating',
      'cramping': 'cramping', 
      'heartburn': 'heartburn',
      'reflux': 'reflux',
      'dyspepsia': 'dyspepsia',
      'dysphagia': 'dysphagia',
      'odynophagia': 'odynophagia',
      
      // Anatomical locations
      'intestine': 'intestine',
      'bowel': 'bowel',
      'colon': 'colon', 
      'rectum': 'rectum',
      'anus': 'anus',
      'duodenum': 'duodenum',
      'jejunum': 'jejunum',
      'ileum': 'ileum',
      'cecum': 'cecum',
      'sigmoid': 'sigmoid',
      
      // Procedures
      'endoscopy': 'endoscopy',
      'gastroscopy': 'gastroscopy',
      'colonoscopy': 'colonoscopy',
      'biopsy': 'biopsy',
      'polypectomy': 'polypectomy',
      'sedation': 'sedation',
      'anesthesia': 'anesthesia',
      'anaesthesia': 'anesthesia',
      
      // Medical abbreviations and terms
      'gi': 'GI',
      'gerd': 'GERD', 
      'ibd': 'IBD',
      'ibs': 'IBS',
      'crohns': "Crohn's disease",
      'uc': 'ulcerative colitis',
      'h pylori': 'H. pylori',
      'h.pylori': 'H. pylori',
      'hpylori': 'H. pylori',
      'pylori': 'H. pylori',
      'helicobacter': 'Helicobacter pylori'
    };

    // Convert to lowercase for processing
    let correctedText = text.toLowerCase().trim();
    
    // Split into words and process each one
    const words = correctedText.split(/\s+/);
    
    const correctedWords = words.map((word) => {
      // Remove punctuation for matching but preserve it
      const cleanWord = word.replace(/[^\w]/g, '');
      const punctuation = word.replace(/[\w]/g, '');
      
      const correction = medicalTermCorrections[cleanWord];
      if (correction) {
        return correction + punctuation;
      }
      
      return word;
    });
    
    // Rejoin words
    correctedText = correctedWords.join(' ');
    
    // Capitalize first letter of sentences (after periods)
    correctedText = correctedText.replace(/(^|\. )(\w)/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    // Capitalize first letter of entire text
    if (correctedText.length > 0) {
      correctedText = correctedText.charAt(0).toUpperCase() + correctedText.slice(1);
    }
    
    // Apply proper medical term capitalizations
    const properCapitalizations = [
      { pattern: /\bgi\b/gi, replacement: 'GI' },
      { pattern: /\bh\.?\s?pylori\b/gi, replacement: 'H. pylori' },
      { pattern: /\bhelicobacter pylori\b/gi, replacement: 'Helicobacter pylori' },
      { pattern: /\bgerd\b/gi, replacement: 'GERD' },
      { pattern: /\bibd\b/gi, replacement: 'IBD' },
      { pattern: /\bibs\b/gi, replacement: 'IBS' },
      { pattern: /\bcrohn'?s disease\b/gi, replacement: "Crohn's disease" },
      { pattern: /\bulcerative colitis\b/gi, replacement: 'ulcerative colitis' },
      { pattern: /\bbarrett'?s esophagus\b/gi, replacement: "Barrett's esophagus" }
    ];
    
    properCapitalizations.forEach(({ pattern, replacement }) => {
      correctedText = correctedText.replace(pattern, replacement);
    });
    
    return correctedText;
  };

  const formatGender = (gender: string) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const formatPreparation = (preparation: string) => {
    if (!preparation) return 'Not specified';
    return preparation.charAt(0).toUpperCase() + preparation.slice(1).toLowerCase();
  };

  const formatPatientName = (name: string) => {
    if (!name) return 'Not specified';
    // Capitalize each word in the name
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Color mapping for different finding types (same as AnatomyDiagram)
  const findingTypeColors: Record<string, string> = {
    // Normal findings - green shades
    "Normal mucosa": "#16a34a",
    
    // Inflammatory/mild findings - yellow/orange shades
    "Erythema": "#f59e0b",
    "Gastritis": "#fb923c",
    "Esophagitis": "#f97316",
    "Duodenitis": "#ea580c",
    "Colitis": "#ff8c00",
    
    // Polyps/growths - purple shades
    "Polyp": "#9333ea",
    "Adenoma": "#a855f7",
    "Lipoma": "#c084fc",
    
    // Serious findings - red shades
    "Ulceration": "#dc2626",
    "Mass": "#b91c1c",
    "Bleeding": "#ef4444",
    "Carcinoid": "#dc2626",
    
    // Structural issues - blue shades
    "Stricture": "#2563eb",
    "Hiatal hernia": "#3b82f6",
    "Diverticulum": "#60a5fa",
    
    // Special findings - teal/cyan shades
    "Barrett's esophagus": "#0891b2",
    "H. pylori": "#06b6d4",
    "Hemorrhoid": "#0e7490",
    "Varices": "#0369a1",
    
    // Other findings - gray/brown shades
    "Melanosis coli": "#525252",
    "Angiodysplasia": "#78716c",
    
    // Default color for any unmapped finding
    "default": "#6b7280"
  };
  
  const getFindingColor = (findingType: string): string => {
    return findingTypeColors[findingType] || findingTypeColors["default"];
  };

  const renderFindings = (findings: any, type: string) => {
    if (!findings?.findings || findings.findings.length === 0) {
      return <p className="text-muted-foreground text-xs">No {type.toLowerCase()} findings documented</p>;
    }

    const procedureType = type.toLowerCase() as 'gastroscopy' | 'colonoscopy';

    return (
      <div className="space-y-3">
        {findings.findings.map((finding: any, index: number) => (
          <div key={finding.id} className="border rounded-lg">
            {editingFinding?.id === finding.id ? (
              // Inline edit form
              <div className="p-3 bg-blue-50 border-blue-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Finding Type</label>
                    <Select
                      value={editForm.type}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select finding type" />
                      </SelectTrigger>
                      <SelectContent>
                        {findingTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Location</label>
                    <Select
                      value={editForm.location}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {getLocationOptions(procedureType).map((location) => (
                          <SelectItem key={location} value={location} className="text-xs">
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Description</label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add additional details..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={cancelEdit} className="text-xs h-7">
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} className="text-xs h-7">
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Normal display
              <div className="group flex items-start justify-between p-3 hover:bg-gray-50 transition-colors">
                <div className="flex flex-wrap gap-1 items-center flex-1 mr-2">
                  <div 
                    className="px-2 py-1 rounded text-white font-medium text-xs"
                    style={{ 
                      backgroundColor: getFindingColor(finding.type),
                      color: '#ffffff'
                    }}
                  >
                    {finding.type}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {finding.location}
                  </Badge>
                  {finding.description && (
                    <span className="text-xs text-muted-foreground">
                      - {formatMedicalText(finding.description)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-100">
                  {/* Only show edit button if finding has user-typed content */}
                  {onEditFinding && (finding.type === "Other" || finding.description) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-100 border border-blue-200"
                      onClick={() => startEditing(finding, procedureType)}
                      title="Edit Finding"
                    >
                      <Edit className="h-3 w-3 text-blue-600" />
                    </Button>
                  )}
                  {/* Always show remove button */}
                  {onRemoveFinding && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-100 border border-red-200"
                      onClick={() => onRemoveFinding(finding.id, procedureType)}
                      title="Remove Finding"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
        {/* Top System Title */}
        <div className="text-center border-b pb-3 mb-4">
          <div className="text-sm font-bold text-black mb-1">Endoscopy Documentation System</div>
          <div className="text-sm font-bold text-black">Dr. Monde Mjoli</div>
        </div>

        {/* Professional Header */}
        <div className="border-b pb-4 mb-4">
          <div className="grid grid-cols-3 gap-4 items-start">
            {/* Left - Doctor Info */}
            <div className="text-left">
              <div className="text-xs font-bold text-black">Dr. Monde Mjoli</div>
              <div className="text-xs font-bold text-gray-800">Specialist Surgeon</div>
              <div className="text-xs text-gray-600">MBChB (UNITRA), MMed (UKZN), FCS(SA), Cert Gastroenterology, Surg (SA)</div>
              <div className="text-xs text-gray-600">Practice No. 0560812</div>
              <div className="text-xs text-gray-600">Cell: 082 417 2630</div>
              <div className="text-xs text-gray-600">Email: drmats@iafrica.com</div>
            </div>
            
            {/* Center - Report Title */}
            <div className="text-center">
              <div className="text-sm font-bold text-black">ENDOSCOPY REPORT</div>
              <div className="text-xs text-muted-foreground mt-2">
                Generated: {formatDateTime()}
              </div>
            </div>
            
            {/* Right - Address */}
            <div className="text-right">
              <div className="text-xs text-gray-600">St. Dominic's Medical Suites B</div>
              <div className="text-xs text-gray-600">56 St James Road, Southernwood</div>
              <div className="text-xs text-gray-600">East London, 5201</div>
              <div className="text-xs text-gray-600">Tel: 043 743 7872</div>
              <div className="text-xs text-gray-600">Fax: 043 743 6653</div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-black">PATIENT INFORMATION</h4>
            <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
              {onEditPatientInfo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                  onClick={() => startEditingPatientField('name', report.patientInfo.name)}
                  title="Edit Patient Info"
                >
                  <Edit className="h-3 w-3 text-blue-600" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-xs">Patient ID:</span>
              {editingPatientField === 'patientId' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-32"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{report.patientInfo.patientId || 'Not specified'}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('patientId', report.patientInfo.patientId)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Name:</span>
              {editingPatientField === 'name' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-32"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{formatPatientName(report.patientInfo.name)}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('name', report.patientInfo.name)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Date Of Birth:</span>
              {editingPatientField === 'dateOfBirth' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-32"
                    type="date"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{formatDateDDMMYYYY(report.patientInfo.dateOfBirth)}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('dateOfBirth', report.patientInfo.dateOfBirth)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Age:</span>
              {editingPatientField === 'age' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-20"
                    type="number"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{report.patientInfo.age || 'Not specified'}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('age', report.patientInfo.age)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Gender:</span>
              {editingPatientField === 'gender' ? (
                <div className="flex gap-1 items-center">
                  <Select value={patientFieldValue} onValueChange={setPatientFieldValue}>
                    <SelectTrigger className="h-6 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male" className="text-xs">Male</SelectItem>
                      <SelectItem value="female" className="text-xs">Female</SelectItem>
                      <SelectItem value="other" className="text-xs">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{formatGender(report.patientInfo.sex || report.patientInfo.gender)}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('gender', report.patientInfo.gender)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Weight:</span>
              {editingPatientField === 'weight' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-20"
                    placeholder="kg"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{report.patientInfo.weight ? `${report.patientInfo.weight} kg` : 'Not specified'}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('weight', report.patientInfo.weight)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Height:</span>
              {editingPatientField === 'height' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-20"
                    placeholder="cm"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{report.patientInfo.height ? `${report.patientInfo.height} cm` : 'Not specified'}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('height', report.patientInfo.height)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">BMI:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">{report.patientInfo.bmi || 'Not calculated'}</span>
              </div>
            </div>
            {report.patientInfo.asaScore && (
              <div className="flex justify-between items-center group">
                <span className="font-medium text-xs">ASA Score:</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">{getFullASAText(report.patientInfo.asaScore)}</span>
                </div>
              </div>
            )}
            {report.patientInfo.asaNotes && (
              <div className="group">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-xs">ASA Notes:</span>
                </div>
                <div className="text-xs text-gray-700 break-words">{report.patientInfo.asaNotes}</div>
              </div>
            )}
            <div className="flex justify-between items-center group">
              <span className="font-medium text-xs">Date:</span>
              {editingPatientField === 'date' ? (
                <div className="flex gap-1 items-center">
                  <Input
                    value={patientFieldValue}
                    onChange={(e) => setPatientFieldValue(e.target.value)}
                    className="h-6 text-xs w-32"
                    type="date"
                  />
                  <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{formatDate(report.patientInfo.date)}</span>
                  {onEditPatientInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingPatientField('date', report.patientInfo.date)}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preoperative Information */}
          {(report.patientInfo?.surgeons?.length || report.patientInfo?.assistants?.length || report.patientInfo?.anaesthetists?.length) && (
            <div className="mt-3">
              <h6 className="text-xs font-medium text-gray-700 mb-2">Preoperative Information</h6>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {report.patientInfo?.surgeons?.filter((s:string)=>s?.trim()).length > 0 && (
                  <div><span className="font-medium">Surgeon:</span> {report.patientInfo.surgeons.filter((s:string)=>s?.trim()).join(', ')}</div>
                )}
                {report.patientInfo?.assistants?.filter((s:string)=>s?.trim()).length > 0 && (
                  <div><span className="font-medium">Assistant:</span> {report.patientInfo.assistants.filter((s:string)=>s?.trim()).join(', ')}</div>
                )}
                {report.patientInfo?.anaesthetists?.filter((s:string)=>s?.trim()).length > 0 && (
                  <div><span className="font-medium">Anaesthetist:</span> {report.patientInfo.anaesthetists.filter((s:string)=>s?.trim()).join(', ')}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Clinical Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-black">CLINICAL INFORMATION</h4>
            <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
              {onEditPatientInfo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                  onClick={() => startEditingPatientField('indication', report.patientInfo.indication)}
                  title="Edit Clinical Info"
                >
                  <Edit className="h-3 w-3 text-blue-600" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2 text-xs">
            {report.selectedProcedures && report.selectedProcedures.length > 0 && (
              <div>
                <span className="font-medium text-xs">Procedures Performed:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.selectedProcedures.map((procedure, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {procedure}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="group">
              <div className="flex items-start justify-between">
                <span className="font-medium text-xs">Indication:</span>
                {onEditPatientInfo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                    onClick={() => startEditingPatientField('indication', report.patientInfo.indication)}
                  >
                    <Edit className="h-2 w-2 text-blue-600" />
                  </Button>
                )}
              </div>
              {editingPatientField === 'indication' ? (
                <div className="mt-2 p-3 bg-blue-50 border-blue-200 border rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Clinical Indication</label>
                      <Textarea
                        value={patientFieldValue}
                        onChange={(e) => setPatientFieldValue(e.target.value)}
                        placeholder="Edit clinical indication..."
                        rows={3}
                        className="text-xs resize-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="text-xs h-7">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={savePatientField} className="text-xs h-7">
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs mt-1">{formatMedicalText(report.patientInfo.indication)}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex justify-between items-center group">
                <span className="font-medium text-xs">Preparation:</span>
                {editingPatientField === 'preparation' ? (
                  <div className="flex gap-1 items-center">
                    <Select value={patientFieldValue} onValueChange={setPatientFieldValue}>
                      <SelectTrigger className="h-6 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent" className="text-xs">Excellent</SelectItem>
                        <SelectItem value="good" className="text-xs">Good</SelectItem>
                        <SelectItem value="fair" className="text-xs">Fair</SelectItem>
                        <SelectItem value="poor" className="text-xs">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{formatPreparation(report.patientInfo.preparation)}</span>
                    {onEditPatientInfo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                        onClick={() => startEditingPatientField('preparation', report.patientInfo.preparation)}
                      >
                        <Edit className="h-2 w-2 text-blue-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center group">
                <span className="font-medium text-xs">Type of Anesthesia:</span>
                {editingPatientField === 'sedation' ? (
                  <div className="flex gap-1 items-center">
                    <Select value={patientFieldValue} onValueChange={setPatientFieldValue}>
                      <SelectTrigger className="h-6 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conscious" className="text-xs">Conscious Sedation</SelectItem>
                        <SelectItem value="deep" className="text-xs">Deep Sedation</SelectItem>
                        <SelectItem value="general" className="text-xs">General Anesthesia</SelectItem>
                        <SelectItem value="none" className="text-xs">No Sedation</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{formatAnesthesiaType(report.patientInfo.sedation)}</span>
                    {onEditPatientInfo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                        onClick={() => startEditingPatientField('sedation', report.patientInfo.sedation)}
                      >
                        <Edit className="h-2 w-2 text-blue-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center group">
                <span className="font-medium text-xs">Assistant:</span>
                {editingPatientField === 'assistant' ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      value={patientFieldValue}
                      onChange={(e) => setPatientFieldValue(e.target.value)}
                      className="h-6 text-xs w-32"
                      placeholder="Assistant name"
                    />
                    <Button variant="outline" size="sm" onClick={cancelPatientEdit} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm" onClick={savePatientField} className="h-6 w-6 p-0">
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{report.patientInfo.assistant || 'Not specified'}</span>
                    {onEditPatientInfo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                        onClick={() => startEditingPatientField('assistant', report.patientInfo.assistant)}
                      >
                        <Edit className="h-2 w-2 text-blue-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {report.patientInfo?.operationDescription && (
                <div className="group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-xs">Operation Description:</span>
                  </div>
                  <div className="text-xs text-gray-700 break-words">{report.patientInfo.operationDescription}</div>
                </div>
              )}
              {report.patientInfo?.preoperativeImaging && (
                <div className="flex justify-between items-center group">
                  <span className="font-medium text-xs">Preoperative Imaging:</span>
                  <span className="text-xs">{report.patientInfo.preoperativeImaging}</span>
                </div>
              )}
              {(report.patientInfo?.operationStartTime || report.patientInfo?.operationEndTime || report.patientInfo?.operationDuration) && (
                <div className="group">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-xs">Duration of Operation:</span>
                    <span className="text-xs">
                      {report.patientInfo.operationStartTime ? `Start: ${report.patientInfo.operationStartTime}` : ''}
                      {report.patientInfo.operationEndTime ? `  End: ${report.patientInfo.operationEndTime}` : ''}
                      {report.patientInfo.operationDuration ? `  Total: ${report.patientInfo.operationDuration} min` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Specimen Section */}
        {(report.specimen && (report.specimen.sentForPathology || report.specimen.otherSpecimensTaken || report.specimen.laboratoryName || report.specimen.otherSpecimensDetails)) && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black">SPECIMEN</h4>
              </div>
              <div className="space-y-1 text-xs">
                {report.specimen.sentForPathology && (
                  <div><span className="font-medium">Specimen Sent for Pathology:</span> {report.specimen.sentForPathology}</div>
                )}
                {report.specimen.sentForPathology === 'Yes' && report.specimen.laboratoryName && (
                  <div><span className="font-medium">Laboratory Sent to:</span> {report.specimen.laboratoryName}</div>
                )}
                {report.specimen.otherSpecimensTaken && (
                  <div>
                    <span className="font-medium">Other Specimens Taken:</span> {report.specimen.otherSpecimensTaken}
                    {report.specimen.otherSpecimensTaken === 'Yes' && report.specimen.otherSpecimensDetails && (
                      <span>{` (Specify: ${report.specimen.otherSpecimensDetails})`}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Procedure Findings Section */}
        {report.procedureFindings?.findings && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black">PROCEDURE FINDINGS</h4>
                <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
                  {onEditProcedureFindings && !editingProcedureFindings && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                      onClick={startEditingProcedureFindings}
                    >
                      <Edit className="h-3 w-3 text-blue-600" />
                    </Button>
                  )}
                  {onRemoveProcedureFindings && !editingProcedureFindings && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={onRemoveProcedureFindings}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                {editingProcedureFindings ? (
                  <div className="p-3 bg-blue-50 border-blue-200 border rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Procedure Findings</label>
                        <Textarea
                          value={procedureFindingsText}
                          onChange={(e) => setProcedureFindingsText(e.target.value)}
                          placeholder="Edit procedure findings..."
                          rows={4}
                          className="text-xs resize-none"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={cancelProcedureFindings} className="text-xs h-7">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveProcedureFindings} className="text-xs h-7">
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  (() => {
                    // Check if findings is JSON (surgical markings)
                    try {
                      const markings = JSON.parse(report.procedureFindings.findings);
                      if (Array.isArray(markings) && markings.length > 0 && markings[0].type) {
                        return (
                          <div>
                            <p className="text-xs text-gray-600 mb-2">Surgical Procedure Diagram:</p>
                            <SurgicalDiagramDisplay markings={markings} />
                          </div>
                        );
                      }
                    } catch (e) {
                      // Not JSON, treat as regular text
                    }
                    
                    // Regular text findings
                    return (
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">
                        {formatMedicalText(report.procedureFindings.findings)}
                      </p>
                    );
                  })()
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Conclusion Section */}
        {report.conclusion && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black">CONCLUSION</h4>
                <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
                  {onEditConclusion && !editingConclusion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                      onClick={startEditingConclusion}
                    >
                      <Edit className="h-3 w-3 text-blue-600" />
                    </Button>
                  )}
                  {onRemoveConclusion && !editingConclusion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={onRemoveConclusion}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                {editingConclusion ? (
                  <div className="p-3 bg-blue-50 border-blue-200 border rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Conclusion</label>
                        <Textarea
                          value={conclusionText}
                          onChange={(e) => setConclusionText(e.target.value)}
                          placeholder="Edit conclusion..."
                          rows={4}
                          className="text-xs resize-none"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={cancelConclusion} className="text-xs h-7">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveConclusion} className="text-xs h-7">
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {formatMedicalText(report.conclusion)}
                  </p>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Follow-up Section */}
        {report.followUp?.enabled && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black">FOLLOW-UP</h4>
                <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
                  {onEditFollowUp && !editingFollowUp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                      onClick={() => startEditingFollowUp('options')}
                      title="Edit Follow-up"
                    >
                      <Edit className="h-3 w-3 text-blue-600" />
                    </Button>
                  )}
                  {onRemoveFollowUp && !editingFollowUp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={onRemoveFollowUp}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="group">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-xs mb-2">Recommended Follow-up:</h5>
                  {onEditFollowUp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditingFollowUp('options')}
                    >
                      <Edit className="h-2 w-2 text-blue-600" />
                    </Button>
                  )}
                </div>
                {editingFollowUp === 'options' ? (
                  <div className="p-3 bg-blue-50 border-blue-200 border rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Follow-up Options</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {['Barium Swallow', 'Barium Enema', 'Operation', 'CT Scan', 'MRI', 'Blood Tests', 'Repeat Endoscopy', 'Histology Results', 'Other'].map(option => (
                            <label key={option} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={Array.isArray(followUpValue) && followUpValue.includes(option)}
                                onChange={(e) => {
                                  const currentOptions = Array.isArray(followUpValue) ? followUpValue : [];
                                  if (e.target.checked) {
                                    setFollowUpValue([...currentOptions, option]);
                                  } else {
                                    setFollowUpValue(currentOptions.filter(o => o !== option));
                                  }
                                }}
                                className="text-xs"
                              />
                              <span className="text-xs">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={cancelFollowUp} className="text-xs h-7">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveFollowUp} className="text-xs h-7">
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {report.followUp.options.map((option, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {option === 'Other' && report.followUp?.other 
                          ? `Other: ${report.followUp.other}` 
                          : option}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {report.followUp.other && (
                <div className="group">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xs mb-2">Other Specification:</h5>
                    {onEditFollowUp && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                        onClick={() => startEditingFollowUp('other')}
                      >
                        <Edit className="h-2 w-2 text-blue-600" />
                      </Button>
                    )}
                  </div>
                  {editingFollowUp === 'other' ? (
                    <div className="p-3 bg-blue-50 border-blue-200 border rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Other Follow-up</label>
                          <Input
                            value={followUpValue}
                            onChange={(e) => setFollowUpValue(e.target.value)}
                            placeholder="Edit other follow-up specification..."
                            className="text-xs"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={cancelFollowUp} className="text-xs h-7">
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveFollowUp} className="text-xs h-7">
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700">{report.followUp.other}</p>
                  )}
                </div>
              )}
              {report.followUp.notes && (
                <div className="group">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xs mb-2">Instructions:</h5>
                    {onEditFollowUp && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100"
                        onClick={() => startEditingFollowUp('notes')}
                      >
                        <Edit className="h-2 w-2 text-blue-600" />
                      </Button>
                    )}
                  </div>
                  {editingFollowUp === 'notes' ? (
                    <div className="p-3 bg-blue-50 border-blue-200 border rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Follow-up Notes</label>
                          <Textarea
                            value={followUpValue}
                            onChange={(e) => setFollowUpValue(e.target.value)}
                            placeholder="Edit follow-up instructions..."
                            rows={3}
                            className="text-xs resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={cancelFollowUp} className="text-xs h-7">
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveFollowUp} className="text-xs h-7">
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">
                      {formatMedicalText(report.followUp.notes)}
                    </p>
                  )}
                </div>
              )}
              {report.followUp.postOperativeManagement && (
                <div className="group">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xs mb-2">Post Operative Management:</h5>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {formatMedicalText(report.followUp.postOperativeManagement)}
                  </p>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Findings Section - Dynamic based on procedure selection */}
        {(() => {
          const selectedProcedures = report.selectedProcedures || [];
          const hasAnyProcedure = selectedProcedures.length > 0;
          
          // Check for specific procedures
          const hasGastroscopyProcedure = selectedProcedures.some(proc => 
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
          
          const hasColonoscopyProcedure = selectedProcedures.some(proc => 
            proc === "Colonoscopy" || 
            proc === "Gastroscopy + Colonoscopy" ||
            proc.includes("Polypectomy") ||
            proc.includes("APC") ||
            proc.includes("EMR (Colon)") ||
            proc.includes("ESD (Colon)") ||
            proc.includes("Stricture Dilation (Colon)") ||
            proc.includes("Stent Placement (Colonic")
          );

          // If no procedures selected, show general findings
          if (!hasAnyProcedure) {
            const allFindings = [
              ...(report.gastroscopyFindings?.findings || []),
              ...(report.colonoscopyFindings?.findings || [])
            ];
            
            if (allFindings.length > 0 || report.gastroscopyFindings?.findings?.length > 0 || report.colonoscopyFindings?.findings?.length > 0) {
              return (
                <>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-black">DOCUMENTED FINDINGS</h4>
                    {/* Show gastroscopy findings if any */}
                    {report.gastroscopyFindings?.findings?.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Upper GI Findings:</h5>
                        {renderFindings(report.gastroscopyFindings, 'Gastroscopy')}
                      </div>
                    )}
                    {/* Show colonoscopy findings if any */}
                    {report.colonoscopyFindings?.findings?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Lower GI Findings:</h5>
                        {renderFindings(report.colonoscopyFindings, 'Colonoscopy')}
                      </div>
                    )}
                    {allFindings.length === 0 && (
                      <p className="text-muted-foreground text-xs">No findings documented yet. Mark findings on the anatomy diagrams to see them here.</p>
                    )}
                    
                    {/* Show Anatomy Diagrams with Markings */}
                    {gastroscopyImageData && (
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Gastroscopy Anatomy Diagram:</h5>
                        <div className="border rounded-lg p-2 bg-white">
                          <img 
                            src={gastroscopyImageData} 
                            alt="Gastroscopy anatomy with findings marked" 
                            className="max-w-full h-auto rounded"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {colonoscopyImageData && (
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Colonoscopy Anatomy Diagram:</h5>
                        <div className="border rounded-lg p-2 bg-white">
                          <img 
                            src={colonoscopyImageData} 
                            alt="Colonoscopy anatomy with findings marked" 
                            className="max-w-full h-auto rounded"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              );
            }
          } else {
            // Show procedure-specific findings sections
            return (
              <>
                {/* Gastroscopy Findings */}
                {hasGastroscopyProcedure && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-black">GASTROSCOPY FINDINGS</h4>
                      {report.gastroscopyFindings?.findings?.length > 0 ? (
                        renderFindings(report.gastroscopyFindings, 'Gastroscopy')
                      ) : (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-muted-foreground text-xs">No gastroscopy findings documented yet. Mark findings on the diagram to see them here.</p>
                        </div>
                      )}
                      
                      {/* Show Gastroscopy Anatomy Diagram */}
                      {gastroscopyImageData && (
                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-gray-600 mb-2">Anatomy Diagram:</h5>
                          <div className="border rounded-lg p-2 bg-white">
                            <img 
                              src={gastroscopyImageData} 
                              alt="Gastroscopy anatomy with findings marked" 
                              className="max-w-full h-auto rounded"
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Colonoscopy Findings */}
                {hasColonoscopyProcedure && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-black">COLONOSCOPY FINDINGS</h4>
                      {report.colonoscopyFindings?.findings?.length > 0 ? (
                        renderFindings(report.colonoscopyFindings, 'Colonoscopy')
                      ) : (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-muted-foreground text-xs">No colonoscopy findings documented yet. Mark findings on the diagram to see them here.</p>
                        </div>
                      )}
                      
                      {/* Show Colonoscopy Anatomy Diagram */}
                      {colonoscopyImageData && (
                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-gray-600 mb-2">Anatomy Diagram:</h5>
                          <div className="border rounded-lg p-2 bg-white">
                            <img 
                              src={colonoscopyImageData} 
                              alt="Colonoscopy anatomy with findings marked" 
                              className="max-w-full h-auto rounded"
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}
              </>
            );
          }
        })()}

        {/* Media */}
        {report.media.length > 0 && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-black">ATTACHED MEDIA</h4>
              <div className="grid grid-cols-2 gap-2">
                {report.media.map((item: any, index: number) => (
                  <div key={index} className="p-2 border rounded text-xs text-center">
                    {item.type?.includes('image') ? '📷' : '🎥'} {item.name || `File ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Rectal Cancer Surgery Report */}
        {report.rectalCancer && currentTab === "rectal" && (
          Object.values(report.rectalCancer).some(section => 
            Object.values(section || {}).some(value => 
              Array.isArray(value) ? value.length > 0 : value
            )
          )
        ) && (
          <>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-black">COLORECTAL CANCER SURGERY - OPERATIVE REPORT</h4>
              
              {/* Section I: Basic Data & Preoperative Assessment */}
              {(report.rectalCancer.section1.surgeon || 
                report.rectalCancer.section1.assistant1 || 
                report.rectalCancer.section1.anaesthetist ||
                report.rectalCancer.section1.asaScore ||
                report.rectalCancer.section1.tClassification ||
                report.rectalCancer.section1.tumorDistance) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-800">SECTION I: BASIC DATA & PREOPERATIVE ASSESSMENT</h5>
                  
                  {/* Preoperative Information */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Preoperative Information</h6>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {report.rectalCancer.section1.surgeon && (
                        <div><span className="font-medium">Surgeon:</span> {report.rectalCancer.section1.surgeon}</div>
                      )}
                      {report.rectalCancer.section1.assistant1 && (
                        <div><span className="font-medium">Assistant 1:</span> {report.rectalCancer.section1.assistant1}</div>
                      )}
                      {report.rectalCancer.section1.assistant2 && (
                        <div><span className="font-medium">Assistant 2:</span> {report.rectalCancer.section1.assistant2}</div>
                      )}
                      {report.rectalCancer.section1.anaesthetist && (
                        <div><span className="font-medium">Anaesthetist:</span> {report.rectalCancer.section1.anaesthetist}</div>
                      )}
                      {report.rectalCancer.section1.duration && (
                        <div><span className="font-medium">Duration (min):</span> {report.rectalCancer.section1.duration}</div>
                      )}
                      {report.rectalCancer.section1.asaScore && (
                        <div><span className="font-medium">ASA Score:</span> {report.rectalCancer.section1.asaScore}</div>
                      )}
                      {report.rectalCancer.section1.emergencyOperation && (
                        <div><span className="font-medium">Emergency Operation:</span> {report.rectalCancer.section1.emergencyOperation}</div>
                      )}
                      {report.rectalCancer.section1.preoperativeChemoRadio && (
                        <div><span className="font-medium">Pre-operative Chemo/Radiotherapy:</span> {report.rectalCancer.section1.preoperativeChemoRadio}</div>
                      )}
                      {report.rectalCancer.section1.previousAbdominalSurgery && (
                        <div><span className="font-medium">Previous Abdominal Surgery:</span> {report.rectalCancer.section1.previousAbdominalSurgery}</div>
                      )}
                    </div>
                  </div>

                  {/* Tumor Classification */}
                  {(report.rectalCancer.section1.tClassification || 
                    report.rectalCancer.section1.nClassification || 
                    report.rectalCancer.section1.mClassification) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Pre-operative Tumor Classification</h6>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {report.rectalCancer.section1.tClassification && (
                          <div><span className="font-medium">T:</span> {report.rectalCancer.section1.tClassification}</div>
                        )}
                        {report.rectalCancer.section1.nClassification && (
                          <div><span className="font-medium">N:</span> {report.rectalCancer.section1.nClassification}</div>
                        )}
                        {report.rectalCancer.section1.mClassification && (
                          <div><span className="font-medium">M:</span> {report.rectalCancer.section1.mClassification}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tumor Assessment */}
                  {(report.rectalCancer.section1.tumorDistance || report.rectalCancer.section1.tumorHeight) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Pre-operative Staging and Assessment</h6>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {report.rectalCancer.section1.tumorDistance && (
                          <div><span className="font-medium">Distance from anal verge:</span> {report.rectalCancer.section1.tumorDistance} cm</div>
                        )}
                        {report.rectalCancer.section1.tumorHeight && (
                          <div><span className="font-medium">Tumor height:</span> {report.rectalCancer.section1.tumorHeight}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Section II: Surgical Approach */}
              {(report.rectalCancer.section2.approach?.length > 0 || 
                report.rectalCancer.section2.conversionReason?.length > 0 ||
                report.rectalCancer.section2.complications?.length > 0) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-800">SECTION II: SURGICAL APPROACH</h5>
                  
                  {report.rectalCancer.section2.approach?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Approach</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section2.approach.map((approach: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{approach}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.rectalCancer.section2.conversionReason?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Reason for Conversion</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section2.conversionReason.map((reason: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{reason}</Badge>
                        ))}
                      </div>
                      {report.rectalCancer.section2.conversionOther && (
                        <p className="text-xs mt-2"><span className="font-medium">Other:</span> {report.rectalCancer.section2.conversionOther}</p>
                      )}
                    </div>
                  )}

                  {report.rectalCancer.section2.complications?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Intraoperative Complications</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section2.complications.map((complication: string, index: number) => (
                          <Badge key={index} variant="destructive" className="text-xs">{complication}</Badge>
                        ))}
                      </div>
                      {report.rectalCancer.section2.complicationDetails && (
                        <p className="text-xs mt-2"><span className="font-medium">Details:</span> {report.rectalCancer.section2.complicationDetails}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section III: Mobilization and Resection */}
              {(report.rectalCancer.section3.resectionType?.length > 0 || 
                report.rectalCancer.section3.proximalMargin ||
                report.rectalCancer.section3.tmeQuality) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-800">SECTION III: MOBILIZATION AND RESECTION</h5>
                  
                  {report.rectalCancer.section3.resectionType?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Type of Resection</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section3.resectionType.map((type: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                      {report.rectalCancer.section3.resectionOther && (
                        <p className="text-xs mt-2"><span className="font-medium">Other:</span> {report.rectalCancer.section3.resectionOther}</p>
                      )}
                    </div>
                  )}

                  {(report.rectalCancer.section3.proximalMargin || report.rectalCancer.section3.distalMargin) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Extent of Resection</h6>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {report.rectalCancer.section3.proximalMargin && (
                          <div><span className="font-medium">Proximal margin:</span> {report.rectalCancer.section3.proximalMargin} cm</div>
                        )}
                        {report.rectalCancer.section3.distalMargin && (
                          <div><span className="font-medium">Distal margin:</span> {report.rectalCancer.section3.distalMargin} cm</div>
                        )}
                      </div>
                    </div>
                  )}

                  {report.rectalCancer.section3.tmeQuality && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">TME Quality</h6>
                      <p className="text-xs">{report.rectalCancer.section3.tmeQuality}</p>
                    </div>
                  )}

                  {report.rectalCancer.section3.lymphNodeDissection && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Lymph Node Dissection</h6>
                      <p className="text-xs">{report.rectalCancer.section3.lymphNodeDissection}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Section IV: Reconstruction */}
              {(report.rectalCancer.section4.anastomosisType?.length > 0 || 
                report.rectalCancer.section4.stomaType?.length > 0) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-800">SECTION IV: RECONSTRUCTION</h5>
                  
                  {report.rectalCancer.section4.anastomosisType?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Type of Anastomosis</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section4.anastomosisType.map((type: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.rectalCancer.section4.anastomosisTechnique?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Technique of Anastomosis</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section4.anastomosisTechnique.map((technique: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{technique}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.rectalCancer.section4.stomaType?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Diverting Stoma</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section4.stomaType.map((type: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.rectalCancer.section4.stomaReason?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Reason for Stoma</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section4.stomaReason.map((reason: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{reason}</Badge>
                        ))}
                      </div>
                      {report.rectalCancer.section4.stomaReasonOther && (
                        <p className="text-xs mt-2"><span className="font-medium">Other:</span> {report.rectalCancer.section4.stomaReasonOther}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section V: Operative Events & Closure */}
              {(report.rectalCancer.section5.operativeTime || 
                report.rectalCancer.section5.bloodLoss ||
                report.rectalCancer.section5.additionalProcedures?.length > 0 ||
                report.rectalCancer.section5.fascialClosure?.length > 0) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-800">SECTION V: OPERATIVE EVENTS & CLOSURE</h5>
                  
                  {(report.rectalCancer.section5.operativeTime || 
                    report.rectalCancer.section5.bloodLoss || 
                    report.rectalCancer.section5.transfusionRequired) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Operative Times and Blood Loss</h6>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {report.rectalCancer.section5.operativeTime && (
                          <div><span className="font-medium">Operative time:</span> {report.rectalCancer.section5.operativeTime} min</div>
                        )}
                        {report.rectalCancer.section5.bloodLoss && (
                          <div><span className="font-medium">Blood loss:</span> {report.rectalCancer.section5.bloodLoss} mL</div>
                        )}
                        {report.rectalCancer.section5.transfusionRequired && (
                          <div><span className="font-medium">Transfusion:</span> {report.rectalCancer.section5.transfusionRequired}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {report.rectalCancer.section5.additionalProcedures?.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Additional Procedures</h6>
                      <div className="flex flex-wrap gap-1">
                        {report.rectalCancer.section5.additionalProcedures.map((procedure: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{procedure}</Badge>
                        ))}
                      </div>
                      {report.rectalCancer.section5.additionalProceduresOther && (
                        <p className="text-xs mt-2"><span className="font-medium">Other:</span> {report.rectalCancer.section5.additionalProceduresOther}</p>
                      )}
                    </div>
                  )}

                  {(report.rectalCancer.section5.fascialClosure?.length > 0 || report.rectalCancer.section5.sutureMaterial) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Closure Details</h6>
                      {report.rectalCancer.section5.fascialClosure?.length > 0 && (
                        <div className="mb-2">
                          <span className="font-medium text-xs">Fascial closure:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {report.rectalCancer.section5.fascialClosure.map((closure: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">{closure}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {report.rectalCancer.section5.sutureMaterial && (
                        <div className="text-xs"><span className="font-medium">Suture material:</span> {report.rectalCancer.section5.sutureMaterial}</div>
                      )}
                    </div>
                  )}

                  {(report.rectalCancer.section5.surgeonSignature || report.rectalCancer.section5.date) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Surgeon Details</h6>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {report.rectalCancer.section5.surgeonSignature && (
                          <div><span className="font-medium">Surgeon signature:</span> {report.rectalCancer.section5.surgeonSignature}</div>
                        )}
                        {report.rectalCancer.section5.date && (
                          <div><span className="font-medium">Date:</span> {formatDate(report.rectalCancer.section5.date)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Appendectomy Live Report - Simple Format like Procedures */}
        {currentTab === "appendectomy" && report.appendectomy && (
          (() => {
            const { appendectomy } = report;
            
            // Check if we have any appendectomy data to show
            const hasData = (
              appendectomy.preoperative.indication.length > 0 ||
              appendectomy.intraoperative.appendixAppearance.length > 0 ||
              appendectomy.patientInfo.name ||
              appendectomy.preoperative.surgeon ||
              appendectomy.intraoperative.abscess ||
              appendectomy.intraoperative.peritonitis.length > 0 ||
              appendectomy.intraoperative.otherFindings ||
              appendectomy.procedure.approach.length > 0 ||
              appendectomy.procedure.incisionType.length > 0 ||
              appendectomy.procedure.trocarPlacement ||
              appendectomy.procedure.divisionMethod.length > 0 ||
              appendectomy.procedure.mesenteryControl.length > 0 ||
              appendectomy.procedure.lavage ||
              appendectomy.procedure.drainPlacement ||
              appendectomy.closure.fascialClosure ||
              appendectomy.closure.skinClosure.length > 0 ||
              appendectomy.patientInfo.age ||
              appendectomy.patientInfo.sex ||
              appendectomy.patientInfo.bmi ||
              appendectomy.preoperative.assistant1 ||
              appendectomy.preoperative.anaesthetist ||
              appendectomy.patientInfo.asaScore.length > 0 ||
              appendectomy.closure.complications ||
              appendectomy.closure.pathology ||
              appendectomy.closure.otherSpecimens ||
              appendectomy.closure.surgeonSignature ||
              appendectomy.closure.dateTime
            );
            
            if (!hasData) {
              return (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">Start filling out the appendectomy form to see findings appear here.</p>
                </div>
              );
            }
            
            return (
              <>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-black">APPENDECTOMY FINDINGS</h4>
                  
                  {/* Patient Info */}
                  {(appendectomy.patientInfo.name || appendectomy.patientInfo.age || appendectomy.patientInfo.sex || appendectomy.patientInfo.weight || appendectomy.patientInfo.height || appendectomy.patientInfo.bmi || appendectomy.patientInfo.asaScore.length > 0) && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Patient Information</h5>
                      <p className="text-xs text-gray-700">
                        {appendectomy.patientInfo.name && <><span className="font-medium">Patient:</span> {appendectomy.patientInfo.name}</>}
                        {appendectomy.patientInfo.age && <>, Age: {appendectomy.patientInfo.age}</>}
                        {appendectomy.patientInfo.sex && <>, Sex: {appendectomy.patientInfo.sex}</>}
                        {appendectomy.patientInfo.weight && <>, Weight: {appendectomy.patientInfo.weight}</>}
                        {appendectomy.patientInfo.height && <>, Height: {appendectomy.patientInfo.height}</>}
                        {appendectomy.patientInfo.bmi && <>, BMI: {appendectomy.patientInfo.bmi}</>}
                      </p>
                      {appendectomy.patientInfo.asaScore.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs font-medium text-gray-600">ASA Score:</span>
                          {appendectomy.patientInfo.asaScore.map((score, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              ASA {score}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Surgeon Info */}
                  {(appendectomy.preoperative.surgeon || appendectomy.preoperative.assistant1 || appendectomy.preoperative.anaesthetist || appendectomy.preoperative.duration) && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
                      {appendectomy.preoperative.surgeon && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Surgeon:</span> {appendectomy.preoperative.surgeon}
                        </p>
                      )}
                      {appendectomy.preoperative.assistant1 && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Assistant:</span> {appendectomy.preoperative.assistant1}
                        </p>
                      )}
                      {appendectomy.preoperative.anaesthetist && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Anaesthetist:</span> {appendectomy.preoperative.anaesthetist}
                        </p>
                      )}
                      {appendectomy.preoperative.duration && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Duration:</span> {appendectomy.preoperative.duration} min
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Indication for Surgery */}
                  {appendectomy.preoperative.indication.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Indication for Surgery</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.preoperative.indication.map((indication, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {indication === 'Other' && appendectomy.preoperative.indicationOther 
                              ? `Other: ${appendectomy.preoperative.indicationOther}` 
                              : indication}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Appendix Appearance */}
                  {appendectomy.intraoperative.appendixAppearance.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Appendix Appearance</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.intraoperative.appendixAppearance.map((appearance, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {appearance}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Preoperative Imaging */}
                  {appendectomy.preoperative.imaging.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Preoperative Imaging</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.preoperative.imaging.map((imaging, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {imaging === 'Other' && appendectomy.preoperative.imagingOther 
                              ? `Other: ${appendectomy.preoperative.imagingOther}` 
                              : imaging}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Presence of Abscess */}
                  {appendectomy.intraoperative.abscess && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Presence of Abscess</h5>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Abscess:</span> {appendectomy.intraoperative.abscess}
                      </p>
                    </div>
                  )}
                  
                  {/* Presence of Peritonitis */}
                  {appendectomy.intraoperative.peritonitis.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Presence of Peritonitis</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.intraoperative.peritonitis.map((peritonitis, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {peritonitis}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Other Intra-abdominal Findings */}
                  {appendectomy.intraoperative.otherFindings && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Other Intra-abdominal Findings</h5>
                      <p className="text-xs text-gray-700">
                        {appendectomy.intraoperative.otherFindings}
                      </p>
                    </div>
                  )}
                  
                  {/* Surgical Approach */}
                  {appendectomy.procedure.approach.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Surgical Approach</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.procedure.approach.map((approach, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {approach}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Incision Type */}
                  {appendectomy.procedure.incisionType.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Incision Type</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.procedure.incisionType.map((incision, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {incision === 'Other' && appendectomy.procedure.incisionOther 
                              ? `Other: ${appendectomy.procedure.incisionOther}` 
                              : incision}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Trocar Placement */}
                  {appendectomy.procedure.trocarPlacement && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Trocar Placement</h5>
                      <p className="text-xs text-gray-700">
                        {appendectomy.procedure.trocarPlacement}
                      </p>
                    </div>
                  )}
                  
                  {/* Method of Appendiceal Division */}
                  {appendectomy.procedure.divisionMethod.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Method of Appendiceal Division</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.procedure.divisionMethod.map((method, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {method === 'Other' && appendectomy.procedure.divisionOther 
                              ? `Other: ${appendectomy.procedure.divisionOther}` 
                              : method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Mesentery Control */}
                  {appendectomy.procedure.mesenteryControl.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Mesentery Control</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.procedure.mesenteryControl.map((control, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {control === 'Other' && appendectomy.procedure.mesenteryOther 
                              ? `Other: ${appendectomy.procedure.mesenteryOther}` 
                              : control}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Peritoneal Lavage */}
                  {appendectomy.procedure.lavage && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Peritoneal Lavage</h5>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Lavage:</span> {appendectomy.procedure.lavage}
                      </p>
                    </div>
                  )}
                  
                  {/* Drain Placement */}
                  {appendectomy.procedure.drainPlacement && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Drain Placement</h5>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Drain:</span> {appendectomy.procedure.drainPlacement}
                        {appendectomy.procedure.drainLocation && ` (Location: ${appendectomy.procedure.drainLocation})`}
                      </p>
                    </div>
                  )}
                  
                  {/* Fascial Closure */}
                  {appendectomy.closure.fascialClosure && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Fascial Closure</h5>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Fascial Closure:</span> {appendectomy.closure.fascialClosure}
                      </p>
                    </div>
                  )}
                  
                  {/* Skin Closure */}
                  {appendectomy.closure.skinClosure.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Skin Closure</h5>
                      <div className="flex flex-wrap gap-1">
                        {appendectomy.closure.skinClosure.map((closure, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {closure === 'other' && appendectomy.closure.skinOther 
                              ? `Other: ${appendectomy.closure.skinOther}` 
                              : closure}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Intraoperative Complications */}
                  {appendectomy.closure.complications && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Intraoperative Complications</h5>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Complications:</span> {appendectomy.closure.complications}
                        {appendectomy.closure.complicationDetails && ` - ${appendectomy.closure.complicationDetails}`}
                      </p>
                    </div>
                  )}
                  
                  {/* Pathology */}
                  {appendectomy.closure.pathology && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Specimen Information</h5>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Appendix Sent for Pathology:</span> {appendectomy.closure.pathology}
                      </p>
                      {appendectomy.closure.otherSpecimens && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Other Specimens:</span> {appendectomy.closure.otherSpecimens}
                          {appendectomy.closure.specimenDetails && ` - ${appendectomy.closure.specimenDetails}`}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Surgeon Signature */}
                  {(appendectomy.closure.surgeonSignature || appendectomy.closure.dateTime) && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600">Documentation</h5>
                      {appendectomy.closure.surgeonSignature && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Surgeon's Signature:</span> {appendectomy.closure.surgeonSignature}
                        </p>
                      )}
                      {appendectomy.closure.dateTime && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Date/Time:</span> {appendectomy.closure.dateTime}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Separator />
              </>
            );
          })()
        )}

        {/* Surgeon Signature Section */}
        {(report.signature?.surgeonSignature || report.signature?.surgeonSignatureText || report.signature?.dateTime) && (
          <>
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-600">Documentation</h5>
              {report.signature.surgeonSignatureText && (
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Surgeon's Signature:</span> {report.signature.surgeonSignatureText}
                </p>
              )}
              {!report.signature.surgeonSignatureText && report.signature.surgeonSignature && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-700 font-medium">Surgeon's Signature:</p>
                  {report.signature.surgeonSignature.startsWith('data:image') ? (
                    <img 
                      src={report.signature.surgeonSignature} 
                      alt="Surgeon signature" 
                      className="max-h-8 max-w-32 object-contain border rounded bg-gray-50"
                    />
                  ) : (
                    <p className="text-xs text-gray-700">{report.signature.surgeonSignature}</p>
                  )}
                </div>
              )}
              {report.signature.dateTime && (
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Date/Time:</span> {report.signature.dateTime}
                </p>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Dr. Monde Mjoli - Specialist Surgeon</p>
          <p>Practice Number: 0560812</p>
          <p>Date of Report: {formatDateTime()}</p>
        </div>
    </div>
  );
};
