import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PatientInfoFields } from "@/components/PatientInfoFields";
import { ChevronDown, ChevronUp, User, Stethoscope, Activity, Scissors, Shield, FileSearch, ClipboardList, Trash2, Download, FileText, Undo2, Redo2, RotateCcw } from "lucide-react";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { formatDateOnly, formatDateDDMMYYYY, getLocalDateTimeValue } from "@/utils/dateFormatter";

interface RectalCancerFormProps {
  currentReport: any;
  updateRectalCancer: (section: string, field: string, value: any) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  onSave?: (section: string) => void;
  onClear?: (section: string) => void;
  onClearAll?: () => void;
  onUndo?: (section: string) => void;
  onRedo?: (section: string) => void;
  onExportPDF?: () => void;
  diagramElement?: React.ReactNode;
}

export const RectalCancerForm = ({
  currentReport,
  updateRectalCancer,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
  onSave,
  onClear,
  onClearAll,
  onUndo,
  onRedo,
  onExportPDF,
  diagramElement,
}: RectalCancerFormProps) => {
  const [expanded, setExpanded] = useState({
    basicData: true,
    operativeFindings: true,
    surgicalApproach: true,
    mobilizationResection: true,
    reconstruction: true,
    operativeEvents: true
  });

  

  // Helper function to check if Rectum is selected
  const isRectumSelected = () => {
    return currentReport.rectalCancer?.operationType?.type?.includes('Rectum');
  };

  const getPrimaryApproachList = () => {
    const current = currentReport.rectalCancer?.surgicalApproach?.primaryApproach;
    if (Array.isArray(current)) return current;
    return current ? [current] : [];
  };

  // Helper function to check if Colon is selected
  const isColonSelected = () => {
    return currentReport.rectalCancer?.operationType?.type?.includes('Colon');
  };

  // Helper function to check if neoadjuvant therapy is yes
  const isNeoadjuvantYes = () => {
    return currentReport.rectalCancer?.operationType?.neoadjuvantTreatment === 'Yes';
  };

  // Helper function to check if laparoscopic converted to open is selected
  const isLaparoscopicConverted = () => {
    return getPrimaryApproachList().includes('Laparoscopic Converted To Open');
  };

  // Helper function to check if trocar number should be shown
  const shouldShowTrocarNumber = () => {
    const approaches = getPrimaryApproachList();
    return approaches.some(approach => 
      approach === 'Laparoscopic' || approach === 'Laparoscopic Converted To Open' || approach === 'Robotic'
    );
  };

  // Helper function to check if anastomosis is selected
  const isAnastomosisSelected = () => {
    const types = currentReport.rectalCancer?.reconstruction?.reconstructionType;
    return Array.isArray(types) ? types.includes('Anastomosis') : types === 'Anastomosis';
  };

  // Helper function to check if stoma is selected
  const isStomaSelected = () => {
    const types = currentReport.rectalCancer?.reconstruction?.reconstructionType;
    return Array.isArray(types) ? types.includes('Stoma') : types === 'Stoma';
  };

  // Helper function to check if other reconstruction is selected
  const isOtherReconstructionSelected = () => {
    const types = currentReport.rectalCancer?.reconstruction?.reconstructionType;
    return Array.isArray(types) ? types.includes('Other') : types === 'Other';
  };

  // Helper function to check if suture technique is selected
  const isSutureSelected = () => {
    return currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.technique === 'Suture';
  };

  // Helper function to check if stapled technique is selected
  const isStapledSelected = () => {
    return currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.technique === 'Stapled';
  };

  // Helper function to check if drain insertion is yes
  const isDrainInserted = () => {
    return currentReport.rectalCancer?.operativeEvents?.drainInsertion === 'Yes';
  };

  // Helper function to check if anal canal is selected for distal transection
  const isAnalCanalSelected = () => {
    const distalTransection = currentReport.rectalCancer?.mobilizationAndResection?.distalTransection;
    return Array.isArray(distalTransection) 
      ? distalTransection.includes('Anal Canal')
      : distalTransection === 'Anal Canal';
  };

  // Helper function to check if specimen extraction is not none
  const isSpecimenExtractionNotNone = () => {
    const extraction = currentReport.rectalCancer?.operativeEvents?.specimenExtraction;
    return extraction && extraction !== 'None';
  };

  // Helper function to check if any fascial closure is selected
  const isFascialClosureSelected = () => {
    return currentReport.rectalCancer?.closure?.fascialClosure?.length > 0;
  };

  // Helper function to check if any skin closure is selected
  const isSkinClosureSelected = () => {
    return currentReport.rectalCancer?.closure?.skinClosure?.length > 0;
  };

  // Helper function to calculate duration in minutes between two times
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '';
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight procedures (end time is next day)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    const durationMinutes = endMinutes - startMinutes;
    return durationMinutes.toString();
  };

  // Handle time changes with automatic duration calculation
  const handleTimeChange = (timeField: 'startTime' | 'endTime', value: string) => {
    // Update the time field first
    updateRectalCancer('procedureDetails', timeField, value);
    
    // Get current values after update
    const currentData = currentReport.rectalCancer?.procedureDetails || {};
    const startTime = timeField === 'startTime' ? value : currentData.startTime;
    const endTime = timeField === 'endTime' ? value : currentData.endTime;
    
    // Auto-calculate duration if both times are present
    if (startTime && endTime) {
      const calculatedDuration = calculateDuration(startTime, endTime);
      if (calculatedDuration) {
        updateRectalCancer('procedureDetails', 'duration', calculatedDuration);
      }
    }
  };

  // Helper function to check if material used section should be shown for skin closure
  const shouldShowSkinMaterial = () => {
    const skinClosures = currentReport.rectalCancer?.closure?.skinClosure || [];
    const excludedClosures = ['Staples', 'Tissue Glue', 'Adhesive Strips'];
    return skinClosures.some(closure => !excludedClosures.includes(closure));
  };

  const operationFindingsOptions = [
    'Cancer',
    'Trauma',
    'Diverticulitis',
    'Inflammatory Bowel Disease',
    'Ischemic Colitis',
    'Sigmoid Valvulus',
    'Hereditary Cancer Syndromes',
    'Polyposis Syndromes',
    'Other'
  ];

  const getOperationFindingsList = () => {
    return currentReport.rectalCancer?.operationType?.operationFindingsOptions || [];
  };

  const renderOperationFindingsFields = () => (
    <>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Operation Findings:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
          {operationFindingsOptions.map((findingOption) => (
            <div className="flex items-center" key={`operation-finding-${findingOption}`}>
              <Checkbox
                id={`operation-finding-${findingOption}`}
                checked={getOperationFindingsList().includes(findingOption)}
                onCheckedChange={(checked) => {
                  const current = getOperationFindingsList();
                  const updated = checked
                    ? Array.from(new Set([...current, findingOption]))
                    : current.filter((item) => item !== findingOption);
                  updateRectalCancer('operationType', 'operationFindingsOptions', updated);
                }}
              />
              <label htmlFor={`operation-finding-${findingOption}`} className="ml-2 text-sm">
                {findingOption}
              </label>
            </div>
          ))}
        </div>

        {getOperationFindingsList().includes('Other') && (
          <div className="mt-3 ml-4">
            <Input
              type="text"
              placeholder="Specify other operation finding"
              value={currentReport.rectalCancer?.operationType?.operationFindingsOther || ''}
              onChange={(e) => updateRectalCancer('operationType', 'operationFindingsOther', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <label className="text-gray-800 font-medium mb-2 block">Description of Operation Findings:</label>
        <Textarea
          placeholder="Enter Operation Findings"
          value={currentReport.rectalCancer?.operationType?.operationFindings || ''}
          onChange={(e) => updateRectalCancer('operationType', 'operationFindings', e.target.value)}
          className="w-full"
        />
      </div>
    </>
  );

  const updatePatientInfoFields = (updates: Record<string, any>) => {
    Object.entries(updates).forEach(([field, value]) => {
      updateRectalCancer("patientInfo", field, value);
    });
  };

  return (
    <div className="space-y-6">
      {/* SECTION I: Basic Data & Preoperative Assessment */}
      <Collapsible
        open={expanded.basicData}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, basicData: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-red-600" />
                    SECTION I: Basic Data & Preoperative Assessment
                  </div>
                  {expanded.basicData ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo('patientInfo')}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo('patientInfo')}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear('patientInfo')}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Patient Information</h3>
                <PatientInfoFields
                  patientInfo={currentReport.rectalCancer.patientInfo}
                  onFieldChange={(field, value) => updateRectalCancer("patientInfo", field, value)}
                  onBulkUpdate={updatePatientInfoFields}
                  currentExtractedPatientInfo={currentExtractedPatientInfo}
                  onCurrentPatientChange={onCurrentPatientChange}
                />
              </div>

              {/* ASA Classification */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">ASA Physical Status Classification</h3>
                <ASAClassificationSection
                  selectedASA={currentReport.rectalCancer.patientInfo?.asaScore || ''}
                  onASAChange={(value) => updateRectalCancer('patientInfo', 'asaScore', value)}
                  notes={currentReport.rectalCancer.patientInfo?.asaNotes || ''}
                  onNotesChange={(value) => updateRectalCancer('patientInfo', 'asaNotes', value)}
                  showNotes={true}
                />
              </div>

              {/* Surgical Team */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Surgical Team</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Surgeon:</label>
                    <div className="space-y-2">
                      {(currentReport.rectalCancer?.surgicalTeam?.surgeons || ['']).map((surgeon, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input 
                            type="text" 
                            placeholder="Enter Surgeon Name" 
                            className="flex-1" 
                            value={surgeon}
                            onChange={(e) => {
                              const newSurgeons = [...(currentReport.rectalCancer?.surgicalTeam?.surgeons || [''])];
                              newSurgeons[index] = e.target.value;
                              updateRectalCancer('surgicalTeam', 'surgeons', newSurgeons);
                            }}
                          />
                          {index === (currentReport.rectalCancer?.surgicalTeam?.surgeons || ['']).length - 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-1"
                              onClick={() => {
                                const currentSurgeons = currentReport.rectalCancer?.surgicalTeam?.surgeons || [''];
                                const newSurgeons = [...currentSurgeons, ''];
                                updateRectalCancer('surgicalTeam', 'surgeons', newSurgeons);
                              }}
                            >
                              +
                            </Button>
                          )}
                          {(currentReport.rectalCancer?.surgicalTeam?.surgeons || ['']).length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                              onClick={() => {
                                const currentSurgeons = currentReport.rectalCancer?.surgicalTeam?.surgeons || [''];
                                const newSurgeons = currentSurgeons.filter((_, i) => i !== index);
                                updateRectalCancer('surgicalTeam', 'surgeons', newSurgeons);
                              }}
                            >
                              −
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Assistant:</label>
                    <div className="space-y-2">
                      {(currentReport.rectalCancer?.surgicalTeam?.assistants || ['']).map((assistant, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input 
                            className="flex-1"
                            type="text" 
                            placeholder="Enter Assistant Name" 
                            value={assistant}
                            onChange={(e) => {
                              const newAssistants = [...(currentReport.rectalCancer?.surgicalTeam?.assistants || [''])];
                              newAssistants[index] = e.target.value;
                              updateRectalCancer('surgicalTeam', 'assistants', newAssistants);
                            }}
                          />
                          {index === (currentReport.rectalCancer?.surgicalTeam?.assistants || ['']).length - 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-1"
                              onClick={() => {
                                const currentAssistants = currentReport.rectalCancer?.surgicalTeam?.assistants || [''];
                                const newAssistants = [...currentAssistants, ''];
                                updateRectalCancer('surgicalTeam', 'assistants', newAssistants);
                              }}
                            >
                              +
                            </Button>
                          )}
                          {(currentReport.rectalCancer?.surgicalTeam?.assistants || ['']).length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                              onClick={() => {
                                const currentAssistants = currentReport.rectalCancer?.surgicalTeam?.assistants || [''];
                                const newAssistants = currentAssistants.filter((_, i) => i !== index);
                                updateRectalCancer('surgicalTeam', 'assistants', newAssistants);
                              }}
                            >
                              −
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Anaesthetist:</label>
                    <div className="space-y-2">
                      {(currentReport.rectalCancer?.surgicalTeam?.anaesthetists || ['']).map((anaesthetist, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input 
                            type="text" 
                            placeholder="Enter Anaesthetist Name" 
                            className="flex-1" 
                            value={anaesthetist}
                            onChange={(e) => {
                              const newAnaesthetists = [...(currentReport.rectalCancer?.surgicalTeam?.anaesthetists || [''])];
                              newAnaesthetists[index] = e.target.value;
                              updateRectalCancer('surgicalTeam', 'anaesthetists', newAnaesthetists);
                            }}
                          />
                          {index === (currentReport.rectalCancer?.surgicalTeam?.anaesthetists || ['']).length - 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-1"
                              onClick={() => {
                                const currentAnaesthetists = currentReport.rectalCancer?.surgicalTeam?.anaesthetists || [''];
                                const newAnaesthetists = [...currentAnaesthetists, ''];
                                updateRectalCancer('surgicalTeam', 'anaesthetists', newAnaesthetists);
                              }}
                            >
                              +
                            </Button>
                          )}
                          {(currentReport.rectalCancer?.surgicalTeam?.anaesthetists || ['']).length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                              onClick={() => {
                                const currentAnaesthetists = currentReport.rectalCancer?.surgicalTeam?.anaesthetists || [''];
                                const newAnaesthetists = currentAnaesthetists.filter((_, i) => i !== index);
                                updateRectalCancer('surgicalTeam', 'anaesthetists', newAnaesthetists);
                              }}
                            >
                              −
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Procedure Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Procedure Details</h3>
                <div className="space-y-4">
                  
                  {/* Indication for Surgery */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Indication for Surgery:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {operationFindingsOptions.map((findingOption) => (
                        <div className="flex items-center" key={`preop-indication-${findingOption}`}>
                          <Checkbox
                            id={`preop-indication-${findingOption}`}
                            checked={getOperationFindingsList().includes(findingOption)}
                            onCheckedChange={(checked) => {
                              const current = getOperationFindingsList();
                              const updated = checked
                                ? Array.from(new Set([...current, findingOption]))
                                : current.filter((item) => item !== findingOption);
                              updateRectalCancer('operationType', 'operationFindingsOptions', updated);
                            }}
                          />
                          <label htmlFor={`preop-indication-${findingOption}`} className="ml-2 text-sm">{findingOption}</label>
                        </div>
                      ))}
                    </div>
                    {getOperationFindingsList().includes('Other') && (
                      <div className="mt-3 ml-4">
                        <Input
                          type="text"
                          placeholder="Specify other indication"
                          value={currentReport.rectalCancer?.operationType?.operationFindingsOther || ''}
                          onChange={(e) => updateRectalCancer('operationType', 'operationFindingsOther', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Operation Description */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Operation Description:</p>
                    <Textarea
                      placeholder="Enter Operation Description"
                      value={currentReport.rectalCancer?.operationType?.operationFindings || ''}
                      onChange={(e) => updateRectalCancer('operationType', 'operationFindings', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Procedure Urgency:</p>
                    <div className="flex flex-wrap gap-4 ml-4">
                      {['Emergency', 'Semi-Emergency', 'Semi - Elective', 'Elective'].map(urgency => (
                        <div className="flex items-center" key={`urgency-${urgency}`}>
                          <Checkbox 
                            id={`urgency-${urgency}`}
                            checked={currentReport.rectalCancer?.procedureDetails?.procedureUrgency === urgency}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('procedureDetails', 'procedureUrgency', checked ? urgency : '');
                            }}
                          />
                          <label htmlFor={`urgency-${urgency}`} className="ml-2 text-sm">{urgency}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preoperative Imaging */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Preoperative Imaging:</p>
                    <div className="flex flex-wrap gap-4 ml-4">
                      {['None', 'Ultrasound', 'CT Scan', 'MRI', 'Other'].map(imaging => (
                        <div className="flex items-center" key={`imaging-${imaging}`}>
                          <Checkbox 
                            id={`imaging-${imaging}`}
                            checked={currentReport.rectalCancer?.procedureDetails?.preoperativeImaging?.includes(imaging) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.procedureDetails?.preoperativeImaging || [];
                              const updated = checked 
                                ? [...current, imaging]
                                : current.filter(i => i !== imaging);
                              updateRectalCancer('procedureDetails', 'preoperativeImaging', updated);
                            }}
                          />
                          <label htmlFor={`imaging-${imaging}`} className="ml-2 text-sm">{imaging}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.procedureDetails?.preoperativeImaging?.includes('Other') && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify other imaging" 
                          value={currentReport.rectalCancer?.procedureDetails?.preoperativeImagingOther || ''}
                          onChange={(e) => updateRectalCancer('procedureDetails', 'preoperativeImagingOther', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Duration of Operation */}
                  <div>
                    <h4 className="text-gray-800 font-medium mb-3">Duration of Operation:</h4>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="text-gray-700 text-sm mb-1 block">Start Time:</label>
                        <Input 
                          type="time" 
                          placeholder="__:__" 
                          value={currentReport.rectalCancer?.procedureDetails?.startTime || ''}
                          onChange={(e) => handleTimeChange('startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm mb-1 block">End Time:</label>
                        <Input 
                          type="time" 
                          placeholder="__:__" 
                          value={currentReport.rectalCancer?.procedureDetails?.endTime || ''}
                          onChange={(e) => handleTimeChange('endTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm mb-1 block">Total Duration (Mins):</label>
                        <Input 
                          type="number" 
                          placeholder="Auto-calculated or enter manually" 
                          value={currentReport.rectalCancer?.procedureDetails?.duration || ''}
                          onChange={(e) => updateRectalCancer('procedureDetails', 'duration', e.target.value)}
                        />
                        {currentReport.rectalCancer?.procedureDetails?.startTime && 
                         currentReport.rectalCancer?.procedureDetails?.endTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-calculated from start/end times
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Neoadjuvant Treatment */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Neoadjuvant Treatment:</p>
                    <div className="flex gap-6 ml-4">
                      {['Yes', 'No'].map(treatment => (
                        <div className="flex items-center" key={`neoadjuvant-${treatment}`}>
                          <Checkbox 
                            id={`neoadjuvant-${treatment}`}
                            checked={currentReport.rectalCancer?.operationType?.neoadjuvantTreatment === treatment}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('operationType', 'neoadjuvantTreatment', checked ? treatment : '');
                            }}
                          />
                          <label htmlFor={`neoadjuvant-${treatment}`} className="ml-2 text-sm">{treatment}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Neoadjuvant Details - Removed as requested */}
                </div>
              </div>

              {/* Operation Type */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Operation Type</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Operation Type:</p>
                    <div className="flex flex-wrap gap-6 ml-4">
                      {['Colon', 'Rectum'].map(operation => (
                        <div className="flex items-center" key={`operation-${operation}`}>
                          <Checkbox 
                            id={`operation-${operation}`}
                            checked={currentReport.rectalCancer?.operationType?.type?.includes(operation) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.operationType?.type || [];
                              const updated = checked 
                                ? [...current, operation]
                                : current.filter(i => i !== operation);
                              updateRectalCancer('operationType', 'type', updated);
                            }}
                          />
                          <label htmlFor={`operation-${operation}`} className="ml-2 text-sm font-medium">{operation}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Rectum Operation Types */}
                  {isRectumSelected() && (
                    <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                      {renderOperationFindingsFields()}

                      <p className="text-sm font-medium text-gray-700 mb-3">Rectum Operation Types:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'High Anterior Resection',
                          'Low Anterior Resection',
                          'Intersphincteric Resection',
                          'Abdominoperineal Resection',
                          'Local Excision',
                          'Other'
                        ].map(rectumOp => (
                          <div className="flex items-center" key={`rectum-${rectumOp}`}>
                            <Checkbox 
                              id={`rectum-${rectumOp}`}
                              checked={currentReport.rectalCancer?.operationType?.rectumOperationType?.includes(rectumOp) || false}
                              onCheckedChange={(checked) => {
                                const current = currentReport.rectalCancer?.operationType?.rectumOperationType || [];
                                const updated = checked 
                                  ? [...current, rectumOp]
                                  : current.filter(i => i !== rectumOp);
                                updateRectalCancer('operationType', 'rectumOperationType', updated);
                              }}
                            />
                            <label htmlFor={`rectum-${rectumOp}`} className="ml-2 text-sm">{rectumOp}</label>
                          </div>
                        ))}
                      </div>
                      
                      {currentReport.rectalCancer?.operationType?.rectumOperationType?.includes('Other') && (
                        <div className="mt-3">
                          <Input 
                            type="text" 
                            placeholder="Specify other rectum operation type" 
                            value={currentReport.rectalCancer?.operationType?.rectumOperationOther || ''}
                            onChange={(e) => updateRectalCancer('operationType', 'rectumOperationOther', e.target.value)}
                          />
                        </div>
                      )}


                      {/* Findings */}
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Findings:</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-700">Description:</label>
                            <Textarea 
                              placeholder="Enter findings description" 
                              className="mt-1"
                              value={currentReport.rectalCancer?.findings?.description || ''}
                              onChange={(e) => updateRectalCancer('findings', 'description', e.target.value)}
                            />
                          </div>
                          
                          {/* Tumor Classification - Hidden when Rectum is selected */}
                          {!isRectumSelected() && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Tumor Classification:</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">T Classification:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.findings?.tClassification || ''}
                                    onChange={(e) => updateRectalCancer('findings', 'tClassification', e.target.value)}
                                  >
                                    <option value="">Select T stage</option>
                                    <option value="T1">T1</option>
                                    <option value="T2">T2</option>
                                    <option value="T3">T3</option>
                                    <option value="T4a">T4a</option>
                                    <option value="T4b">T4b</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">N Classification:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.findings?.nClassification || ''}
                                    onChange={(e) => updateRectalCancer('findings', 'nClassification', e.target.value)}
                                  >
                                    <option value="">Select N stage</option>
                                    <option value="N0">N0</option>
                                    <option value="N1a">N1a</option>
                                    <option value="N1b">N1b</option>
                                    <option value="N1c">N1c</option>
                                    <option value="N2a">N2a</option>
                                    <option value="N2b">N2b</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">M Classification:</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={currentReport.rectalCancer?.findings?.mClassification || ''}
                                    onChange={(e) => updateRectalCancer('findings', 'mClassification', e.target.value)}
                                  >
                                    <option value="">Select M stage</option>
                                    <option value="M0">M0</option>
                                    <option value="M1a">M1a</option>
                                    <option value="M1b">M1b</option>
                                    <option value="M1c">M1c</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Location */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
                            <div className="flex flex-wrap gap-4 ml-4">
                              {['Upper Third', 'Middle Third', 'Lower Third'].map(location => (
                                <div className="flex items-center" key={`location-${location}`}>
                                  <Checkbox 
                                    id={`location-${location}`}
                                    checked={currentReport.rectalCancer?.findings?.location?.includes(location) || false}
                                    onCheckedChange={(checked) => {
                                      const current = currentReport.rectalCancer?.findings?.location || [];
                                      const updated = checked 
                                        ? [...current, location]
                                        : current.filter(i => i !== location);
                                      updateRectalCancer('findings', 'location', updated);
                                    }}
                                  />
                                  <label htmlFor={`location-${location}`} className="ml-2 text-sm">{location}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Mesorectal Completeness */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Mesorectal Completeness:</p>
                            <div className="flex flex-wrap gap-4 ml-4">
                              {['Complete', 'Near Complete', 'Incomplete'].map(completeness => (
                                <div className="flex items-center" key={`mesorectal-${completeness}`}>
                                  <Checkbox 
                                    id={`mesorectal-${completeness}`}
                                    checked={currentReport.rectalCancer?.findings?.mesorectalCompleteness === completeness}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('findings', 'mesorectalCompleteness', checked ? completeness : '');
                                    }}
                                  />
                                  <label htmlFor={`mesorectal-${completeness}`} className="ml-2 text-sm">{completeness}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Completeness of Tumour Resection */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Completeness of Tumour Resection:</p>
                            <div className="flex flex-wrap gap-4 ml-4">
                              {['R0 (Complete)', 'R1 (Microscopic Residual)', 'R2 (Macroscopic Residual)'].map(resection => (
                                <div className="flex items-center" key={`resection-${resection}`}>
                                  <Checkbox 
                                    id={`resection-${resection}`}
                                    checked={currentReport.rectalCancer?.findings?.completenessOfTumourResection === resection}
                                    onCheckedChange={(checked) => {
                                      updateRectalCancer('findings', 'completenessOfTumourResection', checked ? resection : '');
                                    }}
                                  />
                                  <label htmlFor={`resection-${resection}`} className="ml-2 text-sm">{resection}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conditional Operation Findings for Colon */}
                  {isColonSelected() && !isRectumSelected() && (
                    <div className="mt-4">
                      {renderOperationFindingsFields()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION II: Operative Findings & Anatomical Reference */}
      <Collapsible
        open={expanded.operativeFindings}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, operativeFindings: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <FileSearch className="h-5 w-5 text-red-600" />
                    SECTION II: Surgical Approach
                  </div>
                  {expanded.operativeFindings ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo('surgicalApproach')}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo('surgicalApproach')}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear('surgicalApproach')}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Primary Approach */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Primary Approach:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Open',
                    'Laparoscopic',
                    'Laparoscopic Converted To Open',
                    'Laparoscopic Hand Assisted',
                    'TAMIS (Transanal Minimally Invasive Surgery)',
                    'TEO (Transanal Endoscopic Operation)',
                    'TEM (Transanal Endoscopic Microsurgery)',
                    'Robotic',
                    'Other'
                  ].map(approach => (
                    <div className="flex items-center" key={`approach-${approach}`}>
                      <Checkbox 
                        id={`approach-${approach}`}
                        checked={getPrimaryApproachList().includes(approach)}
                        onCheckedChange={(checked) => {
                          const current = getPrimaryApproachList();
                          const updated = checked 
                            ? Array.from(new Set([...current, approach]))
                            : current.filter(item => item !== approach);
                          updateRectalCancer('surgicalApproach', 'primaryApproach', updated);
                        }}
                      />
                      <label htmlFor={`approach-${approach}`} className="ml-2 text-sm">{approach}</label>
                    </div>
                  ))}
                </div>
                
                {getPrimaryApproachList().includes('Other') && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other approach" 
                      value={currentReport.rectalCancer?.surgicalApproach?.primaryApproachOther || ''}
                      onChange={(e) => updateRectalCancer('surgicalApproach', 'primaryApproachOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Conversion Reason (Conditional) */}
              {isLaparoscopicConverted() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                  <p className="text-sm font-medium text-gray-700 mb-3">Reason for Conversion:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Adhesions',
                      'Vascular Injury',
                      'Difficult Visualization',
                      'Failure to Progress',
                      'Visceral Injury',
                      'Difficult Exposure',
                      'Bleeding',
                      'Other'
                    ].map(reason => (
                      <div className="flex items-center" key={`conversion-${reason}`}>
                        <Checkbox 
                          id={`conversion-${reason}`}
                          checked={currentReport.rectalCancer?.surgicalApproach?.conversionReason?.includes(reason) || false}
                          onCheckedChange={(checked) => {
                            const current = currentReport.rectalCancer?.surgicalApproach?.conversionReason || [];
                            const updated = checked 
                              ? [...current, reason]
                              : current.filter(i => i !== reason);
                            updateRectalCancer('surgicalApproach', 'conversionReason', updated);
                          }}
                        />
                        <label htmlFor={`conversion-${reason}`} className="ml-2 text-sm">{reason}</label>
                      </div>
                    ))}
                  </div>
                  
                  {currentReport.rectalCancer?.surgicalApproach?.conversionReason?.includes('Other') && (
                    <div className="mt-3">
                      <Input 
                        type="text" 
                        placeholder="Specify Other Conversion Reason" 
                        value={currentReport.rectalCancer?.surgicalApproach?.conversionReasonOther || ''}
                        onChange={(e) => updateRectalCancer('surgicalApproach', 'conversionReasonOther', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Trocar Number (Conditional) */}
              {shouldShowTrocarNumber() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Trocar Number:</label>
                    <Input 
                      type="text" 
                      placeholder="Enter trocar number" 
                      value={currentReport.rectalCancer?.surgicalApproach?.trocarNumber || ''}
                      onChange={(e) => updateRectalCancer('surgicalApproach', 'trocarNumber', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION III: Access and Ports */}
      <Collapsible
        open={expanded.surgicalApproach}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, surgicalApproach: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-red-600" />
                    SECTION III: Access and Ports
                  </div>
                  {expanded.surgicalApproach ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Access and Ports */}
              {diagramElement && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Access and Ports</h4>
                  <p className="text-sm text-gray-600 mb-4">Access and Ports - Mark Ports, Stomas, and Incisions on the diagram below.</p>
                  {diagramElement}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION IV: Mobilization and Resection */}
      <Collapsible
        open={expanded.mobilizationResection}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, mobilizationResection: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-red-600" />
                    SECTION IV: Mobilization and Resection
                  </div>
                  {expanded.mobilizationResection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo('mobilizationAndResection')}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo('mobilizationAndResection')}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear('mobilizationAndResection')}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Extent of Mobilization */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Extent of Mobilization [Check all that apply]:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Caecum',
                    'Ascending Colon',
                    'Hepatic Flexure',
                    'Splenic Flexure',
                    'Descending Colon',
                    'Sigmoid Colon',
                    'Rectum',
                    'Other'
                  ].map(extent => (
                    <div className="flex items-center" key={`extent-${extent}`}>
                      <Checkbox 
                        id={`extent-${extent}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.extentOfMobilization?.includes(extent) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.mobilizationAndResection?.extentOfMobilization || [];
                          const updated = checked 
                            ? [...current, extent]
                            : current.filter(i => i !== extent);
                          updateRectalCancer('mobilizationAndResection', 'extentOfMobilization', updated);
                        }}
                      />
                      <label htmlFor={`extent-${extent}`} className="ml-2 text-sm">{extent}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.mobilizationAndResection?.extentOfMobilization?.includes('Other') && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other extent of mobilization" 
                      value={currentReport.rectalCancer?.mobilizationAndResection?.extentOfMobilizationOther || ''}
                      onChange={(e) => updateRectalCancer('mobilizationAndResection', 'extentOfMobilizationOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Vessel Ligation */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Vessel Ligation [Check all that apply]:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Ileocolic',
                    'Left Colic',
                    'Right Colic',
                    'Middle Colic Artery (Trunk)',
                    'Right Branch of Middle Colic Artery',
                    'Left Branch of Middle Colic Artery',
                    'Inferior Mesenteric Artery (High Ligation)',
                    'Inferior Mesenteric Artery (Low Ligation)',
                    'Other'
                  ].map(vessel => (
                    <div className="flex items-center" key={`vessel-${vessel}`}>
                      <Checkbox 
                        id={`vessel-${vessel}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.vesselLigation?.includes(vessel) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.mobilizationAndResection?.vesselLigation || [];
                          const updated = checked 
                            ? [...current, vessel]
                            : current.filter(i => i !== vessel);
                          updateRectalCancer('mobilizationAndResection', 'vesselLigation', updated);
                        }}
                      />
                      <label htmlFor={`vessel-${vessel}`} className="ml-2 text-sm">{vessel}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.mobilizationAndResection?.vesselLigation?.includes('Other') && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other vessel ligation" 
                      value={currentReport.rectalCancer?.mobilizationAndResection?.vesselLigationOther || ''}
                      onChange={(e) => updateRectalCancer('mobilizationAndResection', 'vesselLigationOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Inferior Mesenteric Vein Ligation */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Inferior Mesenteric Vein Ligation:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {['None', 'High', 'Low'].map(ligation => (
                    <div className="flex items-center" key={`imv-${ligation}`}>
                      <Checkbox 
                        id={`imv-${ligation}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.imvLigation === ligation}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('mobilizationAndResection', 'imvLigation', checked ? ligation : '');
                        }}
                      />
                      <label htmlFor={`imv-${ligation}`} className="ml-2 text-sm">{ligation}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vessel Hemostasis Technique */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Vessel Hemostasis Technique [Check all that apply]:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Ligaclips',
                    'Hemoloc',
                    'Diathermy',
                    'Ultrasonic Device (eg. Harmonic scalpel)',
                    'Vessel Sealer (eg. Ligasure)',
                    'Suture Ligation',
                    'Other'
                  ].map(technique => (
                    <div className="flex items-center" key={`hemostasis-${technique}`}>
                      <Checkbox 
                        id={`hemostasis-${technique}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.hemostasisTechnique?.includes(technique) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.mobilizationAndResection?.hemostasisTechnique || [];
                          const updated = checked 
                            ? [...current, technique]
                            : current.filter(i => i !== technique);
                          updateRectalCancer('mobilizationAndResection', 'hemostasisTechnique', updated);
                        }}
                      />
                      <label htmlFor={`hemostasis-${technique}`} className="ml-2 text-sm">{technique}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.mobilizationAndResection?.hemostasisTechnique?.includes('Other') && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other hemostasis technique" 
                      value={currentReport.rectalCancer?.mobilizationAndResection?.hemostasisTechniqueOther || ''}
                      onChange={(e) => updateRectalCancer('mobilizationAndResection', 'hemostasisTechniqueOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Lymph Node Dissection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Lymph Node Dissection (LND):</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {['D1', 'D2', 'D3', 'Other'].map(lnd => (
                    <div className="flex items-center" key={`lnd-${lnd}`}>
                      <Checkbox 
                        id={`lnd-${lnd}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.lymphNodeDissection === lnd}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('mobilizationAndResection', 'lymphNodeDissection', checked ? lnd : '');
                        }}
                      />
                      <label htmlFor={`lnd-${lnd}`} className="ml-2 text-sm">{lnd}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.mobilizationAndResection?.lymphNodeDissection === 'Other' && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other LND" 
                      value={currentReport.rectalCancer?.mobilizationAndResection?.lymphNodeDissectionOther || ''}
                      onChange={(e) => updateRectalCancer('mobilizationAndResection', 'lymphNodeDissectionOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Proximal Transection Site */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Proximal Transection Site:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Ileum',
                    'Ascending Colon',
                    'Transverse Colon',
                    'Descending colon',
                    'Sigmoid Colon',
                    'Proximal Rectum',
                    'Mid Rectum',
                    'Distal Rectum'
                  ].map(site => (
                    <div className="flex items-center" key={`proximal-${site}`}>
                      <Checkbox 
                        id={`proximal-${site}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.proximalTransection?.includes(site) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.mobilizationAndResection?.proximalTransection || [];
                          const updated = checked 
                            ? [...current, site]
                            : current.filter(i => i !== site);
                          updateRectalCancer('mobilizationAndResection', 'proximalTransection', updated);
                        }}
                      />
                      <label htmlFor={`proximal-${site}`} className="ml-2 text-sm">{site}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distal Transection Site */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Distal Transection Site:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Ascending Colon',
                    'Transverse Colon',
                    'Descending Colon',
                    'Sigmoid',
                    'Proximal Rectum',
                    'Mid Rectum',
                    'Distal Rectum',
                    'Perineal Resection',
                    'Anal Canal'
                  ].map(site => (
                    <div className="flex items-center" key={`distal-${site}`}>
                      <Checkbox 
                        id={`distal-${site}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.distalTransection?.includes(site) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.mobilizationAndResection?.distalTransection || [];
                          const updated = checked 
                            ? [...current, site]
                            : current.filter(i => i !== site);
                          updateRectalCancer('mobilizationAndResection', 'distalTransection', updated);
                        }}
                      />
                      <label htmlFor={`distal-${site}`} className="ml-2 text-sm">{site}</label>
                    </div>
                  ))}
                </div>

                {/* Anal Canal Transection Level (Conditional) */}
                {isAnalCanalSelected() && (
                  <div className="mt-3 ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-3">Anal Canal Transection Level:</p>
                    <div className="space-y-2">
                      {[
                        'Anorectal Junction',
                        'Partial Inter-Sphincteric',
                        'Complete Inter-Sphincteric',
                        'Mucosal Resection',
                        'Other'
                      ].map(level => (
                        <div className="flex items-center" key={`anal-${level}`}>
                          <Checkbox 
                            id={`anal-${level}`}
                            checked={currentReport.rectalCancer?.mobilizationAndResection?.analCanalTransection?.includes(level) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.mobilizationAndResection?.analCanalTransection || [];
                              const updated = checked 
                                ? [...current, level]
                                : current.filter(i => i !== level);
                              updateRectalCancer('mobilizationAndResection', 'analCanalTransection', updated);
                            }}
                          />
                          <label htmlFor={`anal-${level}`} className="ml-2 text-sm">{level}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.mobilizationAndResection?.analCanalTransection?.includes('Other') && (
                      <div className="mt-3">
                        <Input 
                          type="text" 
                          placeholder="Please Specify" 
                          value={currentReport.rectalCancer?.mobilizationAndResection?.analCanalTransectionOther || ''}
                          onChange={(e) => updateRectalCancer('mobilizationAndResection', 'analCanalTransectionOther', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Excised En-Bloc resection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Excised En-Bloc Resection: [Check if removed with Primary Specimen]</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'None',
                    'Small Bowel',
                    'Large Bowel',
                    'Bladder',
                    'Uterus',
                    'Abdomen Wall',
                    'Other'
                  ].map(organ => (
                    <div className="flex items-center" key={`enbloc-${organ}`}>
                      <Checkbox 
                        id={`enbloc-${organ}`}
                        checked={currentReport.rectalCancer?.mobilizationAndResection?.enBlocResection?.includes(organ) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.mobilizationAndResection?.enBlocResection || [];
                          const updated = checked 
                            ? [...current, organ]
                            : current.filter(i => i !== organ);
                          updateRectalCancer('mobilizationAndResection', 'enBlocResection', updated);
                        }}
                      />
                      <label htmlFor={`enbloc-${organ}`} className="ml-2 text-sm">{organ}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.mobilizationAndResection?.enBlocResection?.includes('Other') && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other en-bloc resection" 
                      value={currentReport.rectalCancer?.mobilizationAndResection?.enBlocResectionOther || ''}
                      onChange={(e) => updateRectalCancer('mobilizationAndResection', 'enBlocResectionOther', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION V: Reconstruction */}
      <Collapsible
        open={expanded.reconstruction}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, reconstruction: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    SECTION V: Reconstruction
                  </div>
                  {expanded.reconstruction ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo('reconstruction')}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo('reconstruction')}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear('reconstruction')}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Reconstruction Type */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Reconstruction Type:</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {['Anastomosis', 'Stoma', 'Other'].map(type => (
                    <div className="flex items-center" key={`reconstruction-${type}`}>
                      <Checkbox 
                        id={`reconstruction-${type}`}
                        checked={(() => {
                          const current = currentReport.rectalCancer?.reconstruction?.reconstructionType;
                          return Array.isArray(current) ? current.includes(type) : current === type;
                        })()}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.reconstruction?.reconstructionType;
                          let updated;
                          
                          if (Array.isArray(current)) {
                            updated = checked 
                              ? [...current, type]
                              : current.filter(t => t !== type);
                          } else {
                            if (checked) {
                              updated = current ? [current, type] : [type];
                            } else {
                              updated = current === type ? [] : current;
                            }
                          }
                          
                          updateRectalCancer('reconstruction', 'reconstructionType', updated);
                        }}
                      />
                      <label htmlFor={`reconstruction-${type}`} className="ml-2 text-sm">{type}</label>
                    </div>
                  ))}
                </div>
                {isOtherReconstructionSelected() && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other reconstruction type" 
                      value={currentReport.rectalCancer?.reconstruction?.reconstructionOther || ''}
                      onChange={(e) => updateRectalCancer('reconstruction', 'reconstructionOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* ANASTOMOSIS Details (Conditional) */}
              {isAnastomosisSelected() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4">
                  <h4 className="font-medium text-gray-800">Anastomosis Details</h4>
                  
                  {/* Site of Anastomosis */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Site of Anastomosis:</p>
                    <div className="flex gap-4 ml-4">
                      {['Intracorporeal', 'Extracorporeal'].map(site => (
                        <div className="flex items-center" key={`site-${site}`}>
                          <Checkbox 
                            id={`site-${site}`}
                            checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.site === site}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                site: checked ? site : ''
                              });
                            }}
                          />
                          <label htmlFor={`site-${site}`} className="ml-2 text-sm">{site}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Configuration:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        'End-to-End',
                        'End-to-Side',
                        'Side-to-End',
                        'Side-to-Side (Reverse Peristalsis)',
                        'Side-to-Side (Isoperistaltic)',
                        'Other'
                      ].map(config => (
                        <div className="flex items-center" key={`config-${config}`}>
                          <Checkbox 
                            id={`config-${config}`}
                            checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.configuration === config}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                configuration: checked ? config : ''
                              });
                            }}
                          />
                          <label htmlFor={`config-${config}`} className="ml-2 text-sm">{config}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.configuration === 'Other' && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify other configuration" 
                          value={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.configurationOther || ''}
                          onChange={(e) => updateRectalCancer('reconstruction', 'anastomosisDetails', {
                            ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                            configurationOther: e.target.value
                          })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Anastomotic Technique */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Anastomotic Technique:</p>
                    <div className="flex gap-4 ml-4">
                      {['Suture', 'Stapled'].map(technique => (
                        <div className="flex items-center" key={`technique-${technique}`}>
                          <Checkbox 
                            id={`technique-${technique}`}
                            checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.technique === technique}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                technique: checked ? technique : ''
                              });
                            }}
                          />
                          <label htmlFor={`technique-${technique}`} className="ml-2 text-sm">{technique}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suture Material (Conditional) */}
                  {isSutureSelected() && (
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Suture Material:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {['PDS', 'Vicryl', 'Prolene', 'V-Loc', 'Other'].map(material => (
                          <div className="flex items-center" key={`suture-${material}`}>
                            <Checkbox 
                              id={`suture-${material}`}
                              checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.sutureMaterial?.includes(material) || false}
                              onCheckedChange={(checked) => {
                                const current = currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.sutureMaterial || [];
                                const updated = checked 
                                  ? [...current, material]
                                  : current.filter(i => i !== material);
                                updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                  ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                  sutureMaterial: updated
                                });
                              }}
                            />
                            <label htmlFor={`suture-${material}`} className="ml-2 text-sm">{material}</label>
                          </div>
                        ))}
                      </div>
                      {currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.sutureMaterial?.includes('Other') && (
                        <div className="mt-3 ml-4">
                          <Input 
                            type="text" 
                            placeholder="Specify other suture material" 
                            value={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.sutureMaterialOther || ''}
                            onChange={(e) => updateRectalCancer('reconstruction', 'anastomosisDetails', {
                              ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                              sutureMaterialOther: e.target.value
                            })}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stapler Sizes (Conditional) */}
                  {isStapledSelected() && (
                    <>
                      {/* Linear Stapler Sizes */}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Linear Stapler Sizes:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-4">
                          {['45mm', '60mm', '75mm', '80mm', '100mm', 'Other'].map(size => (
                            <div className="flex items-center" key={`linear-${size}`}>
                              <Checkbox 
                                id={`linear-${size}`}
                                checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.linearStaplerSize?.includes(size) || false}
                                onCheckedChange={(checked) => {
                                  const current = currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.linearStaplerSize || [];
                                  const updated = checked 
                                    ? [...current, size]
                                    : current.filter(i => i !== size);
                                  updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                    ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                    linearStaplerSize: updated
                                  });
                                }}
                              />
                              <label htmlFor={`linear-${size}`} className="ml-2 text-sm">{size}</label>
                            </div>
                          ))}
                        </div>
                        {currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.linearStaplerSize?.includes('Other') && (
                          <div className="mt-3 ml-4">
                            <Input 
                              type="text" 
                              placeholder="Specify other linear stapler size" 
                              value={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.linearStaplerSizeOther || ''}
                              onChange={(e) => updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                linearStaplerSizeOther: e.target.value
                              })}
                            />
                          </div>
                        )}
                      </div>

                      {/* Circular Stapler Sizes */}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Circular Stapler Sizes:</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 ml-4">
                          {['27mm', '28mm', '29mm', '30mm', '31mm', '32mm', '33mm', 'Other'].map(size => (
                            <div className="flex items-center" key={`circular-${size}`}>
                              <Checkbox 
                                id={`circular-${size}`}
                                checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.circularStaplerSize?.includes(size) || false}
                                onCheckedChange={(checked) => {
                                  const current = currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.circularStaplerSize || [];
                                  const updated = checked 
                                    ? [...current, size]
                                    : current.filter(i => i !== size);
                                  updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                    ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                    circularStaplerSize: updated
                                  });
                                }}
                              />
                              <label htmlFor={`circular-${size}`} className="ml-2 text-sm">{size}</label>
                            </div>
                          ))}
                        </div>
                        {currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.circularStaplerSize?.includes('Other') && (
                          <div className="mt-3 ml-4">
                            <Input 
                              type="text" 
                              placeholder="Specify other circular stapler size" 
                              value={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.circularStaplerSizeOther || ''}
                              onChange={(e) => updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                circularStaplerSizeOther: e.target.value
                              })}
                            />
                          </div>
                        )}
                      </div>

                      {/* Anastomotic Height */}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Anastomotic Height:</p>
                        <div className="flex gap-4 ml-4">
                          {['More than 5cm', 'Less than 5cm'].map(height => (
                            <div className="flex items-center" key={`height-${height}`}>
                              <Checkbox 
                                id={`height-${height}`}
                                checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.anastomoticHeight === height}
                                onCheckedChange={(checked) => {
                                  updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                    ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                    anastomoticHeight: checked ? height : ''
                                  });
                                }}
                              />
                              <label htmlFor={`height-${height}`} className="ml-2 text-sm">{height}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Doughnut Assessment */}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Doughnut Assessment:</p>
                        <div className="flex flex-wrap gap-4 ml-4">
                          {['Intact Proximally and Distally', 'Proximal Defect', 'Distal Defect'].map(assessment => (
                            <div className="flex items-center" key={`doughnut-${assessment}`}>
                              <Checkbox 
                                id={`doughnut-${assessment}`}
                                checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.doughnutAssessment === assessment}
                                onCheckedChange={(checked) => {
                                  updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                    ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                    doughnutAssessment: checked ? assessment : ''
                                  });
                                }}
                              />
                              <label htmlFor={`doughnut-${assessment}`} className="ml-2 text-sm">{assessment}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Air Leak Test */}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Air Leak Test:</p>
                        <div className="flex gap-4 ml-4">
                          {['No Leak', 'Leak Detected', 'Not Done'].map(test => (
                            <div className="flex items-center" key={`leak-${test}`}>
                              <Checkbox 
                                id={`leak-${test}`}
                                checked={currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.airLeakTest === test}
                                onCheckedChange={(checked) => {
                                  updateRectalCancer('reconstruction', 'anastomosisDetails', {
                                    ...currentReport.rectalCancer?.reconstruction?.anastomosisDetails,
                                    airLeakTest: checked ? test : ''
                                  });
                                }}
                              />
                              <label htmlFor={`leak-${test}`} className="ml-2 text-sm">{test}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Anastomotic Testing (Conditional for Rectum and Anastomosis) */}
              {isRectumSelected() && isAnastomosisSelected() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                  <h4 className="font-medium text-gray-800 mb-3">Anastomotic Testing</h4>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Indocyanine Green (ICG) Test:</p>
                    <div className="flex gap-4 ml-4">
                      {['Done', 'Not Done'].map(status => (
                        <div className="flex items-center" key={`icg-${status}`}>
                          <Checkbox 
                            id={`icg-${status}`}
                            checked={currentReport.rectalCancer?.reconstruction?.anastomoticTesting?.icgTest === status}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('reconstruction', 'anastomoticTesting', {
                                icgTest: checked ? status : ''
                              });
                            }}
                          />
                          <label htmlFor={`icg-${status}`} className="ml-2 text-sm">{status}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STOMA Details (Conditional) */}
              {isStomaSelected() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4">
                  <h4 className="font-medium text-gray-800">Stoma Details</h4>
                  
                  {/* Stoma Configuration */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Stoma Configuration:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {['Loop Ileostomy', 'End Ileostomy', 'Loop Colostomy', 'End Colostomy', 'Other'].map(config => (
                        <div className="flex items-center" key={`stoma-${config}`}>
                          <Checkbox 
                            id={`stoma-${config}`}
                            checked={currentReport.rectalCancer?.reconstruction?.stomaDetails?.configuration === config}
                            onCheckedChange={(checked) => {
                              updateRectalCancer('reconstruction', 'stomaDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.stomaDetails,
                                configuration: checked ? config : ''
                              });
                            }}
                          />
                          <label htmlFor={`stoma-${config}`} className="ml-2 text-sm">{config}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.reconstruction?.stomaDetails?.configuration === 'Other' && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify other stoma configuration" 
                          value={currentReport.rectalCancer?.reconstruction?.stomaDetails?.configurationOther || ''}
                          onChange={(e) => updateRectalCancer('reconstruction', 'stomaDetails', {
                            ...currentReport.rectalCancer?.reconstruction?.stomaDetails,
                            configurationOther: e.target.value
                          })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Reason for Stoma */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Reason for Stoma:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {['Surgical Difficulty', 'High Risk Anastomosis', 'Permanent Stoma', 'Diversion Stoma', 'Other'].map(reason => (
                        <div className="flex items-center" key={`reason-${reason}`}>
                          <Checkbox 
                            id={`reason-${reason}`}
                            checked={currentReport.rectalCancer?.reconstruction?.stomaDetails?.reasonForStoma?.includes(reason) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.reconstruction?.stomaDetails?.reasonForStoma || [];
                              const updated = checked 
                                ? [...current, reason]
                                : current.filter(i => i !== reason);
                              updateRectalCancer('reconstruction', 'stomaDetails', {
                                ...currentReport.rectalCancer?.reconstruction?.stomaDetails,
                                reasonForStoma: updated
                              });
                            }}
                          />
                          <label htmlFor={`reason-${reason}`} className="ml-2 text-sm">{reason}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.reconstruction?.stomaDetails?.reasonForStoma?.includes('Other') && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify other reason for stoma" 
                          value={currentReport.rectalCancer?.reconstruction?.stomaDetails?.reasonForStomaOther || ''}
                          onChange={(e) => updateRectalCancer('reconstruction', 'stomaDetails', {
                            ...currentReport.rectalCancer?.reconstruction?.stomaDetails,
                            reasonForStomaOther: e.target.value
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION VI: Operative Events & Closure */}
      <Collapsible
        open={expanded.operativeEvents}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, operativeEvents: open }))}
      >
        <Card className="glass-card-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <CardTitle className="flex items-center justify-between flex-1 cursor-pointer hover:bg-white/20 transition-colors p-2 -m-2 rounded">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-red-600" />
                    SECTION VI: Operative Events & Closure
                  </div>
                  {expanded.operativeEvents ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onUndo && onUndo('operativeEvents')}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRedo && onRedo('operativeEvents')}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onClear && onClear('operativeEvents')}
                  title="Clear Section"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Points of Difficulty */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Points of Difficulty [Check all that apply]:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'None',
                    'Adhesions',
                    'Fibrosis',
                    'Bleeding',
                    'Tumor Infiltration',
                    'Anatomy Exposure',
                    'Bowel Distension',
                    'Limited Operative Space',
                    'Equipment Problems',
                    'Anaesthetic Problems',
                    'Camera Handling',
                    'Assistant Retraction',
                    'Other'
                  ].map(difficulty => (
                    <div className="flex items-center" key={`difficulty-${difficulty}`}>
                      <Checkbox 
                        id={`difficulty-${difficulty}`}
                        checked={currentReport.rectalCancer?.operativeEvents?.pointsOfDifficulty?.includes(difficulty) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.operativeEvents?.pointsOfDifficulty || [];
                          const updated = checked 
                            ? [...current, difficulty]
                            : current.filter(i => i !== difficulty);
                          updateRectalCancer('operativeEvents', 'pointsOfDifficulty', updated);
                        }}
                      />
                      <label htmlFor={`difficulty-${difficulty}`} className="ml-2 text-sm">{difficulty}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.operativeEvents?.pointsOfDifficulty?.includes('Other') && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other difficulty" 
                      value={currentReport.rectalCancer?.operativeEvents?.pointsOfDifficultyOther || ''}
                      onChange={(e) => updateRectalCancer('operativeEvents', 'pointsOfDifficultyOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Intraoperative Events/Complications */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Intraoperative Events/Complications:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'None',
                    'Bowel Injury',
                    'Vascular Injury',
                    'Adjacent Organ Injury',
                    'Tumor Perforation',
                    'Bleeding',
                    'Stapler Malfunction',
                    'Anaesthetic Events',
                    'Other'
                  ].map(event => (
                    <div className="flex items-center" key={`event-${event}`}>
                      <Checkbox 
                        id={`event-${event}`}
                        checked={currentReport.rectalCancer?.operativeEvents?.intraoperativeEvents?.includes(event) || false}
                        onCheckedChange={(checked) => {
                          const current = currentReport.rectalCancer?.operativeEvents?.intraoperativeEvents || [];
                          const updated = checked 
                            ? [...current, event]
                            : current.filter(i => i !== event);
                          updateRectalCancer('operativeEvents', 'intraoperativeEvents', updated);
                        }}
                      />
                      <label htmlFor={`event-${event}`} className="ml-2 text-sm">
                        {event}
                        {event === 'Adjacent Organ Injury' && ' (Specify)'}
                        {event === 'Bleeding' && ' (Describe Management)'}
                        {event === 'Anaesthetic Events' && ' (Specify)'}
                      </label>
                    </div>
                  ))}
                </div>
                {(currentReport.rectalCancer?.operativeEvents?.intraoperativeEvents?.includes('Adjacent Organ Injury') ||
                  currentReport.rectalCancer?.operativeEvents?.intraoperativeEvents?.includes('Bleeding') ||
                  currentReport.rectalCancer?.operativeEvents?.intraoperativeEvents?.includes('Anaesthetic Events') ||
                  currentReport.rectalCancer?.operativeEvents?.intraoperativeEvents?.includes('Other')) && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify details" 
                      value={currentReport.rectalCancer?.operativeEvents?.intraoperativeEventsOther || ''}
                      onChange={(e) => updateRectalCancer('operativeEvents', 'intraoperativeEventsOther', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Specimen Extraction Site */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Specimen Extraction Site:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {['None', 'Suprapubic', 'Periumbilical', 'Stoma Site', 'Trans-Anal', 'Transvaginal', 'Other'].map(site => (
                    <div className="flex items-center" key={`extraction-${site}`}>
                      <Checkbox 
                        id={`extraction-${site}`}
                        checked={currentReport.rectalCancer?.operativeEvents?.specimenExtraction === site}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('operativeEvents', 'specimenExtraction', checked ? site : '');
                        }}
                      />
                      <label htmlFor={`extraction-${site}`} className="ml-2 text-sm">{site}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.operativeEvents?.specimenExtraction === 'Other' && (
                  <div className="mt-3 ml-4">
                    <Input 
                      type="text" 
                      placeholder="Specify other extraction site" 
                      value={currentReport.rectalCancer?.operativeEvents?.specimenExtractionOther || ''}
                      onChange={(e) => updateRectalCancer('operativeEvents', 'specimenExtractionOther', e.target.value)}
                    />
                  </div>
                )}
                
                {/* Conditional Laboratory Section */}
                {isSpecimenExtractionNotNone() && (
                  <div className="mt-4 ml-4 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Specimen Sent to Laboratory:</p>
                      <div className="flex gap-4 ml-4">
                        {['Yes', 'No'].map(sent => (
                          <div className="flex items-center" key={`lab-${sent}`}>
                            <Checkbox 
                              id={`lab-${sent}`}
                              checked={currentReport.rectalCancer?.operativeEvents?.specimenSentToLab === sent}
                              onCheckedChange={(checked) => {
                                updateRectalCancer('operativeEvents', 'specimenSentToLab', checked ? sent : '');
                              }}
                            />
                            <label htmlFor={`lab-${sent}`} className="ml-2 text-sm">{sent}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Laboratory Name - only show when Yes is selected */}
                    {currentReport.rectalCancer?.operativeEvents?.specimenSentToLab === 'Yes' && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Specify Laboratory Sent to:</label>
                        <Input 
                          type="text" 
                          placeholder="Enter laboratory name" 
                          value={currentReport.rectalCancer?.operativeEvents?.laboratoryName || ''}
                          onChange={(e) => updateRectalCancer('operativeEvents', 'laboratoryName', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wound Protector Used */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Wound Protector Used:</p>
                <div className="flex gap-4 ml-4">
                  {['Yes', 'No'].map(used => (
                    <div className="flex items-center" key={`protector-${used}`}>
                      <Checkbox 
                        id={`protector-${used}`}
                        checked={currentReport.rectalCancer?.operativeEvents?.woundProtector === used}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('operativeEvents', 'woundProtector', checked ? used : '');
                        }}
                      />
                      <label htmlFor={`protector-${used}`} className="ml-2 text-sm">{used}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drain Insertion */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Drain Insertion:</p>
                <div className="flex gap-4 ml-4">
                  {['No', 'Yes'].map(drain => (
                    <div className="flex items-center" key={`drain-${drain}`}>
                      <Checkbox 
                        id={`drain-${drain}`}
                        checked={currentReport.rectalCancer?.operativeEvents?.drainInsertion === drain}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('operativeEvents', 'drainInsertion', checked ? drain : '');
                        }}
                      />
                      <label htmlFor={`drain-${drain}`} className="ml-2 text-sm">{drain}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drain Details (Conditional) */}
              {isDrainInserted() && (
                <div className="ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300 space-y-4">
                  <h4 className="font-medium text-gray-800">Drain Details</h4>
                  
                  {/* Type of Drain */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Type of Drain:</p>
                    <div className="grid grid-cols-1 gap-2 ml-4">
                      {[
                        'Open',
                        'Closed Suction Drain',
                        'Closed Passive Drain',
                        'Other'
                      ].map(type => (
                        <div className="flex items-center" key={`draintype-${type}`}>
                          <Checkbox 
                            id={`draintype-${type}`}
                            checked={currentReport.rectalCancer?.operativeEvents?.drainType?.includes(type) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.operativeEvents?.drainType || [];
                              const updated = checked 
                                ? [...current, type]
                                : current.filter(i => i !== type);
                              updateRectalCancer('operativeEvents', 'drainType', updated);
                            }}
                          />
                          <label htmlFor={`draintype-${type}`} className="ml-2 text-sm">{type}</label>
                        </div>
                      ))}
                    </div>
                    {(currentReport.rectalCancer?.operativeEvents?.drainType?.includes('Closed Suction Drain') ||
                      currentReport.rectalCancer?.operativeEvents?.drainType?.includes('Closed Passive Drain') ||
                      currentReport.rectalCancer?.operativeEvents?.drainType?.includes('Other')) && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify drain type/location" 
                          value={currentReport.rectalCancer?.operativeEvents?.drainTypeOther || ''}
                          onChange={(e) => updateRectalCancer('operativeEvents', 'drainTypeOther', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Intra-Peritoneal Placement */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Intra-Peritoneal Placement:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        'Right Subphrenic Space',
                        'Right Subhepatic',
                        'Right Paracolic',
                        'Left Subphrenic',
                        'Left Subhepatic',
                        'Left Paracolic',
                        'Pelvis',
                        'Adjacent to Anastomosis',
                        'Other'
                      ].map(placement => (
                        <div className="flex items-center" key={`placement-${placement}`}>
                          <Checkbox 
                            id={`placement-${placement}`}
                            checked={currentReport.rectalCancer?.operativeEvents?.intraPeritonealPlacement?.includes(placement) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.operativeEvents?.intraPeritonealPlacement || [];
                              const updated = checked 
                                ? [...current, placement]
                                : current.filter(i => i !== placement);
                              updateRectalCancer('operativeEvents', 'intraPeritonealPlacement', updated);
                            }}
                          />
                          <label htmlFor={`placement-${placement}`} className="ml-2 text-sm">{placement}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.operativeEvents?.intraPeritonealPlacement?.includes('Other') && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify other placement" 
                          value={currentReport.rectalCancer?.operativeEvents?.intraPeritonealPlacementOther || ''}
                          onChange={(e) => updateRectalCancer('operativeEvents', 'intraPeritonealPlacementOther', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Exit Site */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Exit Site:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {[
                        'Right Upper Quadrant',
                        'Right Lower Quadrant',
                        'Left Upper Quadrant',
                        'Left Lower Quadrant',
                        'Perineum',
                        'Other'
                      ].map(site => (
                        <div className="flex items-center" key={`exit-${site}`}>
                          <Checkbox 
                            id={`exit-${site}`}
                            checked={currentReport.rectalCancer?.operativeEvents?.drainExitSite?.includes(site) || false}
                            onCheckedChange={(checked) => {
                              const current = currentReport.rectalCancer?.operativeEvents?.drainExitSite || [];
                              const updated = checked 
                                ? [...current, site]
                                : current.filter(i => i !== site);
                              updateRectalCancer('operativeEvents', 'drainExitSite', updated);
                            }}
                          />
                          <label htmlFor={`exit-${site}`} className="ml-2 text-sm">{site}</label>
                        </div>
                      ))}
                    </div>
                    {currentReport.rectalCancer?.operativeEvents?.drainExitSite?.includes('Other') && (
                      <div className="mt-3 ml-4">
                        <Input 
                          type="text" 
                          placeholder="Specify other exit site" 
                          value={currentReport.rectalCancer?.operativeEvents?.drainExitSiteOther || ''}
                          onChange={(e) => updateRectalCancer('operativeEvents', 'drainExitSiteOther', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Closure Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Closure Details</h3>
                
                {/* Fascial Closure */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Fascial Closure [Check all that apply]:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {['5mm Port Sites', '10/11mm Port Sites', '12mm Port Sites', '15mm Port Sites', 'Access Incision'].map(closure => (
                      <div className="flex items-center" key={`fascial-${closure}`}>
                        <Checkbox 
                          id={`fascial-${closure}`}
                          checked={currentReport.rectalCancer?.closure?.fascialClosure?.includes(closure) || false}
                          onCheckedChange={(checked) => {
                            const current = currentReport.rectalCancer?.closure?.fascialClosure || [];
                            const updated = checked 
                              ? [...current, closure]
                              : current.filter(i => i !== closure);
                            updateRectalCancer('closure', 'fascialClosure', updated);
                          }}
                        />
                        <label htmlFor={`fascial-${closure}`} className="ml-2 text-sm">{closure}</label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Suture Material (Conditional) */}
                  {isFascialClosureSelected() && (
                    <div className="mt-3 ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Suture Material:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {['Vicryl', 'PDS', 'Ethibond', 'Other'].map(material => (
                          <div className="flex items-center" key={`fascialsuture-${material}`}>
                            <Checkbox 
                              id={`fascialsuture-${material}`}
                              checked={currentReport.rectalCancer?.closure?.fascialSutureMaterial?.includes(material) || false}
                              onCheckedChange={(checked) => {
                                const current = currentReport.rectalCancer?.closure?.fascialSutureMaterial || [];
                                const updated = checked 
                                  ? [...current, material]
                                  : current.filter(i => i !== material);
                                updateRectalCancer('closure', 'fascialSutureMaterial', updated);
                              }}
                            />
                            <label htmlFor={`fascialsuture-${material}`} className="ml-2 text-sm">{material}</label>
                          </div>
                        ))}
                      </div>
                      {currentReport.rectalCancer?.closure?.fascialSutureMaterial?.includes('Other') && (
                        <div className="mt-3 ml-4">
                          <Input 
                            type="text" 
                            placeholder="Specify other suture material" 
                            value={currentReport.rectalCancer?.closure?.fascialSutureMaterialOther || ''}
                            onChange={(e) => updateRectalCancer('closure', 'fascialSutureMaterialOther', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Skin Closure */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Skin Closure:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {[
                      'Subcuticular Interrupted',
                      'Subcuticular Continuous',
                      'Interrupted Sutures',
                      'Continuous Sutures',
                      'Staples',
                      'Tissue Glue',
                      'Adhesive Strips'
                    ].map(closure => (
                      <div className="flex items-center" key={`skin-${closure}`}>
                        <Checkbox 
                          id={`skin-${closure}`}
                          checked={currentReport.rectalCancer?.closure?.skinClosure?.includes(closure) || false}
                          onCheckedChange={(checked) => {
                            const current = currentReport.rectalCancer?.closure?.skinClosure || [];
                            const updated = checked 
                              ? [...current, closure]
                              : current.filter(i => i !== closure);
                            updateRectalCancer('closure', 'skinClosure', updated);
                          }}
                        />
                        <label htmlFor={`skin-${closure}`} className="ml-2 text-sm">{closure}</label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Material/Method (Conditional) */}
                  {shouldShowSkinMaterial() && (
                    <div className="mt-3 ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Material/Method:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {['Monocryl', 'V-Loc', 'Nylon', 'Staples', 'Other'].map(material => (
                          <div className="flex items-center" key={`skinmaterial-${material}`}>
                            <Checkbox 
                              id={`skinmaterial-${material}`}
                              checked={currentReport.rectalCancer?.closure?.skinClosureMaterial?.includes(material) || false}
                              onCheckedChange={(checked) => {
                                const current = currentReport.rectalCancer?.closure?.skinClosureMaterial || [];
                                const updated = checked 
                                  ? [...current, material]
                                  : current.filter(i => i !== material);
                                updateRectalCancer('closure', 'skinClosureMaterial', updated);
                              }}
                            />
                            <label htmlFor={`skinmaterial-${material}`} className="ml-2 text-sm">{material}</label>
                          </div>
                        ))}
                      </div>
                      {currentReport.rectalCancer?.closure?.skinClosureMaterial?.includes('Other') && (
                        <div className="mt-3 ml-4">
                          <Input 
                            type="text" 
                            placeholder="Specify other material" 
                            value={currentReport.rectalCancer?.closure?.skinClosureMaterialOther || ''}
                            onChange={(e) => updateRectalCancer('closure', 'skinClosureMaterialOther', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label className="text-sm font-medium text-gray-700">Additional Information:</label>
                <Textarea 
                  placeholder="Enter any additional information" 
                  className="mt-2"
                  value={currentReport.rectalCancer?.additionalInfo?.additionalInformation || ''}
                  onChange={(e) => updateRectalCancer('additionalInfo', 'additionalInformation', e.target.value)}
                />
              </div>

              {/* Post-operative Management */}
              <div>
                <label className="text-sm font-medium text-gray-700">Post Operative Management:</label>
                <Textarea 
                  placeholder="Enter post-operative management details" 
                  className="mt-2"
                  value={currentReport.rectalCancer?.additionalInfo?.postOperativeManagement || ''}
                  onChange={(e) => updateRectalCancer('additionalInfo', 'postOperativeManagement', e.target.value)}
                />
              </div>

            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Surgeon's Signature Section */}
      <Card className="glass-card-light">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-black">Surgeon's Signature</span>
              <span className="text-xs text-gray-500 font-normal ml-2">Document with signature and date/time</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Surgeon's Signature:</p>
                <div className="space-y-2">
                  <Input 
                    type="text" 
                    placeholder="Type signature name or leave blank to upload"
                    className="w-full"
                    value={currentReport.rectalCancer?.additionalInfo?.surgeonSignatureText || ''}
                    onChange={(e) => updateRectalCancer('additionalInfo', 'surgeonSignatureText', e.target.value)}
                  />
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateRectalCancer('additionalInfo', 'surgeonSignature', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Upload signature or stamp (Image/PDF)</p>
                  {currentReport.rectalCancer?.additionalInfo?.surgeonSignature && (
                    <div className="space-y-1">
                      <p className="text-xs text-green-600">✓ Signature uploaded</p>
                      <div className="border rounded p-2 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                        <img 
                          src={currentReport.rectalCancer.additionalInfo.surgeonSignature} 
                          alt="Signature preview" 
                          className="max-h-12 max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Date/Time:</p>
                <div className="space-y-2">
                  <Input 
                    type="datetime-local" 
                    className="w-full"
                    value={currentReport.rectalCancer?.additionalInfo?.dateTime || getLocalDateTimeValue()}
                    onChange={(e) => updateRectalCancer('additionalInfo', 'dateTime', e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs px-2 py-1"
                    onClick={() => updateRectalCancer('additionalInfo', 'dateTime', getLocalDateTimeValue())}
                  >
                    Set Current Date/Time
                  </Button>
                  {currentReport.rectalCancer?.additionalInfo?.dateTime && (
                    <p className="text-xs text-gray-500">
                      Display format: {formatDateOnly(currentReport.rectalCancer.additionalInfo.dateTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(onExportPDF || onClearAll || onUndo || onRedo) && (
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          {onUndo && (
            <Button
              variant="outline"
              size="lg"
              onClick={onUndo}
              className="flex items-center gap-2"
            >
              <Undo2 className="h-5 w-5" />
              Undo
            </Button>
          )}
          {onRedo && (
            <Button
              variant="outline"
              size="lg"
              onClick={onRedo}
              className="flex items-center gap-2"
            >
              <Redo2 className="h-5 w-5" />
              Redo
            </Button>
          )}
          {onExportPDF && (
            <Button
              variant="default"
              size="lg"
              onClick={() => onExportPDF()}
              className="flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Print/Export PDF
            </Button>
          )}
          {onClearAll && (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                if (confirm('Are you sure you want to clear all rectal cancer data? This action cannot be undone.')) {
                  onClearAll();
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Clear All Data
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
