import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientInfoFormProps {
  onUpdate: (data: any) => void;
}

export const PatientInfoForm = ({ onUpdate }: PatientInfoFormProps) => {
  const [formData, setFormData] = useState({
    patientId: "",
    name: "",
    age: "",
    gender: "",
    indication: "",
    preparation: "",
    sedation: "",
    procedure: "",
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold text-primary mb-4">Patient Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patientId">Patient ID</Label>
          <Input
            id="patientId"
            value={formData.patientId}
            onChange={(e) => handleChange('patientId', e.target.value)}
            placeholder="Enter patient ID"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Patient Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter patient name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="Enter age"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select onValueChange={(value) => handleChange('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="procedure">Procedure Type</Label>
          <Select onValueChange={(value) => handleChange('procedure', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select procedure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gastroscopy">Gastroscopy</SelectItem>
              <SelectItem value="colonoscopy">Colonoscopy</SelectItem>
              <SelectItem value="both">Combined Procedure</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Procedure Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="indication">Clinical Indication</Label>
        <Textarea
          id="indication"
          value={formData.indication}
          onChange={(e) => handleChange('indication', e.target.value)}
          placeholder="Enter clinical indication for procedure..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preparation">Bowel Preparation</Label>
          <Select onValueChange={(value) => handleChange('preparation', value)}>
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
        
        <div className="space-y-2">
          <Label htmlFor="sedation">Sedation</Label>
          <Select onValueChange={(value) => handleChange('sedation', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select sedation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conscious">Conscious Sedation</SelectItem>
              <SelectItem value="deep">Deep Sedation</SelectItem>
              <SelectItem value="none">No Sedation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};