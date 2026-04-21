import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateDDMMYYYYWithDashes, formatDateTimeDDMMYYYYWithDashes } from './dateFormatter';
import { getFullASAText } from './asaDescriptions';
import { formatPatientGender, formatPatientStickerDate, getPdfSafePatientInfo } from './patientSticker';
import { drawRectalStylePortsAndIncisions } from './pdfPortsAndIncisionsLayout';
import { getSurgicalDiagramMarkingMetrics } from './surgicalDiagramMarkings';

const APPENDECTOMY_DIAGRAM_MARKING_SCALE = 1.5;

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
    
    img.onerror = () => {
      console.warn('Failed to load signature image, using default dimensions');
      resolve({ width: 35, height: 12 });
    };
    
    img.src = imageDataUrl;
  });
};

// Function to create surgical diagram canvas with markings
const createSurgicalDiagramCanvas = async (markings: any[]): Promise<string | null> => {
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
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(APPENDECTOMY_DIAGRAM_MARKING_SCALE);
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

export const generateAppendectomyPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  appendectomyData: any
) => {
  try {
    console.log('=== GENERATING APPENDECTOMY PDF ===');
    console.log('Appendectomy data received:', appendectomyData);
    
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    let y = margin;
    let currentPage = 1;
    
    // Helper function to add footer to a page (removed - will add single footer at end)
    
    // Helper function to check page break
    const checkPageBreak = (neededSpace: number) => {
      const footerReserve = currentPage === 1 ? 12 : 60;
      if (y + neededSpace > pageHeight - footerReserve) {
        currentPage++;
        pdf.addPage();
        y = margin;
        return true;
      }
      return false;
    };
    
    // Helper function to draw section
    const drawSection = (title: string, content: () => void) => {
      checkPageBreak(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, y);
      y += 7;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      content();
    };
    
    // Helper function to format field labels with semi-bold (using bold) and values with normal weight
    const formatFieldLine = (label: string, value: string): string => {
      return `${label} ${value}`;
    };
    
    // Helper function to draw field line with semi-bold label
    const drawFieldLine = (label: string, value: string, x: number, currentY: number) => {
      if (!value || value === 'Not specified' || value === 'None') return currentY;
      
      // Draw label in bold (semi-bold effect)
      pdf.setFont('helvetica', 'bold');
      const labelWidth = pdf.getTextWidth(label);
      pdf.text(label, x, currentY);
      
      // Draw value in normal weight
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, x + labelWidth, currentY);
      
      return currentY + 4;
    };

    const getTextValue = (value: any) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => String(item || '').trim())
          .filter(Boolean)
          .join(', ');
      }

      return String(value || '').trim();
    };

    const hasPrintableValue = (value: any) => {
      const text = getTextValue(value);
      return text.length > 0 && text !== 'Not specified' && text !== 'None';
    };

    const formatSelectionList = (values: any, otherValue?: string) => {
      const items = Array.isArray(values)
        ? values.map((item) => String(item || '').trim()).filter(Boolean)
        : hasPrintableValue(values)
          ? [String(values).trim()]
          : [];

      return items
        .map((item) => (item === 'Other' && otherValue ? `Other: ${otherValue}` : item))
        .join(', ');
    };

    const drawSectionDivider = (spacingAfter: number = 6) => {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.1);
      pdf.line(margin, y, pageWidth - margin, y);
      y += spacingAfter;
    };

    const drawWrappedColumns = (
      columns: Array<{ text: string; x: number; width: number }>,
      lineHeight: number = 4,
      rowGap: number = 1.5,
    ) => {
      const visibleColumns = columns.filter((column) => hasPrintableValue(column.text));
      if (visibleColumns.length === 0) return;

      const lineGroups = columns.map((column) =>
        hasPrintableValue(column.text)
          ? (() => {
              const separatorIndex = column.text.indexOf(':');
              if (separatorIndex === -1) {
                return [
                  {
                    isLabelValue: false,
                    labelLines: [] as string[],
                    valueLines: pdf.splitTextToSize(column.text, column.width) as string[],
                    labelWidth: 0,
                  },
                ];
              }

              const labelText = `${column.text.slice(0, separatorIndex).trim()}:`;
              const valueText = column.text.slice(separatorIndex + 1).trim();
              const labelWidth = Math.min(36, Math.max(18, column.width * 0.42));
              const valueWidth = Math.max(12, column.width - labelWidth - 2);
              return [
                {
                  isLabelValue: true,
                  labelLines: pdf.splitTextToSize(labelText, labelWidth) as string[],
                  valueLines: pdf.splitTextToSize(valueText, valueWidth) as string[],
                  labelWidth,
                },
              ];
            })()
          : [],
      );
      const lineCount = Math.max(
        1,
        ...lineGroups.map((items) =>
          items.length > 0
            ? Math.max(
                items[0].labelLines?.length || 0,
                items[0].valueLines?.length || 0,
                1,
              )
            : 0,
        ),
      );

      checkPageBreak(lineCount * lineHeight + rowGap + 1);

      for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
        columns.forEach((column, columnIndex) => {
          const layout = lineGroups[columnIndex][0];
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
      if (!hasPrintableValue(text)) return;

      const separatorIndex = text.indexOf(':');
      if (separatorIndex === -1) {
        const lines = pdf.splitTextToSize(text, width);
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
      const labelLines = pdf.splitTextToSize(labelText, labelWidth);
      const valueLines = pdf.splitTextToSize(valueText, valueWidth);
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
    
    // CENTER COLUMN - Reserved for main title (removed duplicate)
    
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
    
    // Title will be placed after separator line
    
    // Set y position to after the header
    y = Math.max(y, headerStartY + 30, rightY) + 5;
    
    // Add separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Add title below separator line - centered, no underline
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('APPENDICECTOMY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 12;
    
    // PATIENT INFORMATION section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATIENT INFORMATION', margin, y);
    y += 6;
    
    const patientInfo = getPdfSafePatientInfo(appendectomyData?.patientInfo || {});
    const bodyFontSize = 8.5;
    const col1X = margin;
    const col2X = margin + 62;
    const col3X = margin + 124;
    const threeColumnWidth = 56;
    const fullWidth = pageWidth - margin * 2;

    const patientNameValue = getTextValue(patientInfo?.name || patientName);
    const patientIdValue = getTextValue(patientInfo?.patientId || patientId);
    const patientGender = formatPatientGender(patientInfo);
    const patientAge = getTextValue(patientInfo?.age);
    const patientDob = formatPatientStickerDate(patientInfo?.dateOfBirth);
    const patientAddress = getTextValue(patientInfo?.address);
    const patientWeight = getTextValue(patientInfo?.weight);
    const patientHeight = getTextValue(patientInfo?.height);
    const patientBmi = getTextValue(patientInfo?.bmi);
    const asaClassification = Array.isArray(patientInfo?.asaScore)
      ? patientInfo.asaScore.filter(Boolean).map((item: string) => getFullASAText(item)).join(', ')
      : hasPrintableValue(patientInfo?.asaScore)
        ? getFullASAText(patientInfo.asaScore)
        : '';

    const drawPatientSubsectionTitle = (title: string) => {
      checkPageBreak(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(title, margin, y);
      y += 4.5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(bodyFontSize);
    };

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(bodyFontSize);

    if (
      hasPrintableValue(patientNameValue) ||
      hasPrintableValue(patientGender) ||
      hasPrintableValue(patientAge) ||
      hasPrintableValue(patientIdValue) ||
      hasPrintableValue(patientDob) ||
      hasPrintableValue(patientAddress)
    ) {
      drawPatientSubsectionTitle('Patient Details');
      drawWrappedColumns([
        { text: `Patient Name: ${patientNameValue}`, x: col1X, width: threeColumnWidth },
        { text: `Gender: ${patientGender}`, x: col2X, width: threeColumnWidth },
        { text: `Age: ${patientAge}`, x: col3X, width: threeColumnWidth },
      ]);
      drawWrappedColumns([
        { text: `Patient ID: ${patientIdValue}`, x: col1X, width: threeColumnWidth },
        { text: `Date Of Birth: ${patientDob}`, x: col2X, width: threeColumnWidth },
        { text: `Address: ${patientAddress}`, x: col3X, width: threeColumnWidth },
      ]);
    }

    drawWrappedTextBlock(`ASA Physical Status Classification: ${asaClassification}`, margin, fullWidth);
    drawWrappedColumns([
      { text: `Weight: ${patientWeight}`, x: col1X, width: threeColumnWidth },
      { text: `Height: ${patientHeight}`, x: col2X, width: threeColumnWidth },
      { text: `BMI: ${patientBmi}`, x: col3X, width: threeColumnWidth },
    ]);

    drawSectionDivider();
    
    // PREOPERATIVE INFORMATION section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', margin, y);
    y += 6;
    
    const preop = appendectomyData?.preoperative || {};
    const surgeon = getTextValue(preop.surgeons?.filter((item: string) => item.trim()));
    const assistant = getTextValue(preop.assistants?.filter((item: string) => item.trim())) || preop.assistant1 || preop.assistant2 || '';
    const anaesthetist = getTextValue(preop.anaesthetists?.filter((item: string) => item.trim())) || preop.anaesthetist || '';
    const startTime = getTextValue(preop.startTime);
    const endTime = getTextValue(preop.endTime);
    const totalDuration = hasPrintableValue(preop.duration) ? `${preop.duration} minutes` : '';
    const procedureUrgency = formatSelectionList(preop.procedureUrgency);
    const imaging = formatSelectionList(preop.imaging, preop.imagingOther);
    const indication = formatSelectionList(preop.indication, preop.indicationOther);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(bodyFontSize);
    drawWrappedColumns([
      { text: `Surgeon: ${surgeon}`, x: col1X, width: threeColumnWidth },
      { text: `Assistant: ${assistant}`, x: col2X, width: threeColumnWidth },
      { text: `Anaesthetist: ${anaesthetist}`, x: col3X, width: threeColumnWidth },
    ]);
    drawWrappedColumns([
      { text: `Start Time: ${startTime}`, x: col1X, width: threeColumnWidth },
      { text: `End Time: ${endTime}`, x: col2X, width: threeColumnWidth },
      { text: `Total Duration: ${totalDuration}`, x: col3X, width: threeColumnWidth },
    ]);
    drawWrappedColumns([
      { text: `Procedure Urgency: ${procedureUrgency}`, x: col1X, width: threeColumnWidth },
      { text: `Preoperative Imaging: ${imaging}`, x: col2X, width: pageWidth - margin - col2X },
    ]);
    drawWrappedTextBlock(`Indication for Surgery: ${indication}`, margin, fullWidth);

    drawSectionDivider();
    
    const procedure = appendectomyData?.procedure || {};
    const intraop = appendectomyData?.intraoperative || {};
    
    // OPERATIVE FINDINGS Section (full width)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OPERATIVE FINDINGS', margin, y);
    y += 6;
    
    pdf.setFontSize(bodyFontSize);
    pdf.setFont('helvetica', 'normal');
    
    // Set up two-column layout for operative findings
    const opFindingsCol1X = margin;
    const opFindingsCol2X = margin + 96;

    // Row 1: Appendix Appearance and Presence of Abscess
    const appendixAppearance = formatSelectionList(intraop.appendixAppearance);
    const abscess = getTextValue(intraop.abscess);
    drawWrappedColumns([
      { text: `Appendix Appearance: ${appendixAppearance}`, x: opFindingsCol1X, width: 88 },
      { text: `Presence of Abscess: ${abscess}`, x: opFindingsCol2X, width: 88 },
    ]);

    // Row 2: Presence of Peritonitis and Other Intra-abdominal Findings
    const otherFindings = getTextValue(intraop.otherFindings);
    const peritonitis = formatSelectionList(intraop.peritonitis);
    drawWrappedColumns([
      { text: `Other Intra-abdominal Findings: ${otherFindings}`, x: opFindingsCol1X, width: 88 },
      { text: `Presence of Peritonitis: ${peritonitis}`, x: opFindingsCol2X, width: 88 },
    ]);
    
    drawSectionDivider(7);
    
    // Two-column layout: PROCEDURE DETAILS | PORTS AND INCISIONS
    const sectionStartY = y;
    const pageCenter = pageWidth / 2;
    const procedureX = margin;
    const diagramX = pageCenter + 2;
    const procedureColumnWidth = pageCenter - margin - 8;
    const diagramColumnWidth = pageWidth - margin - diagramX;
    
    // PROCEDURE DETAILS Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', procedureX, sectionStartY);
    
    // PORTS AND INCISIONS Section  
    pdf.text('PORTS AND INCISIONS', diagramX, sectionStartY);
    
    let procedureY = sectionStartY + 6.5;
    let diagramY = sectionStartY + 6.5;
    const diagramImageData = diagrams && diagrams.length > 0 ? await createSurgicalDiagramCanvas(diagrams) : null;
    
    // PROCEDURE DETAILS Content (Left Column)
    pdf.setFontSize(bodyFontSize);
    pdf.setFont('helvetica', 'normal');
    
    // Helper function to add content only if it exists and advance Y position with text wrapping
    const addContentLine = (text: string, spacing: number = 4.75) => {
      if (hasPrintableValue(text)) {
        const maxWidth = procedureColumnWidth - 2;
        const separatorIndex = text.indexOf(':');

        if (separatorIndex === -1) {
          const lines = pdf.splitTextToSize(text, maxWidth);
          lines.forEach((line: string) => {
            pdf.setFont('helvetica', 'normal');
            pdf.text(line, procedureX, procedureY);
            procedureY += 3.7;
          });
          procedureY += Math.max(0.8, spacing - 3.7);
          return true;
        }

        const labelText = `${text.slice(0, separatorIndex).trim()}:`;
        const valueText = text.slice(separatorIndex + 1).trim();
        const labelWidth = Math.min(34, Math.max(18, maxWidth * 0.42));
        const valueWidth = Math.max(14, maxWidth - labelWidth - 2);
        const labelLines = pdf.splitTextToSize(labelText, labelWidth);
        const valueLines = pdf.splitTextToSize(valueText, valueWidth);
        const lineCount = Math.max(labelLines.length, valueLines.length, 1);
        for (let index = 0; index < lineCount; index += 1) {
          if (labelLines[index]) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(labelLines[index], procedureX, procedureY);
          }
          if (valueLines[index]) {
            pdf.setFont('helvetica', 'normal');
            pdf.text(valueLines[index], procedureX + labelWidth + 2, procedureY);
          }
          procedureY += 3.7;
        }
        pdf.setFont('helvetica', 'normal');
        procedureY += Math.max(0.8, spacing - 3.7);
        return true;
      }
      return false;
    };
    
    // PROCEDURE DETAILS Content
    
    // Operation Description
    const operationDescription = getTextValue(procedure.operationDescription);
    addContentLine(`Operation Description: ${operationDescription}`);
    
    const surgicalApproach = formatSelectionList(procedure.approach);
    addContentLine(`Surgical Approach: ${surgicalApproach}`);
    
    // Conditional fields based on surgical approach - only render if they have content
    const isLaparoscopic = surgicalApproach.toLowerCase().includes('laparoscopic');
    const isOpen = surgicalApproach.toLowerCase().includes('open');
    const isConverted = surgicalApproach.toLowerCase().includes('converted from laparoscopic to open');
    
    // Show Reason for Conversion only when "Converted from Laparoscopic to Open" is selected
    if (isConverted) {
      const conversionReasonText = formatSelectionList(
        procedure.reasonForConversion || procedure.conversionReason,
        procedure.reasonForConversionOther,
      );
      addContentLine(`Reason for Conversion: ${conversionReasonText}`);
      addContentLine(`Trocar Number: ${getTextValue(procedure.trocarPlacement)}`);
    }
    
    if (isOpen && !isConverted) {
      const incisionType = formatSelectionList(procedure.incisionType, procedure.incisionOther);
      addContentLine(`Incision Type: ${incisionType}`);
    }
    
    if (isLaparoscopic && !isConverted) {
      addContentLine(`Trocar Number: ${getTextValue(procedure.trocarPlacement)}`);
    }
    
    const directionText = formatSelectionList(
      procedure.directionOfDissection,
      procedure.directionOfDissectionOther,
    );
    addContentLine(`Direction of Dissection: ${directionText}`);

    const mesoExcision = formatSelectionList(procedure.mesoAppendixExcision);
    addContentLine(`Meso-Appendix Excision: ${mesoExcision}`);

    const ligationMethod = formatSelectionList(procedure.divisionMethod, procedure.divisionOther);
    addContentLine(`Method of Appendiceal Ligation: ${ligationMethod}`);

    const vesselLigation = formatSelectionList(procedure.mesenteryControl, procedure.mesenteryOther);
    addContentLine(`Method of Appendiceal Vessel Ligation: ${vesselLigation}`);

    const removalText = formatSelectionList(
      procedure.removalOfAppendix,
      procedure.removalOfAppendixOther,
    );
    addContentLine(`Removal of Appendix: ${removalText}`);

    addContentLine(`Peritoneal Lavage: ${getTextValue(procedure.lavage)}`);

    const drainPlacement = getTextValue(procedure.drainPlacement);
    const drainText = drainPlacement + (hasPrintableValue(procedure.drainLocation) ? ` (${procedure.drainLocation})` : '');
    addContentLine(`Drain Placement: ${drainText}`, 5.5);
    
    // PORTS AND INCISIONS Content (Right Column)
    const { diagramBottomY } = drawRectalStylePortsAndIncisions({
      pdf,
      x: diagramX,
      y: diagramY,
      pageHeight,
      diagramCanvas: diagramImageData,
      fallbackLabel: 'APPENDICECTOMY DIAGRAM',
    });
    diagramY = diagramBottomY + 10;
    
    // Page 1 ends here
    y = Math.max(procedureY, diagramY) + 5;
    
    // Start Page 2 for remaining sections
    pdf.addPage();
    currentPage++;
    y = margin;
    
    // COMPLICATIONS Section (moved to page 2, above CLOSURE)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPLICATIONS', margin, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const difficulty = appendectomyData?.closure?.operativeDifficulty?.join(', ') || '';
    if (difficulty && difficulty.trim() && difficulty !== 'Not specified' && difficulty !== 'None') {
      drawWrappedTextBlock(`Intra-Operative Difficulty: ${difficulty}`, margin, fullWidth, 4, 2);
    }

    const complications = Array.isArray(appendectomyData?.closure?.complications)
      ? appendectomyData.closure.complications.join(', ')
      : appendectomyData?.closure?.complications || '';
    if (complications && complications.trim() && complications !== 'Not specified' && complications !== 'None') {
      drawWrappedTextBlock(`Intra-Operative Complications: ${complications}`, margin, fullWidth, 4, 2);
    }

    // Add separator line after COMPLICATIONS
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    // CLOSURE Section (full width with side-by-side layout)
    const closureSectionY = y;
    
    // CLOSURE Section Title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE', margin, closureSectionY);
    y += 8;
    
    // CLOSURE Content with side-by-side layout
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const closure = appendectomyData?.closure || {};
    
    // Set up two-column layout for closure fields
    const closureCol1X = margin;
    const closureCol2X = margin + 100;
    
    // Row 1: Fascial Closure and Skin Closure
    const fascialClosure = Array.isArray(closure.fascialClosure) ? closure.fascialClosure.join(', ') : closure.fascialClosure || '';
    const skinClosureField = Array.isArray(closure.skinClosure) ? closure.skinClosure.join(', ') : closure.skinClosure || '';
    
    drawWrappedColumns([
      {
        text:
          fascialClosure && fascialClosure.trim() && fascialClosure !== 'Not specified' && fascialClosure !== 'None'
            ? `Fascial Closure: ${fascialClosure}`
            : '',
        x: closureCol1X,
        width: 88,
      },
      {
        text:
          skinClosureField && skinClosureField.trim() && skinClosureField !== 'Not specified' && skinClosureField !== 'None'
            ? `Skin Closure: ${skinClosureField}`
            : '',
        x: closureCol2X,
        width: 88,
      },
    ], 4, 0);
    y += 6;
    
    // Row 2: Fascial Material Used and Skin Material Used
    const fascialMaterial = Array.isArray(closure.fascialMaterial) ? closure.fascialMaterial.join(', ') : closure.fascialMaterial || '';
    const skinMaterial = Array.isArray(closure.skinMaterial) ? closure.skinMaterial.join(', ') : closure.skinMaterial || '';
    
    drawWrappedColumns([
      {
        text:
          fascialMaterial && fascialMaterial.trim() && fascialMaterial !== 'Not specified' && fascialMaterial !== 'None'
            ? `Fascial Material Used: ${fascialMaterial}`
            : '',
        x: closureCol1X,
        width: 88,
      },
      {
        text:
          skinMaterial && skinMaterial.trim() && skinMaterial !== 'Not specified' && skinMaterial !== 'None'
            ? `Skin Material Used: ${skinMaterial}`
            : '',
        x: closureCol2X,
        width: 88,
      },
    ], 4, 0);
    y += 10;
    
    // Add separator line after CLOSURE
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // SPECIMEN Section (full width)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPECIMEN', margin, y);
    y += 8;
    
    // SPECIMEN Content
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Specimen Sent for Pathology
    const pathology = closure.pathology || '';
    if (pathology && pathology.trim() && pathology !== 'Not specified' && pathology !== 'None') {
      drawWrappedTextBlock(`Specimen Sent for Pathology: ${pathology}`, margin, fullWidth, 4, 2);
    }
    
    // Specify Laboratory Sent to
    const laboratory = closure.laboratoryName || '';
    if (laboratory && laboratory.trim() && laboratory !== 'Not specified' && laboratory !== 'None') {
      drawWrappedTextBlock(`Specify Laboratory Sent to: ${laboratory}`, margin, fullWidth, 4, 2);
    }
    
    // Other Specimens Taken
    const otherSpecimens = getTextValue(closure.otherSpecimens);
    const specimenDetails = getTextValue(closure.specimenDetails);
    const otherSpecimensDisplay =
      otherSpecimens === 'Yes' && hasPrintableValue(specimenDetails)
        ? `${otherSpecimens} - ${specimenDetails}`
        : otherSpecimens;
    if (hasPrintableValue(otherSpecimensDisplay)) {
      drawWrappedTextBlock(`Other Specimens Taken: ${otherSpecimensDisplay}`, margin, fullWidth, 4, 4);
    }
    
    // Add separator line after SPECIMEN
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // NOTES section (full width)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', margin, y);
    y += 8;
    
    // NOTES Content
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const additionalNotes = closure.additionalNotes || '';
    if (additionalNotes && additionalNotes.trim() && additionalNotes !== 'Not specified' && additionalNotes !== 'None') {
      drawWrappedTextBlock(`Additional Notes: ${additionalNotes}`, margin, fullWidth, 4, 6);
    }
    
    // Add separator line after NOTES
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // POST OPERATIVE MANAGEMENT section (full width)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POST OPERATIVE MANAGEMENT', margin, y);
    y += 8;
    
    // POST OPERATIVE MANAGEMENT Content
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const postOpManagement = closure.postOperativeManagement || '';
    if (postOpManagement && postOpManagement.trim() && postOpManagement !== 'Not specified' && postOpManagement !== 'None') {
      drawWrappedTextBlock(`Post Operative Management: ${postOpManagement}`, margin, fullWidth, 4, 6);
    }
    
    // Add separator line after POST OPERATIVE MANAGEMENT
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 15;
    
    // Signature Section
    const signatureY = y;
    
    // Two-column signature layout
    const signatureCol1X = margin;
    const signatureCol2X = margin + 100;
    
    // Surgeon's Signature
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Surgeon\'s Signature:', signatureCol1X, signatureY);
    
    // Date & Time
    pdf.text('Date & Time:', signatureCol2X, signatureY);
    pdf.setFont('helvetica', 'normal');
    
    // Add signature if available
    if (appendectomyData?.closure?.surgeonSignature) {
      if (appendectomyData.closure.surgeonSignature.startsWith('data:image')) {
        try {
          // Calculate proper dimensions asynchronously
          const dimensions = await calculateSignatureDimensions(appendectomyData.closure.surgeonSignature);
          
          pdf.addImage(
            appendectomyData.closure.surgeonSignature, 
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
        pdf.text(appendectomyData.closure.surgeonSignature, signatureCol1X + 40, signatureY);
      }
    }
    
    // Add date/time if available - positioned after "Date & Time:" label
    if (appendectomyData?.closure?.dateTime) {
      pdf.text(formatDateTimeDDMMYYYYWithDashes(appendectomyData.closure.dateTime), signatureCol2X + 25, signatureY);
    } else {
      pdf.text(formatDateTimeDDMMYYYYWithDashes(new Date()), signatureCol2X + 25, signatureY);
    }
    
    // Update y position to after signature section
    y = signatureY + 20;
    
    // Calculate total pages and add footer to each page properly
    const totalPages = pdf.internal.getNumberOfPages();
    
    const reportDate = formatDateDDMMYYYYWithDashes(new Date());
    
    // Add footer to each page
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      const footerY = pageHeight - 20;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      if (i === 1) {
        // Page 1 - no footer (moved to page 2)
      } else {
        // Page 2 and subsequent pages - full footer
        pdf.text('Dr. Monde Mjoli - Specialist Surgeon', pageWidth / 2, footerY, { align: 'center' });
        pdf.text('Practice Number: 0560812', pageWidth / 2, footerY + 4, { align: 'center' });
        pdf.text(`Report Date: ${reportDate} | Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });
      }
    }
    
    // Return to last page
    pdf.setPage(totalPages);
    
    return {
      success: true,
      blob: pdf.output('blob')
    };
    
  } catch (error) {
    console.error('Error generating appendectomy PDF:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
};

// For saving drafts
export const saveAppendectomyDraft = (appendectomyData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const draftData = {
      ...appendectomyData,
      savedAt: timestamp,
      isDraft: true
    };
    
    localStorage.setItem(`appendectomy_draft_${timestamp}`, JSON.stringify(draftData));
    
    // Keep only the last 5 drafts
    const drafts = Object.keys(localStorage)
      .filter(key => key.startsWith('appendectomy_draft_'))
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
    console.error('Error saving appendectomy draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to save draft'
    };
  }
};
