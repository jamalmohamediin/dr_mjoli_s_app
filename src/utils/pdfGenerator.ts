import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DiagramCapture {
  canvas?: HTMLCanvasElement;
  canvasImageData?: string;
  findings: any[];
  type: 'gastroscopy' | 'colonoscopy';
}

export const captureReportAsPDF = async (
  reportElement: HTMLElement | null,
  patientName: string,
  patientId: string,
  diagrams?: DiagramCapture[],
  reportData?: any
) => {
  try {
    // FORCE SINGLE PAGE - PORTRAIT A4
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 10;
    
    let y = margin;
    
    // === HEADER ===
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('ENDOSCOPY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Dr. Mbulelo Renene - Specialist Surgeon', pageWidth / 2, y, { align: 'center' });
    y += 6;
    
    // Patient info
    if (reportData) {
      const name = reportData.patientInfo?.name || 'Not specified';
      const id = reportData.patientInfo?.patientId || 'N/A';
      const date = reportData.patientInfo?.date ? new Date(reportData.patientInfo.date).toLocaleDateString('en-ZA') : 'N/A';
      
      pdf.setFontSize(9);
      pdf.text(`Patient: ${name} | ID: ${id} | Date: ${date}`, pageWidth / 2, y, { align: 'center' });
      y += 15;
    }
    
    // === DIAGRAMS SIDE BY SIDE ===
    const gastro = diagrams?.find(d => d.type === 'gastroscopy');
    const colono = diagrams?.find(d => d.type === 'colonoscopy');
    
    if (gastro || colono) {
      const colWidth = (pageWidth - 3 * margin) / 2; // Two columns
      const leftX = margin;
      const rightX = margin + colWidth + margin;
      const imgHeight = 60;
      
      // Headers
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('GASTROSCOPY', leftX + colWidth/2, y, { align: 'center' });
      pdf.text('COLONOSCOPY', rightX + colWidth/2, y, { align: 'center' });
      y += 8;
      
      // Images
      if (gastro?.canvasImageData) {
        pdf.addImage(gastro.canvasImageData, 'PNG', leftX, y, colWidth, imgHeight);
      }
      if (colono?.canvasImageData) {
        pdf.addImage(colono.canvasImageData, 'PNG', rightX, y, colWidth, imgHeight);
      }
      
      y += imgHeight + 8;
      
      // Findings under diagrams
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      
      let leftY = y;
      let rightY = y;
      
      // Gastroscopy findings
      if (gastro && reportData?.gastroscopyFindings?.findings) {
        reportData.gastroscopyFindings.findings.forEach((finding: any, i: number) => {
          const text = `${i + 1}. ${finding.type} at ${finding.location}`;
          const lines = pdf.splitTextToSize(text, colWidth - 4);
          pdf.text(lines, leftX + 2, leftY);
          leftY += lines.length * 3;
          
          if (finding.description) {
            const desc = pdf.splitTextToSize(`   ${finding.description}`, colWidth - 6);
            pdf.text(desc, leftX + 2, leftY);
            leftY += desc.length * 3;
          }
          leftY += 2;
        });
      }
      
      // Colonoscopy findings
      if (colono && reportData?.colonoscopyFindings?.findings) {
        reportData.colonoscopyFindings.findings.forEach((finding: any, i: number) => {
          const text = `${i + 1}. ${finding.type} at ${finding.location}`;
          const lines = pdf.splitTextToSize(text, colWidth - 4);
          pdf.text(lines, rightX + 2, rightY);
          rightY += lines.length * 3;
          
          if (finding.description) {
            const desc = pdf.splitTextToSize(`   ${finding.description}`, colWidth - 6);
            pdf.text(desc, rightX + 2, rightY);
            rightY += desc.length * 3;
          }
          rightY += 2;
        });
      }
      
      y = Math.max(leftY, rightY) + 10;
    }
    
    // === FOOTER ===
    const footerY = pageHeight - 20;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text('Dr. Mbulelo Renene - Specialist Surgeon', pageWidth / 2, footerY, { align: 'center' });
    pdf.text('Practice Number: 0263133', pageWidth / 2, footerY + 4, { align: 'center' });
    pdf.text(`Report Date: ${new Date().toLocaleDateString('en-ZA')}`, pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Save
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Endoscopy_Report_${timestamp}.pdf`;
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const saveDraft = (reportData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const draftKey = `endoscopy_draft_${timestamp}`;
    
    const draftData = {
      ...reportData,
      savedAt: timestamp,
    };
    
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('endoscopy_draft_'));
    if (allKeys.length > 10) {
      const sortedKeys = allKeys.sort();
      const keysToRemove = sortedKeys.slice(0, allKeys.length - 10);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    return draftKey;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error('Failed to save draft');
  }
};