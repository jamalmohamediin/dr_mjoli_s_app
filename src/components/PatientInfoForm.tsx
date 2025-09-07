import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientInfoFormProps {
  onUpdate: (data: any) => void;
  currentData?: any;
}

export const PatientInfoForm = ({ onUpdate, currentData }: PatientInfoFormProps) => {
  const [formData, setFormData] = useState({
    patientId: currentData?.patientId || "",
    name: currentData?.name || "",
    age: currentData?.age || "",
    gender: currentData?.gender || ""
  });

  // Sync local state when prop changes (from live report edits)
  useEffect(() => {
    if (currentData) {
      setFormData({
        patientId: currentData.patientId || "",
        name: currentData.name || "",
        age: currentData.age || "",
        gender: currentData.gender || ""
      });
    }
  }, [currentData]);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label htmlFor="name" className="text-xs font-medium">Patient Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter patient full name"
          />
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="patientId" className="text-xs font-medium">Patient ID</Label>
          <Input
            id="patientId"
            value={formData.patientId}
            onChange={(e) => handleChange('patientId', e.target.value)}
            placeholder="Enter patient ID"
          />
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="age" className="text-xs font-medium">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="Enter age"
          />
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="gender" className="text-xs font-medium">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
      </div>
    </div>
  );
};