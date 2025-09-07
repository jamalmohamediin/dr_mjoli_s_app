import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnatomyDiagram } from "./AnatomyDiagram";
import { Stethoscope, Save, Trash2 } from "lucide-react";

interface ConditionalDiagramDisplayProps {
  selectedProcedures: string[];
  onGastroscopyUpdate: (data: any) => void;
  onColonoscopyUpdate: (data: any) => void;
  onProcedureFindingsUpdate?: (data: any) => void;
  currentProcedureFindings?: { findings: string; additionalNotes: string };
  gastroscopyRef?: React.RefObject<HTMLCanvasElement>;
  colonoscopyRef?: React.RefObject<HTMLCanvasElement>;
  gastroscopyContainerRef?: React.RefObject<HTMLDivElement>;
  colonoscopyContainerRef?: React.RefObject<HTMLDivElement>;
  onGastroscopyMethodsReady?: (methods: { removeFinding: (id: string) => void; editFinding: (id: string) => void; undoLastAction: () => void; redoLastAction: () => void; canRedo: () => boolean }) => void;
  onColonoscopyMethodsReady?: (methods: { removeFinding: (id: string) => void; editFinding: (id: string) => void; undoLastAction: () => void; redoLastAction: () => void; canRedo: () => boolean }) => void;
}

export const ConditionalDiagramDisplay = ({ 
  selectedProcedures, 
  onGastroscopyUpdate, 
  onColonoscopyUpdate,
  onProcedureFindingsUpdate,
  currentProcedureFindings,
  gastroscopyRef,
  colonoscopyRef,
  gastroscopyContainerRef,
  colonoscopyContainerRef,
  onGastroscopyMethodsReady,
  onColonoscopyMethodsReady
}: ConditionalDiagramDisplayProps) => {
  const [findings, setFindings] = useState(currentProcedureFindings?.findings || '');
  
  // Sync local state when prop changes (from live report edits)
  useEffect(() => {
    setFindings(currentProcedureFindings?.findings || '');
  }, [currentProcedureFindings?.findings]);
  
  const handleSaveProcedureFindings = () => {
    if (onProcedureFindingsUpdate) {
      onProcedureFindingsUpdate({
        findings,
        additionalNotes: '' // Remove additional notes
      });
    }
  };

  const handleRemoveProcedureFindings = () => {
    setFindings('');
    if (onProcedureFindingsUpdate) {
      onProcedureFindingsUpdate({
        findings: '',
        additionalNotes: ''
      });
    }
  };
  
  // Determine which diagrams to show based on selected procedures
  const shouldShowGastroscopy = () => {
    // Safety check: ensure selectedProcedures is an array
    if (!Array.isArray(selectedProcedures)) return true;
    
    // If no procedures selected, show by default
    if (selectedProcedures.length === 0) return true;
    
    return selectedProcedures.some(procedure => 
      procedure === "Gastroscopy" || 
      procedure === "Gastroscopy + Colonoscopy" ||
      procedure.includes("PEG Tube") ||
      procedure.includes("ERCP") ||
      procedure.includes("EUS") ||
      procedure.includes("EMR") ||
      procedure.includes("ESD") ||
      procedure.includes("POEM") ||
      procedure.includes("G-POEM") ||
      procedure.includes("Variceal Banding") ||
      procedure.includes("Manometry") ||
      procedure.includes("pH Monitoring") ||
      procedure.includes("Foreign Body Removal")
    );
  };

  const shouldShowColonoscopy = () => {
    // Safety check: ensure selectedProcedures is an array
    if (!Array.isArray(selectedProcedures)) return true;
    
    // If no procedures selected, show by default
    if (selectedProcedures.length === 0) return true;
    
    return selectedProcedures.some(procedure => 
      procedure === "Colonoscopy" || 
      procedure === "Gastroscopy + Colonoscopy" ||
      procedure.includes("Polypectomy") ||
      procedure.includes("APC") ||
      procedure.includes("EMR (Colon)") ||
      procedure.includes("ESD (Colon)") ||
      procedure.includes("Stricture Dilation (Colon)") ||
      procedure.includes("Stent Placement (Colonic")
    );
  };

  const showGastroscopy = shouldShowGastroscopy();
  const showColonoscopy = shouldShowColonoscopy();
  const showBothSideBySide = showGastroscopy && showColonoscopy;

  // If no procedures require diagrams, show only text fields
  if (!showGastroscopy && !showColonoscopy) {
    return (
      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-gray-600" />
            Procedure Findings
          </CardTitle>
          <CardDescription>
            Document your findings and observations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Procedure Findings
              </label>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Document your procedure findings, observations, and any complications encountered..."
              />
            </div>
            <div className="flex justify-end gap-2">
              {findings.trim() && (
                <Button 
                  onClick={handleRemoveProcedureFindings}
                  variant="outline"
                  className="glass-button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
              <Button 
                onClick={handleSaveProcedureFindings}
                className="glass-button-primary"
                disabled={!findings.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Findings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid gap-6 ${showBothSideBySide ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
      {showGastroscopy && (
        <Card className="glass-card-light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-black">Gastroscopy Examination</span>
              <span className="text-xs text-gray-500 font-normal ml-2">Document findings from the gastroscopy procedure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnatomyDiagram 
              type="gastroscopy"
              onUpdate={onGastroscopyUpdate}
              canvasRef={gastroscopyRef}
              containerRef={gastroscopyContainerRef}
              onMethodsReady={onGastroscopyMethodsReady}
            />
          </CardContent>
        </Card>
      )}

      {showColonoscopy && (
        <Card className="glass-card-light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-black">Colonoscopy Examination</span>
              <span className="text-xs text-gray-500 font-normal ml-2">Document findings from the colonoscopy procedure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnatomyDiagram 
              type="colonoscopy"
              onUpdate={onColonoscopyUpdate}
              canvasRef={colonoscopyRef}
              containerRef={colonoscopyContainerRef}
              onMethodsReady={onColonoscopyMethodsReady}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};