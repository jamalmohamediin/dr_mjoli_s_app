import { Separator } from "@/components/ui/separator";
import {
  formatDateDDMMYYYYWithDashes,
  formatDateTimeDDMMYYYYWithDashes,
} from "@/utils/dateFormatter";
import { getPatientInfoDisplayEntries } from "@/utils/patientSticker";

interface VentralHerniaReportPreviewProps {
  report: {
    ventralHernia?: {
      patientInfo: any;
      preoperative: any;
      operative: any;
      procedure: any;
      closure?: any;
      procedureFindings?: {
        findings: string;
        additionalNotes: string;
      };
    };
  };
  onEditVentralHerniaField?: (section: string, field: string, value: any) => void;
}

const getDisplayValues = (values: any[] = [], otherValue = "") =>
  values.map((value) => {
    if (value === "Other" && otherValue.trim()) {
      return `Other: ${otherValue.trim()}`;
    }

    return value;
  });

const formatSelectionList = (values: any[] = [], otherValue = "") =>
  getDisplayValues(values, otherValue).join(", ");

const hasValue = (value: any) =>
  Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());

export const VentralHerniaReportPreview = ({ report }: VentralHerniaReportPreviewProps) => {
  const ventralHernia = report.ventralHernia;

  if (!ventralHernia) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the ventral hernia repair form to see the live report here.</p>
      </div>
    );
  }

  const patientEntries = getPatientInfoDisplayEntries(ventralHernia.patientInfo);
  const preoperative = ventralHernia.preoperative || {};
  const operative = ventralHernia.operative || {};
  const procedure = ventralHernia.procedure || {};
  const closure = ventralHernia.closure || {};

  const hasPatientData = patientEntries.length > 0;
  const hasPreoperativeData = Object.values(preoperative).some(hasValue);
  const hasOperativeData = Object.values(operative).some(hasValue);
  const hasProcedureData = Object.values(procedure).some(hasValue);
  const hasClosureData = Object.values(closure).some(hasValue);

  if (!hasPatientData && !hasPreoperativeData && !hasOperativeData && !hasProcedureData && !hasClosureData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the ventral hernia repair form to see the live report here.</p>
      </div>
    );
  }

  const surgeons = (preoperative.surgeons || []).filter((value: string) => value.trim()).join(", ");
  const assistants = (preoperative.assistants || []).filter((value: string) => value.trim()).join(", ");
  const anaesthetists = (preoperative.anaesthetists || []).filter((value: string) => value.trim()).join(", ");
  const procedureUrgency = (preoperative.procedureUrgency || []).join(", ");
  const indicationText = formatSelectionList(preoperative.indication || [], preoperative.indicationOther || "");
  const imagingText = formatSelectionList(preoperative.imaging || [], preoperative.imagingOther || "");

  const herniaTypeText = formatSelectionList(operative.herniaType || [], operative.herniaTypeOther || "");
  const herniaSiteText = formatSelectionList(operative.herniaSite || [], operative.herniaSiteOther || "");
  const contentsText = formatSelectionList(operative.contents || [], operative.contentsOther || "");
  const approachText = formatSelectionList(operative.approach || [], operative.approachOther || "");
  const conversionReasonText = formatSelectionList(
    operative.conversionReason || [],
    operative.conversionReasonOther || "",
  );

  const closureTechniqueText = formatSelectionList(
    procedure.closureTechnique || [],
    procedure.closureTechniqueOther || "",
  );
  const closureMaterialText = formatSelectionList(
    procedure.closureMaterial || [],
    procedure.closureMaterialOther || "",
  );
  const primaryRepairText = formatSelectionList(
    procedure.primaryRepair || [],
    procedure.primaryRepairOther || "",
  );
  const meshPlacementText = formatSelectionList(
    procedure.meshType || [],
    procedure.meshPlacementOther || "",
  );
  const meshMaterialText = formatSelectionList(
    procedure.meshMaterial || [],
    procedure.meshMaterialOther || "",
  );
  const fixationText = formatSelectionList(procedure.fixation || [], procedure.fixationOther || "");
  const difficultyText = formatSelectionList(
    procedure.intraOperativeDifficulty || [],
    procedure.intraOperativeDifficultyOther || "",
  );
  const complicationsText = formatSelectionList(
    procedure.complications || [],
    procedure.complicationOther || "",
  );
  const drainTypeText = formatSelectionList(procedure.drainType || [], procedure.drainTypeOther || "");
  const drainPlacementText = formatSelectionList(
    procedure.intraPeritonealPlacement || [],
    procedure.intraPeritonealPlacementOther || "",
  );
  const drainExitSiteText = formatSelectionList(
    procedure.drainExitSite || [],
    procedure.drainExitSiteOther || "",
  );
  const fascialClosureText = formatSelectionList(
    procedure.fascialClosure || [],
    procedure.fascialClosureOther || "",
  );
  const fascialClosureMaterialText = formatSelectionList(
    procedure.fascialClosureMaterial || [],
    procedure.fascialClosureMaterialOther || "",
  );
  const skinClosureText = formatSelectionList(
    procedure.skinClosure || [],
    procedure.skinClosureOther || "",
  );
  const skinClosureMaterialText = formatSelectionList(
    procedure.skinClosureMaterial || [],
    procedure.skinClosureMaterialOther || "",
  );
  const specimenText = formatSelectionList(procedure.specimenSent || [], procedure.specimenOther || "");

  return (
    <>
      <div className="space-y-4">
        <div className="border-b pb-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-sm">Dr. Monde Mjoli</p>
              <p className="font-bold">Specialist Surgeon</p>
              <p>MBChB (UNITRA), MMed (UKZN), FCS(SA),</p>
              <p>Cert Gastroenterology, Surg (SA)</p>
              <p>Practice No. 0560812</p>
              <p>Cell: 082 417 2630</p>
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-sm font-bold">VENTRAL HERNIA REPAIR REPORT</h4>
              <p className="text-xs">Generated: {formatDateDDMMYYYYWithDashes(new Date())}</p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-bold">St. Dominic&apos;s Medical Suites B</p>
              <p>56 St James Road, Southernwood</p>
              <p>East London, 5201</p>
              <p>Tel: 043 743 7872</p>
              <p>Fax: 043 743 6653</p>
            </div>
          </div>
        </div>

        {patientEntries.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Patient Information</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {patientEntries.map((entry) => (
                <div key={entry.label} className={entry.fullWidth ? "col-span-2" : ""}>
                  <span className="font-medium">{entry.label}:</span> {entry.value}
                </div>
              ))}
            </div>
          </div>
        )}

        {(surgeons ||
          assistants ||
          anaesthetists ||
          preoperative.anaesthetist ||
          preoperative.startTime ||
          preoperative.endTime ||
          preoperative.duration ||
          procedureUrgency ||
          indicationText ||
          imagingText) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
            {surgeons && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgeon:</span> {surgeons}
              </p>
            )}
            {assistants && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Assistant:</span> {assistants}
              </p>
            )}
            {(anaesthetists || preoperative.anaesthetist) && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Anaesthetist:</span> {anaesthetists || preoperative.anaesthetist}
              </p>
            )}
            {(preoperative.startTime || preoperative.endTime || preoperative.duration) && (
              <div className="text-xs text-gray-700 space-y-1">
                {preoperative.startTime && (
                  <p>
                    <span className="font-medium">Start Time:</span> {preoperative.startTime}
                  </p>
                )}
                {preoperative.endTime && (
                  <p>
                    <span className="font-medium">End Time:</span> {preoperative.endTime}
                  </p>
                )}
                {preoperative.duration && (
                  <p>
                    <span className="font-medium">Total Duration:</span> {preoperative.duration} minutes
                  </p>
                )}
              </div>
            )}
            {procedureUrgency && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Procedure Urgency:</span> {procedureUrgency}
              </p>
            )}
            {imagingText && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Preoperative Imaging:</span> {imagingText}
              </p>
            )}
            {indicationText && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Indication for Surgery:</span> {indicationText}
              </p>
            )}
          </div>
        )}

        <div className="border-t-2 border-gray-400 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">OPERATIVE FINDINGS</h5>
                <div className="space-y-2">
                  {herniaTypeText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Hernia Type: </span>
                      <span className="text-xs text-gray-700">{herniaTypeText}</span>
                    </div>
                  )}
                  {herniaSiteText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Site of Hernia: </span>
                      <span className="text-xs text-gray-700">{herniaSiteText}</span>
                    </div>
                  )}
                  {(operative.herniaDefectLength || operative.herniaDefectWidth) && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Total Hernia Defect Size: </span>
                      <span className="text-xs text-gray-700">
                        {operative.herniaDefectLength || "___"} cm (Length) x {operative.herniaDefectWidth || "___"} cm (Width)
                      </span>
                    </div>
                  )}
                  {operative.numberOfDefects && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Number of Defects: </span>
                      <span className="text-xs text-gray-700">{operative.numberOfDefects}</span>
                    </div>
                  )}
                  {contentsText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Contents: </span>
                      <span className="text-xs text-gray-700">{contentsText}</span>
                    </div>
                  )}
                  {operative.strangulation && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Strangulation/Ischaemia: </span>
                      <span className="text-xs text-gray-700">{operative.strangulation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">PROCEDURE DETAILS</h5>
                <div className="space-y-2">
                  {operative.operationDescription && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Operation Description: </span>
                      <span className="text-xs text-gray-700">{operative.operationDescription}</span>
                    </div>
                  )}
                  {approachText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Surgical Approach: </span>
                      <span className="text-xs text-gray-700">{approachText}</span>
                    </div>
                  )}
                  {conversionReasonText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Reason for Conversion: </span>
                      <span className="text-xs text-gray-700">{conversionReasonText}</span>
                    </div>
                  )}
                  {operative.trocarNumber && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Trocar Number: </span>
                      <span className="text-xs text-gray-700">{operative.trocarNumber}</span>
                    </div>
                  )}
                  {procedure.sacExcised && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Sac Excised: </span>
                      <span className="text-xs text-gray-700">{procedure.sacExcised}</span>
                    </div>
                  )}
                  {procedure.fatDissected && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Pre-peritoneal Fat Dissected Off Sheath: </span>
                      <span className="text-xs text-gray-700">{procedure.fatDissected}</span>
                    </div>
                  )}
                  {procedure.defectClosed && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Hernia Defect Closed: </span>
                      <span className="text-xs text-gray-700">{procedure.defectClosed}</span>
                    </div>
                  )}
                  {closureTechniqueText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Closure Technique: </span>
                      <span className="text-xs text-gray-700">{closureTechniqueText}</span>
                    </div>
                  )}
                  {closureMaterialText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Material Used: </span>
                      <span className="text-xs text-gray-700">{closureMaterialText}</span>
                    </div>
                  )}
                  {procedure.repairType && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Repair Type: </span>
                      <span className="text-xs text-gray-700">{procedure.repairType}</span>
                    </div>
                  )}
                  {primaryRepairText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Primary Tissue Repair: </span>
                      <span className="text-xs text-gray-700">{primaryRepairText}</span>
                    </div>
                  )}
                  {meshPlacementText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Mesh Placement: </span>
                      <span className="text-xs text-gray-700">{meshPlacementText}</span>
                    </div>
                  )}
                  {meshMaterialText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Mesh Material: </span>
                      <span className="text-xs text-gray-700">{meshMaterialText}</span>
                    </div>
                  )}
                  {(procedure.meshLength || procedure.meshWidth) && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Mesh Size: </span>
                      <span className="text-xs text-gray-700">
                        {procedure.meshLength || "___"} x {procedure.meshWidth || "___"} cm
                      </span>
                    </div>
                  )}
                  {fixationText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Fixation: </span>
                      <span className="text-xs text-gray-700">{fixationText}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">COMPLICATIONS</h5>
                <div className="space-y-2">
                  {difficultyText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Intra-Operative Difficulty: </span>
                      <span className="text-xs text-gray-700">{difficultyText}</span>
                    </div>
                  )}
                  {complicationsText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Intraoperative Complications: </span>
                      <span className="text-xs text-gray-700">{complicationsText}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">CLOSURE</h5>
                <div className="space-y-2">
                  {procedure.haemostasis && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Haemostasis: </span>
                      <span className="text-xs text-gray-700">{procedure.haemostasis}</span>
                    </div>
                  )}
                  {procedure.drain && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium text-gray-600">Drain:</span> {procedure.drain}
                      </p>
                      {procedure.drain === "Yes" && drainTypeText && (
                        <p className="text-xs text-gray-700 ml-4">
                          <span className="font-medium text-gray-600">Type of Drain:</span> {drainTypeText}
                        </p>
                      )}
                      {procedure.drain === "Yes" && drainPlacementText && (
                        <p className="text-xs text-gray-700 ml-4">
                          <span className="font-medium text-gray-600">Intra-Peritoneal Placement:</span> {drainPlacementText}
                        </p>
                      )}
                      {procedure.drain === "Yes" && drainExitSiteText && (
                        <p className="text-xs text-gray-700 ml-4">
                          <span className="font-medium text-gray-600">Exit Site:</span> {drainExitSiteText}
                        </p>
                      )}
                      {procedure.drain === "Yes" && procedure.drainDetails && (
                        <p className="text-xs text-gray-700 ml-4">
                          <span className="font-medium text-gray-600">Additional Drain Details:</span> {procedure.drainDetails}
                        </p>
                      )}
                    </div>
                  )}
                  {fascialClosureText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Fascial Closure: </span>
                      <span className="text-xs text-gray-700">{fascialClosureText}</span>
                    </div>
                  )}
                  {fascialClosureMaterialText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Fascial Material Used: </span>
                      <span className="text-xs text-gray-700">{fascialClosureMaterialText}</span>
                    </div>
                  )}
                  {skinClosureText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Skin Closure: </span>
                      <span className="text-xs text-gray-700">{skinClosureText}</span>
                    </div>
                  )}
                  {skinClosureMaterialText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Skin Material Used: </span>
                      <span className="text-xs text-gray-700">{skinClosureMaterialText}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">SPECIMEN</h5>
                <div className="space-y-2">
                  {specimenText && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Specimen Sent for Pathology: </span>
                      <span className="text-xs text-gray-700">{specimenText}</span>
                    </div>
                  )}
                  {procedure.laboratoryName && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Specify Laboratory Sent to: </span>
                      <span className="text-xs text-gray-700">{procedure.laboratoryName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-600 mb-3">PORTS AND INCISIONS</h5>
                {ventralHernia.procedureFindings &&
                  (ventralHernia.procedureFindings.findings || ventralHernia.procedureFindings.additionalNotes) && (
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

        <div className="border-t-2 border-gray-400 mt-6"></div>

        <div className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="text-xs font-bold text-gray-600 mb-3">NOTES</h5>
              <div className="space-y-2">
                {procedure.additionalNotes && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Additional Notes: </span>
                    <span className="text-xs text-gray-700 whitespace-pre-wrap">{procedure.additionalNotes}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-gray-600 mb-3">POST OPERATIVE MANAGEMENT</h5>
              <div className="space-y-2">
                {procedure.postOperativeManagement && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Post Operative Management: </span>
                    <span className="text-xs text-gray-700 whitespace-pre-wrap">{procedure.postOperativeManagement}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(closure.surgeonSignatureText || closure.surgeonSignature || closure.dateTime) && (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-xs space-y-2">
                  <span className="font-medium text-gray-600">Surgeon&apos;s Signature:</span>
                  {closure.surgeonSignatureText && (
                    <p className="text-gray-700">{closure.surgeonSignatureText}</p>
                  )}
                  {!closure.surgeonSignatureText && closure.surgeonSignature && (
                    <div>
                      {String(closure.surgeonSignature).startsWith("data:image") ? (
                        <img
                          src={closure.surgeonSignature}
                          alt="Surgeon signature"
                          className="max-h-10 max-w-36 rounded border bg-gray-50 object-contain"
                        />
                      ) : (
                        <p className="text-gray-700">{closure.surgeonSignature}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs space-y-2">
                  <span className="font-medium text-gray-600">Date &amp; Time:</span>
                  {closure.dateTime && (
                    <p className="text-gray-700">{formatDateTimeDDMMYYYYWithDashes(closure.dateTime)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-6 text-center text-xs space-y-1">
          <p>Dr. Monde Mjoli - Specialist Surgeon</p>
          <p>Practice Number: 0560812</p>
          <p>Report Date: {formatDateDDMMYYYYWithDashes(new Date())} | Page 1 of 1</p>
        </div>
      </div>
      <Separator />
    </>
  );
};
