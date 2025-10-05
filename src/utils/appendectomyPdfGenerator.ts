import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateWithSuffix, formatReportDate, formatDateOnly } from './dateFormatter';
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
          // Draw port marking: black line with size label
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(marking.size, marking.x, marking.y - 5);

          ctx.beginPath();
          ctx.moveTo(marking.x - 15, marking.y);
          ctx.lineTo(marking.x + 15, marking.y);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 4;
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
            ctx.arc(marking.x, marking.y, 25, 0, 2 * Math.PI);
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
    const margin = 15;
    let y = margin;
    let currentPage = 1;
    
    // Helper function to add footer to a page
    const addFooter = (pageNum: number) => {
      const footerY = pageHeight - 15;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const footerDate = new Date();
      const footerDateStr = formatReportDate(footerDate);
      
      const footerText = `Dr. Monde Mjoli - Specialist Surgeon\nPractice Number: 0560812\nReport Date: ${footerDateStr} | Page ${pageNum} of {{totalPages}}`;
      const footerLines = footerText.split('\n');
      
      footerLines.forEach((line, index) => {
        pdf.text(line, pageWidth / 2, footerY + (index * 4), { align: 'center' });
      });
    };
    
    // Add footer to first page
    addFooter(currentPage);
    
    // Helper function to check page break
    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - 25) { // Leave space for footer
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
    
    // CENTER COLUMN - Report Title
    let centerY = headerStartY;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('APPENDECTOMY REPORT', pageWidth / 2, centerY, { align: 'center' });
    
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
    
    // Set y position to after the header
    y = Math.max(y, centerY, rightY) + 10;
    
    // PATIENT INFORMATION (Single Column)
    drawSection('PATIENT INFORMATION', () => {
      const patientInfo = appendectomyData?.patientInfo || {};
      const details = [
        `Name: ${patientInfo.name || 'Not specified'}`,
        `Patient ID: ${patientInfo.patientId || patientId || 'N/A'}`,
        `Date Of Birth: ${patientInfo.dateOfBirth ? formatDateOnly(patientInfo.dateOfBirth) : 'Not specified'}`,
        `Age: ${patientInfo.age || 'Not specified'}`,
        `Sex: ${patientInfo.sex ? patientInfo.sex.charAt(0).toUpperCase() + patientInfo.sex.slice(1).toLowerCase() : 'Not specified'}`,
        `Weight: ${patientInfo.weight || 'Not specified'}`,
        `Height: ${patientInfo.height || 'Not specified'}`,
        `BMI: ${patientInfo.bmi || 'Not specified'}`,
        `ASA Score: ${patientInfo.asaScore ? getFullASAText(patientInfo.asaScore) : 'Not specified'}`
      ];
      
      details.forEach((detail, index) => {
        if (index % 3 === 0 && index > 0) {
          y += 5;
        }
        const x = margin + (index % 3) * 60;
        pdf.text(detail, x, y);
      });
      
      // Add ASA Notes if present
      if (patientInfo.asaNotes) {
        y += 5;
        pdf.text(`ASA Notes: ${patientInfo.asaNotes}`, margin, y);
      }
      
      y += 10;
    });
    
    // Add separator line
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Two-column layout: PREOPERATIVE INFORMATION | INTRAOPERATIVE FINDINGS
    checkPageBreak(50);
    const startY = y;
    const columnWidth = (pageWidth - 3 * margin) / 2;
    const leftColumnX = margin;
    const rightColumnX = margin + columnWidth + margin;
    
    // LEFT COLUMN - Preoperative Information
    let leftY = startY;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', leftColumnX, leftY);
    leftY += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const preop = appendectomyData?.preoperative || {};
    const preopLines = [
      `Surgeon: ${preop.surgeons?.filter(s => s.trim()).join(', ') || 'Not specified'}`,
      `Assistant 1: ${preop.assistant1 || 'Not specified'}`,
      `Assistant 2: ${preop.assistant2 || 'Not specified'}`,
      `Anaesthetist: ${preop.anaesthetist || 'Not specified'}`,
      `Duration: ${preop.duration || 'Not specified'} minutes`,
      `Indication: ${preop.indication?.join(', ') || 'Not specified'}`,
    ];
    
    if (preop.indicationOther) {
      preopLines.push(`Other Indication: ${preop.indicationOther}`);
    }
    
    preopLines.push(`Imaging: ${preop.imaging?.join(', ') || 'Not specified'}`);
    
    if (preop.imagingOther) {
      preopLines.push(`Other Imaging: ${preop.imagingOther}`);
    }
    
    preopLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, leftColumnX, leftY);
        leftY += 5;
      });
    });
    
    // RIGHT COLUMN - Intraoperative Findings
    let rightY1 = startY;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTRAOPERATIVE FINDINGS', rightColumnX, rightY1);
    rightY1 += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const intraop = appendectomyData?.intraoperative || {};
    const intraopLines = [
      `Appendix Appearance: ${intraop.appendixAppearance?.join(', ') || 'Not specified'}`,
      `Abscess: ${intraop.abscess || 'Not specified'}`,
      `Peritonitis: ${intraop.peritonitis?.join(', ') || 'Not specified'}`,
    ];
    
    if (intraop.otherFindings) {
      intraopLines.push(`Other Findings: ${intraop.otherFindings}`);
    }
    
    intraopLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, rightColumnX, rightY1);
        rightY1 += 5;
      });
    });
    
    // Move y position to after both columns
    y = Math.max(leftY, rightY1) + 10;
    
    // Add separator line
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Two-column layout: PROCEDURE DETAILS | CLOSURE & POSTOPERATIVE
    checkPageBreak(50);
    const startY2 = y;
    
    // LEFT COLUMN - Procedure Details
    let leftY2 = startY2;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE DETAILS', leftColumnX, leftY2);
    leftY2 += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const procedure = appendectomyData?.procedure || {};
    const procedureLines = [
      `Approach: ${procedure.approach?.join(', ') || 'Not specified'}`,
      `Incision Type: ${procedure.incisionType?.join(', ') || 'Not specified'}`,
    ];
    
    if (procedure.incisionOther) {
      procedureLines.push(`Other Incision: ${procedure.incisionOther}`);
    }
    
    procedureLines.push(`Trocar Placement: ${procedure.trocarPlacement || 'Not specified'}`);
    procedureLines.push(`Division Method: ${procedure.divisionMethod?.join(', ') || 'Not specified'}`);
    
    if (procedure.divisionOther) {
      procedureLines.push(`Other Division Method: ${procedure.divisionOther}`);
    }
    
    procedureLines.push(`Mesentery Control: ${procedure.mesenteryControl?.join(', ') || 'Not specified'}`);
    
    if (procedure.mesenteryOther) {
      procedureLines.push(`Other Mesentery Control: ${procedure.mesenteryOther}`);
    }
    
    procedureLines.push(`Lavage: ${procedure.lavage || 'Not specified'}`);
    procedureLines.push(`Drain Placement: ${procedure.drainPlacement || 'Not specified'}`);
    
    if (procedure.drainPlacement === 'Yes' && procedure.drainLocation) {
      procedureLines.push(`Drain Location: ${procedure.drainLocation}`);
    }
    
    procedureLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, leftColumnX, leftY2);
        leftY2 += 5;
      });
    });
    
    // RIGHT COLUMN - Closure & Postoperative
    let rightY2 = startY2;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLOSURE & POSTOPERATIVE', rightColumnX, rightY2);
    rightY2 += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const closure = appendectomyData?.closure || {};
    const closureLines = [
      `Fascial Closure: ${closure.fascialClosure || 'Not specified'}`,
      `Skin Closure: ${closure.skinClosure?.join(', ') || 'Not specified'}`,
    ];
    
    if (closure.skinOther) {
      closureLines.push(`Other Skin Closure: ${closure.skinOther}`);
    }
    
    closureLines.push(`Complications: ${closure.complications || 'None'}`);
    
    if (closure.complications === 'Yes' && closure.complicationDetails) {
      closureLines.push(`Complication Details: ${closure.complicationDetails}`);
    }
    
    closureLines.push(`Pathology Sent: ${closure.pathology || 'Not specified'}`);
    closureLines.push(`Other Specimens: ${closure.otherSpecimens || 'None'}`);
    
    if (closure.otherSpecimens === 'Yes' && closure.specimenDetails) {
      closureLines.push(`Specimen Details: ${closure.specimenDetails}`);
    }
    
    closureLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, rightColumnX, rightY2);
        rightY2 += 5;
      });
    });
    
    // Move y position to after both columns
    y = Math.max(leftY2, rightY2) + 10;
    
    // Add separator line
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Surgical Diagram Section
    if (diagrams && diagrams.length > 0) {
      checkPageBreak(160); // More space needed for legend + larger image
      
      drawSection('SURGICAL DIAGRAM', () => {
        pdf.text('Surgical markings documented on diagram:', margin, y);
        y += 7;
        
        // Add legend/key
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Legend:', margin, y);
        y += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const legendItems = [
          '• Ports: Black horizontal lines with size labels',
          '• Ileostomy: Dashed yellow/gold circles (smaller)',
          '• Colostomy: Solid green circles (larger)', 
          '• Incisions: Dashed dark red lines'
        ];
        
        legendItems.forEach(item => {
          pdf.text(item, margin + 5, y);
          y += 4;
        });
        
        y += 5;
        pdf.setFontSize(10);
      });

      // Render the actual diagram with markings
      const diagramImageData = await createSurgicalDiagramCanvas(diagrams);
      if (diagramImageData) {
        checkPageBreak(130); // Space for larger image
        
        // Calculate image size to maintain aspect ratio like live report
        const img = new Image();
        img.src = diagramImageData;
        
        // Use similar proportions as live report (300px max height)
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = 120; // Increased from 60 to 120mm for better visibility
        
        // Calculate proper aspect ratio
        let width = maxWidth;
        let height = maxHeight;
        
        // If we have image dimensions, maintain aspect ratio
        if (img.naturalWidth && img.naturalHeight) {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          if (width / height > aspectRatio) {
            width = height * aspectRatio;
          } else {
            height = width / aspectRatio;
          }
        }
        
        try {
          pdf.addImage(diagramImageData, 'PNG', margin, y, width, height);
          y += height + 10;
        } catch (error) {
          console.error('Error adding surgical diagram to PDF:', error);
          pdf.text('Surgical diagram could not be rendered', margin, y);
          y += 7;
        }
      } else {
        // Fallback to text summary if diagram rendering fails
        const markingSummary = {
          ports: diagrams.filter(m => m.type === 'port'),
          stomas: diagrams.filter(m => m.type === 'stoma'),
          incisions: diagrams.filter(m => m.type === 'incision')
        };
        
        if (markingSummary.ports.length > 0) {
          pdf.text(`• Ports (${markingSummary.ports.length}): ${markingSummary.ports.map(p => p.size).join(', ')}`, margin + 5, y);
          y += 5;
        }
        
        if (markingSummary.stomas.length > 0) {
          pdf.text(`• Stomas (${markingSummary.stomas.length}): ${markingSummary.stomas.map(s => s.stomaType).join(', ')}`, margin + 5, y);
          y += 5;
        }
        
        if (markingSummary.incisions.length > 0) {
          pdf.text(`• Access incisions: ${markingSummary.incisions.length} marked on diagram`, margin + 5, y);
          y += 5;
        }
        
        y += 5;
      }
    }
    
    // Signature Section
    checkPageBreak(30);
    pdf.setFontSize(10);
    const signatureY = y;
    pdf.text('Surgeon Signature:', margin, signatureY);
    
    // Handle signature - check for text first, then image
    if (appendectomyData?.closure?.surgeonSignatureText) {
      // Use text signature if provided
      pdf.text(appendectomyData.closure.surgeonSignatureText, margin + 40, signatureY);
    } else if (appendectomyData?.closure?.surgeonSignature) {
      // If signature is a data URL (uploaded image), add it as image
      if (appendectomyData.closure.surgeonSignature.startsWith('data:image')) {
        try {
          pdf.addImage(appendectomyData.closure.surgeonSignature, 'JPEG', margin + 40, signatureY - 8, 80, 20);
        } catch (error) {
          console.error('Error adding signature image:', error);
          pdf.text('[Signature Image]', margin + 40, signatureY);
        }
      } else {
        // If it's text, display as text
        pdf.text(appendectomyData.closure.surgeonSignature, margin + 40, signatureY);
      }
    } else {
      pdf.line(margin + 40, signatureY, margin + 120, signatureY);
    }
    
    const dateTimeY = signatureY + 20;
    pdf.text('Date:', margin, dateTimeY);
    if (appendectomyData?.closure?.dateTime) {
      pdf.text(formatDateOnly(appendectomyData.closure.dateTime), margin + 30, dateTimeY);
    } else {
      pdf.text(formatDateOnly(new Date()), margin + 30, dateTimeY);
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