import jsPDF from 'jspdf';

export interface FinalDiagramCapture {
  canvasImageData?: string;
  findings: any[];
  type: 'gastroscopy' | 'colonoscopy';
}

export const generateFinalPDF = async (
  patientName: string,
  patientId: string,
  diagrams?: FinalDiagramCapture[],
  reportData?: any
) => {
  try {
    console.log('=== GENERATING FINAL PDF (NEW VERSION) ===');
    console.log('Diagrams received:', diagrams);
    
    // Create PDF
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const footerHeight = 20;
    
    let y = margin;
    
    // HEADER - Matching live report exactly
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Endoscopy Documentation System', pageWidth / 2, y, { align: 'center' });
    y += 6;
    
    pdf.text('Dr. Mbulelo Renene', pageWidth / 2, y, { align: 'center' });
    y += 12;
    
    // Professional header layout
    const leftX = margin;
    const centerX = pageWidth / 2;
    const rightX = pageWidth - margin;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dr. Mbulelo Renene', leftX, y, { align: 'left' });
    pdf.text('ENDOSCOPY REPORT', centerX, y, { align: 'center' });
    pdf.text("St. Dominic's Medical Suites B", rightX, y, { align: 'right' });
    y += 5;
    
    pdf.setFontSize(9);
    pdf.text('Specialist Surgeon', leftX, y, { align: 'left' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-ZA')}`, centerX, y, { align: 'center' });
    pdf.text('56 St James Road, Southernwood', rightX, y, { align: 'right' });
    y += 4;
    
    pdf.setFontSize(8);
    pdf.text('MBChB (UNITRA), MMed (Surg) (Stell)', leftX, y, { align: 'left' });
    pdf.text('East London, 5201', rightX, y, { align: 'right' });
    y += 4;
    
    pdf.text('Practice No. 0263133', leftX, y, { align: 'left' });
    pdf.text('Tel: 043 743 7872', rightX, y, { align: 'right' });
    y += 4;
    
    pdf.text('Cell: 0832556934', leftX, y, { align: 'left' });
    pdf.text('Fax: 043 743 6653', rightX, y, { align: 'right' });
    y += 10;
    
    // Separator
    pdf.setDrawColor(128, 128, 128);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    // PATIENT INFORMATION
    if (reportData?.patientInfo) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION', margin, y);
      y += 6;
      
      const col1 = margin;
      const col2 = margin + (pageWidth - 2 * margin) / 3;
      const col3 = margin + 2 * (pageWidth - 2 * margin) / 3;
      
      pdf.setFontSize(9);
      
      // Row 1 labels
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient ID:', col1, y);
      pdf.text('Name:', col2, y);
      pdf.text('Age:', col3, y);
      y += 4;
      
      // Row 1 values
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.patientInfo.patientId || 'N/A', col1, y);
      pdf.text(reportData.patientInfo.name || 'Not specified', col2, y);
      pdf.text((reportData.patientInfo.age || 'N/A').toString(), col3, y);
      y += 6;
      
      // Row 2 labels
      pdf.setFont('helvetica', 'bold');
      pdf.text('Gender:', col1, y);
      pdf.text('Date:', col2, y);
      pdf.text('Contact:', col3, y);
      y += 4;
      
      // Row 2 values
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.patientInfo.gender || 'N/A', col1, y);
      const date = reportData.patientInfo.date 
        ? new Date(reportData.patientInfo.date).toLocaleDateString('en-ZA') 
        : 'N/A';
      pdf.text(date, col2, y);
      pdf.text(reportData.patientInfo.contactNumber || 'N/A', col3, y);
      y += 8;
    }
    
    // PROCEDURE INFORMATION - only indication and sedation
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCEDURE INFORMATION', margin, y);
    y += 6;
    
    if (reportData?.patientInfo) {
      const leftCol = margin;
      const rightCol = margin + (pageWidth - 2 * margin) / 2;
      
      pdf.setFontSize(9);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indication:', leftCol, y);
      pdf.text('Sedation:', rightCol, y);
      y += 4;
      
      pdf.setFont('helvetica', 'normal');
      const indication = reportData.patientInfo.indication || 'N/A';
      const sedation = reportData.patientInfo.sedation || 'N/A';
      
      const indicationLines = pdf.splitTextToSize(indication, (pageWidth - 2 * margin) / 2 - 5);
      pdf.text(indicationLines, leftCol, y);
      pdf.text(sedation, rightCol, y);
      y += Math.max(indicationLines.length * 4, 6) + 2;
    }
    
    // PROCEDURES PERFORMED
    if (reportData?.selectedProcedures && reportData.selectedProcedures.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROCEDURES PERFORMED', margin, y);
      y += 6;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const colWidth = (pageWidth - 2 * margin) / 3;
      const procedures = reportData.selectedProcedures;
      const itemsPerCol = Math.ceil(procedures.length / 3);
      
      let currentY = y;
      
      for (let col = 0; col < 3; col++) {
        const startIdx = col * itemsPerCol;
        const endIdx = Math.min(startIdx + itemsPerCol, procedures.length);
        const colX = margin + col * colWidth;
        let colY = currentY;
        
        for (let i = startIdx; i < endIdx; i++) {
          const procedure = procedures[i];
          pdf.text(`• ${procedure}`, colX, colY);
          colY += 4;
        }
      }
      
      y += Math.ceil(procedures.length / 3) * 4 + 6;
    }
    
    // Separator before diagrams
    pdf.setDrawColor(128, 128, 128);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    // SIDE-BY-SIDE DIAGRAMS - NO BORDERS
    const gastro = diagrams?.find(d => d.type === 'gastroscopy');
    const colono = diagrams?.find(d => d.type === 'colonoscopy');
    
    if (gastro || colono) {
      const columnGap = 8;
      const columnWidth = (pageWidth - 2 * margin - columnGap) / 2;
      const leftX = margin;
      const rightX = margin + columnWidth + columnGap;
      
      const remainingHeight = pageHeight - footerHeight - (y - margin);
      const headerHeight = 8;
      const imageHeight = Math.min(85, (remainingHeight - headerHeight - 40) * 0.6);
      const findingsHeight = remainingHeight - headerHeight - imageHeight - 10;
      
      // Headers with light background (NO BORDERS)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      
      pdf.setFillColor(248, 248, 248);
      pdf.rect(leftX, y, columnWidth, headerHeight, 'F');
      pdf.rect(rightX, y, columnWidth, headerHeight, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.text('GASTROSCOPY FINDINGS', leftX + columnWidth/2, y + 5.5, { align: 'center' });
      pdf.text('COLONOSCOPY FINDINGS', rightX + columnWidth/2, y + 5.5, { align: 'center' });
      y += headerHeight;
      
      // Images (NO BORDERS - keep original size)
      if (gastro?.canvasImageData) {
        console.log('Adding gastroscopy image - FINAL VERSION');
        pdf.addImage(gastro.canvasImageData, 'PNG', leftX, y, columnWidth, imageHeight);
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text('No gastroscopy diagram', leftX + columnWidth/2, y + imageHeight/2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
      
      if (colono?.canvasImageData) {
        console.log('Adding colonoscopy image - FINAL VERSION');
        pdf.addImage(colono.canvasImageData, 'PNG', rightX, y, columnWidth, imageHeight);
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text('No colonoscopy diagram', rightX + columnWidth/2, y + imageHeight/2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
      
      y += imageHeight;
      
      // Findings sections (NO BORDERS)
      const findingsBoxHeight = Math.max(findingsHeight, 40);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      let leftY = y + 5;
      let rightY = y + 5;
      const maxFindingsY = y + findingsBoxHeight - 3;
      
      // Gastroscopy findings
      if (gastro && reportData?.gastroscopyFindings?.findings?.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Findings:', leftX, leftY);
        pdf.setFont('helvetica', 'normal');
        leftY += 4;
        
        reportData.gastroscopyFindings.findings.forEach((finding: any, index: number) => {
          if (leftY > maxFindingsY - 8) return;
          
          const text = `• ${finding.type} at ${finding.location}`;
          const lines = pdf.splitTextToSize(text, columnWidth - 4);
          pdf.text(lines, leftX, leftY);
          leftY += lines.length * 3.5;
          
          if (finding.description && leftY < maxFindingsY - 6) {
            const descLines = pdf.splitTextToSize(`  ${finding.description}`, columnWidth - 8);
            pdf.text(descLines, leftX, leftY);
            leftY += descLines.length * 3.5;
          }
          leftY += 2;
        });
      } else {
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text('No gastroscopy findings recorded', leftX, leftY);
        pdf.setTextColor(0, 0, 0);
      }
      
      // Colonoscopy findings
      if (colono && reportData?.colonoscopyFindings?.findings?.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Findings:', rightX, rightY);
        pdf.setFont('helvetica', 'normal');
        rightY += 4;
        
        reportData.colonoscopyFindings.findings.forEach((finding: any, index: number) => {
          if (rightY > maxFindingsY - 8) return;
          
          const text = `• ${finding.type} at ${finding.location}`;
          const lines = pdf.splitTextToSize(text, columnWidth - 4);
          pdf.text(lines, rightX, rightY);
          rightY += lines.length * 3.5;
          
          if (finding.description && rightY < maxFindingsY - 6) {
            const descLines = pdf.splitTextToSize(`  ${finding.description}`, columnWidth - 8);
            pdf.text(descLines, rightX, rightY);
            rightY += descLines.length * 3.5;
          }
          rightY += 2;
        });
      } else {
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text('No colonoscopy findings recorded', rightX, rightY);
        pdf.setTextColor(0, 0, 0);
      }
      
      y += findingsBoxHeight + 5;
    }
    
    // Conclusion
    if (reportData?.conclusion && y < pageHeight - footerHeight - 15) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONCLUSION', margin, y);
      y += 6;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const conclusionLines = pdf.splitTextToSize(reportData.conclusion, pageWidth - 2 * margin);
      const availableSpace = pageHeight - footerHeight - y - 5;
      const linesForSpace = Math.floor(availableSpace / 4);
      const displayLines = conclusionLines.slice(0, linesForSpace);
      
      pdf.text(displayLines, margin, y);
      y += displayLines.length * 4 + 4;
    }
    
    // Follow-up
    if (reportData?.followUp?.enabled && y < pageHeight - footerHeight - 15) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FOLLOW-UP RECOMMENDATIONS', margin, y);
      y += 6;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      if (reportData.followUp.options && reportData.followUp.options.length > 0) {
        const followUpText = reportData.followUp.options.join(', ');
        const followUpLines = pdf.splitTextToSize(followUpText, pageWidth - 2 * margin);
        pdf.text(followUpLines, margin, y);
        y += followUpLines.length * 4 + 3;
      }
      
      if (reportData.followUp.other) {
        const otherLines = pdf.splitTextToSize(`Other: ${reportData.followUp.other}`, pageWidth - 2 * margin);
        pdf.text(otherLines, margin, y);
        y += otherLines.length * 4 + 3;
      }
      
      if (reportData.followUp.notes) {
        const notesLines = pdf.splitTextToSize(`Notes: ${reportData.followUp.notes}`, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, y);
        y += notesLines.length * 4;
      }
    }
    
    // FOOTER - Always at bottom
    const footerY = pageHeight - 18;
    pdf.setDrawColor(128, 128, 128);
    pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    pdf.text('Dr. Mbulelo Renene - Specialist Surgeon', pageWidth / 2, footerY + 2, { align: 'center' });
    pdf.text('Practice Number: 0263133', pageWidth / 2, footerY + 6, { align: 'center' });
    pdf.text(`Report Date: ${new Date().toLocaleDateString('en-ZA')} | Page 1 of 1`, pageWidth / 2, footerY + 10, { align: 'center' });
    
    // Save with unique timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `FINAL_Endoscopy_Report_${timestamp}.pdf`;
    
    console.log('=== SAVING FINAL PDF ===');
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error in FINAL PDF generator:', error);
    throw error;
  }
};