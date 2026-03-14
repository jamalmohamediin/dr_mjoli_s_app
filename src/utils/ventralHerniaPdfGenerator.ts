import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateWithSuffix, formatReportDate, formatDateOnly, formatDateDDMMYYYY, formatDateTimeWithColon } from './dateFormatter';
import { getPatientInfoPdfSections } from './patientSticker';

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
    console.log('herniaDefectLength:', ventralHerniaData?.operative?.herniaDefectLength);
    console.log('herniaDefectWidth:', ventralHerniaData?.operative?.herniaDefectWidth);
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
    
    const patientCol1X = margin;
    const patientCol2X = margin + 70;
    const patientCol3X = margin + 140;
    const writePatientRow = (row: string[]) => {
      const rowLines = [
        pdf.splitTextToSize(row[0] || '', 60),
        pdf.splitTextToSize(row[1] || '', 60),
        pdf.splitTextToSize(row[2] || '', 60),
      ];
      const lineCount = Math.max(rowLines[0].length, rowLines[1].length, rowLines[2].length, 1);
      checkPageBreak(lineCount * 4.5 + 2);

      for (let index = 0; index < lineCount; index++) {
        if (rowLines[0][index]) pdf.text(rowLines[0][index], patientCol1X, y);
        if (rowLines[1][index]) pdf.text(rowLines[1][index], patientCol2X, y);
        if (rowLines[2][index]) pdf.text(rowLines[2][index], patientCol3X, y);
        y += 4.5;
      }
    };

    const patientSections = getPatientInfoPdfSections(patientInfo, patientName, patientId);

    patientSections.forEach((section, sectionIndex) => {
      if (section.title) {
        checkPageBreak(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(section.title, margin, y);
        y += 5;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      section.rows.forEach((row) => writePatientRow(row));

      if (sectionIndex < patientSections.length - 1) {
        y += 1;
      }
    });
    
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
    
    
    // Separator line (thinner)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // Data preparation for all sections
    const operative = ventralHerniaData?.operative || {};
    const procedure = ventralHerniaData?.procedure || {};
    
    // OPERATIVE FINDINGS Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OPERATIVE FINDINGS', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Operative findings data preparation
    const herniaTypes = operative.herniaType?.map(type => 
      type === 'Other' && operative.herniaTypeOther ? operative.herniaTypeOther : type
    ).join(', ') || '';
    
    const herniaSites = operative.herniaSite?.map(site => 
      site === 'Other' && operative.herniaSiteOther ? operative.herniaSiteOther : site
    ).join(', ') || '';
    
    const herniaDefectLength = operative.herniaDefectLength || '';
    const herniaDefectWidth = operative.herniaDefectWidth || '';
    const herniaDefectsDisplay = herniaDefectLength || herniaDefectWidth 
      ? `${herniaDefectLength || '___'} cm (Length) x ${herniaDefectWidth || '___'} cm (Width)`
      : '';
    const numberOfDefects = operative.numberOfDefects || '';
    
    const contents = operative.contents?.map(content => 
      content === 'Other' && operative.contentsOther ? operative.contentsOther : content
    ).join(', ') || '';
    
    const strangulation = operative.strangulation || '';
    
    // Two-column layout for operative findings - aligned with PORTS AND INCISIONS column
    const col1X = margin;
    const col2X = pageCenter + 2; // Same alignment as PORTS AND INCISIONS
    
    pdf.text(`Hernia Type: ${herniaTypes}`, col1X, y);
    pdf.text(`Number of Defects: ${numberOfDefects}`, col2X, y);
    y += 4.5;
    
    pdf.text(`Site of Hernia: ${herniaSites}`, col1X, y);
    pdf.text(`Contents: ${contents}`, col2X, y);
    y += 4.5;
    
    pdf.text(`Total Hernia Defect Size: ${herniaDefectsDisplay}`, col1X, y);
    pdf.text(`Strangulation/Ischaemia: ${strangulation}`, col2X, y);
    y += 6;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // TWO-COLUMN SECTION: PROCEDURE DETAILS and PORTS AND INCISIONS
    const leftColX = margin;
    const rightColX = pageCenter + 2;
    const leftColWidth = (pageWidth / 2) - margin - 5;
    const rightColWidth = (pageWidth / 2) - margin - 5;
    
    // Section headers
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', leftColX, y);
    pdf.text('PORTS AND INCISIONS', rightColX, y);
    y += 5;
    
    let leftY = y;
    let rightY = y;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Helper function for left column items with boundary control
    const addLeftItem = (label: string, value: string) => {
      if (value) {
        const maxWidth = leftColWidth - 5; // Ensure boundary
        const text = `${label}: ${value}`;
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          pdf.text(line, leftColX, leftY);
          leftY += 4;
        });
        leftY += 1; // Small spacing between items
      }
    };
    
    // Helper function for right column items with boundary control
    const addRightItem = (label: string, value: string) => {
      if (value) {
        const maxWidth = rightColWidth - 5; // Ensure boundary
        const text = `${label}: ${value}`;
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          pdf.text(line, rightColX, rightY);
          rightY += 4;
        });
        rightY += 1; // Small spacing between items
      }
    };
    
    // LEFT COLUMN - PROCEDURE DETAILS
    const operationDescription = operative.operationDescription || '';
    
    let approachText = '';
    if (operative.approach?.length > 0) {
      approachText = operative.approach.map((approach) => {
        if (approach === 'Other' && operative.approachOther) {
          return `Other: ${operative.approachOther}`;
        }
        return approach;
      }).join(', ');
    }
    
    // Conditional: Only show conversion reason if "Laparoscopic Converted To Open" is selected
    const showConversionReason = operative.approach?.includes('Laparoscopic Converted To Open');
    const conversionReasonText = showConversionReason && operative.conversionReason?.length > 0 ? 
      operative.conversionReason.map(reason => {
        if (reason === 'Other' && operative.conversionReasonOther) {
          return `Other: ${operative.conversionReasonOther}`;
        }
        return reason;
      }).join(', ') : '';
    
    const trocarNumber = operative.trocarNumber || '';
    const sacExcised = procedure.sacExcised || '';
    const fatDissected = procedure.fatDissected || '';
    const defectClosed = procedure.defectClosed || '';
    
    // Conditional: Only show closure technique if defect closed is "Yes"
    const showClosureTechnique = procedure.defectClosed === 'Yes';
    const closureTechnique = showClosureTechnique && procedure.closureTechnique?.length > 0 ? 
      procedure.closureTechnique.map((tech) => {
        if (tech === 'Other' && procedure.closureTechniqueOther) {
          return `Other: ${procedure.closureTechniqueOther}`;
        }
        return tech;
      }).join(', ') : '';
    
    const materialUsed = procedure.closureMaterial?.map((material) => {
      if (material === 'Other' && procedure.closureMaterialOther) {
        return `Other: ${procedure.closureMaterialOther}`;
      }
      return material;
    }).join(', ') || '';
    
    const repairType = procedure.repairType || '';
    
    // Conditional logic based on repair type
    let primaryRepair = '';
    let meshPlacement = '';
    let meshMaterials = '';
    let meshSize = '';
    let fixation = '';
    
    if (repairType === 'Primary Suture Closure (Non-Mesh)') {
      primaryRepair = procedure.primaryRepair?.map((repair) => {
        if (repair === 'Other' && procedure.primaryRepairOther) {
          return `Other: ${procedure.primaryRepairOther}`;
        }
        return repair;
      }).join(', ') || '';
      
      meshPlacement = 'N/A';
      meshMaterials = 'N/A';
      meshSize = 'N/A';
      fixation = 'N/A';
    } else if (repairType === 'Mesh Repair') {
      primaryRepair = 'N/A';
      
      meshPlacement = procedure.meshType?.map((type) => {
        if (type === 'Other' && procedure.meshPlacementOther) {
          return procedure.meshPlacementOther;
        }
        return type;
      }).join(', ') || '';
      
      meshMaterials = procedure.meshMaterial?.map((material) => {
        if (material === 'Other' && procedure.meshMaterialOther) {
          return procedure.meshMaterialOther;
        }
        return material;
      }).join(', ') || '';
      
      meshSize = (procedure.meshLength || procedure.meshWidth) ? 
        `${procedure.meshLength || '___'} x ${procedure.meshWidth || '___'} cm` : '';
      
      fixation = procedure.fixation?.map(fix => 
        fix === 'Other' && procedure.fixationOther ? procedure.fixationOther : fix
      ).join(', ') || '';
    } else {
      primaryRepair = procedure.primaryRepair?.map((repair) => {
        if (repair === 'Other' && procedure.primaryRepairOther) {
          return `Other: ${procedure.primaryRepairOther}`;
        }
        return repair;
      }).join(', ') || '';
      
      meshPlacement = procedure.meshType?.map((type) => {
        if (type === 'Other' && procedure.meshPlacementOther) {
          return procedure.meshPlacementOther;
        }
        return type;
      }).join(', ') || '';
      
      meshMaterials = procedure.meshMaterial?.map((material) => {
        if (material === 'Other' && procedure.meshMaterialOther) {
          return procedure.meshMaterialOther;
        }
        return material;
      }).join(', ') || '';
      
      meshSize = (procedure.meshLength || procedure.meshWidth) ? 
        `${procedure.meshLength || '___'} x ${procedure.meshWidth || '___'} cm` : '';
      
      fixation = procedure.fixation?.map(fix => 
        fix === 'Other' && procedure.fixationOther ? procedure.fixationOther : fix
      ).join(', ') || '';
    }
    
    // Add procedure details items to left column
    addLeftItem('Operation Description', operationDescription);
    addLeftItem('Surgical Approach', approachText);
    
    // Conditional: Only show if conversion is applicable
    if (showConversionReason) {
      addLeftItem('Reason for Conversion', conversionReasonText);
    }
    
    addLeftItem('Trocar Number', trocarNumber);
    addLeftItem('Sac Excised', sacExcised);
    addLeftItem('Pre-peritoneal Fat Dissected Off Sheath', fatDissected);
    addLeftItem('Hernia Defect Closed', defectClosed);
    
    // Conditional: Only show if defect was closed
    if (showClosureTechnique) {
      addLeftItem('Closure Technique', closureTechnique);
    }
    
    addLeftItem('Material Used', materialUsed);
    addLeftItem('Repair Type', repairType);
    addLeftItem('Primary Tissue Repair', primaryRepair);
    addLeftItem('Mesh Placement', meshPlacement);
    addLeftItem('Mesh Material', meshMaterials);
    addLeftItem('Mesh Size', meshSize);
    addLeftItem('Fixation', fixation);
    
    // CLOSURE Section (in left column immediately after Fixation)
    leftY += 6; // Add some space before closure
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE', leftColX, leftY);
    leftY += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Closure data
    const haemostasis = procedure.haemostasis || '';
    let drainText = procedure.drain || '';
    if (procedure.drain === 'Yes' && procedure.drainDetails) {
      drainText += ` - ${procedure.drainDetails}`;
    }
    
    // Conditional closure fields - only show if user has selected something
    const fascialClosure = procedure.fascialClosure?.length > 0 ? 
      procedure.fascialClosure.map((closure) => {
        if (closure === 'Other' && procedure.fascialClosureOther) {
          return procedure.fascialClosureOther;
        }
        return closure;
      }).join(', ') : '';
    
    const fascialMaterial = procedure.fascialClosureMaterial?.length > 0 ? 
      procedure.fascialClosureMaterial.map((material) => {
        if (material === 'Other' && procedure.fascialClosureMaterialOther) {
          return procedure.fascialClosureMaterialOther;
        }
        return material;
      }).join(', ') : '';
    
    const skinClosure = procedure.skinClosure?.length > 0 ? 
      procedure.skinClosure.map((closure) => {
        if (closure === 'Other' && procedure.skinClosureOther) {
          return procedure.skinClosureOther;
        }
        return closure;
      }).join(', ') : '';
    
    const skinMaterial = procedure.skinClosureMaterial?.length > 0 ? 
      procedure.skinClosureMaterial.map((material) => {
        if (material === 'Other' && procedure.skinClosureMaterialOther) {
          return procedure.skinClosureMaterialOther;
        }
        return material;
      }).join(', ') : '';
    
    // Add closure items to left column - only if they have values
    addLeftItem('Haemostasis', haemostasis);
    addLeftItem('Drain', drainText);
    
    // Conditional: Only show if user has selected something
    if (fascialClosure) {
      addLeftItem('Fascial Closure', fascialClosure);
    }
    if (fascialMaterial) {
      addLeftItem('Fascial Material Used', fascialMaterial);
    }
    if (skinClosure) {
      addLeftItem('Skin Closure', skinClosure);
    }
    if (skinMaterial) {
      addLeftItem('Skin Material Used', skinMaterial);
    }
    
    // RIGHT COLUMN - PORTS AND INCISIONS with diagram
    if (diagrams && diagrams.length > 0) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      // Legend with visual indicators - exactly like appendectomy
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Legend:', rightColX, rightY);
      rightY += 5;
      
      // Row 1: Ports and Ileostomy
      const legendCol1X = rightColX;
      const legendCol2X = rightColX + 45;
      
      // Ports legend with smaller visual indicator
      pdf.text('Ports (with size label)', legendCol1X + 6, rightY);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.8);
      pdf.line(legendCol1X, rightY - 1, legendCol1X + 4, rightY - 1);
      pdf.setFontSize(4);
      pdf.text('5mm', legendCol1X + 0.5, rightY - 2);
      pdf.setFontSize(8);
      
      // Ileostomy legend with smaller visual indicator
      pdf.text('Ileostomy', legendCol2X + 6, rightY);
      pdf.setDrawColor(245, 158, 11); // Yellow/Gold color
      pdf.setLineWidth(0.8);
      pdf.setLineDash([1.5, 1]);
      pdf.circle(legendCol2X + 2, rightY - 1, 1.5);
      pdf.setLineDash([]);
      
      rightY += 5;
      
      // Row 2: Incisions and Colostomy
      // Incisions legend with smaller visual indicator
      pdf.text('Incisions', legendCol1X + 6, rightY);
      pdf.setDrawColor(139, 0, 0); // Dark red color
      pdf.setLineWidth(0.8);
      pdf.setLineDash([2, 1.5]);
      pdf.line(legendCol1X, rightY - 1, legendCol1X + 4, rightY - 1);
      pdf.setLineDash([]);
      
      // Colostomy legend with smaller visual indicator
      pdf.text('Colostomy', legendCol2X + 6, rightY);
      pdf.setDrawColor(22, 163, 74); // Green color
      pdf.setLineWidth(1.2);
      pdf.circle(legendCol2X + 2, rightY - 1, 1.5);
      
      rightY += 6;
      
      // Reset draw color
      pdf.setDrawColor(0, 0, 0);
      
      // Space before diagram
      rightY += 2;
      
      // Diagram box with fixed size as specified
      pdf.setLineWidth(0.2);
      const diagramBoxHeight = 60;
      const diagramBoxWidth = rightColWidth - 10;
      pdf.rect(rightColX, rightY, diagramBoxWidth, diagramBoxHeight);
      
      // Diagram content - KEEP CURRENT DIAGRAM SIZE AS SPECIFIED
      const diagramImageData = await createSurgicalDiagramCanvas(diagrams);
      if (diagramImageData) {
        try {
          const imgProperties = pdf.getImageProperties(diagramImageData);
          const imgWidth = imgProperties.width;
          const imgHeight = imgProperties.height;
          const aspectRatio = imgWidth / imgHeight;
          
          const maxWidth = diagramBoxWidth - 8;
          const maxHeight = diagramBoxHeight - 8;
          
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / aspectRatio;
          
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * aspectRatio;
          }
          
          const centerX = rightColX + (maxWidth - finalWidth) / 2 + 4;
          const centerY = rightY + (maxHeight - finalHeight) / 2 + 4;
          
          pdf.addImage(diagramImageData, 'PNG', centerX, centerY, finalWidth, finalHeight);
        } catch (error) {
          console.error('Error adding surgical diagram to PDF:', error);
          pdf.setFontSize(8);
          pdf.text('DIAGRAM', rightColX + 35, rightY + 30);
          pdf.text('(LEAVE CURRENT Diagram Size', rightColX + 20, rightY + 35);
          pdf.text('AS IT IS)', rightColX + 35, rightY + 40);
        }
      } else {
        pdf.setFontSize(8);
        pdf.text('DIAGRAM', rightColX + 35, rightY + 30);
        pdf.text('(LEAVE CURRENT Diagram Size', rightColX + 20, rightY + 35);
        pdf.text('AS IT IS)', rightColX + 35, rightY + 40);
      }
      
      rightY += diagramBoxHeight + 6;
    } else {
      addRightItem('Surgical Markings', 'No markings documented');
    }
    
    // Add COMPLICATIONS section in the right column under the diagram
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPLICATIONS', rightColX, rightY);
    rightY += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Complications data with N/A autofill logic
    const difficulty = procedure.intraOperativeDifficulty?.length > 0 ? 
      procedure.intraOperativeDifficulty.map((diff) => {
        if (diff === 'Other' && procedure.intraOperativeDifficultyOther) {
          return procedure.intraOperativeDifficultyOther;
        }
        return diff;
      }).join(', ') : 'N/A';
    
    const complications = procedure.complications?.length > 0 ? 
      procedure.complications.map((comp) => {
        if (comp === 'Other' && procedure.complicationOther) {
          return procedure.complicationOther;
        }
        return comp;
      }).join(', ') : 'N/A';
    
    // Add complications items to right column
    const addRightComplicationsItem = (label: string, value: string) => {
      if (label || value) {
        const maxWidth = rightColWidth - 5;
        const text = `${label}: ${value}`;
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          pdf.text(line, rightColX, rightY);
          rightY += 4;
        });
        rightY += 1;
      }
    };
    
    addRightComplicationsItem('Intra-Operative Difficulty', difficulty);
    addRightComplicationsItem('Intra-Operative Complications', complications);
    
    // Update y to the maximum of both columns
    y = Math.max(leftY, rightY) + 6;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // Force page break here - move to next page
    pdf.addPage();
    addFooter(++currentPage);
    y = margin + 10;
    
    // SPECIMEN Section (now on page 2)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPECIMEN', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const specimen = procedure.specimenSent?.length > 0 ? 
      procedure.specimenSent.map((spec) => {
        if (spec === 'Other' && procedure.specimenOther) {
          return procedure.specimenOther;
        }
        return spec;
      }).join(', ') : '';
    
    const laboratory = procedure.laboratoryName || '';
    const otherSpecimens = procedure.otherSpecimens || '';
    
    pdf.text(`Specimen Sent for Pathology: ${specimen}`, margin, y);
    y += 4.5;
    
    pdf.text(`Specify Laboratory Sent to: ${laboratory}`, margin, y);
    y += 4.5;
    
    pdf.text(`Other Specimens Taken: ${otherSpecimens}`, margin, y);
    y += 6;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // NOTES Section (full width)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const additionalNotes = procedure.additionalNotes || 
                           ventralHerniaData?.procedureFindings?.additionalNotes || 
                           ventralHerniaData?.additionalNotes || '';
    
    if (additionalNotes) {
      const lines = pdf.splitTextToSize(`Additional Notes: ${additionalNotes}`, pageWidth - (margin * 2));
      lines.forEach((line: string) => {
        pdf.text(line, margin, y);
        y += 4;
      });
    }
    
    y += 6;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // POST OPERATIVE MANAGEMENT Section (full width)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POST OPERATIVE MANAGEMENT', margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const postOpMgmt = procedure.postOperativeManagement || 
                       ventralHerniaData?.postOperativeManagement || '';
    
    if (postOpMgmt) {
      const lines = pdf.splitTextToSize(`Post Operative Management: ${postOpMgmt}`, pageWidth - (margin * 2));
      lines.forEach((line: string) => {
        pdf.text(line, margin, y);
        y += 4;
      });
    }
    
    y += 6;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 15;
    
    // Signature Section with proper spacing - inline layout as specified
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const signatureY = y;
    
    // Surgeon's Signature and Date & Time on same line
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
          const maxWidth = 50;
          const maxHeight = 15;
          
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
    
    // Date & Time - aligned with right column like other fields
    const rightColXForDateTime = pageCenter + 2; // Same alignment as PORTS AND INCISIONS
    pdf.text('Date & Time:', rightColXForDateTime, signatureY);
    if (ventralHerniaData?.closure?.dateTime) {
      pdf.text(formatDateTimeWithColon(ventralHerniaData.closure.dateTime), rightColXForDateTime + 30, signatureY);
    } else {
      pdf.text(formatDateTimeWithColon(new Date()), rightColXForDateTime + 30, signatureY);
    }
    
    y = signatureY + 10;
    
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
