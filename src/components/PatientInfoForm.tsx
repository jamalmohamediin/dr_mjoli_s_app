import { useState, useEffect } from "react";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import {
  createInitialPatientInfoState,
  mergePatientInfoUpdates,
} from "@/utils/patientSticker";

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

  const handleChange = (field: string, value: string) => {
    const newData = mergePatientInfoUpdates(formData, { [field]: value });
    setFormData(newData);
    onUpdate(newData);
  };

  const handleBulkUpdate = (updates: Record<string, any>) => {
    const newData = mergePatientInfoUpdates(formData, updates);
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
