import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";

interface PatientInfoFormProps {
  onUpdate: (data: any) => void;
  currentData?: any;
}

export const PatientInfoForm = ({ onUpdate, currentData }: PatientInfoFormProps) => {
  const [formData, setFormData] = useState({
    patientId: currentData?.patientId || "",
    name: currentData?.name || "",
    dateOfBirth: currentData?.dateOfBirth || "",
    age: currentData?.age || "",
    sex: currentData?.sex || currentData?.gender || "",
    weight: currentData?.weight || "",
    height: currentData?.height || "",
    bmi: currentData?.bmi || "",
    asaScore: currentData?.asaScore || "",
    asaNotes: currentData?.asaNotes || ""
  });

  // Sync local state when prop changes (from live report edits)
  useEffect(() => {
    if (currentData) {
      setFormData({
        patientId: currentData.patientId || "",
        name: currentData.name || "",
        dateOfBirth: currentData.dateOfBirth || "",
        age: currentData.age || "",
        sex: currentData.sex || currentData.gender || "",
        weight: currentData.weight || "",
        height: currentData.height || "",
        bmi: currentData.bmi || "",
        asaScore: currentData.asaScore || "",
        asaNotes: currentData.asaNotes || ""
      });
    }
  }, [currentData]);

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Helper function to calculate BMI
  const calculateBMI = (weight: string, height: string): string => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    if (weightNum && heightNum && heightNum > 0) {
      const heightInMeters = heightNum / 100;
      const bmi = weightNum / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return '';
  };

  const handleChange = (field: string, value: string) => {
    let newData = { ...formData, [field]: value };
    
    // Auto-calculate age when date of birth changes
    if (field === 'dateOfBirth' && typeof value === 'string') {
      newData.age = calculateAge(value);
    }
    
    // Auto-calculate BMI when weight or height changes
    if ((field === 'weight' || field === 'height') && typeof value === 'string') {
      newData.bmi = calculateBMI(
        field === 'weight' ? value : formData.weight,
        field === 'height' ? value : formData.height
      );
    }
    
    setFormData(newData);
    onUpdate(newData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Patient Name:</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter patient name"
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Patient ID:</Label>
        <Input
          value={formData.patientId}
          onChange={(e) => handleChange('patientId', e.target.value)}
          placeholder="Enter patient ID"
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Date Of Birth:</Label>
        <Input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          className="w-full"
          placeholder="dd/mm/yyyy"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Age:</Label>
        <Input
          value={formData.age}
          placeholder="Calculated from date of birth"
          readOnly
          className="w-full bg-gray-100"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Sex:</Label>
        <Select value={formData.sex} onValueChange={(value) => handleChange('sex', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sex" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Weight:</Label>
        <Input
          value={formData.weight}
          onChange={(e) => handleChange('weight', e.target.value)}
          placeholder="Enter weight (kg)"
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">Height:</Label>
        <Input
          value={formData.height}
          onChange={(e) => handleChange('height', e.target.value)}
          placeholder="Enter height (cm)"
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <Label className="text-gray-800 font-medium">BMI:</Label>
        <Input
          value={formData.bmi}
          placeholder="Calculated from height and weight"
          readOnly
          className="w-full bg-gray-100"
        />
      </div>
      
      <ASAClassificationSection
        selectedASA={formData.asaScore}
        onASAChange={(value) => handleChange('asaScore', value)}
        notes={formData.asaNotes}
        onNotesChange={(value) => handleChange('asaNotes', value)}
        showNotes={true}
      />
    </div>
  );
};