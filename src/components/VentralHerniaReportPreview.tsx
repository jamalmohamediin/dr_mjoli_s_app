import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, X, Save } from "lucide-react";
import { formatDateWithSuffix, formatReportDate, formatDateOnly } from "@/utils/dateFormatter";
import { getFullASAText } from '@/utils/asaDescriptions';

interface VentralHerniaReportPreviewProps {
  report: {
    ventralHernia?: {
      patientInfo: any;
      preoperative: any;
      operative: any;
      procedure: any;
      procedureFindings?: {
        findings: string;
        additionalNotes: string;
      };
    };
  };
  onEditVentralHerniaField?: (section: string, field: string, value: any) => void;
}

export const VentralHerniaReportPreview = ({ report, onEditVentralHerniaField }: VentralHerniaReportPreviewProps) => {
  const [editingField, setEditingField] = useState<{section: string; field: string} | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const ventralHernia = report.ventralHernia;
  if (!ventralHernia) return null;

  const formatPatientName = (name: string) => {
    if (!name) return 'Not specified';
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatGender = (gender: string) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return formatDateOnly(dateString);
  };

  // Check if there's any data to display
  const hasPatientData = Object.values(ventralHernia.patientInfo || {}).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );
  const hasPreoperativeData = Object.values(ventralHernia.preoperative || {}).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );
  const hasOperativeData = Object.values(ventralHernia.operative || {}).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );
  const hasProcedureData = Object.values(ventralHernia.procedure || {}).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );

  if (!hasPatientData && !hasPreoperativeData && !hasOperativeData && !hasProcedureData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the ventral hernia repair form to see the live report here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header matching PDF format */}
        <div className="border-b pb-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-xs">
            {/* Left Column - Doctor Info */}
            <div className="space-y-1">
              <p className="font-bold text-sm">Dr. Monde Mjoli</p>
              <p className="font-bold">Specialist Surgeon</p>
              <p>MBChB (UNITRA), MMed (UKZN), FCS(SA),</p>
              <p>Cert Gastroenterology, Surg (SA)</p>
              <p>Practice No. 0560812</p>
              <p>Cell: 082 417 2630</p>
            </div>
            
            {/* Center Column - Report Title */}
            <div className="text-center space-y-2">
              <h4 className="text-sm font-bold">VENTRAL HERNIA REPAIR REPORT</h4>
            </div>
            
            {/* Right Column - Practice Address */}
            <div className="text-right space-y-1">
              <p className="font-bold">St. Dominic's Medical Suites B</p>
              <p>56 St James Road, Southernwood</p>
              <p>East London, 5201</p>
              <p>Tel: 043 743 7872</p>
              <p>Fax: 043 743 6653</p>
            </div>
          </div>
        </div>
        
        {/* Patient Information */}
        {(ventralHernia.patientInfo.name || ventralHernia.patientInfo.patientId || ventralHernia.patientInfo.dateOfBirth || ventralHernia.patientInfo.age || ventralHernia.patientInfo.sex || ventralHernia.patientInfo.weight || ventralHernia.patientInfo.height || ventralHernia.patientInfo.bmi || ventralHernia.patientInfo.asaScore) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Patient Information</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {ventralHernia.patientInfo.name && (
                <div><span className="font-medium">Patient:</span> {formatPatientName(ventralHernia.patientInfo.name)}</div>
              )}
              {ventralHernia.patientInfo.patientId && (
                <div><span className="font-medium">Patient ID:</span> {ventralHernia.patientInfo.patientId}</div>
              )}
              {ventralHernia.patientInfo.dateOfBirth && (
                <div><span className="font-medium">Date Of Birth:</span> {formatDate(ventralHernia.patientInfo.dateOfBirth)}</div>
              )}
              {ventralHernia.patientInfo.age && (
                <div><span className="font-medium">Age:</span> {ventralHernia.patientInfo.age}</div>
              )}
              {ventralHernia.patientInfo.sex && (
                <div><span className="font-medium">Sex:</span> {formatGender(ventralHernia.patientInfo.sex)}</div>
              )}
              {ventralHernia.patientInfo.weight && (
                <div><span className="font-medium">Weight:</span> {ventralHernia.patientInfo.weight} kg</div>
              )}
              {ventralHernia.patientInfo.height && (
                <div><span className="font-medium">Height:</span> {ventralHernia.patientInfo.height} cm</div>
              )}
              {ventralHernia.patientInfo.bmi && (
                <div><span className="font-medium">BMI:</span> {ventralHernia.patientInfo.bmi}</div>
              )}
            </div>
            {ventralHernia.patientInfo.asaScore && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-600">ASA Score:</span>
                <Badge variant="outline" className="text-xs">
                  {getFullASAText(ventralHernia.patientInfo.asaScore)}
                </Badge>
              </div>
            )}
            {ventralHernia.patientInfo.asaNotes && (
              <div className="mt-2">
                <span className="text-xs font-medium text-gray-600">ASA Notes:</span>
                <p className="text-xs text-gray-700 mt-1">{ventralHernia.patientInfo.asaNotes}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Indications of Surgery */}
        {(ventralHernia.preoperative.indication?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Indications of Surgery</h5>
            <div className="flex flex-wrap gap-1">
              {ventralHernia.preoperative.indication.map((ind, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {ind === 'Other' && ventralHernia.preoperative.indicationOther 
                    ? `Other: ${ventralHernia.preoperative.indicationOther}` 
                    : ind}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Operative Findings */}
        {(ventralHernia.operative.herniaType?.length > 0 || ventralHernia.operative.herniaSite?.length > 0 || 
          ventralHernia.operative.herniaDefects || ventralHernia.operative.strangulation || 
          ventralHernia.operative.meshInSitu || ventralHernia.operative.approach?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Operative Findings</h5>
            {ventralHernia.operative.herniaType?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-gray-600">Hernia Type:</span>
                {ventralHernia.operative.herniaType.map((type, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {type === 'Other' && ventralHernia.operative.herniaTypeOther 
                      ? `Other: ${ventralHernia.operative.herniaTypeOther}` 
                      : type}
                  </Badge>
                ))}
              </div>
            )}
            {ventralHernia.operative.herniaSite?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-gray-600">Site of Hernia:</span>
                {ventralHernia.operative.herniaSite.map((site, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {site === 'Other' && ventralHernia.operative.herniaSiteOther 
                      ? `Other: ${ventralHernia.operative.herniaSiteOther}` 
                      : site}
                  </Badge>
                ))}
              </div>
            )}
            {ventralHernia.operative.herniaDefects && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Total Hernia Defect Size:</span> {ventralHernia.operative.herniaDefects}
              </p>
            )}
            {ventralHernia.operative.numberOfDefects && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Number of Defects:</span> {ventralHernia.operative.numberOfDefects}
              </p>
            )}
            {ventralHernia.operative.contents?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-gray-600">Contents:</span>
                {ventralHernia.operative.contents.map((content, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {content === 'Other' && ventralHernia.operative.contentsOther 
                      ? `Other: ${ventralHernia.operative.contentsOther}` 
                      : content}
                  </Badge>
                ))}
              </div>
            )}
            {ventralHernia.operative.strangulation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Strangulation/Ischaemia:</span> {ventralHernia.operative.strangulation}
              </p>
            )}
            {ventralHernia.operative.meshInSitu && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Mesh in Situ:</span> {ventralHernia.operative.meshInSitu}
              </p>
            )}
            {ventralHernia.operative.approach?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-gray-600">Operative Approach:</span>
                {ventralHernia.operative.approach.map((approach, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {approach === 'Other' && ventralHernia.operative.approachOther 
                      ? `Other: ${ventralHernia.operative.approachOther}` 
                      : approach}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Procedure Details */}
        {(ventralHernia.procedure.sacExcised || ventralHernia.procedure.fatDissected || 
          ventralHernia.procedure.defectClosed || ventralHernia.procedure.repairType ||
          ventralHernia.procedure.meshType?.length > 0 || ventralHernia.procedure.primaryRepair?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Procedure Details</h5>
            {ventralHernia.procedure.sacExcised && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Sac Excised:</span> {ventralHernia.procedure.sacExcised}
              </p>
            )}
            {ventralHernia.procedure.fatDissected && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Pre-Peritoneal Fat Dissected Off Sheath:</span> {ventralHernia.procedure.fatDissected}
              </p>
            )}
            {ventralHernia.procedure.defectClosed && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Hernia Defect Closed:</span> {ventralHernia.procedure.defectClosed}
              </p>
            )}
            {ventralHernia.procedure.repairType && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Repair Type:</span> {ventralHernia.procedure.repairType}
              </p>
            )}
            {ventralHernia.procedure.meshType?.length > 0 && (
              <div className="ml-4 space-y-1">
                <p className="text-xs font-medium text-gray-600">Mesh Details:</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-600">Type:</span>
                  {ventralHernia.procedure.meshType.map((type, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                {ventralHernia.procedure.meshMaterial?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600">Material:</span>
                    {ventralHernia.procedure.meshMaterial.map((material, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                )}
                {(ventralHernia.procedure.meshLength || ventralHernia.procedure.meshWidth) && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Size:</span> {ventralHernia.procedure.meshLength || '___'} x {ventralHernia.procedure.meshWidth || '___'} cm
                  </p>
                )}
                {ventralHernia.procedure.fixation?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600">Fixation:</span>
                    {ventralHernia.procedure.fixation.map((fix, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {fix === 'Other' && ventralHernia.procedure.fixationOther 
                          ? `Other: ${ventralHernia.procedure.fixationOther}` 
                          : fix}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {ventralHernia.procedure.primaryRepair?.length > 0 && (
              <div className="ml-4 space-y-1">
                <p className="text-xs font-medium text-gray-600">Primary Tissue Repair:</p>
                <div className="flex flex-wrap gap-1">
                  {ventralHernia.procedure.primaryRepair.map((repair, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {repair === 'Other' && ventralHernia.procedure.primaryRepairOther 
                        ? `Other: ${ventralHernia.procedure.primaryRepairOther}` 
                        : repair}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {ventralHernia.procedure.complications?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Intraoperative Complications:</p>
                <div className="flex flex-wrap gap-1">
                  {ventralHernia.procedure.complications.map((comp, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {comp === 'Other' && ventralHernia.procedure.complicationOther 
                        ? `Other: ${ventralHernia.procedure.complicationOther}` 
                        : comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Closure Details */}
        {(ventralHernia.procedure.haemostasis || ventralHernia.procedure.drain) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Haemostasis & Closure</h5>
            {ventralHernia.procedure.haemostasis && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Haemostasis:</span> {ventralHernia.procedure.haemostasis}
              </p>
            )}
            {ventralHernia.procedure.drain && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Drain:</span> {ventralHernia.procedure.drain}
                {ventralHernia.procedure.drain === 'Yes' && ventralHernia.procedure.drainDetails && (
                  <span> - {ventralHernia.procedure.drainDetails}</span>
                )}
              </p>
            )}
          </div>
        )}
        
        
        {/* Preoperative Information */}
        {(ventralHernia.preoperative.surgeons?.some(s => s.trim()) || ventralHernia.preoperative.assistant1 || ventralHernia.preoperative.assistant2 || ventralHernia.preoperative.anaesthetist || ventralHernia.preoperative.duration) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
            {ventralHernia.preoperative.surgeons?.some(s => s.trim()) && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgeon:</span> {ventralHernia.preoperative.surgeons.filter(s => s.trim()).join(', ')}
              </p>
            )}
            {ventralHernia.preoperative.assistant1 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Assistant 1:</span> {ventralHernia.preoperative.assistant1}
              </p>
            )}
            {ventralHernia.preoperative.assistant2 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Assistant 2:</span> {ventralHernia.preoperative.assistant2}
              </p>
            )}
            {ventralHernia.preoperative.anaesthetist && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Anaesthetist:</span> {ventralHernia.preoperative.anaesthetist}
              </p>
            )}
            {ventralHernia.preoperative.duration && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Duration:</span> {ventralHernia.preoperative.duration} min
              </p>
            )}
          </div>
        )}
        
        {/* Procedure Findings - Surgical Markings */}
        {ventralHernia.procedureFindings && (ventralHernia.procedureFindings.findings || ventralHernia.procedureFindings.additionalNotes) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Diagram & Notes</h5>
            {ventralHernia.procedureFindings.findings && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgical Markings:</span> Documented on anatomical diagram
              </p>
            )}
            {ventralHernia.procedureFindings.additionalNotes && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Additional Notes:</span> {ventralHernia.procedureFindings.additionalNotes}
              </p>
            )}
          </div>
        )}
        
        {/* Post-operative Management */}
        {ventralHernia.postoperativeManagement && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Post-operative Management</h5>
            <p className="text-xs text-gray-700">{ventralHernia.postoperativeManagement}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="border-t pt-4 mt-6 text-center text-xs space-y-1">
          <p>Dr. Monde Mjoli - Specialist Surgeon</p>
          <p>Practice Number: 0560812</p>
          <p>Report Date: {formatReportDate(new Date())} | Page 1 of 1</p>
        </div>
      </div>
      <Separator />
    </>
  );
};