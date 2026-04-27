import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateTimeDDMMYYYYWithDashes } from './dateFormatter';
import { mapNewStructureToOld } from './rectalCancerPdfGeneratorMappings';
import { drawStandardPatientInformation } from './pdfPatientInfoLayout';
import { getSurgicalDiagramMarkingMetrics } from './surgicalDiagramMarkings';
import {
  hasPdfDisplayValue,
  isPostPreoperativeAlwaysVisibleField,
} from './templateDataHelpers';

const RECTAL_DIAGRAM_MARKING_SCALE = 1.8;

// Function to calculate signature dimensions while maintaining aspect ratio
const calculateSignatureDimensions = (imageDataUrl: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      const maxWidthMm = 45;
      const maxHeightMm = 15;
      
      const naturalWidth = this.naturalWidth;
      const naturalHeight = this.naturalHeight;
      const aspectRatio = naturalWidth / naturalHeight;
      
      let finalWidth = maxWidthMm;
      let finalHeight = maxWidthMm / aspectRatio;
      
      // If height exceeds max, scale by height instead
      if (finalHeight > maxHeightMm) {
        finalHeight = maxHeightMm;
        finalWidth = maxHeightMm * aspectRatio;
      }
      
      resolve({ width: finalWidth, height: finalHeight });
    };
    img.onerror = () => resolve({ width: 45, height: 15 }); // Fallback dimensions
    img.src = imageDataUrl;
  });
};

// Function to create surgical diagram canvas with markings
const createSurgicalDiagramCanvas = async (
  markings: any[],
  markingScale = RECTAL_DIAGRAM_MARKING_SCALE,
): Promise<string | null> => {
  if (!markings || markings.length === 0) return null;
  
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(markingScale);
      // Set canvas size to match image
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      
      // Draw base image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      // Draw all markings
      markings.forEach((marking) => {
        if (marking.type === 'port') {
          // Draw port marking: black line with size label
          ctx.save();
          ctx.font = `bold ${drawingMetrics.portFontSize}px Arial`;
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(marking.size, marking.x, marking.y - drawingMetrics.portLabelOffset);

          ctx.beginPath();
          ctx.moveTo(marking.x - drawingMetrics.portHalfLength, marking.y);
          ctx.lineTo(marking.x + drawingMetrics.portHalfLength, marking.y);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = drawingMetrics.portLineWidth;
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === 'stoma') {
          // Draw stoma marking
          ctx.save();
          if (marking.stomaType === 'ileostomy') {
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f59e0b'; // Gold/Yellow
            ctx.lineWidth = drawingMetrics.ileostomyLineWidth;
            ctx.setLineDash(drawingMetrics.ileostomyDash); // Dashed line
            ctx.stroke();
          } else { // colostomy
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#16a34a'; // Green
            ctx.lineWidth = drawingMetrics.colostomyLineWidth;
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
          ctx.lineWidth = drawingMetrics.incisionLineWidth;
          ctx.setLineDash(drawingMetrics.incisionDash); // Dashed line
          ctx.stroke();
          ctx.restore();
        }
      });

      // Convert to data URL
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };

    image.onerror = () => resolve(null);
    image.src = appendectomyImage;
  });
};

export const generateRectalCancerPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  rectalCancerData: any,
  patientInfo?: any
) => {
  try {
    console.log('=== GENERATING RECTAL CANCER PDF ===');
    console.log('Rectal cancer data received:', rectalCancerData);
    
    // Debug logging to verify field data
    console.log('=== FIELD DEBUG INFO ===');
    console.log('IMV Ligation:', rectalCancerData?.mobilizationAndResection?.imvLigation);
    console.log('Vessel Hemostasis Technique:', rectalCancerData?.mobilizationAndResection?.hemostasisTechnique);
    console.log('Vessel Hemostasis Other:', rectalCancerData?.mobilizationAndResection?.hemostasisTechniqueOther);
    console.log('Wound Protector:', rectalCancerData?.operativeEvents?.woundProtector);
    console.log('Reason for Stoma:', rectalCancerData?.reconstruction?.stomaDetails?.reasonForStoma);
    console.log('Reason for Stoma Other:', rectalCancerData?.reconstruction?.stomaDetails?.reasonForStomaOther);
    console.log('Drain Exit Site:', rectalCancerData?.operativeEvents?.drainExitSite);
    console.log('Drain Exit Site Other:', rectalCancerData?.operativeEvents?.drainExitSiteOther);
    console.log('Suture Material:', rectalCancerData?.reconstruction?.anastomosisDetails?.sutureMaterial);
    console.log('Suture Material Other:', rectalCancerData?.reconstruction?.anastomosisDetails?.sutureMaterialOther);
    console.log('ICG Test:', rectalCancerData?.reconstruction?.anastomoticTesting?.icgTest);
    console.log('Reconstruction Type:', rectalCancerData?.reconstruction?.reconstructionType);
    
    // Map new structure to old structure for backward compatibility
    mapNewStructureToOld(rectalCancerData);
    
    // Process surgical diagram
    let diagramCanvas: string | null = null;
    if (diagrams && diagrams.length > 0) {
      diagramCanvas = await createSurgicalDiagramCanvas(diagrams, RECTAL_DIAGRAM_MARKING_SCALE);
    }
    
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    let y = margin;
    let currentPage = 1;
    
    // Column positions for layout consistency
    const pageCenter = pageWidth / 2;
    const leftColumnX = margin;
    const rightColumnX = pageCenter + 2;
    
    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - 30) {
        pdf.addPage();
        y = margin + 10;
        return true;
      }
      return false;
    };
    
    // No separate footer function needed - footer will be added at the end
    
    // HEADER - Three column layout
    const headerStartY = y;
    
    // LEFT COLUMN - Doctor Info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dr. Monde Mjoli', margin, y);
    y += 4;
    pdf.text('Specialist Surgeon', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('MBChB (UNITRA), MMed (UKZN), FCS(SA),', margin, y);
    y += 3.5;
    pdf.text('Cert Gastroenterology, Surg (SA)', margin, y);
    y += 3.5;
    pdf.text('Practice No. 0560812', margin, y);
    y += 3.5;
    pdf.text('Cell: 082 417 2630', margin, y);
    
    // RIGHT COLUMN - Practice Address
    let rightY = headerStartY;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text("St. Dominic's Medical Suites B", pageWidth - margin, rightY, { align: 'right' });
    rightY += 4;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('56 St James Road, Southernwood', pageWidth - margin, rightY, { align: 'right' });
    rightY += 3.5;
    pdf.text('East London, 5201', pageWidth - margin, rightY, { align: 'right' });
    rightY += 3.5;
    pdf.text('Tel: 043 743 7872', pageWidth - margin, rightY, { align: 'right' });
    rightY += 3.5;
    pdf.text('Fax: 043 743 6653', pageWidth - margin, rightY, { align: 'right' });
    
    // Separator line
    y = Math.max(y, rightY) + 5;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // Add the Report Title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COLORECTAL RESECTION REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Establish consistent column positions for three-column layout
    const col1X = margin;
    const col2X = margin + 65; // Better spacing for three columns
    const col3X = margin + 130; // Better spacing for three columns
    const lineSpacing = 5; // Increased for better readability and spacing
    const bodyFontSize = 8.5;
    const threeColumnWidth = 56;
    const fullWidth = pageWidth - margin * 2;
    let postPreoperativeSectionActive = false;
    const hasPrintableValue = (value: any) => hasPdfDisplayValue(value);
    const txt = (value: any) => String(value || '').trim();
    const shouldRenderInlineField = (text: string) => {
      const normalized = String(text || '');
      const separatorIndex = normalized.indexOf(':');
      if (separatorIndex === -1) {
        return hasPrintableValue(normalized);
      }

      const label = normalized.slice(0, separatorIndex).trim();
      const value = normalized.slice(separatorIndex + 1).trim();
      if (!postPreoperativeSectionActive) {
        return hasPrintableValue(value);
      }

      return hasPrintableValue(value) || isPostPreoperativeAlwaysVisibleField(label);
    };
    const writeColumnsRow = (
      columns: Array<{ text: string; x: number; width: number }>,
      spacing = lineSpacing,
    ) => {
      const rowLayouts = columns.map((column) => {
        if (!shouldRenderInlineField(column.text)) {
          return {
            isLabelValue: false,
            labelLines: [] as string[],
            valueLines: [] as string[],
            labelWidth: 0,
            lineCount: 0,
          };
        }

        const separatorIndex = column.text.indexOf(':');
        if (separatorIndex === -1) {
          const valueLines = pdf.splitTextToSize(column.text, column.width) as string[];
          return {
            isLabelValue: false,
            labelLines: [] as string[],
            valueLines,
            labelWidth: 0,
            lineCount: Math.max(valueLines.length, 1),
          };
        }

        const labelText = `${column.text.slice(0, separatorIndex).trim()}:`;
        const valueText = column.text.slice(separatorIndex + 1).trim();
        const labelWidth = Math.min(40, Math.max(18, column.width * 0.42));
        const valueWidth = Math.max(12, column.width - labelWidth - 2);
        const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
        const valueLines = pdf.splitTextToSize(valueText, valueWidth) as string[];
        return {
          isLabelValue: true,
          labelLines,
          valueLines,
          labelWidth,
          lineCount: Math.max(labelLines.length, valueLines.length, 1),
        };
      });
      const lineCount = Math.max(
        ...rowLayouts.map((layout) => layout.lineCount),
        1,
      );
      if (rowLayouts.every((layout) => layout.lineCount === 0)) {
        return;
      }
      checkPageBreak(lineCount * spacing + 2);

      for (let index = 0; index < lineCount; index++) {
        rowLayouts.forEach((layout, columnIndex) => {
          const cellX = columns[columnIndex].x;
          if (layout.isLabelValue) {
            if (layout.labelLines[index]) {
              pdf.setFont('helvetica', 'bold');
              pdf.text(layout.labelLines[index], cellX, y);
            }
            if (layout.valueLines[index]) {
              pdf.setFont('helvetica', 'normal');
              pdf.text(layout.valueLines[index], cellX + layout.labelWidth + 2, y);
            }
          } else if (layout.valueLines[index]) {
            pdf.setFont('helvetica', 'normal');
            pdf.text(layout.valueLines[index], cellX, y);
          }
        });
        y += spacing;
      }
      pdf.setFont('helvetica', 'normal');
    };
    const addWrappedField = (
      label: string,
      value: string,
      x = margin,
      width = pageWidth - margin * 2,
    ) => {
      if (!hasPrintableValue(value)) return;
      const labelText = `${label}:`;
      const labelWidth = Math.min(70, Math.max(24, width * 0.4));
      const valueWidth = Math.max(20, width - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
      const valueLines = pdf.splitTextToSize(value, valueWidth) as string[];
      const lineCount = Math.max(labelLines.length, valueLines.length, 1);
      checkPageBreak(lineCount * lineSpacing + 2);
      for (let index = 0; index < lineCount; index += 1) {
        if (labelLines[index]) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(labelLines[index], x, y);
        }
        if (valueLines[index]) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(valueLines[index], x + labelWidth + 2, y);
        }
        y += lineSpacing;
      }
      pdf.setFont('helvetica', 'normal');
    };

    const drawSectionDivider = (spacingAfter: number = 6) => {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);
      y += spacingAfter;
    };

    const drawWrappedColumns = (
      columns: Array<{ text: string; x: number; width: number }>,
      lineHeight: number = 4,
      rowGap: number = 1.5,
    ) => {
      const visibleColumns = columns.filter((column) => hasPrintableValue(column.text));
      if (visibleColumns.length === 0) {
        return;
      }

      const lineGroups = columns.map((column) =>
        hasPrintableValue(column.text)
          ? (() => {
              const separatorIndex = column.text.indexOf(':');
              if (separatorIndex === -1) {
                return {
                  isLabelValue: false,
                  labelLines: [] as string[],
                  valueLines: pdf.splitTextToSize(column.text, column.width) as string[],
                  labelWidth: 0,
                };
              }

              const labelText = `${column.text.slice(0, separatorIndex).trim()}:`;
              const valueText = column.text.slice(separatorIndex + 1).trim();
              const labelWidth = Math.min(36, Math.max(18, column.width * 0.42));
              const valueWidth = Math.max(12, column.width - labelWidth - 2);
              return {
                isLabelValue: true,
                labelLines: pdf.splitTextToSize(labelText, labelWidth) as string[],
                valueLines: pdf.splitTextToSize(valueText, valueWidth) as string[],
                labelWidth,
              };
            })()
          : null,
      );

      const lineCount = Math.max(
        1,
        ...lineGroups.map((layout) =>
          layout
            ? Math.max(layout.labelLines.length, layout.valueLines.length, 1)
            : 0,
        ),
      );

      checkPageBreak(lineCount * lineHeight + rowGap + 1);

      for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
        columns.forEach((column, columnIndex) => {
          const layout = lineGroups[columnIndex];
          if (!layout) {
            return;
          }

          if (layout.isLabelValue) {
            if (layout.labelLines[lineIndex]) {
              pdf.setFont('helvetica', 'bold');
              pdf.text(layout.labelLines[lineIndex], column.x, y);
            }
            if (layout.valueLines[lineIndex]) {
              pdf.setFont('helvetica', 'normal');
              pdf.text(layout.valueLines[lineIndex], column.x + layout.labelWidth + 2, y);
            }
          } else if (layout.valueLines[lineIndex]) {
            pdf.setFont('helvetica', 'normal');
            pdf.text(layout.valueLines[lineIndex], column.x, y);
          }
        });
        y += lineHeight;
      }

      pdf.setFont('helvetica', 'normal');
      y += rowGap;
    };

    const drawWrappedTextBlock = (
      text: string,
      x: number,
      width: number,
      lineHeight: number = 4,
      bottomGap: number = 1.5,
    ) => {
      if (!hasPrintableValue(text)) {
        return;
      }

      const separatorIndex = text.indexOf(':');
      if (separatorIndex === -1) {
        const lines = pdf.splitTextToSize(text, width) as string[];
        checkPageBreak(lines.length * lineHeight + bottomGap + 1);
        lines.forEach((line: string) => {
          pdf.setFont('helvetica', 'normal');
          pdf.text(line, x, y);
          y += lineHeight;
        });
        y += bottomGap;
        return;
      }

      const labelText = `${text.slice(0, separatorIndex).trim()}:`;
      const valueText = text.slice(separatorIndex + 1).trim();
      const labelWidth = Math.min(62, Math.max(24, width * 0.4));
      const valueWidth = Math.max(20, width - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
      const valueLines = pdf.splitTextToSize(valueText, valueWidth) as string[];
      const lineCount = Math.max(labelLines.length, valueLines.length, 1);

      checkPageBreak(lineCount * lineHeight + bottomGap + 1);
      for (let index = 0; index < lineCount; index += 1) {
        if (labelLines[index]) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(labelLines[index], x, y);
        }
        if (valueLines[index]) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(valueLines[index], x + labelWidth + 2, y);
        }
        y += lineHeight;
      }
      pdf.setFont('helvetica', 'normal');
      y += bottomGap;
    };

    const drawQuestionAnswerRows = (
      rows: Array<{ label: string; value: string; alwaysVisible?: boolean }>,
      options: {
        labelX?: number;
        valueX?: number;
        labelWidth?: number;
        valueWidth?: number;
        lineHeight?: number;
        rowGap?: number;
      } = {},
    ) => {
      const labelX = options.labelX ?? margin;
      const valueX = options.valueX ?? margin + 68;
      const labelWidth = options.labelWidth ?? 62;
      const valueWidth = options.valueWidth ?? pageWidth - margin - valueX;
      const lineHeight = options.lineHeight ?? 4;
      const rowGap = options.rowGap ?? 1.5;

      rows.forEach(({ label, value }) => {
        const normalizedValue = String(value || '').trim();
        if (!normalizedValue) {
          return;
        }

        const labelText = `${label}:`;
        const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
        const valueLines = normalizedValue
          ? (pdf.splitTextToSize(normalizedValue, valueWidth) as string[])
          : [];
        const lineCount = Math.max(labelLines.length, valueLines.length, 1);

        checkPageBreak(lineCount * lineHeight + rowGap + 1);

        for (let index = 0; index < lineCount; index += 1) {
          if (labelLines[index]) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(labelLines[index], labelX, y);
          }
          if (valueLines[index]) {
            pdf.setFont('helvetica', 'normal');
            pdf.text(valueLines[index], valueX, y);
          }
          y += lineHeight;
        }

        pdf.setFont('helvetica', 'normal');
        y += rowGap;
      });
    };

    const drawInlineLabelValue = (
      text: string,
      x: number,
      currentY: number,
      width: number,
      spacing = lineSpacing,
    ) => {
      if (!shouldRenderInlineField(text)) {
        return currentY;
      }

      const separatorIndex = text.indexOf(':');
      if (separatorIndex === -1) {
        const lines = pdf.splitTextToSize(text, width) as string[];
        lines.forEach((line: string, index: number) => {
          pdf.setFont('helvetica', 'normal');
          pdf.text(line, x, currentY + index * spacing);
        });
        return currentY + Math.max(lines.length, 1) * spacing;
      }

      const labelText = `${text.slice(0, separatorIndex).trim()}:`;
      const valueText = text.slice(separatorIndex + 1).trim();
      const labelWidth = Math.min(42, Math.max(18, width * 0.42));
      const valueWidth = Math.max(12, width - labelWidth - 2);
      const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
      const valueLines = pdf.splitTextToSize(valueText, valueWidth) as string[];
      const lineCount = Math.max(labelLines.length, valueLines.length, 1);

      for (let index = 0; index < lineCount; index += 1) {
        if (labelLines[index]) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(labelLines[index], x, currentY + index * spacing);
        }
        if (valueLines[index]) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(
            valueLines[index],
            x + labelWidth + 2,
            currentY + index * spacing,
          );
        }
      }

      pdf.setFont('helvetica', 'normal');
      return currentY + lineCount * spacing;
    };

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(bodyFontSize);

    y = drawStandardPatientInformation({
      pdf,
      patientInfo: patientInfo || rectalCancerData?.patientInfo,
      asaLabel: "ASA Score",
      y,
      margin,
      pageWidth,
      pageHeight,
      lineHeight: 4.5,
      patientNameFallback: patientName,
      patientIdFallback: patientId,
      bottomPadding: 30,
    });

    drawSectionDivider();

    // PREOPERATIVE INFORMATION Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', margin, y);
    y += 6;
    
    pdf.setFontSize(bodyFontSize);
    pdf.setFont('helvetica', 'normal');
    
    const surgeonText = rectalCancerData?.surgicalTeam?.surgeons?.filter(s => s.trim()).join(', ') || '';
    const assistantText = rectalCancerData?.surgicalTeam?.assistants?.filter(a => a.trim()).join(', ') || '';
    const anaesthetistText = rectalCancerData?.surgicalTeam?.anaesthetists?.filter(a => a.trim()).join(', ') || rectalCancerData?.surgicalTeam?.anaesthetist || '';
    const startTime = rectalCancerData?.procedureDetails?.startTime || '';
    const endTime = rectalCancerData?.procedureDetails?.endTime || '';
    const totalDuration = rectalCancerData?.procedureDetails?.duration ? `${rectalCancerData.procedureDetails.duration} minutes` : '';
    const procedureUrgency = rectalCancerData?.procedureDetails?.procedureUrgency || '';
    const operationDescription =
      rectalCancerData?.operationType?.operationFindings ||
      rectalCancerData?.procedureDetails?.operationDescription ||
      '';
    const imagingText = rectalCancerData?.procedureDetails?.preoperativeImaging?.map(imaging => 
      imaging === 'Other' && rectalCancerData.procedureDetails.preoperativeImagingOther 
        ? `Other: ${rectalCancerData.procedureDetails.preoperativeImagingOther}` 
        : imaging
    ).join(', ') || '';
    const neoadjuvantTreatment = rectalCancerData?.operationType?.neoadjuvantTreatment || '';
    const indicationText = (rectalCancerData?.operationType?.operationFindingsOptions || [])
      .map((option: string) => {
        if (option === 'Other' && rectalCancerData?.operationType?.operationFindingsOther?.trim()) {
          return `Other: ${rectalCancerData.operationType.operationFindingsOther}`;
        }
        return option;
      })
      .join(', ');

    drawWrappedColumns([
      { text: `Surgeon: ${surgeonText}`, x: col1X, width: threeColumnWidth },
      { text: `Assistant: ${assistantText}`, x: margin + 62, width: threeColumnWidth },
      { text: `Anaesthetist: ${anaesthetistText}`, x: margin + 124, width: threeColumnWidth },
    ]);
    drawWrappedColumns([
      { text: `Start Time: ${startTime}`, x: col1X, width: threeColumnWidth },
      { text: `End Time: ${endTime}`, x: margin + 62, width: threeColumnWidth },
      { text: `Total Duration: ${totalDuration}`, x: margin + 124, width: threeColumnWidth },
    ]);
    drawWrappedColumns([
      { text: `Urgency: ${procedureUrgency}`, x: col1X, width: threeColumnWidth },
      { text: `Imaging: ${imagingText}`, x: margin + 62, width: threeColumnWidth },
      { text: `Neoadjuvant Treatment: ${neoadjuvantTreatment}`, x: margin + 124, width: threeColumnWidth },
    ]);
    drawWrappedTextBlock(`Indication for Surgery: ${indicationText}`, margin, fullWidth);
    drawWrappedTextBlock(`Operation Description: ${operationDescription}`, margin, fullWidth);
    postPreoperativeSectionActive = true;

    drawSectionDivider();
    
    // OPERATIVE FINDINGS Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OPERATIVE FINDINGS', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Row 1: Operation Findings (conditional - for Colon or Rectum operation type)
    const operationTypeArray = rectalCancerData?.operationType?.type || [];
    const isColonSelected = Array.isArray(operationTypeArray) ? operationTypeArray.includes('Colon') : false;
    const isRectumSelected = Array.isArray(operationTypeArray) ? operationTypeArray.includes('Rectum') : false;
    const operationFindingsOptions = rectalCancerData?.operationType?.operationFindingsOptions || [];
    const operationFindingsSelectionText = operationFindingsOptions
      .map((option: string) => {
        if (option === 'Other' && rectalCancerData?.operationType?.operationFindingsOther?.trim()) {
          return `Other: ${rectalCancerData.operationType.operationFindingsOther}`;
        }
        return option;
      })
      .join(', ');
    const operativeFindingsRows: Array<{ label: string; value: string; alwaysVisible?: boolean }> = [];

    if (isColonSelected || isRectumSelected) {
      operativeFindingsRows.push({
        label: 'Operation Findings',
        value: operationFindingsSelectionText,
        alwaysVisible: true,
      });
    }

    if (isRectumSelected) {
      const findings = rectalCancerData?.findings?.description || '';
      const mesorectalCompleteness = rectalCancerData?.findings?.mesorectalCompleteness || '';
      const location = rectalCancerData?.findings?.location?.join(', ') || '';
      const completenessOfResection = rectalCancerData?.operationType?.resectionCompleteness || rectalCancerData?.findings?.completenessOfTumourResection || '';

      operativeFindingsRows.push(
        { label: 'Findings', value: findings, alwaysVisible: true },
        {
          label: 'Mesorectal Completeness',
          value: mesorectalCompleteness,
          alwaysVisible: true,
        },
        { label: 'Location', value: location, alwaysVisible: true },
        {
          label: 'Completeness of Tumour Resection',
          value: completenessOfResection,
          alwaysVisible: true,
        },
      );
    }

    drawQuestionAnswerRows(operativeFindingsRows);
    drawSectionDivider();
    
    // TWO-COLUMN LAYOUT: PROCEDURE DETAILS (Left) | PORTS AND INCISIONS (Right)
    const procedureStartY = y;
    
    // Column 1: PROCEDURE DETAILS
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', margin, y);
    
    // Column 2: PORTS AND INCISIONS (at same Y level)
    const portsCol1X = pageCenter + 10;
    pdf.text('PORTS AND INCISIONS', portsCol1X + 3, y);
    
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // RESTRUCTURED PROCEDURE DETAILS - Three-column layout (question labels + answers + diagram)
    const primaryApproachRaw = rectalCancerData?.surgicalApproach?.primaryApproach;
    const primaryApproachList = Array.isArray(primaryApproachRaw)
      ? primaryApproachRaw
      : primaryApproachRaw
        ? [primaryApproachRaw]
        : [];
    const primaryApproach = primaryApproachList.join(', ');
    const operationTypeText = rectalCancerData?.operationType?.type?.join(', ') || '';

    const normalizedApproaches = primaryApproachList.map((approach: string) => approach.toLowerCase());
    const isConverted = normalizedApproaches.some((approach: string) =>
      approach.includes('converted') || approach.includes('conversion')
    );
    const conversionReason = rectalCancerData?.surgicalApproach?.conversionReason?.join(', ') || '';
    const conversionOther = rectalCancerData?.surgicalApproach?.conversionReasonOther
      ? `, ${rectalCancerData.surgicalApproach.conversionReasonOther}`
      : '';
    const conversionText = isConverted ? `${conversionReason}${conversionOther}` : '';

    const rectumOpsText = rectalCancerData?.operationType?.rectumOperationType?.join(', ') || '';
    const rectumOtherText = rectalCancerData?.operationType?.rectumOperationOther
      ? `, Other: ${rectalCancerData.operationType.rectumOperationOther}`
      : '';
    const rectumFullText = `${rectumOpsText}${rectumOtherText}`;
    const rectumOperationTypes =
      rectumFullText && rectumFullText.trim() && rectumFullText.trim() !== ', Other: '
        ? rectumFullText
        : '';

    const isMinimallyInvasive = normalizedApproaches.some((approach: string) =>
      (approach.includes('laparoscopic') || approach.includes('robotic')) && !approach.includes('open')
    );
    const trocarNumber = (isMinimallyInvasive || isConverted)
      ? (rectalCancerData?.surgicalApproach?.trocarNumber || '')
      : '';

    const pointsOfDifficultyList = Array.isArray(rectalCancerData?.operativeEvents?.pointsOfDifficulty)
      ? rectalCancerData.operativeEvents.pointsOfDifficulty
      : [];
    const pointsOfDifficultyOther = rectalCancerData?.operativeEvents?.pointsOfDifficultyOther || '';
    const pointsOfDifficultyText = pointsOfDifficultyList
      .map((item: string) =>
        item === 'Other' && pointsOfDifficultyOther ? `Other: ${pointsOfDifficultyOther}` : item
      )
      .join(', ');

    const intraoperativeEventsList = Array.isArray(rectalCancerData?.operativeEvents?.intraoperativeEvents)
      ? rectalCancerData.operativeEvents.intraoperativeEvents
      : [];
    const intraoperativeEventsOther = rectalCancerData?.operativeEvents?.intraoperativeEventsOther || '';
    const intraoperativeEventsText = intraoperativeEventsList
      .map((item: string) =>
        item === 'Other' && intraoperativeEventsOther ? `Other: ${intraoperativeEventsOther}` : item
      )
      .join(', ');

    const procedureColumnStartY = procedureStartY + 6;
    const procedureQuestionX = margin;
    const procedureTextAreaWidth = portsCol1X - margin - 8;
    const procedureQuestionWidth = Math.min(36, Math.max(24, procedureTextAreaWidth * 0.34));
    const procedureAnswerX = procedureQuestionX + procedureQuestionWidth + 4;
    const procedureAnswerWidth = Math.max(12, procedureTextAreaWidth - procedureQuestionWidth - 4);

    const drawProcedureFieldRow = (
      label: string,
      value: string,
      currentY: number,
    ) => {
      if (!value || !value.trim()) {
        return currentY;
      }

      const labelText = `${label}:`;
      const labelLines = pdf.splitTextToSize(labelText, procedureQuestionWidth) as string[];
      const valueLines = pdf.splitTextToSize(value, procedureAnswerWidth) as string[];
      const lineCount = Math.max(labelLines.length, valueLines.length, 1);

      for (let index = 0; index < lineCount; index += 1) {
        if (labelLines[index]) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(labelLines[index], procedureQuestionX, currentY);
        }
        if (valueLines[index]) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(valueLines[index], procedureAnswerX, currentY);
        }
        currentY += 4;
      }

      return currentY + 1.5;
    };

    let procedureRowY = procedureColumnStartY;

    procedureRowY = drawProcedureFieldRow(
      'Operation Type',
      operationTypeText,
      procedureRowY,
    );
    if (isRectumSelected) {
      procedureRowY = drawProcedureFieldRow(
        'Rectum Operation Types',
        rectumOperationTypes,
        procedureRowY,
      );
    }
    procedureRowY = drawProcedureFieldRow(
      'Surgical Approach',
      primaryApproach,
      procedureRowY,
    );
    if (isConverted && conversionText) {
      procedureRowY = drawProcedureFieldRow(
        'Reason for Conversion',
        conversionText,
        procedureRowY,
      );
    }
    procedureRowY = drawProcedureFieldRow(
      'Trocar Number',
      trocarNumber,
      procedureRowY,
    );
    procedureRowY = drawProcedureFieldRow(
      'Points of Difficulty',
      pointsOfDifficultyText,
      procedureRowY,
    );
    procedureRowY = drawProcedureFieldRow(
      'Intraoperative Events/Complications',
      intraoperativeEventsText,
      procedureRowY,
    );

    const leftColumnEndY = procedureRowY;
    
    // RIGHT COLUMN: PORTS AND INCISIONS content (moved from later section)
    let portsY = procedureStartY + 6; // Start right after the title
    
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legend:', portsCol1X, portsY);
    portsY += 3.5;
    
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    
    // Define column positions for legend
    const legendCol1X = portsCol1X + 4;
    const legendCol2X = portsCol1X + 46;
    
    // ROW 1: Ports and Ileostomy
    let legendRow1Y = portsY;
    
    // Ports icon (left side)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1.6);
    pdf.line(legendCol1X, legendRow1Y, legendCol1X + 8, legendRow1Y);
    pdf.setFontSize(4.8);
    pdf.text('12mm', legendCol1X + 1.5, legendRow1Y - 0.8);
    pdf.setFontSize(6.5);
    pdf.text('Ports (with size)', legendCol1X + 10, legendRow1Y + 1);
    
    // Ileostomy icon (right side)
    pdf.setDrawColor(245, 158, 11); // Gold/Yellow
    pdf.setLineWidth(1.3);
    pdf.setLineDash([1.5, 1]);
    pdf.circle(legendCol2X + 3.5, legendRow1Y, 2, 'S');
    pdf.setLineDash([]);
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Ileostomy', legendCol2X + 7.5, legendRow1Y + 1);
    
    portsY += 3.5;
    
    // ROW 2: Incisions and Colostomy
    let legendRow2Y = portsY;
    
    // Incisions icon (left side)
    pdf.setDrawColor(139, 0, 0); // Dark red
    pdf.setLineWidth(1.4);
    pdf.setLineDash([2.5, 1.8]);
    pdf.line(legendCol1X, legendRow2Y, legendCol1X + 8, legendRow2Y);
    pdf.setLineDash([]);
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Incisions', legendCol1X + 10, legendRow2Y + 1);
    
    // Colostomy icon (right side)
    pdf.setDrawColor(22, 163, 74); // Green
    pdf.setLineWidth(1.6);
    pdf.circle(legendCol2X + 3.5, legendRow2Y, 2, 'S');
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Colostomy', legendCol2X + 7.5, legendRow2Y + 1);
    
    portsY += 4.5;
    
    // Diagram box
    const diagramWidth = 80;
    const maxDiagramBottom = pageHeight - 32;
    const diagramHeight = Math.max(48, Math.min(60, maxDiagramBottom - portsY));
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(portsCol1X, portsY, diagramWidth, diagramHeight);
    
    // Diagram content
    if (diagramCanvas) {
      try {
        // Get image properties to preserve aspect ratio
        const imgProperties = pdf.getImageProperties(diagramCanvas);
        const imgWidth = imgProperties.width;
        const imgHeight = imgProperties.height;
        const aspectRatio = imgWidth / imgHeight;
        
        // Calculate optimal size while preserving aspect ratio
        let finalWidth = diagramWidth - 4;
        let finalHeight = (diagramWidth - 4) / aspectRatio;
        
        // If calculated height exceeds available space, scale based on height instead
        if (finalHeight > diagramHeight - 4) {
          finalHeight = diagramHeight - 4;
          finalWidth = (diagramHeight - 4) * aspectRatio;
        }
        
        // Center the diagram in the available space
        const centerX = portsCol1X + (diagramWidth - finalWidth) / 2;
        const centerY = portsY + (diagramHeight - finalHeight) / 2;
        
        pdf.addImage(diagramCanvas, 'PNG', centerX, centerY, finalWidth, finalHeight);
      } catch (error) {
        console.error('Error adding diagram to PDF:', error);
        pdf.setFontSize(8);
        pdf.text('RECTAL CANCER DIAGRAM', portsCol1X + 15, portsY + 25);
        pdf.text('(Error loading diagram)', portsCol1X + 18, portsY + 35);
      }
    } else {
      pdf.setFontSize(8);
      pdf.text('RECTAL CANCER DIAGRAM', portsCol1X + 15, portsY + 25);
    }
    
    // Coordinate Y position properly - make sure we're below both columns
    const diagramEndY = portsY + diagramHeight + 10;
    y = Math.max(diagramEndY, leftColumnEndY) + 10;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    pdf.addPage();
    y = margin + 10;

    // MOBILIZATION AND RESECTION Section on page 2
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MOBILIZATION AND RESECTION', margin, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const extentMobilizationList = rectalCancerData?.mobilizationAndResection?.extentOfMobilization || [];
    const extentMobilizationOther = rectalCancerData?.mobilizationAndResection?.extentOfMobilizationOther || '';
    const extentMobilizationText = Array.isArray(extentMobilizationList)
      ? extentMobilizationList
          .map((item: string) => (item === 'Other' && extentMobilizationOther ? `Other: ${extentMobilizationOther}` : item))
          .join(', ')
      : '';
    const vesselLigation = rectalCancerData?.mobilizationAndResection?.vesselLigation?.join(', ') || '';
    const imvLigation = rectalCancerData?.mobilizationAndResection?.imvLigation || '';
    const vesselHemostasis = rectalCancerData?.mobilizationAndResection?.hemostasisTechnique || [];
    const vesselHemostasisOther = rectalCancerData?.mobilizationAndResection?.hemostasisTechniqueOther || '';
    const vesselHemostasisText = Array.isArray(vesselHemostasis)
      ? vesselHemostasis
          .map((technique: string) =>
            technique === 'Other' && vesselHemostasisOther ? `Other: ${vesselHemostasisOther}` : technique,
          )
          .join(', ')
      : '';
    const lnd = String(rectalCancerData?.mobilizationAndResection?.lymphNodeDissection || '');
    const proximalSite = String(rectalCancerData?.mobilizationAndResection?.proximalTransection || '');
    const enBlocResection = rectalCancerData?.mobilizationAndResection?.enBlocResection?.join(', ') || '';
    const distalSite = rectalCancerData?.mobilizationAndResection?.distalTransection || [];
    const distalSiteStr = Array.isArray(distalSite) ? distalSite.join(', ') : String(distalSite || '');
    const isAnalCanalSelected = Array.isArray(distalSite)
      ? distalSite.some((site: string) => site && site.toLowerCase().includes('anal canal'))
      : String(distalSite || '').toLowerCase().includes('anal canal');
    const analCanalTransection = rectalCancerData?.mobilizationAndResection?.analCanalTransection || [];
    const analCanalTransectionOther = rectalCancerData?.mobilizationAndResection?.analCanalTransectionOther || '';
    const analCanalTransectionStr = Array.isArray(analCanalTransection)
      ? analCanalTransection
          .map((level: string) => (level === 'Other' && analCanalTransectionOther ? `Other: ${analCanalTransectionOther}` : level))
          .join(', ')
      : '';

    addWrappedField('Extent of Mobilization', extentMobilizationText);
    addWrappedField('Vessel Ligation', vesselLigation);
    addWrappedField('Inferior Mesenteric Vein Ligation', imvLigation);
    addWrappedField('Vessel Hemostasis Technique', vesselHemostasisText);
    addWrappedField('Lymph Node Dissection (LND)', lnd);
    addWrappedField('Proximal Transection Site', proximalSite);
    addWrappedField('Distal Transection Site', distalSiteStr);
    if (isAnalCanalSelected) {
      addWrappedField('Anal Canal Transection Level', analCanalTransectionStr);
    }
    addWrappedField('Excised En-Bloc Resection', enBlocResection);

    y += 3;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    checkPageBreak(85);

    // RECONSTRUCTION Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECONSTRUCTION', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const reconstructionType = rectalCancerData?.reconstruction?.reconstructionType || '';
    
    // Handle both string and array formats for reconstruction type
    let reconstructionTypeText = '';
    let isStoma = false;
    let hasAnastomosis = false;
    
    if (Array.isArray(reconstructionType)) {
      reconstructionTypeText = reconstructionType.join(', ');
      isStoma = reconstructionType.includes('Stoma');
      hasAnastomosis = reconstructionType.includes('Anastomosis');
    } else if (reconstructionType && reconstructionType.trim()) {
      reconstructionTypeText = reconstructionType;
      isStoma = reconstructionType?.toLowerCase() === 'stoma';
      hasAnastomosis = reconstructionType?.toLowerCase().includes('anastomosis') || 
                       reconstructionType?.toLowerCase().includes('colorectal') ||
                       reconstructionType?.toLowerCase().includes('coloanal');
    }
    
    const reconstructionRows: Array<{ label: string; value: string; alwaysVisible?: boolean }> = [
      {
        label: 'Reconstruction Type',
        value: reconstructionTypeText,
        alwaysVisible: true,
      },
    ];
    const anastomosisDetails = rectalCancerData?.reconstruction?.anastomosisDetails || {};
    const anastomoticTechnique = anastomosisDetails?.technique || '';
    const anastomoticTechniqueNormalized = String(anastomoticTechnique || '').toLowerCase();
    const isSutureTechnique =
      anastomoticTechniqueNormalized.includes('suture') ||
      anastomoticTechniqueNormalized === 'suture';
    const isStapledTechnique =
      anastomoticTechniqueNormalized.includes('stapled') ||
      anastomoticTechniqueNormalized === 'stapled';

    if (hasAnastomosis) {
      reconstructionRows.push(
        {
          label: 'Site of Anastomosis',
          value: anastomosisDetails?.site || '',
          alwaysVisible: true,
        },
        {
          label: 'Configuration',
          value: anastomosisDetails?.configuration || '',
          alwaysVisible: true,
        },
        {
          label: 'Anastomotic Technique',
          value: anastomoticTechnique,
          alwaysVisible: true,
        },
      );

      if (isSutureTechnique) {
        const sutureMaterial = Array.isArray(anastomosisDetails?.sutureMaterial)
          ? anastomosisDetails.sutureMaterial
          : [];
        const sutureMaterialOther = anastomosisDetails?.sutureMaterialOther || '';
        const sutureMaterialText = sutureMaterial
          .map((material: string) =>
            material === 'Other' && sutureMaterialOther ? `Other: ${sutureMaterialOther}` : material,
          )
          .join(', ');

        reconstructionRows.push({
          label: 'Suture Material',
          value: sutureMaterialText,
          alwaysVisible: true,
        });
      }

      if (isStapledTechnique) {
        const linearSizes = Array.isArray(anastomosisDetails?.linearStaplerSize)
          ? anastomosisDetails.linearStaplerSize
          : [];
        const linearOther = anastomosisDetails?.linearStaplerSizeOther || '';
        const circularSizes = Array.isArray(anastomosisDetails?.circularStaplerSize)
          ? anastomosisDetails.circularStaplerSize
          : [];
        const circularOther = anastomosisDetails?.circularStaplerSizeOther || '';

        reconstructionRows.push(
          {
            label: 'Linear Stapler Sizes',
            value: linearSizes
              .map((size: string) => (size === 'Other' && linearOther ? `Other: ${linearOther}` : size))
              .join(', '),
            alwaysVisible: true,
          },
          {
            label: 'Circular Stapler Sizes',
            value: circularSizes
              .map((size: string) =>
                size === 'Other' && circularOther ? `Other: ${circularOther}` : size,
              )
              .join(', '),
            alwaysVisible: true,
          },
          {
            label: 'Anastomotic Height',
            value: String(anastomosisDetails?.anastomoticHeight || '').trim(),
            alwaysVisible: true,
          },
          {
            label: 'Doughnut Assessment',
            value: String(anastomosisDetails?.doughnutAssessment || '').trim(),
            alwaysVisible: true,
          },
          {
            label: 'Air Leak Test',
            value: String(anastomosisDetails?.airLeakTest || '').trim(),
            alwaysVisible: true,
          },
        );
      }

      reconstructionRows.push({
        label: 'Indocyanine Green (ICG) Test',
        value: rectalCancerData?.reconstruction?.anastomoticTesting?.icgTest || '',
        alwaysVisible: true,
      });
    }

    if (isStoma) {
      const reasonForStoma = rectalCancerData?.reconstruction?.stomaDetails?.reasonForStoma || '';
      const reasonForStomaOther = rectalCancerData?.reconstruction?.stomaDetails?.reasonForStomaOther || '';

      let reasonForStomaText = '';
      if (Array.isArray(reasonForStoma)) {
        reasonForStomaText = reasonForStoma
          .map((reason: string) =>
            reason === 'Other' && reasonForStomaOther ? `Other: ${reasonForStomaOther}` : reason,
          )
          .join(', ');
      } else {
        reasonForStomaText = String(reasonForStoma || '');
        if (reasonForStomaText === 'Other' && reasonForStomaOther) {
          reasonForStomaText = `Other: ${reasonForStomaOther}`;
        }
      }

      reconstructionRows.push(
        {
          label: 'Stoma Configuration',
          value: rectalCancerData?.reconstruction?.stomaDetails?.configuration || '',
          alwaysVisible: true,
        },
        {
          label: 'Reason for Stoma',
          value: reasonForStomaText,
          alwaysVisible: true,
        },
      );
    }

    // Handle "Other" reconstruction type details
    const hasOtherReconstruction = Array.isArray(reconstructionType) 
      ? reconstructionType.includes('Other') 
      : reconstructionType?.toLowerCase() === 'other';
    
    if (hasOtherReconstruction) {
      reconstructionRows.push({
        label: 'Other Reconstruction Details',
        value: rectalCancerData?.reconstruction?.reconstructionOther || '',
        alwaysVisible: true,
      });
    }

    drawQuestionAnswerRows(reconstructionRows);
    drawSectionDivider();
    
    // CLOSURE Section
    checkPageBreak(65);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const closureRowWidth = pageWidth - margin * 2;
    
    // Closure fields
    const woundProtector = rectalCancerData?.operativeEvents?.woundProtector || '';
    y = drawInlineLabelValue(`Wound Protector Used: ${woundProtector}`, margin, y, closureRowWidth);
    
    const drainInsertion = rectalCancerData?.operativeEvents?.drainInsertion || '';
    y = drawInlineLabelValue(`Drain Insertion: ${drainInsertion}`, margin, y, closureRowWidth);
    
    const drainTypes = rectalCancerData?.operativeEvents?.drainType || [];
    let drainTypeDisplay = '';
    if (Array.isArray(drainTypes) && drainTypes.length > 0) {
      drainTypeDisplay = drainTypes
        .map((type: string) => {
          if (type === 'Other' && rectalCancerData?.operativeEvents?.drainTypeOther?.trim()) {
            return `Other: ${rectalCancerData.operativeEvents.drainTypeOther.trim()}`;
          }
          return type;
        })
        .filter((type: string) => hasPrintableValue(type))
        .join(', ');
    }
    y = drawInlineLabelValue(`Type of Drain: ${drainTypeDisplay}`, margin, y, closureRowWidth);
    
    const intraPeritoneal = rectalCancerData?.operativeEvents?.intraPeritonealPlacement || '';
    y = drawInlineLabelValue(
      `Intra-Peritoneal Placement: ${intraPeritoneal}`,
      margin,
      y,
      closureRowWidth,
    );
    
    const exitSite = Array.isArray(rectalCancerData?.operativeEvents?.drainExitSite) 
      ? rectalCancerData.operativeEvents.drainExitSite.join(', ') 
      : (rectalCancerData?.operativeEvents?.drainExitSite || '');
    y = drawInlineLabelValue(`Exit Site: ${exitSite}`, margin, y, closureRowWidth);
    
    const fascialClosure = Array.isArray(rectalCancerData?.closure?.fascialClosure) 
      ? rectalCancerData.closure.fascialClosure.join(', ') 
      : (rectalCancerData?.closure?.fascialClosure || '');
    // Only show Fascial Closure if user has selected something
    if (fascialClosure && fascialClosure.trim()) {
      y = drawInlineLabelValue(`Fascial Closure: ${fascialClosure}`, margin, y, closureRowWidth);
    }
    
    const fascialMaterial = Array.isArray(rectalCancerData?.closure?.fascialSutureMaterial) 
      ? rectalCancerData.closure.fascialSutureMaterial.map(material => 
          material === 'Other' && rectalCancerData?.closure?.fascialSutureMaterialOther 
            ? `Other: ${rectalCancerData.closure.fascialSutureMaterialOther}` 
            : material
        ).join(', ') 
      : (rectalCancerData?.closure?.fascialSutureMaterial || '');
    // Only show Fascial Material Used if user has selected something
    if (fascialMaterial && fascialMaterial.trim()) {
      y = drawInlineLabelValue(
        `Fascial Material Used: ${fascialMaterial}`,
        margin,
        y,
        closureRowWidth,
      );
    }
    
    const skinClosure = Array.isArray(rectalCancerData?.closure?.skinClosure) 
      ? rectalCancerData.closure.skinClosure.join(', ') 
      : (rectalCancerData?.closure?.skinClosure || '');
    // Only show Skin Closure if user has selected something
    if (skinClosure && skinClosure.trim()) {
      y = drawInlineLabelValue(`Skin Closure: ${skinClosure}`, margin, y, closureRowWidth);
    }
    
    const skinMaterial = Array.isArray(rectalCancerData?.closure?.skinClosureMaterial) 
      ? rectalCancerData.closure.skinClosureMaterial.map(material => 
          material === 'Other' && rectalCancerData?.closure?.skinClosureMaterialOther 
            ? `Other: ${rectalCancerData.closure.skinClosureMaterialOther}` 
            : material
        ).join(', ') 
      : (rectalCancerData?.closure?.skinClosureMaterial || '');
    // Only show Skin Material Used if user has selected something
    if (skinMaterial && skinMaterial.trim()) {
      y = drawInlineLabelValue(
        `Skin Material Used: ${skinMaterial}`,
        margin,
        y,
        closureRowWidth,
      );
    }
    y += 8;
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // SPECIMEN Section
    checkPageBreak(35);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPECIMEN', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    drawQuestionAnswerRows([
      {
        label: 'Specimen Extraction Site',
        value: rectalCancerData?.operativeEvents?.specimenExtraction || '',
        alwaysVisible: true,
      },
      {
        label: 'Specimen Sent to Laboratory',
        value: rectalCancerData?.operativeEvents?.specimenSentToLab || '',
        alwaysVisible: true,
      },
      {
        label: 'Specify Laboratory Sent to',
        value: rectalCancerData?.operativeEvents?.laboratoryName || '',
        alwaysVisible: true,
      },
    ]);
    y += 2;
    drawSectionDivider();
    
    // ADDITIONAL NOTES Section
    const additionalNotes = rectalCancerData?.additionalInfo?.additionalInformation?.trim() || '';
    const additionalNotesLines = pdf.splitTextToSize(
      `Additional Notes: ${additionalNotes}`,
      pageWidth - (margin * 2)
    );
    checkPageBreak(additionalNotesLines.length * lineSpacing + 14); // Header + content + spacing
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADDITIONAL NOTES', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    y = drawInlineLabelValue(
      `Additional Notes: ${additionalNotes}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    y += 4; // Reduced spacing
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // POST OPERATIVE MANAGEMENT Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POST OPERATIVE MANAGEMENT', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const postOpManagement = rectalCancerData?.additionalInfo?.postOperativeManagement?.trim() || '';
    drawQuestionAnswerRows([
      {
        label: 'Post Operative Management',
        value: postOpManagement,
        alwaysVisible: true,
      },
    ]);
    y += 2;
    drawSectionDivider(15);
    checkPageBreak(32);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const signatureY = y;
    const signatureCol1X = margin;
    const signatureCol2X = margin + 100;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Surgeon's Signature:", signatureCol1X, signatureY);
    pdf.text("Date & Time:", signatureCol2X, signatureY);
    pdf.setFont('helvetica', 'normal');
    
    if (rectalCancerData?.additionalInfo?.surgeonSignature) {
      if (rectalCancerData.additionalInfo.surgeonSignature.startsWith('data:image')) {
        try {
          const dimensions = await calculateSignatureDimensions(rectalCancerData.additionalInfo.surgeonSignature);
          
          pdf.addImage(
            rectalCancerData.additionalInfo.surgeonSignature, 
            'PNG', 
            signatureCol1X + 40, 
            signatureY - dimensions.height + 3, 
            dimensions.width, 
            dimensions.height
          );
        } catch (error) {
          console.error('Error adding signature image:', error);
          pdf.text('[Signature]', signatureCol1X + 40, signatureY);
        }
      } else {
        pdf.text(rectalCancerData.additionalInfo.surgeonSignature, signatureCol1X + 40, signatureY);
      }
    }
    
    const currentDate = rectalCancerData?.additionalInfo?.dateTime 
      ? formatDateTimeDDMMYYYYWithDashes(rectalCancerData.additionalInfo.dateTime)
      : formatDateTimeDDMMYYYYWithDashes(new Date());
    pdf.text(currentDate, signatureCol2X + 25, signatureY);
    
    // Calculate total pages and add footer to each page
    const totalPages = pdf.internal.getNumberOfPages();
    
    // Format current date for footer
    const footerDate = new Date();
    const day = footerDate.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[footerDate.getMonth()];
    const year = footerDate.getFullYear();
    const dateWithSuffix = `${day}${day === 1 || day === 21 || day === 31 ? 'st' : 
                            day === 2 || day === 22 ? 'nd' : 
                            day === 3 || day === 23 ? 'rd' : 'th'} ${month} ${year}`;
    
    // Add footer only to page 2 and subsequent pages
    for (let i = 2; i <= totalPages; i++) {
      pdf.setPage(i);
      const footerY = pageHeight - 20;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      // Enhanced footer on page 2+
      pdf.text('Dr. Monde Mjoli - Specialist Surgeon', pageWidth / 2, footerY, { align: 'center' });
      pdf.text('Practice Number: 0560812', pageWidth / 2, footerY + 4, { align: 'center' });
      pdf.text(`Report Date: ${dateWithSuffix} | Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });
    }
    
    // Return to last page
    pdf.setPage(totalPages);
    
    // Generate PDF and return
    return {
      success: true,
      blob: pdf.output('blob')
    };
    
  } catch (error) {
    console.error('Error generating rectal cancer PDF:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
};

// For saving drafts
export const saveRectalCancerDraft = (rectalCancerData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const draftData = {
      ...rectalCancerData,
      savedAt: timestamp,
      isDraft: true
    };
    
    localStorage.setItem(`rectal_cancer_draft_${timestamp}`, JSON.stringify(draftData));
    
    // Keep only the last 5 drafts
    const drafts = Object.keys(localStorage)
      .filter(key => key.startsWith('rectal_cancer_draft_'))
      .sort()
      .reverse();
    
    if (drafts.length > 5) {
      drafts.slice(5).forEach(key => localStorage.removeItem(key));
    }
    
    return {
      success: true,
      timestamp
    };
  } catch (error) {
    console.error('Error saving rectal cancer draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to save draft'
    };
  }
};
