import React, { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getFullASAText } from "@/utils/asaDescriptions";
import { getPatientInfoDisplayEntries } from "@/utils/patientSticker";
import { formatDateTimeDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import appendectomyImage from "@/assets/appendectomy.jpg";

interface CholecystectomyReportPreviewProps {
  report: any;
}

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

const renderSelection = (values: string[], otherValue?: string) =>
  values
    .map((value) => {
      if (value === "Other" && otherValue?.trim()) {
        return `Other: ${otherValue}`;
      }
      return value;
    })
    .filter(Boolean);

const SurgicalDiagramDisplay = ({ markings }: { markings: any[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !markings.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawDiagram = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      markings.forEach((marking) => {
        if (marking.type === "port") {
          ctx.save();
          ctx.font = "bold 10px Arial";
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(marking.size, marking.x, marking.y - 3);
          ctx.beginPath();
          ctx.moveTo(marking.x - 10, marking.y);
          ctx.lineTo(marking.x + 10, marking.y);
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "stoma") {
          ctx.save();
          ctx.beginPath();
          ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);
          ctx.strokeStyle = marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
          ctx.lineWidth = marking.stomaType === "ileostomy" ? 2 : 4;
          ctx.setLineDash(marking.stomaType === "ileostomy" ? [5, 3] : []);
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "incision") {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = "#8B0000";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
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
    <div className="mt-3 border rounded-lg overflow-hidden bg-white" style={{ maxWidth: "fit-content" }}>
      <img ref={imageRef} src={appendectomyImage} alt="Surgical diagram" className="hidden" />
      <canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxHeight: "300px" }} />
    </div>
  );
};

export const CholecystectomyReportPreview = ({ report }: CholecystectomyReportPreviewProps) => {
  const cholecystectomy = report.cholecystectomy;
  const patientEntries = getPatientInfoDisplayEntries(cholecystectomy?.patientInfo);

  const hasData =
    patientEntries.length > 0 ||
    cholecystectomy?.preoperative?.surgeons?.some((item: string) => item?.trim()) ||
    cholecystectomy?.preoperative?.indication?.length > 0 ||
    cholecystectomy?.intraoperative?.gallbladderAppearance?.length > 0 ||
    cholecystectomy?.procedure?.approach?.length > 0 ||
    cholecystectomy?.closure?.skinClosureMethod?.length > 0 ||
    cholecystectomy?.additionalInfo?.additionalInformation;

  if (!hasData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">
          Start filling out the cholecystectomy form to see findings appear here.
        </p>
      </div>
    );
  }

  let surgicalMarkings: any[] = [];
  try {
    const parsed = JSON.parse(cholecystectomy?.procedureFindings?.findings || "[]");
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) {
      surgicalMarkings = parsed;
    }
  } catch (error) {
    surgicalMarkings = [];
  }

  const indications = renderSelection(
    toArray(cholecystectomy?.preoperative?.indication),
    cholecystectomy?.preoperative?.indicationOther
  );
  const imaging = renderSelection(
    toArray(cholecystectomy?.preoperative?.imaging),
    cholecystectomy?.preoperative?.imagingOther
  );
  const appearance = renderSelection(
    toArray(cholecystectomy?.intraoperative?.gallbladderAppearance),
    cholecystectomy?.intraoperative?.gallbladderAppearanceOther
  );
  const approach = toArray(cholecystectomy?.procedure?.approach);
  const conversionReasons = renderSelection(
    toArray(cholecystectomy?.procedure?.reasonForConversion),
    cholecystectomy?.procedure?.reasonForConversionOther
  );
  const subtotalReasons = renderSelection(
    toArray(cholecystectomy?.procedure?.subtotalReason),
    cholecystectomy?.procedure?.subtotalReasonOther
  );
  const cysticDuctControl = renderSelection(
    toArray(cholecystectomy?.procedure?.cysticDuctControl),
    cholecystectomy?.procedure?.cysticDuctControlOther
  );
  const cysticArteryControl = renderSelection(
    toArray(cholecystectomy?.procedure?.cysticArteryControl),
    cholecystectomy?.procedure?.cysticArteryControlOther
  );
  const liverBedDissection = renderSelection(
    toArray(cholecystectomy?.procedure?.gallbladderDissectedFromLiverBed),
    cholecystectomy?.procedure?.gallbladderDissectedFromLiverBedOther
  );
  const additionalProcedures = renderSelection(
    toArray(cholecystectomy?.procedure?.additionalProcedures),
    cholecystectomy?.procedure?.additionalProceduresOther
  );
  const cholangiogramFindings = renderSelection(
    toArray(cholecystectomy?.procedure?.cholangiogramFindings),
    cholecystectomy?.procedure?.cholangiogramOther
  );
  const retrieval = renderSelection(
    toArray(cholecystectomy?.procedure?.gallbladderRetrieval),
    cholecystectomy?.procedure?.gallbladderRetrievalOther
  );
  const drainType = renderSelection(
    toArray(cholecystectomy?.procedure?.drainType),
    cholecystectomy?.procedure?.drainTypeOther
  );
  const drainPlacement = renderSelection(
    toArray(cholecystectomy?.procedure?.intraPeritonealPlacement),
    cholecystectomy?.procedure?.intraPeritonealPlacementOther
  );
  const drainExitSite = renderSelection(
    toArray(cholecystectomy?.procedure?.drainExitSite),
    cholecystectomy?.procedure?.drainExitSiteOther
  );
  const skinClosure = renderSelection(
    toArray(cholecystectomy?.closure?.skinClosureMethod),
    cholecystectomy?.closure?.skinClosureOther
  );
  const difficulty = renderSelection(
    toArray(cholecystectomy?.closure?.intraoperativeDifficulty),
    cholecystectomy?.closure?.intraoperativeDifficultyOther
  );
  const complications = renderSelection(
    toArray(cholecystectomy?.closure?.complications),
    cholecystectomy?.closure?.complicationsOther
  );

  return (
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
            <h4 className="text-sm font-bold">CHOLECYSTECTOMY REPORT</h4>
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

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
          {cholecystectomy?.preoperative?.surgeons?.filter((item: string) => item.trim()).length >
            0 && (
            <div>
              <span className="font-medium">Surgeon:</span>{" "}
              {cholecystectomy.preoperative.surgeons
                .filter((item: string) => item.trim())
                .join(", ")}
            </div>
          )}
          {cholecystectomy?.preoperative?.assistants?.filter((item: string) => item.trim()).length >
            0 && (
            <div>
              <span className="font-medium">Assistant:</span>{" "}
              {cholecystectomy.preoperative.assistants
                .filter((item: string) => item.trim())
                .join(", ")}
            </div>
          )}
          {cholecystectomy?.preoperative?.anaesthetists?.filter((item: string) => item.trim())
            .length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Anaesthetist:</span>{" "}
              {cholecystectomy.preoperative.anaesthetists
                .filter((item: string) => item.trim())
                .join(", ")}
            </div>
          )}
          {cholecystectomy?.preoperative?.startTime && (
            <div>
              <span className="font-medium">Start Time:</span>{" "}
              {cholecystectomy.preoperative.startTime}
            </div>
          )}
          {cholecystectomy?.preoperative?.endTime && (
            <div>
              <span className="font-medium">End Time:</span>{" "}
              {cholecystectomy.preoperative.endTime}
            </div>
          )}
          {cholecystectomy?.preoperative?.duration && (
            <div className="col-span-2">
              <span className="font-medium">Total Duration:</span>{" "}
              {cholecystectomy.preoperative.duration} minutes
            </div>
          )}
          {cholecystectomy?.preoperative?.procedureUrgency && (
            <div>
              <span className="font-medium">Procedure Urgency:</span>{" "}
              {cholecystectomy.preoperative.procedureUrgency}
            </div>
          )}
          {imaging.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Preoperative Imaging:</span> {imaging.join(", ")}
            </div>
          )}
          {indications.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Indication for Surgery:</span>{" "}
              {indications.join(", ")}
            </div>
          )}
          {cholecystectomy?.preoperative?.operationDescription && (
            <div className="col-span-2">
              <span className="font-medium">Operation Description:</span>{" "}
              {cholecystectomy.preoperative.operationDescription}
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Intraoperative Findings</h5>
        <div className="space-y-2 text-xs text-gray-700">
          {appearance.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="font-medium mr-1">Gall Bladder Appearance:</span>
              {appearance.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
          {cholecystectomy?.intraoperative?.adhesionsToGallbladder && (
            <div>
              <span className="font-medium">Adhesions to Gall Bladder:</span>{" "}
              {cholecystectomy.intraoperative.adhesionsToGallbladder}
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Procedure Details</h5>
        <div className="space-y-2 text-xs text-gray-700">
          {approach.length > 0 && (
            <div>
              <span className="font-medium">Surgical Approach:</span> {approach.join(", ")}
            </div>
          )}
          {conversionReasons.length > 0 && (
            <div>
              <span className="font-medium">Reason for Conversion:</span>{" "}
              {conversionReasons.join(", ")}
            </div>
          )}
          {surgicalMarkings.length > 0 && (
            <div>
              <span className="font-medium">Access and Ports:</span>
              <SurgicalDiagramDisplay markings={surgicalMarkings} />
            </div>
          )}
          {cholecystectomy?.procedure?.subtotalCholecystectomy && (
            <div>
              <span className="font-medium">Subtotal Cholecystectomy:</span>{" "}
              {cholecystectomy.procedure.subtotalCholecystectomy}
            </div>
          )}
          {subtotalReasons.length > 0 && (
            <div>
              <span className="font-medium">Reason for Subtotal Cholecystectomy:</span>{" "}
              {subtotalReasons.join(", ")}
            </div>
          )}
          {cholecystectomy?.procedure?.gallbladderDecompressionRequired && (
            <div>
              <span className="font-medium">Gall Bladder Decompression Required:</span>{" "}
              {cholecystectomy.procedure.gallbladderDecompressionRequired}
            </div>
          )}
          <div>
            <span className="font-medium">Critical View of Safety:</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {cholecystectomy?.procedure?.calotsTriangleDissected && (
              <div>
                <span className="font-medium">Calot&apos;s Triangle Dissected:</span>{" "}
                {cholecystectomy.procedure.calotsTriangleDissected}
              </div>
            )}
            {cholecystectomy?.procedure?.cysticDuctIdentified && (
              <div>
                <span className="font-medium">Cystic Duct Identified:</span>{" "}
                {cholecystectomy.procedure.cysticDuctIdentified}
              </div>
            )}
            {cholecystectomy?.procedure?.cysticArteryIdentified && (
              <div>
                <span className="font-medium">Cystic Artery Identified:</span>{" "}
                {cholecystectomy.procedure.cysticArteryIdentified}
              </div>
            )}
            {cholecystectomy?.procedure?.twoStructuresConfirmed && (
              <div>
                <span className="font-medium">
                  Two Structures Entering Gall Bladder Confirmed:
                </span>{" "}
                {cholecystectomy.procedure.twoStructuresConfirmed}
              </div>
            )}
          </div>
          {cysticDuctControl.length > 0 && (
            <div>
              <span className="font-medium">Cystic Duct Control:</span>{" "}
              {cysticDuctControl.join(", ")}
            </div>
          )}
          {cysticArteryControl.length > 0 && (
            <div>
              <span className="font-medium">Cystic Artery Control:</span>{" "}
              {cysticArteryControl.join(", ")}
            </div>
          )}
          {liverBedDissection.length > 0 && (
            <div>
              <span className="font-medium">Gall Bladder Dissected from Liver Bed:</span>{" "}
              {liverBedDissection.join(", ")}
            </div>
          )}
          {cholecystectomy?.procedure?.bileSpillage && (
            <div>
              <span className="font-medium">Bile Spillage:</span>{" "}
              {cholecystectomy.procedure.bileSpillage}
            </div>
          )}
          {cholecystectomy?.procedure?.stonesSpillage && (
            <div>
              <span className="font-medium">Stones Spillage:</span>{" "}
              {cholecystectomy.procedure.stonesSpillage}
            </div>
          )}
          {additionalProcedures.length > 0 && (
            <div>
              <span className="font-medium">Additional Procedures:</span>{" "}
              {additionalProcedures.join(", ")}
              {cholecystectomy?.procedure?.additionalProcedureDrainSite
                ? ` (Drain site: ${cholecystectomy.procedure.additionalProcedureDrainSite})`
                : ""}
            </div>
          )}
          {cholangiogramFindings.length > 0 && (
            <div>
              <span className="font-medium">Cholangiogram Findings:</span>{" "}
              {cholangiogramFindings.join(", ")}
              {cholecystectomy?.procedure?.cholangiogramStrictureSite
                ? ` | Stricture site: ${cholecystectomy.procedure.cholangiogramStrictureSite}`
                : ""}
              {cholecystectomy?.procedure?.cholangiogramDilatation
                ? ` | Dilatation: ${cholecystectomy.procedure.cholangiogramDilatation}`
                : ""}
              {cholecystectomy?.procedure?.cholangiogramLeakSite
                ? ` | Leak site: ${cholecystectomy.procedure.cholangiogramLeakSite}`
                : ""}
            </div>
          )}
          {retrieval.length > 0 && (
            <div>
              <span className="font-medium">Gall Bladder Retrieval:</span>{" "}
              {retrieval.join(", ")}
            </div>
          )}
          {cholecystectomy?.procedure?.drainInsertion && (
            <div>
              <span className="font-medium">Drain Insertion:</span> {cholecystectomy.procedure.drainInsertion}
              {cholecystectomy.procedure.drainInsertion === 'Yes' && (
                <>
                  {drainType.length > 0 ? ` | Type: ${drainType.join(", ")}` : ""}
                  {drainPlacement.length > 0 ? ` | Placement: ${drainPlacement.join(", ")}` : ""}
                  {drainExitSite.length > 0 ? ` | Exit Site: ${drainExitSite.join(", ")}` : ""}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Closure and Specimen</h5>
        <div className="space-y-2 text-xs text-gray-700">
          {cholecystectomy?.closure?.fascialClosure && (
            <div>
              <span className="font-medium">Fascial Closure:</span> {cholecystectomy.closure.fascialClosure}
              {cholecystectomy.closure.fascialClosure === 'Yes' && toArray(cholecystectomy?.closure?.fascialClosureSites).length > 0 ? ` | Sites: ${toArray(cholecystectomy.closure.fascialClosureSites).join(', ')}` : ''}
              {cholecystectomy.closure.fascialClosure === 'Yes' && toArray(cholecystectomy?.closure?.fascialSutureMaterial).length > 0 ? ` | Suture: ${toArray(cholecystectomy.closure.fascialSutureMaterial).join(', ')}` : ''}
            </div>
          )}
          {cholecystectomy?.closure?.skinClosure && (
            <div>
              <span className="font-medium">Skin Closure:</span> {cholecystectomy.closure.skinClosure}
              {cholecystectomy.closure.skinClosure === 'Yes' && skinClosure.length > 0 ? ` | Method: ${skinClosure.join(', ')}` : ''}
            </div>
          )}
          {cholecystectomy?.closure?.gallbladderSentForHistology && (
            <div>
              <span className="font-medium">Gall Bladder Sent for Histology:</span>{" "}
              {cholecystectomy.closure.gallbladderSentForHistology}
              {cholecystectomy?.closure?.laboratoryName
                ? ` (${cholecystectomy.closure.laboratoryName})`
                : ""}
            </div>
          )}
          {difficulty.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="font-medium mr-1">Intra-Operative Difficulty:</span>
              {difficulty.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
          {complications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="font-medium mr-1">Complications:</span>
              {complications.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {(cholecystectomy?.additionalInfo?.additionalInformation ||
        cholecystectomy?.additionalInfo?.postOperativeManagement ||
        cholecystectomy?.additionalInfo?.surgeonSignatureText ||
        cholecystectomy?.additionalInfo?.dateTime) && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Additional Information</h5>
          <div className="space-y-2 text-xs text-gray-700">
            {cholecystectomy?.additionalInfo?.additionalInformation && (
              <div>
                <span className="font-medium">Additional Information:</span>{" "}
                {cholecystectomy.additionalInfo.additionalInformation}
              </div>
            )}
            {cholecystectomy?.additionalInfo?.postOperativeManagement && (
              <div>
                <span className="font-medium">Post Operative Management:</span>{" "}
                {cholecystectomy.additionalInfo.postOperativeManagement}
              </div>
            )}
            {cholecystectomy?.additionalInfo?.surgeonSignatureText && (
              <div>
                <span className="font-medium">Surgeon&apos;s Signature:</span>{" "}
                {cholecystectomy.additionalInfo.surgeonSignatureText}
              </div>
            )}
            {cholecystectomy?.additionalInfo?.dateTime && (
              <div>
                <span className="font-medium">Date/Time:</span>{" "}
                {formatDateTimeDDMMYYYYWithDashes(cholecystectomy.additionalInfo.dateTime)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
