import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateTimeDDMMYYYYWithDashes } from './dateFormatter';
import { mapNewStructureToOld } from './rectalCancerPdfGeneratorMappings';
import {
  formatPatientGender,
  formatPatientStickerDate,
  getPatientInfoPdfSections,
  hasPatientStickerMode,
  getPdfSafePatientInfo,
} from './patientSticker';
import { getSurgicalDiagramMarkingMetrics } from './surgicalDiagramMarkings';

const RECTAL_DIAGRAM_MARKING_SCALE = 1.8;

// Helper function to render label and value with different font weights
const renderLabelValue = (pdf: any, label: string, value: string, x: number, y: number) => {
  // Render label in semi-bold
  pdf.setFont('helvetica', 'bold');
  pdf.text(label + ':', x, y);
  
  // Calculate the width of the label to position the value
  const labelWidth = pdf.getTextWidth(label + ': ');
  
  // Render value in normal weight
  pdf.setFont('helvetica', 'normal');
  pdf.text(value, x + labelWidth, y);
  
  return y; // Return current Y position
};

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
    const mappedData = mapNewStructureToOld(rectalCancerData);
    
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
    
    // PATIENT INFORMATION Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATIENT INFORMATION', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Establish consistent column positions for three-column layout
    const col1X = margin;
    const col2X = margin + 65; // Better spacing for three columns
    const col3X = margin + 130; // Better spacing for three columns
    const twoCol2X = margin + 95; // For two-column layouts
    const lineSpacing = 5; // Increased for better readability and spacing
    const hasPrintableValue = (value: any) => String(value || '').trim().length > 0;
    const txt = (value: any) => String(value || '').trim();
    const writeColumnsRow = (
      columns: Array<{ text: string; x: number; width: number }>,
      spacing = lineSpacing,
    ) => {
      const rowLayouts = columns.map((column) => {
        if (!hasPrintableValue(column.text)) {
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
    const writePatientRow = (row: string[]) => {
      if (hasPrintableValue(row[0]) && !hasPrintableValue(row[1]) && !hasPrintableValue(row[2])) {
        writeColumnsRow([{ text: row[0] || '', x: col1X, width: pageWidth - margin * 2 }]);
        return;
      }

      writeColumnsRow([
        { text: row[0] || '', x: col1X, width: 60 },
        { text: row[1] || '', x: col2X, width: 60 },
        { text: row[2] || '', x: col3X, width: 60 },
      ]);
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

    const drawInlineLabelValue = (
      text: string,
      x: number,
      currentY: number,
      width: number,
      spacing = lineSpacing,
    ) => {
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

    const normalizedPatientInfo = getPdfSafePatientInfo(patientInfo);
    const patientGender = formatPatientGender(normalizedPatientInfo);
    const patientSections = hasPatientStickerMode(normalizedPatientInfo)
      ? [
          {
            title: 'Patient Details',
            rows: [
              [
                `Patient Name: ${txt(normalizedPatientInfo.name || patientName)}`,
                `Gender: ${patientGender}`,
                `Age: ${txt(normalizedPatientInfo.age)}`,
              ],
              [
                `Patient ID: ${txt(normalizedPatientInfo.patientId || patientId)}`,
                `Date Of Birth: ${formatPatientStickerDate(normalizedPatientInfo.dateOfBirth)}`,
                `Address: ${txt(normalizedPatientInfo.address)}`,
              ],
            ].filter((row) => row.some((cell) => hasPrintableValue(cell.replace(/^[^:]+:\s*/, '')))),
          },
        ].filter((section) => section.rows.length > 0)
      : getPatientInfoPdfSections(patientInfo, patientName, patientId);

    patientSections.forEach((section, sectionIndex) => {
      if (section.title) {
        checkPageBreak(7);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(section.title, margin, y);
        y += 5;
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      section.rows.forEach((row) => writePatientRow(row));

      if (sectionIndex < patientSections.length - 1) {
        y += 1;
      }
    });

    y += 3;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // PREOPERATIVE INFORMATION Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
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

    writeColumnsRow([
      { text: `Surgeon: ${surgeonText}`, x: col1X, width: 55 },
      { text: `Assistant: ${assistantText}`, x: col2X, width: 55 },
      { text: `Anaesthetist: ${anaesthetistText}`, x: col3X, width: 45 },
    ]);
    writeColumnsRow([
      { text: `Start Time: ${startTime}`, x: col1X, width: 55 },
      { text: `End Time: ${endTime}`, x: col2X, width: 55 },
      { text: `Total Duration: ${totalDuration}`, x: col3X, width: 45 },
    ]);
    writeColumnsRow([
      { text: `Procedure Urgency: ${procedureUrgency}`, x: col1X, width: 55 },
      { text: `Preoperative Imaging: ${imagingText}`, x: col2X, width: 55 },
      { text: `Neoadjuvant Treatment: ${neoadjuvantTreatment}`, x: col3X, width: 45 },
    ]);
    addWrappedField('Indication for Surgery', indicationText);
    addWrappedField('Operation Description', operationDescription);
    y += 3;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
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
    const operativeCol2X = margin + 105;
    
    // Only show the operation findings fields if Colon or Rectum is selected
    if (isColonSelected || isRectumSelected) {
      addWrappedField('Operation Findings', operationFindingsSelectionText);
    }
    
    // Row 2 & 3: Rectum-specific fields (conditional - only show when Rectum is selected)
    if (isRectumSelected) {
      const findings = rectalCancerData?.findings?.description || '';
      const mesorectalCompleteness = rectalCancerData?.findings?.mesorectalCompleteness || '';
      const location = rectalCancerData?.findings?.location?.join(', ') || '';
      const completenessOfResection = rectalCancerData?.operationType?.resectionCompleteness || rectalCancerData?.findings?.completenessOfTumourResection || '';

      writeColumnsRow([
        { text: `Findings: ${findings}`, x: col1X, width: 85 },
        { text: `Mesorectal Completeness: ${mesorectalCompleteness}`, x: operativeCol2X, width: 75 },
      ]);
      writeColumnsRow([
        { text: `Location: ${location}`, x: col1X, width: 85 },
        { text: `Completeness of Tumour Resection: ${completenessOfResection}`, x: operativeCol2X, width: 75 },
      ]);
      y += 3;
    } else {
      // Add some spacing if no rectum fields are shown
      y += 4;
    }
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // TWO-COLUMN LAYOUT: PROCEDURE DETAILS (Left) | PORTS AND INCISIONS (Right)
    const procedureStartY = y;
    
    // Column 1: PROCEDURE DETAILS
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', margin, y);
    
    // Column 2: PORTS AND INCISIONS (at same Y level)
    const portsCol1X = pageCenter + 10;
    pdf.text('PORTS AND INCISIONS', portsCol1X, y);
    
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // RESTRUCTURED PROCEDURE DETAILS - According to new layout
    
    // Prepare all field values
    const primaryApproachRaw = rectalCancerData?.surgicalApproach?.primaryApproach;
    const primaryApproachList = Array.isArray(primaryApproachRaw) 
      ? primaryApproachRaw 
      : primaryApproachRaw 
        ? [primaryApproachRaw] 
        : [];
    const primaryApproach = primaryApproachList.join(', ');
    const operationTypeText = rectalCancerData?.operationType?.type?.join(', ') || '';
    
    // Prepare conversion data
    const normalizedApproaches = primaryApproachList.map((approach: string) => approach.toLowerCase());
    const isConverted = normalizedApproaches.some((approach: string) => 
      approach.includes('converted') || approach.includes('conversion')
    );
    const conversionReason = rectalCancerData?.surgicalApproach?.conversionReason?.join(', ') || '';
    const conversionOther = rectalCancerData?.surgicalApproach?.conversionReasonOther ? `, ${rectalCancerData.surgicalApproach.conversionReasonOther}` : '';
    const conversionText = isConverted ? `${conversionReason}${conversionOther}` : '';
    
    // Prepare rectum operation types
    const rectumOpsText = rectalCancerData?.operationType?.rectumOperationType?.join(', ') || '';
    const rectumOtherText = rectalCancerData?.operationType?.rectumOperationOther ? `, Other: ${rectalCancerData.operationType.rectumOperationOther}` : '';
    const rectumFullText = `${rectumOpsText}${rectumOtherText}`;
    const rectumOperationTypes = (rectumFullText && rectumFullText.trim() && rectumFullText.trim() !== ', Other: ') ? rectumFullText : '';
    
    // Prepare trocar number
    const isMinimallyInvasive = normalizedApproaches.some((approach: string) => 
      (approach.includes('laparoscopic') || approach.includes('robotic')) && !approach.includes('open')
    );
    const trocarNumber = (isMinimallyInvasive || isConverted) ? (rectalCancerData?.surgicalApproach?.trocarNumber || '') : '';
    
    // REORDERED PROCEDURE DETAILS FIELDS WITH TEXT WRAPPING:
    const procedureColumnWidth = (pageWidth / 2) - margin - 15; // Set max width for procedure column
    
    // Helper function to add procedure field with text wrapping
    const addProcedureField = (label: string, value: string) => {
      if (value && value.trim()) {
        const labelText = `${label}:`;
        const labelWidth = Math.min(42, Math.max(20, procedureColumnWidth * 0.42));
        const valueWidth = Math.max(14, procedureColumnWidth - labelWidth - 2);
        const labelLines = pdf.splitTextToSize(labelText, labelWidth) as string[];
        const valueLines = pdf.splitTextToSize(value, valueWidth) as string[];
        const lineCount = Math.max(labelLines.length, valueLines.length, 1);
        for (let index = 0; index < lineCount; index += 1) {
          if (labelLines[index]) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(labelLines[index], col1X, y);
          }
          if (valueLines[index]) {
            pdf.setFont('helvetica', 'normal');
            pdf.text(valueLines[index], col1X + labelWidth + 2, y);
          }
          y += lineSpacing;
        }
      }
    };
    
    // NEW LAYOUT ORDER - PROCEDURE DETAILS SECTION
    addProcedureField('Operation Type', operationTypeText);

    if (isRectumSelected) {
      addProcedureField('Rectum Operation Types', rectumOperationTypes);
    }

    addProcedureField('Surgical Approach', primaryApproach);
    
    if (isConverted && conversionText) {
      addProcedureField('Reason for Conversion', conversionText);
    }
    
    addProcedureField('Trocar Number', trocarNumber);
    
    y += 6;
    
    // RIGHT COLUMN: PORTS AND INCISIONS content (moved from later section)
    let portsY = procedureStartY + 6; // Start right after the title
    
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legend:', portsCol1X, portsY);
    portsY += 3.5;
    
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    
    // Define column positions for legend
    const legendCol1X = portsCol1X;
    const legendCol2X = portsCol1X + 40;
    
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
      pdf.text('(No surgical markings)', portsCol1X + 18, portsY + 35);
    }
    
    // Skip COMPLICATIONS here - it will be placed after CLOSURE section below
    
    // Coordinate Y position properly - make sure we're below both columns
    const diagramEndY = portsY + diagramHeight + 10;
    const leftColumnEndY = y;
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
    
    // RECONSTRUCTION - THREE COLUMN LAYOUT
    const reconstructionStartY = y;
    const reconCol1X = margin; // Column 1
    const reconCol1Width = 65; // Maximum width for column 1 to prevent overlap
    const reconCol2X = margin + 68; // Column 2 - adjusted spacing (moved back slightly)
    const reconCol3X = margin + 135; // Column 3 - adjusted for better visibility
    
    let reconCol1Y = reconstructionStartY;
    let reconCol2Y = reconstructionStartY;
    let reconCol3Y = reconstructionStartY;
    
    // COLUMN 1 - Conditional fields based on reconstruction type
    reconCol1Y = drawInlineLabelValue(
      `Reconstruction Type: ${reconstructionTypeText}`,
      reconCol1X,
      reconCol1Y,
      reconCol1Width,
    );
    
    // Anastomosis fields (only show if "Anastomosis" is selected)
    if (hasAnastomosis) {
      // Site of Anastomosis
      const anastomosisSite = rectalCancerData?.reconstruction?.anastomosisDetails?.site || '';
      reconCol1Y = drawInlineLabelValue(
        `Site of Anastomosis: ${anastomosisSite}`,
        reconCol1X,
        reconCol1Y,
        reconCol1Width,
      );
      
      // Configuration
      const configuration = rectalCancerData?.reconstruction?.anastomosisDetails?.configuration || '';
      reconCol1Y = drawInlineLabelValue(
        `Configuration: ${configuration}`,
        reconCol1X,
        reconCol1Y,
        reconCol1Width,
      );
      
      // Anastomotic Technique
      const technique = rectalCancerData?.reconstruction?.anastomosisDetails?.technique || '';
      reconCol1Y = drawInlineLabelValue(
        `Anastomotic Technique: ${technique}`,
        reconCol1X,
        reconCol1Y,
        reconCol1Width,
      );
      
      // Suture Material field (only show if "Suture" is selected as technique)
      const techniqueStr = String(technique || '').toLowerCase();
      const isSutureTechnique = techniqueStr.includes('suture') || techniqueStr === 'suture';
      
      if (isSutureTechnique) {
        const sutureMaterial = rectalCancerData?.reconstruction?.anastomosisDetails?.sutureMaterial || [];
        const sutureMaterialOther = rectalCancerData?.reconstruction?.anastomosisDetails?.sutureMaterialOther || '';
        
        let sutureMaterialText = '';
        if (Array.isArray(sutureMaterial) && sutureMaterial.length > 0) {
          sutureMaterialText = sutureMaterial.map(material => 
            material === 'Other' && sutureMaterialOther ? `Other: ${sutureMaterialOther}` : material
          ).join(', ');
        }
        
        reconCol1Y = drawInlineLabelValue(
          `Suture Material: ${sutureMaterialText}`,
          reconCol1X,
          reconCol1Y,
          reconCol1Width,
        );
      }
    }
    
    // COLUMN 2 - Stapler sizes and additional anastomotic details (only show if "Anastomosis" and "Stapled" are selected)
    if (hasAnastomosis) {
      const technique = rectalCancerData?.reconstruction?.anastomosisDetails?.technique || '';
      const techniqueStr = String(technique || '').toLowerCase();
      const isStapledTechnique = techniqueStr.includes('stapled') || techniqueStr === 'stapled';
      
      if (isStapledTechnique) {
      // Linear stapler sizes
      const linearSizes: string[] = rectalCancerData?.reconstruction?.anastomosisDetails?.linearStaplerSize || [];
      const linearOther: string = rectalCancerData?.reconstruction?.anastomosisDetails?.linearStaplerSizeOther || '';
      let linearDisplay = '';
      if (Array.isArray(linearSizes) && linearSizes.length > 0) {
        linearDisplay = linearSizes.map((s: string) => (s === 'Other' && linearOther ? `Other: ${linearOther}` : s)).join(', ');
      }
      reconCol2Y = drawInlineLabelValue(
        `Linear Stapler Sizes: ${linearDisplay}`,
        reconCol2X,
        reconCol2Y,
        62,
      );

      // Circular stapler sizes
      const circularSizes: string[] = rectalCancerData?.reconstruction?.anastomosisDetails?.circularStaplerSize || [];
      const circularOther: string = rectalCancerData?.reconstruction?.anastomosisDetails?.circularStaplerSizeOther || '';
      let circularDisplay = '';
      if (Array.isArray(circularSizes) && circularSizes.length > 0) {
        circularDisplay = circularSizes.map((s: string) => (s === 'Other' && circularOther ? `Other: ${circularOther}` : s)).join(', ');
      }
      reconCol2Y = drawInlineLabelValue(
        `Circular Stapler Sizes: ${circularDisplay}`,
        reconCol2X,
        reconCol2Y,
        62,
      );
      
      // Anastomotic Height
      const anastomoticHeight = rectalCancerData?.reconstruction?.anastomosisDetails?.anastomoticHeight || '';
      const anastomoticHeightDisplay = anastomoticHeight && String(anastomoticHeight).trim() ? anastomoticHeight : 'N/A';
      reconCol2Y = drawInlineLabelValue(
        `Anastomotic Height: ${anastomoticHeightDisplay}`,
        reconCol2X,
        reconCol2Y,
        62,
      );
      
      // Doughnut Assessment
      const doughnutAssessment = rectalCancerData?.reconstruction?.anastomosisDetails?.doughnutAssessment || '';
      const doughnutAssessmentDisplay = doughnutAssessment && String(doughnutAssessment).trim() ? doughnutAssessment : 'N/A';
      reconCol2Y = drawInlineLabelValue(
        `Doughnut Assessment: ${doughnutAssessmentDisplay}`,
        reconCol2X,
        reconCol2Y,
        62,
      );
      
      // Air Leak Test
      const airLeakTest = rectalCancerData?.reconstruction?.anastomosisDetails?.airLeakTest || '';
      const airLeakTestDisplay = airLeakTest && String(airLeakTest).trim() ? airLeakTest : 'N/A';
        reconCol2Y = drawInlineLabelValue(
          `Air Leak Test: ${airLeakTestDisplay}`,
          reconCol2X,
          reconCol2Y,
          62,
        );
      }
    }
    
    // COLUMN 3 - ICG Test and Stoma details (conditional)
    // ICG Test field (only show if "Anastomosis" is selected)
    if (hasAnastomosis) {
      const icgTest = rectalCancerData?.reconstruction?.anastomoticTesting?.icgTest || '';
      reconCol3Y = drawInlineLabelValue(
        `Indocyanine Green (ICG) Test: ${icgTest}`,
        reconCol3X,
        reconCol3Y,
        56,
      );
    }
    
    // Stoma details (only show if "Stoma" is selected)
    if (isStoma) {
      // Stoma Configuration
      const stomaConfiguration = rectalCancerData?.reconstruction?.stomaDetails?.configuration || '';
      reconCol3Y = drawInlineLabelValue(
        `Stoma Configuration: ${stomaConfiguration}`,
        reconCol3X,
        reconCol3Y,
        56,
      );
      
      // Reason for Stoma
      const reasonForStoma = rectalCancerData?.reconstruction?.stomaDetails?.reasonForStoma || '';
      const reasonForStomaOther = rectalCancerData?.reconstruction?.stomaDetails?.reasonForStomaOther || '';
      
      let reasonForStomaText = '';
      if (Array.isArray(reasonForStoma)) {
        reasonForStomaText = reasonForStoma.map(reason => 
          reason === 'Other' && reasonForStomaOther ? `Other: ${reasonForStomaOther}` : reason
        ).join(', ');
      } else {
        reasonForStomaText = String(reasonForStoma || '');
        if (reasonForStomaText === 'Other' && reasonForStomaOther) {
          reasonForStomaText = `Other: ${reasonForStomaOther}`;
        }
      }
      
      reconCol3Y = drawInlineLabelValue(
        `Reason for Stoma: ${reasonForStomaText}`,
        reconCol3X,
        reconCol3Y,
        56,
      );
    }
    
    // Handle "Other" reconstruction type details
    const hasOtherReconstruction = Array.isArray(reconstructionType) 
      ? reconstructionType.includes('Other') 
      : reconstructionType?.toLowerCase() === 'other';
    
    if (hasOtherReconstruction) {
      const reconstructionOther = rectalCancerData?.reconstruction?.reconstructionOther || '';
      if (reconstructionOther) {
        reconCol1Y = drawInlineLabelValue(
          `Other Reconstruction Details: ${reconstructionOther}`,
          reconCol1X,
          reconCol1Y,
          reconCol1Width,
        );
      }
    }
    
    // Update Y position to the maximum of all three columns
    y = Math.max(reconCol1Y, reconCol2Y, reconCol3Y) + 10;
    
    // Line separator after RECONSTRUCTION
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
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
    
    // COMPLICATIONS Section (moved here after CLOSURE)
    checkPageBreak(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPLICATIONS', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Points of Difficulty
    const pointsOfDifficulty = rectalCancerData?.operativeEvents?.pointsOfDifficulty?.join(', ') || '';
    const difficultyOther = rectalCancerData?.operativeEvents?.pointsOfDifficultyOther ? `, ${rectalCancerData.operativeEvents.pointsOfDifficultyOther}` : '';
    const pointsOfDifficultyText = `${pointsOfDifficulty}${difficultyOther}`;
    const pointsOfDifficultyFinal = (pointsOfDifficultyText && pointsOfDifficultyText.trim() && pointsOfDifficultyText.trim() !== ', ') ? pointsOfDifficultyText : 'N/A';
    
    y = drawInlineLabelValue(
      `Points of Difficulty: ${pointsOfDifficultyFinal}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    
    // Intraoperative Events/Complications
    const intraOpEvents = rectalCancerData?.operativeEvents?.intraoperativeEvents?.join(', ') || '';
    const intraOpEventsFinal = (intraOpEvents && intraOpEvents.trim()) ? intraOpEvents : 'N/A';
    y = drawInlineLabelValue(
      `Intraoperative Events/Complications: ${intraOpEventsFinal}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    y += 6;
    
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
    
    // Specimen Extraction Site
    const specimenExtractionSite = rectalCancerData?.operativeEvents?.specimenExtraction || '';
    const specimenExtractionSiteFinal = (specimenExtractionSite && specimenExtractionSite.trim()) ? specimenExtractionSite : 'N/A';
    y = drawInlineLabelValue(
      `Specimen Extraction Site: ${specimenExtractionSiteFinal}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    
    // Specimen Sent to Laboratory
    const specimenSentToLab = rectalCancerData?.operativeEvents?.specimenSentToLab || '';
    const specimenSentToLabFinal = (specimenSentToLab && specimenSentToLab.trim()) ? specimenSentToLab : 'N/A';
    y = drawInlineLabelValue(
      `Specimen Sent to Laboratory: ${specimenSentToLabFinal}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    
    // Specify Laboratory Sent to
    const laboratoryName = rectalCancerData?.operativeEvents?.laboratoryName || '';
    const laboratoryNameFinal = (laboratoryName && laboratoryName.trim()) ? laboratoryName : 'N/A';
    y = drawInlineLabelValue(
      `Specify Laboratory Sent to: ${laboratoryNameFinal}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    y += 8;
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // ADDITIONAL NOTES Section
    const additionalNotes = rectalCancerData?.additionalInfo?.additionalInformation?.trim() || 'N/A';
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
    
    const postOpManagement = rectalCancerData?.additionalInfo?.postOperativeManagement?.trim() || 'N/A';
    checkPageBreak(lineSpacing + 18); // Header + content + spacing
    y = drawInlineLabelValue(
      `Post Operative Management: ${postOpManagement}`,
      margin,
      y,
      pageWidth - margin * 2,
    );
    y += 6; // Extra spacing
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    checkPageBreak(40); // Ensure space for signature block
    pdf.line(margin, y, pageWidth - margin, y);
    y += 18; // Slightly more spacing to move signature lower
    
    // Signature section with small spacing under separator
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Signature and Date on same line - Fixed alignment
    const signatureCol2X = pageCenter + 5; // Define proper position for date column
    pdf.setFont('helvetica', 'bold');
    pdf.text("Surgeon's Signature:", margin, y);
    pdf.text("Date & Time:", signatureCol2X, y);
    pdf.setFont('helvetica', 'normal');
    
    // Handle signature (if available) - Fixed field path
    if (rectalCancerData?.additionalInfo?.surgeonSignature) {
      if (rectalCancerData.additionalInfo.surgeonSignature.startsWith('data:image')) {
        try {
          // Calculate proper dimensions asynchronously
          const dimensions = await calculateSignatureDimensions(rectalCancerData.additionalInfo.surgeonSignature);
          
          pdf.addImage(
            rectalCancerData.additionalInfo.surgeonSignature, 
            'PNG', 
            margin + 45, 
            y - dimensions.height + 3, 
            dimensions.width, 
            dimensions.height
          );
        } catch (error) {
          console.error('Error adding signature image:', error);
          pdf.text('[Signature]', margin + 45, y);
        }
      } else {
        pdf.text(rectalCancerData.additionalInfo.surgeonSignature, margin + 45, y);
      }
    }
    
    // Add current date - Fixed alignment and format
    const currentDate = rectalCancerData?.additionalInfo?.dateTime 
      ? formatDateTimeDDMMYYYYWithDashes(rectalCancerData.additionalInfo.dateTime)
      : formatDateTimeDDMMYYYYWithDashes(new Date());
    
    // Calculate proper spacing for the date value
    const dateTimeLabelWidth = pdf.getTextWidth('Date & Time: ');
    pdf.text(currentDate, signatureCol2X + dateTimeLabelWidth, y);
    
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
