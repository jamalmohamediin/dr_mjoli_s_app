import React, { useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeDDMMYYYYWithDashes } from "@/utils/dateFormatter";
import {
  getPeriAnalAdditionalFindingSection,
  getPeriAnalFindingSections,
  joinSelections,
  parsePeriAnalDiagramState,
  toArray,
} from "@/utils/periAnalHelpers";
import {
  PERI_ANAL_DIAGRAM_VARIANTS,
  periAnalDiagramImages,
} from "@/utils/periAnalDiagramConfig";
import { getPatientInfoDisplayEntries } from "@/utils/patientSticker";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

const PERI_ANAL_PREVIEW_MARKING_SCALE = 1.8;

interface PeriAnalReportPreviewProps {
  report: any;
}

const SurgicalDiagramDisplay = ({
  markings,
  diagramImage,
}: {
  markings: any[];
  diagramImage: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const drawingMetrics = getSurgicalDiagramMarkingMetrics(PERI_ANAL_PREVIEW_MARKING_SCALE);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawDiagram = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      (markings || []).forEach((marking) => {
        if (marking.type === "port") {
          ctx.save();
          ctx.font = `bold ${drawingMetrics.portFontSize}px Arial`;
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(marking.size, marking.x, marking.y - drawingMetrics.portLabelOffset);
          ctx.beginPath();
          ctx.moveTo(marking.x - drawingMetrics.portHalfLength, marking.y);
          ctx.lineTo(marking.x + drawingMetrics.portHalfLength, marking.y);
          ctx.strokeStyle = "black";
          ctx.lineWidth = drawingMetrics.portLineWidth;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "stoma") {
          ctx.save();
          ctx.beginPath();
          ctx.arc(marking.x, marking.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
          ctx.lineWidth =
            marking.stomaType === "ileostomy"
              ? drawingMetrics.ileostomyLineWidth
              : drawingMetrics.colostomyLineWidth;
          ctx.setLineDash(marking.stomaType === "ileostomy" ? drawingMetrics.ileostomyDash : []);
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "incision") {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = "#8B0000";
          ctx.lineWidth = drawingMetrics.incisionLineWidth;
          ctx.setLineDash(drawingMetrics.incisionDash);
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "drawStroke") {
          const points = Array.isArray(marking.points) ? marking.points : [];
          if (points.length === 0) return;
          ctx.save();
          ctx.strokeStyle = marking.color || "#111111";
          ctx.lineWidth = Number(marking.width) > 0 ? Number(marking.width) : 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let index = 1; index < points.length; index += 1) {
            ctx.lineTo(points[index].x, points[index].y);
          }
          if (points.length === 1) {
            ctx.lineTo(points[0].x + 0.01, points[0].y + 0.01);
          }
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === "textBox") {
          if (!marking?.text?.trim()) return;
          const textSize = Number(marking.size) > 0 ? Number(marking.size) : 20;
          ctx.save();
          ctx.fillStyle = marking.color || "#111111";
          ctx.font = `${textSize}px Arial`;
          ctx.textBaseline = "top";
          ctx.fillText(marking.text, marking.x, marking.y);
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
      image.src = diagramImage;
    }
  }, [
    diagramImage,
    markings,
    drawingMetrics,
  ]);

  return (
    <div className="mt-3 border rounded-lg overflow-hidden bg-white" style={{ maxWidth: "fit-content" }}>
      <img ref={imageRef} src={diagramImage} alt="Peri-Anal diagram" className="hidden" />
      <canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxHeight: "320px" }} />
    </div>
  );
};

const EntryList = ({ entries }: { entries: { label: string; value: string }[] }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
    {entries.map((entry) => (
      <div key={`${entry.label}-${entry.value}`} className={entry.value.length > 75 ? "col-span-2" : ""}>
        <span className="font-medium">{entry.label}:</span> {entry.value}
      </div>
    ))}
  </div>
);

export const PeriAnalReportPreview = ({ report }: PeriAnalReportPreviewProps) => {
  const periAnal = report.periAnal;
  const patientEntries = getPatientInfoDisplayEntries(periAnal?.patientInfo);
  const diagramState = parsePeriAnalDiagramState(periAnal?.procedureFindings);
  const visibleDiagramVariants = PERI_ANAL_DIAGRAM_VARIANTS.filter((variant) => {
    const markings = diagramState.markingsByVariant?.[variant.key] || [];
    return markings.length > 0;
  });
  const hasDiagramMarkings = visibleDiagramVariants.length > 0;

  const hasData =
    patientEntries.length > 0 ||
    periAnal?.preoperative?.surgeons?.some((item: string) => item?.trim()) ||
    periAnal?.findings?.selectedFindings?.length > 0 ||
    periAnal?.woundManagement?.woundClosure ||
    periAnal?.additionalInfo?.additionalInformation ||
    hasDiagramMarkings;

  if (!hasData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start Filling Out The Peri-Anal Form To See Findings Appear Here.</p>
      </div>
    );
  }

  const findingSummary = getPeriAnalAdditionalFindingSection(periAnal);
  const findingSections = getPeriAnalFindingSections(periAnal);

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
            <h4 className="text-sm font-bold">Peri-Anal Report</h4>
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
          {periAnal?.preoperative?.surgeons?.filter((item: string) => item.trim()).length > 0 && (
            <div><span className="font-medium">Surgeon:</span> {periAnal.preoperative.surgeons.filter((item: string) => item.trim()).join(", ")}</div>
          )}
          {periAnal?.preoperative?.assistants?.filter((item: string) => item.trim()).length > 0 && (
            <div><span className="font-medium">Assistant:</span> {periAnal.preoperative.assistants.filter((item: string) => item.trim()).join(", ")}</div>
          )}
          {periAnal?.preoperative?.anaesthetists?.filter((item: string) => item.trim()).length > 0 && (
            <div className="col-span-2"><span className="font-medium">Anaesthetist:</span> {periAnal.preoperative.anaesthetists.filter((item: string) => item.trim()).join(", ")}</div>
          )}
          {periAnal?.preoperative?.indication && <div className="col-span-2"><span className="font-medium">Indication for Surgery:</span> {periAnal.preoperative.indication}</div>}
          {periAnal?.preoperative?.operationDescription && <div className="col-span-2"><span className="font-medium">Operation Description:</span> {periAnal.preoperative.operationDescription}</div>}
          {periAnal?.preoperative?.procedureUrgency && <div><span className="font-medium">Procedure Urgency:</span> {periAnal.preoperative.procedureUrgency}</div>}
          {toArray(periAnal?.preoperative?.imaging).length > 0 && <div className="col-span-2"><span className="font-medium">Preoperative Imaging:</span> {joinSelections(periAnal.preoperative.imaging, periAnal.preoperative.imagingOther)}</div>}
          {periAnal?.preoperative?.startTime && <div><span className="font-medium">Start Time:</span> {periAnal.preoperative.startTime}</div>}
          {periAnal?.preoperative?.endTime && <div><span className="font-medium">End Time:</span> {periAnal.preoperative.endTime}</div>}
          {periAnal?.preoperative?.duration && <div><span className="font-medium">Total Duration:</span> {periAnal.preoperative.duration} minutes</div>}
          {periAnal?.preoperative?.positionInTheatre && <div><span className="font-medium">Position in Theatre:</span> {periAnal.preoperative.positionInTheatre === "Other" ? periAnal.preoperative.positionOther : periAnal.preoperative.positionInTheatre}</div>}
        </div>
      </div>

      <Separator />

      {findingSummary && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">{findingSummary.title}</h5>
          <div className="flex flex-wrap gap-1">
            {findingSummary.entries[0].value.split(", ").map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasDiagramMarkings && (
        <>
        <Separator />
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Peri-Anal Diagrams</h5>
          <div className="bg-gray-50 p-3 rounded border text-xs">
            <h6 className="font-medium text-gray-700 mb-2">Legend:</h6>
            <div className="grid grid-cols-1 gap-1 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-black"></div>
                <span>Draw: Freehand Markings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-500 rounded-sm flex items-center justify-center text-[8px] font-semibold text-gray-700 bg-white">
                  T
                </div>
                <span>Textbox: Placed Text Notes</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Any Color/Thickness Selected In Draw Tool Is Preserved</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleDiagramVariants.map((variant) => (
              <div key={variant.key} className="space-y-2 rounded-lg border bg-white p-3">
                <h6 className="text-xs font-medium text-gray-700">{variant.label}</h6>
                <SurgicalDiagramDisplay
                  markings={diagramState.markingsByVariant?.[variant.key] || []}
                  diagramImage={periAnalDiagramImages[variant.key]}
                />
              </div>
            ))}
          </div>
        </div>
      </>
      )}

      {findingSections.map((section) => (
        <React.Fragment key={section.title}>
          <Separator />
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">{section.title}</h5>
            <EntryList entries={section.entries} />
          </div>
        </React.Fragment>
      ))}

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Wound Management</h5>
        <EntryList
          entries={[
            { label: "Irrigation Solution", value: joinSelections(periAnal?.woundManagement?.irrigationSolution, periAnal?.woundManagement?.irrigationSolutionOther) },
            { label: "Wound Closure", value: periAnal?.woundManagement?.woundClosure || "" },
            { label: "Dressing Applied", value: joinSelections(periAnal?.woundManagement?.dressingApplied, periAnal?.woundManagement?.dressingAppliedOther) },
            { label: "Anal Pack Inserted", value: periAnal?.woundManagement?.analPackInserted || "" },
          ].filter((entry) => entry.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Intraoperative Complications</h5>
        <EntryList
          entries={[
            {
              label: "Complications",
              value: joinSelections(
                periAnal?.complications?.intraoperativeComplications,
                periAnal?.complications?.intraoperativeComplicationsOther
              ),
            },
          ].filter((entry) => entry.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Post-Operative Plan</h5>
        <EntryList
          entries={[
            { label: "Analgesia", value: periAnal?.postOperativePlan?.analgesia || "" },
            { label: "Antibiotics (If Indicated)", value: periAnal?.postOperativePlan?.antibiotics || "" },
            { label: "Sitz Baths", value: periAnal?.postOperativePlan?.sitzBaths || "" },
            { label: "Packing Removal Time", value: periAnal?.postOperativePlan?.packingRemovalTime || "" },
            { label: "Plan for Further Surgery", value: periAnal?.postOperativePlan?.planForFurtherSurgery || "" },
          ].filter((entry) => entry.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Specimen</h5>
        <EntryList
          entries={[
            { label: "Sent for Histology", value: periAnal?.specimen?.sentForHistology || "" },
            {
              label: "Histology Laboratory Sent To",
              value:
                periAnal?.specimen?.sentForHistology === "Yes"
                  ? periAnal?.specimen?.histologyLaboratorySentTo || ""
                  : "",
            },
            { label: "Sent for Microbiology", value: periAnal?.specimen?.sentForMicrobiology || "" },
            {
              label: "Microbiology Laboratory Sent To",
              value:
                periAnal?.specimen?.sentForMicrobiology === "Yes"
                  ? periAnal?.specimen?.microbiologyLaboratorySentTo || ""
                  : "",
            },
          ].filter((entry) => entry.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Additional Information</h5>
        <div className="space-y-2 text-xs text-gray-700">
          {periAnal?.additionalInfo?.additionalInformation && (
            <div><span className="font-medium">Additional Information:</span> {periAnal.additionalInfo.additionalInformation}</div>
          )}
          {periAnal?.additionalInfo?.postOperativeManagement && (
            <div><span className="font-medium">Post Operative Management:</span> {periAnal.additionalInfo.postOperativeManagement}</div>
          )}
          {periAnal?.additionalInfo?.surgeonSignatureText && (
            <div><span className="font-medium">Surgeon&apos;s Signature:</span> {periAnal.additionalInfo.surgeonSignatureText}</div>
          )}
          {periAnal?.additionalInfo?.dateTime && (
            <div><span className="font-medium">Date/Time:</span> {formatDateTimeDDMMYYYYWithDashes(periAnal.additionalInfo.dateTime)}</div>
          )}
        </div>
      </div>
    </div>
  );
};
