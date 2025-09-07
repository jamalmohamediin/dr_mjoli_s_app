import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Circle, Undo2, Redo2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "./DocumentUpload";
import gastroscopyAnatomy from "@/assets/gastroscopy-anatomy.jpg";
import colonoscopyAnatomy from "@/assets/colonoscopy-anatomy.jpg";
import html2canvas from 'html2canvas';
import { toast } from "sonner";

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: Date;
}

interface AnatomyDiagramProps {
  type: "gastroscopy" | "colonoscopy";
  onUpdate: (data: { findings: Finding[]; documents?: UploadedDocument[]; canvasImageData?: string }) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  containerRef?: React.RefObject<HTMLDivElement>;
  onMethodsReady?: (methods: { removeFinding: (id: string) => void; editFinding: (id: string) => void; undoLastAction: () => void; redoLastAction: () => void; canRedo: () => boolean }) => void;
}

interface Finding {
  id: string;
  x: number;
  y: number;
  type: string;
  description: string;
  location: string;
}

export const AnatomyDiagram = ({ type, onUpdate, canvasRef: externalCanvasRef, containerRef: externalContainerRef, onMethodsReady }: AnatomyDiagramProps) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const containerRef = externalContainerRef || internalContainerRef;
  const imageRef = useRef<HTMLImageElement>(null);
  const [drawingMode, setDrawingMode] = useState<'mark'>('mark');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsHistory, setFindingsHistory] = useState<Finding[][]>([[]]);
  const [redoHistory, setRedoHistory] = useState<Finding[][]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [showingDropdown, setShowingDropdown] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{x: number, y: number} | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [customLocation, setCustomLocation] = useState<string>('');
  const [customFinding, setCustomFinding] = useState<string>('');
  const [notSureDescription, setNotSureDescription] = useState<string>('');
  
  // Color mapping for different finding types - improved differentiation
  const findingTypeColors: Record<string, string> = {
    // Normal findings - green
    "Normal mucosa": "#16a34a",
    
    // Inflammatory/mild findings - yellow/orange spectrum
    "Erythema": "#f59e0b",        // Amber
    "Gastritis": "#f97316",       // Orange
    "Esophagitis": "#ea580c",     // Dark orange
    "Duodenitis": "#dc2626",      // Red-orange
    "Colitis": "#be123c",         // Rose red
    
    // Polyps/growths - distinct purple/violet spectrum
    "Polyp": "#7c3aed",           // Violet
    "Adenoma": "#c026d3",         // Fuchsia
    "Lipoma": "#ec4899",          // Pink
    
    // Serious findings - red spectrum
    "Ulceration": "#dc2626",      // Red
    "Mass": "#991b1b",            // Dark red
    "Bleeding": "#ef4444",        // Bright red
    "Carcinoid": "#7f1d1d",       // Very dark red
    
    // Structural issues - blue spectrum
    "Stricture": "#2563eb",       // Blue
    "Hiatal hernia": "#1d4ed8",   // Darker blue
    "Diverticulum": "#3730a3",    // Indigo
    
    // Special findings - teal/cyan spectrum
    "Barrett's esophagus": "#0891b2",  // Sky blue
    "H. pylori": "#059669",            // Emerald
    "Hemorrhoid": "#0d9488",           // Teal
    "Varices": "#0369a1",              // Light blue
    
    // Other findings - distinct colors
    "Melanosis coli": "#374151",       // Gray
    "Angiodysplasia": "#92400e",       // Brown
    "Gastritis / Duodenitis": "#fb923c", // Orange
    "Erosions": "#fbbf24",             // Yellow
    "Ischemic colitis": "#be123c",     // Rose red
    "Proctitis": "#ec4899",            // Pink
    "Anal fissure": "#dc2626",         // Red
    "Not sure": "#9333ea",             // Purple
    "Other": "#6b7280",                // Gray
    
    // Default color for any unmapped finding
    "default": "#6b7280"
  };
  
  const getFindingColor = (findingType: string): string => {
    return findingTypeColors[findingType] || findingTypeColors["default"];
  };

  // Helper function to save current state to history
  const saveToHistory = (currentFindings: Finding[]) => {
    setFindingsHistory(prev => {
      const newHistory = [...prev, currentFindings];
      // Keep only last 10 states to prevent memory issues
      return newHistory.slice(-10);
    });
    // Clear redo history when new action is made
    setRedoHistory([]);
  };

  // Helper function to capture canvas data and call onUpdate
  const updateWithCanvasData = (findings: Finding[], documents?: UploadedDocument[], skipHistory = false) => {
    // Call onUpdate immediately without canvas data first
    onUpdate({ findings, documents: documents || [] });
    
    // Then capture canvas data after a small delay to ensure rendering is complete
    setTimeout(async () => {
      let canvasImageData = '';
      
      if (containerRef.current) {
        try {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // DIRECT CANVAS CAPTURE - captures exactly what you see with all markings
              canvasImageData = canvas.toDataURL('image/png');
              console.log("🎯 Captured canvas DIRECTLY with all markings visible");
            }
          }
        } catch (error) {
          console.error('Error capturing container in AnatomyDiagram:', error);
        }
      }
      
      // Call onUpdate again with canvas data
      onUpdate({ findings, documents: documents || [], canvasImageData });
    }, 300); // Increased delay to ensure SVG rendering is complete
  };

  // Helper function to draw canvas without circles (for live report)
  const drawCanvasWithoutCircles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const image = imageRef.current;
    if (!image) return;
    
    // Clear and redraw the base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Don't draw any circles - just leave the clean diagram
    // The text labels and lines are drawn via HTML/CSS, not on the canvas
  };

  const anatomyImage = type === "gastroscopy" ? gastroscopyAnatomy : colonoscopyAnatomy;
  
  // Master list of all possible findings
  const masterFindingTypes = [
    "Normal mucosa", "Polyp", "Adenoma", "Diverticulum", "Hemorrhoid",
    "Ulceration", "Mass", "Stricture", "Colitis", "Bleeding", 
    "Melanosis coli", "Angiodysplasia", "Lipoma", "Carcinoid",
    "Esophagitis", "Varices", "Barrett's esophagus", "Gastritis / Duodenitis",
    "Erosions", "Ischemic colitis", "Proctitis", "Anal fissure", "Not sure", "Other"
  ];

  // Context-aware findings filtering based on anatomical location
  const getFindingsForRegion = (location: string, procedureType: string): string[] => {
    const baseFinding = ["Normal mucosa"]; // Always available
    const commonOptions = ["Not sure", "Other"]; // Always available
    
    if (procedureType === "gastroscopy") {
      // GASTROSCOPY FILTERING
      if (location.includes("esophagus") || location.includes("Esophagus") || location.includes("UES") || location.includes("LES") || location.includes("Cervical") || location.includes("Thoracic") || location.includes("Gastroesophageal")) {
        return [...baseFinding, "Esophagitis", "Varices", "Barrett's esophagus", "Ulceration", "Stricture", "Mass", "Polyp", "Adenoma", "Bleeding", "Carcinoid", "Angiodysplasia", "Erosions", ...commonOptions];
      }
      if (location.includes("Cardia") || location.includes("Fundus") || location.includes("Body") || location.includes("corpus") || location.includes("Angular") || location.includes("Antrum") || location.includes("Pylorus")) {
        return [...baseFinding, "Gastritis / Duodenitis", "Erosions", "Ulceration", "Polyp", "Adenoma", "Mass", "Bleeding", "Stricture", "Angiodysplasia", "Carcinoid", "Varices", ...commonOptions];
      }
      if (location.includes("Duodenal") || location.includes("duodenum") || location.includes("papilla") || location.includes("part")) {
        return [...baseFinding, "Gastritis / Duodenitis", "Erosions", "Ulceration", "Polyp", "Mass", "Bleeding", "Adenoma", "Carcinoid", ...commonOptions];
      }
      if (location.includes("Oropharynx")) {
        return [...baseFinding, "Ulceration", "Mass", "Bleeding", "Erosions", ...commonOptions];
      }
    } else if (procedureType === "colonoscopy") {
      // COLONOSCOPY FILTERING
      if (location.includes("Cecum") || location.includes("Ascending") || location.includes("Hepatic") || location.includes("Transverse") || location.includes("Splenic") || location.includes("Descending") || location.includes("Sigmoid")) {
        return [...baseFinding, "Polyp", "Adenoma", "Diverticulum", "Ulceration", "Mass", "Stricture", "Colitis", "Ischemic colitis", "Bleeding", "Lipoma", "Angiodysplasia", "Carcinoid", "Erosions", ...commonOptions];
      }
      if (location.includes("Terminal ileum") || location.includes("Ileocecal")) {
        return [...baseFinding, "Polyp", "Adenoma", "Ulceration", "Mass", "Stricture", "Bleeding", "Carcinoid", "Erosions", ...commonOptions];
      }
      if (location.includes("Rectum") || location.includes("Rectosigmoid")) {
        return [...baseFinding, "Hemorrhoid", "Proctitis", "Ulceration", "Mass", "Polyp", "Adenoma", "Bleeding", "Colitis", "Carcinoid", "Angiodysplasia", "Erosions", ...commonOptions];
      }
      if (location.includes("Anal") || location.includes("Dentate")) {
        return [...baseFinding, "Hemorrhoid", "Anal fissure", "Ulceration", "Bleeding", "Mass", ...commonOptions];
      }
    }
    
    // Default fallback - return all findings
    return masterFindingTypes;
  };

  // Get filtered findings based on selected location
  const getAvailableFindings = (): string[] => {
    if (selectedLocations.length === 0) {
      return masterFindingTypes; // Show all if no location selected
    }
    
    // Get findings for the selected location
    const selectedLocation = selectedLocations[0]; // We only allow one location
    return getFindingsForRegion(selectedLocation, type);
  };

  const findingTypes = getAvailableFindings();

  const locationGroups = type === "gastroscopy"
    ? {
        "Oropharynx & Esophagus": [
          "Oropharynx",
          "Upper esophageal sphincter (UES)",
          "Cervical esophagus",
          "Thoracic esophagus",
          "Lower esophageal sphincter (LES)",
          "Gastroesophageal junction (Z-line)"
        ],
        "Stomach": [
          "Cardia",
          "Fundus",
          "Body (corpus)",
          "Angular incisure",
          "Antrum",
          "Pylorus"
        ],
        "Duodenum": [
          "Duodenal bulb (first part)",
          "Second part of duodenum",
          "Major papilla (ampulla of Vater)",
          "Minor papilla"
        ]
      }
    : {
        "Terminal Ileum": [
          "Ileocecal valve",
          "Terminal ileum"
        ],
        "Colon": [
          "Cecum (with appendiceal orifice, ileocecal valve)",
          "Ascending colon",
          "Hepatic flexure",
          "Transverse colon",
          "Splenic flexure",
          "Descending colon",
          "Sigmoid colon"
        ],
        "Rectum & Anus": [
          "Rectum (upper, middle, lower thirds)",
          "Rectosigmoid junction",
          "Anal canal",
          "Dentate line"
        ]
      };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    
    // Update canvas rect for external labels
    updateCanvasRect();
    
    // Draw findings as colored circular marks
    let findingNumber = 1;
    findings.forEach((finding) => {
      const isTemporary = finding.id.startsWith('temp_');
      const isPending = finding.type === 'Pending';
      
      if (isTemporary || isPending) {
        // Temporary/pending finding - bright yellow circle with dashed border
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(finding.x, finding.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Dashed border
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add question mark for pending
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', finding.x, finding.y);
      } else {
        // Get the color for this finding type
        const markColor = getFindingColor(finding.type);
        
        // Check if this is a "Not sure" finding
        const isNotSure = finding.type.includes("Not sure");
        
        // Draw colored circular mark
        ctx.fillStyle = markColor;
        ctx.beginPath();
        ctx.arc(finding.x, finding.y, 13, 0, 2 * Math.PI);
        ctx.fill();
        
        // White border for visibility
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw content inside the mark
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isNotSure) {
          // Draw question mark for "Not sure" findings
          ctx.fillText('?', finding.x, finding.y - 5);
        } else {
          // Draw finding number for regular findings
          ctx.fillText(findingNumber.toString(), finding.x, finding.y - 5);
          findingNumber++;
        }
      }
    });
  }, [findings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      
      // Update canvas rect for external labels
      updateCanvasRect();
      
      // Draw findings as colored circular marks
      let findingNumber = 1;
      findings.forEach((finding) => {
        const isTemporary = finding.id.startsWith('temp_');
        const isPending = finding.type === 'Pending';
        
        if (isTemporary || isPending) {
          // Temporary/pending finding - bright yellow circle with dashed border
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(finding.x, finding.y, 12, 0, 2 * Math.PI);
          ctx.fill();
          
          // Dashed border
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Add question mark for pending
          ctx.fillStyle = '#92400e';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', finding.x, finding.y);
        } else {
          // Get the color for this finding type
          const markColor = getFindingColor(finding.type);
          
          // Check if this is a "Not sure" finding
          const isNotSure = finding.type.includes("Not sure");
          
          // Draw colored circular mark
          ctx.fillStyle = markColor;
          ctx.beginPath();
          ctx.arc(finding.x, finding.y, 13, 0, 2 * Math.PI);
          ctx.fill();
          
          // White border for visibility
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw content inside the mark
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (isNotSure) {
            // Draw question mark for "Not sure" findings
            ctx.fillText('?', finding.x, finding.y - 5);
          } else {
            // Draw finding number for regular findings
            ctx.fillText(findingNumber.toString(), finding.x, finding.y - 5);
            findingNumber++;
          }
        }
      });
    };

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawCanvas();
    };

    // If image is already loaded, draw immediately
    if (image.complete && image.naturalHeight !== 0) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawCanvas();
    } else {
      image.src = anatomyImage;
    }
  }, [anatomyImage, findings]);

  // Separate effect to force immediate redraw on findings change (for undo)
  useEffect(() => {
    redrawCanvas();
  }, [findings, redrawCanvas]);

  // Handle window resize to update canvas rect
  useEffect(() => {
    const handleResize = () => {
      setTimeout(updateCanvasRect, 100); // Small delay to ensure DOM updates
    };

    window.addEventListener('resize', handleResize);
    // Initial setup
    setTimeout(updateCanvasRect, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [findings]); // Re-run when findings change

  const updateCanvasRect = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCanvasRect(rect);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'mark') {
      const coords = getCanvasCoordinates(e);
      
      // Clear any previous selections when starting a new finding
      setSelectedLocations([]);
      setSelectedFindings([]);
      setCustomLocation('');
      setCustomFinding('');
      
      // Immediately create a temporary finding mark
      const tempFinding: Finding = {
        id: `temp_${Date.now()}`,
        x: coords.x,
        y: coords.y,
        type: 'Pending',
        location: 'To be specified',
        description: 'Click to add details'
      };
      
      setFindings(prev => [...prev, tempFinding]);
      setPendingPosition(coords);
      setShowingDropdown(true);
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'mark') {
      handleCanvasClick(e);
    }
  };
  
  const handleMouseUp = () => {
    // No longer needed for drawing
  };

  const addFinding = (types: string[], locations: string[], description: string) => {
    if (!pendingPosition) return;
    
    // Save current state to history before adding new finding
    saveToHistory([...findings]);
    
    // Process locations with custom location
    const processedLocations = locations.map(loc => {
      if (loc === "Other" && customLocation.trim()) {
        return customLocation.trim();
      }
      return loc;
    }).filter(loc => loc !== "Other" || customLocation.trim());
    
    // Process findings with custom finding
    const processedFindings = types.map(finding => {
      if (finding === "Other" && customFinding.trim()) {
        return customFinding.trim();
      }
      return finding;
    }).filter(finding => {
      if (finding === "Other") return customFinding.trim();
      return true;
    });
    
    const newFinding: Finding = {
      id: Date.now().toString(),
      x: pendingPosition.x,
      y: pendingPosition.y,
      type: processedFindings.join(", "),
      location: processedLocations.join(", "),
      description
    };
    
    // Remove any temporary findings and add the new one
    const filteredFindings = findings.filter(f => !f.id.startsWith('temp_'));
    const allFindings = [...filteredFindings, newFinding];
    
    setFindings(allFindings);
    setPendingPosition(null);
    setShowingDropdown(false);
    
    // Clear selections for next use
    setSelectedLocations([]);
    setSelectedFindings([]);
    setCustomLocation('');
    setCustomFinding('');
    
    updateWithCanvasData(allFindings, documents, true); // Skip history since we already saved it
  };
  
  const cancelFinding = () => {
    // Remove any temporary findings
    const newFindings = findings.filter(f => !f.id.startsWith('temp_'));
    setFindings(newFindings);
    setPendingPosition(null);
    setShowingDropdown(false);
    
    // Clear selections for next use
    setSelectedLocations([]);
    setSelectedFindings([]);
    setCustomLocation('');
    setCustomFinding('');
  };

  const removeFinding = (id: string) => {
    // Save current state to history before removing finding
    saveToHistory([...findings]);
    
    const newFindings = findings.filter(f => f.id !== id);
    setFindings(newFindings);
    updateWithCanvasData(newFindings, documents, true); // Skip history since we already saved it
  };

  const undoLastAction = () => {
    if (findingsHistory.length === 0) return;
    
    // Save current state to redo history before undoing
    setRedoHistory(prev => [...prev, [...findings]]);
    
    // Get the previous state from history (the last entry in the history)
    const previousState = findingsHistory[findingsHistory.length - 1];
    
    // Remove the last history entry
    setFindingsHistory(prev => prev.slice(0, -1));
    
    // Restore the previous state
    setFindings(previousState);
    
    updateWithCanvasData(previousState, documents, true); // Skip saving to history
  };

  const redoLastAction = () => {
    if (redoHistory.length === 0) return;
    
    // Save current state to undo history before redoing
    setFindingsHistory(prev => [...prev, [...findings]]);
    
    // Get the most recent redo state
    const redoState = redoHistory[redoHistory.length - 1];
    
    // Remove it from redo history
    setRedoHistory(prev => prev.slice(0, -1));
    
    // Restore the redo state
    setFindings(redoState);
    
    updateWithCanvasData(redoState, documents, true); // Skip saving to history
  };

  const handleDocumentUpdate = (newDocuments: UploadedDocument[]) => {
    setDocuments(newDocuments);
    updateWithCanvasData(findings, newDocuments);
  };

  // Add an edit finding function (for now, it will show the finding details in console)
  const editFinding = (id: string) => {
    const finding = findings.find(f => f.id === id);
    if (finding) {
      console.log(`Edit finding:`, finding);
      // For now, just show the finding dialog - in the future this could open an edit modal
      toast.info(`Edit functionality for "${finding.type}" coming soon!`);
    }
  };

  // Expose methods to parent component
  useEffect(() => {
    if (onMethodsReady) {
      onMethodsReady({
        removeFinding,
        editFinding,
        undoLastAction,
        redoLastAction,
        canRedo: () => redoHistory.length > 0
      });
    }
  }, [onMethodsReady]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-black">
            {type === "gastroscopy" ? "Gastroscopy" : "Colonoscopy"} Findings
          </h3>
          
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={() => setDrawingMode('mark')}
              className="text-xs"
            >
              <Circle className="h-3 w-3 mr-1" />
              Mark Findings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={undoLastAction}
              disabled={findingsHistory.length === 0}
              className="hover:bg-gray-50 text-xs"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redoLastAction}
              disabled={redoHistory.length === 0}
              className="hover:bg-gray-50 text-xs"
            >
              <Redo2 className="h-3 w-3 mr-1" />
              Redo
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="relative border rounded-lg overflow-visible bg-white mx-auto" style={{ maxWidth: 'fit-content' }}>
          <img 
            ref={imageRef}
            src={anatomyImage}
            alt={`${type} anatomy`}
            className="hidden"
          />
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full h-auto select-none"
            style={{ 
              maxHeight: '400px',
              cursor: 'pointer'
            }}
          />

          {/* Labels positioned within diagram border */}
          {canvasRect && findings.filter(f => !f.id.startsWith('temp_') && f.type !== 'Pending').length > 0 && (
            <>
              {/* SVG for connecting lines */}
              <svg 
                className="absolute top-0 left-0 pointer-events-none"
                style={{ 
                  width: '100%', 
                  height: '100%'
                }}
              >
                {findings
                  .filter(f => !f.id.startsWith('temp_') && f.type !== 'Pending')
                  .map((finding, index) => {
                    const findingNumber = index + 1;
                    const canvas = canvasRef.current;
                    if (!canvas || !canvasRect) return null;

                    // Calculate actual position on rendered canvas
                    const scaleX = canvasRect.width / canvas.width;
                    const scaleY = canvasRect.height / canvas.height;
                    const markX = finding.x * scaleX;
                    const markY = finding.y * scaleY;

                    // Anatomically correct positioning based on selected locations
                    const margin = 15;
                    const labelWidth = 160;
                    const labelHeight = 35;
                    
                    let labelX, labelY;
                    let positioning = 'center';
                    
                    // Get anatomical positioning based on location and procedure type
                    const getAnatomicalPosition = (location: string, procedureType: string) => {
                      if (procedureType === 'gastroscopy') {
                        // GASTROSCOPY - Patient's left = screen right, Patient's right = screen left
                        if (location.includes('Oropharynx')) return 'patient-right-top'; // Screen left, top
                        if (location.includes('esophagus') || location.includes('Esophagus')) return 'patient-right-top'; // Screen left, top
                        if (location.includes('Cardia') || location.includes('Fundus')) return 'patient-left'; // Screen right
                        if (location.includes('Body') || location.includes('corpus')) return 'center';
                        if (location.includes('Antrum')) return 'center-bottom';
                        if (location.includes('Pylorus')) return 'patient-right'; // Screen left
                        if (location.includes('Duodenal bulb') || location.includes('first part')) return 'patient-right'; // Screen left
                        if (location.includes('Second part') || location.includes('papilla')) return 'patient-right'; // Screen left
                      } else if (procedureType === 'colonoscopy') {
                        // COLONOSCOPY - Patient's left = screen right, Patient's right = screen left
                        if (location.includes('Terminal ileum') || location.includes('Ileocecal')) return 'patient-right'; // Screen left (RLQ)
                        if (location.includes('Cecum')) return 'patient-right'; // Screen left (RLQ)
                        if (location.includes('Ascending')) return 'patient-right'; // Screen left
                        if (location.includes('Hepatic flexure')) return 'patient-right-top'; // Screen left, upper
                        if (location.includes('Transverse')) return 'top-center';
                        if (location.includes('Splenic flexure')) return 'patient-left-top'; // Screen right, upper
                        if (location.includes('Descending')) return 'patient-left'; // Screen right
                        if (location.includes('Sigmoid')) return 'patient-left-bottom'; // Screen right, lower
                        if (location.includes('Rectum') || location.includes('Anal')) return 'bottom-center';
                      }
                      return 'center'; // Default
                    };
                    
                    // Determine position based on anatomy
                    const anatomicalPos = getAnatomicalPosition(finding.location, type);
                    
                    switch (anatomicalPos) {
                      case 'patient-left': {// Screen RIGHT side
                        labelX = canvasRect.width - labelWidth - margin;
                        labelY = Math.max(margin, Math.min(canvasRect.height - labelHeight - margin, 
                          (finding.y * canvasRect.height / canvas.height) - labelHeight/2));
                        positioning = 'right';
                        break;
                      }
                        
                      case 'patient-right': {// Screen LEFT side
                        labelX = margin;
                        labelY = Math.max(margin, Math.min(canvasRect.height - labelHeight - margin, 
                          (finding.y * canvasRect.height / canvas.height) - labelHeight/2));
                        positioning = 'left';
                        break;
                      }
                        
                      case 'patient-left-top': {// Screen RIGHT side, upper
                        labelX = canvasRect.width - labelWidth - margin;
                        labelY = margin + (index * (labelHeight + 5));
                        positioning = 'right-top';
                        break;
                      }
                        
                      case 'patient-right-top': {// Screen LEFT side, upper
                        labelX = margin;
                        labelY = margin + (index * (labelHeight + 5));
                        positioning = 'left-top';
                        break;
                      }
                        
                      case 'patient-left-bottom': {// Screen RIGHT side, lower
                        labelX = canvasRect.width - labelWidth - margin;
                        labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                        positioning = 'right-bottom';
                        break;
                      }
                        
                      case 'top-center': {
                        labelY = margin + (index * (labelHeight + 5));
                        labelX = Math.max(margin, Math.min(canvasRect.width - labelWidth - margin, 
                          (finding.x * canvasRect.width / canvas.width) - labelWidth/2));
                        positioning = 'top';
                        break;
                      }
                        
                      case 'bottom-center': {
                        labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                        labelX = Math.max(margin, Math.min(canvasRect.width - labelWidth - margin, 
                          (finding.x * canvasRect.width / canvas.width) - labelWidth/2));
                        positioning = 'bottom';
                        break;
                      }
                        
                      case 'center-bottom': {
                        labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                        labelX = Math.max(margin, Math.min(canvasRect.width - labelWidth - margin, 
                          (finding.x * canvasRect.width / canvas.width) - labelWidth/2));
                        positioning = 'center-bottom';
                        break;
                      }
                        
                      default: {// center
                        // Use quadrant-based for central structures
                        const relativeX = finding.x / canvas.width;
                        const relativeY = finding.y / canvas.height;
                        const isLeftHalf = relativeX < 0.5;
                        const isTopHalf = relativeY < 0.5;
                        
                        if (isLeftHalf) {
                          labelX = canvasRect.width - labelWidth - margin; // Right side of screen
                        } else {
                          labelX = margin; // Left side of screen
                        }
                        
                        if (isTopHalf) {
                          labelY = margin + (index * (labelHeight + 5));
                        } else {
                          labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                        }
                        positioning = 'center';
                      }
                    }
                    
                    // Prevent overlap for similar positioning types
                    const samePositionFindings = findings.filter((f, i) => {
                      if (f.id.startsWith('temp_') || f.type === 'Pending') return false;
                      const fAnatomicalPos = getAnatomicalPosition(f.location, type);
                      return fAnatomicalPos === anatomicalPos;
                    });
                    
                    const positionIndex = samePositionFindings.indexOf(finding);
                    if (positionIndex > 0 && (positioning.includes('left') || positioning.includes('right'))) {
                      labelY = Math.max(margin, labelY + (positionIndex * (labelHeight + 8)));
                    }

                    const labelCenterX = labelX + (labelWidth / 2);
                    const labelCenterY = labelY + (labelHeight / 2);

                    return (
                      <g key={finding.id}>
                        {/* Connecting line */}
                        <path
                          d={`M ${markX} ${markY} Q ${(markX + labelCenterX) / 2} ${(markY + labelCenterY) / 2} ${labelCenterX} ${labelCenterY}`}
                          stroke={getFindingColor(finding.type)}
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="3,2"
                          opacity="0.8"
                        />
                      </g>
                    );
                  })}
              </svg>

              {/* Text labels positioned within canvas */}
              {findings
                .filter(f => !f.id.startsWith('temp_') && f.type !== 'Pending')
                .map((finding, index) => {
                  const findingNumber = index + 1;
                  const canvas = canvasRef.current;
                  if (!canvas || !canvasRect) return null;

                  // Anatomically correct positioning based on selected locations (matching SVG logic)
                  const margin = 15;
                  const labelWidth = 160;
                  const labelHeight = 35;
                  
                  let labelX, labelY;
                  let positioning = 'center';
                  
                  // Get anatomical positioning based on location and procedure type (same function as SVG)
                  const getAnatomicalPosition = (location: string, procedureType: string) => {
                    if (procedureType === 'gastroscopy') {
                      // GASTROSCOPY - Patient's left = screen right, Patient's right = screen left
                      if (location.includes('Oropharynx')) return 'patient-right-top'; // Screen left, top
                      if (location.includes('esophagus') || location.includes('Esophagus')) return 'patient-right-top'; // Screen left, top
                      if (location.includes('Cardia') || location.includes('Fundus')) return 'patient-left'; // Screen right
                      if (location.includes('Body') || location.includes('corpus')) return 'center';
                      if (location.includes('Antrum')) return 'center-bottom';
                      if (location.includes('Pylorus')) return 'patient-right'; // Screen left
                      if (location.includes('Duodenal bulb') || location.includes('first part')) return 'patient-right'; // Screen left
                      if (location.includes('Second part') || location.includes('papilla')) return 'patient-right'; // Screen left
                    } else if (procedureType === 'colonoscopy') {
                      // COLONOSCOPY - Patient's left = screen right, Patient's right = screen left
                      if (location.includes('Terminal ileum') || location.includes('Ileocecal')) return 'patient-right'; // Screen left (RLQ)
                      if (location.includes('Cecum')) return 'patient-right'; // Screen left (RLQ)
                      if (location.includes('Ascending')) return 'patient-right'; // Screen left
                      if (location.includes('Hepatic flexure')) return 'patient-right-top'; // Screen left, upper
                      if (location.includes('Transverse')) return 'top-center';
                      if (location.includes('Splenic flexure')) return 'patient-left-top'; // Screen right, upper
                      if (location.includes('Descending')) return 'patient-left'; // Screen right
                      if (location.includes('Sigmoid')) return 'patient-left-bottom'; // Screen right, lower
                      if (location.includes('Rectum') || location.includes('Anal')) return 'bottom-center';
                    }
                    return 'center'; // Default
                  };
                  
                  // Determine position based on anatomy
                  const anatomicalPos = getAnatomicalPosition(finding.location, type);
                  
                  switch (anatomicalPos) {
                    case 'patient-left': {// Screen RIGHT side
                      labelX = canvasRect.width - labelWidth - margin;
                      labelY = Math.max(margin, Math.min(canvasRect.height - labelHeight - margin, 
                        (finding.y * canvasRect.height / canvas.height) - labelHeight/2));
                      positioning = 'right';
                      break;
                    }
                      
                    case 'patient-right': {// Screen LEFT side
                      labelX = margin;
                      labelY = Math.max(margin, Math.min(canvasRect.height - labelHeight - margin, 
                        (finding.y * canvasRect.height / canvas.height) - labelHeight/2));
                      positioning = 'left';
                      break;
                    }
                      
                    case 'patient-left-top': {// Screen RIGHT side, upper
                      labelX = canvasRect.width - labelWidth - margin;
                      labelY = margin + (index * (labelHeight + 5));
                      positioning = 'right-top';
                      break;
                    }
                      
                    case 'patient-right-top': {// Screen LEFT side, upper
                      labelX = margin;
                      labelY = margin + (index * (labelHeight + 5));
                      positioning = 'left-top';
                      break;
                    }
                      
                    case 'patient-left-bottom': {// Screen RIGHT side, lower
                      labelX = canvasRect.width - labelWidth - margin;
                      labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                      positioning = 'right-bottom';
                      break;
                    }
                      
                    case 'top-center': {
                      labelY = margin + (index * (labelHeight + 5));
                      labelX = Math.max(margin, Math.min(canvasRect.width - labelWidth - margin, 
                        (finding.x * canvasRect.width / canvas.width) - labelWidth/2));
                      positioning = 'top';
                      break;
                    }
                      
                    case 'bottom-center': {
                      labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                      labelX = Math.max(margin, Math.min(canvasRect.width - labelWidth - margin, 
                        (finding.x * canvasRect.width / canvas.width) - labelWidth/2));
                      positioning = 'bottom';
                      break;
                    }
                      
                    case 'center-bottom': {
                      labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                      labelX = Math.max(margin, Math.min(canvasRect.width - labelWidth - margin, 
                        (finding.x * canvasRect.width / canvas.width) - labelWidth/2));
                      positioning = 'center-bottom';
                      break;
                    }
                      
                    default: {// center
                      // Use quadrant-based for central structures
                      const relativeX = finding.x / canvas.width;
                      const relativeY = finding.y / canvas.height;
                      const isLeftHalf = relativeX < 0.5;
                      const isTopHalf = relativeY < 0.5;
                      
                      if (isLeftHalf) {
                        labelX = canvasRect.width - labelWidth - margin; // Right side of screen
                      } else {
                        labelX = margin; // Left side of screen
                      }
                      
                      if (isTopHalf) {
                        labelY = margin + (index * (labelHeight + 5));
                      } else {
                        labelY = canvasRect.height - labelHeight - margin - (index * (labelHeight + 5));
                      }
                      positioning = 'center';
                    }
                  }
                  
                  // Prevent overlap for similar positioning types
                  const samePositionFindings = findings.filter((f, i) => {
                    if (f.id.startsWith('temp_') || f.type === 'Pending') return false;
                    const fAnatomicalPos = getAnatomicalPosition(f.location, type);
                    return fAnatomicalPos === anatomicalPos;
                  });
                  
                  const positionIndex = samePositionFindings.indexOf(finding);
                  if (positionIndex > 0 && (positioning.includes('left') || positioning.includes('right'))) {
                    labelY = Math.max(margin, labelY + (positionIndex * (labelHeight + 8)));
                  }

                  return (
                    <div
                      key={`label-${finding.id}`}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${labelX}px`,
                        top: `${labelY}px`,
                        width: `${labelWidth}px`,
                        zIndex: 10
                      }}
                    >
                      <div className="flex items-start">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 shadow-md"
                          style={{ backgroundColor: getFindingColor(finding.type) }}
                        >
                          {findingNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div 
                            className="font-bold text-sm leading-tight"
                            style={{ 
                              color: getFindingColor(finding.type),
                              textShadow: '0 1px 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)'
                            }}
                          >
                            {finding.type}
                          </div>
                          {finding.location && (
                            <div 
                              className="text-xs text-gray-700 font-medium leading-tight mt-0.5"
                              style={{ 
                                textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                              }}
                            >
                              {finding.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {/* Document Upload Section */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-black">Upload Documents & Media</h4>
          <DocumentUpload onUpdate={handleDocumentUpdate} />
        </div>

        {/* Findings List */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-black">Documented Findings:</h4>
          {findings.length === 0 ? (
            <p className="text-xs text-muted-foreground">No findings documented yet. Click on the diagram to add findings.</p>
          ) : (
            <div className="space-y-2">
              {findings.map(finding => (
                <div key={finding.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div 
                      className="px-3 py-1 rounded-md text-white font-medium text-sm"
                      style={{ 
                        backgroundColor: getFindingColor(finding.type),
                        color: '#ffffff'
                      }}
                    >
                      {finding.type}
                    </div>
                    <Badge variant="outline">{finding.location}</Badge>
                    {finding.description && <span className="text-sm text-muted-foreground">{finding.description}</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFinding(finding.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Finding Entry Modal */}
      {showingDropdown && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg overflow-y-auto">
          <div className="bg-white/60 backdrop-blur-lg border border-white/80 shadow-2xl p-8 rounded-xl max-w-3xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold mb-6 text-black">Add Finding</h3>
            
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              {/* Location Checkboxes - Row Style */}
              <div className="pb-4 border-b border-white/20">
                <label className="block text-sm mb-3 text-black">Select Locations</label>
                {/* Main sections with aligned subsections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(locationGroups).map(([groupName, locations]) => (
                    <div key={groupName} className="space-y-3">
                      {/* Main Section Header */}
                      <div className="text-center">
                        <h4 className="font-bold text-sm text-black mb-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/90 rounded-lg shadow-sm">
                          {groupName}
                        </h4>
                      </div>
                      
                      {/* Subsections aligned underneath */}
                      <div className="space-y-2">
                        {locations.map(location => (
                          <div key={location} className="flex items-center space-x-2">
                            <Checkbox
                              id={location}
                              checked={selectedLocations.includes(location)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Only allow one location to be selected at a time
                                  setSelectedLocations([location]);
                                } else {
                                  setSelectedLocations([]);
                                }
                              }}
                            />
                            <label
                              htmlFor={location}
                              className="text-sm cursor-pointer hover:text-gray-600 transition-colors text-black"
                            >
                              {location}
                            </label>
                          </div>
                        ))}
                        {/* Other option */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="other-location"
                            checked={selectedLocations.includes("Other")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLocations(["Other"]);
                              } else {
                                setSelectedLocations([]);
                                setCustomLocation('');
                              }
                            }}
                          />
                          <label
                            htmlFor="other-location"
                            className="text-sm cursor-pointer hover:text-gray-600 transition-colors text-black font-medium"
                          >
                            Other
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Custom location input */}
                {selectedLocations.includes("Other") && (
                  <div className="mt-4">
                    <label className="block text-sm mb-2 text-black">Specify Location:</label>
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="Please specify the location..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              {/* Finding Type Checkboxes - Row Style */}
              <div className="pb-4 border-b border-white/20">
                <label className="block text-sm mb-3 text-black">Select Finding Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {findingTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`finding-${type}`}
                        checked={selectedFindings.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFindings([...selectedFindings, type]);
                          } else {
                            setSelectedFindings(selectedFindings.filter(f => f !== type));
                            // Clear associated custom text when unchecking
                            if (type === "Other") setCustomFinding('');
                          }
                        }}
                      />
                      <label
                        htmlFor={`finding-${type}`}
                        className={`text-sm cursor-pointer hover:text-gray-600 transition-colors text-black ${type === "Other" || type === "Not sure" ? "font-medium" : ""}`}
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
                
                {/* Custom finding input for "Other" */}
                {selectedFindings.includes("Other") && (
                  <div className="mt-4">
                    <label className="block text-sm mb-2 text-black">Specify Finding:</label>
                    <input
                      type="text"
                      value={customFinding}
                      onChange={(e) => setCustomFinding(e.target.value)}
                      placeholder="Please specify the finding..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
              </div>
              
              {/* Description/Comments at Bottom */}
              <div>
                <label className="block text-sm mb-2 text-black">Description/Comments (Optional)</label>
                <Textarea
                  id="description-input"
                  placeholder="Additional notes about this finding..."
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={cancelFinding}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const description = document.getElementById('description-input') as HTMLTextAreaElement;
                    
                    // Validate custom inputs
                    const hasValidLocation = selectedLocations.length > 0 && 
                      (!selectedLocations.includes("Other") || customLocation.trim());
                    const hasValidFindings = selectedFindings.length > 0 && 
                      (!selectedFindings.includes("Other") || customFinding.trim());
                    
                    if (hasValidLocation && hasValidFindings) {
                      addFinding(selectedFindings, selectedLocations, description?.value || '');
                    }
                  }}
                  disabled={
                    selectedLocations.length === 0 || 
                    selectedFindings.length === 0 ||
                    (selectedLocations.includes("Other") && !customLocation.trim()) ||
                    (selectedFindings.includes("Other") && !customFinding.trim())
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};