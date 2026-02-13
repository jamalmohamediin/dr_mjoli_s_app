// Mappings for the new rectal cancer data structure to PDF sections

export const mapNewStructureToOld = (rectalCancerData: any) => {
  const primaryApproachRaw = rectalCancerData.surgicalApproach?.primaryApproach;
  const primaryApproachList = Array.isArray(primaryApproachRaw) 
    ? primaryApproachRaw 
    : primaryApproachRaw 
      ? [primaryApproachRaw] 
      : [];
  const primaryApproachText = primaryApproachList.join(', ');
  const isConvertedApproach = primaryApproachList.includes('Laparoscopic Converted To Open');

  return {
    ...rectalCancerData,
    // Map surgical team data
    caseIdentification: {
      ...rectalCancerData.caseIdentification,
      surgeon: rectalCancerData.surgicalTeam?.surgeons?.[0] || rectalCancerData.caseIdentification?.surgeon,
      assistant: rectalCancerData.surgicalTeam?.assistants?.[0] || rectalCancerData.caseIdentification?.assistant,
      date: rectalCancerData.additionalInfo?.dateTime || rectalCancerData.caseIdentification?.date
    },
    
    // Map preoperative details
    preoperativeDetails: {
      ...rectalCancerData.preoperativeDetails,
      indication: rectalCancerData.operationType?.type || rectalCancerData.preoperativeDetails?.indication,
      tumorLocation: rectalCancerData.findings?.location?.map(loc => {
        // Map new location names to old format if needed
        if (loc === 'Upper Third') return 'High';
        if (loc === 'Middle Third') return 'Middle';
        if (loc === 'Lower Third') return 'Low';
        return loc;
      }).join(', ') || rectalCancerData.preoperativeDetails?.tumorLocation,
      preoperativeStaging: {
        tStage: rectalCancerData.findings?.tClassification || rectalCancerData.preoperativeDetails?.preoperativeStaging?.tStage,
        nStage: rectalCancerData.findings?.nClassification || rectalCancerData.preoperativeDetails?.preoperativeStaging?.nStage,
        mStage: rectalCancerData.findings?.mClassification || rectalCancerData.preoperativeDetails?.preoperativeStaging?.mStage
      },
      neoadjuvantTherapy: rectalCancerData.operationType?.neoadjuvantTreatment || rectalCancerData.preoperativeDetails?.neoadjuvantTherapy,
      radiationDetails: rectalCancerData.operationType?.radiationDetails || rectalCancerData.preoperativeDetails?.radiationDetails,
      chemotherapyRegimen: rectalCancerData.operationType?.chemotherapyRegimen || rectalCancerData.preoperativeDetails?.chemotherapyRegimen
    },
    
    // Map surgical approach
    surgicalApproach: {
      ...rectalCancerData.surgicalApproach,
      approach: primaryApproachText || rectalCancerData.surgicalApproach?.approach,
      conversionToOpen: isConvertedApproach ? 'Yes' : 'No',
      conversionReason: rectalCancerData.surgicalApproach?.conversionReason || [],
      conversionReasonOther: rectalCancerData.surgicalApproach?.conversionReasonOther,
      resectionType: rectalCancerData.operationType?.rectumOperationType?.join(', ') || rectalCancerData.surgicalApproach?.resectionType
    },
    
    // Map intraoperative findings
    intraoperativeFindings: {
      ...rectalCancerData.intraoperativeFindings,
      tumorSite: rectalCancerData.findings?.description || rectalCancerData.intraoperativeFindings?.tumorSite,
      fixation: rectalCancerData.intraoperativeFindings?.fixation || (rectalCancerData.findings?.description?.includes('fixed') ? 'Fixed' : 'Mobile'),
      invasionToAdjacentOrgans: rectalCancerData.mobilizationAndResection?.enBlocResection?.length > 0 ? 'Yes' : 'No',
      adjacentOrgansInvolved: rectalCancerData.mobilizationAndResection?.enBlocResection || rectalCancerData.intraoperativeFindings?.adjacentOrgansInvolved
    },
    
    // Map resection details
    resectionDetails: {
      ...rectalCancerData.resectionDetails,
      vesselLigation: rectalCancerData.mobilizationAndResection?.vesselLigation?.join(', ') || rectalCancerData.resectionDetails?.vesselLigation,
      mesorectalExcisionCompleteness: rectalCancerData.findings?.mesorectalCompleteness || rectalCancerData.resectionDetails?.mesorectalExcisionCompleteness,
      enBlocResection: rectalCancerData.mobilizationAndResection?.enBlocResection?.length > 0 ? 'Yes' : 'No',
      enBlocOrgans: rectalCancerData.mobilizationAndResection?.enBlocResection || rectalCancerData.resectionDetails?.enBlocOrgans,
      anastomosisPerformed: rectalCancerData.reconstruction?.reconstructionType === 'ANASTOMOSIS' ? 'Yes' : 'No',
      anastomosisMethod: rectalCancerData.reconstruction?.anastomosisDetails?.technique || rectalCancerData.resectionDetails?.anastomosisMethod,
      anastomosisLevel: rectalCancerData.reconstruction?.anastomosisDetails?.configuration || rectalCancerData.resectionDetails?.anastomosisLevel,
      leakTestPerformed: rectalCancerData.reconstruction?.anastomosisDetails?.airLeakTest !== 'Not Done' ? 'Yes' : 'No',
      leakTestResult: rectalCancerData.reconstruction?.anastomosisDetails?.airLeakTest || rectalCancerData.resectionDetails?.leakTestResult,
      endStomaCreated: rectalCancerData.reconstruction?.reconstructionType === 'STOMA' ? 'Yes' : 'No'
    },
    
    // Map stoma details
    stomaDetails: {
      ...rectalCancerData.stomaDetails,
      stomaType: rectalCancerData.reconstruction?.stomaDetails?.configuration || rectalCancerData.stomaDetails?.stomaType,
      stomaLocation: rectalCancerData.reconstruction?.stomaDetails?.reasonForStoma?.join(', ') || rectalCancerData.stomaDetails?.stomaLocation,
      coveringStoma: rectalCancerData.reconstruction?.anastomoticTesting?.icgTest || rectalCancerData.stomaDetails?.coveringStoma
    },
    
    // Map postoperative plan
    postoperativePlan: {
      ...rectalCancerData.postoperativePlan,
      destination: rectalCancerData.postoperativePlan?.destination || 'Ward',
      analgesiaType: rectalCancerData.postoperativePlan?.analgesiaType || 'Standard',
      antibiotics: rectalCancerData.postoperativePlan?.antibiotics || 'Prophylactic',
      followUpPlan: rectalCancerData.additionalInfo?.postOperativeManagement || rectalCancerData.postoperativePlan?.followUpPlan,
      intraopComplications: rectalCancerData.operativeEvents?.intraoperativeEvents?.includes('None') ? 'No' : 'Yes',
      complicationDetails: rectalCancerData.operativeEvents?.intraoperativeEventsOther || rectalCancerData.postoperativePlan?.complicationDetails
    }
  };
};
