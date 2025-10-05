import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateOnly, formatDateWithSuffix, formatReportDate } from "@/utils/dateFormatter";
import { getFullASAText } from '@/utils/asaDescriptions';

interface RectalCancerReportPreviewProps {
  report: {
    patientInfo?: {
      name?: string;
      patientId?: string;
      dateOfBirth?: string;
      age?: string;
      sex?: string;
      weight?: string;
      height?: string;
      bmi?: string;
      asaScore?: string;
    };
    rectalCancer?: {
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
    let summary = [];
    
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
        const therapyDetails = [];
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
    const metastases = [];
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
    const margins = [];
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
      const specimenDetails = [];
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
    rectalCancer?.caseIdentification?.surgeon ||
    rectalCancer?.preoperativeDetails?.indication?.length > 0 ||
    rectalCancer?.surgicalApproach?.approach ||
    rectalCancer?.intraoperativeFindings?.tumorSite ||
    rectalCancer?.resectionDetails?.vesselLigation ||
    rectalCancer?.specimenHandling?.sentToHistology ||
    // Legacy fields check
    rectalCancer?.section1?.surgeons?.some(s => s?.trim()) ||
    rectalCancer?.section1?.indication?.length > 0
  );

  if (!hasData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Start filling out the rectal cancer surgery form to see findings appear here.</p>
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
              <h4 className="text-sm font-bold">RECTAL CANCER SURGERY REPORT</h4>
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
        
        {/* Case Identification Section */}
        {(report.patientInfo?.name || rectalCancer?.caseIdentification?.surgeon || rectalCancer?.caseIdentification?.procedureType) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Case Identification</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {report.patientInfo?.name && (
                <div><span className="font-medium">Patient:</span> {report.patientInfo.name}</div>
              )}
              {report.patientInfo?.patientId && (
                <div><span className="font-medium">Patient ID:</span> {report.patientInfo.patientId}</div>
              )}
              {rectalCancer?.caseIdentification?.date && (
                <div><span className="font-medium">Date:</span> {formatDateOnly(rectalCancer.caseIdentification.date)}</div>
              )}
              {rectalCancer?.caseIdentification?.surgeon && (
                <div><span className="font-medium">Surgeon:</span> {rectalCancer.caseIdentification.surgeon}</div>
              )}
              {rectalCancer?.caseIdentification?.assistant && (
                <div><span className="font-medium">Assistant:</span> {rectalCancer.caseIdentification.assistant}</div>
              )}
            </div>
          </div>
        )}
        
        {/* Patient Demographics */}
        {(report.patientInfo?.dateOfBirth || report.patientInfo?.age || report.patientInfo?.sex || report.patientInfo?.weight || report.patientInfo?.asaScore) && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Patient Demographics</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              {report.patientInfo?.dateOfBirth && (
                <div><span className="font-medium">Date Of Birth:</span> {formatDateOnly(report.patientInfo.dateOfBirth)}</div>
              )}
              {report.patientInfo?.age && (
                <div><span className="font-medium">Age:</span> {report.patientInfo.age}</div>
              )}
              {report.patientInfo?.sex && (
                <div><span className="font-medium">Sex:</span> {report.patientInfo.sex.charAt(0).toUpperCase() + report.patientInfo.sex.slice(1).toLowerCase()}</div>
              )}
              {report.patientInfo?.weight && (
                <div><span className="font-medium">Weight:</span> {report.patientInfo.weight} kg</div>
              )}
              {report.patientInfo?.height && (
                <div><span className="font-medium">Height:</span> {report.patientInfo.height} cm</div>
              )}
              {report.patientInfo?.bmi && (
                <div><span className="font-medium">BMI:</span> {report.patientInfo.bmi}</div>
              )}
              {report.patientInfo?.asaScore && (
                <div className="col-span-2"><span className="font-medium">ASA Score:</span> {getFullASAText(report.patientInfo.asaScore)}</div>
              )}
            </div>
            {report.patientInfo?.asaNotes && (
              <div className="text-xs text-gray-700 mt-2">
                <span className="font-medium">ASA Notes:</span> {report.patientInfo.asaNotes}
              </div>
            )}
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
        
        {/* Surgical Approach Section */}
        {(rectalCancer?.surgicalApproach?.approach || rectalCancer?.surgicalApproach?.resectionType) && (
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
                <span className="font-medium">Additional Notes:</span> {rectalCancer.procedureFindings.additionalNotes}
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