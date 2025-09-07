import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface ProcedureTypeSelectionProps {
  onUpdate: (procedures: string[]) => void;
  initialProcedures?: string[];
}

export const ProcedureTypeSelection = ({ onUpdate, initialProcedures = [] }: ProcedureTypeSelectionProps) => {
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>(initialProcedures);
  const [showAddOns, setShowAddOns] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Main procedure types
  const mainProcedures = [
    "Gastroscopy",
    "Colonoscopy", 
    "Gastroscopy + Colonoscopy"
  ];

  // Common add-on procedures
  const addOnProcedures = [
    "PEG Tube Insertion (Percutaneous Endoscopic Gastrostomy)",
    "Polypectomy",
    "Stricture Dilation",
    "Variceal Banding",
    "Hemostatic Clipping",
    "Haemorrhoid Banding",
    "Sigmoidoscopy"
  ];

  // Advanced procedures organized by category
  const advancedProcedures = {
    "Advanced Upper GI": [
      "ERCP (Endoscopic Retrograde Cholangiopancreatography)",
      "ERCP with Stone Extraction", 
      "ERCP with Stent Placement",
      "EUS (Endoscopic Ultrasound)",
      "EUS-FNA (Endoscopic Ultrasound – Fine Needle Aspiration)",
      "EMR (Endoscopic Mucosal Resection)",
      "ESD (Endoscopic Submucosal Dissection)",
      "POEM (Peroral Endoscopic Myotomy)",
      "G-POEM (Gastric Peroral Endoscopic Myotomy)"
    ],
    "Advanced Lower GI": [
      "Polypectomy (Advanced/Complex)",
      "EMR (Colon)",
      "ESD (Colon)", 
      "APC (Argon Plasma Coagulation)",
      "Stricture Dilation (Colon)",
      "Stent Placement (Colonic obstruction)"
    ],
    "Functional / Investigative": [
      "Manometry (Esophageal Manometry)",
      "pH Monitoring (24-hour Esophageal pH Monitoring)"
    ],
    "General / Emergency": [
      "Foreign Body Removal"
    ]
  };

  // Filter advanced procedures based on search
  const filterAdvancedProcedures = () => {
    if (!searchTerm) return advancedProcedures;
    
    const filtered: typeof advancedProcedures = {};
    Object.entries(advancedProcedures).forEach(([category, procedures]) => {
      const matchingProcedures = procedures.filter(procedure =>
        procedure.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingProcedures.length > 0) {
        filtered[category] = matchingProcedures;
      }
    });
    return filtered;
  };

  const toggleProcedure = (procedure: string) => {
    const newSelected = selectedProcedures.includes(procedure)
      ? selectedProcedures.filter(p => p !== procedure)
      : [...selectedProcedures, procedure];
    
    setSelectedProcedures(newSelected);
    onUpdate(newSelected);
  };

  const handleMainProcedureChange = (procedure: string, checked: boolean) => {
    if (checked) {
      // If selecting "Gastroscopy + Colonoscopy", remove individual ones
      if (procedure === "Gastroscopy + Colonoscopy") {
        const filtered = selectedProcedures.filter(p => p !== "Gastroscopy" && p !== "Colonoscopy");
        const newSelected = [...filtered, procedure];
        setSelectedProcedures(newSelected);
        onUpdate(newSelected);
      } else {
        // If selecting individual procedure, remove combined one if present
        const filtered = selectedProcedures.filter(p => p !== "Gastroscopy + Colonoscopy");
        const newSelected = [...filtered, procedure];
        setSelectedProcedures(newSelected);
        onUpdate(newSelected);
      }
    } else {
      const newSelected = selectedProcedures.filter(p => p !== procedure);
      setSelectedProcedures(newSelected);
      onUpdate(newSelected);
    }
  };

  // Auto-expand add-ons and advanced if any are selected
  useEffect(() => {
    const hasAddOns = selectedProcedures.some(p => addOnProcedures.includes(p));
    const hasAdvanced = selectedProcedures.some(p => 
      Object.values(advancedProcedures).flat().includes(p)
    );
    
    if (hasAddOns) setShowAddOns(true);
    if (hasAdvanced) setShowAdvanced(true);
  }, [selectedProcedures]);

  const hasMainProcedures = selectedProcedures.some(p => mainProcedures.includes(p));
  const filteredAdvanced = filterAdvancedProcedures();

  return (
    <Card className="p-3 mb-3 glass-card-light">
      <CardContent>
        <h3 className="text-sm font-semibold text-black mb-2">Procedure Type Selection</h3>
        <div className="space-y-3">
        {/* Main Procedures - Always visible */}
        <div>
          <h4 className="text-xs font-semibold text-black mb-1.5">Main Procedures</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {mainProcedures.map(procedure => (
              <div key={procedure} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 transition-colors">
                <Checkbox
                  id={`main-${procedure}`}
                  checked={selectedProcedures.includes(procedure)}
                  onCheckedChange={(checked) => handleMainProcedureChange(procedure, !!checked)}
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor={`main-${procedure}`}
                  className="font-medium text-black cursor-pointer flex-1 text-xs leading-tight"
                >
                  {procedure}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Common Add-on Procedures - Collapsible */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold text-black">Common Add-on Procedures</h4>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowAddOns(!showAddOns)}
              className="text-gray-600 hover:text-black h-6 px-2"
            >
              {showAddOns ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
          
          {showAddOns && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {addOnProcedures.map(procedure => (
                <div key={procedure} className="flex items-center space-x-2 p-1.5 border rounded hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id={`addon-${procedure}`}
                    checked={selectedProcedures.includes(procedure)}
                    onCheckedChange={() => toggleProcedure(procedure)}
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor={`addon-${procedure}`}
                    className="text-xs text-black cursor-pointer flex-1 leading-tight"
                  >
                    {procedure}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Procedures - Collapsible with search */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold text-black">Other Endoscopic Procedures</h4>
            <Button
              variant="ghost"
              size="sm" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-600 hover:text-black h-6 px-2"
            >
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-2">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search procedures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>

              {/* Categorized procedures */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(filteredAdvanced).map(([category, procedures]) => (
                  <div key={category}>
                    <h5 className="font-semibold text-gray-700 mb-1.5 text-xs border-b border-gray-200 pb-1">{category}</h5>
                    <div className="space-y-1">
                      {procedures.map(procedure => (
                        <div key={procedure} className="flex items-center space-x-1.5 p-1 hover:bg-gray-50 rounded transition-colors">
                          <Checkbox
                            id={`advanced-${procedure}`}
                            checked={selectedProcedures.includes(procedure)}
                            onCheckedChange={() => toggleProcedure(procedure)}
                            className="h-3.5 w-3.5"
                          />
                          <label
                            htmlFor={`advanced-${procedure}`}
                            className="text-xs text-black cursor-pointer flex-1 leading-tight"
                          >
                            {procedure}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Procedures Summary */}
        {selectedProcedures.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-black mb-1">Selected Procedures ({selectedProcedures.length})</h4>
            <div className="flex flex-wrap gap-1">
              {selectedProcedures.map(procedure => (
                <Badge
                  key={procedure}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 text-xs px-2 py-0.5"
                  onClick={() => toggleProcedure(procedure)}
                >
                  {procedure} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
};