import { useState, useEffect } from "react";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { createInitialPatientInfoState } from "@/utils/patientSticker";

interface PatientInfoFormProps {
  onUpdate: (data: any) => void;
  currentData?: any;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
}

export const PatientInfoForm = ({
  onUpdate,
  currentData,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
}: PatientInfoFormProps) => {
  const [formData, setFormData] = useState(createInitialPatientInfoState(currentData));

  

  // Sync local state when prop changes (from live report edits)
  useEffect(() => {
    if (currentData) {
      setFormData(createInitialPatientInfoState(currentData));
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

  const handleBulkUpdate = (updates: Record<string, any>) => {
    let newData = { ...formData, ...updates };

    if (Object.prototype.hasOwnProperty.call(updates, "dateOfBirth")) {
      newData.age = calculateAge(newData.dateOfBirth);
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "weight") ||
      Object.prototype.hasOwnProperty.call(updates, "height")
    ) {
      newData.bmi = calculateBMI(newData.weight, newData.height);
    }

    setFormData(newData);
    onUpdate(newData);
  };

  return (
    <PatientInfoFields
      patientInfo={formData}
      onFieldChange={handleChange}
      onBulkUpdate={handleBulkUpdate}
      currentExtractedPatientInfo={currentExtractedPatientInfo}
      onCurrentPatientChange={onCurrentPatientChange}
    />
  );
};
