import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, User, Stethoscope, Activity, Scissors, Shield, FileSearch, ClipboardList } from "lucide-react";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import { formatDateOnly } from "@/utils/dateFormatter";

interface RectalCancerFormProps {
  currentReport: any;
  updateRectalCancer: (section: string, field: string, value: any) => void;
}

export const RectalCancerForm = ({ currentReport, updateRectalCancer }: RectalCancerFormProps) => {
  const [expanded, setExpanded] = useState({
    basicData: true,
    surgicalApproach: true,
    mobilizationResection: true,
    reconstruction: true,
    operativeEvents: true
  });

  // Helper function to check if Rectum is selected
  const isRectumSelected = () => {
    return currentReport.rectalCancer?.operationType?.type?.includes('Rectum');
  };

  // Helper function to check if neoadjuvant therapy is yes
  const isNeoadjuvantYes = () => {
    return currentReport.rectalCancer?.operationType?.neoadjuvantTreatment === 'Yes';
  };

  // Helper function to check if laparoscopic converted to open is selected
  const isLaparoscopicConverted = () => {
    return currentReport.rectalCancer?.surgicalApproach?.primaryApproach === 'Laparoscopic Converted To Open';
  };

  // Helper function to check if anastomosis is selected
  const isAnastomosisSelected = () => {
    return currentReport.rectalCancer?.reconstruction?.reconstructionType === 'ANASTOMOSIS';
  };

  // Helper function to check if stoma is selected
  const isStomaSelected = () => {
    return currentReport.rectalCancer?.reconstruction?.reconstructionType === 'STOMA';
  };

  // Helper function to check if suture technique is selected
  const isSutureSelected = () => {
    return currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.technique === 'SUTURE';
  };

  // Helper function to check if stapled technique is selected
  const isStapledSelected = () => {
    return currentReport.rectalCancer?.reconstruction?.anastomosisDetails?.technique === 'STAPLED';
  };

  // Helper function to check if drain insertion is yes
  const isDrainInserted = () => {
    return currentReport.rectalCancer?.operativeEvents?.drainInsertion === 'YES';
  };

  // Helper function to check if anal canal is selected for distal transection
  const isAnalCanalSelected = () => {
    return currentReport.rectalCancer?.mobilizationAndResection?.distalTransection === 'Anal Canal';
  };

  // Helper function to check if any fascial closure is selected
  const isFascialClosureSelected = () => {
    return currentReport.rectalCancer?.closure?.fascialClosure?.length > 0;
  };

  // Helper function to check if any skin closure is selected
  const isSkinClosureSelected = () => {
    return currentReport.rectalCancer?.closure?.skinClosure?.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* SECTION I: Basic Data & Preoperative Assessment */}
      <Collapsible
        open={expanded.basicData}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, basicData: open }))}
      >
        <Card className="glass-card-light">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-red-600" />
                  SECTION I: Basic Data & Preoperative Assessment
                </div>
                {expanded.basicData ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Patient Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Patient Name:</label>
                    <Input 
                      type="text" 
                      value={currentReport.rectalCancer.patientInfo?.name || ''}
                      onChange={(e) => updateRectalCancer('patientInfo', 'name', e.target.value)}
                      placeholder="Enter patient name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Patient ID:</label>
                    <Input 
                      type="text" 
                      value={currentReport.rectalCancer.patientInfo?.patientId || ''}
                      onChange={(e) => updateRectalCancer('patientInfo', 'patientId', e.target.value)}
                      placeholder="Enter patient ID"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Date Of Birth:</label>
                    <div className="w-full">
                      <Input 
                        type="date" 
                        value={currentReport.rectalCancer.patientInfo?.dateOfBirth || ''}
                        onChange={(e) => updateRectalCancer('patientInfo', 'dateOfBirth', e.target.value)}
                      />
                      {currentReport.rectalCancer.patientInfo?.dateOfBirth && (
                        <p className="text-xs text-gray-500 mt-1">
                          Display format: {formatDateOnly(currentReport.rectalCancer.patientInfo.dateOfBirth)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Age:</label>
                    <Input 
                      type="text" 
                      value={currentReport.rectalCancer.patientInfo?.age || ''}
                      placeholder="Calculated from date of birth"
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Sex:</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={currentReport.rectalCancer.patientInfo?.sex || ''}
                      onChange={(e) => updateRectalCancer('patientInfo', 'sex', e.target.value)}
                    >
                      <option value="">Select sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Weight:</label>
                    <Input 
                      type="text" 
                      value={currentReport.rectalCancer.patientInfo?.weight || ''}
                      onChange={(e) => updateRectalCancer('patientInfo', 'weight', e.target.value)}
                      placeholder="Enter weight (kg)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Height:</label>
                    <Input 
                      type="text" 
                      value={currentReport.rectalCancer.patientInfo?.height || ''}
                      onChange={(e) => updateRectalCancer('patientInfo', 'height', e.target.value)}
                      placeholder="Enter height (cm)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">BMI:</label>
                    <Input 
                      type="text" 
                      value={currentReport.rectalCancer.patientInfo?.bmi || ''}
                      placeholder="Calculated from height and weight"
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
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
                    <Input 
                      type="text" 
                      placeholder="Enter Anaesthetist name" 
                      value={currentReport.rectalCancer?.surgicalTeam?.anaesthetist || ''}
                      onChange={(e) => updateRectalCancer('surgicalTeam', 'anaesthetist', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Procedure Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Procedure Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-800 font-medium">Duration (minutes):</label>
                    <Input 
                      type="number" 
                      placeholder="Enter duration in minutes" 
                      value={currentReport.rectalCancer?.procedureDetails?.duration || ''}
                      onChange={(e) => updateRectalCancer('procedureDetails', 'duration', e.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Procedure Urgency:</p>
                    <div className="flex flex-wrap gap-4 ml-4">
                      {['Emergency', 'Semi-emergency', 'Semi-elective', 'Elective'].map(urgency => (
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
                </div>
              </div>

              {/* Operation Type */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Operation Type</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Operation Type (PRIMARY BRANCH POINT):</p>
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
                      <p className="text-sm font-medium text-gray-700 mb-3">Rectum Operation Types:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'High Anterior Resection',
                          'Low Anterior Resection',
                          'Intersphincteric Resection',
                          'Abdominoperineal Resection',
                          'Local excision',
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

                      {/* Neoadjuvant Treatment */}
                      <div className="mt-4">
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

                      {/* Conditional Neoadjuvant Details */}
                      {isNeoadjuvantYes() && (
                        <div className="mt-3 ml-4 space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Radiation Details:</label>
                            <Input 
                              type="text" 
                              placeholder="e.g., Long course chemoradiation 50.4 Gy in 28 fractions" 
                              className="mt-1"
                              value={currentReport.rectalCancer?.operationType?.radiationDetails || ''}
                              onChange={(e) => updateRectalCancer('operationType', 'radiationDetails', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Chemotherapy Regimen:</label>
                            <Input 
                              type="text" 
                              placeholder="e.g., Capecitabine, 5-FU" 
                              className="mt-1"
                              value={currentReport.rectalCancer?.operationType?.chemotherapyRegimen || ''}
                              onChange={(e) => updateRectalCancer('operationType', 'chemotherapyRegimen', e.target.value)}
                            />
                          </div>
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
                          
                          {/* Tumor Classification */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Tumor Classification:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">T classification:</label>
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
                                <label className="block text-sm text-gray-600 mb-1">N classification:</label>
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
                                <label className="block text-sm text-gray-600 mb-1">M classification:</label>
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

                          {/* Location */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
                            <div className="flex flex-wrap gap-4 ml-4">
                              {['High', 'Middle', 'Low'].map(location => (
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
                              {['Complete', 'Near complete', 'Incomplete'].map(completeness => (
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
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION II: Surgical Approach */}
      <Collapsible
        open={expanded.surgicalApproach}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, surgicalApproach: open }))}
      >
        <Card className="glass-card-light">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-red-600" />
                  SECTION II: Surgical Approach
                </div>
                {expanded.surgicalApproach ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Primary Approach */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Primary Approach (MAJOR BRANCH POINT):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Open',
                    'Laparoscopic',
                    'Laparoscopic Converted To Open',
                    'Laparoscopic Hand Assisted',
                    'TAMIS',
                    'TEO',
                    'TEM',
                    'Robotic',
                    'Other'
                  ].map(approach => (
                    <div className="flex items-center" key={`approach-${approach}`}>
                      <Checkbox 
                        id={`approach-${approach}`}
                        checked={currentReport.rectalCancer?.surgicalApproach?.primaryApproach === approach}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('surgicalApproach', 'primaryApproach', checked ? approach : '');
                        }}
                      />
                      <label htmlFor={`approach-${approach}`} className="ml-2 text-sm">{approach}</label>
                    </div>
                  ))}
                </div>
                
                {currentReport.rectalCancer?.surgicalApproach?.primaryApproach === 'Other' && (
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
                  <p className="text-sm font-medium text-gray-700 mb-3">Reason for Conversion (REQUIRED):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Adhesions',
                      'Visceral Injury',
                      'Vascular Injury',
                      'Difficult Exposure',
                      'Difficult Visualization',
                      'Bleeding',
                      'Failure to progress',
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
                        placeholder="Specify other conversion reason" 
                        value={currentReport.rectalCancer?.surgicalApproach?.conversionReasonOther || ''}
                        onChange={(e) => updateRectalCancer('surgicalApproach', 'conversionReasonOther', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Operative Findings & Anatomical References */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Operative Findings & Anatomical References</h4>
                <p className="text-sm text-gray-600 mb-4">Rectal Cancer Surgery Diagram - Mark Ports, Stomas, and Incisions on the diagram below.</p>
                {/* The diagram component should be passed as children or handled in the parent component */}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION III: Mobilization and Resection */}
      <Collapsible
        open={expanded.mobilizationResection}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, mobilizationResection: open }))}
      >
        <Card className="glass-card-light">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-red-600" />
                  SECTION III: Mobilization and Resection
                </div>
                {expanded.mobilizationResection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Extent of Mobilization */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Extent of Mobilization [Check all that apply]:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {[
                    'Ascending Colon',
                    'Hepatic Flexure',
                    'Splenic Flexure',
                    'Descending Colon',
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
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md ml-4"
                  value={currentReport.rectalCancer?.mobilizationAndResection?.proximalTransection || ''}
                  onChange={(e) => updateRectalCancer('mobilizationAndResection', 'proximalTransection', e.target.value)}
                >
                  <option value="">Select proximal transection site</option>
                  <option value="Ileum">Ileum</option>
                  <option value="Ascending Colon">Ascending Colon</option>
                  <option value="Transverse Colon">Transverse Colon</option>
                  <option value="Descending colon">Descending colon</option>
                  <option value="Sigmoid Colon">Sigmoid Colon</option>
                  <option value="Proximal Rectum">Proximal Rectum</option>
                  <option value="Mid Rectum">Mid Rectum</option>
                  <option value="Distal Rectum">Distal Rectum</option>
                </select>
              </div>

              {/* Distal Transection Site */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Distal Transection Site:</p>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md ml-4"
                  value={currentReport.rectalCancer?.mobilizationAndResection?.distalTransection || ''}
                  onChange={(e) => updateRectalCancer('mobilizationAndResection', 'distalTransection', e.target.value)}
                >
                  <option value="">Select distal transection site</option>
                  <option value="Ascending Colon">Ascending Colon</option>
                  <option value="Transverse Colon">Transverse Colon</option>
                  <option value="Descending Colon">Descending Colon</option>
                  <option value="Sigmoid">Sigmoid</option>
                  <option value="Proximal Rectum">Proximal Rectum</option>
                  <option value="Mid Rectum">Mid Rectum</option>
                  <option value="Distal Rectum">Distal Rectum</option>
                  <option value="Perineal Resection">Perineal Resection</option>
                  <option value="Anal Canal">Anal Canal</option>
                </select>

                {/* Anal Canal Transection Level (Conditional) */}
                {isAnalCanalSelected() && (
                  <div className="mt-3 ml-6 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-3">Anal Canal Transection level:</p>
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
                          placeholder="Specify other transection level" 
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
                <p className="text-sm font-medium text-gray-700 mb-2">Excised En-Bloc resection: [Check if removed with Primary Specimen]</p>
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

      {/* SECTION IV: Reconstruction */}
      <Collapsible
        open={expanded.reconstruction}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, reconstruction: open }))}
      >
        <Card className="glass-card-light">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  SECTION IV: Reconstruction
                </div>
                {expanded.reconstruction ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Reconstruction Type */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Reconstruction Type (PRIMARY BRANCH):</p>
                <div className="flex flex-wrap gap-4 ml-4">
                  {['ANASTOMOSIS', 'STOMA', 'OTHER'].map(type => (
                    <div className="flex items-center" key={`reconstruction-${type}`}>
                      <Checkbox 
                        id={`reconstruction-${type}`}
                        checked={currentReport.rectalCancer?.reconstruction?.reconstructionType === type}
                        onCheckedChange={(checked) => {
                          updateRectalCancer('reconstruction', 'reconstructionType', checked ? type : '');
                        }}
                      />
                      <label htmlFor={`reconstruction-${type}`} className="ml-2 text-sm">{type}</label>
                    </div>
                  ))}
                </div>
                {currentReport.rectalCancer?.reconstruction?.reconstructionType === 'OTHER' && (
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
                      {['SUTURE', 'STAPLED'].map(technique => (
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

      {/* SECTION V: Operative Events & Closure */}
      <Collapsible
        open={expanded.operativeEvents}
        onOpenChange={(open) => setExpanded(prev => ({ ...prev, operativeEvents: open }))}
      >
        <Card className="glass-card-light">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/20 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-red-600" />
                  SECTION V: Operative Events & Closure
                </div>
                {expanded.operativeEvents ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
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
                  {['Suprapubic', 'Periumbilical', 'Stoma Site', 'Trans-Anal', 'Transvaginal', 'Other'].map(site => (
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
                  {['NO', 'YES'].map(drain => (
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
                        'Closed Suction Drain: [Specify Location]',
                        'Closed Passive Drain: [Specify Location]',
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
                    {(currentReport.rectalCancer?.operativeEvents?.drainType?.includes('Closed Suction Drain: [Specify Location]') ||
                      currentReport.rectalCancer?.operativeEvents?.drainType?.includes('Closed Passive Drain: [Specify Location]') ||
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
                  {isSkinClosureSelected() && (
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
                <label className="text-sm font-medium text-gray-700">Post-operative Management:</label>
                <Textarea 
                  placeholder="Enter post-operative management details" 
                  className="mt-2"
                  value={currentReport.rectalCancer?.additionalInfo?.postOperativeManagement || ''}
                  onChange={(e) => updateRectalCancer('additionalInfo', 'postOperativeManagement', e.target.value)}
                />
              </div>

              {/* Doctor Signature */}
              <div>
                <label className="text-sm font-medium text-gray-700">Doctor Signature:</label>
                <Textarea 
                  placeholder="Enter doctor signature or upload/draw" 
                  className="mt-2"
                  value={currentReport.rectalCancer?.additionalInfo?.doctorSignature || ''}
                  onChange={(e) => updateRectalCancer('additionalInfo', 'doctorSignature', e.target.value)}
                />
              </div>

              {/* Date and Time */}
              <div>
                <label className="text-sm font-medium text-gray-700">Date and Time of Report:</label>
                <Input 
                  type="datetime-local" 
                  className="mt-2"
                  value={currentReport.rectalCancer?.additionalInfo?.dateTime || ''}
                  onChange={(e) => updateRectalCancer('additionalInfo', 'dateTime', e.target.value)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
