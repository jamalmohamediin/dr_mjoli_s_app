import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPatientInfoDisplayEntries } from "@/utils/patientSticker";
import { hasText, toArray } from "@/utils/templateDataHelpers";

export interface StructuredTemplatePreviewEntry {
  label: string;
  value?: string | string[];
  fullWidth?: boolean;
  badges?: boolean;
}

export interface StructuredTemplatePreviewSection {
  title: string;
  entries: StructuredTemplatePreviewEntry[];
}

interface StructuredTemplateReportPreviewProps {
  title: string;
  patientInfo?: any;
  sections: StructuredTemplatePreviewSection[];
  diagram?: {
    title: string;
    imageData?: string;
    alt: string;
  };
  signature?: {
    label?: string;
    text?: string;
    imageData?: string;
    dateTime?: string;
  };
  emptyMessage: string;
}

const hasEntryValue = (entry: StructuredTemplatePreviewEntry) =>
  Array.isArray(entry.value) ? entry.value.length > 0 : hasText(entry.value);

const hasSectionData = (section: StructuredTemplatePreviewSection) =>
  section.entries.some(hasEntryValue);

export const StructuredTemplateReportPreview = ({
  title,
  patientInfo,
  sections,
  diagram,
  signature,
  emptyMessage,
}: StructuredTemplateReportPreviewProps) => {
  const patientEntries = getPatientInfoDisplayEntries(patientInfo);
  const visibleSections = sections.filter(hasSectionData);
  const hasSignature =
    hasText(signature?.text) || hasText(signature?.dateTime) || hasText(signature?.imageData);

  if (
    patientEntries.length === 0 &&
    visibleSections.length === 0 &&
    !hasText(diagram?.imageData) &&
    !hasSignature
  ) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

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
            <h4 className="text-sm font-bold">{title}</h4>
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
        <>
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
        </>
      )}

      {visibleSections.map((section, index) => (
        <React.Fragment key={section.title}>
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">{section.title}</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
              {section.entries.filter(hasEntryValue).map((entry) => {
                const values = toArray(entry.value);

                return (
                  <div
                    key={`${section.title}-${entry.label}`}
                    className={entry.fullWidth || entry.badges ? "col-span-2" : ""}
                  >
                    <span className="font-medium">{entry.label}:</span>{" "}
                    {entry.badges ? (
                      <span className="inline-flex flex-wrap gap-1 align-middle">
                        {values.map((value) => (
                          <Badge
                            key={`${entry.label}-${value}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {value}
                          </Badge>
                        ))}
                      </span>
                    ) : Array.isArray(entry.value) ? (
                      values.join(", ")
                    ) : (
                      entry.value
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {index < visibleSections.length - 1 || hasText(diagram?.imageData) || hasSignature ? (
            <Separator />
          ) : null}
        </React.Fragment>
      ))}

      {hasText(diagram?.imageData) && (
        <>
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">{diagram?.title}</h5>
            <div className="border rounded bg-white p-2">
              <img
                src={diagram?.imageData}
                alt={diagram?.alt}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
          {hasSignature ? <Separator /> : null}
        </>
      )}

      {hasSignature && (
        <div className="space-y-2 text-xs text-gray-700">
          <h5 className="text-xs font-medium text-gray-600">{signature?.label || "Signature"}</h5>
          {hasText(signature?.text) ? (
            <div>
              <span className="font-medium">Name:</span> {signature?.text}
            </div>
          ) : null}
          {hasText(signature?.imageData) ? (
            <div className="border rounded bg-white p-2 inline-block">
              <img src={signature?.imageData} alt="Signature" className="max-h-16 w-auto object-contain" />
            </div>
          ) : null}
          {hasText(signature?.dateTime) ? (
            <div>
              <span className="font-medium">Date:</span> {signature?.dateTime}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
