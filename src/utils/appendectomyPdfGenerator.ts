import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateWithSuffix, formatReportDate, formatDateOnly, formatDateDDMMYYYY, formatDateTimeWithColon } from './dateFormatter';
import { getFullASAText } from './asaDescriptions';

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
      if (y + neededSpace > pageHeight - 40) { // Leave space for footer
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
    pdf.setLineWidth(0.3);
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
    y += 8;
    
    const patientInfo = appendectomyData?.patientInfo || {};
    pdf.setFontSize(9);
    
    // Set up 3-column grid system
    const col1X = margin;
    const col2X = margin + 62;
    const col3X = margin + 124;
    
    // Row 1: Name, Patient ID
    const row1Y = y;
    const name = patientInfo.name || '';
    const patientIdValue = patientInfo.patientId || patientId || '';
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${name}`, col1X, row1Y);
    pdf.text(`Patient ID: ${patientIdValue}`, col2X, row1Y);
    y += 6;
    
    // Row 2: Date Of Birth, Age, Sex
    const row2Y = y;
    const dob = patientInfo.dateOfBirth ? formatDateOnly(patientInfo.dateOfBirth) : '';
    const age = patientInfo.age || '';
    const sex = patientInfo.sex ? (patientInfo.sex === 'other' && patientInfo.sexOther ? patientInfo.sexOther : patientInfo.sex.charAt(0).toUpperCase() + patientInfo.sex.slice(1).toLowerCase()) : '';
    
    pdf.text(`Date Of Birth: ${dob}`, col1X, row2Y);
    pdf.text(`Age: ${age}`, col2X, row2Y);
    pdf.text(`Sex: ${sex}`, col3X, row2Y);
    y += 6;
    
    // Row 3: Weight, Height, BMI
    const row3Y = y;
    const weight = patientInfo.weight ? `${patientInfo.weight} kg` : '';
    const height = patientInfo.height ? `${patientInfo.height} cm` : '';
    const bmi = patientInfo.bmi || '';
    
    pdf.text(`Weight: ${weight}`, col1X, row3Y);
    pdf.text(`Height: ${height}`, col2X, row3Y);
    pdf.text(`BMI: ${bmi}`, col3X, row3Y);
    y += 6;
    
    // Row 4: ASA Score
    const row4Y = y;
    const asaScore = patientInfo.asaScore ? getFullASAText(patientInfo.asaScore) : '';
    
    pdf.text(`ASA Score: ${asaScore}`, col1X, row4Y);
    y += 6;
    
    // Row 5: ASA Notes (below ASA Score)
    const row5Y = y;
    const asaNotes = patientInfo.asaNotes || '';
    
    pdf.text(`ASA Notes: ${asaNotes}`, col1X, row5Y);
    y += 8;
    
    // Add separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    // PREOPERATIVE INFORMATION section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', margin, y);
    y += 8;
    
    const preop = appendectomyData?.preoperative || {};
    pdf.setFontSize(9);
    
    // Row 1: Surgeon, Assistant, Anaesthetist
    const preRow1Y = y;
    const surgeon = preop.surgeons?.filter(s => s.trim()).join(', ') || '';
    const assistant = preop.assistants?.filter(a => a.trim()).join(', ') || preop.assistant1 || preop.assistant2 || '';
    const anaesthetist = preop.anaesthetists?.filter(a => a.trim()).join(', ') || preop.anaesthetist || '';
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Surgeon: ${surgeon}`, col1X, preRow1Y);
    pdf.text(`Assistant: ${assistant}`, col2X, preRow1Y);
    pdf.text(`Anaesthetist: ${anaesthetist}`, col3X, preRow1Y);
    y += 6;
    
    // Row 2: Start Time, End Time, Total Duration
    const preRow2Y = y;
    const startTime = preop.startTime || '';
    const endTime = preop.endTime || '';
    const totalDuration = preop.duration ? `${preop.duration} minutes` : '';
    
    pdf.text(`Start Time: ${startTime}`, col1X, preRow2Y);
    pdf.text(`End Time: ${endTime}`, col2X, preRow2Y);
    pdf.text(`Total Duration: ${totalDuration}`, col3X, preRow2Y);
    y += 6;
    
    // Row 3: Indication for Surgery (col1), Preoperative Imaging (col2) - same row
    const preRow3Y = y;
    const indication = preop.indication?.join(', ') || '';
    const imaging = preop.imaging?.join(', ') || '';
    
    pdf.text(`Indication for Surgery: ${indication}`, col1X, preRow3Y);
    pdf.text(`Preoperative Imaging: ${imaging}`, col2X, preRow3Y);
    y += 8;
    
    // Add separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    const procedure = appendectomyData?.procedure || {};
    const intraop = appendectomyData?.intraoperative || {};
    
    // Two-column layout: PROCEDURE DETAILS | PORTS AND INCISIONS
    const sectionStartY = y;
    const procedureColumnWidth = col2X + 20 - col1X; // Give more space to procedure column
    const diagramColumnWidth = pageWidth - margin - (col2X + 25); // Move diagram more to the right
    
    const procedureX = col1X;
    const diagramX = col2X + 25; // Move diagram further right
    
    // PROCEDURE DETAILS Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', procedureX, sectionStartY);
    
    // PORTS AND INCISIONS Section  
    pdf.text('PORTS AND INCISIONS', diagramX, sectionStartY);
    
    let procedureY = sectionStartY + 8;
    let diagramY = sectionStartY + 8;
    
    // PROCEDURE DETAILS Content (Left Column)
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Helper function to add content only if it exists and advance Y position
    const addContentLine = (text: string, spacing: number = 6) => {
      if (text && text.trim() && text !== 'Not specified' && text !== 'None') {
        pdf.text(text, procedureX, procedureY);
        procedureY += spacing;
        return true;
      }
      return false;
    };
    
    const addContentBlock = (label: string, value: string, spacing: number = 8) => {
      if (value && value.trim() && value !== 'Not specified' && value !== 'None') {
        pdf.text(label, procedureX, procedureY);
        pdf.text(value, procedureX, procedureY + 4);
        procedureY += spacing;
        return true;
      }
      return false;
    };
    
    // Operation Description
    const operationDescription = procedure.operationDescription || '';
    addContentLine(`Operation Description: ${operationDescription}`, 8);
    
    // Surgical Approach
    const surgicalApproach = procedure.approach?.join(', ') || '';
    addContentLine(`Surgical Approach: ${surgicalApproach}`, 6);
    
    // Conditional fields based on surgical approach - only render if they have content
    const isLaparoscopic = surgicalApproach.toLowerCase().includes('laparoscopic');
    const isOpen = surgicalApproach.toLowerCase().includes('open');
    const isConverted = surgicalApproach.toLowerCase().includes('converted from laparoscopic to open');
    
    // Show Reason for Conversion only when "Converted from Laparoscopic to Open" is selected
    if (isConverted) {
      // Handle reasonForConversion as array of strings
      let conversionReasons = [];
      const reasonForConversion = procedure.reasonForConversion || procedure.conversionReason;
      
      if (Array.isArray(reasonForConversion)) {
        conversionReasons = [...reasonForConversion];
      } else if (reasonForConversion) {
        conversionReasons = [reasonForConversion];
      }
      
      // Add custom "Other" reason if provided
      if (conversionReasons.includes('Other') && procedure.reasonForConversionOther) {
        // Replace "Other" with the custom text
        const otherIndex = conversionReasons.indexOf('Other');
        conversionReasons[otherIndex] = `Other: ${procedure.reasonForConversionOther}`;
      }
      
      const conversionReasonText = conversionReasons.join(', ');
      addContentLine(`Reason for Conversion: ${conversionReasonText}`, 6);
      
      // Show Trocar Number after Reason for Conversion when converted
      const trocarPlacement = procedure.trocarPlacement || '';
      addContentLine(`Trocar Number: ${trocarPlacement}`, 6);
    }
    
    if (isOpen && !isConverted) {
      // Show Incision Type for pure open approach
      const incisionType = procedure.incisionType?.join(', ') || '';
      addContentLine(`Incision Type: ${incisionType}`, 6);
    }
    
    if (isLaparoscopic && !isConverted) {
      // Show Trocar Number for pure laparoscopic
      const trocarPlacement = procedure.trocarPlacement || '';
      addContentLine(`Trocar Number: ${trocarPlacement}`, 6);
    }
    
    // Appendix Appearance
    const appendixAppearance = intraop.appendixAppearance?.join(', ') || '';
    addContentLine(`Appendix Appearance: ${appendixAppearance}`, 6);
    
    // Presence of Abscess
    const abscess = intraop.abscess || '';
    addContentLine(`Presence of Abscess: ${abscess}`, 6);
    
    // Presence of Peritonitis
    const peritonitis = intraop.peritonitis?.join(', ') || '';
    addContentLine(`Presence of Peritonitis: ${peritonitis}`, 6);
    
    // Other Intra-abdominal Findings
    const otherFindings = intraop.otherFindings || '';
    addContentLine(`Other Intra-abdominal Findings: ${otherFindings}`, 6);
    
    // Method of Appendiceal Ligation
    const ligationMethod = procedure.divisionMethod?.join(', ') || '';
    addContentLine(`Method of Appendiceal Ligation: ${ligationMethod}`, 6);
    
    // Method of Appendiceal Vessel Ligation
    const vesselLigation = procedure.mesenteryControl?.join(', ') || '';
    addContentLine(`Method of Appendiceal Vessel Ligation: ${vesselLigation}`, 6);
    
    // Peritoneal Lavage
    const lavage = procedure.lavage || '';
    addContentLine(`Peritoneal Lavage: ${lavage}`, 6);
    
    // Drain Placement
    const drainPlacement = procedure.drainPlacement || '';
    const drainText = drainPlacement + (procedure.drainLocation ? ` (${procedure.drainLocation})` : '');
    addContentLine(`Drain Placement: ${drainText}`, 6);
    
    // Intra-Operative Difficulty
    const difficulty = appendectomyData?.closure?.operativeDifficulty?.join(', ') || '';
    addContentLine(`Intra-Operative Difficulty: ${difficulty}`, 6);
    
    // Intra-Operative Complications
    const complications = Array.isArray(appendectomyData?.closure?.complications) 
      ? appendectomyData.closure.complications.join(', ') 
      : appendectomyData?.closure?.complications || '';
    addContentLine(`Intra-Operative Complications: ${complications}`, 6);
    
    // PORTS AND INCISIONS Content (Right Column)
    // Legend with visual indicators in two rows - smaller and neater icons
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Legend:', diagramX, diagramY);
    diagramY += 5;
    
    // Row 1: Ports and Ileostomy
    const legendCol1X = diagramX;
    const legendCol2X = diagramX + 45;
    
    // Ports legend with smaller visual indicator
    pdf.text('Ports (with size label)', legendCol1X + 6, diagramY);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.line(legendCol1X, diagramY - 1, legendCol1X + 4, diagramY - 1);
    pdf.setFontSize(4);
    pdf.text('5mm', legendCol1X + 0.5, diagramY - 2);
    pdf.setFontSize(8);
    
    // Ileostomy legend with smaller visual indicator
    pdf.text('Ileostomy (dashed yellow circle)', legendCol2X + 6, diagramY);
    pdf.setDrawColor(245, 158, 11); // Yellow/Gold color
    pdf.setLineWidth(0.8);
    pdf.setLineDash([1.5, 1]);
    pdf.circle(legendCol2X + 2, diagramY - 1, 1.5);
    pdf.setLineDash([]);
    
    diagramY += 5;
    
    // Row 2: Incisions and Colostomy
    // Incisions legend with smaller visual indicator
    pdf.text('Incisions (dashed dark red line)', legendCol1X + 6, diagramY);
    pdf.setDrawColor(139, 0, 0); // Dark red color
    pdf.setLineWidth(0.8);
    pdf.setLineDash([2, 1.5]);
    pdf.line(legendCol1X, diagramY - 1, legendCol1X + 4, diagramY - 1);
    pdf.setLineDash([]);
    
    // Colostomy legend with smaller visual indicator
    pdf.text('Colostomy (solid green circle)', legendCol2X + 6, diagramY);
    pdf.setDrawColor(22, 163, 74); // Green color
    pdf.setLineWidth(1.2);
    pdf.circle(legendCol2X + 2, diagramY - 1, 1.5);
    
    diagramY += 6;
    
    // Reset draw color
    pdf.setDrawColor(0, 0, 0);
    
    // Space before diagram
    diagramY += 2;
    
    // Draw diagram box - maintain proper aspect ratio for better quality
    const diagramBoxHeight = 55; // Increased slightly for better proportions
    pdf.setLineWidth(0.5);
    pdf.rect(diagramX, diagramY, diagramColumnWidth, diagramBoxHeight);
    
    // Add diagram if available
    if (diagrams && diagrams.length > 0) {
      const diagramImageData = await createSurgicalDiagramCanvas(diagrams);
      if (diagramImageData) {
        try {
          // Maintain aspect ratio to prevent vertical squishing
          const diagramPadding = 2;
          const availableWidth = diagramColumnWidth - (diagramPadding * 2);
          const availableHeight = diagramBoxHeight - (diagramPadding * 2);
          
          // Use square aspect ratio for appendectomy diagram to prevent distortion
          const diagramSize = Math.min(availableWidth, availableHeight);
          const centerX = diagramX + (diagramColumnWidth - diagramSize) / 2;
          const centerY = diagramY + (diagramBoxHeight - diagramSize) / 2;
          
          pdf.addImage(diagramImageData, 'PNG', centerX, centerY, diagramSize, diagramSize);
        } catch (error) {
          pdf.setFontSize(9);
          pdf.text('APPENDICECTOMY DIAGRAM', diagramX + diagramColumnWidth/2, diagramY + diagramBoxHeight/2 - 5, { align: 'center' });
          pdf.text('(LEAVE CURRENT Diagram Size', diagramX + diagramColumnWidth/2, diagramY + diagramBoxHeight/2, { align: 'center' });
          pdf.text('AS IT IS)', diagramX + diagramColumnWidth/2, diagramY + diagramBoxHeight/2 + 5, { align: 'center' });
        }
      }
    } else {
      pdf.setFontSize(9);
      pdf.text('APPENDICECTOMY DIAGRAM', diagramX + diagramColumnWidth/2, diagramY + diagramBoxHeight/2 - 5, { align: 'center' });
      pdf.text('(LEAVE CURRENT Diagram Size', diagramX + diagramColumnWidth/2, diagramY + diagramBoxHeight/2, { align: 'center' });
      pdf.text('AS IT IS)', diagramX + diagramColumnWidth/2, diagramY + diagramBoxHeight/2 + 5, { align: 'center' });
    }
    
    diagramY += diagramBoxHeight + 8;
    
    // Move y position to after both columns - Page 1 ends here
    y = Math.max(procedureY, diagramY) + 5;
    
    // Start Page 2 for CLOSURE and POST OPERATIVE MANAGEMENT
    pdf.addPage();
    currentPage++;
    y = margin;
    
    // Two-column layout: CLOSURE | NOTES
    const closureSectionY = y;
    const closureColX = col1X;
    const notesColX = col2X + 15;
    
    // CLOSURE Section (Left Column)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE', closureColX, closureSectionY);
    
    // NOTES Section (Right Column)
    pdf.text('NOTES', notesColX, closureSectionY);
    
    let closureY = closureSectionY + 8;
    let notesY = closureSectionY + 8;
    
    // CLOSURE Content (Left Column)
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const closure = appendectomyData?.closure || {};
    
    // Helper function for closure content
    const addClosureContentLine = (text: string, spacing: number = 6) => {
      if (text && text.trim() && text !== 'Not specified' && text !== 'None') {
        pdf.text(text, closureColX, closureY);
        closureY += spacing;
        return true;
      }
      return false;
    };
    
    const addNotesContentLine = (text: string, spacing: number = 6) => {
      if (text && text.trim() && text !== 'Not specified' && text !== 'None') {
        pdf.text(text, notesColX, notesY);
        notesY += spacing;
        return true;
      }
      return false;
    };
    
    const addNotesContentBlock = (label: string, value: string, spacing: number = 8) => {
      if (value && value.trim() && value !== 'Not specified' && value !== 'None') {
        pdf.text(label, notesColX, notesY);
        pdf.text(value, notesColX, notesY + 4);
        notesY += spacing;
        return true;
      }
      return false;
    };
    
    // Fascial Closure
    const fascialClosure = Array.isArray(closure.fascialClosure) ? closure.fascialClosure.join(', ') : closure.fascialClosure || '';
    addClosureContentLine(`Fascial Closure: ${fascialClosure}`, 6);
    
    // Fascial Material Used
    const fascialMaterial = Array.isArray(closure.fascialMaterial) ? closure.fascialMaterial.join(', ') : closure.fascialMaterial || '';
    addClosureContentLine(`Fascial Material Used: ${fascialMaterial}`, 6);
    
    // Skin Closure
    const skinClosureField = Array.isArray(closure.skinClosure) ? closure.skinClosure.join(', ') : closure.skinClosure || '';
    addClosureContentLine(`Skin Closure: ${skinClosureField}`, 6);
    
    // Skin Material Used
    const skinMaterial = Array.isArray(closure.skinMaterial) ? closure.skinMaterial.join(', ') : closure.skinMaterial || '';
    addClosureContentLine(`Skin Material Used: ${skinMaterial}`, 6);
    
    // Specimen Sent for Pathology
    const pathology = closure.pathology || '';
    addClosureContentLine(`Specimen Sent for Pathology: ${pathology}`, 6);
    
    // Specify Laboratory Sent to
    const laboratory = closure.laboratoryName || '';
    addClosureContentLine(`Specify Laboratory Sent to: ${laboratory}`, 6);
    
    // Other Specimens Taken
    const otherSpecimens = closure.otherSpecimens || '';
    addClosureContentLine(`Other Specimens Taken: ${otherSpecimens}`, 8);
    
    // NOTES Content (Right Column)
    // Additional Notes under NOTES section
    const additionalNotes = closure.additionalNotes || '';
    addNotesContentLine(`Additional Notes: ${additionalNotes}`, 10);
    
    // Add POST OPERATIVE MANAGEMENT as a subsection
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POST OPERATIVE MANAGEMENT', notesColX, notesY);
    notesY += 8;
    
    // Post Operative Management content
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const postOpManagement = closure.postOperativeManagement || '';
    addNotesContentBlock('Post Operative Management:', postOpManagement, 10);
    
    // Move y position to after both columns
    y = Math.max(closureY, notesY) + 15;
    
    // Signature Section - matching template format
    const signatureY = y + 5;
    const signatureLineWidth = 100;
    const dateTimeLineWidth = 100;
    const dateTimeX = pageWidth - margin - dateTimeLineWidth;
    
    // Surgeon's Signature
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Surgeon\'s Signature:', margin, signatureY);
    
    // Date & Time
    pdf.text('Date & Time:', dateTimeX - 5, signatureY);
    
    // Add signature if available
    if (appendectomyData?.closure?.surgeonSignature) {
      if (appendectomyData.closure.surgeonSignature.startsWith('data:image')) {
        try {
          // Calculate proper dimensions asynchronously
          const dimensions = await calculateSignatureDimensions(appendectomyData.closure.surgeonSignature);
          
          pdf.addImage(
            appendectomyData.closure.surgeonSignature, 
            'PNG', 
            margin + 40, 
            signatureY - dimensions.height + 3, 
            dimensions.width, 
            dimensions.height
          );
        } catch (error) {
          console.error('Error adding signature image:', error);
          pdf.text('[Signature]', margin + 40, signatureY);
        }
      } else {
        pdf.text(appendectomyData.closure.surgeonSignature, margin + 40, signatureY);
      }
    }
    
    // Add date/time if available
    if (appendectomyData?.closure?.dateTime) {
      pdf.text(formatDateTimeWithColon(appendectomyData.closure.dateTime), dateTimeX + 25, signatureY);
    } else {
      pdf.text(formatDateTimeWithColon(new Date()), dateTimeX + 25, signatureY);
    }
    
    y = signatureY + 15;
    
    // Calculate total pages and add footer to each page properly
    const totalPages = pdf.internal.getNumberOfPages();
    
    const currentDate = new Date();
    const day = currentDate.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const dateWithSuffix = `${day}${day === 1 || day === 21 || day === 31 ? 'st' : 
                            day === 2 || day === 22 ? 'nd' : 
                            day === 3 || day === 23 ? 'rd' : 'th'} ${month} ${year}`;
    
    // Add footer to each page
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      const footerY = pageHeight - 20;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      if (i === 1) {
        // Page 1 footer with practice info
        pdf.text('Dr. Monde Mjoli - Specialist Surgeon', pageWidth / 2, footerY, { align: 'center' });
        pdf.text('Practice Number: 0560812', pageWidth / 2, footerY + 4, { align: 'center' });
        pdf.text(`Report Date: ${dateWithSuffix} | Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });
      } else {
        // Subsequent pages - minimal footer
        pdf.text(`Report Date: ${dateWithSuffix} | Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 4, { align: 'center' });
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