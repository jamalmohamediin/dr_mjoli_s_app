import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateWithSuffix, formatReportDate, formatDateOnly, formatDateDDMMYYYY, formatDateTimeWithColon } from './dateFormatter';
import { getFullASAText } from './asaDescriptions';

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
          // Draw port marking: black line with size label (smaller)
          ctx.save();
          ctx.font = 'bold 10px Arial';  // Reduced from 14px
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(marking.size, marking.x, marking.y - 3);

          ctx.beginPath();
          ctx.moveTo(marking.x - 10, marking.y);  // Reduced from 15
          ctx.lineTo(marking.x + 10, marking.y);   // Reduced from 15
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;  // Reduced from 4
          ctx.stroke();
          ctx.restore();
        } else if (marking.type === 'stoma') {
          // Draw stoma marking (same size for both types)
          ctx.save();
          if (marking.stomaType === 'ileostomy') {
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f59e0b'; // Gold/Yellow
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Dashed line
            ctx.stroke();
          } else { // colostomy - same size as ileostomy
            ctx.beginPath();
            ctx.arc(marking.x, marking.y, 15, 0, 2 * Math.PI);  // Changed from 25 to 15
            ctx.strokeStyle = '#16a34a'; // Green
            ctx.lineWidth = 3;  // Reduced from 4
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

// Helper function to render label and value with different font weights
const renderLabelValue = (pdf: any, label: string, value: string, x: number, y: number, maxWidth: number) => {
  // Render label in semi-bold
  pdf.setFont('helvetica', 'bold');
  pdf.text(label + ':', x, y);
  
  // Calculate the width of the label to position the value
  const labelWidth = pdf.getTextWidth(label + ': ');
  
  // Render value in normal weight
  pdf.setFont('helvetica', 'normal');
  
  // Handle text wrapping if the total width exceeds maxWidth
  const remainingWidth = maxWidth - labelWidth;
  const splitValue = pdf.splitTextToSize(value, remainingWidth);
  
  let currentY = y;
  splitValue.forEach((line: string, index: number) => {
    if (index === 0) {
      // First line goes on the same line as the label
      pdf.text(line, x + labelWidth, currentY);
    } else {
      // Subsequent lines start from the next line, indented
      currentY += 5;
      pdf.text(line, x + labelWidth, currentY);
    }
  });
  
  return currentY + 5; // Return next Y position
};

export const generateVentralHerniaPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  ventralHerniaData: any
) => {
  try {
    console.log('=== GENERATING VENTRAL HERNIA PDF ===');
    console.log('Ventral hernia data received:', ventralHerniaData);
    console.log('Operative data:', ventralHerniaData?.operative);
    console.log('Procedure data:', ventralHerniaData?.procedure);
    console.log('Closure data:', ventralHerniaData?.closure);
    console.log('PostOperative data:', ventralHerniaData?.postOperative);
    
    // Debug specific missing fields
    console.log('=== DETAILED DEBUGGING OF ALL FIELDS ===');
    console.log('Full ventralHerniaData structure:', JSON.stringify(ventralHerniaData, null, 2));
    console.log('=== OPERATIVE SECTION ===');
    console.log('operative:', ventralHerniaData?.operative);
    console.log('herniaType:', ventralHerniaData?.operative?.herniaType);
    console.log('herniaSite:', ventralHerniaData?.operative?.herniaSite);
    console.log('herniaDefects:', ventralHerniaData?.operative?.herniaDefects);
    console.log('numberOfDefects:', ventralHerniaData?.operative?.numberOfDefects);
    console.log('contents:', ventralHerniaData?.operative?.contents);
    console.log('strangulation:', ventralHerniaData?.operative?.strangulation);
    console.log('=== PROCEDURE SECTION ===');
    console.log('procedure:', ventralHerniaData?.procedure);
    console.log('dissection:', ventralHerniaData?.procedure?.dissection);
    console.log('repairType:', ventralHerniaData?.procedure?.repairType);
    console.log('additionalNotes:', ventralHerniaData?.procedure?.additionalNotes);
    console.log('postOperativeManagement:', ventralHerniaData?.procedure?.postOperativeManagement);
    
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    let y = margin;
    let currentPage = 1;
    
    // Column positions for two-column layouts - consistent alignment
    const pageCenter = pageWidth / 2;
    const leftColumnX = margin;
    const rightColumnX = pageCenter + 2; // Consistent with imaginary center line
    const columnWidth = (pageWidth / 2) - margin - 10; // Width for each column
    let leftColumnY = y;
    let rightColumnY = y;
    
    // Helper function to add footer to a page
    const addFooter = (pageNum: number) => {
      const footerY = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const footerDate = new Date();
      const footerDateStr = formatReportDate(footerDate);
      
      const footerText = `Dr. Monde Mjoli - Specialist Surgeon\nPractice Number: 0560812\nReport Date: ${footerDateStr} | Page ${pageNum} of {{totalPages}}`;
      const footerLines = footerText.split('\n');
      
      footerLines.forEach((line, index) => {
        pdf.text(line, pageWidth / 2, footerY + (index * 3), { align: 'center' });
      });
    };
    
    // Add footer to first page
    addFooter(currentPage);
    
    // Helper function to check page break
    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - 30) { // Leave more space for footer
        currentPage++;
        pdf.addPage();
        addFooter(currentPage);
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
    
    // HEADER - Exact template format
    const headerStartY = y;
    
    // Row 1: Dr. Monde Mjoli
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dr. Monde Mjoli', margin, y);
    pdf.text("St. Dominic's Medical Suites B", pageWidth - margin, y, { align: 'right' });
    y += 5; // +1 spacing
    
    // Row 2: Specialist Surgeon
    pdf.setFontSize(9);
    pdf.text('Specialist Surgeon', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('56 St James Road, Southernwood', pageWidth - margin, y, { align: 'right' });
    y += 4.5; // +1 spacing
    
    // Row 3: Qualifications
    pdf.setFontSize(8);
    pdf.text('MBChB (UNITRA), MMed (UKZN), FCS(SA),', margin, y);
    pdf.text('East London, 5201', pageWidth - margin, y, { align: 'right' });
    y += 4; // +1 spacing
    
    // Row 4: More qualifications
    pdf.text('Cert Gastroenterology, Surg (SA)', margin, y);
    pdf.text('Tel: 043 743 7872', pageWidth - margin, y, { align: 'right' });
    y += 4; // +1 spacing
    
    // Row 5: Practice number
    pdf.text('Practice No. 0560812', margin, y);
    pdf.text('Fax: 043 743 6653', pageWidth - margin, y, { align: 'right' });
    y += 4; // +1 spacing
    
    // Row 6: Cell number
    pdf.text('Cell: 082 417 2630', margin, y);
    y += 6; // +1 spacing
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // VENTRAL HERNIA REPORT title centered
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VENTRAL HERNIA REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // PATIENT INFORMATION Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATIENT INFORMATION', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const patientInfo = ventralHerniaData?.patientInfo || {};
    
    // Row 1: Name, Patient ID, Sex - aligned in three columns
    const name = patientInfo.name || patientName || '';
    const id = patientInfo.patientId || patientId || '';
    const sex = patientInfo.sex ? (patientInfo.sex.toLowerCase() === 'other' && patientInfo.sexOther ? patientInfo.sexOther : patientInfo.sex.charAt(0).toUpperCase() + patientInfo.sex.slice(1).toLowerCase()) : '';
    
    const patientCol1X = margin;
    const patientCol2X = margin + 70;
    const patientCol3X = margin + 140;
    
    pdf.text(`Name: ${name}`, patientCol1X, y);
    pdf.text(`Patient ID: ${id}`, patientCol2X, y);
    pdf.text(`Sex: ${sex}`, patientCol3X, y);
    y += 4.5; // +1 spacing
    
    // Row 2: Date of Birth, Age, empty - aligned in three columns  
    const dob = patientInfo.dateOfBirth ? formatDateOnly(patientInfo.dateOfBirth) : '';
    const age = patientInfo.age || '';
    
    pdf.text(`Date Of Birth: ${dob}`, patientCol1X, y);
    pdf.text(`Age: ${age}`, patientCol2X, y);
    y += 4.5; // +1 spacing
    
    // Row 3: Weight, Height, BMI - properly aligned in three columns
    const weight = patientInfo.weight || '';
    const height = patientInfo.height || '';
    const bmi = patientInfo.bmi || '';
    
    pdf.text(`Weight: ${weight}`, patientCol1X, y);
    pdf.text(`Height: ${height}`, patientCol2X, y);
    pdf.text(`BMI: ${bmi}`, patientCol3X, y);
    y += 4.5; // +1 spacing
    
    // Row 4: ASA Score
    const asaText = patientInfo.asaScore ? getFullASAText(patientInfo.asaScore) : '';
    
    pdf.text(`ASA Score: ${asaText}`, margin, y);
    y += 4.5; // +1 spacing
    
    // Row 5: ASA Notes (below ASA Score)
    const asaNotes = patientInfo.asaNotes || '';
    
    if (asaNotes) {
      pdf.text(`ASA Notes: ${asaNotes}`, margin, y);
      y += 4.5; // +1 spacing
    }
    
    y += 2; // +1 spacing before next section
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // PREOPERATIVE INFORMATION Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const preop = ventralHerniaData?.preoperative || {};
    
    // Row 1: Surgeon, Assistant, Anaesthetist - properly aligned in three columns
    const surgeon = preop.surgeons?.filter(s => s.trim()).join(', ') || '';
    const assistant = preop.assistants?.filter(s => s.trim()).join(', ') || '';
    const anaesthetist = preop.anaesthetists?.filter(a => a.trim()).join(', ') || preop.anaesthetist || '';
    
    // Use same column positions as patient info for consistency
    pdf.text(`Surgeon: ${surgeon}`, patientCol1X, y);
    pdf.text(`Assistant: ${assistant}`, patientCol2X, y);
    pdf.text(`Anaesthetist: ${anaesthetist}`, patientCol3X, y);
    y += 4.5; // +1 spacing
    
    // Row 2: Start Time, End Time, Total Duration - properly aligned in three columns
    const startTime = preop.startTime || '';
    const endTime = preop.endTime || '';
    const totalDuration = preop.duration ? `${preop.duration} minutes` : '';
    
    if (startTime || endTime || totalDuration) {
      pdf.text(`Start Time: ${startTime}`, patientCol1X, y);
      pdf.text(`End Time: ${endTime}`, patientCol2X, y);
      pdf.text(`Total Duration: ${totalDuration}`, patientCol3X, y);
      y += 4.5; // +1 spacing
    }
    
    // Row 3: Indication for Surgery
    let indicationText = '';
    if (preop.indication?.length > 0) {
      indicationText = preop.indication.map((ind) => {
        if (ind === 'Other' && preop.indicationOther) {
          return `Other: ${preop.indicationOther}`;
        }
        return ind;
      }).join(', ');
    }
    
    pdf.text(`Indication for Surgery: ${indicationText}`, margin, y);
    y += 4.5; // +1 spacing
    
    // Row 4: Preoperative Imaging (this field exists in the form structure)
    let imagingText = '';
    if (preop.imaging?.length > 0) {
      imagingText = preop.imaging.map((img) => {
        if (img === 'Other' && preop.imagingOther) {
          return `Other: ${preop.imagingOther}`;
        }
        return img;
      }).join(', ');
    }
    
    if (imagingText) {
      pdf.text(`Preoperative Imaging: ${imagingText}`, margin, y);
      y += 4.5; // +1 spacing
    }
    
    y += 2; // +1 spacing before next section
    
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // PROCEDURE DETAILS
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const operative = ventralHerniaData?.operative || {};
    const procedure = ventralHerniaData?.procedure || {};
    
    // Two-column layout for procedure details - proper alignment
    const leftColX = margin;
    const rightColX = pageCenter + 2; // Align with imaginary center line
    let leftY = y;
    let rightY = y;
    
    // LEFT COLUMN
    // Define all variables first - UPDATED to match new form data structure
    const operationDescription = operative.operationDescription || ''; // Now exists in form structure
    
    let approachText = '';
    if (operative.approach?.length > 0) {
      approachText = operative.approach.map((approach) => {
        if (approach === 'Other' && operative.approachOther) {
          return `Other: ${operative.approachOther}`;
        }
        return approach;
      }).join(', ');
    }
    
    const closureTechnique = procedure.closureTechnique?.map((tech) => {
      if (tech === 'Other' && procedure.closureTechniqueOther) {
        return `Other: ${procedure.closureTechniqueOther}`;
      }
      return tech;
    }).join(', ') || '';
    const materialUsed = procedure.closureMaterial?.map((material) => {
      if (material === 'Other' && procedure.closureMaterialOther) {
        return `Other: ${procedure.closureMaterialOther}`;
      }
      return material;
    }).join(', ') || ''; // Fixed field name
    const incisionType = ''; // This field doesn't exist in the form structure
    const repairType = procedure.repairType || operative.repairType || '';
    
    const primaryRepair = procedure.primaryRepair?.map((repair) => {
      if (repair === 'Other' && procedure.primaryRepairOther) {
        return `Other: ${procedure.primaryRepairOther}`;
      }
      return repair;
    }).join(', ') || '';
    
    const herniaTypes = (operative.herniaType || procedure.herniaType)?.map(type => 
      type === 'Other' && (operative.herniaTypeOther || procedure.herniaTypeOther) ? (operative.herniaTypeOther || procedure.herniaTypeOther) : type
    ).join(', ') || '';
    
    const meshPlacement = procedure.meshType?.map((type) => {
      if (type === 'Other' && procedure.meshPlacementOther) {
        return procedure.meshPlacementOther;
      }
      return type;
    }).join(', ') || '';
    
    const herniaSites = (operative.herniaSite || procedure.herniaSite)?.map(site => 
      site === 'Other' && (operative.herniaSiteOther || procedure.herniaSiteOther) ? (operative.herniaSiteOther || procedure.herniaSiteOther) : site
    ).join(', ') || '';
    
    const meshMaterials = procedure.meshMaterial?.map((material) => {
      if (material === 'Other' && procedure.meshMaterialOther) {
        return procedure.meshMaterialOther;
      }
      return material;
    }).join(', ') || '';
    
    const herniaDefects = operative.herniaDefects || procedure.herniaDefects || '';
    const meshSize = (procedure.meshLength || procedure.meshWidth || operative.meshLength || operative.meshWidth) ? 
      `${procedure.meshLength || operative.meshLength || '___'} x ${procedure.meshWidth || operative.meshWidth || '___'} cm` : '';
    
    const numberOfDefects = operative.numberOfDefects || ''; // May have been added
    
    const fixation = procedure.fixation?.map(fix => 
      fix === 'Other' && procedure.fixationOther ? procedure.fixationOther : fix
    ).join(', ') || '';
    
    const contents = (operative.contents || procedure.contents)?.map(content => 
      content === 'Other' && (operative.contentsOther || procedure.contentsOther) ? (operative.contentsOther || procedure.contentsOther) : content
    ).join(', ') || ''; // May have been added
    
    const strangulation = operative.strangulation || procedure.strangulation || '';
    
    const difficulty = procedure.intraOperativeDifficulty?.map((diff) => {
      if (diff === 'Other' && procedure.intraOperativeDifficultyOther) {
        return procedure.intraOperativeDifficultyOther;
      }
      return diff;
    }).join(', ') || '';
    
    const complications = procedure.complications?.map((comp) => {
      if (comp === 'Other' && procedure.complicationOther) {
        return procedure.complicationOther;
      }
      return comp;
    }).join(', ') || '';
    
    // Conditional logic
    const isConverted = operative.approach?.includes('Laparoscopic Converted To Open');
    const isOpenApproach = operative.approach?.includes('Open');
    const isLaparoscopic = operative.approach?.some(approach => 
      ['Laparoscopic Repair', 'Robotic Repair'].includes(approach));
    
    // Dynamic layout - only show rows with content, eliminate blank spaces
    const rowHeight = 4.5; // +1 spacing for consistency
    let currentRowY = y;
    
    // Helper function to add a row only if at least one field has content
    const addRowIfHasContent = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
      if (leftValue || rightValue) {
        // Only add text if there's actually content
        if (leftLabel && leftValue) {
          pdf.text(`${leftLabel}: ${leftValue}`, leftColX, currentRowY);
        } else if (leftValue) {
          pdf.text(leftValue, leftColX, currentRowY);
        }
        
        if (rightLabel && rightValue) {
          pdf.text(`${rightLabel}: ${rightValue}`, rightColX, currentRowY);
        } else if (rightValue) {
          pdf.text(rightValue, rightColX, currentRowY);
        }
        
        currentRowY += rowHeight;
      }
    };
    
    // Helper function to add single-column row only if has content
    const addSingleRowIfHasContent = (label: string, value: string) => {
      if (value) {
        pdf.text(`${label}: ${value}`, leftColX, currentRowY);
        currentRowY += rowHeight;
      }
    };
    
    // Get conversion reason text
    const conversionReasonText = operative.conversionReason?.length > 0 ? 
      operative.conversionReason.map(reason => {
        if (reason === 'Other' && operative.conversionReasonOther) {
          return `Other: ${operative.conversionReasonOther}`;
        }
        return reason;
      }).join(', ') : '';
    
    const trocarNumber = operative.trocarNumber || '';
    
    // Get the new procedure fields
    const sacExcised = procedure.sacExcised || '';
    const fatDissected = procedure.fatDissected || '';
    const defectClosed = procedure.defectClosed || '';
    
    // Dynamic rows - only show when filled
    addRowIfHasContent('Operation Description', operationDescription, 'Sac Excised', sacExcised);
    addRowIfHasContent('Pre-peritoneal Fat Dissected Off Sheath', fatDissected, 'Hernia Defect Closed', defectClosed);
    addRowIfHasContent('Surgical Approach', approachText, 'Closure Technique', closureTechnique);
    addRowIfHasContent('Reason for Conversion', conversionReasonText, 'Material Used', materialUsed);
    addRowIfHasContent('Trocar Number', trocarNumber, 'Repair Type', repairType);
    // Smart grouping to avoid gaps - group all the fields that might have conditional right-side content
    const fieldPairs = [
      { leftLabel: 'Hernia Type', leftValue: herniaTypes, rightLabel: 'Primary Tissue Repair', rightValue: primaryRepair, showRight: repairType === 'Primary Suture Closure (Non-Mesh)' },
      { leftLabel: 'Site of Hernia', leftValue: herniaSites, rightLabel: 'Mesh Placement', rightValue: meshPlacement, showRight: repairType === 'Mesh Repair' },
      { leftLabel: 'Total Hernia Defect Size', leftValue: herniaDefects, rightLabel: 'Mesh Material', rightValue: meshMaterials, showRight: repairType === 'Mesh Repair' },
      { leftLabel: 'Number of Defects', leftValue: numberOfDefects, rightLabel: 'Mesh Size', rightValue: meshSize, showRight: repairType === 'Mesh Repair' },
      { leftLabel: 'Contents', leftValue: contents, rightLabel: 'Fixation', rightValue: fixation, showRight: repairType === 'Mesh Repair' }
    ];
    
    // Process each field pair intelligently
    fieldPairs.forEach(pair => {
      const leftContent = pair.leftValue;
      const rightContent = pair.showRight ? pair.rightValue : '';
      const rightLabel = pair.showRight ? pair.rightLabel : '';
      
      // Only create row if there's actually content to show
      if (leftContent || rightContent) {
        addRowIfHasContent(pair.leftLabel, leftContent, rightLabel, rightContent);
      }
    });
    
    // Single column fields (spanning full width) - only show when filled
    addSingleRowIfHasContent('Strangulation/Ischaemia', strangulation);
    addSingleRowIfHasContent('If Recurrent Hernia. Does Patient have a Mesh in Situ?', operative.meshInSitu || '');
    addSingleRowIfHasContent('Intra-Operative Difficulty', difficulty);
    addSingleRowIfHasContent('Intraoperative Complications', complications);
    
    y = currentRowY + 3;
    
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // Two-column layout for PORTS AND INCISIONS & CLOSURE - OPTIMIZED FOR PAGE ONE
    // Removed page break check to ensure it fits on page one
    
    const col1Width = 85;  // Reduced width for better fit
    const col2Width = 85;  // Reduced width for better fit
    const colGap = 2;
    
    const col1X = margin;
    const col2X = pageCenter + 2; // Align with imaginary center line for consistency
    
    // Column headers - more compact
    pdf.setFontSize(10); // Reduced font size
    pdf.setFont('helvetica', 'bold');
    pdf.text('PORTS AND INCISIONS', col1X, y);
    pdf.text('CLOSURE', col2X, y);
    y += 4; // Reduced spacing
    
    let col1Y = y;
    let col2Y = y;
    
    // COLUMN 1: Legend and Diagram
    // Legend section - ULTRA-COMPACT for page one fitting
    pdf.setFontSize(7); // Smaller font
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legend:', col1X, col1Y);
    col1Y += 2; // Reduced spacing
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6); // Even smaller font
    
    // ROW 1 of legend
    const legendLeftX = col1X;
    const legendRightX = col1X + 45; // Half width for two columns
    
    // Ports icon (left side) - smaller and neater
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.line(legendLeftX + 2, col1Y, legendLeftX + 6, col1Y);
    pdf.setFontSize(4);
    pdf.text('5mm', legendLeftX + 2.5, col1Y - 1);
    pdf.setFontSize(7);
    pdf.text('Ports (with size label)', legendLeftX + 9, col1Y + 1);
    
    // Ileostomy icon (right side) - smaller and neater
    pdf.setDrawColor(245, 158, 11); // Gold/Yellow
    pdf.setLineWidth(1);
    pdf.setLineDash([1.5, 1]);
    pdf.circle(legendRightX + 3, col1Y, 1.5, 'S');
    pdf.setLineDash([]);
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Ileostomy (dashed yellow circle)', legendRightX + 7, col1Y + 1);
    
    col1Y += 2; // Reduced spacing
    
    // ROW 2 of legend
    // Incisions icon (left side) - smaller and neater
    pdf.setDrawColor(139, 0, 0); // Dark red
    pdf.setLineWidth(1);
    pdf.setLineDash([2, 1.5]);
    pdf.line(legendLeftX + 2, col1Y, legendLeftX + 6, col1Y);
    pdf.setLineDash([]);
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Incisions (dashed dark red line)', legendLeftX + 9, col1Y + 1);
    
    // Colostomy icon (right side) - smaller and neater
    pdf.setDrawColor(22, 163, 74); // Green
    pdf.setLineWidth(1);
    pdf.circle(legendRightX + 3, col1Y, 1.5, 'S');
    pdf.setDrawColor(0, 0, 0);
    pdf.text('Colostomy (solid green circle)', legendRightX + 7, col1Y + 1);
    
    col1Y += 2.5; // Reduced spacing
    
    // Diagram box - OPTIMIZED for page one fitting
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    const diagramBoxHeight = 45; // Further optimized for page one
    pdf.rect(col1X, col1Y, col1Width - 5, diagramBoxHeight);
    
    // Diagram content - larger and properly sized
    if (diagrams && diagrams.length > 0) {
      // Render the actual diagram
      const diagramImageData = await createSurgicalDiagramCanvas(diagrams);
      if (diagramImageData) {
        try {
          // Get image properties to preserve aspect ratio
          const imgProperties = pdf.getImageProperties(diagramImageData);
          const imgWidth = imgProperties.width;
          const imgHeight = imgProperties.height;
          const aspectRatio = imgWidth / imgHeight;
          
          // Available space for diagram
          const maxWidth = col1Width - 8;
          const maxHeight = diagramBoxHeight - 8;
          
          // Calculate optimal size while preserving aspect ratio
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / aspectRatio;
          
          // If calculated height exceeds available space, scale based on height instead
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * aspectRatio;
          }
          
          // Center the diagram in the available space
          const centerX = col1X + (maxWidth - finalWidth) / 2 + 4;
          const centerY = col1Y + (maxHeight - finalHeight) / 2 + 4;
          
          pdf.addImage(diagramImageData, 'PNG', centerX, centerY, finalWidth, finalHeight);
        } catch (error) {
          console.error('Error adding surgical diagram to PDF:', error);
          pdf.setFontSize(8);
          pdf.text('VENTRAL HERNIA DIAGRAM', col1X + 25, col1Y + 35);
          pdf.text('(LEAVE CURRENT Diagram Size', col1X + 20, col1Y + 42);
          pdf.text('AS IT IS)', col1X + 30, col1Y + 48);
        }
      }
    } else {
      pdf.setFontSize(8);
      pdf.text('VENTRAL HERNIA DIAGRAM', col1X + 25, col1Y + 35);
      pdf.text('(LEAVE CURRENT Diagram Size', col1X + 20, col1Y + 42);
      pdf.text('AS IT IS)', col1X + 30, col1Y + 48);
    }
    
    col1Y += diagramBoxHeight + 3;
    
    // COLUMN 2: Closure - OPTIMIZED for page one fitting
    pdf.setFontSize(8); // Reduced font size
    pdf.setFont('helvetica', 'normal');
    
    // Helper function for closure section to save space
    const addClosureItemIfHasContent = (label: string, value: string) => {
      if (value) {
        pdf.text(`${label}: ${value}`, col2X, col2Y);
        col2Y += 4.5; // +1 spacing for consistency
      }
    };
    
    const haemostasis = procedure.haemostasis || '';
    addClosureItemIfHasContent('Haemostasis', haemostasis);
    
    let drainText = procedure.drain || '';
    if (procedure.drain === 'Yes' && procedure.drainDetails) {
      drainText += ` - ${procedure.drainDetails}`;
    }
    addClosureItemIfHasContent('Drain', drainText);
    
    const fascialClosure = procedure.fascialClosure?.length > 0 ? 
      procedure.fascialClosure.map((closure) => {
        if (closure === 'Other' && procedure.fascialClosureOther) {
          return procedure.fascialClosureOther;
        }
        return closure;
      }).join(', ') : '';
    addClosureItemIfHasContent('Fascial Closure', fascialClosure);
    
    const fascialMaterial = procedure.fascialClosureMaterial?.length > 0 ? 
      procedure.fascialClosureMaterial.map((material) => {
        if (material === 'Other' && procedure.fascialClosureMaterialOther) {
          return procedure.fascialClosureMaterialOther;
        }
        return material;
      }).join(', ') : '';
    addClosureItemIfHasContent('Fascial Material Used', fascialMaterial);
    
    const skinClosure = procedure.skinClosure?.length > 0 ? 
      procedure.skinClosure.map((closure) => {
        if (closure === 'Other' && procedure.skinClosureOther) {
          return procedure.skinClosureOther;
        }
        return closure;
      }).join(', ') : '';
    addClosureItemIfHasContent('Skin Closure', skinClosure);
    
    const skinMaterial = procedure.skinClosureMaterial?.length > 0 ? 
      procedure.skinClosureMaterial.map((material) => {
        if (material === 'Other' && procedure.skinClosureMaterialOther) {
          return procedure.skinClosureMaterialOther;
        }
        return material;
      }).join(', ') : '';
    addClosureItemIfHasContent('Skin Material Used', skinMaterial);
    
    const specimen = procedure.specimenSent?.length > 0 ? 
      procedure.specimenSent.map((spec) => {
        if (spec === 'Other' && procedure.specimenOther) {
          return procedure.specimenOther;
        }
        return spec;
      }).join(', ') : '';
    addClosureItemIfHasContent('Specimen Sent for Pathology', specimen);
    
    const laboratory = procedure.laboratoryName || '';
    addClosureItemIfHasContent('Specify Laboratory Sent to', laboratory);
    
    // Move y to bottom of all columns and add post-operative management
    y = Math.max(col1Y, col2Y) + 4; // Reduced spacing
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5; // Reduced spacing
    
    // Two-column layout: NOTES | POST OPERATIVE MANAGEMENT
    const notesPostOpSectionY = y;
    const notesColX = margin;
    const postOpColX = margin + 95; // Position for right column
    
    // NOTES Section (Left Column)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', notesColX, notesPostOpSectionY);
    
    // POST OPERATIVE MANAGEMENT Section (Right Column)
    pdf.text('POST OPERATIVE MANAGEMENT', postOpColX, notesPostOpSectionY);
    
    let notesY = notesPostOpSectionY + 8;
    let postOpY = notesPostOpSectionY + 8;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Check for additional notes from multiple possible sources
    const additionalNotes = procedure.additionalNotes || 
                           ventralHerniaData?.procedureFindings?.additionalNotes || 
                           ventralHerniaData?.additionalNotes || '';
    
    // Check for post operative management from multiple possible sources 
    const postOpMgmt = procedure.postOperativeManagement || 
                       ventralHerniaData?.postOperativeManagement || '';
    
    // Helper function to add content to NOTES column
    const addNotesContent = (label: string, value: string) => {
      if (value) {
        const columnWidth = 90; // Width for left column
        const lines = pdf.splitTextToSize(`${label}: ${value}`, columnWidth);
        lines.forEach((line: string) => {
          pdf.text(line, notesColX, notesY);
          notesY += 4;
        });
        notesY += 3;
      }
    };
    
    // Helper function to add content to POST OPERATIVE MANAGEMENT column
    const addPostOpContent = (label: string, value: string) => {
      if (value) {
        const columnWidth = 90; // Width for right column
        const lines = pdf.splitTextToSize(`${label}: ${value}`, columnWidth);
        lines.forEach((line: string) => {
          pdf.text(line, postOpColX, postOpY);
          postOpY += 4;
        });
        postOpY += 3;
      }
    };

    // Add content to respective columns
    addNotesContent('Additional Notes', additionalNotes);
    addPostOpContent('Post Operative Management', postOpMgmt);
    
    // Update y position to after both columns
    y = Math.max(notesY, postOpY);
    
    // Add more spacing after POST OPERATIVE MANAGEMENT section to make signature more visible
    if (additionalNotes || postOpMgmt) {
      y += 8; // Increased spacing when content exists
    } else {
      y += 6; // Spacing when no content
    }
    
    // Force page break before signature for better visibility
    pdf.addPage();
    y = margin + 20; // Reset y position for new page with extra spacing to move signature lower
    
    // Signature Section - now on page 2 for better visibility
    pdf.setFontSize(9);
    const signatureY = y;
    
    // Surgeon's Signature - inline layout  
    pdf.text("Surgeon's Signature:", margin, signatureY);
    
    // Handle signature - check for text first, then image
    if (ventralHerniaData?.closure?.surgeonSignatureText) {
      // Use text signature if provided - inline with label
      pdf.text(ventralHerniaData.closure.surgeonSignatureText, margin + 42, signatureY);
    } else if (ventralHerniaData?.closure?.surgeonSignature) {
      // If signature is a data URL (uploaded image), add it as image - inline
      if (ventralHerniaData.closure.surgeonSignature.startsWith('data:image')) {
        try {
          // Get image properties using jsPDF's built-in method
          const imgProperties = pdf.getImageProperties(ventralHerniaData.closure.surgeonSignature);
          const imgWidth = imgProperties.width;
          const imgHeight = imgProperties.height;
          const aspectRatio = imgWidth / imgHeight;
          
          // Set maximum constraints for signature display
          const maxWidth = 70;  // Increased max width for better visibility
          const maxHeight = 25; // Increased max height for better visibility
          
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / aspectRatio;
          
          // If calculated height exceeds maximum, scale based on height instead
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * aspectRatio;
          }
          
          // Position signature inline with label, vertically centered
          const signatureX = margin + 42;
          const signatureYPos = signatureY - (finalHeight / 2);
          
          // Add image with preserved aspect ratio
          pdf.addImage(
            ventralHerniaData.closure.surgeonSignature, 
            'PNG', 
            signatureX, 
            signatureYPos, 
            finalWidth, 
            finalHeight
          );
          
        } catch (error) {
          console.error('Error adding signature image:', error);
          // Fallback to text placeholder
          pdf.text('[Signature Image]', margin + 42, signatureY);
        }
      } else {
        // If it's text, display as text inline
        pdf.text(ventralHerniaData.closure.surgeonSignature, margin + 42, signatureY);
      }
    }
    
    // Date & Time - inline layout on same line as signature
    const dateTimeX = margin + 130;
    pdf.text('Date & Time:', dateTimeX, signatureY);
    if (ventralHerniaData?.closure?.dateTime) {
      pdf.text(formatDateTimeWithColon(ventralHerniaData.closure.dateTime), dateTimeX + 30, signatureY);
    } else {
      pdf.text(formatDateTimeWithColon(new Date()), dateTimeX + 30, signatureY);
    }
    
    // Update total pages in all footers
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      // Find and replace {{totalPages}} placeholder
      const footerY = pageHeight - 15;
      const footerText = `Report Date: ${formatReportDate(new Date())} | Page ${i} of ${totalPages}`;
      
      // Cover the old page number text
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, footerY - 2, pageWidth, 10, 'F');
      
      // Redraw the footer with correct page numbers
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const footerLines = [
        'Dr. Monde Mjoli - Specialist Surgeon',
        'Practice Number: 0560812',
        footerText
      ];
      
      footerLines.forEach((line, index) => {
        pdf.text(line, pageWidth / 2, footerY + (index * 4), { align: 'center' });
      });
    }
    
    return {
      success: true,
      blob: pdf.output('blob')
    };
    
  } catch (error) {
    console.error('Error generating ventral hernia PDF:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
};

// For saving drafts
export const saveVentralHerniaDraft = (ventralHerniaData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const draftData = {
      ...ventralHerniaData,
      savedAt: timestamp,
      isDraft: true
    };
    
    localStorage.setItem(`ventral_hernia_draft_${timestamp}`, JSON.stringify(draftData));
    
    // Keep only the last 5 drafts
    const drafts = Object.keys(localStorage)
      .filter(key => key.startsWith('ventral_hernia_draft_'))
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
    console.error('Error saving ventral hernia draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to save draft'
    };
  }
};
