import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Eraser, Circle, Square } from "lucide-react";
import gastroscopyAnatomy from "@/assets/gastroscopy-anatomy.jpg";
import colonoscopyAnatomy from "@/assets/colonoscopy-anatomy.jpg";

interface AnatomyDiagramProps {
  type: "gastroscopy" | "colonoscopy";
  onUpdate: (data: any) => void;
}

interface Finding {
  id: string;
  x: number;
  y: number;
  type: string;
  description: string;
  location: string;
}

export const AnatomyDiagram = ({ type, onUpdate }: AnatomyDiagramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'draw' | 'erase' | 'mark'>('mark');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [showingDropdown, setShowingDropdown] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{x: number, y: number} | null>(null);

  const anatomyImage = type === "gastroscopy" ? gastroscopyAnatomy : colonoscopyAnatomy;
  
  const findingTypes = type === "gastroscopy" 
    ? [
        "Normal mucosa", "Erythema", "Ulceration", "Polyp", "Mass", "Stricture",
        "Hiatal hernia", "Esophagitis", "Barrett's esophagus", "Gastritis", 
        "Duodenitis", "H. pylori", "Bleeding", "Varices"
      ]
    : [
        "Normal mucosa", "Polyp", "Adenoma", "Diverticulum", "Hemorrhoid", 
        "Ulceration", "Mass", "Stricture", "Colitis", "Bleeding", "Melanosis coli",
        "Angiodysplasia", "Lipoma", "Carcinoid"
      ];

  const locations = type === "gastroscopy"
    ? ["Esophagus", "GE Junction", "Fundus", "Body", "Antrum", "Pylorus", "Duodenum"]
    : ["Cecum", "Ascending colon", "Hepatic flexure", "Transverse colon", 
       "Splenic flexure", "Descending colon", "Sigmoid colon", "Rectum"];

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      redrawCanvas();
    };

    image.src = anatomyImage;
  }, [anatomyImage]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    
    // Draw findings
    findings.forEach(finding => {
      ctx.fillStyle = finding.type.includes('Normal') ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(finding.x, finding.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode !== 'mark') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setPendingPosition({ x, y });
    setShowingDropdown(true);
  };

  const addFinding = (type: string, location: string, description: string) => {
    if (!pendingPosition) return;
    
    const newFinding: Finding = {
      id: Date.now().toString(),
      x: pendingPosition.x,
      y: pendingPosition.y,
      type,
      location,
      description
    };
    
    const newFindings = [...findings, newFinding];
    setFindings(newFindings);
    setPendingPosition(null);
    setShowingDropdown(false);
    
    onUpdate({ findings: newFindings });
    redrawCanvas();
  };

  const removeFinding = (id: string) => {
    const newFindings = findings.filter(f => f.id !== id);
    setFindings(newFindings);
    onUpdate({ findings: newFindings });
    redrawCanvas();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-primary">
            {type === "gastroscopy" ? "Gastroscopy" : "Colonoscopy"} Findings
          </h3>
          
          <div className="flex gap-2">
            <Button
              variant={drawingMode === 'mark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode('mark')}
            >
              <Circle className="h-4 w-4 mr-2" />
              Mark Findings
            </Button>
            <Button
              variant={drawingMode === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode('draw')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Draw
            </Button>
            <Button
              variant={drawingMode === 'erase' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode('erase')}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Erase
            </Button>
          </div>
        </div>

        <div className="relative border rounded-lg overflow-hidden bg-white">
          <img 
            ref={imageRef}
            src={anatomyImage}
            alt={`${type} anatomy`}
            className="hidden"
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="max-w-full h-auto cursor-crosshair"
            style={{ maxHeight: '500px' }}
          />
        </div>

        {/* Findings List */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold">Documented Findings:</h4>
          {findings.length === 0 ? (
            <p className="text-muted-foreground">No findings documented yet. Click on the diagram to add findings.</p>
          ) : (
            <div className="space-y-2">
              {findings.map(finding => (
                <div key={finding.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={finding.type.includes('Normal') ? 'default' : 'destructive'}>
                      {finding.type}
                    </Badge>
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
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Finding</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Finding Type</label>
                <Select onValueChange={(value) => {
                  const location = document.getElementById('location-select') as HTMLSelectElement;
                  const description = document.getElementById('description-input') as HTMLTextAreaElement;
                  if (location?.value && value) {
                    addFinding(value, location.value, description?.value || '');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finding type" />
                  </SelectTrigger>
                  <SelectContent>
                    {findingTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <select
                  id="location-select"
                  className="w-full p-2 border rounded-md"
                  defaultValue=""
                >
                  <option value="">Select location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <Textarea
                  id="description-input"
                  placeholder="Additional notes about this finding..."
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowingDropdown(false);
                    setPendingPosition(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};