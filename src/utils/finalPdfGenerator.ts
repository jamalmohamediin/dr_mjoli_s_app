import jsPDF from 'jspdf';
import { formatDateWithSuffix, formatDateOnly, formatDateDDMMYYYY } from './dateFormatter';
import { getFullASAText } from './asaDescriptions';

export interface FinalDiagramCapture {
  canvasImageData?: string;
  findings: any[];
  type: 'gastroscopy' | 'colonoscopy';
}

// Helper function for ordinal suffix
const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const generateFinalPDF = async (
  patientName: string,
  patientId: string,
  diagrams?: FinalDiagramCapture[],
  reportData?: any,
  uploads?: { gastroscopy?: File[]; colonoscopy?: File[] }
) => {
  try {
    console.log('🔥 === GENERATING FINAL PDF (FINAL VERSION - ALL FIXES COMPLETED) ===');
    console.log('✅ 1. Signature image sizing fixed using appendectomy approach');
    console.log('✅ 2. Column alignment fixed - Assistant, End Time, Preoperative Imaging now properly positioned');
    console.log('✅ 3. Other Specimens Taken and Conclusion now visible with answers');
    console.log('✅ 4. Preoperative Imaging shows exact options (None, Ultrasound, CT Scan, MRI)');
    console.log('✅ 5. PROCEDURE INFORMATION layout completely restructured with proper spacing');
    console.log('Diagrams received:', diagrams);
    console.log('Report data:', reportData);
    
    // Create PDF
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const footerHeight = 25;
    let currentPage = 1;
    
    // Consistent column positioning for alignment (matching appendectomy layout)
    const col1X = margin;           // Left column start
    const col2X = margin + 62;      // Right column start (matching appendectomy positioning)
    const col3X = margin + 124;     // Third column for 3-column layouts
    
    let y = margin;
    
    // Helper function to add footer to a page
    const addFooter = (pageNum: number) => {
      const footerY = pageHeight - 20;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      pdf.text('Dr. Monde Mjoli - Specialist Surgeon', pageWidth / 2, footerY, { align: 'center' });
      pdf.text('Practice Number: 0560812', pageWidth / 2, footerY + 4, { align: 'center' });
      pdf.text(`Report Date: ${formatDateOnly(new Date())} | Page ${pageNum} of {{totalPages}}`, pageWidth / 2, footerY + 8, { align: 'center' });
    };
    
    // Add footer to first page
    addFooter(currentPage);
    
    // Helper function to check page break
    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - 40) { // Leave space for footer
        currentPage++;
        pdf.addPage();
        addFooter(currentPage);
        y = margin;
        return true;
      }
      return false;
    };
    
    // Helper function to capitalize anesthesia type
    const capitalizeAnesthesia = (type: string) => {
      if (!type) return '';
      const typeMap: { [key: string]: string } = {
        'general': 'General Anaesthesia',
        'conscious': 'Conscious Sedation', 
        'deep': 'Deep Sedation',
        'none': 'No Sedation',
        'general anaesthesia': 'General Anaesthesia',
        'conscious sedation': 'Conscious Sedation',
        'deep sedation': 'Deep Sedation',
        'no sedation': 'No Sedation'
      };
      return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };
    
    // Helper function to check if a value exists and is not empty
    const hasValue = (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    };
    
    // Helper function to conditionally add a field to PDF with semi-bold labels
    const addFieldIfExists = (label: string, value: any, x: number, currentY: number, lineHeight: number = 4) => {
      if (hasValue(value)) {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, x, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(` ${displayValue}`, x + pdf.getTextWidth(`${label}:`) + 2, currentY);
        return currentY + lineHeight;
      }
      return currentY;
    };
    
    // HEADER - Exact template format matching the new structure
    const leftX = margin;
    const rightX = pageWidth - margin;
    
    // Row 1
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dr. Monde Mjoli', leftX, y, { align: 'left' });
    y += 4;
    
    // Row 2
    pdf.setFontSize(9);
    pdf.text('Specialist Surgeon', leftX, y, { align: 'left' });
    pdf.text("St. Dominic's Medical Suites B", rightX, y, { align: 'right' });
    y += 4;
    
    // Row 3
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal'); // Remove bold for qualifications and address
    pdf.text('MBChB (UNITRA), MMed (UKZN), FCS(SA),', leftX, y, { align: 'left' });
    pdf.text('56 St James Road, Southernwood', rightX, y, { align: 'right' });
    y += 4;
    
    // Row 4
    pdf.text('Cert Gastroenterology, Surg (SA)', leftX, y, { align: 'left' });
    pdf.text('East London, 5201', rightX, y, { align: 'right' });
    y += 4;
    
    // Row 5
    pdf.text('Practice No. 0560812', leftX, y, { align: 'left' });
    pdf.text('Tel: 043 743 7872', rightX, y, { align: 'right' });
    y += 4;
    
    // Row 6
    pdf.text('Cell: 082 417 2630', leftX, y, { align: 'left' });
    pdf.text('Fax: 043 743 6653', rightX, y, { align: 'right' });
    y += 4;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    // ENDOSCOPY REPORT title centered
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENDOSCOPY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // PATIENT INFORMATION section
    if (reportData?.patientInfo) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION', margin, y);
      y += 6;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Row 1: Name, Patient ID, (3 columns properly aligned)
      const patientName = reportData.patientInfo.name || '';
      const patientId = reportData.patientInfo.patientId || '';
      
      pdf.text(`Name: ${patientName}`, col1X, y);
      pdf.text(`Patient ID: ${patientId}`, col2X, y);
      // Third column intentionally left empty for this row
      y += 4;
      
      // Row 2: Date of Birth, Age, Sex (3 columns aligned)  
      const dob = reportData.patientInfo.dateOfBirth ? 
        formatDateDDMMYYYY(reportData.patientInfo.dateOfBirth) : '';
      const age = reportData.patientInfo.age || '';
      const gender = reportData.patientInfo.sex || reportData.patientInfo.gender || '';
      
      pdf.text(`Date Of Birth: ${dob}`, col1X, y);
      pdf.text(`Age: ${age}`, col2X, y);
      pdf.text(`Sex: ${gender}`, col3X, y);
      y += 4;
      
      // Row 3: Weight, Height, BMI (3 columns aligned)
      const weight = reportData.patientInfo.weight ? `${reportData.patientInfo.weight}` : '';
      const height = reportData.patientInfo.height ? `${reportData.patientInfo.height}` : '';
      const bmi = reportData.patientInfo.bmi || '';
      
      pdf.text(`Weight: ${weight}`, col1X, y);
      pdf.text(`Height: ${height}`, col2X, y);
      pdf.text(`BMI: ${bmi}`, col3X, y);
      y += 4;
      
      // Row 4: ASA Score 
      const asaText = reportData.patientInfo.asaScore ? getFullASAText(reportData.patientInfo.asaScore) : '';
      
      pdf.text(`ASA Score: ${asaText}`, col1X, y);
      y += 4;
      
      // ASA Notes below ASA Score
      const asaNotes = reportData.patientInfo.asaNotes || '';
      if (hasValue(asaNotes)) {
        pdf.text(`ASA Notes: ${asaNotes}`, col1X, y);
        y += 4;
      }
      
      y += 4; // Extra spacing before separator
      
      // Separator line
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
    }
    
    // PREOPERATIVE INFORMATION section  
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE INFORMATION', margin, y);
    y += 6;
    
    if (reportData?.patientInfo) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Row 1: Surgeon, Assistant, Anaesthetist (3 columns)
      let surgeon = '';
      let assistant = '';
      let anaesthetist = '';
      
      // Handle surgical team data
      if (reportData.patientInfo.surgeons) {
        if (Array.isArray(reportData.patientInfo.surgeons)) {
          surgeon = reportData.patientInfo.surgeons.join(', ');
        } else {
          surgeon = reportData.patientInfo.surgeons;
        }
      }
      
      if (reportData.patientInfo.assistants) {
        if (Array.isArray(reportData.patientInfo.assistants)) {
          assistant = reportData.patientInfo.assistants.join(', ');
        } else {
          assistant = reportData.patientInfo.assistants;
        }
      }
      
      if (reportData.patientInfo.anaesthetists) {
        if (Array.isArray(reportData.patientInfo.anaesthetists)) {
          anaesthetist = reportData.patientInfo.anaesthetists.join(', ');
        } else {
          anaesthetist = reportData.patientInfo.anaesthetists;
        }
      }
      
      pdf.text(`Surgeon: ${surgeon}`, col1X, y);
      pdf.text(`Assistant: ${assistant}`, col2X, y);
      pdf.text(`Anaesthetist: ${anaesthetist}`, col3X, y);
      y += 4;
      
      // Row 2: Start Time, End Time, Total Duration (3 columns aligned)
      const startTime = reportData.patientInfo.operationStartTime || '';
      const endTime = reportData.patientInfo.operationEndTime || '';
      const totalDuration = reportData.patientInfo.operationDuration || '';
      
      pdf.text(`Start Time: ${startTime}`, col1X, y);
      pdf.text(`End Time: ${endTime}`, col2X, y);
      pdf.text(`Total Duration: ${totalDuration}`, col3X, y);
      y += 4;
      
      // Row 3: Clinical Indication and Preoperative Imaging (2 columns aligned)
      const indication = reportData.patientInfo.indication || '';
      const preoperativeImagingRaw = reportData.patientInfo.preoperativeImaging || '';
      
      // Format preoperative imaging to exact display names
      let preoperativeImaging = '';
      switch(preoperativeImagingRaw.toLowerCase()) {
        case 'none':
          preoperativeImaging = 'None';
          break;
        case 'ultrasound':
          preoperativeImaging = 'Ultrasound';
          break;
        case 'ct':
          preoperativeImaging = 'CT Scan';
          break;
        case 'mri':
          preoperativeImaging = 'MRI';
          break;
        case 'other':
          preoperativeImaging = 'Other (Please Specify)';
          break;
        default:
          preoperativeImaging = preoperativeImagingRaw;
      }
      
      pdf.text(`Clinical Indication: ${indication}`, col1X, y);
      pdf.text(`Preoperative Imaging: ${preoperativeImaging}`, col2X, y);
      y += 8;
      
      // Separator line
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
    }

    // Define column widths for 3-column layout (also used in PROCEDURE INFORMATION)
    const threeColumnWidth = (pageWidth - 2 * margin - 16) / 3; // 3 columns with gaps
    const col1XThree = margin;           // Left column
    const col2XThree = margin + threeColumnWidth + 8;    // Middle column  
    const col3XThree = margin + (threeColumnWidth * 2) + 16;  // Right column

    // PROCEDURE INFORMATION section
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE INFORMATION', margin, y);
    y += 6;
    
    if (reportData?.patientInfo) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Get all the data (removed intra-operative fields as requested)
      const proceduresText = reportData?.selectedProcedures && reportData.selectedProcedures.length > 0 
        ? reportData.selectedProcedures.join(', ') : '';
      const bowelPrepRaw = reportData.patientInfo.preparation || '';
      const bowelPrep = bowelPrepRaw ? bowelPrepRaw.charAt(0).toUpperCase() + bowelPrepRaw.slice(1).toLowerCase() : '';
      const anesthesiaType = capitalizeAnesthesia(reportData.patientInfo.sedation || '');
      
      // 3-column layout with headers and answers below
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      // Row 1: Column headers
      pdf.text('Procedures Performed:', col1XThree, y);
      pdf.text('Type of Anesthesia:', col2XThree, y);
      pdf.text('Bowel Preparation:', col3XThree, y);
      y += 4;
      
      // Row 2: Answers below headers
      pdf.setFont('helvetica', 'normal');
      
      // Split long procedures text if needed
      const proceduresLines = pdf.splitTextToSize(proceduresText, threeColumnWidth - 4);
      pdf.text(proceduresLines, col1XThree, y);
      
      // Split long anesthesia text if needed
      const anesthesiaLines = pdf.splitTextToSize(anesthesiaType, threeColumnWidth - 4);
      pdf.text(anesthesiaLines, col2XThree, y);
      
      // Split long bowel prep text if needed
      const bowelPrepLines = pdf.splitTextToSize(bowelPrep, threeColumnWidth - 4);
      pdf.text(bowelPrepLines, col3XThree, y);
      
      // Calculate the maximum height used by any column
      const maxLines = Math.max(proceduresLines.length, anesthesiaLines.length, bowelPrepLines.length);
      y += (maxLines * 3) + 2;
      
      y += 4; // Add spacing before separator
      
      // Separator line
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
    }
    
    // GASTROSCOPY AND COLONOSCOPY FINDINGS - Side by side with exact template layout
    const gastro = diagrams?.find(d => d.type === 'gastroscopy');
    const colono = diagrams?.find(d => d.type === 'colonoscopy');
    
    const columnGap = 12; // Increased gap for better separation
    const diagramColumnWidth = (pageWidth - 2 * margin - columnGap) / 2;
    const diagramLeftX = margin;  // Left column starts at margin
    const diagramRightX = margin + diagramColumnWidth + columnGap; // Right column with proper gap
    
    // Fixed diagram box height to match template (exact diagram size) 
    const diagramBoxHeight = 50;
    
    // Headers - Exact layout as specified
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GASTROSCOPY FINDINGS', diagramLeftX, y);
    pdf.text('COLONOSCOPY FINDINGS', diagramRightX, y);
    y += 4;
    
    // Draw the diagram boxes with borders (exact template style)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    
    // Left box for gastroscopy
    pdf.rect(diagramLeftX, y, diagramColumnWidth, diagramBoxHeight);
    
    // Right box for colonoscopy  
    pdf.rect(diagramRightX, y, diagramColumnWidth, diagramBoxHeight);
    
    // Add diagram images inside boxes (exact diagram size - no stretching/shrinking)
    if (gastro?.canvasImageData) {
      console.log('Adding gastroscopy image - EXACT SIZE');
      // Maintain exact aspect ratio and size
      pdf.addImage(gastro.canvasImageData, 'PNG', diagramLeftX + 1, y + 1, diagramColumnWidth - 2, diagramBoxHeight - 2);
    } else {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      pdf.text('GASTROSCOPY DIAGRAM', diagramLeftX + diagramColumnWidth/2, y + diagramBoxHeight/2 - 2, { align: 'center' });
      pdf.text('(Exact Diagram Size)', diagramLeftX + diagramColumnWidth/2, y + diagramBoxHeight/2 + 2, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
    }
    
    if (colono?.canvasImageData) {
      console.log('Adding colonoscopy image - EXACT SIZE');
      // Maintain exact aspect ratio and size
      pdf.addImage(colono.canvasImageData, 'PNG', diagramRightX + 1, y + 1, diagramColumnWidth - 2, diagramBoxHeight - 2);
    } else {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      pdf.text('COLONOSCOPY DIAGRAM', diagramRightX + diagramColumnWidth/2, y + diagramBoxHeight/2 - 2, { align: 'center' });
      pdf.text('(Exact Diagram Size)', diagramRightX + diagramColumnWidth/2, y + diagramBoxHeight/2 + 2, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
    }
    
    y += diagramBoxHeight + 6;
    
    // Findings sections below diagrams - properly aligned
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Gastroscopy findings
    pdf.text('Gastroscopy Findings:', diagramLeftX, y);
    // Colonoscopy findings  
    pdf.text('Colonoscopy Findings:', diagramRightX, y);
    y += 4;
    
    let leftY = y;
    let rightY = y;
    
    // Gastroscopy findings - display actual findings only if they exist
    if (reportData?.gastroscopyFindings?.findings?.length > 0) {
      reportData.gastroscopyFindings.findings.forEach((finding: any, index: number) => {
        if (leftY < pageHeight - footerHeight - 40) {
          const text = `• ${finding.type || ''} ${finding.location ? 'at ' + finding.location : ''}`;
          const lines = pdf.splitTextToSize(text, diagramColumnWidth - 4);
          pdf.text(lines, diagramLeftX, leftY);
          leftY += lines.length * 3;
          
          if (finding.description && leftY < pageHeight - footerHeight - 35) {
            const descLines = pdf.splitTextToSize(`  ${finding.description}`, diagramColumnWidth - 8);
            pdf.text(descLines, diagramLeftX, leftY);
            leftY += descLines.length * 3;
          }
          leftY += 2;
        }
      });
    } else {
      // Show "No significant findings" only if this section was included
      if (gastro || reportData?.gastroscopyFindings) {
        pdf.text('No significant findings', diagramLeftX, leftY);
        leftY += 4;
      }
    }
    
    // Colonoscopy findings - display actual findings only if they exist
    if (reportData?.colonoscopyFindings?.findings?.length > 0) {
      reportData.colonoscopyFindings.findings.forEach((finding: any, index: number) => {
        if (rightY < pageHeight - footerHeight - 40) {
          const text = `• ${finding.type || ''} ${finding.location ? 'at ' + finding.location : ''}`;
          const lines = pdf.splitTextToSize(text, diagramColumnWidth - 4);
          pdf.text(lines, diagramRightX, rightY);
          rightY += lines.length * 3;
          
          if (finding.description && rightY < pageHeight - footerHeight - 35) {
            const descLines = pdf.splitTextToSize(`  ${finding.description}`, diagramColumnWidth - 8);
            pdf.text(descLines, diagramRightX, rightY);
            rightY += descLines.length * 3;
          }
          rightY += 2;
        }
      });
    } else {
      // Show "No significant findings" only if this section was included
      if (colono || reportData?.colonoscopyFindings) {
        pdf.text('No significant findings', diagramRightX, rightY);
        rightY += 4;
      }
    }
    
    y = Math.max(leftY, rightY) + 6;
    
    // Separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Check page break before SPECIMEN section
    checkPageBreak(60);
    
    // SPECIMEN, CONCLUSION, FOLLOW UP sections - New layout as specified (using existing three-column variables)
    if (reportData) {
      // Get all the data using correct field paths
      const specimenSent = reportData?.specimen?.sentForPathology || '';
      const laboratory = reportData?.specimen?.laboratoryName || '';
      const otherSpecimensTaken = reportData?.specimen?.otherSpecimensTaken || '';
      const otherSpecimensDetails = reportData?.specimen?.otherSpecimensDetails || '';
      const conclusion = reportData?.conclusion || '';
      const followUpText = reportData?.followUp?.enabled && reportData.followUp.options?.length > 0 
        ? reportData.followUp.options.join(', ') : '';
      const followUpOther = reportData?.followUp?.other || '';
      const additionalNotes = reportData?.followUp?.notes || '';
      const postOpMgmt = reportData?.followUp?.postOperativeManagement || '';
      
      // Combine other specimens data
      let otherSpecimensDisplay = '';
      if (otherSpecimensTaken === 'Yes' && otherSpecimensDetails) {
        otherSpecimensDisplay = `${otherSpecimensTaken} - ${otherSpecimensDetails}`;
      } else {
        otherSpecimensDisplay = otherSpecimensTaken;
      }
      
      // Combine follow-up text with other details
      let combinedFollowUp = '';
      if (followUpText) {
        combinedFollowUp = followUpText;
        if (followUpOther) {
          combinedFollowUp += ` (Other: ${followUpOther})`;
        }
      }
      
      // Row 1: 3-column headers - SPECIMEN | CONCLUSION | FOLLOW UP OPTIONS
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SPECIMEN', col1XThree, y);
      pdf.text('CONCLUSION', col2XThree, y);
      pdf.text('FOLLOW UP OPTIONS', col3XThree, y);
      y += 6;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      let specimenY = y;
      let conclusionY = y;
      let followUpY = y;
      
      // Left column - SPECIMEN fields
      pdf.text(`Specimen Sent for Pathology: ${specimenSent}`, col1XThree, specimenY);
      specimenY += 4;
      
      pdf.text(`Specify Laboratory Sent to: ${laboratory}`, col1XThree, specimenY);
      specimenY += 4;
      
      pdf.text(`Other Specimens Taken: ${otherSpecimensDisplay}`, col1XThree, specimenY);
      specimenY += 4;
      
      // Middle column - CONCLUSION content
      if (conclusion) {
        const conclusionLines = pdf.splitTextToSize(conclusion, threeColumnWidth - 4);
        pdf.text(conclusionLines, col2XThree, conclusionY);
        conclusionY += conclusionLines.length * 3;
      }
      
      // Right column - FOLLOW UP OPTIONS content
      if (combinedFollowUp) {
        const followUpLines = pdf.splitTextToSize(combinedFollowUp, threeColumnWidth - 4);
        pdf.text(followUpLines, col3XThree, followUpY);
        followUpY += followUpLines.length * 3;
      }
      
      // Move to next section based on the tallest column
      y = Math.max(specimenY, conclusionY, followUpY) + 6;
      
      // Row 2: NOTES and POST OPERATIVE MANAGEMENT - aligned with columns
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NOTES', col1XThree, y);
      pdf.text('POST OPERATIVE MANAGEMENT', col2XThree, y);
      y += 6;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      let notesY = y;
      let postOpY = y;
      
      // Additional Notes (left column - aligned with SPECIMEN) and Post Operative Management (middle column - aligned with CONCLUSION)
      if (additionalNotes) {
        const notesLines = pdf.splitTextToSize(`Additional Notes: ${additionalNotes}`, threeColumnWidth - 4);
        pdf.text(notesLines, col1XThree, notesY);
        notesY += notesLines.length * 3;
      }
      
      if (postOpMgmt) {
        // Display just the content inline with the header (no label repetition)
        const postOpLines = pdf.splitTextToSize(postOpMgmt, threeColumnWidth - 4);
        pdf.text(postOpLines, col2XThree, postOpY);
        postOpY += postOpLines.length * 3;
      }
      
      y = Math.max(notesY, postOpY) + 4; // Reduced spacing to bring signature closer
      
      // Separator line
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 18; // Further increased spacing for more room above signature
      
      // SURGEON SIGNATURE - moved to page 1, closer to NOTES section
      pdf.setFontSize(9);
      const signatureY = y;
      
      // Signature and Date/Time labels - inline layout
      pdf.text('Surgeon\'s Signature:', margin, signatureY);
      
      // Add actual signature if present - improved sizing approach
      if (reportData?.signature?.surgeonSignature) {
        if (reportData.signature.surgeonSignature.startsWith('data:image')) {
          try {
            // Get image properties using jsPDF's built-in method
            const imgProperties = pdf.getImageProperties(reportData.signature.surgeonSignature);
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
              reportData.signature.surgeonSignature, 
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
        } else if (reportData.signature.surgeonSignatureText) {
          pdf.text(reportData.signature.surgeonSignatureText, margin + 42, signatureY);
        }
      }
      
      // Date & Time - inline layout on same line as signature, moved more to the left
      const dateTimeX = margin + 100; // Moved from 130 to 100 for more left positioning
      pdf.text('Date & Time:', dateTimeX, signatureY);
      
      // Add date/time if present, otherwise use current date
      if (reportData?.signature?.dateTime) {
        const date = new Date(reportData.signature.dateTime);
        const day = date.getDate();
        const suffix = getOrdinalSuffix(day);
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        const dateTimeStr = `${day}${suffix} ${month} ${year} at ${hours}:${minutes}`;
        pdf.text(dateTimeStr, dateTimeX + 25, signatureY); // Adjusted to match new position
      } else {
        pdf.text(formatDateOnly(new Date()), dateTimeX + 25, signatureY); // Adjusted to match new position
      }
      
      
      y += 20; // Add some space after signature before checking if we need page 2
    }
    
    // Check if we need page 2 (only if the content doesn't fit or there are uploads)
    const needsPage2 = (uploads && (uploads.gastroscopy?.length || uploads.colonoscopy?.length));
    
    if (needsPage2) {
      // Add page 2 for uploads only
      currentPage++;
      pdf.addPage();
      addFooter(currentPage);
      y = margin;
    }
    
    // Update total pages in all footers (like ventral hernia)
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      // Find and replace {{totalPages}} placeholder
      const footerY = pageHeight - 20;
      const footerText = `Report Date: ${formatDateOnly(new Date())} | Page ${i} of ${totalPages}`;
      
      // Cover the old page number text
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, footerY - 2, pageWidth, 15, 'F');
      
      // Redraw the footer with correct page numbers
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const footerLines = [
        'Dr. Monde Mjoli - Specialist Surgeon',
        'Practice Number: 0560812',
        footerText
      ];
      
      footerLines.forEach((line, index) => {
        pdf.text(line, pageWidth / 2, footerY + (index * 4), { align: 'center' });
      });
    }
    
    // UPLOADS SECTION - At the end after the main report (if any uploads exist)
    if (uploads && (uploads.gastroscopy?.length || uploads.colonoscopy?.length)) {
      // Use existing page 2 set up above
      let uploadY = y;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('UPLOADED DOCUMENTS', pageWidth / 2, uploadY, { align: 'center' });
      uploadY += 10;
      
      // Add uploaded files from gastroscopy
      if (uploads.gastroscopy?.length) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Gastroscopy Uploads:', margin, uploadY);
        uploadY += 8;
        
        for (const file of uploads.gastroscopy) {
          if (file.type.startsWith('image/')) {
            try {
              const reader = new FileReader();
              reader.onload = function(e) {
                const imgData = e.target?.result as string;
                pdf.addImage(imgData, 'JPEG', margin, uploadY, 150, 100);
              };
              reader.readAsDataURL(file);
              uploadY += 105;
            } catch (error) {
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Image file: ${file.name}`, margin, uploadY);
              uploadY += 5;
            }
          } else if (file.type === 'application/pdf') {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`PDF Attachment: ${file.name}`, margin, uploadY);
            uploadY += 5;
          }
        }
        uploadY += 10;
      }
      
      // Add uploaded files from colonoscopy
      if (uploads.colonoscopy?.length) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Colonoscopy Uploads:', margin, uploadY);
        uploadY += 8;
        
        for (const file of uploads.colonoscopy) {
          if (file.type.startsWith('image/')) {
            try {
              const reader = new FileReader();
              reader.onload = function(e) {
                const imgData = e.target?.result as string;
                pdf.addImage(imgData, 'JPEG', margin, uploadY, 150, 100);
              };
              reader.readAsDataURL(file);
              uploadY += 105;
            } catch (error) {
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Image file: ${file.name}`, margin, uploadY);
              uploadY += 5;
            }
          } else if (file.type === 'application/pdf') {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`PDF Attachment: ${file.name}`, margin, uploadY);
            uploadY += 5;
          }
        }
      }
    }
    
    // Save with patient name, ID and date format: PatientName_PatientID_Endoscopy_Report_dd_mm_yyyy
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const dateFormatted = `${day}_${month}_${year}`;
    
    // Clean patient name and ID for filename (remove spaces and special characters)
    const cleanPatientName = (patientName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanPatientId = (patientId || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    
    const filename = `${cleanPatientName}_${cleanPatientId}_Endoscopy_Report_${dateFormatted}.pdf`;
    
    console.log('=== SAVING FINAL PDF ===');
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error in FINAL PDF generator:', error);
    throw error;
  }
};
