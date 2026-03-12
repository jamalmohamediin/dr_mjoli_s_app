import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateOnly } from "@/utils/dateFormatter";
import { getFullASAText } from "@/utils/asaDescriptions";

interface SmallBowelSurgeryReportPreviewProps {
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

export const SmallBowelSurgeryReportPreview = ({
  report,
}: SmallBowelSurgeryReportPreviewProps) => {
  const smallBowel = report.smallBowel;

  const hasData =
    smallBowel?.patientInfo?.name ||
    smallBowel?.preoperative?.surgeons?.some((item: string) => item?.trim()) ||
    smallBowel?.operativeFindings?.pathology?.length > 0 ||
    smallBowel?.procedure?.approach?.length > 0 ||
    smallBowel?.reconstruction?.reconstructionType?.length > 0 ||
    smallBowel?.operativeEvents?.specimen?.length > 0 ||
    smallBowel?.additionalInfo?.additionalInformation;

  if (!hasData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">
          Start filling out the small bowel surgery form to see findings appear here.
        </p>
      </div>
    );
  }

  const pathology = renderSelection(
    toArray(smallBowel?.operativeFindings?.pathology),
    smallBowel?.operativeFindings?.pathologyOther
  );
  const procedurePerformed = renderSelection(
    toArray(smallBowel?.procedure?.procedurePerformed),
    smallBowel?.procedure?.procedurePerformedOther
  );
  const vascularControl = renderSelection(
    toArray(smallBowel?.procedure?.vascularControl),
    smallBowel?.procedure?.vascularControlOther
  );
  const reconstructionType = renderSelection(
    toArray(smallBowel?.reconstruction?.reconstructionType),
    smallBowel?.reconstruction?.reconstructionOther
  );
  const specimen = renderSelection(
    toArray(smallBowel?.operativeEvents?.specimen),
    smallBowel?.operativeEvents?.specimenOther
  );
  const pointsOfDifficulty = renderSelection(
    toArray(smallBowel?.operativeEvents?.pointsOfDifficulty),
    smallBowel?.operativeEvents?.pointsOfDifficultyOther
  );
  const complications = renderSelection(
    toArray(smallBowel?.operativeEvents?.intraoperativeEvents),
    smallBowel?.operativeEvents?.intraoperativeEventsOther
  );
  const drainType = renderSelection(
    toArray(smallBowel?.operativeEvents?.drainType),
    smallBowel?.operativeEvents?.drainTypeOther
  );
  const drainPlacement = renderSelection(
    toArray(smallBowel?.operativeEvents?.intraPeritonealPlacement),
    smallBowel?.operativeEvents?.intraPeritonealPlacementOther
  );
  const drainExit = renderSelection(
    toArray(smallBowel?.operativeEvents?.drainExitSite),
    smallBowel?.operativeEvents?.drainExitSiteOther
  );
  const fascialClosure = renderSelection(
    toArray(smallBowel?.closure?.fascialClosure),
    smallBowel?.closure?.fascialClosureOther
  );
  const fascialMaterial = renderSelection(
    toArray(smallBowel?.closure?.fascialSutureMaterial),
    smallBowel?.closure?.fascialSutureMaterialOther
  );
  const skinClosure = renderSelection(
    toArray(smallBowel?.closure?.skinClosure),
    smallBowel?.closure?.skinClosureOther
  );
  const skinMaterial = renderSelection(
    toArray(smallBowel?.closure?.skinClosureMaterial),
    smallBowel?.closure?.skinClosureMaterialOther
  );
  const imaging = renderSelection(
    toArray(smallBowel?.preoperative?.imaging),
    smallBowel?.preoperative?.imagingOther
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
            <h4 className="text-sm font-bold">SMALL BOWEL SURGERY REPORT</h4>
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
          {smallBowel?.patientInfo?.name && (
            <div>
              <span className="font-medium">Name:</span> {smallBowel.patientInfo.name}
            </div>
          )}
          {smallBowel?.patientInfo?.patientId && (
            <div>
              <span className="font-medium">Patient ID:</span> {smallBowel.patientInfo.patientId}
            </div>
          )}
          {smallBowel?.patientInfo?.dateOfBirth && (
            <div>
              <span className="font-medium">Date of Birth:</span>{" "}
              {formatDateOnly(smallBowel.patientInfo.dateOfBirth)}
            </div>
          )}
          {smallBowel?.patientInfo?.age && (
            <div>
              <span className="font-medium">Age:</span> {smallBowel.patientInfo.age}
            </div>
          )}
          {smallBowel?.patientInfo?.sex && (
            <div>
              <span className="font-medium">Sex:</span>{" "}
              {smallBowel.patientInfo.sex === "other" && smallBowel.patientInfo.sexOther
                ? smallBowel.patientInfo.sexOther
                : `${smallBowel.patientInfo.sex.charAt(0).toUpperCase()}${smallBowel.patientInfo.sex
                    .slice(1)
                    .toLowerCase()}`}
            </div>
          )}
          {smallBowel?.patientInfo?.weight && (
            <div>
              <span className="font-medium">Weight:</span> {smallBowel.patientInfo.weight} kg
            </div>
          )}
          {smallBowel?.patientInfo?.height && (
            <div>
              <span className="font-medium">Height:</span> {smallBowel.patientInfo.height} cm
            </div>
          )}
          {smallBowel?.patientInfo?.bmi && (
            <div>
              <span className="font-medium">BMI:</span> {smallBowel.patientInfo.bmi}
            </div>
          )}
          {smallBowel?.patientInfo?.asaScore && (
            <div className="col-span-2">
              <span className="font-medium">ASA Score:</span>{" "}
              {getFullASAText(smallBowel.patientInfo.asaScore)}
            </div>
          )}
          {smallBowel?.patientInfo?.asaNotes && (
            <div className="col-span-2">
              <span className="font-medium">Additional Notes:</span>{" "}
              {smallBowel.patientInfo.asaNotes}
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
          {smallBowel?.preoperative?.surgeons?.filter((item: string) => item.trim()).length > 0 && (
            <div>
              <span className="font-medium">Surgeon:</span>{" "}
              {smallBowel.preoperative.surgeons.filter((item: string) => item.trim()).join(", ")}
            </div>
          )}
          {smallBowel?.preoperative?.assistants?.filter((item: string) => item.trim()).length > 0 && (
            <div>
              <span className="font-medium">Assistant:</span>{" "}
              {smallBowel.preoperative.assistants
                .filter((item: string) => item.trim())
                .join(", ")}
            </div>
          )}
          {smallBowel?.preoperative?.anaesthetists?.filter((item: string) => item.trim()).length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Anaesthetist:</span>{" "}
              {smallBowel.preoperative.anaesthetists
                .filter((item: string) => item.trim())
                .join(", ")}
            </div>
          )}
          {smallBowel?.preoperative?.indication && (
            <div className="col-span-2">
              <span className="font-medium">Indication for Surgery:</span>{" "}
              {smallBowel.preoperative.indication}
            </div>
          )}
          {smallBowel?.preoperative?.operationDescription && (
            <div className="col-span-2">
              <span className="font-medium">Operation Description:</span>{" "}
              {smallBowel.preoperative.operationDescription}
            </div>
          )}
          {smallBowel?.preoperative?.procedureUrgency && (
            <div>
              <span className="font-medium">Procedure Urgency:</span>{" "}
              {smallBowel.preoperative.procedureUrgency}
            </div>
          )}
          {imaging.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Preoperative Imaging:</span>{" "}
              {imaging.join(", ")}
            </div>
          )}
          {smallBowel?.preoperative?.startTime && (
            <div>
              <span className="font-medium">Start Time:</span> {smallBowel.preoperative.startTime}
            </div>
          )}
          {smallBowel?.preoperative?.endTime && (
            <div>
              <span className="font-medium">End Time:</span> {smallBowel.preoperative.endTime}
            </div>
          )}
          {smallBowel?.preoperative?.duration && (
            <div className="col-span-2">
              <span className="font-medium">Total Duration:</span>{" "}
              {smallBowel.preoperative.duration} minutes
            </div>
          )}
        </div>
      </div>

      <Separator />

      {(pathology.length > 0 ||
        smallBowel?.operativeFindings?.distanceFromDjFlexure ||
        smallBowel?.operativeFindings?.description) && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Operative Findings</h5>
          <div className="space-y-2 text-xs text-gray-700">
            {pathology.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="font-medium mr-1">Pathology Found:</span>
                {pathology.map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {smallBowel?.operativeFindings?.distanceFromDjFlexure && (
                <div>
                  <span className="font-medium">Distance from DJ Flexure:</span>{" "}
                  {smallBowel.operativeFindings.distanceFromDjFlexure} cm
                </div>
              )}
              {smallBowel?.operativeFindings?.distanceFromIleocecalValve && (
                <div>
                  <span className="font-medium">Distance from Ileocecal Valve:</span>{" "}
                  {smallBowel.operativeFindings.distanceFromIleocecalValve} cm
                </div>
              )}
              {smallBowel?.operativeFindings?.diseasedSegmentLength && (
                <div>
                  <span className="font-medium">Length of Diseased Segment:</span>{" "}
                  {smallBowel.operativeFindings.diseasedSegmentLength} cm
                </div>
              )}
              {smallBowel?.operativeFindings?.bowelViability && (
                <div>
                  <span className="font-medium">Bowel Viability:</span>{" "}
                  {smallBowel.operativeFindings.bowelViability}
                </div>
              )}
              {smallBowel?.operativeFindings?.mesentericInvolvement && (
                <div>
                  <span className="font-medium">Mesenteric Involvement:</span>{" "}
                  {smallBowel.operativeFindings.mesentericInvolvement}
                </div>
              )}
              {smallBowel?.operativeFindings?.lymphNodes && (
                <div>
                  <span className="font-medium">Lymph Nodes:</span>{" "}
                  {smallBowel.operativeFindings.lymphNodes}
                </div>
              )}
              {smallBowel?.operativeFindings?.contamination && (
                <div>
                  <span className="font-medium">Contamination:</span>{" "}
                  {smallBowel.operativeFindings.contamination}
                </div>
              )}
              {smallBowel?.operativeFindings?.adhesions && (
                <div>
                  <span className="font-medium">Adhesions:</span>{" "}
                  {smallBowel.operativeFindings.adhesions}
                </div>
              )}
            </div>
            {smallBowel?.operativeFindings?.description && (
              <div>
                <span className="font-medium">Description of Findings:</span>{" "}
                {smallBowel.operativeFindings.description}
              </div>
            )}
          </div>
        </div>
      )}

      <Separator />

      {(toArray(smallBowel?.procedure?.approach).length > 0 ||
        smallBowel?.procedure?.operationDone ||
        procedurePerformed.length > 0) && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Procedure Details</h5>
          <div className="space-y-1 text-xs text-gray-700">
            {smallBowel?.procedure?.operationDone && (
              <div>
                <span className="font-medium">Operation Done:</span>{" "}
                {smallBowel.procedure.operationDone}
              </div>
            )}
            {toArray(smallBowel?.procedure?.approach).length > 0 && (
              <div>
                <span className="font-medium">Surgical Approach:</span>{" "}
                {toArray(smallBowel.procedure.approach).join(", ")}
              </div>
            )}
            {toArray(smallBowel?.procedure?.reasonForConversion).length > 0 && (
              <div>
                <span className="font-medium">Reason for Conversion:</span>{" "}
                {renderSelection(
                  toArray(smallBowel.procedure.reasonForConversion),
                  smallBowel.procedure.reasonForConversionOther
                ).join(", ")}
              </div>
            )}
            {procedurePerformed.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="font-medium mr-1">Procedure Performed:</span>
                {procedurePerformed.map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {toArray(smallBowel?.procedure?.procedurePerformed).includes("Small Bowel Resection") && (
                <>
                  {smallBowel?.procedure?.lengthResected && (
                    <div>
                      <span className="font-medium">Length Resected:</span>{" "}
                      {smallBowel.procedure.lengthResected} cm
                    </div>
                  )}
                  {toArray(smallBowel?.procedure?.margins).length > 0 && (
                    <div>
                      <span className="font-medium">Margins:</span>{" "}
                      {toArray(smallBowel.procedure.margins).join(", ")}
                    </div>
                  )}
                  {vascularControl.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium">Method of Vascular Control:</span>{" "}
                      {vascularControl.join(", ")}
                    </div>
                  )}
                </>
              )}
              {smallBowel?.procedure?.adhesiolysis && (
                <div>
                  <span className="font-medium">Adhesiolysis:</span>{" "}
                  {smallBowel.procedure.adhesiolysis}
                </div>
              )}
              {smallBowel?.procedure?.peritonealLavage && (
                <div>
                  <span className="font-medium">Peritoneal Lavage:</span>{" "}
                  {smallBowel.procedure.peritonealLavage}
                  {smallBowel.procedure.peritonealLavage === "Yes" &&
                  smallBowel.procedure.peritonealLavageVolume
                    ? ` (Volume: ${smallBowel.procedure.peritonealLavageVolume})`
                    : ""}
                </div>
              )}
            </div>
            {smallBowel?.procedureFindings?.findings && (
              <div>
                <span className="font-medium">Access and Ports:</span> Diagram documented
              </div>
            )}
          </div>
        </div>
      )}

      <Separator />

      {(reconstructionType.length > 0 ||
        smallBowel?.reconstruction?.anastomosisDetails?.site ||
        smallBowel?.reconstruction?.stomaDetails?.ileostomyType) && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Reconstruction</h5>
          <div className="space-y-1 text-xs text-gray-700">
            {reconstructionType.length > 0 && (
              <div>
                <span className="font-medium">Reconstruction Type:</span>{" "}
                {reconstructionType.join(", ")}
              </div>
            )}
            {smallBowel?.reconstruction?.anastomosisDetails?.site && (
              <div>
                <span className="font-medium">Site of Anastomosis:</span>{" "}
                {smallBowel.reconstruction.anastomosisDetails.site}
              </div>
            )}
            {smallBowel?.reconstruction?.anastomosisDetails?.configuration && (
              <div>
                <span className="font-medium">Configuration:</span>{" "}
                {smallBowel.reconstruction.anastomosisDetails.configuration === "Other" &&
                smallBowel.reconstruction.anastomosisDetails.configurationOther
                  ? `Other: ${smallBowel.reconstruction.anastomosisDetails.configurationOther}`
                  : smallBowel.reconstruction.anastomosisDetails.configuration}
              </div>
            )}
            {smallBowel?.reconstruction?.anastomosisDetails?.technique && (
              <div>
                <span className="font-medium">Anastomotic Technique:</span>{" "}
                {smallBowel.reconstruction.anastomosisDetails.technique}
              </div>
            )}
            {toArray(smallBowel?.reconstruction?.anastomosisDetails?.sutureMaterial).length > 0 && (
              <div>
                <span className="font-medium">Suture Material:</span>{" "}
                {renderSelection(
                  toArray(smallBowel.reconstruction.anastomosisDetails.sutureMaterial),
                  smallBowel.reconstruction.anastomosisDetails.sutureMaterialOther
                ).join(", ")}
              </div>
            )}
            {toArray(smallBowel?.reconstruction?.anastomosisDetails?.linearStaplerSize).length >
              0 && (
              <div>
                <span className="font-medium">Linear Stapler Sizes:</span>{" "}
                {renderSelection(
                  toArray(smallBowel.reconstruction.anastomosisDetails.linearStaplerSize),
                  smallBowel.reconstruction.anastomosisDetails.linearStaplerSizeOther
                ).join(", ")}
              </div>
            )}
            {toArray(smallBowel?.reconstruction?.anastomosisDetails?.circularStaplerSize).length >
              0 && (
              <div>
                <span className="font-medium">Circular Stapler Sizes:</span>{" "}
                {renderSelection(
                  toArray(smallBowel.reconstruction.anastomosisDetails.circularStaplerSize),
                  smallBowel.reconstruction.anastomosisDetails.circularStaplerSizeOther
                ).join(", ")}
              </div>
            )}
            {smallBowel?.reconstruction?.stomaDetails?.ileostomyType && (
              <div>
                <span className="font-medium">Type of Ileostomy:</span>{" "}
                {smallBowel.reconstruction.stomaDetails.ileostomyType === "Other" &&
                smallBowel.reconstruction.stomaDetails.ileostomyTypeOther
                  ? `Other: ${smallBowel.reconstruction.stomaDetails.ileostomyTypeOther}`
                  : smallBowel.reconstruction.stomaDetails.ileostomyType}
              </div>
            )}
            {smallBowel?.reconstruction?.stomaDetails?.location && (
              <div>
                <span className="font-medium">Stoma Location:</span>{" "}
                {smallBowel.reconstruction.stomaDetails.location === "Other" &&
                smallBowel.reconstruction.stomaDetails.locationOther
                  ? `Other: ${smallBowel.reconstruction.stomaDetails.locationOther}`
                  : smallBowel.reconstruction.stomaDetails.location}
              </div>
            )}
            {smallBowel?.reconstruction?.stomaDetails?.eversion && (
              <div>
                <span className="font-medium">Stoma Eversion:</span>{" "}
                {smallBowel.reconstruction.stomaDetails.eversion}
              </div>
            )}
            {smallBowel?.reconstruction?.stomaDetails?.maturationSite && (
              <div>
                <span className="font-medium">Site of Maturation:</span>{" "}
                {smallBowel.reconstruction.stomaDetails.maturationSite}
              </div>
            )}
            {toArray(smallBowel?.reconstruction?.stomaDetails?.materialUsed).length > 0 && (
              <div>
                <span className="font-medium">Stoma Material:</span>{" "}
                {renderSelection(
                  toArray(smallBowel.reconstruction.stomaDetails.materialUsed),
                  smallBowel.reconstruction.stomaDetails.materialUsedOther
                ).join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      <Separator />

      {(specimen.length > 0 ||
        pointsOfDifficulty.length > 0 ||
        complications.length > 0 ||
        fascialClosure.length > 0) && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Operative Events & Closure</h5>
          <div className="space-y-1 text-xs text-gray-700">
            {specimen.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="font-medium mr-1">Specimen:</span>
                {specimen.map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
            {pointsOfDifficulty.length > 0 && (
              <div>
                <span className="font-medium">Points of Difficulty:</span>{" "}
                {pointsOfDifficulty.join(", ")}
              </div>
            )}
            {complications.length > 0 && (
              <div>
                <span className="font-medium">Intraoperative Events / Complications:</span>{" "}
                {complications.join(", ")}
              </div>
            )}
            {smallBowel?.operativeEvents?.woundProtector && (
              <div>
                <span className="font-medium">Wound Protector Used:</span>{" "}
                {smallBowel.operativeEvents.woundProtector}
              </div>
            )}
            {smallBowel?.operativeEvents?.drainInsertion && (
              <div>
                <span className="font-medium">Peritoneal Drainage:</span>{" "}
                {smallBowel.operativeEvents.drainInsertion}
              </div>
            )}
            {drainType.length > 0 && (
              <div>
                <span className="font-medium">Type of Drain:</span> {drainType.join(", ")}
              </div>
            )}
            {drainPlacement.length > 0 && (
              <div>
                <span className="font-medium">Drain Placement:</span> {drainPlacement.join(", ")}
              </div>
            )}
            {drainExit.length > 0 && (
              <div>
                <span className="font-medium">Drain Exit Site:</span> {drainExit.join(", ")}
              </div>
            )}
            {fascialClosure.length > 0 && (
              <div>
                <span className="font-medium">Fascial Closure:</span>{" "}
                {fascialClosure.join(", ")}
              </div>
            )}
            {fascialMaterial.length > 0 && (
              <div>
                <span className="font-medium">Fascial Suture Material:</span>{" "}
                {fascialMaterial.join(", ")}
              </div>
            )}
            {skinClosure.length > 0 && (
              <div>
                <span className="font-medium">Skin Closure:</span> {skinClosure.join(", ")}
              </div>
            )}
            {skinMaterial.length > 0 && (
              <div>
                <span className="font-medium">Skin Closure Material:</span>{" "}
                {skinMaterial.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {(smallBowel?.additionalInfo?.additionalInformation ||
        smallBowel?.additionalInfo?.postOperativeManagement ||
        smallBowel?.additionalInfo?.surgeonSignatureText ||
        smallBowel?.additionalInfo?.dateTime) && (
        <>
          <Separator />
          <div className="space-y-2 text-xs text-gray-700">
            {smallBowel?.additionalInfo?.additionalInformation && (
              <div>
                <span className="font-medium">Additional Information:</span>{" "}
                {smallBowel.additionalInfo.additionalInformation}
              </div>
            )}
            {smallBowel?.additionalInfo?.postOperativeManagement && (
              <div>
                <span className="font-medium">Post Operative Management:</span>{" "}
                {smallBowel.additionalInfo.postOperativeManagement}
              </div>
            )}
            {smallBowel?.additionalInfo?.surgeonSignatureText && (
              <div>
                <span className="font-medium">Surgeon's Signature:</span>{" "}
                {smallBowel.additionalInfo.surgeonSignatureText}
              </div>
            )}
            {smallBowel?.additionalInfo?.dateTime && (
              <div>
                <span className="font-medium">Date/Time:</span>{" "}
                {formatDateOnly(smallBowel.additionalInfo.dateTime)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
