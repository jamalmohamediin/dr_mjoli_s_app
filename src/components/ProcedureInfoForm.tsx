import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Edit } from "lucide-react";

interface ProcedureInfoFormProps {
  onUpdate: (data: any) => void;
  initialData?: any;
}

export const ProcedureInfoForm = ({ onUpdate, initialData }: ProcedureInfoFormProps) => {
  const [formData, setFormData] = useState({
    procedure: "",
    date: new Date().toISOString().split('T')[0],
    preparation: "",
    anesthesia: "",
    indication: "",
    assistant: ""
  });
  const [tempIndication, setTempIndication] = useState('');

  // Medical spell checking function
  const checkSpelling = (text: string) => {
    const medicalTerms = [
      'gastritis', 'esophagitis', 'duodenitis', 'colitis', 'ulceration', 
      'inflammation', 'hemorrhage', 'hemorrhoid', 'esophagus', 'diarrhea', 
      'anemia', 'stomach', 'intestine', 'bowel', 'colon', 'rectum', 'anus',
      'duodenum', 'jejunum', 'ileum', 'cecum', 'sigmoid', 'abdominal',
      'nausea', 'vomiting', 'constipation', 'bloating', 'cramping',
      'heartburn', 'reflux', 'dyspepsia', 'dysphagia', 'odynophagia',
      'endoscopy', 'gastroscopy', 'colonoscopy', 'biopsy', 'polypectomy',
      'sedation', 'anesthesia', 'gastrointestinal', 'gerd', 'ibd', 'ibs'
    ];

    const misspelledWords = ['gastriris', 'gastrtis', 'gastrits', 'esophagits', 
      'esofagitis', 'duodenits', 'colits', 'ulceratoin', 'inflamation', 
      'inflamatory', 'haemorrhage', 'haemorrhoid', 'oesophagus', 'oesophagitis',
      'diarrhoea', 'anaemia', 'stomache', 'stomack', 'abdomenal', 'vomitting',
      'anaesthesia'];

    return text.toLowerCase().split(/\s+/).some(word => 
      misspelledWords.includes(word.replace(/[^\w]/g, ''))
    );
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        procedure: initialData.procedure || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        preparation: initialData.preparation || "",
        anesthesia: initialData.sedation || "",
        indication: initialData.indication || "",
        assistant: initialData.assistant || ""
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // Map anesthesia back to sedation for compatibility
    const reportData = field === 'anesthesia' 
      ? { ...newData, sedation: value }
      : newData;
    onUpdate(reportData);
  };

  return (
    <Card className="p-3 mb-3 glass-card-light">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-black">Procedure Information</h3>
      </div>
      
      {/* Clinical Indication - Full width on top */}
      <div className="mb-2">
        <Label htmlFor="indication" className="text-xs font-medium">Clinical Indication</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                id="indication"
                value={tempIndication}
                onChange={(e) => setTempIndication(e.target.value)}
                placeholder="Enter clinical indication for procedure..."
                rows={1}
                className={`mt-0.5 text-sm resize-none min-h-[32px] max-h-[60px] w-full ${
                  tempIndication && checkSpelling(tempIndication) 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : ''
                }`}
              />
              {tempIndication && checkSpelling(tempIndication) && (
                <div className="absolute top-0 right-2 mt-1">
                  <span className="text-xs text-red-500 font-medium">
                    ⚠️ Check spelling
                  </span>
                </div>
              )}
            </div>
            <Button 
              size="sm"
              onClick={() => {
                handleChange('indication', tempIndication);
                setTempIndication('');
              }}
              disabled={!tempIndication.trim()}
              className="self-start mt-0.5"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
          {formData.indication && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
              <strong>Saved:</strong> {formData.indication}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-6 px-2"
                onClick={() => {
                  setTempIndication(formData.indication);
                  handleChange('indication', '');
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Procedure fields in a row - without procedure type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="space-y-0.5">
          <Label htmlFor="date" className="text-xs font-medium">Procedure Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="preparation" className="text-xs font-medium">Bowel Preparation</Label>
          <Select value={formData.preparation} onValueChange={(value) => handleChange('preparation', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select preparation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="anesthesia" className="text-xs font-medium">Type of Anesthesia</Label>
          <Select value={formData.anesthesia} onValueChange={(value) => handleChange('anesthesia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select anesthesia type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conscious">Conscious Sedation</SelectItem>
              <SelectItem value="deep">Deep Sedation</SelectItem>
              <SelectItem value="general">General Anesthesia</SelectItem>
              <SelectItem value="none">No Sedation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="assistant" className="text-xs font-medium">Assistant Name</Label>
          <Input
            id="assistant"
            value={formData.assistant}
            onChange={(e) => handleChange('assistant', e.target.value)}
            placeholder="Enter assistant name"
          />
        </div>
      </div>
    </Card>
  );
};