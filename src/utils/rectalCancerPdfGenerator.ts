import jsPDF from 'jspdf';
import appendectomyImage from '@/assets/appendectomy.jpg';
import { formatDateWithSuffix, formatReportDate, formatDateOnly } from './dateFormatter';
import { getFullASAText } from './asaDescriptions';
import { mapNewStructureToOld } from './rectalCancerPdfGeneratorMappings';

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
    
    // Map new structure to old structure for backward compatibility
    const mappedData = mapNewStructureToOld(rectalCancerData);
    
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
    pdf.text('RECTAL CANCER SURGERY REPORT', pageWidth / 2, centerY, { align: 'center' });
    
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
    
    // Case Identification
    drawSection('CASE IDENTIFICATION', () => {
      const details = [
        `Patient Name: ${patientInfo?.name || patientName || 'Not specified'}`,
        `Patient ID: ${patientInfo?.patientId || patientId || 'N/A'}`,
        `Date: ${mappedData?.caseIdentification?.date || rectalCancerData?.section1?.date || 'Not specified'}`,
        `Surgeon: ${mappedData?.caseIdentification?.surgeon || rectalCancerData?.section1?.surgeons?.[0] || 'Not specified'}`,
        `Assistant: ${mappedData?.caseIdentification?.assistant || rectalCancerData?.section1?.assistant1 || 'Not specified'}`
      ];
      
      details.forEach((detail, index) => {
        if (index % 2 === 0 && index > 0) {
          y += 5;
        }
        const x = index % 2 === 0 ? margin : pageWidth / 2;
        pdf.text(detail, x, y);
      });
      y += 10;
    });
    
    // Patient Demographics (Single Column)
    drawSection('PATIENT DEMOGRAPHICS', () => {
      const details = [
        `Date Of Birth: ${patientInfo?.dateOfBirth ? formatDateOnly(patientInfo.dateOfBirth) : 'Not specified'}`,
        `Age: ${patientInfo?.age || 'Not specified'}`,
        `Sex: ${patientInfo?.sex ? patientInfo.sex.charAt(0).toUpperCase() + patientInfo.sex.slice(1).toLowerCase() : 'Not specified'}`,
        `Weight: ${patientInfo?.weight ? patientInfo.weight + ' kg' : 'Not specified'}`,
        `Height: ${patientInfo?.height ? patientInfo.height + ' cm' : 'Not specified'}`,
        `BMI: ${patientInfo?.bmi || 'Not specified'}`,
        `ASA Score: ${patientInfo?.asaScore ? getFullASAText(patientInfo.asaScore) : 'Not specified'}`
      ];
      
      // Single column layout for patient info
      details.forEach((detail) => {
        pdf.text(detail, margin, y);
        y += 5;
      });
      
      // Add ASA Notes if present
      if (patientInfo?.asaNotes) {
        y += 2;
        pdf.text(`ASA Notes: ${patientInfo.asaNotes}`, margin, y);
        y += 5;
      }
      
      y += 5;
    });
    
    // Surgical Diagram (if available)
    if (diagrams && diagrams.length > 0) {
      checkPageBreak(100);
      drawSection('SURGICAL DIAGRAM', () => {
        // Create the surgical diagram with markings
        createSurgicalDiagramCanvas(diagrams).then(diagramDataUrl => {
          if (diagramDataUrl) {
            const imgWidth = 120;
            const imgHeight = 90;
            const imgX = (pageWidth - imgWidth) / 2;
            pdf.addImage(diagramDataUrl, 'PNG', imgX, y, imgWidth, imgHeight);
            y += imgHeight + 10;
          }
        });
        
        // Add markings legend if present
        const hasMarkings = diagrams.some(d => d.type);
        if (hasMarkings) {
          pdf.setFontSize(9);
          pdf.text('Markings:', margin, y);
          y += 5;
          
          const legendItems = [
            { type: 'port', label: 'Port Sites' },
            { type: 'stoma', label: 'Stoma Sites' },
            { type: 'incision', label: 'Incisions' }
          ];
          
          legendItems.forEach(item => {
            if (diagrams.some(d => d.type === item.type)) {
              pdf.text(`• ${item.label}`, margin + 5, y);
              y += 4;
            }
          });
          
          pdf.setFontSize(10);
          y += 5;
        }
      });
    }
    
    // Add separator line
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Two-column layout starts here
    checkPageBreak(80);
    const startY = y;
    const columnWidth = (pageWidth - 3 * margin) / 2;
    const leftColumnX = margin;
    const rightColumnX = margin + columnWidth + margin;
    
    // LEFT COLUMN - Preoperative & Surgical Details
    let leftY = startY;
    
    // Preoperative Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREOPERATIVE DETAILS', leftColumnX, leftY);
    leftY += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const preop = mappedData?.preoperativeDetails || {};
    const preopLines = [
      `Indication: ${preop.indication?.join(', ') || rectalCancerData?.section1?.indication?.join(', ') || 'Not specified'}`,
      `Tumor Location: ${preop.tumorLocation || 'Not specified'}`,
      `Staging: T${preop.preoperativeStaging?.tStage || 'x'}N${preop.preoperativeStaging?.nStage || 'x'}M${preop.preoperativeStaging?.mStage || 'x'}`,
      `Neoadjuvant Therapy: ${preop.neoadjuvantTherapy || 'Not specified'}`,
    ];
    
    if (preop.neoadjuvantTherapy === 'Yes') {
      if (preop.radiationDetails) {
        preopLines.push(`Radiation: ${preop.radiationDetails}`);
      }
      if (preop.chemotherapyRegimen) {
        preopLines.push(`Chemotherapy: ${preop.chemotherapyRegimen}`);
      }
    }
    
    preopLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, leftColumnX, leftY);
        leftY += 5;
      });
    });
    
    leftY += 5;
    
    // Surgical Approach (left column)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SURGICAL APPROACH', leftColumnX, leftY);
    leftY += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const approach = mappedData?.surgicalApproach || {};
    const approachLines = [
      `Approach: ${approach.approach || rectalCancerData?.section2?.approach?.join(', ') || 'Not specified'}`,
      `Resection Type: ${approach.resectionType || 'Not specified'}`,
    ];
    
    if (approach.conversionToOpen === 'Yes') {
      approachLines.push(`Converted to Open: Yes`);
      if (approach.conversionReason) {
        approachLines.push(`Reason: ${approach.conversionReason.join(', ')}`);
      }
    }
    
    approachLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, leftColumnX, leftY);
        leftY += 5;
      });
    });
    
    // RIGHT COLUMN - Intraoperative Findings & Resection Details
    let rightY1 = startY;
    
    // Intraoperative Findings
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTRAOPERATIVE FINDINGS', rightColumnX, rightY1);
    rightY1 += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const findings = mappedData?.intraoperativeFindings || {};
    const findingsLines = [
      `Tumor Site: ${findings.tumorSite || 'Not specified'}`,
      `Distance from AV: ${findings.distanceFromAnalVerge ? findings.distanceFromAnalVerge + ' cm' : 'N/S'}`,
      `Fixation: ${findings.fixation || 'Not specified'}`,
      `Adjacent Organ Invasion: ${findings.invasionToAdjacentOrgans || 'No'}`,
    ];
    
    if (findings.invasionToAdjacentOrgans === 'Yes' && findings.adjacentOrgansInvolved) {
      findingsLines.push(`Organs: ${findings.adjacentOrgansInvolved.join(', ')}`);
    }
    
    findingsLines.forEach(line => {
      const splitLines = pdf.splitTextToSize(line, columnWidth);
      splitLines.forEach((splitLine: string) => {
        pdf.text(splitLine, rightColumnX, rightY1);
        rightY1 += 5;
      });
    });
    
    rightY1 += 5;
    
    // Resection Details (right column)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESECTION DETAILS', rightColumnX, rightY1);
    rightY1 += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const resection = mappedData?.resectionDetails || {};
    const resectionLines = [
      `Vessel Ligation: ${resection.vesselLigation || 'Not specified'}`,
      `TME Quality: ${resection.mesorectalExcisionCompleteness || 'N/S'}`,
      `Margins: D${resection.distalMargin || '?'}cm C${resection.circumferentialMargin || '?'}mm`,
      `En Bloc: ${resection.enBlocResection || 'No'}`,
    ];
    
    resectionLines.forEach(line => {
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
    
    // Reconstruction Details (full width)
    drawSection('RECONSTRUCTION DETAILS', () => {
      const resection = mappedData?.resectionDetails || {};
      const lines = [
        `Vessel Ligation: ${resection.vesselLigation || 'Not specified'}`,
        `Mesorectal Excision Completeness: ${resection.mesorectalExcisionCompleteness || 'Not specified'}`,
        `Distal Margin: ${resection.distalMargin ? resection.distalMargin + ' cm' : 'Not specified'}`,
        `Circumferential Margin: ${resection.circumferentialMargin ? resection.circumferentialMargin + ' mm' : 'Not specified'}`,
        `En Bloc Resection: ${resection.enBlocResection || 'Not specified'}`,
      ];
      
      if (resection.enBlocResection === 'Yes' && resection.enBlocOrgans) {
        lines.push(`En Bloc Organs: ${resection.enBlocOrgans.join(', ')}`);
      }
      
      lines.push(`Anastomosis Performed: ${resection.anastomosisPerformed || 'Not specified'}`);
      
      if (resection.anastomosisPerformed === 'Yes') {
        lines.push(`Anastomosis Method: ${resection.anastomosisMethod || 'Not specified'}`);
        lines.push(`Anastomosis Level: ${resection.anastomosisLevel || 'Not specified'}`);
        lines.push(`Leak Test Performed: ${resection.leakTestPerformed || 'Not specified'}`);
        if (resection.leakTestPerformed === 'Yes') {
          lines.push(`Leak Test Result: ${resection.leakTestResult || 'Not specified'}`);
        }
      } else {
        lines.push(`End Stoma Created: ${resection.endStomaCreated || 'Not specified'}`);
      }
      
      lines.forEach(line => {
        checkPageBreak(5);
        const splitLines = pdf.splitTextToSize(line, pageWidth - 2 * margin);
        splitLines.forEach((splitLine: string) => {
          pdf.text(splitLine, margin, y);
          y += 5;
        });
      });
      y += 5;
    });
    
    // Perineal Details (for APR)
    if (mappedData?.surgicalApproach?.resectionType === 'Abdominoperineal Resection' && mappedData?.perinealDetails) {
      drawSection('PERINEAL PHASE DETAILS', () => {
        const perineal = mappedData.perinealDetails;
        const lines = [
          `Perineal Wound Closure: ${perineal.perinealWoundClosure || 'Not specified'}`,
          `Drains: ${perineal.drains || 'Not specified'}`,
          `Flap Used: ${perineal.flapUsed || 'Not specified'}`,
        ];
        
        if (perineal.flapUsed === 'Yes' && perineal.flapType) {
          lines.push(`Flap Type: ${perineal.flapType}`);
        }
        
        lines.forEach(line => {
          checkPageBreak(5);
          pdf.text(line, margin, y);
          y += 5;
        });
        y += 5;
      });
    }
    
    // Stoma Details
    if ((mappedData?.resectionDetails?.anastomosisPerformed === 'No' || 
         mappedData?.surgicalApproach?.resectionType === 'Abdominoperineal Resection' ||
         mappedData?.surgicalApproach?.resectionType === 'Hartmann\'s Procedure') && 
         mappedData?.stomaDetails) {
      drawSection('STOMA DETAILS', () => {
        const stoma = mappedData.stomaDetails;
        const lines = [
          `Stoma Type: ${stoma.stomaType || 'Not specified'}`,
          `Stoma Location: ${stoma.stomaLocation || 'Not specified'}`,
        ];
        
        if (stoma.coveringStoma) {
          lines.push(`Covering Stoma: ${stoma.coveringStoma}`);
        }
        
        lines.forEach(line => {
          checkPageBreak(5);
          pdf.text(line, margin, y);
          y += 5;
        });
        y += 5;
      });
    }
    
    // Specimen Handling
    drawSection('SPECIMEN HANDLING', () => {
      const specimen = mappedData?.specimenHandling || {};
      const lines = [
        `Specimen Orientation: ${specimen.specimenOrientation || 'Not specified'}`,
        `Specimen Labelling: ${specimen.specimenLabelling || 'Not specified'}`,
        `Sent to Histology: ${specimen.sentToHistology || 'Not specified'}`,
        `Resection Margins Marked: ${specimen.resectionMarginsMarked || 'Not specified'}`,
        `Ink Color Used: ${specimen.inkColorUsed || 'Not specified'}`,
        `Lymph Nodes Retrieved: ${specimen.lymphNodesRetrieved || 'Not specified'}`,
      ];
      
      lines.forEach(line => {
        checkPageBreak(5);
        const splitLines = pdf.splitTextToSize(line, pageWidth - 2 * margin);
        splitLines.forEach((splitLine: string) => {
          pdf.text(splitLine, margin, y);
          y += 5;
        });
      });
      y += 5;
    });
    
    // Postoperative Plan
    drawSection('POSTOPERATIVE PLAN', () => {
      const postop = mappedData?.postoperativePlan || {};
      const lines = [
        `Destination: ${postop.destination || 'Not specified'}`,
        `Analgesia Type: ${postop.analgesiaType || 'Not specified'}`,
        `Antibiotics: ${postop.antibiotics || 'Not specified'}`,
        `Follow-up Plan: ${postop.followUpPlan || 'Not specified'}`,
        `Intraoperative Complications: ${postop.intraopComplications || 'None'}`,
      ];
      
      if (postop.intraopComplications === 'Yes') {
        lines.push(`Complication Details: ${postop.complicationDetails || 'Not specified'}`);
        lines.push(`Clavien-Dindo Grade: ${postop.clavienDindoGrade || 'Not specified'}`);
      }
      
      lines.forEach(line => {
        checkPageBreak(5);
        const splitLines = pdf.splitTextToSize(line, pageWidth - 2 * margin);
        splitLines.forEach((splitLine: string) => {
          pdf.text(splitLine, margin, y);
          y += 5;
        });
      });
      y += 10;
    });
    
    // Legacy Section Data
    if (rectalCancerData?.section1 || rectalCancerData?.section2 || rectalCancerData?.section3 || rectalCancerData?.section4 || rectalCancerData?.section5) {
      drawSection('ADDITIONAL OPERATIVE DETAILS', () => {
        // Section 1 - Preoperative details
        if (rectalCancerData?.section1) {
          const s1 = rectalCancerData.section1;
          if (s1.indication?.length > 0) {
            pdf.text(`Indications: ${s1.indication.join(', ')}`, margin, y);
            y += 5;
          }
          if (s1.asaScore) {
            pdf.text(`ASA Score: ${getFullASAText(s1.asaScore)}`, margin, y);
            y += 5;
          }
          if (s1.antibiotic || s1.dvtProphylaxis || s1.bowelPrep || s1.position) {
            if (s1.antibiotic) pdf.text(`Antibiotic Prophylaxis: ${s1.antibiotic}`, margin, y), y += 5;
            if (s1.dvtProphylaxis) pdf.text(`DVT Prophylaxis: ${s1.dvtProphylaxis}`, margin, y), y += 5;
            if (s1.bowelPrep) pdf.text(`Bowel Preparation: ${s1.bowelPrep}`, margin, y), y += 5;
            if (s1.position) pdf.text(`Patient Position: ${s1.position}`, margin, y), y += 5;
          }
        }
        
        // Section 2 - Approach details
        if (rectalCancerData?.section2?.approach?.length > 0) {
          pdf.text(`Surgical Approaches: ${rectalCancerData.section2.approach.join(', ')}`, margin, y);
          y += 5;
        }
        
        // Section 3 - Mobilization details
        if (rectalCancerData?.section3) {
          const s3 = rectalCancerData.section3;
          if (s3.vesselLigation?.length > 0) {
            pdf.text(`Vessel Ligation: ${s3.vesselLigation.join(', ')}`, margin, y);
            y += 5;
          }
          if (s3.nervePreservation?.length > 0) {
            pdf.text(`Nerve Preservation: ${s3.nervePreservation.join(', ')}`, margin, y);
            y += 5;
          }
          if (s3.resectionType?.length > 0) {
            pdf.text(`Resection Types: ${s3.resectionType.join(', ')}`, margin, y);
            y += 5;
          }
        }
        
        // Section 4 - Reconstruction
        if (rectalCancerData?.section4) {
          const s4 = rectalCancerData.section4;
          if (s4.reconstructionType) {
            pdf.text(`Reconstruction Type: ${s4.reconstructionType}`, margin, y);
            y += 5;
          }
          if (s4.anastomosisMethod?.length > 0) {
            pdf.text(`Anastomosis Method: ${s4.anastomosisMethod.join(', ')}`, margin, y);
            y += 5;
          }
          if (s4.leakTest) {
            pdf.text(`Leak Test: ${s4.leakTest}`, margin, y);
            y += 5;
          }
          if (s4.protectiveStoma) {
            pdf.text(`Protective Stoma: ${s4.protectiveStoma}`, margin, y);
            y += 5;
          }
        }
        
        // Section 5 - Closure
        if (rectalCancerData?.section5) {
          const s5 = rectalCancerData.section5;
          if (s5.abdominalClosure?.length > 0) {
            pdf.text(`Abdominal Closure: ${s5.abdominalClosure.join(', ')}`, margin, y);
            y += 5;
          }
          if (s5.drainageTube) {
            pdf.text(`Drainage Tube: ${s5.drainageTube}`, margin, y);
            y += 5;
          }
          if (s5.skinClosure?.length > 0) {
            pdf.text(`Skin Closure: ${s5.skinClosure.join(', ')}`, margin, y);
            y += 5;
          }
          if (s5.woundDressing) {
            pdf.text(`Wound Dressing: ${s5.woundDressing}`, margin, y);
            y += 5;
          }
        }
        
        y += 5;
      });
    }
    
    // Procedure Findings - Additional Notes
    if (rectalCancerData?.procedureFindings?.additionalNotes) {
      drawSection('ADDITIONAL SURGICAL NOTES', () => {
        const notes = rectalCancerData.procedureFindings.additionalNotes;
        const splitLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin);
        splitLines.forEach((splitLine: string) => {
          checkPageBreak(5);
          pdf.text(splitLine, margin, y);
          y += 5;
        });
        y += 10;
      });
    }
    
    // Synoptic Summary
    drawSection('SYNOPTIC OPERATIVE SUMMARY', () => {
      const summary = generateSynopticSummary(rectalCancerData);
      const splitLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
      splitLines.forEach((splitLine: string) => {
        checkPageBreak(5);
        pdf.text(splitLine, margin, y);
        y += 5;
      });
      y += 10;
    });
    
    // Surgical Diagram Section
    if (diagrams && diagrams.length > 0) {
      checkPageBreak(80); // More space needed for image
      
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
        checkPageBreak(120); // Space for image
        
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
    checkPageBreak(40);
    drawSection('SURGEON\'S SIGNATURE & COMPLETION', () => {
      // Check for typed signature
      if (rectalCancerData?.closure?.surgeonSignatureText) {
        pdf.text(`Surgeon: ${rectalCancerData.closure.surgeonSignatureText}`, margin, y);
        y += 7;
      }
      
      // Check for uploaded signature
      if (rectalCancerData?.closure?.surgeonSignature) {
        checkPageBreak(30);
        try {
          // Add uploaded signature image
          pdf.addImage(rectalCancerData.closure.surgeonSignature, 'PNG', margin, y, 60, 20);
          y += 25;
        } catch (error) {
          console.error('Error adding signature to PDF:', error);
          pdf.text('Surgeon Signature:', margin, y);
          pdf.line(margin + 35, y, margin + 100, y);
          y += 10;
        }
      } else if (!rectalCancerData?.closure?.surgeonSignatureText) {
        // Default signature line
        pdf.text('Surgeon Signature:', margin, y);
        pdf.line(margin + 35, y, margin + 100, y);
        y += 10;
      }
      
      // Date/Time
      const dateTime = rectalCancerData?.closure?.dateTime || new Date().toISOString();
      pdf.text(`Date/Time: ${formatReportDate(new Date(dateTime))}`, margin, y);
      y += 5;
    });
    
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
    console.error('Error generating rectal cancer PDF:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
};

// Helper function to generate synoptic summary
const generateSynopticSummary = (rectalCancerData: any): string => {
  let summary = [];
  
  // Date and location
  if (rectalCancerData?.caseIdentification?.date) {
    summary.push(`On ${formatDateOnly(rectalCancerData.caseIdentification.date)}`);
  }
  
  // Surgical team
  if (rectalCancerData?.caseIdentification?.surgeon) {
    summary.push(`Dr. ${rectalCancerData.caseIdentification.surgeon}`);
    if (rectalCancerData?.caseIdentification?.assistant) {
      summary.push(`assisted by ${rectalCancerData.caseIdentification.assistant}`);
    }
  }
  
  
  summary.push('performed');
  
  // Procedure type
  if (rectalCancerData?.surgicalApproach?.resectionType) {
    summary.push(`a ${rectalCancerData.surgicalApproach.resectionType}`);
  } else if (rectalCancerData?.section3?.resectionType?.length > 0) {
    summary.push(`a ${rectalCancerData.section3.resectionType[0]}`);
  }
  
  // Surgical approach
  if (rectalCancerData?.surgicalApproach?.approach) {
    summary.push(`via ${rectalCancerData.surgicalApproach.approach.toLowerCase()} approach`);
  } else if (rectalCancerData?.section2?.approach?.length > 0) {
    summary.push(`via ${rectalCancerData.section2.approach[0].toLowerCase()} approach`);
  }
  
  // Indication
  const indication = rectalCancerData?.preoperativeDetails?.indication?.[0] || rectalCancerData?.section1?.indication?.[0];
  if (indication) {
    if (indication === 'Other' && (rectalCancerData?.preoperativeDetails?.indicationOther || rectalCancerData?.section1?.indicationOther)) {
      summary.push(`for ${rectalCancerData?.preoperativeDetails?.indicationOther || rectalCancerData?.section1?.indicationOther}`);
    } else {
      summary.push(`for ${indication.toLowerCase()}`);
    }
  }
  
  // Tumor location and distance
  if (rectalCancerData?.preoperativeDetails?.tumorLocation) {
    summary.push(`located in the ${rectalCancerData.preoperativeDetails.tumorLocation.toLowerCase()}`);
  }
  
  if (rectalCancerData?.intraoperativeFindings?.distanceFromAnalVerge) {
    summary.push(`${rectalCancerData.intraoperativeFindings.distanceFromAnalVerge}cm from the anal verge`);
  }
  
  // Staging
  const staging = rectalCancerData?.preoperativeDetails?.preoperativeStaging;
  if (staging && (staging.tStage || staging.nStage || staging.mStage)) {
    summary.push(`(staging: T${staging.tStage || 'x'}N${staging.nStage || 'x'}M${staging.mStage || 'x'})`);
  }
  
  // Neoadjuvant therapy
  if (rectalCancerData?.preoperativeDetails?.neoadjuvantTherapy === 'Yes') {
    summary.push(`following neoadjuvant therapy`);
    if (rectalCancerData?.preoperativeDetails?.radiationDetails || rectalCancerData?.preoperativeDetails?.chemotherapyRegimen) {
      const therapyDetails = [];
      if (rectalCancerData?.preoperativeDetails?.radiationDetails) {
        therapyDetails.push(rectalCancerData.preoperativeDetails.radiationDetails);
      }
      if (rectalCancerData?.preoperativeDetails?.chemotherapyRegimen) {
        therapyDetails.push(`${rectalCancerData.preoperativeDetails.chemotherapyRegimen} chemotherapy`);
      }
      summary.push(`(${therapyDetails.join(' with ')})`);
    }
  }
  
  // Conversion
  if (rectalCancerData?.surgicalApproach?.conversionToOpen === 'Yes') {
    const reasons = [...(rectalCancerData.surgicalApproach.conversionReason || [])];
    if (rectalCancerData?.surgicalApproach?.conversionReasonOther) {
      reasons.push(rectalCancerData.surgicalApproach.conversionReasonOther);
    }
    summary.push(`The procedure was converted to open due to ${reasons.join(', ') || 'unspecified reasons'}`);
  }
  
  // Intraoperative findings
  if (rectalCancerData?.intraoperativeFindings?.fixation) {
    summary.push(`The tumor was ${rectalCancerData.intraoperativeFindings.fixation.toLowerCase()}`);
  }
  
  if (rectalCancerData?.intraoperativeFindings?.invasionToAdjacentOrgans === 'Yes' && rectalCancerData?.intraoperativeFindings?.adjacentOrgansInvolved?.length > 0) {
    summary.push(`with invasion to ${rectalCancerData.intraoperativeFindings.adjacentOrgansInvolved.join(', ')}`);
  }
  
  // Metastatic disease
  const metastases = [];
  if (rectalCancerData?.intraoperativeFindings?.peritonealDeposits === 'Yes') {
    metastases.push('peritoneal deposits');
  }
  if (rectalCancerData?.intraoperativeFindings?.liverMetastasis === 'Yes') {
    metastases.push('liver metastasis');
  }
  if (metastases.length > 0) {
    summary.push(`Metastatic disease was found (${metastases.join(' and ')})`);
    if (rectalCancerData?.intraoperativeFindings?.biopsyTaken === 'Yes') {
      summary.push('and biopsies were taken');
    }
  }
  
  // Vessel ligation
  const vesselLigation = rectalCancerData?.resectionDetails?.vesselLigation || rectalCancerData?.section3?.vesselLigation?.[0];
  if (vesselLigation) {
    summary.push(`The inferior mesenteric vessels were ligated (${vesselLigation.toLowerCase()})`);
  }
  
  // Nerve preservation
  if (rectalCancerData?.section3?.nervePreservation?.length > 0) {
    summary.push(`with ${rectalCancerData.section3.nervePreservation.join(' and ').toLowerCase()}`);
  }
  
  // TME
  if (rectalCancerData?.resectionDetails?.mesorectalExcisionCompleteness) {
    summary.push(`${rectalCancerData.resectionDetails.mesorectalExcisionCompleteness} mesorectal excision was achieved`);
  }
  
  // Margins
  const margins = [];
  if (rectalCancerData?.resectionDetails?.distalMargin) {
    margins.push(`distal margin ${rectalCancerData.resectionDetails.distalMargin}cm`);
  }
  if (rectalCancerData?.resectionDetails?.circumferentialMargin) {
    margins.push(`CRM ${rectalCancerData.resectionDetails.circumferentialMargin}mm`);
  }
  if (margins.length > 0) {
    summary.push(`with ${margins.join(' and ')}`);
  }
  
  // En bloc resection
  if (rectalCancerData?.resectionDetails?.enBlocResection === 'Yes' && rectalCancerData?.resectionDetails?.enBlocOrgans?.length > 0) {
    summary.push(`En bloc resection included ${rectalCancerData.resectionDetails.enBlocOrgans.join(', ')}`);
  }
  
  // Anastomosis
  if (rectalCancerData?.resectionDetails?.anastomosisPerformed === 'Yes') {
    const method = rectalCancerData.resectionDetails.anastomosisMethod || rectalCancerData?.section4?.anastomosisMethod?.[0] || '';
    const level = rectalCancerData.resectionDetails.anastomosisLevel || 'anastomosis';
    summary.push(`A ${method} ${level} was performed`.trim());
    if (rectalCancerData?.resectionDetails?.leakTestPerformed === 'Yes') {
      const result = rectalCancerData.resectionDetails.leakTestResult || rectalCancerData?.section4?.leakTest || '';
      summary.push(`Leak test: ${result.toLowerCase() || 'performed'}`);
    }
  } else if (rectalCancerData?.resectionDetails?.endStomaCreated === 'Yes') {
    summary.push('No anastomosis was performed');
  }
  
  // Stoma
  if (rectalCancerData?.stomaDetails?.stomaType || rectalCancerData?.section4?.protectiveStoma === 'Yes') {
    const stomaType = rectalCancerData?.stomaDetails?.stomaType || 'protective stoma';
    const location = rectalCancerData?.stomaDetails?.stomaLocation || rectalCancerData?.section4?.stomaLocation;
    summary.push(`A ${stomaType} was created${location ? ` at ${location}` : ''}`);
  }
  
  // Perineal phase (for APR)
  if (rectalCancerData?.surgicalApproach?.resectionType === 'Abdominoperineal Resection' && rectalCancerData?.perinealDetails) {
    if (rectalCancerData.perinealDetails.perinealWoundClosure) {
      summary.push(`Perineal wound closed by ${rectalCancerData.perinealDetails.perinealWoundClosure}`);
    }
    if (rectalCancerData.perinealDetails.flapUsed === 'Yes' && rectalCancerData.perinealDetails.flapType) {
      summary.push(`with ${rectalCancerData.perinealDetails.flapType} flap`);
    }
  }
  
  // Specimen handling
  if (rectalCancerData?.specimenHandling?.sentToHistology === 'Yes') {
    const specimenDetails = [];
    if (rectalCancerData?.specimenHandling?.specimenOrientation) {
      specimenDetails.push('oriented');
    }
    if (rectalCancerData?.specimenHandling?.resectionMarginsMarked) {
      specimenDetails.push('margins marked');
      if (rectalCancerData?.specimenHandling?.inkColorUsed) {
        specimenDetails.push(`with ${rectalCancerData.specimenHandling.inkColorUsed} ink`);
      }
    }
    summary.push(`The specimen was ${specimenDetails.join(', ') || 'prepared'} and sent for histopathology`);
    if (rectalCancerData?.specimenHandling?.lymphNodesRetrieved) {
      summary.push(`(${rectalCancerData.specimenHandling.lymphNodesRetrieved} lymph nodes retrieved)`);
    }
  }
  
  // Closure (legacy)
  if (rectalCancerData?.section5?.abdominalClosure?.length > 0) {
    summary.push(`Abdominal closure: ${rectalCancerData.section5.abdominalClosure.join(', ')}`);
  }
  
  // Drains
  if (rectalCancerData?.perinealDetails?.drains || rectalCancerData?.section5?.drainageTube) {
    const drains = rectalCancerData?.perinealDetails?.drains || rectalCancerData?.section5?.drainageTube;
    summary.push(`Drains: ${drains}`);
  }
  
  // Complications
  if (rectalCancerData?.postoperativePlan?.intraopComplications === 'Yes' && rectalCancerData?.postoperativePlan?.complicationDetails) {
    summary.push(`Intraoperative complications: ${rectalCancerData.postoperativePlan.complicationDetails}`);
    if (rectalCancerData?.postoperativePlan?.clavienDindoGrade) {
      summary.push(`(Clavien-Dindo grade ${rectalCancerData.postoperativePlan.clavienDindoGrade})`);
    }
  }
  
  // Postoperative plan
  if (rectalCancerData?.postoperativePlan?.destination) {
    summary.push(`The patient was transferred to ${rectalCancerData.postoperativePlan.destination}`);
  }
  if (rectalCancerData?.postoperativePlan?.analgesiaType) {
    summary.push(`with ${rectalCancerData.postoperativePlan.analgesiaType} analgesia`);
  }
  
  return summary.filter(s => s).join('. ') + '.';
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