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
    
    // Row 1: Name and Patient ID
    let currentX = margin;
    const lineSpacing = 5; // Increased for better readability and spacing
    
    pdf.text(`Name: ${patientInfo?.name || patientName || ''}`, col1X, y);
    pdf.text(`Patient ID: ${patientInfo?.patientId || patientId || ''}`, col2X, y);
    y += lineSpacing;
    
    // Row 2: Date Of Birth, Age, Sex
    pdf.text(`Date Of Birth: ${patientInfo?.dateOfBirth ? formatDateDDMMYYYY(patientInfo.dateOfBirth) : ''}`, col1X, y);
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
    const operationFindingsDescription = rectalCancerData?.operationType?.operationFindings || '';
    const operationFindingsOptions = rectalCancerData?.operationType?.operationFindingsOptions || [];
    const operationFindingsSelectionText = operationFindingsOptions
      .map((option: string) => {
        if (option === 'Other' && rectalCancerData?.operationType?.operationFindingsOther?.trim()) {
          return `Other: ${rectalCancerData.operationType.operationFindingsOther}`;
        }
        return option;
      })
      .join(', ');
    const operativeFindingsWidth = pageWidth - (margin * 2);
    const addOperativeFindingsField = (label: string, value: string) => {
      if (!value || !value.trim()) return;
      const lines = pdf.splitTextToSize(`${label}: ${value}`, operativeFindingsWidth);
      lines.forEach((line: string) => {
        pdf.text(line, col1X, y);
        y += lineSpacing;
      });
    };
    
    // Only show the operation findings fields if Colon or Rectum is selected
    if (isColonSelected || isRectumSelected) {
      addOperativeFindingsField('Operation Findings', operationFindingsSelectionText);
      addOperativeFindingsField('Description of Operation Findings', operationFindingsDescription);
    }
    
    // Row 2 & 3: Rectum-specific fields (conditional - only show when Rectum is selected)
    if (isRectumSelected) {
      // Row 2: Findings and Mesorectal Completeness (two columns)
      const findings = rectalCancerData?.findings?.description || '';
      const mesorectalCompleteness = rectalCancerData?.findings?.mesorectalCompleteness || '';
      
      pdf.text(`Findings: ${findings}`, col1X, y);
      pdf.text(`Mesorectal Completeness: ${mesorectalCompleteness}`, col2X, y);
      y += lineSpacing;
      
      // Row 3: Location and Completeness of Tumour Resection (two columns)
      const location = rectalCancerData?.findings?.location?.join(', ') || '';
      const completenessOfResection = rectalCancerData?.operationType?.resectionCompleteness || rectalCancerData?.findings?.completenessOfTumourResection || '';
      
      pdf.text(`Location: ${location}`, col1X, y);
      pdf.text(`Completeness of Tumour Resection: ${completenessOfResection}`, col2X, y);
      y += 8;
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
    const operationDescription = rectalCancerData?.procedureDetails?.operationDescription || '';
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
        const fullText = `${label}: ${value}`;
        const lines = pdf.splitTextToSize(fullText, procedureColumnWidth);
        lines.forEach((line: string) => {
          pdf.text(line, col1X, y);
          y += lineSpacing;
        });
      }
    };
    
    // NEW LAYOUT ORDER - PROCEDURE DETAILS SECTION
    // Row 1: Surgical Approach
    addProcedureField('Surgical Approach', primaryApproach);
    
    // Row 2: Reason for Conversion (only if converted)
    if (isConverted && conversionText) {
      addProcedureField('Reason for Conversion', conversionText);
    }
    
    // Row 3: Trocar Number
    addProcedureField('Trocar Number', trocarNumber);
    
    // Row 4: Operation Description
    addProcedureField('Operation Description', operationDescription);
    
    // Row 5: Operation Type
    addProcedureField('Operation Type', operationTypeText);
    
    // Row 6: Rectum Operation Types (only show if Rectum is selected)
    if (isRectumSelected) {
      addProcedureField('Rectum Operation Types', rectumOperationTypes);
    }
    
    // NEW LAYOUT - MOBILIZATION AND RESECTION section within PROCEDURE DETAILS
    y += 6;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MOBILIZATION AND RESECTION', col1X, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Mobilization and Resection fields
    const extentMobilizationList = rectalCancerData?.mobilizationAndResection?.extentOfMobilization || [];
    const extentMobilizationOther = rectalCancerData?.mobilizationAndResection?.extentOfMobilizationOther || '';
    let extentMobilizationText = '';
    if (Array.isArray(extentMobilizationList) && extentMobilizationList.length > 0) {
      const rendered = extentMobilizationList.map((item: string) => {
        if (item === 'Other' && extentMobilizationOther) {
          return `Other: ${extentMobilizationOther}`;
        }
        return item;
      });
      extentMobilizationText = rendered.join(', ');
    }
    addProcedureField('Extent of Mobilization', extentMobilizationText);
    
    // VESSEL LIGATION GROUP
    const vesselLigation = rectalCancerData?.mobilizationAndResection?.vesselLigation?.join(', ') || '';
    addProcedureField('Vessel Ligation', vesselLigation);
    
    const imvLigation = rectalCancerData?.mobilizationAndResection?.imvLigation || '';
    addProcedureField('Inferior Mesenteric Vein Ligation', imvLigation);
    
    const vesselHemostasis = rectalCancerData?.mobilizationAndResection?.hemostasisTechnique || [];
    const vesselHemostasisOther = rectalCancerData?.mobilizationAndResection?.hemostasisTechniqueOther || '';
    let vesselHemostasisText = '';
    if (Array.isArray(vesselHemostasis) && vesselHemostasis.length > 0) {
      vesselHemostasisText = vesselHemostasis.map(technique => 
        technique === 'Other' && vesselHemostasisOther ? `Other: ${vesselHemostasisOther}` : technique
      ).join(', ');
    }
    addProcedureField('Vessel Hemostasis Technique', vesselHemostasisText);
    
    const lnd = rectalCancerData?.mobilizationAndResection?.lymphNodeDissection || '';
    addProcedureField('Lymph Node Dissection (LND)', String(lnd || ''));
    
    const proximalSite = rectalCancerData?.mobilizationAndResection?.proximalTransection || '';
    addProcedureField('Proximal Transection Site', String(proximalSite || ''));
    
    const distalSite = rectalCancerData?.mobilizationAndResection?.distalTransection || [];
    let distalSiteStr = '';
    if (Array.isArray(distalSite)) {
      distalSiteStr = distalSite.join(', ');
    } else {
      distalSiteStr = String(distalSite || '');
    }
    addProcedureField('Distal Transection Site', distalSiteStr);
    
    // Anal Canal Transection Level (only show if "Anal Canal" is selected in Distal Transection Site)
    const isAnalCanalSelected = Array.isArray(distalSite) 
      ? distalSite.some(site => site && site.toLowerCase().includes('anal canal'))
      : String(distalSite || '').toLowerCase().includes('anal canal');
    
    if (isAnalCanalSelected) {
      const analCanalTransection = rectalCancerData?.mobilizationAndResection?.analCanalTransection || [];
      const analCanalTransectionOther = rectalCancerData?.mobilizationAndResection?.analCanalTransectionOther || '';
      let analCanalTransectionStr = '';
      if (Array.isArray(analCanalTransection) && analCanalTransection.length > 0) {
        analCanalTransectionStr = analCanalTransection.map(level => 
          level === 'Other' && analCanalTransectionOther 
            ? `Other: ${analCanalTransectionOther}` 
            : level
        ).join(', ');
      }
      addProcedureField('Anal Canal Transection Level', analCanalTransectionStr);
    }
    
    const enBlocResection = rectalCancerData?.mobilizationAndResection?.enBlocResection?.join(', ') || '';
    addProcedureField('Excised En-Bloc Resection', enBlocResection);
    
    // Skip RECONSTRUCTION section here - it will be moved to next page
    y += 6; // Just add some spacing
    
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
    
    // All sections moved to new page - skip original sections
    
    // Force page break before RECONSTRUCTION
    pdf.addPage();
    y = margin + 10;
    
    // RECONSTRUCTION Section on new page
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
    pdf.text(`Reconstruction Type: ${reconstructionTypeText}`, reconCol1X, reconCol1Y);
    reconCol1Y += lineSpacing;
    
    // Anastomosis fields (only show if "Anastomosis" is selected)
    if (hasAnastomosis) {
      // Site of Anastomosis
      const anastomosisSite = rectalCancerData?.reconstruction?.anastomosisDetails?.site || '';
      pdf.text(`Site of Anastomosis: ${anastomosisSite}`, reconCol1X, reconCol1Y);
      reconCol1Y += lineSpacing;
      
      // Configuration
      const configuration = rectalCancerData?.reconstruction?.anastomosisDetails?.configuration || '';
      pdf.text(`Configuration: ${configuration}`, reconCol1X, reconCol1Y);
      reconCol1Y += lineSpacing;
      
      // Anastomotic Technique
      const technique = rectalCancerData?.reconstruction?.anastomosisDetails?.technique || '';
      pdf.text(`Anastomotic Technique: ${technique}`, reconCol1X, reconCol1Y);
      reconCol1Y += lineSpacing;
      
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
        
        // Use text wrapping for suture material to prevent overlap
        const sutureMaterialFullText = `Suture Material: ${sutureMaterialText}`;
        const sutureMaterialLines = pdf.splitTextToSize(sutureMaterialFullText, reconCol1Width);
        sutureMaterialLines.forEach((line: string) => {
          pdf.text(line, reconCol1X, reconCol1Y);
          reconCol1Y += lineSpacing;
        });
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
      pdf.text(`Linear Stapler Sizes: ${linearDisplay}`, reconCol2X, reconCol2Y);
      reconCol2Y += lineSpacing;

      // Circular stapler sizes
      const circularSizes: string[] = rectalCancerData?.reconstruction?.anastomosisDetails?.circularStaplerSize || [];
      const circularOther: string = rectalCancerData?.reconstruction?.anastomosisDetails?.circularStaplerSizeOther || '';
      let circularDisplay = '';
      if (Array.isArray(circularSizes) && circularSizes.length > 0) {
        circularDisplay = circularSizes.map((s: string) => (s === 'Other' && circularOther ? `Other: ${circularOther}` : s)).join(', ');
      }
      pdf.text(`Circular Stapler Sizes: ${circularDisplay}`, reconCol2X, reconCol2Y);
      reconCol2Y += lineSpacing;
      
      // Anastomotic Height
      const anastomoticHeight = rectalCancerData?.reconstruction?.anastomosisDetails?.anastomoticHeight || '';
      const anastomoticHeightDisplay = anastomoticHeight && String(anastomoticHeight).trim() ? anastomoticHeight : 'N/A';
      pdf.text(`Anastomotic Height: ${anastomoticHeightDisplay}`, reconCol2X, reconCol2Y);
      reconCol2Y += lineSpacing;
      
      // Doughnut Assessment
      const doughnutAssessment = rectalCancerData?.reconstruction?.anastomosisDetails?.doughnutAssessment || '';
      const doughnutAssessmentDisplay = doughnutAssessment && String(doughnutAssessment).trim() ? doughnutAssessment : 'N/A';
      pdf.text(`Doughnut Assessment: ${doughnutAssessmentDisplay}`, reconCol2X, reconCol2Y);
      reconCol2Y += lineSpacing;
      
      // Air Leak Test
      const airLeakTest = rectalCancerData?.reconstruction?.anastomosisDetails?.airLeakTest || '';
      const airLeakTestDisplay = airLeakTest && String(airLeakTest).trim() ? airLeakTest : 'N/A';
        pdf.text(`Air Leak Test: ${airLeakTestDisplay}`, reconCol2X, reconCol2Y);
        reconCol2Y += lineSpacing;
      }
    }
    
    // COLUMN 3 - ICG Test and Stoma details (conditional)
    // ICG Test field (only show if "Anastomosis" is selected)
    if (hasAnastomosis) {
      const icgTest = rectalCancerData?.reconstruction?.anastomoticTesting?.icgTest || '';
      pdf.text(`Indocyanine Green (ICG) Test: ${icgTest}`, reconCol3X, reconCol3Y);
      reconCol3Y += lineSpacing;
    }
    
    // Stoma details (only show if "Stoma" is selected)
    if (isStoma) {
      // Stoma Configuration
      const stomaConfiguration = rectalCancerData?.reconstruction?.stomaDetails?.configuration || '';
      pdf.text(`Stoma Configuration: ${stomaConfiguration}`, reconCol3X, reconCol3Y);
      reconCol3Y += lineSpacing;
      
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
      
      pdf.text(`Reason for Stoma: ${reasonForStomaText}`, reconCol3X, reconCol3Y);
      reconCol3Y += lineSpacing;
    }
    
    // Handle "Other" reconstruction type details
    const hasOtherReconstruction = Array.isArray(reconstructionType) 
      ? reconstructionType.includes('Other') 
      : reconstructionType?.toLowerCase() === 'other';
    
    if (hasOtherReconstruction) {
      const reconstructionOther = rectalCancerData?.reconstruction?.reconstructionOther || '';
      if (reconstructionOther) {
        pdf.text(`Other Reconstruction Details: ${reconstructionOther}`, reconCol1X, reconCol1Y);
        reconCol1Y += lineSpacing;
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
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Closure fields
    const woundProtector = rectalCancerData?.operativeEvents?.woundProtector || '';
    pdf.text(`Wound Protector Used: ${woundProtector}`, margin, y);
    y += lineSpacing;
    
    const drainInsertion = rectalCancerData?.operativeEvents?.drainInsertion || '';
    pdf.text(`Drain Insertion: ${drainInsertion}`, margin, y);
    y += lineSpacing;
    
    const drainTypes = rectalCancerData?.operativeEvents?.drainType || [];
    let drainTypeDisplay = '';
    if (Array.isArray(drainTypes) && drainTypes.length > 0) {
      const validDrainTypes = drainTypes.filter(type => 
        type === 'Open' || 
        type === 'Closed Suction Drain' || 
        type === 'Closed Passive Drain'
      );
      drainTypeDisplay = validDrainTypes.join(', ');
    }
    pdf.text(`Type of Drain: ${drainTypeDisplay}`, margin, y);
    y += lineSpacing;
    
    const intraPeritoneal = rectalCancerData?.operativeEvents?.intraPeritonealPlacement || '';
    pdf.text(`Intra-Peritoneal Placement: ${intraPeritoneal}`, margin, y);
    y += lineSpacing;
    
    const exitSite = Array.isArray(rectalCancerData?.operativeEvents?.drainExitSite) 
      ? rectalCancerData.operativeEvents.drainExitSite.join(', ') 
      : (rectalCancerData?.operativeEvents?.drainExitSite || '');
    pdf.text(`Exit Site: ${exitSite}`, margin, y);
    y += lineSpacing;
    
    const fascialClosure = Array.isArray(rectalCancerData?.closure?.fascialClosure) 
      ? rectalCancerData.closure.fascialClosure.join(', ') 
      : (rectalCancerData?.closure?.fascialClosure || '');
    // Only show Fascial Closure if user has selected something
    if (fascialClosure && fascialClosure.trim()) {
      pdf.text(`Fascial Closure: ${fascialClosure}`, margin, y);
      y += lineSpacing;
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
      pdf.text(`Fascial Material Used: ${fascialMaterial}`, margin, y);
      y += lineSpacing;
    }
    
    const skinClosure = Array.isArray(rectalCancerData?.closure?.skinClosure) 
      ? rectalCancerData.closure.skinClosure.join(', ') 
      : (rectalCancerData?.closure?.skinClosure || '');
    // Only show Skin Closure if user has selected something
    if (skinClosure && skinClosure.trim()) {
      pdf.text(`Skin Closure: ${skinClosure}`, margin, y);
      y += lineSpacing;
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
      pdf.text(`Skin Material Used: ${skinMaterial}`, margin, y);
      y += lineSpacing;
    }
    y += 8;
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // COMPLICATIONS Section (moved here after CLOSURE)
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
    
    pdf.text(`Points of Difficulty: ${pointsOfDifficultyFinal}`, margin, y);
    y += lineSpacing;
    
    // Intraoperative Events/Complications
    const intraOpEvents = rectalCancerData?.operativeEvents?.intraoperativeEvents?.join(', ') || '';
    const intraOpEventsFinal = (intraOpEvents && intraOpEvents.trim()) ? intraOpEvents : 'N/A';
    pdf.text(`Intraoperative Events/Complications: ${intraOpEventsFinal}`, margin, y);
    y += lineSpacing;
    y += 6;
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // SPECIMEN Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPECIMEN', margin, y);
    y += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Specimen Extraction Site
    const specimenExtractionSite = rectalCancerData?.operativeEvents?.specimenExtraction || '';
    const specimenExtractionSiteFinal = (specimenExtractionSite && specimenExtractionSite.trim()) ? specimenExtractionSite : 'N/A';
    pdf.text(`Specimen Extraction Site: ${specimenExtractionSiteFinal}`, margin, y);
    y += lineSpacing;
    
    // Specimen Sent to Laboratory
    const specimenSentToLab = rectalCancerData?.operativeEvents?.specimenSentToLab || '';
    const specimenSentToLabFinal = (specimenSentToLab && specimenSentToLab.trim()) ? specimenSentToLab : 'N/A';
    pdf.text(`Specimen Sent to Laboratory: ${specimenSentToLabFinal}`, margin, y);
    y += lineSpacing;
    
    // Specify Laboratory Sent to
    const laboratoryName = rectalCancerData?.operativeEvents?.laboratoryName || '';
    const laboratoryNameFinal = (laboratoryName && laboratoryName.trim()) ? laboratoryName : 'N/A';
    pdf.text(`Specify Laboratory Sent to: ${laboratoryNameFinal}`, margin, y);
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
    
    pdf.text(additionalNotesLines, margin, y);
    y += additionalNotesLines.length * lineSpacing;
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
    const postOpManagementLines = pdf.splitTextToSize(
      `Post Operative Management: ${postOpManagement}`,
      pageWidth - (margin * 2)
    );
    checkPageBreak(postOpManagementLines.length * lineSpacing + 18); // Header + content + spacing
    pdf.text(postOpManagementLines, margin, y);
    y += postOpManagementLines.length * lineSpacing;
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
    pdf.text("Surgeon's Signature:", margin, y);
    pdf.text("Date & Time:", signatureCol2X, y);
    
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
