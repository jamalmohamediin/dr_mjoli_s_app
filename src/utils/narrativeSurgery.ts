import { createInitialPatientInfoState } from "@/utils/patientSticker";
import { createDefaultClinicianList, DEFAULT_CLINICIAN_NAME } from "@/utils/clinicianDefaults";

export const createInitialNarrativeSurgeryState = (variant: "general" | "abdominal") => ({
  patientInfo: createInitialPatientInfoState(),
  preoperative: {
    surgeons: createDefaultClinicianList(),
    assistants: [""],
    anaesthetists: [""],
    imaging: [] as string[],
    imagingOther: "",
    urgency: "",
    startTime: "",
    endTime: "",
    duration: "",
  },
  access: {
    approach: "",
    reasonForConversion: [] as string[],
    reasonForConversionOther: "",
  },
  narrative: {
    operationDone: "",
    operativeFindings: "",
    operationDetails: "",
    specimensTaken: variant === "abdominal" ? [] : "",
    specimensTakenOther: "",
    pointsOfDifficulty: variant === "abdominal" ? [] : "",
    pointsOfDifficultyOther: "",
    intraoperativeComplications: variant === "abdominal" ? [] : "",
    intraoperativeComplicationsOther: "",
    postOperativeManagement: "",
  },
  additionalInfo: {
    doctorName: DEFAULT_CLINICIAN_NAME,
    surgeonSignature: "",
    dateTime: "",
  },
  procedureFindings: {
    findings: "",
    additionalNotes: "",
  },
});
