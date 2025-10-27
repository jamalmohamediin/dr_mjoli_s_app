import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateWithSuffix, formatReportDate, formatDateOnly, formatDateDDMMYYYY, formatDateTimeWithColon } from './dateFormatter';
import { getFullASAText } from './asaDescriptions';
import { mapNewStructureToOld } from './rectalCancerPdfGeneratorMappings';

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
      diagramCanvas = await createSurgicalDiagramCanvas(diagrams);
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
    pdf.text('RECTAL CANCER SURGERY REPORT', pageWidth / 2, y, { align: 'center' });
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
    
    // Row 1: Name and Patient ID
    let currentX = margin;
    const lineSpacing = 5; // Increased for better readability and spacing
    
    pdf.text(`Name: ${patientInfo?.name || patientName || ''}`, col1X, y);
    pdf.text(`Patient ID: ${patientInfo?.patientId || patientId || ''}`, col2X, y);
    y += lineSpacing;
    
    // Row 2: Date Of Birth, Age, Sex
    pdf.text(`Date Of Birth: ${patientInfo?.dateOfBirth ? formatDateOnly(patientInfo.dateOfBirth) : ''}`, col1X, y);
    pdf.text(`Age: ${patientInfo?.age || ''}`, col2X, y);
    const sexValue = patientInfo?.sex ? (patientInfo.sex === 'other' && patientInfo.sexOther ? patientInfo.sexOther : patientInfo.sex.charAt(0).toUpperCase() + patientInfo.sex.slice(1).toLowerCase()) : '';
    pdf.text(`Sex: ${sexValue}`, col3X, y);
    y += lineSpacing;
    
    // Row 3: Weight, Height, BMI
    pdf.text(`Weight: ${patientInfo?.weight || ''}`, col1X, y);
    pdf.text(`Height: ${patientInfo?.height || ''}`, col2X, y);
    pdf.text(`BMI: ${patientInfo?.bmi || ''}`, col3X, y);
    y += lineSpacing;
    
    // Row 4: ASA Score
    pdf.text(`ASA Score: ${patientInfo?.asaScore ? getFullASAText(patientInfo.asaScore) : ''}`, col1X, y);
    y += lineSpacing;
    
    // Row 5: ASA Notes (below ASA Score)
    pdf.text(`ASA Notes: ${patientInfo?.asaNotes || ''}`, col1X, y);
    y += 8;
    
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
    
    // Row 1: Surgeon, Assistant, Anaesthetist (perfectly aligned three columns)
    const surgeonText = rectalCancerData?.surgicalTeam?.surgeons?.filter(s => s.trim()).join(', ') || '';
    const assistantText = rectalCancerData?.surgicalTeam?.assistants?.filter(a => a.trim()).join(', ') || '';
    const anaesthetistText = rectalCancerData?.surgicalTeam?.anaesthetists?.filter(a => a.trim()).join(', ') || rectalCancerData?.surgicalTeam?.anaesthetist || '';
    
    pdf.text(`Surgeon: ${surgeonText}`, col1X, y);
    pdf.text(`Assistant: ${assistantText}`, col2X, y);
    pdf.text(`Anaesthetist: ${anaesthetistText}`, col3X, y);
    y += lineSpacing;
    
    // Row 2: Start Time, End Time, Total Duration (perfectly aligned three columns)
    const startTime = rectalCancerData?.procedureDetails?.startTime || '';
    const endTime = rectalCancerData?.procedureDetails?.endTime || '';
    const totalDuration = rectalCancerData?.procedureDetails?.duration ? `${rectalCancerData.procedureDetails.duration} minutes` : '';
    
    pdf.text(`Start Time: ${startTime}`, col1X, y);
    pdf.text(`End Time: ${endTime}`, col2X, y);
    pdf.text(`Total Duration: ${totalDuration}`, col3X, y);
    y += lineSpacing;
    
    // Row 3: Procedure Urgency under Start Time, Preoperative Imaging under End Time, and Neoadjuvant Treatment under Total Duration
    const procedureUrgency = rectalCancerData?.procedureDetails?.procedureUrgency || '';
    const imagingText = rectalCancerData?.procedureDetails?.preoperativeImaging?.map(imaging => 
      imaging === 'Other' && rectalCancerData.procedureDetails.preoperativeImagingOther 
        ? `Other: ${rectalCancerData.procedureDetails.preoperativeImagingOther}` 
        : imaging
    ).join(', ') || '';
    const neoadjuvantTreatment = rectalCancerData?.operationType?.neoadjuvantTreatment || '';
    
    pdf.text(`Procedure Urgency: ${procedureUrgency}`, col1X, y);
    pdf.text(`Preoperative Imaging: ${imagingText}`, col2X, y);
    pdf.text(`Neoadjuvant Treatment: ${neoadjuvantTreatment}`, col3X, y);
    y += 8;
    
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
    
    // RESTRUCTURED PROCEDURE DETAILS - Consistent two-column layout
    
    // Prepare all field values
    const operationDescription = rectalCancerData?.procedureDetails?.operationDescription || '';
    const primaryApproach = rectalCancerData?.surgicalApproach?.primaryApproach || '';
    const operationTypeText = rectalCancerData?.operationType?.type?.join(', ') || '';
    
    // Prepare conversion data
    const isConverted = primaryApproach?.toLowerCase().includes('converted') || 
                       primaryApproach?.toLowerCase().includes('conversion') ||
                       primaryApproach?.toLowerCase().includes('laparoscopic converted to open');
    const conversionReason = rectalCancerData?.surgicalApproach?.conversionReason?.join(', ') || '';
    const conversionOther = rectalCancerData?.surgicalApproach?.conversionReasonOther ? `, ${rectalCancerData.surgicalApproach.conversionReasonOther}` : '';
    const conversionText = isConverted ? `${conversionReason}${conversionOther}` : '';
    
    // Prepare rectum operation types
    const rectumOpsText = rectalCancerData?.operationType?.rectumOperationType?.join(', ') || '';
    const rectumOtherText = rectalCancerData?.operationType?.rectumOperationOther ? `, Other: ${rectalCancerData.operationType.rectumOperationOther}` : '';
    const rectumFullText = `${rectumOpsText}${rectumOtherText}`;
    const rectumOperationTypes = (rectumFullText && rectumFullText.trim() && rectumFullText.trim() !== ', Other: ') ? rectumFullText : '';
    
    // Prepare trocar number
    const isMinimallyInvasive = (primaryApproach?.toLowerCase().includes('laparoscopic') || 
                                primaryApproach?.toLowerCase().includes('robotic')) &&
                               !primaryApproach?.toLowerCase().includes('open');
    const trocarNumber = (isMinimallyInvasive || isConverted) ? (rectalCancerData?.surgicalApproach?.trocarNumber || '') : '';
    
    // Prepare other fields
    const pointsOfDifficulty = rectalCancerData?.operativeEvents?.pointsOfDifficulty?.join(', ') || '';
    const difficultyOther = rectalCancerData?.operativeEvents?.pointsOfDifficultyOther ? `, ${rectalCancerData.operativeEvents.pointsOfDifficultyOther}` : '';
    const pointsOfDifficultyText = `${pointsOfDifficulty}${difficultyOther}`;
    const pointsOfDifficultyFinal = (pointsOfDifficultyText && pointsOfDifficultyText.trim() && pointsOfDifficultyText.trim() !== ', ') ? pointsOfDifficultyText : '';
    
    const findings = rectalCancerData?.findings?.description || '';
    const intraOpEvents = rectalCancerData?.operativeEvents?.intraoperativeEvents?.join(', ') || '';
    const location = rectalCancerData?.findings?.location?.join(', ') || '';
    const mesorectalCompleteness = rectalCancerData?.findings?.mesorectalCompleteness || '';
    const completenessOfResection = rectalCancerData?.operationType?.resectionCompleteness || rectalCancerData?.findings?.completenessOfTumourResection || '';
    
    // Render in the requested structured format with proper two-column layout
    
    // REORDERED PROCEDURE DETAILS FIELDS AS REQUESTED:
    
    // Row 1: Findings (single column)
    if (findings) {
      pdf.text(`Findings: ${findings}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 2: Location (single column)
    if (location) {
      pdf.text(`Location: ${location}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 3: Mesorectal Completeness (single column)
    const mesorectalCompletenessStr = String(mesorectalCompleteness || '');
    if (mesorectalCompletenessStr && mesorectalCompletenessStr.trim()) {
      pdf.text(`Mesorectal Completeness: ${mesorectalCompletenessStr}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 4: Completeness of Tumour Resection (single column)
    const completenessOfResectionStr = String(completenessOfResection || '');
    if (completenessOfResectionStr && completenessOfResectionStr.trim()) {
      pdf.text(`Completeness of Tumour Resection: ${completenessOfResectionStr}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 5: Operation Description (single column)
    if (operationDescription) {
      pdf.text(`Operation Description: ${operationDescription}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 6: Operation Type (single column)
    if (operationTypeText) {
      pdf.text(`Operation Type: ${operationTypeText}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 7: Rectum Operation Types (single column)
    if (rectumOperationTypes) {
      pdf.text(`Rectum Operation Types: ${rectumOperationTypes}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 8: Primary Approach (single column)
    if (primaryApproach) {
      pdf.text(`Primary Approach: ${primaryApproach}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 9: Reason for Conversion (single column)
    if (isConverted && conversionText) {
      pdf.text(`Reason for Conversion: ${conversionText}`, col1X, y);
      y += lineSpacing;
    }
    
    // Row 10: Trocar Number (single column)
    if (trocarNumber) {
      pdf.text(`Trocar Number: ${trocarNumber}`, col1X, y);
      y += lineSpacing;
    }
    
    // RIGHT COLUMN: PORTS AND INCISIONS content (moved from later section)
    let portsY = procedureStartY + 6; // Start right after the title
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legend:', portsCol1X, portsY);
    portsY += 4;
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    
    // Define column positions for legend
    const legendCol1X = portsCol1X;
    const legendCol2X = portsCol1X + 40;
    
    // ROW 1: Ports and Ileostomy
    let legendRow1Y = portsY;
    
    // Ports icon (left side)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.line(legendCol1X, legendRow1Y, legendCol1X + 6, legendRow1Y);
    pdf.setFontSize(4);
    pdf.text('12mm', legendCol1X + 1, legendRow1Y - 0.5);
    pdf.setFontSize(6);
    pdf.text('Ports (with size)', legendCol1X + 8, legendRow1Y + 1);
    
    // Ileostomy icon (right side)
    pdf.setDrawColor(245, 158, 11); // Gold/Yellow
    pdf.setLineWidth(1);
    pdf.setLineDash([1.5, 1]);
    pdf.circle(legendCol2X + 3, legendRow1Y, 1.5, 'S');
    pdf.setLineDash([]);
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Ileostomy', legendCol2X + 6, legendRow1Y + 1);
    
    portsY += 4;
    
    // ROW 2: Incisions and Colostomy
    let legendRow2Y = portsY;
    
    // Incisions icon (left side)
    pdf.setDrawColor(139, 0, 0); // Dark red
    pdf.setLineWidth(1);
    pdf.setLineDash([2, 1.5]);
    pdf.line(legendCol1X, legendRow2Y, legendCol1X + 6, legendRow2Y);
    pdf.setLineDash([]);
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Incisions', legendCol1X + 8, legendRow2Y + 1);
    
    // Colostomy icon (right side)
    pdf.setDrawColor(22, 163, 74); // Green
    pdf.setLineWidth(1);
    pdf.circle(legendCol2X + 3, legendRow2Y, 1.5, 'S');
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Colostomy', legendCol2X + 6, legendRow2Y + 1);
    
    portsY += 6;
    
    // Diagram box
    const diagramWidth = 80;
    const diagramHeight = 60;
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
    
    // Coordinate Y position properly - make sure we're below both columns
    const diagramEndY = portsY + diagramHeight + 10;
    const procedureEndY = y;
    y = Math.max(diagramEndY, procedureEndY);
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // TWO COLUMN LAYOUT: MOBILIZATION AND RESECTION | RECONSTRUCTION
    // Use consistent column positioning with rest of document
    const mobilizationCol1X = col1X; // Same as established col1X
    const reconstructionCol2X = twoCol2X; // Same as established two-column position
    
    const startSectionY = y;
    let col1Y = y;
    let col2Y = y;
    
    // LEFT COLUMN: MOBILIZATION AND RESECTION - Dynamic rendering
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MOBILIZATION AND RESECTION', mobilizationCol1X, col1Y);
    col1Y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Apply strict conditional rendering to each field
    const extentMobilization = rectalCancerData?.mobilizationAndResection?.extentOfMobilization?.join(', ') || '';
    if (extentMobilization && extentMobilization.trim()) {
      pdf.text(`Extent of Mobilization: ${extentMobilization}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    // VESSEL LIGATION GROUP - Always show structure as requested
    const vesselLigation = rectalCancerData?.mobilizationAndResection?.vesselLigation?.join(', ') || '';
    const imvLigation = rectalCancerData?.mobilizationAndResection?.imvLigation || ''; // FIXED: correct field name
    const vesselHemostasis = rectalCancerData?.mobilizationAndResection?.hemostasisTechnique || [];
    const vesselHemostasisOther = rectalCancerData?.mobilizationAndResection?.hemostasisTechniqueOther || '';
    
    // Check if any vessel-related fields have content
    let vesselHemostasisText = '';
    if (Array.isArray(vesselHemostasis) && vesselHemostasis.length > 0) {
      vesselHemostasisText = vesselHemostasis.map(technique => 
        technique === 'Other' && vesselHemostasisOther ? `Other: ${vesselHemostasisOther}` : technique
      ).join(', ');
    }
    
    const hasAnyVesselContent = vesselLigation || imvLigation || vesselHemostasisText;
    
    if (hasAnyVesselContent) {
      // 1. Vessel Ligation (main field)
      pdf.text(`Vessel Ligation: ${vesselLigation || ''}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
      
      // 2. Inferior Mesenteric Vein Ligation (always show after Vessel Ligation)
      pdf.text(`Inferior Mesenteric Vein Ligation: ${imvLigation || ''}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
      
      // 3. Vessel Hemostasis Technique (always show after IMV Ligation)
      pdf.text(`Vessel Hemostasis Technique: ${vesselHemostasisText || ''}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    const lnd = rectalCancerData?.mobilizationAndResection?.lymphNodeDissection || '';
    const lndStr = String(lnd || '');
    if (lndStr && lndStr.trim()) {
      pdf.text(`Lymph Node Dissection (LND): ${lndStr}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    const proximalSite = rectalCancerData?.mobilizationAndResection?.proximalTransection || '';
    const proximalSiteStr = String(proximalSite || '');
    if (proximalSiteStr && proximalSiteStr.trim()) {
      pdf.text(`Proximal Transection Site: ${proximalSiteStr}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    const distalSite = rectalCancerData?.mobilizationAndResection?.distalTransection || '';
    const distalSiteStr = String(distalSite || '');
    if (distalSiteStr && distalSiteStr.trim()) {
      pdf.text(`Distal Transection Site: ${distalSiteStr}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    const analCanalTransection = rectalCancerData?.mobilizationAndResection?.analCanalTransection || '';
    const analCanalTransectionStr = String(analCanalTransection || '');
    if (analCanalTransectionStr && analCanalTransectionStr.trim()) {
      pdf.text(`Anal Canal Transection level: ${analCanalTransectionStr}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    const enBlocResection = rectalCancerData?.mobilizationAndResection?.enBlocResection?.join(', ') || '';
    if (enBlocResection && enBlocResection.trim()) {
      pdf.text(`Excised En-Bloc resection: ${enBlocResection}`, mobilizationCol1X, col1Y);
      col1Y += lineSpacing;
    }
    
    // RIGHT COLUMN: RECONSTRUCTION - Dynamic rendering
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECONSTRUCTION', reconstructionCol2X, col2Y);
    col2Y += 6;
    
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
    
    if (reconstructionTypeText && reconstructionTypeText.trim()) {
      pdf.text(`Reconstruction Type: ${reconstructionTypeText}`, reconstructionCol2X, col2Y);
      col2Y += lineSpacing;
    }
    
    if (hasAnastomosis) {
      const anastomosisSite = rectalCancerData?.reconstruction?.anastomosisDetails?.site || '';
      if (anastomosisSite && anastomosisSite.trim()) {
        pdf.text(`Site of Anastomosis: ${anastomosisSite}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      const configuration = rectalCancerData?.reconstruction?.anastomosisDetails?.configuration || '';
      if (configuration && configuration.trim()) {
        pdf.text(`Configuration: ${configuration}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      const technique = rectalCancerData?.reconstruction?.anastomosisDetails?.technique || '';
      if (technique && technique.trim()) {
        pdf.text(`Anastomotic Technique: ${technique}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      // Suture Material field (array with Other option)
      const sutureMaterial = rectalCancerData?.reconstruction?.anastomosisDetails?.sutureMaterial || [];
      const sutureMaterialOther = rectalCancerData?.reconstruction?.anastomosisDetails?.sutureMaterialOther || '';
      
      let sutureMaterialText = '';
      if (Array.isArray(sutureMaterial) && sutureMaterial.length > 0) {
        sutureMaterialText = sutureMaterial.map(material => 
          material === 'Other' && sutureMaterialOther ? `Other: ${sutureMaterialOther}` : material
        ).join(', ');
      }
      
      if (sutureMaterialText && sutureMaterialText.trim()) {
        pdf.text(`Suture Material: ${sutureMaterialText}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      // Show stapler sizes only if technique is "Stapled"
      const techniqueStr = String(technique || '').toLowerCase();
      const isStapledTechnique = techniqueStr.includes('stapled') || techniqueStr === 'stapled';
      if (isStapledTechnique) {
        // Linear stapler sizes (array) + optional Other text
        const linearSizes: string[] = rectalCancerData?.reconstruction?.anastomosisDetails?.linearStaplerSize || [];
        const linearOther: string = rectalCancerData?.reconstruction?.anastomosisDetails?.linearStaplerSizeOther || '';
        let linearDisplay = '';
        if (Array.isArray(linearSizes) && linearSizes.length > 0) {
          const mapped = linearSizes.map((s: string) => (s === 'Other' && linearOther ? `Other: ${linearOther}` : s));
          linearDisplay = mapped.join(', ');
        }
        if (linearDisplay && linearDisplay.trim()) {
          pdf.text(`Linear Stapler Sizes: ${linearDisplay}`, reconstructionCol2X, col2Y);
          col2Y += lineSpacing;
        }

        // Circular stapler sizes (array) + optional Other text
        const circularSizes: string[] = rectalCancerData?.reconstruction?.anastomosisDetails?.circularStaplerSize || [];
        const circularOther: string = rectalCancerData?.reconstruction?.anastomosisDetails?.circularStaplerSizeOther || '';
        let circularDisplay = '';
        if (Array.isArray(circularSizes) && circularSizes.length > 0) {
          const mapped = circularSizes.map((s: string) => (s === 'Other' && circularOther ? `Other: ${circularOther}` : s));
          circularDisplay = mapped.join(', ');
        }
        if (circularDisplay && circularDisplay.trim()) {
          pdf.text(`Circular Stapler Sizes: ${circularDisplay}`, reconstructionCol2X, col2Y);
          col2Y += lineSpacing;
        }
      }
      
      const anastomoticHeight = rectalCancerData?.reconstruction?.anastomosisDetails?.anastomoticHeight || '';
      const anastomoticHeightStr = String(anastomoticHeight || '');
      if (anastomoticHeightStr && anastomoticHeightStr.trim()) {
        pdf.text(`Anastomotic Height: ${anastomoticHeightStr}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      const doughnutAssessment = rectalCancerData?.reconstruction?.anastomosisDetails?.doughnutAssessment || '';
      const doughnutAssessmentStr = String(doughnutAssessment || '');
      if (doughnutAssessmentStr && doughnutAssessmentStr.trim()) {
        pdf.text(`Doughnut Assessment: ${doughnutAssessmentStr}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      const airLeakTest = rectalCancerData?.reconstruction?.anastomosisDetails?.airLeakTest || '';
      const airLeakTestStr = String(airLeakTest || '');
      if (airLeakTestStr && airLeakTestStr.trim()) {
        pdf.text(`Air Leak Test: ${airLeakTestStr}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      // ICG Test field - conditional rendering (from anastomoticTesting)
      const icgTest = rectalCancerData?.reconstruction?.anastomoticTesting?.icgTest || '';
      const icgTestStr = String(icgTest || '');
      if (icgTestStr && icgTestStr.trim()) {
        pdf.text(`Indocyanine Green (ICG) Test: ${icgTestStr}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
    }
    
    // Show stoma details if reconstruction type is specifically "Stoma"
    if (isStoma) {
      const stomaConfiguration = rectalCancerData?.reconstruction?.stomaDetails?.configuration || '';
      if (stomaConfiguration && stomaConfiguration.trim()) {
        pdf.text(`Stoma Configuration: ${stomaConfiguration}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
      
      // Add Reason for Stoma field
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
      
      if (reasonForStomaText && reasonForStomaText.trim()) {
        pdf.text(`Reason for Stoma: ${reasonForStomaText}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
    }
    
    // Handle "Other" reconstruction type details
    const hasOtherReconstruction = Array.isArray(reconstructionType) 
      ? reconstructionType.includes('Other') 
      : reconstructionType?.toLowerCase() === 'other';
    
    if (hasOtherReconstruction) {
      const reconstructionOther = rectalCancerData?.reconstruction?.reconstructionOther || '';
      if (reconstructionOther && reconstructionOther.trim()) {
        pdf.text(`Other Reconstruction Details: ${reconstructionOther}`, reconstructionCol2X, col2Y);
        col2Y += lineSpacing;
      }
    }
    
    // Move to next section after the two columns
    y = Math.max(col1Y, col2Y) + 10; // Increased spacing
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // Force page break for remaining sections to ensure they show
    checkPageBreak(200);
    
    // NEW RESTRUCTURED THREE-COLUMN LAYOUT: COMPLICATIONS | SPECIMEN | (empty third column)
    const comp1X = col1X;
    const comp2X = twoCol2X;
    const comp3X = pageWidth - margin - 65; // Third column position
    
    const newSectionStartY = y;
    let comp1Y = y;
    let comp2Y = y;
    let comp3Y = y;
    
    // COLUMN 1: COMPLICATIONS
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPLICATIONS', comp1X, comp1Y);
    comp1Y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Points of Difficulty
    if (pointsOfDifficultyFinal) {
      pdf.text(`Points of Difficulty: ${pointsOfDifficultyFinal}`, comp1X, comp1Y);
      comp1Y += lineSpacing;
    }
    
    // Intraoperative Events/Complications
    if (intraOpEvents) {
      pdf.text(`Intraoperative Events/Complications: ${intraOpEvents}`, comp1X, comp1Y);
      comp1Y += lineSpacing;
    }
    
    comp1Y += 6; // Space before CLOSURE
    
    // CLOSURE section (moved from later)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE', comp1X, comp1Y);
    comp1Y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Complete closure fields - always show labels for structure visibility
    const woundProtector = rectalCancerData?.operativeEvents?.woundProtector || '';
    pdf.text(`Wound Protector Used: ${woundProtector}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const drainInsertion = rectalCancerData?.operativeEvents?.drainInsertion || '';
    pdf.text(`Drain Insertion: ${drainInsertion}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    // Handle drain type display - show only selected types, not the additional details
    const drainTypes = rectalCancerData?.operativeEvents?.drainType || [];
    const drainTypeDisplay = Array.isArray(drainTypes) ? drainTypes.join(', ') : drainTypes;
    pdf.text(`Type of Drain: ${drainTypeDisplay}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const intraPeritoneal = rectalCancerData?.operativeEvents?.intraPeritonealPlacement || '';
    pdf.text(`Intra-Peritoneal Placement: ${intraPeritoneal}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const exitSite = Array.isArray(rectalCancerData?.operativeEvents?.drainExitSite) 
      ? rectalCancerData.operativeEvents.drainExitSite.join(', ') 
      : (rectalCancerData?.operativeEvents?.drainExitSite || '');
    pdf.text(`Exit Site: ${exitSite}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const fascialClosure = Array.isArray(rectalCancerData?.closure?.fascialClosure) 
      ? rectalCancerData.closure.fascialClosure.join(', ') 
      : (rectalCancerData?.closure?.fascialClosure || '');
    pdf.text(`Fascial Closure: ${fascialClosure}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const fascialMaterial = Array.isArray(rectalCancerData?.closure?.fascialClosureMaterial) 
      ? rectalCancerData.closure.fascialClosureMaterial.join(', ') 
      : (rectalCancerData?.closure?.fascialClosureMaterial || '');
    pdf.text(`Fascial Material Used: ${fascialMaterial}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const skinClosure = Array.isArray(rectalCancerData?.closure?.skinClosure) 
      ? rectalCancerData.closure.skinClosure.join(', ') 
      : (rectalCancerData?.closure?.skinClosure || '');
    pdf.text(`Skin Closure: ${skinClosure}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    const skinMaterial = Array.isArray(rectalCancerData?.closure?.skinClosureMaterial) 
      ? rectalCancerData.closure.skinClosureMaterial.join(', ') 
      : (rectalCancerData?.closure?.skinClosureMaterial || '');
    pdf.text(`Skin Material Used: ${skinMaterial}`, comp1X, comp1Y);
    comp1Y += lineSpacing;
    
    // COLUMN 2: SPECIMEN
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPECIMEN', comp2X, comp2Y);
    comp2Y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Specimen fields - always show labels for structure visibility
    const specimenExtraction = rectalCancerData?.operativeEvents?.specimenExtraction || '';
    pdf.text(`Specimen Extraction Site: ${specimenExtraction}`, comp2X, comp2Y);
    comp2Y += lineSpacing;
    
    const specimenSent = rectalCancerData?.operativeEvents?.specimenSentToLab || '';
    pdf.text(`Specimen Sent to Laboratory: ${specimenSent}`, comp2X, comp2Y);
    comp2Y += lineSpacing;
    
    const labName = rectalCancerData?.operativeEvents?.laboratoryName || '';
    pdf.text(`Specify Laboratory Sent to: ${labName}`, comp2X, comp2Y);
    comp2Y += lineSpacing;
    
    // Move to next section after the columns
    y = Math.max(comp1Y, comp2Y, comp3Y) + 10;
    
    // Force page break for final sections to ensure they show
    checkPageBreak(100);
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // NOTES and POST OPERATIVE MANAGEMENT side-by-side layout
    const notesStartY = y;
    const notesCol1X = margin;
    const notesCol2X = pageCenter + 2;
    let notesCol1Y = notesStartY;
    let notesCol2Y = notesStartY;
    
    // Left Column - NOTES Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', notesCol1X, notesCol1Y);
    notesCol1Y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const additionalNotes = rectalCancerData?.additionalInfo?.additionalInformation || '';
    pdf.text(`Additional Notes: ${additionalNotes}`, notesCol1X, notesCol1Y);
    notesCol1Y += lineSpacing;
    
    // Right Column - POST OPERATIVE MANAGEMENT Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POST OPERATIVE MANAGEMENT', notesCol2X, notesCol2Y);
    notesCol2Y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const postOpManagement = rectalCancerData?.additionalInfo?.postOperativeManagement || '';
    pdf.text(`Post Operative Management: ${postOpManagement}`, notesCol2X, notesCol2Y);
    notesCol2Y += lineSpacing;
    
    // Update Y position to max of both columns
    y = Math.max(notesCol1Y, notesCol2Y) + 10;
    
    // Force page break for signature section to ensure it shows
    if (!checkPageBreak(40)) {
      y += 15; // Add spacing only if staying on same page
    }
    
    // SURGEON'S SIGNATURE Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text("SURGEON'S SIGNATURE", margin, y);
    y += 15; // Increased spacing to avoid signature image hiding title
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Signature and Date on same line - Fixed alignment
    pdf.text("Surgeon's Signature:", margin, y);
    pdf.text("Date & Time:", notesCol2X, y);
    
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
      ? formatDateTimeWithColon(rectalCancerData.additionalInfo.dateTime)
      : formatDateTimeWithColon(new Date());
    
    // Calculate proper spacing for the date value
    const dateTimeLabelWidth = pdf.getTextWidth('Date & Time: ');
    pdf.text(currentDate, notesCol2X + dateTimeLabelWidth, y);
    
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
