import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnatomyDiagram } from "./AnatomyDiagram";
import { Stethoscope, Save, Trash2 } from "lucide-react";
import { SurgicalDiagram } from "./SurgicalDiagram";
import appendectomyImage from "@/assets/appendectomy.jpg";
import periAnalNeutralImage from "@/assets/peri-anal-neutral.svg";

interface SurgicalDiagramState {
  activeVariant: string;
  markingsByVariant: Record<string, any[]>;
}

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
  onGastroscopyMethodsReady?: (methods: any) => void;
  onColonoscopyMethodsReady?: (methods: any) => void;
  customImage?: string;
  surgicalDiagramVariants?: Record<string, string>;
  currentSurgicalDiagramState?: SurgicalDiagramState;
  onSurgicalDiagramStateChange?: (state: SurgicalDiagramState) => void;
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
  onColonoscopyMethodsReady,
  customImage,
  surgicalDiagramVariants,
  currentSurgicalDiagramState,
  onSurgicalDiagramStateChange,
}: ConditionalDiagramDisplayProps) => {
  const [findings, setFindings] = useState(currentProcedureFindings?.findings || "");
  const [activeDiagramVariant, setActiveDiagramVariant] = useState(
    currentSurgicalDiagramState?.activeVariant || Object.keys(surgicalDiagramVariants || {})[0] || "default"
  );

  useEffect(() => {
    setFindings(currentProcedureFindings?.findings || "");
  }, [currentProcedureFindings?.findings]);

  useEffect(() => {
    const availableVariants = Object.keys(surgicalDiagramVariants || {});
    const defaultVariant = availableVariants[0] || "default";
    setActiveDiagramVariant(currentSurgicalDiagramState?.activeVariant || defaultVariant);
  }, [currentSurgicalDiagramState?.activeVariant, surgicalDiagramVariants]);

  // Map of surgical procedures to their diagram images
  const surgicalProceduresMap: { [key: string]: string } = {
    "Appendectomy": appendectomyImage,
    "Appendicectomy": appendectomyImage,
    "Ventral Hernia Repair": appendectomyImage,
    "Rectal Cancer Surgery": appendectomyImage,
    "Small Bowel Surgery": appendectomyImage,
    "Cholecystectomy": appendectomyImage,
    "Peri-Anal": periAnalNeutralImage,
  };

  const readLegacyMarkings = (): any[] => {
    try {
      const parsed = JSON.parse(currentProcedureFindings?.findings || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const getSurgicalDiagramState = (variantKeys: string[]): SurgicalDiagramState => {
    if (currentSurgicalDiagramState) {
      return {
        activeVariant:
          currentSurgicalDiagramState.activeVariant || activeDiagramVariant || variantKeys[0] || "default",
        markingsByVariant: currentSurgicalDiagramState.markingsByVariant || {},
      };
    }

    const defaultVariant = activeDiagramVariant || variantKeys[0] || "default";
    return {
      activeVariant: defaultVariant,
      markingsByVariant: {
        [defaultVariant]: readLegacyMarkings(),
      },
    };
  };

  const emitSurgicalState = (nextState: SurgicalDiagramState) => {
    if (onSurgicalDiagramStateChange) {
      onSurgicalDiagramStateChange(nextState);
      return;
    }

    if (onProcedureFindingsUpdate) {
      onProcedureFindingsUpdate({
        findings: JSON.stringify(nextState.markingsByVariant[nextState.activeVariant] || []),
        additionalNotes: "",
      });
    }
  };

  // Define which procedures show the OLD diagrams - changed default to false
  const shouldShowGastroscopy = () => {
    if (!Array.isArray(selectedProcedures) || selectedProcedures.length === 0) return false;
    
    // Prevent surgical procedures from showing gastroscopy
    const hasSurgicalProcedure = selectedProcedures.some(p => surgicalProceduresMap[p]);
    if (hasSurgicalProcedure) return false;
    
    return selectedProcedures.some(p => [
      "Gastroscopy", 
      "Gastroscopy + Colonoscopy", 
      "PEG Tube", 
      "ERCP", 
      "EUS", 
      "EMR", 
      "ESD", 
      "POEM", 
      "G-POEM", 
      "Variceal Banding", 
      "Manometry", 
      "pH Monitoring", 
      "Foreign Body Removal"
    ].includes(p));
  };

  const shouldShowColonoscopy = () => {
    if (!Array.isArray(selectedProcedures) || selectedProcedures.length === 0) return false;
    
    // Prevent surgical procedures from showing colonoscopy
    const hasSurgicalProcedure = selectedProcedures.some(p => surgicalProceduresMap[p]);
    if (hasSurgicalProcedure) return false;
    
    return selectedProcedures.some(p => [
      "Colonoscopy", 
      "Gastroscopy + Colonoscopy", 
      "Polypectomy", 
      "APC", 
      "EMR (Colon)", 
      "ESD (Colon)", 
      "Stricture Dilation (Colon)", 
      "Stent Placement (Colonic)"
    ].includes(p));
  };

  // PRIORITY 1: Check for surgical procedures FIRST
  const activeSurgicalProcedureName = selectedProcedures.find(p => surgicalProceduresMap[p]);
  if (activeSurgicalProcedureName) {
    const diagramVariants =
      surgicalDiagramVariants && Object.keys(surgicalDiagramVariants).length > 0
        ? surgicalDiagramVariants
        : { default: customImage || surgicalProceduresMap[activeSurgicalProcedureName] };
    const variantKeys = Object.keys(diagramVariants);
    const diagramState = getSurgicalDiagramState(variantKeys);
    const currentVariant = diagramState.activeVariant || variantKeys[0] || "default";
    const currentDiagramImage =
      diagramVariants[currentVariant] || diagramVariants[variantKeys[0]] || surgicalProceduresMap[activeSurgicalProcedureName];

    return (
      <Card className="glass-card-light">
        <CardHeader className="px-4 pt-4 text-center sm:px-6 sm:text-left">
          <CardTitle className="flex items-center justify-center gap-2 sm:justify-start">
            <Stethoscope className="h-5 w-5 text-gray-600" />
            {activeSurgicalProcedureName === "Appendectomy" ? "Appendicectomy" : activeSurgicalProcedureName} Diagram
          </CardTitle>
          <CardDescription className="mx-auto max-w-md sm:mx-0">
            Mark Ports, Stomas, and Incisions on the diagram below.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-4 sm:px-6">
          {variantKeys.length > 1 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Diagram View:</p>
              <div className="flex flex-wrap gap-2">
                {variantKeys.map((variantKey) => (
                  <Button
                    key={variantKey}
                    type="button"
                    variant={currentVariant === variantKey ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const nextState = {
                        activeVariant: variantKey,
                        markingsByVariant: diagramState.markingsByVariant,
                      };
                      setActiveDiagramVariant(variantKey);
                      emitSurgicalState(nextState);
                    }}
                  >
                    {variantKey === "neutral" ? "Neutral Peri-Anal" : "Female Perineal Anatomy"}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <SurgicalDiagram
            key={`${activeSurgicalProcedureName}-${currentVariant}`}
            diagramImage={currentDiagramImage}
            initialMarkings={diagramState.markingsByVariant[currentVariant] || []}
            onUpdate={(markings) => {
              emitSurgicalState({
                activeVariant: currentVariant,
                markingsByVariant: {
                  ...diagramState.markingsByVariant,
                  [currentVariant]: markings,
                },
              });
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // PRIORITY 2: Check for endoscopy diagrams
  const showGastro = shouldShowGastroscopy();
  const showColono = shouldShowColonoscopy();
  if (showGastro || showColono) {
    return (
      <div className={`grid gap-6 ${showGastro && showColono ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {showGastro && (
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
                customImage={customImage} 
              />
            </CardContent>
          </Card>
        )}
        {showColono && (
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
                customImage={customImage} 
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // PRIORITY 3: Fallback to text area for other procedures
  const handleSaveProcedureFindings = () => {
    if (onProcedureFindingsUpdate) {
      onProcedureFindingsUpdate({
        findings,
        additionalNotes: ''
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
};
