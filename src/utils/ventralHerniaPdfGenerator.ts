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

export const generateVentralHerniaPDF = async (
  patientName: string,
  patientId: string,
  diagrams: any[],
  ventralHerniaData: any
) => {
  try {
    console.log('=== GENERATING VENTRAL HERNIA PDF ===');
    console.log('Ventral hernia data received:', ventralHerniaData);
    
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
    
    // CENTER COLUMN - Report Title (positioned inline with Cell: 082 417 2630)
    let centerY = headerStartY + 17.5; // Position inline with Cell: line
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VENTRAL HERNIA REPAIR REPORT', pageWidth / 2, centerY, { align: 'center' });
    
    // Add underline for title
    const titleWidth = pdf.getTextWidth('VENTRAL HERNIA REPAIR REPORT');
    const titleX = (pageWidth - titleWidth) / 2;
    pdf.line(titleX, centerY + 1, titleX + titleWidth, centerY + 1);
    
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
    
    // Patient Information
    drawSection('PATIENT INFORMATION', () => {
      const patientInfo = ventralHerniaData?.patientInfo || {};
      const details = [
        `Name: ${patientInfo.name || patientName || 'Not specified'}`,
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
        if (index % 2 === 0 && index > 0) {
          y += 5;
        }
        const x = index % 2 === 0 ? margin : pageWidth / 2;
        pdf.text(detail, x, y);
      });
      
      // Add ASA Notes if present
      if (patientInfo.asaNotes) {
        y += 5;
        pdf.text(`ASA Notes: ${patientInfo.asaNotes}`, margin, y);
      }
      
      y += 10;
    });
    
    // Indications of Surgery
    if (ventralHerniaData?.preoperative?.indication?.length > 0) {
      drawSection('INDICATIONS OF SURGERY', () => {
        const indications = ventralHerniaData.preoperative.indication;
        pdf.text(`Indication for Surgery: ${indications.join(', ')}`, margin, y);
        y += 5;
        if (indications.includes('Other') && ventralHerniaData.preoperative.indicationOther) {
          pdf.text(`Other Indication: ${ventralHerniaData.preoperative.indicationOther}`, margin + 10, y);
          y += 5;
        }
        y += 5;
      });
    }
    
    // Preoperative Information
    drawSection('PREOPERATIVE INFORMATION', () => {
      const preop = ventralHerniaData?.preoperative || {};
      const lines = [
        `Surgeon: ${preop.surgeons?.filter(s => s.trim()).join(', ') || 'Not specified'}`,
        `Assistant 1: ${preop.assistant1 || 'Not specified'}`,
        `Assistant 2: ${preop.assistant2 || 'Not specified'}`,
        `Anaesthetist: ${preop.anaesthetist || 'Not specified'}`,
        `Duration: ${preop.duration || 'Not specified'} minutes`,
      ];
      
      lines.forEach(line => {
        checkPageBreak(5);
        pdf.text(line, margin, y);
        y += 5;
      });
      y += 5;
    });
    
    // Operative Findings
    if (ventralHerniaData?.operative) {
      drawSection('OPERATIVE FINDINGS', () => {
        const operative = ventralHerniaData.operative;
        
        if (operative.herniaType?.length > 0) {
          pdf.text(`Hernia Type: ${operative.herniaType.join(', ')}`, margin, y);
          y += 5;
          if (operative.herniaType.includes('Other') && operative.herniaTypeOther) {
            pdf.text(`Other Type: ${operative.herniaTypeOther}`, margin + 10, y);
            y += 5;
          }
        }
        
        if (operative.herniaSite?.length > 0) {
          pdf.text(`Site of Hernia: ${operative.herniaSite.join(', ')}`, margin, y);
          y += 5;
          if (operative.herniaSite.includes('Other') && operative.herniaSiteOther) {
            pdf.text(`Other Site: ${operative.herniaSiteOther}`, margin + 10, y);
            y += 5;
          }
        }
        
        if (operative.herniaDefects) {
          pdf.text(`Total Hernia Defect Size: ${operative.herniaDefects}`, margin, y);
          y += 5;
        }
        
        if (operative.numberOfDefects) {
          pdf.text(`Number of Defects: ${operative.numberOfDefects}`, margin, y);
          y += 5;
        }
        
        if (operative.contents?.length > 0) {
          pdf.text(`Contents: ${operative.contents.join(', ')}`, margin, y);
          y += 5;
          if (operative.contents.includes('Other') && operative.contentsOther) {
            pdf.text(`Other Contents: ${operative.contentsOther}`, margin + 10, y);
            y += 5;
          }
        }
        
        if (operative.strangulation) {
          pdf.text(`Strangulation/Ischaemia: ${operative.strangulation}`, margin, y);
          y += 5;
        }
        
        if (operative.meshInSitu) {
          pdf.text(`Mesh in Situ: ${operative.meshInSitu}`, margin, y);
          y += 5;
        }
        
        y += 5;
      });
    }
    
    // Operative Approach
    if (ventralHerniaData?.operative?.approach?.length > 0) {
      drawSection('OPERATIVE APPROACH', () => {
        const approach = ventralHerniaData.operative.approach;
        pdf.text(`Approach: ${approach.join(', ')}`, margin, y);
        y += 5;
        if (approach.includes('Other') && ventralHerniaData.operative.approachOther) {
          pdf.text(`Other Approach: ${ventralHerniaData.operative.approachOther}`, margin + 10, y);
          y += 5;
        }
        y += 5;
      });
    }
    
    // Procedure Details
    if (ventralHerniaData?.procedure) {
      drawSection('PROCEDURE DETAILS', () => {
        const procedure = ventralHerniaData.procedure;
        
        if (procedure.sacExcised) {
          pdf.text(`Sac Excised: ${procedure.sacExcised}`, margin, y);
          y += 5;
        }
        
        if (procedure.fatDissected) {
          pdf.text(`Pre-Peritoneal Fat Dissected Off Sheath: ${procedure.fatDissected}`, margin, y);
          y += 5;
        }
        
        if (procedure.defectClosed) {
          pdf.text(`Hernia Defect Closed: ${procedure.defectClosed}`, margin, y);
          y += 5;
          
          // Closure Technique (if Yes)
          if (procedure.defectClosed === 'Yes' && procedure.closureTechnique?.length > 0) {
            pdf.text(`Closure Technique: ${procedure.closureTechnique.join(', ')}`, margin + 10, y);
            y += 5;
            if (procedure.closureTechnique.includes('Other') && procedure.closureTechniqueOther) {
              pdf.text(`Other Technique: ${procedure.closureTechniqueOther}`, margin + 15, y);
              y += 5;
            }
            
            // Material Used for Closure
            if (procedure.closureMaterial?.length > 0) {
              pdf.text(`Material Used: ${procedure.closureMaterial.join(', ')}`, margin + 10, y);
              y += 5;
              if (procedure.closureMaterial.includes('Other') && procedure.closureMaterialOther) {
                pdf.text(`Other Material: ${procedure.closureMaterialOther}`, margin + 15, y);
                y += 5;
              }
            }
          }
        }
        
        if (procedure.repairType) {
          pdf.text(`Repair Type: ${procedure.repairType}`, margin, y);
          y += 5;
        }
        
        // Mesh Details (if applicable)
        if (procedure.meshType?.length > 0) {
          pdf.text(`Mesh Details:`, margin, y);
          y += 5;
          let meshTypesText = procedure.meshType.map((type) => {
            if (type === 'Other' && procedure.meshPlacementOther) {
              return `Other: ${procedure.meshPlacementOther}`;
            }
            return type;
          }).join(', ');
          pdf.text(`• Mesh Placement: ${meshTypesText}`, margin + 10, y);
          y += 5;
          if (procedure.meshMaterial?.length > 0) {
            let meshMaterialsText = procedure.meshMaterial.map((material) => {
              if (material === 'Other' && procedure.meshMaterialOther) {
                return `Other: ${procedure.meshMaterialOther}`;
              }
              return material;
            }).join(', ');
            pdf.text(`• Material: ${meshMaterialsText}`, margin + 10, y);
            y += 5;
          }
          if (procedure.meshLength || procedure.meshWidth) {
            pdf.text(`• Size: ${procedure.meshLength || '___'} x ${procedure.meshWidth || '___'} cm`, margin + 10, y);
            y += 5;
          }
          if (procedure.fixation?.length > 0) {
            pdf.text(`• Fixation: ${procedure.fixation.join(', ')}`, margin + 10, y);
            y += 5;
            if (procedure.fixation.includes('Other') && procedure.fixationOther) {
              pdf.text(`• Other Fixation: ${procedure.fixationOther}`, margin + 15, y);
              y += 5;
            }
          }
        }
        
        // Primary Tissue Repair (if applicable)
        if (procedure.primaryRepair?.length > 0) {
          pdf.text(`Primary Tissue Repair: ${procedure.primaryRepair.join(', ')}`, margin, y);
          y += 5;
          if (procedure.primaryRepair.includes('Other') && procedure.primaryRepairOther) {
            pdf.text(`Other Repair: ${procedure.primaryRepairOther}`, margin + 10, y);
            y += 5;
          }
        }
        
        // Intra-Operative Difficulty
        if (procedure.intraOperativeDifficulty?.length > 0) {
          let difficultyText = procedure.intraOperativeDifficulty.map((difficulty) => {
            if (difficulty === 'Other' && procedure.intraOperativeDifficultyOther) {
              return `Other: ${procedure.intraOperativeDifficultyOther}`;
            }
            return difficulty;
          }).join(', ');
          pdf.text(`Intra-Operative Difficulty: ${difficultyText}`, margin, y);
          y += 5;
        }
        
        // Complications
        if (procedure.complications?.length > 0) {
          let complicationsText = procedure.complications.map((comp) => {
            if (comp === 'Other' && procedure.complicationOther) {
              return `Other: ${procedure.complicationOther}`;
            }
            return comp;
          }).join(', ');
          pdf.text(`Intraoperative Complications: ${complicationsText}`, margin, y);
          y += 5;
        }
        
        y += 5;
      });
    }
    
    // Haemostasis & Closure
    drawSection('HAEMOSTASIS & CLOSURE', () => {
      const procedure = ventralHerniaData?.procedure || {};
      const closure = ventralHerniaData?.closure || {};
      
      if (procedure.haemostasis) {
        pdf.text(`Haemostasis: ${procedure.haemostasis}`, margin, y);
        y += 5;
      }
      
      if (procedure.drain) {
        pdf.text(`Drain: ${procedure.drain}`, margin, y);
        if (procedure.drain === 'Yes' && procedure.drainDetails) {
          pdf.text(` - ${procedure.drainDetails}`, margin + 50, y);
        }
        y += 5;
      }
      
      // Fascial Closure (now from procedure object)
      if (procedure.fascialClosure?.length > 0) {
        let fascialClosureText = procedure.fascialClosure.map((closure) => {
          if (closure === 'Other' && procedure.fascialClosureOther) {
            return `Other: ${procedure.fascialClosureOther}`;
          }
          return closure;
        }).join(', ');
        pdf.text(`Fascial Closure: ${fascialClosureText}`, margin, y);
        y += 5;
        
        // Material Used for Fascial Closure
        if (procedure.fascialClosureMaterial?.length > 0) {
          let fascialMaterialText = procedure.fascialClosureMaterial.map((material) => {
            if (material === 'Other' && procedure.fascialClosureMaterialOther) {
              return `Other: ${procedure.fascialClosureMaterialOther}`;
            }
            return material;
          }).join(', ');
          pdf.text(`Material Used: ${fascialMaterialText}`, margin + 10, y);
          y += 5;
        }
      }
      
      // Skin Closure (now from procedure object)
      if (procedure.skinClosure?.length > 0) {
        let skinClosureText = procedure.skinClosure.map((closure) => {
          if (closure === 'Other' && procedure.skinClosureOther) {
            return `Other: ${procedure.skinClosureOther}`;
          }
          return closure;
        }).join(', ');
        pdf.text(`Skin Closure: ${skinClosureText}`, margin, y);
        y += 5;
        
        // Material Used for Skin Closure
        if (procedure.skinClosureMaterial?.length > 0) {
          let skinMaterialText = procedure.skinClosureMaterial.map((material) => {
            if (material === 'Other' && procedure.skinClosureMaterialOther) {
              return `Other: ${procedure.skinClosureMaterialOther}`;
            }
            return material;
          }).join(', ');
          pdf.text(`Material Used: ${skinMaterialText}`, margin + 10, y);
          y += 5;
        }
      }
      
      if (closure.specimenSent?.length > 0) {
        pdf.text(`Specimen Sent: ${closure.specimenSent.join(', ')}`, margin, y);
        if (closure.specimenSent.includes('Other') && closure.specimenOther) {
          pdf.text(`Other Specimen: ${closure.specimenOther}`, margin + 10, y);
          y += 5;
        }
        y += 5;
      }
      
      y += 5;
    });
    
    // Additional Notes
    if (ventralHerniaData?.procedureFindings?.additionalNotes) {
      drawSection('ADDITIONAL NOTES', () => {
        const notes = ventralHerniaData.procedureFindings.additionalNotes;
        const splitLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin);
        splitLines.forEach((splitLine: string) => {
          checkPageBreak(5);
          pdf.text(splitLine, margin, y);
          y += 5;
        });
        y += 5;
      });
    }
    
    // Post-operative Management
    if (ventralHerniaData?.postoperativeManagement) {
      drawSection('POST-OPERATIVE MANAGEMENT', () => {
        const management = ventralHerniaData.postoperativeManagement;
        const splitLines = pdf.splitTextToSize(management, pageWidth - 2 * margin);
        splitLines.forEach((splitLine: string) => {
          checkPageBreak(5);
          pdf.text(splitLine, margin, y);
          y += 5;
        });
        y += 5;
      });
    }
    
    // Postoperative Instructions
    if (ventralHerniaData?.postoperative) {
      drawSection('POSTOPERATIVE INSTRUCTIONS', () => {
        const postop = ventralHerniaData.postoperative;
        const lines = [
          `Pain Management: ${postop.painManagement || 'Standard protocol'}`,
          `Activity Restrictions: ${postop.activityRestrictions || 'Standard protocol'}`,
          `Follow-up: ${postop.followUp || 'Standard protocol'}`,
        ];
        
        if (postop.specialInstructions) {
          lines.push(`Special Instructions: ${postop.specialInstructions}`);
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
    }
    
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
          '• Ileostomy: Dashed yellow/gold circles',
          '• Colostomy: Solid green circles', 
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
        
        // Make diagram smaller for PDF
        const maxWidth = (pageWidth - (margin * 2)) * 0.5; // Use 50% of page width
        const maxHeight = 60; // Reduced to make it more compact
        
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
    if (ventralHerniaData?.closure?.surgeonSignatureText) {
      // Use text signature if provided
      pdf.text(ventralHerniaData.closure.surgeonSignatureText, margin + 40, signatureY);
    } else if (ventralHerniaData?.closure?.surgeonSignature) {
      // If signature is a data URL (uploaded image), add it as image
      if (ventralHerniaData.closure.surgeonSignature.startsWith('data:image')) {
        try {
          pdf.addImage(ventralHerniaData.closure.surgeonSignature, 'JPEG', margin + 40, signatureY - 8, 80, 20);
        } catch (error) {
          console.error('Error adding signature image:', error);
          pdf.text('[Signature Image]', margin + 40, signatureY);
        }
      } else {
        // If it's text, display as text
        pdf.text(ventralHerniaData.closure.surgeonSignature, margin + 40, signatureY);
      }
    } else {
      pdf.line(margin + 40, signatureY, margin + 120, signatureY);
    }
    
    const dateTimeY = signatureY + 20;
    pdf.text('Date:', margin, dateTimeY);
    if (ventralHerniaData?.closure?.dateTime) {
      pdf.text(formatDateOnly(ventralHerniaData.closure.dateTime), margin + 30, dateTimeY);
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
