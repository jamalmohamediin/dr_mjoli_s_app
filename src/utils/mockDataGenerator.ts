import { createInitialPatientInfoState } from "./patientSticker";
import { createInitialCholecystectomyState } from "./cholecystectomy";
import { createInitialGastroscopyState } from "./gastroscopy";
import { createInitialColonoscopyState } from "./colonoscopy";
import { createInitialInguinalHerniaState } from "./inguinalHernia";
import { createInitialTransanalMinimallyInvasiveSurgeryState } from "./transanalMinimallyInvasiveSurgery";
import { createInitialNarrativeSurgeryState } from "./narrativeSurgery";

export const mockPatientInfo = {
  firstName: "John",
  lastName: "Doe",
  gender: "Male",
  dob: "1980-05-15",
  age: "43",
  patientId: "PT12345",
  contactNumber: "0123456789",
  address: "123 Medical Drive, Health City",
  hospitalName: "General Hospital",
  ward: "Surgical Ward A",
};

const commonPreoperative = {
  surgeons: ["Dr. Smith", "Dr. Jones"],
  assistants: ["Nurse Thompson"],
  anaesthetists: ["Dr. Brown"],
  startTime: "09:00",
  endTime: "10:30",
  duration: "90",
  urgency: "Elective",
  imaging: ["CT scan", "Ultrasound"],
};

export const generateMockCholecystectomy = () => {
  const state = createInitialCholecystectomyState();
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { ...state.preoperative, ...commonPreoperative, indication: ["Gallstones", "Chronic cholecystitis"] };
  state.intraoperative = {
    gallbladderAppearance: ["Inflamed", "Thickened wall"],
    stonesPresent: "Yes",
    typeOfStones: "Multiple mixed stones",
    sizeOfStones: "5-10mm",
  };
  state.procedure = {
    ...state.procedure,
    approach: ["Laparoscopic"],
    numberOfPortsInserted: "4",
    criticalViewSafetyConfirmation: ["Confirmed"],
    calotsTriangleDissected: "Yes",
    cysticDuctIdentified: "Yes",
    cysticArteryIdentified: "Yes",
    twoStructuresConfirmed: "Yes",
    cysticDuctControl: ["Clipped"],
    cysticArteryControl: ["Clipped"],
    gallbladderDissectedFromLiverBed: ["Complete"],
    hemostasis: ["Achieved"],
  };
  state.closure = {
    ...state.closure,
    fascialClosure: "Yes",
    skinClosure: "Yes",
    skinClosureMethod: ["Sutures"],
    gallbladderSentForHistology: "Yes",
  };
  state.additionalInfo = {
    ...state.additionalInfo,
    doctorName: "Dr. Smith",
    dateTime: new Date().toISOString(),
  };
  return state;
};

export const generateMockGastroscopy = () => {
  const state = createInitialGastroscopyState();
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { 
    ...state.preoperative, 
    endoscopists: ["Dr. Smith"],
    indications: ["Dyspepsia", "Reflux"],
    sedationTypes: ["Propofol"],
    medications: { midazolamDose: "2mg", fentanylDose: "50mcg", propofolDose: "100mg", otherMedication: "" }
  };
  state.oesophagus = { ...state.oesophagus, findings: ["Normal"] };
  state.stomach = { ...state.stomach, findings: ["Gastritis"], gastritisType: ["Antral"], gastritisSeverity: "Mild" };
  state.duodenum = { ...state.duodenum, findings: ["Normal"] };
  state.diagnosis = { diagnoses: ["Mild Antral Gastritis"] };
  return state;
};

export const generateMockColonoscopy = () => {
  const state = createInitialColonoscopyState();
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { 
    ...state.preoperative, 
    endoscopists: ["Dr. Smith"],
    indications: ["Colorectal Cancer Screening"],
    startTime: "10:00",
    endTime: "10:45",
    duration: "45",
  };
  state.bowelPreparation = { 
    prepType: ["Moviprep"],
    overallAssessment: "Excellent",
    bbpsRightColon: "3",
    bbpsTransverseColon: "3",
    bbpsLeftColon: "3",
    totalBbps: "9"
  };
  state.procedureDetails = {
    ...state.procedureDetails,
    depthOfExamination: ["Caecum REACHED"],
    caecalLandmarks: ["Appendiceal orifice", "Ileocaecal valve"],
  };
  state.findingsSummary = { findings: ["Normal"] };
  state.diagnosis = { diagnoses: ["Normal Colonoscopy"] };
  return state;
};

export const generateMockInguinalHernia = () => {
  const state = createInitialInguinalHerniaState();
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { ...state.preoperative, indication: ["Symptomatic Inguinal Hernia"], urgency: "Elective" };
  state.operativeFindings = {
    type: ["Indirect"],
    side: "Right",
    sizeOfDefect: "2cm",
    contents: ["Omentum"],
    posteriorWall: "Intact",
  };
  state.procedure = {
    ...state.procedure,
    approach: "Laparoscopic (TAPP)",
    technique: ["Mesh Repair"],
    meshInserted: "Yes",
    meshSizeLength: "15cm",
    meshSizeWidth: "10cm",
    fixation: ["Tacks"],
  };
  return state;
};

export const generateMockTAMIS = () => {
  const state = createInitialTransanalMinimallyInvasiveSurgeryState();
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { ...state.preoperative, ...commonPreoperative, diagnosis: ["Rectal Polyp"] };
  state.operativeFindings = {
    findings: "2cm sessile polyp in mid-rectum",
    locationInRectum: ["Posterior"],
    morphology: ["Sessile"],
    distanceFromAnalVerge: "8cm",
    lesionSizeLength: "2cm",
    lesionSizeWidth: "2cm",
  };
  state.procedure = {
    ...state.procedure,
    equipmentUsed: ["GelPoint Path"],
    insufflationPressure: "15",
    depthOfExcision: ["Full thickness"],
    haemostasis: ["Diathermy"],
    defectManagement: ["Sutured primary closure"],
  };
  return state;
};

export const generateMockOpenAbdominal = () => {
  const state = createInitialNarrativeSurgeryState("abdominal");
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { ...state.preoperative, ...commonPreoperative, urgency: "Emergency" };
  state.access = { approach: "Open", reasonForConversion: [] };
  state.narrative = {
    ...state.narrative,
    operationDone: "Exploratory Laparotomy",
    operativeFindings: "Small bowel obstruction due to adhesions",
    operationDetails: "Midline incision, adhesiolysis performed, visual inspection of bowel showed viability.",
    specimensTaken: ["None"],
    pointsOfDifficulty: ["Dense adhesions"],
    postOperativeManagement: "IV fluids, pain management, monitor bowel sounds.",
  };
  return state;
};

export const generateMockOpenGeneral = () => {
  const state = createInitialNarrativeSurgeryState("general");
  state.patientInfo = { ...state.patientInfo, ...mockPatientInfo };
  state.preoperative = { ...state.preoperative, ...commonPreoperative, urgency: "Elective" };
  state.narrative = {
    ...state.narrative,
    operationDone: "Excision of Lipoma",
    operativeFindings: "3cm subcutanous mass, soft, encapsulated.",
    operationDetails: "Ellipse incision, blunt dissection, complete excision of mass.",
    specimensTaken: "Lipoma specimen",
    pointsOfDifficulty: "None",
    postOperativeManagement: "Simple dressing, follow up for histology.",
  };
  return state;
};

export const generateInguinalHerniaMockData = generateMockInguinalHernia;
export const generateGastroscopyMockData = generateMockGastroscopy;
export const generateColonoscopyMockData = generateMockColonoscopy;
export const generateCholecystectomyMockData = generateMockCholecystectomy;
export const generateTAMISMockData = generateMockTAMIS;
export const generateOpenAbdominalMockData = generateMockOpenAbdominal;
export const generateOpenGeneralMockData = generateMockOpenGeneral;
