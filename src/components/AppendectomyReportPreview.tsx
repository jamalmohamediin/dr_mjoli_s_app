import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateWithSuffix, formatReportDate, formatDateOnly } from "@/utils/dateFormatter";
import { getFullASAText } from '@/utils/asaDescriptions';
import appendectomyImage from '@/assets/appendectomy.jpg';

interface AppendectomyReportPreviewProps {
  report: {
    appendectomy?: {
      patientInfo: {
        name: string;
        patientId: string;
        dateOfBirth: string;
        age: string;
        sex: string;
        weight: string;
        height: string;
        bmi: string;
        asaScore: string[];
      };
      preoperative: {
        surgeons: string[];
        assistants?: string[];
        assistant1?: string;
        assistant2?: string;
        anaesthetist: string;
        duration: string;
        indication: string[];
        indicationOther: string;
        imaging: string[];
        imagingOther: string;
      };
      intraoperative: {
        appendixAppearance: string[];
        abscess: string;
        peritonitis: string[];
        otherFindings: string;
      };
      procedure: {
        approach: string[];
        reasonForConversion?: string;
        operationDescription?: string;
        incisionType: string[];
        incisionOther: string;
        trocarPlacement: string;
        divisionMethod: string[];
        divisionOther: string;
        mesenteryControl: string[];
        mesenteryOther: string;
        lavage: string;
        drainPlacement: string;
        drainLocation: string;
      };
      closure: {
        fascialClosure: string | string[];
        fascialClosureOther?: string;
        fascialMaterial?: string[];
        fascialMaterialOther?: string;
        skinClosure: string[];
        skinOther: string;
        skinMaterial?: string[];
        skinMaterialOther?: string;
        operativeDifficulty?: string[];
        operativeDifficultyOther?: string;
        complications: string | string[];
        complicationDetails?: string;
        visceralInjuryDetail?: string;
        complicationOther?: string;
        pathology: string;
        otherSpecimens: string;
        specimenDetails: string;
        surgeonSignature: string;
        surgeonSignatureText: string;
        dateTime: string;
      };
      procedureFindings?: {
        findings: string;
        additionalNotes: string;
      };
    };
  };
  onEditAppendectomyField?: (section: string, field: string, value: any) => void;
}

// Component to render surgical diagram with markings
const SurgicalDiagramDisplay = ({ markings }: { markings: any[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !markings.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawDiagram = () => {
      // Clear and draw base image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      // Draw all markings
      markings.forEach((marking) => {
        if (marking.type === 'port') {
          // Draw port marking: black line with size label
          ctx.save();
          ctx.font = 'bold 10px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(marking.size, marking.x, marking.y - 3);

          ctx.beginPath();
          ctx.moveTo(marking.x - 10, marking.y);
          ctx.lineTo(marking.x + 10, marking.y);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === 'stoma') {
          // Draw stoma marking
          ctx.save();
          if (marking.stomaType === 'ileostomy') {
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f59e0b'; // Gold/Yellow
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Dashed line
            ctx.stroke();
          } else { // colostomy
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);
            ctx.strokeStyle = '#16a34a'; // Green
            ctx.lineWidth = 4;
            ctx.setLineDash([]); // Continuous line
            ctx.stroke();
          }
          ctx.restore();
        } else if (marking.type === 'incision') {
          // Draw incision marking: dashed dark red line
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = '#8B0000'; // Dark red
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]); // Dashed line
          ctx.stroke();
          ctx.restore();
        }
      });
    };

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawDiagram();
    };

    if (image.complete && image.naturalHeight !== 0) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawDiagram();
    } else {
      image.src = appendectomyImage;
    }
  }, [markings]);

  return (
    <div className="mt-3 border rounded-lg overflow-hidden bg-white" style={{ maxWidth: 'fit-content' }}>
      <img ref={imageRef} src={appendectomyImage} alt="Surgical diagram" className="hidden" />
      <canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxHeight: '300px' }} />
    </div>
  );
};

export const AppendectomyReportPreview = ({ report }: AppendectomyReportPreviewProps) => {
  const appendectomy = report.appendectomy;

  if (!appendectomy) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the appendectomy form to see findings appear here.</p>
      </div>
    );
  }

  // Check if we have any appendectomy data to show
  const hasData = (
    appendectomy.preoperative.indication.length > 0 ||
    appendectomy.intraoperative.appendixAppearance.length > 0 ||
    appendectomy.patientInfo.name ||
    appendectomy.preoperative.surgeons?.some(s => s.trim()) ||
    appendectomy.intraoperative.abscess ||
    appendectomy.intraoperative.peritonitis.length > 0 ||
    appendectomy.intraoperative.otherFindings ||
    appendectomy.procedure.approach.length > 0 ||
    appendectomy.procedure.reasonForConversion ||
    appendectomy.procedure.operationDescription ||
    appendectomy.procedure.incisionType.length > 0 ||
    appendectomy.procedure.trocarPlacement ||
    appendectomy.procedure.divisionMethod.length > 0 ||
    appendectomy.procedure.mesenteryControl.length > 0 ||
    appendectomy.procedure.lavage ||
    appendectomy.procedure.drainPlacement ||
    appendectomy.closure.fascialClosure ||
    appendectomy.closure.skinClosure.length > 0 ||
    appendectomy.patientInfo.age ||
    appendectomy.patientInfo.sex ||
    appendectomy.patientInfo.bmi ||
    appendectomy.preoperative.assistants?.some(a => a.trim()) ||
    appendectomy.preoperative.assistant1 ||
    appendectomy.preoperative.assistant2 ||
    appendectomy.preoperative.anaesthetist ||
    appendectomy.patientInfo.asaScore ||
    appendectomy.closure.complications ||
    appendectomy.closure.pathology ||
    appendectomy.closure.otherSpecimens ||
    appendectomy.closure.surgeonSignature ||
    appendectomy.closure.surgeonSignatureText ||
    appendectomy.closure.dateTime
  );

  if (!hasData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the appendectomy form to see findings appear here.</p>
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
              <h4 className="text-base font-bold underline">Appendicectomy</h4>
            <p className="text-sm font-bold mt-2">APPENDECTOMY REPORT</p>
              <p className="text-xs">
                Generated: {formatDateWithSuffix(new Date())}
              </p>
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
        {(appendectomy.patientInfo.name || appendectomy.patientInfo.patientId || appendectomy.patientInfo.dateOfBirth || appendectomy.patientInfo.age || appendectomy.patientInfo.sex || appendectomy.patientInfo.weight || appendectomy.patientInfo.height || appendectomy.patientInfo.bmi || appendectomy.patientInfo.asaScore.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Patient Information</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {appendectomy.patientInfo.name && (
                <div><span className="font-medium">Patient:</span> {appendectomy.patientInfo.name}</div>
              )}
              {appendectomy.patientInfo.patientId && (
                <div><span className="font-medium">Patient ID:</span> {appendectomy.patientInfo.patientId}</div>
              )}
              {appendectomy.patientInfo.dateOfBirth && (
                <div><span className="font-medium">Date Of Birth:</span> {formatDateOnly(appendectomy.patientInfo.dateOfBirth)}</div>
              )}
              {appendectomy.patientInfo.age && (
                <div><span className="font-medium">Age:</span> {appendectomy.patientInfo.age}</div>
              )}
              {appendectomy.patientInfo.sex && (
                <div><span className="font-medium">Sex:</span> {appendectomy.patientInfo.sex.charAt(0).toUpperCase() + appendectomy.patientInfo.sex.slice(1).toLowerCase()}</div>
              )}
              {appendectomy.patientInfo.weight && (
                <div><span className="font-medium">Weight:</span> {appendectomy.patientInfo.weight} kg</div>
              )}
              {appendectomy.patientInfo.height && (
                <div><span className="font-medium">Height:</span> {appendectomy.patientInfo.height} cm</div>
              )}
              {appendectomy.patientInfo.bmi && (
                <div><span className="font-medium">BMI:</span> {appendectomy.patientInfo.bmi}</div>
              )}
            </div>
            {appendectomy.patientInfo.asaScore && (
              <div className="mt-2">
                <span className="text-xs font-medium text-gray-600">ASA Score:</span>
                <p className="text-xs text-gray-700 mt-1">{getFullASAText(appendectomy.patientInfo.asaScore)}</p>
              </div>
            )}
            {appendectomy.patientInfo.asaNotes && (
              <div className="mt-2">
                <span className="text-xs font-medium text-gray-600">ASA Notes:</span>
                <p className="text-xs text-gray-700 mt-1">{appendectomy.patientInfo.asaNotes}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Preoperative Information */}
        {(appendectomy.preoperative.surgeons?.some(s => s.trim()) || appendectomy.preoperative.assistants?.some(a => a.trim()) || appendectomy.preoperative.assistant1 || appendectomy.preoperative.anaesthetist || appendectomy.preoperative.duration) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
            {appendectomy.preoperative.surgeons?.some(s => s.trim()) && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgeon:</span> {appendectomy.preoperative.surgeons.filter(s => s.trim()).join(', ')}
              </p>
            )}
            {appendectomy.preoperative.assistants?.some(a => a.trim()) ? (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Assistant:</span> {appendectomy.preoperative.assistants.filter(a => a.trim()).join(', ')}
              </p>
            ) : (
              <>
                {appendectomy.preoperative.assistant1 && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Assistant 1:</span> {appendectomy.preoperative.assistant1}
                  </p>
                )}
                {appendectomy.preoperative.assistant2 && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Assistant 2:</span> {appendectomy.preoperative.assistant2}
                  </p>
                )}
              </>
            )}
            {appendectomy.preoperative.anaesthetist && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Anaesthetist:</span> {appendectomy.preoperative.anaesthetist}
              </p>
            )}
            {appendectomy.preoperative.duration && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Duration:</span> {appendectomy.preoperative.duration} min
              </p>
            )}
          </div>
        )}
        
        {/* Indication for Surgery */}
        {appendectomy.preoperative.indication.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Indication for Surgery</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.preoperative.indication.map((indication, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {indication === 'Other' && appendectomy.preoperative.indicationOther 
                    ? `Other: ${appendectomy.preoperative.indicationOther}` 
                    : indication}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Appendix Appearance */}
        {appendectomy.intraoperative.appendixAppearance.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Appendix Appearance</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.intraoperative.appendixAppearance.map((appearance, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {appearance}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Preoperative Imaging */}
        {appendectomy.preoperative.imaging.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Imaging</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.preoperative.imaging.map((imaging, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {imaging === 'Other' && appendectomy.preoperative.imagingOther 
                    ? `Other: ${appendectomy.preoperative.imagingOther}` 
                    : imaging}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Presence of Abscess */}
        {appendectomy.intraoperative.abscess && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Presence of Abscess</h5>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Abscess:</span> {appendectomy.intraoperative.abscess}
            </p>
          </div>
        )}
        
        {/* Presence of Peritonitis */}
        {appendectomy.intraoperative.peritonitis.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Presence of Peritonitis</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.intraoperative.peritonitis.map((peritonitis, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {peritonitis}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Other Intra-abdominal Findings */}
        {appendectomy.intraoperative.otherFindings && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Other Intra-abdominal Findings</h5>
            <p className="text-xs text-gray-700">
              {appendectomy.intraoperative.otherFindings}
            </p>
          </div>
        )}
        
        {/* Surgical Approach */}
        {appendectomy.procedure.approach.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Approach</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.procedure.approach.map((approach, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {approach}
                </Badge>
              ))}
            </div>
            {appendectomy.procedure.approach.includes('Converted from Laparoscopic to Open') && appendectomy.procedure.reasonForConversion && (
              <div className="mt-2">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Reason for Conversion:</span> {appendectomy.procedure.reasonForConversion}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Incision Type */}
        {appendectomy.procedure.incisionType.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Incision Type</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.procedure.incisionType.map((incision, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {incision === 'Other' && appendectomy.procedure.incisionOther 
                    ? `Other: ${appendectomy.procedure.incisionOther}` 
                    : incision}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Trocar Placement */}
        {appendectomy.procedure.trocarPlacement && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Trocar Placement</h5>
            <p className="text-xs text-gray-700">
              {appendectomy.procedure.trocarPlacement}
            </p>
          </div>
        )}
        
        {/* Operation Description */}
        {appendectomy.procedure.operationDescription && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Operation Description</h5>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">
              {appendectomy.procedure.operationDescription}
            </p>
          </div>
        )}
        
        {/* Method of Appendiceal Division */}
        {appendectomy.procedure.divisionMethod.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Method of Appendiceal Ligation</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.procedure.divisionMethod.map((method, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {method === 'Other' && appendectomy.procedure.divisionOther 
                    ? `Other: ${appendectomy.procedure.divisionOther}` 
                    : method}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Mesentery Control */}
        {appendectomy.procedure.mesenteryControl.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Method of Appendiceal Vessel Ligation</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.procedure.mesenteryControl.map((control, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {control === 'Other' && appendectomy.procedure.mesenteryOther 
                    ? `Other: ${appendectomy.procedure.mesenteryOther}` 
                    : control}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Peritoneal Lavage */}
        {appendectomy.procedure.lavage && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Peritoneal Lavage</h5>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Lavage:</span> {appendectomy.procedure.lavage}
            </p>
          </div>
        )}
        
        {/* Drain Placement */}
        {appendectomy.procedure.drainPlacement && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Drain Placement</h5>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Drain:</span> {appendectomy.procedure.drainPlacement}
              {appendectomy.procedure.drainLocation && ` (Location: ${appendectomy.procedure.drainLocation})`}
            </p>
          </div>
        )}
        
        {/* Fascial Closure */}
        {appendectomy.closure.fascialClosure && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Fascial Closure</h5>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(appendectomy.closure.fascialClosure) ? appendectomy.closure.fascialClosure : [appendectomy.closure.fascialClosure]).map((closure, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {closure === 'Other' && appendectomy.closure.fascialClosureOther 
                    ? `Other: ${appendectomy.closure.fascialClosureOther}` 
                    : closure}
                </Badge>
              ))}
            </div>
            {appendectomy.closure.fascialMaterial && appendectomy.closure.fascialMaterial.length > 0 && (
              <div className="mt-1">
                <span className="text-xs font-medium">Material Used: </span>
                <span className="text-xs">{appendectomy.closure.fascialMaterial.map((mat, idx) => 
                  mat === 'Other' && appendectomy.closure.fascialMaterialOther ? appendectomy.closure.fascialMaterialOther : mat
                ).join(', ')}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Skin Closure */}
        {appendectomy.closure.skinClosure.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Skin Closure</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.closure.skinClosure.map((closure, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {closure === 'Other' && appendectomy.closure.skinOther 
                    ? `Other: ${appendectomy.closure.skinOther}` 
                    : closure}
                </Badge>
              ))}
            </div>
            {appendectomy.closure.skinMaterial && appendectomy.closure.skinMaterial.length > 0 && (
              <div className="mt-1">
                <span className="text-xs font-medium">Material Used: </span>
                <span className="text-xs">{appendectomy.closure.skinMaterial.map((mat, idx) => 
                  mat === 'Other' && appendectomy.closure.skinMaterialOther ? appendectomy.closure.skinMaterialOther : mat
                ).join(', ')}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Intra-Operative Difficulty */}
        {appendectomy.closure.operativeDifficulty && appendectomy.closure.operativeDifficulty.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Intra-Operative Difficulty</h5>
            <div className="flex flex-wrap gap-1">
              {appendectomy.closure.operativeDifficulty.map((difficulty, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {difficulty === 'Other' && appendectomy.closure.operativeDifficultyOther 
                    ? `Other: ${appendectomy.closure.operativeDifficultyOther}` 
                    : difficulty}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Intra-Operative Complications */}
        {appendectomy.closure.complications && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Intra-Operative Complications</h5>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(appendectomy.closure.complications) ? appendectomy.closure.complications : [appendectomy.closure.complications]).map((complication, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {complication === 'Visceral Injury' && appendectomy.closure.visceralInjuryDetail 
                    ? `Visceral Injury: ${appendectomy.closure.visceralInjuryDetail}` 
                    : complication === 'Other' && appendectomy.closure.complicationOther
                    ? `Other: ${appendectomy.closure.complicationOther}`
                    : complication}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Pathology */}
        {appendectomy.closure.pathology && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Specimen Information</h5>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Appendix Sent for Pathology:</span> {appendectomy.closure.pathology}
            </p>
            {appendectomy.closure.otherSpecimens && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Other Specimens:</span> {appendectomy.closure.otherSpecimens}
                {appendectomy.closure.specimenDetails && ` - ${appendectomy.closure.specimenDetails}`}
              </p>
            )}
          </div>
        )}
        
        {/* Surgeon Signature */}
        {(appendectomy.closure.surgeonSignatureText || appendectomy.closure.surgeonSignature || appendectomy.closure.dateTime) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Documentation</h5>
            {appendectomy.closure.surgeonSignatureText && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgeon's Signature:</span> {appendectomy.closure.surgeonSignatureText}
              </p>
            )}
            {!appendectomy.closure.surgeonSignatureText && appendectomy.closure.surgeonSignature && (
              <div className="space-y-1">
                <p className="text-xs text-gray-700 font-medium">Surgeon's Signature:</p>
                {appendectomy.closure.surgeonSignature.startsWith('data:image') ? (
                  <img 
                    src={appendectomy.closure.surgeonSignature} 
                    alt="Surgeon signature" 
                    className="max-h-8 max-w-32 object-contain border rounded bg-gray-50"
                  />
                ) : (
                  <p className="text-xs text-gray-700">{appendectomy.closure.surgeonSignature}</p>
                )}
              </div>
            )}
            {appendectomy.closure.dateTime && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Date:</span> {formatDateOnly(appendectomy.closure.dateTime)}
              </p>
            )}
          </div>
        )}
        
        {/* Surgical Diagram */}
        {appendectomy.procedureFindings?.findings && (
          (() => {
            try {
              const markings = JSON.parse(appendectomy.procedureFindings.findings);
              if (Array.isArray(markings) && markings.length > 0 && markings[0].type) {
                return (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">Port Sites and Incisions</h5>
                    
                    {/* Legend/Key */}
                    <div className="bg-gray-50 p-3 rounded border text-xs">
                      <h6 className="font-medium text-gray-700 mb-2">Legend:</h6>
                      <div className="grid grid-cols-1 gap-1 text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-black"></div>
                          <span>Ports (with size label)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-amber-500 rounded-full" style={{borderStyle: 'dashed'}}></div>
                          <span>Ileostomy (dashed yellow circle)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-green-600 rounded-full"></div>
                          <span>Colostomy (solid green circle)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-red-900" style={{backgroundImage: 'repeating-linear-gradient(90deg, #7f1d1d 0, #7f1d1d 4px, transparent 4px, transparent 8px)'}}></div>
                          <span>Incisions (dashed dark red line)</span>
                        </div>
                      </div>
                    </div>
                    
                    <SurgicalDiagramDisplay markings={markings} />
                  </div>
                );
              }
            } catch (e) {
              // Not JSON, skip
            }
            return null;
          })()
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