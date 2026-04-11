import { createInitialPatientInfoState } from "@/utils/patientSticker";

export const createInitialNarrativeSurgeryState = (variant: "general" | "abdominal") => ({
  patientInfo: createInitialPatientInfoState(),
  preoperative: {
    surgeons: [""],
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
    doctorName: "",
    surgeonSignature: "",
    dateTime: "",
  },
  procedureFindings: {
    findings: "",
    additionalNotes: "",
  },
});
