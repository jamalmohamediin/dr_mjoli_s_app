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
                <div><span className="font-medium">Sex:</span> {ventralHernia.patientInfo.sex.toLowerCase() === 'other' && ventralHernia.patientInfo.sexOther
                  ? ventralHernia.patientInfo.sexOther
                  : formatGender(ventralHernia.patientInfo.sex)}</div>
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
        
        {/* Preoperative Information */}
        {(ventralHernia.preoperative.surgeons?.some(s => s.trim()) || ventralHernia.preoperative.assistants?.some(s => s.trim()) || 
          ventralHernia.preoperative.anaesthetist || ventralHernia.preoperative.duration || ventralHernia.preoperative.indication?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
            {ventralHernia.preoperative.surgeons?.some(s => s.trim()) && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgeon:</span> {ventralHernia.preoperative.surgeons.filter(s => s.trim()).join(', ')}
              </p>
            )}
            {ventralHernia.preoperative.assistants?.some(s => s.trim()) && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Assistant:</span> {ventralHernia.preoperative.assistants.filter(s => s.trim()).join(', ')}
              </p>
            )}
            {(ventralHernia.preoperative.anaesthetists?.some(a => a.trim()) || ventralHernia.preoperative.anaesthetist) && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Anaesthetist:</span> {
                  ventralHernia.preoperative.anaesthetists?.some(a => a.trim()) 
                    ? ventralHernia.preoperative.anaesthetists.filter(a => a.trim()).join(', ')
                    : ventralHernia.preoperative.anaesthetist
                }
              </p>
            )}
            {(ventralHernia.preoperative.duration || ventralHernia.preoperative.startTime || ventralHernia.preoperative.endTime) && (
              <div className="text-xs text-gray-700 space-y-1">
                {ventralHernia.preoperative.startTime && (
                  <p><span className="font-medium">Start Time:</span> {ventralHernia.preoperative.startTime}</p>
                )}
                {ventralHernia.preoperative.endTime && (
                  <p><span className="font-medium">End Time:</span> {ventralHernia.preoperative.endTime}</p>
                )}
                {ventralHernia.preoperative.duration && (
                  <p><span className="font-medium">Total Duration:</span> {ventralHernia.preoperative.duration} minutes</p>
                )}
              </div>
            )}
            {ventralHernia.preoperative.indication?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Indication for Surgery:</p>
                <div className="flex flex-wrap gap-1">
                  {ventralHernia.preoperative.indication.map((ind, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ind === 'Other' && ventralHernia.preoperative.indicationOther 
                        ? `Other: ${ventralHernia.preoperative.indicationOther}` 
                        : ind}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {ventralHernia.preoperative.imaging?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Preoperative Imaging:</p>
                <div className="flex flex-wrap gap-1">
                  {ventralHernia.preoperative.imaging.map((img, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {img === 'Other' && ventralHernia.preoperative.imagingOther 
                        ? `Other: ${ventralHernia.preoperative.imagingOther}` 
                        : img}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Mesh in Situ - Show only when Recurrent Hernia is selected */}
            {ventralHernia.preoperative.indication?.includes('Recurrent Hernia') && ventralHernia.operative.meshInSitu && (
              <div className="ml-4">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Does patient have a Mesh in Situ?</span> {ventralHernia.operative.meshInSitu}
                </p>
                {ventralHernia.operative.meshInSitu === 'Yes' && ventralHernia.operative.meshDetails && (
                  <p className="text-xs text-gray-700 ml-4">
                    <span className="font-medium">Mesh Details:</span> {ventralHernia.operative.meshDetails}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Main Section with separator line */}
        <div className="border-t-2 border-gray-400 pt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Top: OPERATIVE FINDINGS, Bottom: PROCEDURE DETAILS + COMPLICATIONS */}
            <div className="space-y-6">
              {/* OPERATIVE FINDINGS */}
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">OPERATIVE FINDINGS</h5>
                <div className="space-y-2">
                  {ventralHernia.operative.herniaType?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Hernia Type: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.operative.herniaType.map(type => 
                          type === 'Other' && ventralHernia.operative.herniaTypeOther 
                            ? ventralHernia.operative.herniaTypeOther
                            : type
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.operative.herniaSite?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Site of Hernia: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.operative.herniaSite.map(site => 
                          site === 'Other' && ventralHernia.operative.herniaSiteOther 
                            ? ventralHernia.operative.herniaSiteOther
                            : site
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {(ventralHernia.operative.herniaDefectLength || ventralHernia.operative.herniaDefectWidth) && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Total Hernia Defect Size: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.operative.herniaDefectLength || '___'} cm (Length) x {ventralHernia.operative.herniaDefectWidth || '___'} cm (Width)
                      </span>
                    </div>
                  )}
                  {ventralHernia.operative.numberOfDefects && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Number of Defects: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.operative.numberOfDefects}</span>
                    </div>
                  )}
                  {ventralHernia.operative.contents?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Contents: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.operative.contents.map(content => 
                          content === 'Other' && ventralHernia.operative.contentsOther 
                            ? ventralHernia.operative.contentsOther
                            : content
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.operative.strangulation && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Strangulation/Ischaemia: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.operative.strangulation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PROCEDURE DETAILS */}
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">PROCEDURE DETAILS</h5>
                <div className="space-y-2">
                  {ventralHernia.operative.operationDescription && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Operation Description: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.operative.operationDescription}</span>
                    </div>
                  )}
                  {ventralHernia.operative.approach?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Surgical Approach: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.operative.approach.map(approach => 
                          approach === 'Other' && ventralHernia.operative.approachOther 
                            ? ventralHernia.operative.approachOther
                            : approach
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.operative.conversionReason?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Reason for Conversion: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.operative.conversionReason.map(reason => 
                          reason === 'Other' && ventralHernia.operative.conversionReasonOther 
                            ? ventralHernia.operative.conversionReasonOther
                            : reason
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.operative.trocarNumber && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Trocar Number: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.operative.trocarNumber}</span>
                    </div>
                  )}
                  {ventralHernia.procedure.sacExcised && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Sac Excised: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.procedure.sacExcised}</span>
                    </div>
                  )}
                  {ventralHernia.procedure.fatDissected && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Pre-peritoneal Fat Dissected Off Sheath: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.procedure.fatDissected}</span>
                    </div>
                  )}
                  {ventralHernia.procedure.defectClosed && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Hernia Defect Closed: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.procedure.defectClosed}</span>
                    </div>
                  )}
                  {ventralHernia.procedure.closureTechnique?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Closure Technique: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.closureTechnique.map(technique => 
                          technique === 'Other' && ventralHernia.procedure.closureTechniqueOther 
                            ? ventralHernia.procedure.closureTechniqueOther
                            : technique
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.closureMaterial?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Material Used: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.closureMaterial.map(material => 
                          material === 'Other' && ventralHernia.procedure.closureMaterialOther 
                            ? ventralHernia.procedure.closureMaterialOther
                            : material
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.repairType && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Repair Type: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.procedure.repairType}</span>
                    </div>
                  )}
                  {ventralHernia.procedure.primaryRepair?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Primary Tissue Repair: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.primaryRepair.map(repair => 
                          repair === 'Other' && ventralHernia.procedure.primaryRepairOther 
                            ? ventralHernia.procedure.primaryRepairOther
                            : repair
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.meshType?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Mesh Placement: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.meshType.map(type => 
                          type === 'Other' && ventralHernia.procedure.meshPlacementOther 
                            ? ventralHernia.procedure.meshPlacementOther
                            : type
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.meshMaterial?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Mesh Material: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.meshMaterial.map(material => 
                          material === 'Other' && ventralHernia.procedure.meshMaterialOther 
                            ? ventralHernia.procedure.meshMaterialOther
                            : material
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {(ventralHernia.procedure.meshLength || ventralHernia.procedure.meshWidth) && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Mesh Size: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.procedure.meshLength || '___'} x {ventralHernia.procedure.meshWidth || '___'} cm</span>
                    </div>
                  )}
                  {ventralHernia.procedure.fixation?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Fixation: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.fixation.map(fix => 
                          fix === 'Other' && ventralHernia.procedure.fixationOther 
                            ? ventralHernia.procedure.fixationOther
                            : fix
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* COMPLICATIONS */}
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">COMPLICATIONS</h5>
                <div className="space-y-2">
                  {ventralHernia.procedure.intraOperativeDifficulty?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Intra-Operative Difficulty: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.intraOperativeDifficulty.map(difficulty => 
                          difficulty === 'Other' && ventralHernia.procedure.intraOperativeDifficultyOther 
                            ? ventralHernia.procedure.intraOperativeDifficultyOther
                            : difficulty
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.complications?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Intraoperative Complications: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.complications.map(comp => 
                          comp === 'Other' && ventralHernia.procedure.complicationOther 
                            ? ventralHernia.procedure.complicationOther
                            : comp
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Top: CLOSURE, Middle: SPECIMEN, Bottom: PORTS AND INCISIONS */}
            <div className="space-y-6">
              {/* CLOSURE */}
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">CLOSURE</h5>
                <div className="space-y-2">
                  {ventralHernia.procedure.haemostasis && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Haemostasis: </span>
                      <span className="text-xs text-gray-700">{ventralHernia.procedure.haemostasis}</span>
                    </div>
                  )}
                  {ventralHernia.procedure.drain && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Drain: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.drain}
                        {ventralHernia.procedure.drain === 'Yes' && ventralHernia.procedure.drainDetails && (
                          <span> - {ventralHernia.procedure.drainDetails}</span>
                        )}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.fascialClosure?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Fascial Closure: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.fascialClosure.map(closure => 
                          closure === 'Other' && ventralHernia.procedure.fascialClosureOther 
                            ? ventralHernia.procedure.fascialClosureOther
                            : closure
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.fascialClosureMaterial?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Fascial Material Used: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.fascialClosureMaterial.map(material => 
                          material === 'Other' && ventralHernia.procedure.fascialClosureMaterialOther 
                            ? ventralHernia.procedure.fascialClosureMaterialOther
                            : material
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.skinClosure?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Skin Closure: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.skinClosure.map(closure => 
                          closure === 'Other' && ventralHernia.procedure.skinClosureOther 
                            ? ventralHernia.procedure.skinClosureOther
                            : closure
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {ventralHernia.procedure.skinClosureMaterial?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Skin Material Used: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.skinClosureMaterial.map(material => 
                          material === 'Other' && ventralHernia.procedure.skinClosureMaterialOther 
                            ? ventralHernia.procedure.skinClosureMaterialOther
                            : material
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* SPECIMEN */}
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">SPECIMEN</h5>
                <div className="space-y-2">
                  {ventralHernia.procedure.specimenSent?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Specimen Sent for Pathology: </span>
                      <span className="text-xs text-gray-700">
                        {ventralHernia.procedure.specimenSent.map(specimen => 
                          specimen === 'Other' && ventralHernia.procedure.specimenOther 
                            ? ventralHernia.procedure.specimenOther
                            : specimen
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                  {(ventralHernia.procedure.specimenSent?.includes('Hernia Sac') || 
                    ventralHernia.procedure.specimenSent?.includes('Other')) && 
                    ventralHernia.procedure.laboratoryName && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Specify Laboratory Sent to: </span>
                        <span className="text-xs text-gray-700">{ventralHernia.procedure.laboratoryName}</span>
                      </div>
                  )}
                </div>
              </div>
              
              {/* PORTS AND INCISIONS */}
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">PORTS AND INCISIONS</h5>
                {ventralHernia.procedureFindings && (ventralHernia.procedureFindings.findings || ventralHernia.procedureFindings.additionalNotes) && (
                  <div className="space-y-2">
                    {ventralHernia.procedureFindings.findings && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Surgical Markings: </span>
                        <span className="text-xs text-gray-700">Documented on anatomical diagram</span>
                      </div>
                    )}
                    {ventralHernia.procedureFindings.additionalNotes && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Diagram Notes: </span>
                        <span className="text-xs text-gray-700">{ventralHernia.procedureFindings.additionalNotes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom separator line */}
        <div className="border-t-2 border-gray-400 mt-6"></div>
        
        
        
        {/* NOTES and POST OPERATIVE MANAGEMENT Section */}
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - NOTES */}
            <div>
              <h5 className="text-xs font-bold text-gray-600 mb-3">NOTES</h5>
              <div className="space-y-2">
                {ventralHernia.procedure?.additionalNotes && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Additional Notes: </span>
                    <span className="text-xs text-gray-700">{ventralHernia.procedure.additionalNotes}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - POST OPERATIVE MANAGEMENT */}
            <div>
              <h5 className="text-xs font-bold text-gray-600 mb-3">POST OPERATIVE MANAGEMENT</h5>
              <div className="space-y-2">
                {ventralHernia.procedure?.postOperativeManagement && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Post Operative Management: </span>
                    <span className="text-xs text-gray-700">{ventralHernia.procedure.postOperativeManagement}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Signature Section */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-xs">
                <span className="font-medium text-gray-600">Surgeon's Signature:</span>
                <div className="mt-2 h-8 border-b border-gray-300"></div>
              </div>
              <div className="text-xs">
                <span className="font-medium text-gray-600">Date & Time:</span>
                <div className="mt-2 h-8 border-b border-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
        
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