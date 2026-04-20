import React from "react";
import {
  StructuredTemplateReportPreview,
  StructuredTemplatePreviewSection,
} from "@/components/StructuredTemplateReportPreview";
import { buildColonoscopyReportSections } from "@/utils/colonoscopyReportSections";

interface ColonoscopyReportPreviewProps {
  report: any;
}

export const ColonoscopyReportPreview = ({ report }: ColonoscopyReportPreviewProps) => {
  const template = report?.colonoscopy || {};
  const additionalInfo = template.additionalInfo || {};
  const diagram = template.diagram || {};

  const sections: StructuredTemplatePreviewSection[] = buildColonoscopyReportSections(template);

  return (
    <StructuredTemplateReportPreview
      title="COLONOSCOPY REPORT"
      patientInfo={template.patientInfo}
      sections={sections}
      diagram={{
        title: "Colonoscopy Diagram",
        imageData: diagram.canvasImageData,
        alt: "Colonoscopy anatomy diagram",
        maxHeightPx: 220,
      }}
      signature={{
        label: "Surgeon's Signature",
        text: additionalInfo.surgeonSignatureText || additionalInfo.endoscopistName,
        dateTime: additionalInfo.dateTime,
      }}
      emptyMessage="Start filling out the colonoscopy form to see findings appear here."
    />
  );
};
