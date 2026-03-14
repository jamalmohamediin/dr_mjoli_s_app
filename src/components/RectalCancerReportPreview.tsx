import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateOnly, formatDateWithSuffix, formatReportDate } from "@/utils/dateFormatter";
import { getFullASAText } from '@/utils/asaDescriptions';
import { getPatientInfoDisplayEntries } from "@/utils/patientSticker";

interface RectalCancerReportPreviewProps {
  report: {
    patientInfo?: {
      name?: string;
      patientId?: string;
      dateOfBirth?: string;
      age?: string;
      sex?: string;
      sexOther?: string;
      weight?: string;
      height?: string;
      bmi?: string;
      asaScore?: string;
      asaNotes?: string;
    };
    rectalCancer?: {
      patientInfo?: {
        name?: string;
        patientId?: string;
        dateOfBirth?: string;
        age?: string;
        sex?: string;
        sexOther?: string;
        weight?: string;
        height?: string;
        bmi?: string;
        asaScore?: string;
      };
      surgicalTeam?: {
        surgeons?: string[];
        assistants?: string[];
        anaesthetists?: string[];
        anaesthetist?: string;
      };
      operationType?: {
        type?: string[];
        operationFindings?: string;
        operationFindingsOptions?: string[];
        operationFindingsOther?: string;
        rectumOperationType?: string[];
        rectumOperationOther?: string;
        neoadjuvantTreatment?: string;
        radiationDetails?: string;
        chemotherapyRegimen?: string;
        resectionCompleteness?: string;
        staging?: {
          t?: string;
          n?: string;
          m?: string;
        };
      };
      findings?: {
        description?: string;
        location?: string[];
        tClassification?: string;
        nClassification?: string;
        mClassification?: string;
        mesorectalCompleteness?: string;
        completenessOfTumourResection?: string;
      };
      mobilizationAndResection?: {
        extentOfMobilization?: string[];
        extentOfMobilizationOther?: string;
        vesselLigation?: string[];
        enBlocResection?: string[];
      };
      reconstruction?: {
        reconstructionType?: string;
        anastomosisDetails?: {
          site?: string;
          configuration?: string;
          technique?: string;
          airLeakTest?: string;
        };
        stomaDetails?: {
          configuration?: string;
          reasonForStoma?: string[];
        };
      };
      operativeEvents?: {
        pointsOfDifficulty?: string[];
        intraoperativeComplications?: string[];
        intraoperativeEvents?: string[]; // Added
        specimenExtraction?: string; // Added
        specimenExtractionOther?: string; // Added
        specimenSentToLab?: string; // Added
        laboratoryName?: string; // Added
        drainInsertion?: string; // Added
        drainType?: string[]; // Added
      };
      closure?: {
        fascialClosure?: string[];
        fascialSutureMaterial?: string[];
        fascialSutureMaterialOther?: string;
        skinClosure?: string[];
        skinClosureMaterial?: string[];
        skinClosureMaterialOther?: string;
      };
      additionalInfo?: {
        additionalInformation?: string;
        postOperativeManagement?: string;
        surgeonSignatureText?: string;
        surgeonSignature?: string;
        dateTime?: string;
      };
      procedureDetails?: {
        operationDescription?: string;
        startTime?: string;
        endTime?: string;
        duration?: string;
        preoperativeImaging?: string[];
        preoperativeImagingOther?: string;
        procedureUrgency?: string;
      };
      procedureFindings?: {
        findings?: string;
        additionalNotes?: string;
      };
      // Case Identification
      caseIdentification?: {
        surgeon?: string;
        assistant?: string;
        anaesthetist?: string;
        hospital?: string;
        theatre?: string;
        date?: string;
        procedureType?: string; // This triggers branching logic
      };
      // Preoperative Details
      preoperativeDetails?: {
        indication?: string[];
        indicationOther?: string;
        tumorLocation?: string; // upper/mid/low rectum
        preoperativeStaging?: {
          mriStage?: string;
          ctStage?: string;
          tStage?: string;
          nStage?: string;
          mStage?: string;
        };
        neoadjuvantTherapy?: string; // Yes/No - triggers branching
        radiationDetails?: string;
        chemotherapyRegimen?: string;
      };
      // Surgical Approach
      surgicalApproach?: {
        approach?: string; // Open/Laparoscopic/Robotic
        primaryApproach?: string | string[];
        trocarNumber?: string;
        conversionToOpen?: string; // Yes/No - triggers branching
        conversionReason?: string[];
        conversionReasonOther?: string;
        resectionType?: string; // LAR/APR/Hartmann's/TME - triggers branching
      };
      // Intraoperative Findings
      intraoperativeFindings?: {
        tumorSite?: string;
        distanceFromAnalVerge?: string;
        fixation?: string; // Fixed/Mobile
        invasionToAdjacentOrgans?: string; // Yes/No - triggers branching
        adjacentOrgansInvolved?: string[];
        peritonealDeposits?: string; // Yes/No
        liverMetastasis?: string; // Yes/No - triggers branching
        metastasisOrgans?: string[];
        biopsyTaken?: string; // Yes/No
      };
      // Resection Details
      resectionDetails?: {
        vesselLigation?: string; // High tie/Low tie
        mesorectalExcisionCompleteness?: string;
        distalMargin?: string;
        circumferentialMargin?: string;
        enBlocResection?: string; // Yes/No - triggers branching
        enBlocOrgans?: string[];
        anastomosisPerformed?: string; // Yes/No - triggers branching
        anastomosisMethod?: string; // Hand-sewn/Stapled
        anastomosisLevel?: string; // Coloanal/Colorectal
        leakTestPerformed?: string; // Yes/No
        leakTestResult?: string;
        endStomaCreated?: string; // Yes/No
      };
      // Perineal/Stoma Details (conditional sections)
      perinealDetails?: {
        perinealWoundClosure?: string;
        drains?: string;
        flapUsed?: string; // Yes/No
        flapType?: string;
      };
      stomaDetails?: {
        stomaType?: string;
        stomaLocation?: string;
        coveringStoma?: string; // For LAR
      };
      // Specimen Handling
      specimenHandling?: {
        specimenOrientation?: string;
        specimenLabelling?: string;
        sentToHistology?: string; // Yes/No
        resectionMarginsMarked?: string;
        inkColorUsed?: string;
        lymphNodesRetrieved?: string;
      };
      // Postoperative Plan
      postoperativePlan?: {
        destination?: string; // ICU/Ward
        analgesiaType?: string;
        antibiotics?: string;
        followUpPlan?: string;
        intraopComplications?: string; // Yes/No - triggers branching
        complicationDetails?: string;
        clavienDindoGrade?: string;
      };
      // Legacy fields (for backward compatibility)
      section1?: any;
      section2?: any;
      section3?: any;
      section4?: any;
      section5?: any;
    };
  };
  onEditRectalCancerField?: (section: string, field: string, value: any) => void;
}

export const RectalCancerReportPreview = ({ report }: RectalCancerReportPreviewProps) => {
  const rectalCancer = report.rectalCancer;
  const rectalPatientEntries = getPatientInfoDisplayEntries(rectalCancer?.patientInfo);
  const legacyPatientEntries = getPatientInfoDisplayEntries(report.patientInfo);
  const primaryApproachList = Array.isArray(rectalCancer?.surgicalApproach?.primaryApproach)
    ? rectalCancer?.surgicalApproach?.primaryApproach || []
    : rectalCancer?.surgicalApproach?.primaryApproach
      ? [rectalCancer.surgicalApproach.primaryApproach]
      : [];
  const operationFindingsOptions = rectalCancer?.operationType?.operationFindingsOptions || [];
  const operationFindingsSelectionText = operationFindingsOptions
    .map((option) => {
      if (option === 'Other' && rectalCancer?.operationType?.operationFindingsOther?.trim()) {
        return `Other: ${rectalCancer.operationType.operationFindingsOther}`;
      }
      return option;
    })
    .join(', ');
  
  // Helper function to determine visibility based on branching logic
  const shouldShowSection = (section: string): boolean => {
    switch(section) {
      case 'radiationDetails':
        return rectalCancer?.preoperativeDetails?.neoadjuvantTherapy === 'Yes';
      case 'conversionReason':
        return rectalCancer?.surgicalApproach?.conversionToOpen === 'Yes';
      case 'metastasisDetails':
        return rectalCancer?.intraoperativeFindings?.liverMetastasis === 'Yes' || 
               rectalCancer?.intraoperativeFindings?.peritonealDeposits === 'Yes';
      case 'anastomosisDetails':
        return rectalCancer?.resectionDetails?.anastomosisPerformed === 'Yes';
      case 'stomaDetails':
        return rectalCancer?.resectionDetails?.anastomosisPerformed === 'No' || 
               rectalCancer?.surgicalApproach?.resectionType === 'APR' ||
               rectalCancer?.surgicalApproach?.resectionType === 'Hartmann\'s';
      case 'perinealDetails':
        return rectalCancer?.surgicalApproach?.resectionType === 'APR';
      case 'complicationDetails':
        return rectalCancer?.postoperativePlan?.intraopComplications === 'Yes';
      case 'enBlocDetails':
        return rectalCancer?.resectionDetails?.enBlocResection === 'Yes';
      case 'invasionDetails':
        return rectalCancer?.intraoperativeFindings?.invasionToAdjacentOrgans === 'Yes';
      default:
        return true;
    }
  };
  
  // Generate synoptic summary based on all the data
  const generateSynopticSummary = (): string => {
    const summary: string[] = [];
    
    // Date and location
    if (rectalCancer?.caseIdentification?.date) {
      summary.push(`On ${formatDateOnly(rectalCancer.caseIdentification.date)}`);
    }
    
    // Surgical team
    if (rectalCancer?.caseIdentification?.surgeon) {
      summary.push(`Dr. ${rectalCancer.caseIdentification.surgeon}`);
      if (rectalCancer?.caseIdentification?.assistant) {
        summary.push(`assisted by ${rectalCancer.caseIdentification.assistant}`);
      }
    }
    
    
    summary.push('performed');
    
    // Procedure type
    if (rectalCancer?.surgicalApproach?.resectionType) {
      summary.push(`a ${rectalCancer.surgicalApproach.resectionType}`);
    } else if (rectalCancer?.section3?.resectionType?.length > 0) {
      summary.push(`a ${rectalCancer.section3.resectionType[0]}`);
    }
    
    // Surgical approach
    if (rectalCancer?.surgicalApproach?.approach) {
      summary.push(`via ${rectalCancer.surgicalApproach.approach.toLowerCase()} approach`);
    } else if (rectalCancer?.section2?.approach?.length > 0) {
      summary.push(`via ${rectalCancer.section2.approach[0].toLowerCase()} approach`);
    }
    
    // Indication
    const indication = rectalCancer?.preoperativeDetails?.indication?.[0] || rectalCancer?.section1?.indication?.[0];
    if (indication) {
      if (indication === 'Other' && (rectalCancer?.preoperativeDetails?.indicationOther || rectalCancer?.section1?.indicationOther)) {
        summary.push(`for ${rectalCancer?.preoperativeDetails?.indicationOther || rectalCancer?.section1?.indicationOther}`);
      } else {
        summary.push(`for ${indication.toLowerCase()}`);
      }
    }
    
    // Tumor location and distance
    if (rectalCancer?.preoperativeDetails?.tumorLocation) {
      summary.push(`located in the ${rectalCancer.preoperativeDetails.tumorLocation.toLowerCase()}`);
    }
    
    if (rectalCancer?.intraoperativeFindings?.distanceFromAnalVerge) {
      summary.push(`${rectalCancer.intraoperativeFindings.distanceFromAnalVerge}cm from the anal verge`);
    }
    
    // Staging
    const staging = rectalCancer?.preoperativeDetails?.preoperativeStaging;
    if (staging && (staging.tStage || staging.nStage || staging.mStage)) {
      summary.push(`(staging: T${staging.tStage || 'x'}N${staging.nStage || 'x'}M${staging.mStage || 'x'})`);
    }
    
    // Neoadjuvant therapy
    if (rectalCancer?.preoperativeDetails?.neoadjuvantTherapy === 'Yes') {
      summary.push(`following neoadjuvant therapy`);
      if (rectalCancer?.preoperativeDetails?.radiationDetails || rectalCancer?.preoperativeDetails?.chemotherapyRegimen) {
        const therapyDetails: string[] = [];
        if (rectalCancer?.preoperativeDetails?.radiationDetails) {
          therapyDetails.push(rectalCancer.preoperativeDetails.radiationDetails);
        }
        if (rectalCancer?.preoperativeDetails?.chemotherapyRegimen) {
          therapyDetails.push(`${rectalCancer.preoperativeDetails.chemotherapyRegimen} chemotherapy`);
        }
        summary.push(`(${therapyDetails.join(' with ')})`);
      }
    }
    
    // Conversion
    if (rectalCancer?.surgicalApproach?.conversionToOpen === 'Yes') {
      const reasons = rectalCancer.surgicalApproach.conversionReason || [];
      if (rectalCancer?.surgicalApproach?.conversionReasonOther) {
        reasons.push(rectalCancer.surgicalApproach.conversionReasonOther);
      }
      summary.push(`The procedure was converted to open due to ${reasons.join(', ') || 'unspecified reasons'}`);
    }
    
    // Intraoperative findings
    if (rectalCancer?.intraoperativeFindings?.fixation) {
      summary.push(`The tumor was ${rectalCancer.intraoperativeFindings.fixation.toLowerCase()}`);
    }
    
    if (rectalCancer?.intraoperativeFindings?.invasionToAdjacentOrgans === 'Yes' && rectalCancer?.intraoperativeFindings?.adjacentOrgansInvolved?.length > 0) {
      summary.push(`with invasion to ${rectalCancer.intraoperativeFindings.adjacentOrgansInvolved.join(', ')}`);
    }
    
    // Metastatic disease
    const metastases: string[] = [];
    if (rectalCancer?.intraoperativeFindings?.peritonealDeposits === 'Yes') {
      metastases.push('peritoneal deposits');
    }
    if (rectalCancer?.intraoperativeFindings?.liverMetastasis === 'Yes') {
      metastases.push('liver metastasis');
    }
    if (metastases.length > 0) {
      summary.push(`Metastatic disease was found (${metastases.join(' and ')})`);
      if (rectalCancer?.intraoperativeFindings?.biopsyTaken === 'Yes') {
        summary.push('and biopsies were taken');
      }
    }
    
    // Vessel ligation
    const vesselLigation = rectalCancer?.resectionDetails?.vesselLigation || rectalCancer?.section3?.vesselLigation?.[0];
    if (vesselLigation) {
      summary.push(`The inferior mesenteric vessels were ligated (${vesselLigation.toLowerCase()})`);
    }
    
    // Nerve preservation
    if (rectalCancer?.section3?.nervePreservation?.length > 0) {
      summary.push(`with ${rectalCancer.section3.nervePreservation.join(' and ').toLowerCase()}`);
    }
    
    // TME
    if (rectalCancer?.resectionDetails?.mesorectalExcisionCompleteness) {
      summary.push(`${rectalCancer.resectionDetails.mesorectalExcisionCompleteness} mesorectal excision was achieved`);
    }
    
    // Margins
    const margins: string[] = [];
    if (rectalCancer?.resectionDetails?.distalMargin) {
      margins.push(`distal margin ${rectalCancer.resectionDetails.distalMargin}cm`);
    }
    if (rectalCancer?.resectionDetails?.circumferentialMargin) {
      margins.push(`CRM ${rectalCancer.resectionDetails.circumferentialMargin}mm`);
    }
    if (margins.length > 0) {
      summary.push(`with ${margins.join(' and ')}`);
    }
    
    // En bloc resection
    if (rectalCancer?.resectionDetails?.enBlocResection === 'Yes' && rectalCancer?.resectionDetails?.enBlocOrgans?.length > 0) {
      summary.push(`En bloc resection included ${rectalCancer.resectionDetails.enBlocOrgans.join(', ')}`);
    }
    
    // Anastomosis
    if (rectalCancer?.resectionDetails?.anastomosisPerformed === 'Yes') {
      const method = rectalCancer.resectionDetails.anastomosisMethod || rectalCancer?.section4?.anastomosisMethod?.[0] || '';
      const level = rectalCancer.resectionDetails.anastomosisLevel || 'anastomosis';
      summary.push(`A ${method} ${level} was performed`.trim());
      if (rectalCancer?.resectionDetails?.leakTestPerformed === 'Yes') {
        const result = rectalCancer.resectionDetails.leakTestResult || rectalCancer?.section4?.leakTest || '';
        summary.push(`Leak test: ${result.toLowerCase() || 'performed'}`);
      }
    } else if (rectalCancer?.resectionDetails?.endStomaCreated === 'Yes') {
      summary.push('No anastomosis was performed');
    }
    
    // Stoma
    if (rectalCancer?.stomaDetails?.stomaType || rectalCancer?.section4?.protectiveStoma === 'Yes') {
      const stomaType = rectalCancer?.stomaDetails?.stomaType || 'protective stoma';
      const location = rectalCancer?.stomaDetails?.stomaLocation || rectalCancer?.section4?.stomaLocation;
      summary.push(`A ${stomaType} was created${location ? ` at ${location}` : ''}`);
    }
    
    // Perineal phase (for APR)
    if (rectalCancer?.surgicalApproach?.resectionType === 'Abdominoperineal Resection' && rectalCancer?.perinealDetails) {
      if (rectalCancer.perinealDetails.perinealWoundClosure) {
        summary.push(`Perineal wound closed by ${rectalCancer.perinealDetails.perinealWoundClosure}`);
      }
      if (rectalCancer.perinealDetails.flapUsed === 'Yes' && rectalCancer.perinealDetails.flapType) {
        summary.push(`with ${rectalCancer.perinealDetails.flapType} flap`);
      }
    }
    
    // Specimen handling
    if (rectalCancer?.specimenHandling?.sentToHistology === 'Yes') {
      const specimenDetails: string[] = [];
      if (rectalCancer?.specimenHandling?.specimenOrientation) {
        specimenDetails.push('oriented');
      }
      if (rectalCancer?.specimenHandling?.resectionMarginsMarked) {
        specimenDetails.push('margins marked');
        if (rectalCancer?.specimenHandling?.inkColorUsed) {
          specimenDetails.push(`with ${rectalCancer.specimenHandling.inkColorUsed} ink`);
        }
      }
      summary.push(`The specimen was ${specimenDetails.join(', ') || 'prepared'} and sent for histopathology`);
      if (rectalCancer?.specimenHandling?.lymphNodesRetrieved) {
        summary.push(`(${rectalCancer.specimenHandling.lymphNodesRetrieved} lymph nodes retrieved)`);
      }
    }
    
    // Closure (legacy)
    if (rectalCancer?.section5?.abdominalClosure?.length > 0) {
      summary.push(`Abdominal closure: ${rectalCancer.section5.abdominalClosure.join(', ')}`);
    }
    
    // Drains
    if (rectalCancer?.perinealDetails?.drains || rectalCancer?.section5?.drainageTube) {
      const drains = rectalCancer?.perinealDetails?.drains || rectalCancer?.section5?.drainageTube;
      summary.push(`Drains: ${drains}`);
    }
    
    // Complications
    if (rectalCancer?.postoperativePlan?.intraopComplications === 'Yes' && rectalCancer?.postoperativePlan?.complicationDetails) {
      summary.push(`Intraoperative complications: ${rectalCancer.postoperativePlan.complicationDetails}`);
      if (rectalCancer?.postoperativePlan?.clavienDindoGrade) {
        summary.push(`(Clavien-Dindo grade ${rectalCancer.postoperativePlan.clavienDindoGrade})`);
      }
    }
    
    // Postoperative plan
    if (rectalCancer?.postoperativePlan?.destination) {
      summary.push(`The patient was transferred to ${rectalCancer.postoperativePlan.destination}`);
    }
    if (rectalCancer?.postoperativePlan?.analgesiaType) {
      summary.push(`with ${rectalCancer.postoperativePlan.analgesiaType} analgesia`);
    }
    
    return summary.filter(s => s).join('. ') + '.';
  };

  // Check if we have any data to show - updated for new structure
  const hasData = (
    report.patientInfo?.name ||
    rectalCancer?.patientInfo?.name ||
    rectalCancer?.surgicalTeam?.surgeons?.some(s => s?.trim()) ||
    rectalCancer?.operationType?.type?.length > 0 ||
    primaryApproachList.length > 0 ||
    rectalCancer?.findings?.description ||
    rectalCancer?.mobilizationAndResection?.vesselLigation?.length > 0 ||
    rectalCancer?.reconstruction?.reconstructionType ||
    rectalCancer?.operativeEvents?.pointsOfDifficulty?.length > 0 ||
    rectalCancer?.closure?.fascialClosure?.length > 0 ||
    rectalCancer?.additionalInfo?.additionalInformation ||
    // Legacy fields check
    rectalCancer?.section1?.surgeons?.some(s => s?.trim()) ||
    rectalCancer?.section1?.indication?.length > 0
  );

  if (!hasData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the colorectal resection form to see findings appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header matching PDF format */}
        <div className="border-b pb-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-xs">
            {/* Left Column - Doctor Info */}
            <div className="space-y-1">
              <p className="font-bold text-sm">Dr. Monde Mjoli</p>
              <p className="font-bold">Specialist Surgeon</p>
              <p>MBChB (UNITRA), MMed (UKZN), FCS(SA),</p>
              <p>Cert Gastroenterology, Surg (SA)</p>
              <p>Practice No. 0560812</p>
              <p>Cell: 082 417 2630</p>
            </div>
            
            {/* Center Column - Report Title */}
            <div className="text-center space-y-2">
              <h4 className="text-sm font-bold">COLORECTAL RESECTION REPORT</h4>
            </div>
            
            {/* Right Column - Practice Address */}
            <div className="text-right space-y-1">
              <p className="font-bold">St. Dominic's Medical Suites B</p>
              <p>56 St James Road, Southernwood</p>
              <p>East London, 5201</p>
              <p>Tel: 043 743 7872</p>
              <p>Fax: 043 743 6653</p>
            </div>
          </div>
        </div>
        
        {/* Patient Information Section */}
        {(rectalPatientEntries.length > 0 || rectalCancer?.surgicalTeam?.surgeons?.some(s => s?.trim())) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Patient Information</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {rectalPatientEntries.map((entry) => (
                <div key={entry.label} className={entry.fullWidth ? "col-span-2" : ""}>
                  <span className="font-medium">{entry.label}:</span> {entry.value}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Surgical Team */}
        {rectalCancer?.surgicalTeam?.surgeons?.some(s => s?.trim()) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Team</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {rectalCancer.surgicalTeam.surgeons.filter(s => s.trim()).length > 0 && (
                <div><span className="font-medium">Surgeon(s):</span> {rectalCancer.surgicalTeam.surgeons.filter(s => s.trim()).join(', ')}</div>
              )}
              {rectalCancer.surgicalTeam.assistants?.filter(a => a.trim()).length > 0 && (
                <div><span className="font-medium">Assistant(s):</span> {rectalCancer.surgicalTeam.assistants.filter(a => a.trim()).join(', ')}</div>
              )}
              {(rectalCancer.surgicalTeam.anaesthetists?.filter(a => a.trim()).length > 0 || rectalCancer.surgicalTeam.anaesthetist) && (
                <div><span className="font-medium">Anaesthetist(s):</span> {
                  rectalCancer.surgicalTeam.anaesthetists?.filter(a => a.trim()).length > 0 
                    ? rectalCancer.surgicalTeam.anaesthetists.filter(a => a.trim()).join(', ')
                    : rectalCancer.surgicalTeam.anaesthetist
                }</div>
              )}
            </div>
          </div>
        )}
        
        {/* Operation Description */}
        {rectalCancer?.procedureDetails?.operationDescription && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Operation Description</h5>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">
              {rectalCancer.procedureDetails.operationDescription}
            </p>
          </div>
        )}

        {/* Duration of Operation */}
        {(rectalCancer?.procedureDetails?.startTime || rectalCancer?.procedureDetails?.endTime || rectalCancer?.procedureDetails?.duration) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Duration of Operation</h5>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-700">
              {rectalCancer.procedureDetails.startTime && (
                <div><span className="font-medium">Start Time:</span> {rectalCancer.procedureDetails.startTime}</div>
              )}
              {rectalCancer.procedureDetails.endTime && (
                <div><span className="font-medium">End Time:</span> {rectalCancer.procedureDetails.endTime}</div>
              )}
              {rectalCancer.procedureDetails.duration && (
                <div><span className="font-medium">Total Duration:</span> {rectalCancer.procedureDetails.duration} minutes</div>
              )}
            </div>
          </div>
        )}

        {/* Preoperative Imaging */}
        {rectalCancer?.procedureDetails?.preoperativeImaging?.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Imaging</h5>
            <div className="flex flex-wrap gap-1">
              {rectalCancer.procedureDetails.preoperativeImaging.map((imaging, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {imaging === 'Other' && rectalCancer.procedureDetails.preoperativeImagingOther 
                    ? `Other: ${rectalCancer.procedureDetails.preoperativeImagingOther}` 
                    : imaging}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Procedure Details */}
        {rectalCancer?.procedureDetails?.procedureUrgency && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Procedure Details</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {rectalCancer.procedureDetails.procedureUrgency && (
                <div><span className="font-medium">Urgency:</span> {rectalCancer.procedureDetails.procedureUrgency}</div>
              )}
            </div>
          </div>
        )}
        
        {/* Indication for Surgery - Enhanced with comprehensive details */}
        {(rectalCancer?.operationType?.type?.length > 0 ||
          rectalCancer?.operationType?.operationFindingsOptions?.length > 0 ||
          rectalCancer?.operationType?.operationFindings ||
          rectalCancer?.operationType?.neoadjuvantTreatment ||
          rectalCancer?.findings?.description) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Indication for Surgery</h5>
            <div className="space-y-1 text-xs text-gray-700">
              {/* Operation Type */}
              {rectalCancer?.operationType?.type?.length > 0 && (
                <div><span className="font-medium">Operation Type:</span> {rectalCancer.operationType.type.join(', ')}</div>
              )}

              {(rectalCancer?.operationType?.type?.includes('Colon') || rectalCancer?.operationType?.type?.includes('Rectum')) &&
                operationFindingsSelectionText && (
                  <div className="ml-4">
                    <span className="font-medium">Operation Findings:</span> {operationFindingsSelectionText}
                  </div>
                )}

              {(rectalCancer?.operationType?.type?.includes('Colon') || rectalCancer?.operationType?.type?.includes('Rectum')) &&
                rectalCancer?.operationType?.operationFindings?.trim() && (
                  <div className="ml-4">
                    <span className="font-medium">Description of Operation Findings:</span> {rectalCancer.operationType.operationFindings}
                  </div>
                )}
              
              {/* Rectum Operation Types - show with bullet points when Rectum is selected */}
              {rectalCancer?.operationType?.type?.includes('Rectum') && rectalCancer?.operationType?.rectumOperationType?.length > 0 && (
                <div className="ml-4">
                  <span className="font-medium">Rectum Operation Types:</span>
                  <div className="ml-4 mt-1">
                    {rectalCancer.operationType.rectumOperationType.map((op, index) => (
                      <div key={index}>• {op}</div>
                    ))}
                    {rectalCancer.operationType.rectumOperationOther && (
                      <div>• Other: {rectalCancer.operationType.rectumOperationOther}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Neoadjuvant Treatment Details */}
              {rectalCancer?.operationType?.neoadjuvantTreatment === 'Yes' && (
                <div className="ml-4">
                  <span className="font-medium">Neoadjuvant Treatment:</span>
                  <div className="ml-4 mt-1">
                    {rectalCancer?.operationType?.radiationDetails && (
                      <div>• Radiation: {rectalCancer.operationType.radiationDetails}</div>
                    )}
                    {rectalCancer?.operationType?.chemotherapyRegimen && (
                      <div>• Chemotherapy: {rectalCancer.operationType.chemotherapyRegimen}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Tumor Classification */}
              {(rectalCancer?.operationType?.staging?.t || rectalCancer?.operationType?.staging?.n || rectalCancer?.operationType?.staging?.m) && (
                <div className="ml-4">
                  <span className="font-medium">Tumor Classification:</span>
                  <div className="ml-4 mt-1">
                    <div>T classification: {rectalCancer?.operationType?.staging?.t || 'Not specified'}</div>
                    <div>N classification: {rectalCancer?.operationType?.staging?.n || 'Not specified'}</div>
                    <div>M classification: {rectalCancer?.operationType?.staging?.m || 'Not specified'}</div>
                  </div>
                </div>
              )}
              
              {/* Completeness of Tumour Resection */}
              {rectalCancer?.operationType?.resectionCompleteness && (
                <div className="ml-4">
                  <span className="font-medium">Completeness of Tumour Resection:</span> {rectalCancer.operationType.resectionCompleteness}
                </div>
              )}
              
              {/* Findings Description */}
              {rectalCancer?.findings?.description && (
                <div className="ml-4">
                  <span className="font-medium">Findings:</span> {rectalCancer.findings.description}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Findings */}
        {(rectalCancer?.findings?.description || rectalCancer?.findings?.location?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Findings</h5>
            <div className="space-y-1 text-xs text-gray-700">
              {rectalCancer.findings.description && (
                <div><span className="font-medium">Description:</span> {rectalCancer.findings.description}</div>
              )}
              {rectalCancer.findings.location?.length > 0 && (
                <div><span className="font-medium">Location:</span> {rectalCancer.findings.location.join(', ')}</div>
              )}
              {(rectalCancer.findings.tClassification || rectalCancer.findings.nClassification || rectalCancer.findings.mClassification) && (
                <div><span className="font-medium">Staging:</span> T{rectalCancer.findings.tClassification || 'x'}N{rectalCancer.findings.nClassification || 'x'}M{rectalCancer.findings.mClassification || 'x'}</div>
              )}
              {rectalCancer.findings.mesorectalCompleteness && (
                <div><span className="font-medium">Mesorectal Completeness:</span> {rectalCancer.findings.mesorectalCompleteness}</div>
              )}
              {rectalCancer.findings.completenessOfTumourResection && (
                <div><span className="font-medium">Completeness of Tumour Resection:</span> {rectalCancer.findings.completenessOfTumourResection}</div>
              )}
            </div>
          </div>
        )}
        
        {/* Patient Information */}
        {legacyPatientEntries.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Patient Information</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {legacyPatientEntries.map((entry) => (
                <div key={entry.label} className={entry.fullWidth ? "col-span-2" : ""}>
                  <span className="font-medium">{entry.label}:</span> {entry.value}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Preoperative Details Section */}
        {(rectalCancer?.preoperativeDetails?.indication?.length > 0 || rectalCancer?.preoperativeDetails?.tumorLocation || rectalCancer?.preoperativeDetails?.neoadjuvantTherapy) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Preoperative Details</h5>
            {rectalCancer?.preoperativeDetails?.indication?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-gray-600">Indication:</span>
                {rectalCancer.preoperativeDetails.indication.map((ind, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {ind === 'Other' && rectalCancer.preoperativeDetails.indicationOther 
                      ? `Other: ${rectalCancer.preoperativeDetails.indicationOther}` 
                      : ind}
                  </Badge>
                ))}
              </div>
            )}
            {rectalCancer?.preoperativeDetails?.tumorLocation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Tumor Location:</span> {rectalCancer.preoperativeDetails.tumorLocation}
              </p>
            )}
            {rectalCancer?.preoperativeDetails?.preoperativeStaging && (
              <div className="text-xs text-gray-700">
                <span className="font-medium">Preoperative Staging:</span>
                <div className="ml-4 mt-1 space-y-0.5">
                  {rectalCancer.preoperativeDetails.preoperativeStaging.tStage && (
                    <div>T-stage: {rectalCancer.preoperativeDetails.preoperativeStaging.tStage}</div>
                  )}
                  {rectalCancer.preoperativeDetails.preoperativeStaging.nStage && (
                    <div>N-stage: {rectalCancer.preoperativeDetails.preoperativeStaging.nStage}</div>
                  )}
                  {rectalCancer.preoperativeDetails.preoperativeStaging.mStage && (
                    <div>M-stage: {rectalCancer.preoperativeDetails.preoperativeStaging.mStage}</div>
                  )}
                </div>
              </div>
            )}
            {rectalCancer?.preoperativeDetails?.neoadjuvantTherapy && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Neoadjuvant Therapy:</span> {rectalCancer.preoperativeDetails.neoadjuvantTherapy}
              </p>
            )}
            {shouldShowSection('radiationDetails') && rectalCancer?.preoperativeDetails?.radiationDetails && (
              <p className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Radiation Details:</span> {rectalCancer.preoperativeDetails.radiationDetails}
              </p>
            )}
            {shouldShowSection('radiationDetails') && rectalCancer?.preoperativeDetails?.chemotherapyRegimen && (
              <p className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Chemotherapy Regimen:</span> {rectalCancer.preoperativeDetails.chemotherapyRegimen}
              </p>
            )}
          </div>
        )}
        
        {/* Surgical Approach Section - New Structure */}
        {primaryApproachList.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Approach</h5>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Primary Approach:</span> {primaryApproachList.join(', ')}
            </p>
            {primaryApproachList.includes('Laparoscopic Converted To Open') && rectalCancer.surgicalApproach.conversionReason?.length > 0 && (
              <div className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Reason for Conversion:</span> {rectalCancer.surgicalApproach.conversionReason.join(', ')}
                {rectalCancer.surgicalApproach.conversionReasonOther && ` - ${rectalCancer.surgicalApproach.conversionReasonOther}`}
              </div>
            )}
            {rectalCancer.surgicalApproach.trocarNumber && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Trocar Number:</span> {rectalCancer.surgicalApproach.trocarNumber}
              </p>
            )}
          </div>
        )}
        
        {/* Mobilization and Resection */}
        {(rectalCancer?.mobilizationAndResection?.extentOfMobilization?.length > 0 || rectalCancer?.mobilizationAndResection?.vesselLigation?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Mobilization and Resection</h5>
            {rectalCancer.mobilizationAndResection.extentOfMobilization?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Extent of Mobilization:</span>{' '}
                {rectalCancer.mobilizationAndResection.extentOfMobilization
                  .map(item => {
                    if (item === 'Other' && rectalCancer.mobilizationAndResection.extentOfMobilizationOther) {
                      return `Other: ${rectalCancer.mobilizationAndResection.extentOfMobilizationOther}`;
                    }
                    return item;
                  })
                  .join(', ')}
              </p>
            )}
            {rectalCancer.mobilizationAndResection.vesselLigation?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Vessel Ligation:</span> {rectalCancer.mobilizationAndResection.vesselLigation.join(', ')}
              </p>
            )}
            {rectalCancer.mobilizationAndResection.enBlocResection?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">En-bloc Resection:</span> {rectalCancer.mobilizationAndResection.enBlocResection.join(', ')}
              </p>
            )}
          </div>
        )}
        
        {/* Reconstruction */}
        {rectalCancer?.reconstruction?.reconstructionType && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Reconstruction</h5>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Type:</span> {rectalCancer.reconstruction.reconstructionType}
            </p>
            {rectalCancer.reconstruction.reconstructionType === 'ANASTOMOSIS' && rectalCancer.reconstruction.anastomosisDetails && (
              <div className="text-xs text-gray-700 ml-4 space-y-1">
                {rectalCancer.reconstruction.anastomosisDetails.site && (
                  <div><span className="font-medium">Site:</span> {rectalCancer.reconstruction.anastomosisDetails.site}</div>
                )}
                {rectalCancer.reconstruction.anastomosisDetails.configuration && (
                  <div><span className="font-medium">Configuration:</span> {rectalCancer.reconstruction.anastomosisDetails.configuration}</div>
                )}
                {rectalCancer.reconstruction.anastomosisDetails.technique && (
                  <div><span className="font-medium">Technique:</span> {rectalCancer.reconstruction.anastomosisDetails.technique}</div>
                )}
                {rectalCancer.reconstruction.anastomosisDetails.airLeakTest && (
                  <div><span className="font-medium">Air Leak Test:</span> {rectalCancer.reconstruction.anastomosisDetails.airLeakTest}</div>
                )}
              </div>
            )}
            {rectalCancer.reconstruction.reconstructionType === 'STOMA' && rectalCancer.reconstruction.stomaDetails && (
              <div className="text-xs text-gray-700 ml-4 space-y-1">
                {rectalCancer.reconstruction.stomaDetails.configuration && (
                  <div><span className="font-medium">Configuration:</span> {rectalCancer.reconstruction.stomaDetails.configuration}</div>
                )}
                {rectalCancer.reconstruction.stomaDetails.reasonForStoma?.length > 0 && (
                  <div><span className="font-medium">Reason:</span> {rectalCancer.reconstruction.stomaDetails.reasonForStoma.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Operative Events */}
        {(rectalCancer?.operativeEvents?.pointsOfDifficulty?.length > 0 || rectalCancer?.operativeEvents?.intraoperativeEvents?.length > 0 || rectalCancer?.operativeEvents?.specimenExtraction || rectalCancer?.operativeEvents?.drainInsertion) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Operative Events</h5>
            {rectalCancer.operativeEvents.pointsOfDifficulty?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Points of Difficulty:</span> {rectalCancer.operativeEvents.pointsOfDifficulty.join(', ')}
              </p>
            )}
            {rectalCancer.operativeEvents.intraoperativeEvents?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Intraoperative Events:</span> {rectalCancer.operativeEvents.intraoperativeEvents.join(', ')}
              </p>
            )}
            {rectalCancer.operativeEvents.specimenExtraction && (
              <div className="text-xs text-gray-700">
                <div><span className="font-medium">Specimen Extraction Site:</span> {rectalCancer.operativeEvents.specimenExtraction}</div>
                {rectalCancer.operativeEvents.specimenExtraction === 'Other' && rectalCancer.operativeEvents.specimenExtractionOther && (
                  <div className="ml-4">Other: {rectalCancer.operativeEvents.specimenExtractionOther}</div>
                )}
                {rectalCancer.operativeEvents.specimenSentToLab && (
                  <div className="ml-4">
                    <span className="font-medium">Specimen Sent to Laboratory:</span> {rectalCancer.operativeEvents.specimenSentToLab}
                    {rectalCancer.operativeEvents.specimenSentToLab === 'Yes' && rectalCancer.operativeEvents.laboratoryName && (
                      <div className="ml-4">Laboratory: {rectalCancer.operativeEvents.laboratoryName}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {rectalCancer.operativeEvents.drainInsertion && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Drain Insertion:</span> {rectalCancer.operativeEvents.drainInsertion}
                {rectalCancer.operativeEvents.drainType?.length > 0 && ` - Type: ${rectalCancer.operativeEvents.drainType.join(', ')}`}
              </p>
            )}
          </div>
        )}
        
        {/* Closure */}
        {(rectalCancer?.closure?.fascialClosure?.length > 0 || rectalCancer?.closure?.skinClosure?.length > 0) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Closure</h5>
            {rectalCancer.closure.fascialClosure?.length > 0 && (
              <div className="text-xs text-gray-700">
                <div><span className="font-medium">Fascial Closure:</span> {rectalCancer.closure.fascialClosure.join(', ')}</div>
                {rectalCancer.closure.fascialSutureMaterial?.length > 0 && (
                  <div className="ml-4"><span className="font-medium">Suture Material:</span> {rectalCancer.closure.fascialSutureMaterial.join(', ')}</div>
                )}
                {rectalCancer.closure.fascialSutureMaterialOther && (
                  <div className="ml-4"><span className="font-medium">Other Suture Material:</span> {rectalCancer.closure.fascialSutureMaterialOther}</div>
                )}
              </div>
            )}
            {rectalCancer.closure.skinClosure?.length > 0 && (
              <div className="text-xs text-gray-700">
                <div><span className="font-medium">Skin Closure:</span> {rectalCancer.closure.skinClosure.join(', ')}</div>
                {rectalCancer.closure.skinClosureMaterial?.length > 0 && (
                  <div className="ml-4"><span className="font-medium">Material/Method:</span> {rectalCancer.closure.skinClosureMaterial.join(', ')}</div>
                )}
                {rectalCancer.closure.skinClosureMaterialOther && (
                  <div className="ml-4"><span className="font-medium">Other Material:</span> {rectalCancer.closure.skinClosureMaterialOther}</div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Additional Information */}
        {(rectalCancer?.additionalInfo?.additionalInformation || rectalCancer?.additionalInfo?.postOperativeManagement) && (
          <div className="space-y-4 mt-4">
            {rectalCancer.additionalInfo.additionalInformation && (
              <div>
                <h5 className="text-xs font-medium text-gray-600">Additional Notes</h5>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{rectalCancer.additionalInfo.additionalInformation}</p>
              </div>
            )}
            {rectalCancer.additionalInfo.postOperativeManagement && (
              <div>
                <h5 className="text-xs font-medium text-gray-600">Post-operative Management</h5>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{rectalCancer.additionalInfo.postOperativeManagement}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Old Structure - Surgical Approach Section */}
        {(rectalCancer?.surgicalApproach?.approach || rectalCancer?.surgicalApproach?.resectionType) && primaryApproachList.length === 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Approach</h5>
            {rectalCancer?.surgicalApproach?.approach && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Approach:</span> {rectalCancer.surgicalApproach.approach}
              </p>
            )}
            {rectalCancer?.surgicalApproach?.conversionToOpen === 'Yes' && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Conversion to Open:</span> Yes
              </p>
            )}
            {shouldShowSection('conversionReason') && rectalCancer?.surgicalApproach?.conversionReason?.length > 0 && (
              <div className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Conversion Reason:</span> {rectalCancer.surgicalApproach.conversionReason.join(', ')}
              </div>
            )}
            {rectalCancer?.surgicalApproach?.resectionType && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Resection Type:</span> {rectalCancer.surgicalApproach.resectionType}
              </p>
            )}
          </div>
        )}
        
        {/* Intraoperative Findings Section */}
        {(rectalCancer?.intraoperativeFindings?.tumorSite || rectalCancer?.intraoperativeFindings?.distanceFromAnalVerge) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Intraoperative Findings</h5>
            {rectalCancer?.intraoperativeFindings?.tumorSite && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Tumor Site:</span> {rectalCancer.intraoperativeFindings.tumorSite}
              </p>
            )}
            {rectalCancer?.intraoperativeFindings?.distanceFromAnalVerge && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Distance from Anal Verge:</span> {rectalCancer.intraoperativeFindings.distanceFromAnalVerge} cm
              </p>
            )}
            {rectalCancer?.intraoperativeFindings?.fixation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Fixation:</span> {rectalCancer.intraoperativeFindings.fixation}
              </p>
            )}
            {rectalCancer?.intraoperativeFindings?.invasionToAdjacentOrgans && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Invasion to Adjacent Organs:</span> {rectalCancer.intraoperativeFindings.invasionToAdjacentOrgans}
              </p>
            )}
            {shouldShowSection('invasionDetails') && rectalCancer?.intraoperativeFindings?.adjacentOrgansInvolved?.length > 0 && (
              <div className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Organs Involved:</span> {rectalCancer.intraoperativeFindings.adjacentOrgansInvolved.join(', ')}
              </div>
            )}
            {rectalCancer?.intraoperativeFindings?.liverMetastasis === 'Yes' && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Liver Metastasis:</span> Present
              </p>
            )}
            {shouldShowSection('metastasisDetails') && rectalCancer?.intraoperativeFindings?.metastasisOrgans?.length > 0 && (
              <div className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Metastasis to:</span> {rectalCancer.intraoperativeFindings.metastasisOrgans.join(', ')}
              </div>
            )}
            {shouldShowSection('metastasisDetails') && rectalCancer?.intraoperativeFindings?.biopsyTaken && (
              <p className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Biopsy Taken:</span> {rectalCancer.intraoperativeFindings.biopsyTaken}
              </p>
            )}
          </div>
        )}
        
        {/* Resection Details Section */}
        {(rectalCancer?.resectionDetails?.vesselLigation || rectalCancer?.resectionDetails?.mesorectalExcisionCompleteness) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Resection Details</h5>
            {rectalCancer?.resectionDetails?.vesselLigation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Vessel Ligation:</span> {rectalCancer.resectionDetails.vesselLigation}
              </p>
            )}
            {rectalCancer?.resectionDetails?.mesorectalExcisionCompleteness && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Mesorectal Excision:</span> {rectalCancer.resectionDetails.mesorectalExcisionCompleteness}
              </p>
            )}
            {rectalCancer?.resectionDetails?.distalMargin && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Distal Margin:</span> {rectalCancer.resectionDetails.distalMargin} cm
              </p>
            )}
            {rectalCancer?.resectionDetails?.circumferentialMargin && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Circumferential Margin:</span> {rectalCancer.resectionDetails.circumferentialMargin} mm
              </p>
            )}
            {rectalCancer?.resectionDetails?.enBlocResection && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">En Bloc Resection:</span> {rectalCancer.resectionDetails.enBlocResection}
              </p>
            )}
            {shouldShowSection('enBlocDetails') && rectalCancer?.resectionDetails?.enBlocOrgans?.length > 0 && (
              <div className="text-xs text-gray-700 ml-4">
                <span className="font-medium">En Bloc Organs:</span> {rectalCancer.resectionDetails.enBlocOrgans.join(', ')}
              </div>
            )}
            {rectalCancer?.resectionDetails?.anastomosisPerformed && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Anastomosis Performed:</span> {rectalCancer.resectionDetails.anastomosisPerformed}
              </p>
            )}
            {shouldShowSection('anastomosisDetails') && (
              <>
                {rectalCancer?.resectionDetails?.anastomosisMethod && (
                  <p className="text-xs text-gray-700 ml-4">
                    <span className="font-medium">Method:</span> {rectalCancer.resectionDetails.anastomosisMethod}
                  </p>
                )}
                {rectalCancer?.resectionDetails?.anastomosisLevel && (
                  <p className="text-xs text-gray-700 ml-4">
                    <span className="font-medium">Level:</span> {rectalCancer.resectionDetails.anastomosisLevel}
                  </p>
                )}
                {rectalCancer?.resectionDetails?.leakTestPerformed && (
                  <p className="text-xs text-gray-700 ml-4">
                    <span className="font-medium">Leak Test:</span> {rectalCancer.resectionDetails.leakTestPerformed}
                    {rectalCancer.resectionDetails.leakTestPerformed === 'Yes' && rectalCancer.resectionDetails.leakTestResult && 
                      ` - ${rectalCancer.resectionDetails.leakTestResult}`}
                  </p>
                )}
              </>
            )}
            {rectalCancer?.resectionDetails?.endStomaCreated && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">End Stoma Created:</span> {rectalCancer.resectionDetails.endStomaCreated}
              </p>
            )}
          </div>
        )}
        
        {/* Perineal Details (for APR) */}
        {shouldShowSection('perinealDetails') && rectalCancer?.perinealDetails && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Perineal Phase Details</h5>
            {rectalCancer?.perinealDetails?.perinealWoundClosure && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Perineal Wound Closure:</span> {rectalCancer.perinealDetails.perinealWoundClosure}
              </p>
            )}
            {rectalCancer?.perinealDetails?.drains && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Drains:</span> {rectalCancer.perinealDetails.drains}
              </p>
            )}
            {rectalCancer?.perinealDetails?.flapUsed && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Flap Used:</span> {rectalCancer.perinealDetails.flapUsed}
                {rectalCancer.perinealDetails.flapUsed === 'Yes' && rectalCancer.perinealDetails.flapType && 
                  ` - ${rectalCancer.perinealDetails.flapType}`}
              </p>
            )}
          </div>
        )}
        
        {/* Stoma Details */}
        {shouldShowSection('stomaDetails') && rectalCancer?.stomaDetails && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Stoma Details</h5>
            {rectalCancer?.stomaDetails?.stomaType && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Stoma Type:</span> {rectalCancer.stomaDetails.stomaType}
              </p>
            )}
            {rectalCancer?.stomaDetails?.stomaLocation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Stoma Location:</span> {rectalCancer.stomaDetails.stomaLocation}
              </p>
            )}
            {rectalCancer?.stomaDetails?.coveringStoma && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Covering Stoma:</span> {rectalCancer.stomaDetails.coveringStoma}
              </p>
            )}
          </div>
        )}
        
        {/* Specimen Handling */}
        {(rectalCancer?.specimenHandling?.specimenOrientation || rectalCancer?.specimenHandling?.sentToHistology) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Specimen Handling</h5>
            {rectalCancer?.specimenHandling?.specimenOrientation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Specimen Orientation:</span> {rectalCancer.specimenHandling.specimenOrientation}
              </p>
            )}
            {rectalCancer?.specimenHandling?.specimenLabelling && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Specimen Labelling:</span> {rectalCancer.specimenHandling.specimenLabelling}
              </p>
            )}
            {rectalCancer?.specimenHandling?.sentToHistology && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Sent to Histology:</span> {rectalCancer.specimenHandling.sentToHistology}
              </p>
            )}
            {rectalCancer?.specimenHandling?.resectionMarginsMarked && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Resection Margins Marked:</span> {rectalCancer.specimenHandling.resectionMarginsMarked}
              </p>
            )}
            {rectalCancer?.specimenHandling?.inkColorUsed && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Ink Color Used:</span> {rectalCancer.specimenHandling.inkColorUsed}
              </p>
            )}
            {rectalCancer?.specimenHandling?.lymphNodesRetrieved && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Lymph Nodes Retrieved:</span> {rectalCancer.specimenHandling.lymphNodesRetrieved}
              </p>
            )}
          </div>
        )}
        
        {/* Postoperative Plan */}
        {(rectalCancer?.postoperativePlan?.destination || rectalCancer?.postoperativePlan?.analgesiaType) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Postoperative Plan</h5>
            {rectalCancer?.postoperativePlan?.destination && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Destination:</span> {rectalCancer.postoperativePlan.destination}
              </p>
            )}
            {rectalCancer?.postoperativePlan?.analgesiaType && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Analgesia:</span> {rectalCancer.postoperativePlan.analgesiaType}
              </p>
            )}
            {rectalCancer?.postoperativePlan?.antibiotics && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Antibiotics:</span> {rectalCancer.postoperativePlan.antibiotics}
              </p>
            )}
            {rectalCancer?.postoperativePlan?.followUpPlan && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Follow-up Plan:</span> {rectalCancer.postoperativePlan.followUpPlan}
              </p>
            )}
            {rectalCancer?.postoperativePlan?.intraopComplications && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Intraoperative Complications:</span> {rectalCancer.postoperativePlan.intraopComplications}
              </p>
            )}
            {shouldShowSection('complicationDetails') && rectalCancer?.postoperativePlan?.complicationDetails && (
              <p className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Complication Details:</span> {rectalCancer.postoperativePlan.complicationDetails}
              </p>
            )}
            {shouldShowSection('complicationDetails') && rectalCancer?.postoperativePlan?.clavienDindoGrade && (
              <p className="text-xs text-gray-700 ml-4">
                <span className="font-medium">Clavien-Dindo Grade:</span> {rectalCancer.postoperativePlan.clavienDindoGrade}
              </p>
            )}
          </div>
        )}
        
        {/* Legacy Section 2 - Surgical Approach */}
        {rectalCancer?.section2 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Approach (Additional)</h5>
            {rectalCancer.section2.approach?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Approaches:</span> {rectalCancer.section2.approach.join(', ')}
              </p>
            )}
            {rectalCancer.section2.approachOther && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Other Approach:</span> {rectalCancer.section2.approachOther}
              </p>
            )}
            {rectalCancer.section2.conversionReason?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Conversion Reasons:</span> {rectalCancer.section2.conversionReason.join(', ')}
              </p>
            )}
            {rectalCancer.section2.conversionOther && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Other Conversion Reason:</span> {rectalCancer.section2.conversionOther}
              </p>
            )}
          </div>
        )}
        
        {/* Legacy Section 3 - Mobilization and Resection */}
        {rectalCancer?.section3 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Mobilization and Resection Details</h5>
            {rectalCancer.section3.vesselLigation?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Vessel Ligation:</span> {rectalCancer.section3.vesselLigation.join(', ')}
              </p>
            )}
            {rectalCancer.section3.nervePreservation?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Nerve Preservation:</span> {rectalCancer.section3.nervePreservation.join(', ')}
              </p>
            )}
            {rectalCancer.section3.resectionType?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Resection Types:</span> {rectalCancer.section3.resectionType.join(', ')}
              </p>
            )}
            {rectalCancer.section3.resectionOther && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Other Resection:</span> {rectalCancer.section3.resectionOther}
              </p>
            )}
          </div>
        )}
        
        {/* Legacy Section 4 - Reconstruction */}
        {rectalCancer?.section4 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Reconstruction Details</h5>
            {rectalCancer.section4.reconstructionType && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Reconstruction Type:</span> {rectalCancer.section4.reconstructionType}
              </p>
            )}
            {rectalCancer.section4.anastomosisMethod?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Anastomosis Method:</span> {rectalCancer.section4.anastomosisMethod.join(', ')}
              </p>
            )}
            {rectalCancer.section4.leakTest && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Leak Test:</span> {rectalCancer.section4.leakTest}
              </p>
            )}
            {rectalCancer.section4.protectiveStoma && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Protective Stoma:</span> {rectalCancer.section4.protectiveStoma}
              </p>
            )}
            {rectalCancer.section4.stomaLocation && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Stoma Location:</span> {rectalCancer.section4.stomaLocation}
              </p>
            )}
          </div>
        )}
        
        {/* Legacy Section 5 - Closure */}
        {rectalCancer?.section5 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Closure Details</h5>
            {rectalCancer.section5.abdominalClosure?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Abdominal Closure:</span> {rectalCancer.section5.abdominalClosure.join(', ')}
              </p>
            )}
            {rectalCancer.section5.drainageTube && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Drainage Tube:</span> {rectalCancer.section5.drainageTube}
              </p>
            )}
            {rectalCancer.section5.skinClosure?.length > 0 && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Skin Closure:</span> {rectalCancer.section5.skinClosure.join(', ')}
              </p>
            )}
            {rectalCancer.section5.woundDressing && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Wound Dressing:</span> {rectalCancer.section5.woundDressing}
              </p>
            )}
          </div>
        )}
        
        {/* Procedure Findings - Surgical Markings */}
        {rectalCancer?.procedureFindings && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Surgical Diagram & Markings</h5>
            {rectalCancer.procedureFindings.findings && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgical Markings:</span> Documented on anatomical diagram
              </p>
            )}
            {rectalCancer.procedureFindings.additionalNotes && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Notes:</span> {rectalCancer.procedureFindings.additionalNotes}
              </p>
            )}
          </div>
        )}
        
        {/* Surgeon Signature */}
        {(rectalCancer?.additionalInfo?.surgeonSignatureText || rectalCancer?.additionalInfo?.surgeonSignature || rectalCancer?.additionalInfo?.dateTime) && (
          <div className="space-y-2 mt-6 pt-4 border-t">
            <h5 className="text-xs font-medium text-gray-600">Documentation</h5>
            {rectalCancer.additionalInfo.surgeonSignatureText && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Surgeon's Signature:</span> {rectalCancer.additionalInfo.surgeonSignatureText}
              </p>
            )}
            {!rectalCancer.additionalInfo.surgeonSignatureText && rectalCancer.additionalInfo.surgeonSignature && (
              <div className="space-y-1">
                <p className="text-xs text-gray-700 font-medium">Surgeon's Signature:</p>
                {rectalCancer.additionalInfo.surgeonSignature.startsWith('data:image') ? (
                  <img 
                    src={rectalCancer.additionalInfo.surgeonSignature} 
                    alt="Surgeon signature" 
                    className="max-h-8 max-w-32 object-contain border rounded bg-gray-50"
                  />
                ) : (
                  <p className="text-xs text-gray-700">{rectalCancer.additionalInfo.surgeonSignature}</p>
                )}
              </div>
            )}
            {rectalCancer.additionalInfo.dateTime && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">Date & Time:</span> {formatDateOnly(rectalCancer.additionalInfo.dateTime)}
              </p>
            )}
          </div>
        )}
        
        {/* Auto-Generated Summary */}
        <div className="space-y-2 mt-6 pt-4 border-t">
          <h5 className="text-xs font-medium text-gray-600">Synoptic Operative Summary</h5>
          <div className="text-xs text-gray-700 leading-relaxed">
            {generateSynopticSummary()}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t pt-4 mt-6 text-center text-xs space-y-1">
          <p>Dr. Monde Mjoli - Specialist Surgeon</p>
          <p>Practice Number: 0560812</p>
          <p>Report Date: {formatReportDate(new Date())} | Page 1 of 1</p>
        </div>
        {/* Legacy Support - Display old section1 data if no new structure */}
        {!rectalCancer?.caseIdentification && !rectalCancer?.preoperativeDetails && rectalCancer?.section1 && (
          <>
            {/* Legacy Surgical Team */}
            {(rectalCancer.section1.surgeons?.some(s => s?.trim()) || rectalCancer.section1.assistant1 || rectalCancer.section1.anaesthetist) && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-600">Surgical Team</h5>
                {rectalCancer.section1.surgeons?.some(s => s?.trim()) && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Surgeon:</span> {rectalCancer.section1.surgeons.filter(s => s?.trim()).join(', ')}
                  </p>
                )}
                {rectalCancer.section1.assistant1 && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Assistant 1:</span> {rectalCancer.section1.assistant1}
                  </p>
                )}
                {rectalCancer.section1.assistant2 && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Assistant 2:</span> {rectalCancer.section1.assistant2}
                  </p>
                )}
                {rectalCancer.section1.anaesthetist && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Anaesthetist:</span> {rectalCancer.section1.anaesthetist}
                  </p>
                )}
              </div>
            )}
            
            {/* Legacy Preoperative Information */}
            {(rectalCancer.section1.indication?.length > 0 || rectalCancer.section1.asaScore || rectalCancer.section1.emergencyOperation) && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-600">Preoperative Information</h5>
                {rectalCancer.section1.indication?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs font-medium text-gray-600">Indication:</span>
                    {rectalCancer.section1.indication.map((indication, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {indication === 'Other' && rectalCancer.section1.indicationOther 
                          ? `Other: ${rectalCancer.section1.indicationOther}` 
                          : indication}
                      </Badge>
                    ))}
                  </div>
                )}
                {rectalCancer.section1.asaScore && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">ASA Score:</span> {getFullASAText(rectalCancer.section1.asaScore)}
                  </p>
                )}
                {rectalCancer.section1.emergencyOperation && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Emergency Operation:</span> {rectalCancer.section1.emergencyOperation}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Separator />
    </>
  );
};
