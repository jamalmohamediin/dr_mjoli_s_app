import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateDDMMYYYYInput, Time24HourInput } from "@/components/Time24HourInput";
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
    preoperativeImaging: "",
    operationStartTime: "",
    operationEndTime: "",
    operationDuration: ""
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
        preoperativeImaging: initialData.preoperativeImaging || "",
        operationStartTime: initialData.operationStartTime || "",
        operationEndTime: initialData.operationEndTime || "",
        operationDuration: initialData.operationDuration || ""
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };

    // Auto-calc duration when start and end times are set
    if (field === 'operationStartTime' || field === 'operationEndTime') {
      const start = field === 'operationStartTime' ? value : newData.operationStartTime;
      const end = field === 'operationEndTime' ? value : newData.operationEndTime;
      if (start && end) {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let minutes = (eh * 60 + em) - (sh * 60 + sm);
        if (minutes < 0) minutes += 24 * 60; // cross-midnight safeguard
        newData.operationDuration = String(minutes);
      }
    }
    setFormData(newData);
    // Map anesthesia back to sedation for compatibility
    const reportData = {
      ...newData,
      sedation: newData.anesthesia
    };
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
          <div className="flex flex-col gap-2 sm:flex-row">
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
              className="mt-0.5 w-full self-start sm:w-auto"
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
      
      {/* Preoperative Imaging - Under Clinical Indication */}
      <div className="mt-2">
        <Label className="text-xs font-medium">Preoperative Imaging:</Label>
        <div className="flex flex-wrap gap-4 mt-1">
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={formData.preoperativeImaging === 'none'}
              onChange={(e) => handleChange('preoperativeImaging', e.target.checked ? 'none' : '')}
            />
            <span>None</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={formData.preoperativeImaging === 'ultrasound'}
              onChange={(e) => handleChange('preoperativeImaging', e.target.checked ? 'ultrasound' : '')}
            />
            <span>Ultrasound</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={formData.preoperativeImaging === 'ct'}
              onChange={(e) => handleChange('preoperativeImaging', e.target.checked ? 'ct' : '')}
            />
            <span>CT Scan</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={formData.preoperativeImaging === 'mri'}
              onChange={(e) => handleChange('preoperativeImaging', e.target.checked ? 'mri' : '')}
            />
            <span>MRI</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={formData.preoperativeImaging === 'other'}
              onChange={(e) => handleChange('preoperativeImaging', e.target.checked ? 'other' : '')}
            />
            <span>Other (Please Specify):</span>
            <Input
              type="text"
              placeholder="Specify"
              className="w-24 h-6 text-xs ml-1"
              disabled={formData.preoperativeImaging !== 'other'}
            />
          </label>
        </div>
      </div>

      
      {/* Row 1: Preparation and Anesthesia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label htmlFor="preparation" className="text-xs font-medium">Bowel Preparation</Label>
          <Select value={formData.preparation} onValueChange={(value) => handleChange('preparation', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Preparation" />
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
              <SelectValue placeholder="Select Anesthesia Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conscious">Conscious Sedation</SelectItem>
              <SelectItem value="deep">Deep Sedation</SelectItem>
              <SelectItem value="general">General Anesthesia</SelectItem>
              <SelectItem value="none">No Sedation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Row 3: Procedure Date and Duration in one row */}
      <div className="mt-2 grid grid-cols-1 gap-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="date" className="text-xs font-medium">Procedure Date:</Label>
            <DateDDMMYYYYInput
              ariaLabel="Procedure date"
              className="w-full"
              value={formData.date}
              onChange={(value) => handleChange('date', value)}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs font-medium">Duration of Operation:</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <span className="text-xs">Start Time</span>
                <Time24HourInput
                  className="w-full"
                  hourAriaLabel="Operation start hour"
                  minuteAriaLabel="Operation start minute"
                  value={formData.operationStartTime}
                  onChange={(value) => handleChange('operationStartTime', value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs">End Time</span>
                <Time24HourInput
                  className="w-full"
                  hourAriaLabel="Operation end hour"
                  minuteAriaLabel="Operation end minute"
                  value={formData.operationEndTime}
                  onChange={(value) => handleChange('operationEndTime', value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs">Total Duration</span>
                <Input
                  type="number"
                  value={formData.operationDuration}
                  onChange={(e) => handleChange('operationDuration', e.target.value)}
                  placeholder="min"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
