import { createInitialPatientInfoState } from "@/utils/patientSticker";
import { createDefaultClinicianList, DEFAULT_CLINICIAN_NAME } from "@/utils/clinicianDefaults";

export const initialTransanalMinimallyInvasiveSurgeryState = {
  patientInfo: createInitialPatientInfoState(),
  preoperative: {
    surgeons: createDefaultClinicianList(),
    assistants: [""],
    anaesthetists: [""],
    diagnosis: [] as string[],
    diagnosisOther: "",
    imaging: [] as string[],
    imagingOther: "",
    cT: "",
    cN: "",
    urgency: "",
    startTime: "",
    endTime: "",
    duration: "",
  },
  operativeFindings: {
    findings: "",
    locationInRectum: [] as string[],
    morphology: [] as string[],
    morphologyOther: "",
    distanceFromAnalVerge: "",
    lesionSizeLength: "",
    lesionSizeWidth: "",
    circumferentialInvolvement: "",
  },
  procedure: {
    equipmentUsed: [] as string[],
    equipmentOther: "",
    insufflationPressure: "",
    purseStringInserted: "",
    lesionPeripheralMarginMarked: "",
    plannedMargin: "",
    depthOfExcision: [] as string[],
    depthOfExcisionOther: "",
    deviceUsed: [] as string[],
    deviceOther: "",
    haemostasis: [] as string[],
    haemostasisOther: "",
    defectManagement: [] as string[],
    closureDirection: [] as string[],
    closureTechnique: [] as string[],
    sutureMaterial: [] as string[],
    sutureMaterialOther: "",
  },
  operativeEvents: {
    difficulties: [] as string[],
    difficultiesOther: "",
    complications: [] as string[],
    complicationsOther: "",
  },
  specimen: {
    specimenRetrieved: "",
    laboratorySentTo: "",
    orientationMarked: "",
  },
  additionalInfo: {
    additionalInformation: "",
    postOperativeManagement: "",
    doctorSignature: DEFAULT_CLINICIAN_NAME,
    surgeonSignature: "",
    dateTime: "",
  },
  procedureFindings: {
    findings: "",
    additionalNotes: "",
  },
};

export const createInitialTransanalMinimallyInvasiveSurgeryState = () =>
  JSON.parse(JSON.stringify(initialTransanalMinimallyInvasiveSurgeryState));
